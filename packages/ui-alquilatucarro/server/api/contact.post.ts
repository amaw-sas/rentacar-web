import { defineEventHandler, readBody, createError, getRequestIP, getRequestHeader } from 'h3'
import { validateAndCompose, MAX_MESSAGE_LEN, type ContactFormPayload } from '../utils/contact-forms'
import { logger } from '../utils/logger'
// Ruta relativa y no `~/utils/policy`: en las pruebas de esta marca `~` apunta a la
// raíz del paquete (vitest.config.ts), no a app/, y el alias no resolvería.
import { POLICY_VERSION, OPINION_CONSENT_TEXT } from '../../app/utils/policy'

/**
 * Recepción de los formularios públicos y envío por correo al buzón del
 * operador. En alquilatucarro hoy sólo lo usan las calificaciones bajas de
 * /opinion, que se radican en el tablero y no mandan correo (ver «Radicación de
 * la calificación» abajo); el resto de tipos que valida `contact-forms.ts` (quejas, flota,
 * referidos) existen porque el archivo comparte la forma con el de alquilame salvo
 * los campos de PQRS, y las dos copias deben poder moverse juntas.
 *
 * Se usa la API REST de Resend con `fetch` en vez del SDK: es una sola llamada
 * HTTP y así no se suma una dependencia al bundle del servidor.
 *
 * Fail-loud hacia LOS LOGS, no hacia el visitante: si falta RESEND_API_KEY el
 * endpoint devuelve 500 y deja el detalle en el log del servidor. Un formulario
 * que "parece" enviar pero se traga los mensajes es peor que uno que falla
 * visiblemente — el operador perdería clientes sin enterarse.
 *
 * Excepción, las calificaciones bajas (`resenas`): no mandan correo. Se radican en el
 * tablero, que es su único destino (SCEN-12501, 20-oct-2026), y no dependen de la
 * configuración de Resend.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000

/**
 * Lo que ve el visitante cuando el fallo es nuestro. Los nombres de las
 * variables de entorno se quedan en el log: el formulario los pintaba tal cual
 * en pantalla, y el precedente de /reservado (503 en producción por un env var
 * ausente) dice que ese día llega.
 */
const GENERIC_FAILURE = 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.'

/**
 * Tope por IP. Una persona manda una queja, o dos si la primera falló; diez deja
 * margen de sobra para varios clientes detrás de la misma salida del operador
 * —que en Colombia son muchísimos— y aun así obliga a cientos de direcciones
 * distintas para hacer daño de verdad.
 */
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_S = 3600

/**
 * La clave del contador va con prefijo porque `rate_limit_counters` NO tiene
 * columna de ámbito: sin él, las 100 llamadas/hora del API del blog se comerían
 * el cupo del formulario y al revés.
 *
 * No es un invento: es la convención que ya usa esa tabla. El dashboard escribe
 * ahí claves `resv:doc:<cédula>` y `resv:ip:<ip>` para el guardián de reservas
 * (rentacar-dashboard, lib/api/reservation-service.ts:405-411). `contacto:` es
 * la tercera familia.
 *
 * Se reutiliza `checkBlogRateLimit` aunque el nombre diga «blog»: por dentro es
 * un contador genérico por clave y ventana (RPC `check_blog_rate_limit`,
 * SECURITY DEFINER, UPSERT sobre esa tabla) y no valida que la clave sea una IP
 * — de hecho las claves `resv:` tampoco lo son. Renombrarlo exigiría una
 * migración en el otro repo y no cambiaría nada de comportamiento.
 */
const RATE_LIMIT_SCOPE = 'contacto'

const RATE_LIMITED = 'Recibimos varios mensajes tuyos hace poco. Espera un momento y vuelve a intentarlo.'

/**
 * Corte antes de leer el cuerpo. Los topes por campo dejan lo legítimo muy por
 * debajo de esto; el objetivo aquí es no meter megabytes en memoria sólo para
 * descubrir después que sobran.
 */
const MAX_BODY_BYTES = 16 * 1024

/**
 * Calificaciones bajas de /opinion: se radican en el tablero (`POST /api/web-ratings`)
 * con la misma clave del canal PQRS.
 *
 * 6 s y no los 10 de Resend: el navegador se rinde a los 20 (PublicContactForm.vue), y
 * 10 + 10 haría que un éxito lento se viera como fallo e invitara a reenviar. No hay
 * llave de idempotencia; ese duplicado se acepta como riesgo (diseño §6).
 */
const WEB_RATING_TIMEOUT_MS = 6_000

/**
 * «2 de 5» → 2. Solo de 1 a 3: la página manda 4 y 5 a Google, y un 4 o un 5 aquí lo
 * contaría el contador del tablero mientras todos sus filtros lo esconden.
 */
const RATING_PATTERN = /^([1-3]) de 5$/

function parseRating(estrellas: unknown): number | undefined {
  const match = typeof estrellas === 'string' ? RATING_PATTERN.exec(estrellas.trim()) : null
  return match ? Number(match[1]) : undefined
}

/** El estado HTTP de un error de ofetch; sin respuesta (timeout, red caída) no hay. */
function statusOf(error: unknown): number | undefined {
  const e = error as { status?: number; statusCode?: number; response?: { status?: number } } | null
  return e?.status ?? e?.statusCode ?? e?.response?.status
}

/**
 * Con `redirect: 'error'`, undici rechaza un 3xx sin estado: FetchError «fetch failed»
 * cuya causa dice «unexpected redirect». Se busca en la cadena de causas porque es lo
 * único que lo separa de una red caída.
 */
function isRedirectRejection(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; current && depth < 5; depth++) {
    if (/redirect/i.test(String((current as { message?: unknown }).message ?? ''))) return true
    current = (current as { cause?: unknown }).cause
  }
  return false
}

/**
 * Qué llegó en lugar de `{ id }`, en una línea corta para el log: el tipo y, si es
 * texto, su comienzo. Nunca el cuerpo entero (la página de /login pesa kilobytes) ni
 * los valores de un objeto, solo sus llaves.
 */
function describeReceived(received: unknown): string {
  if (received === undefined || received === null || received === '') return 'vacío'
  if (typeof received === 'string') {
    const start = received.slice(0, 60).replace(/\s+/g, ' ')
    return `texto (${received.length} caracteres): ${start}`
  }
  if (typeof received === 'object') {
    return `objeto con llaves: ${Object.keys(received).slice(0, 10).join(', ') || '(ninguna)'}`.slice(0, 120)
  }
  return typeof received
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey as string | undefined
  const to = config.contactEmailTo as string | undefined
  const from = config.contactEmailFrom as string | undefined

  // 1. Tamaño, antes que nada: es lo único que se puede rechazar sin gastar ni
  //    memoria ni cupo. Un content-length ausente o mentiroso no rompe nada —
  //    los topes por campo siguen detrás.
  const declared = Number(getRequestHeader(event, 'content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Tu mensaje es demasiado largo. Resúmelo un poco e inténtalo de nuevo.',
    })
  }

  const body = await readBody<ContactFormPayload>(event)
  const result = validateAndCompose(body ?? ({} as ContactFormPayload))

  // 2. Spam (honeypot): responder 200 como si nada. Darle un error al bot sólo
  //    le enseña a evadir el filtro. Va ANTES del tope a propósito: un bot
  //    descartado no debe gastarle cupo a nadie ni enterarse de que hay tope.
  if (!result.ok && result.reason === 'spam') return { ok: true }

  // 3. Tope por IP. Fail-open a propósito (`checkBlogRateLimit` ya lo hace y el
  //    catch cubre el resto): perder la queja de un cliente molesto por una
  //    caída de Supabase pesa más que el riesgo de abuso durante esa caída.
  const ip = getRequestIP(event, { xForwardedFor: true }) || getRequestIP(event) || 'desconocida'
  let allowed = true
  try {
    ;({ allowed } = await checkBlogRateLimit(
      `${RATE_LIMIT_SCOPE}:${ip}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_S,
    ))
  } catch (error) {
    logger.error('contact-rate-limit-unavailable', error, { ip })
  }

  if (!allowed) {
    // Log en error y no en warn: si esto aparece, alguien está golpeando el
    // endpoint y hay que poder verlo sin bajar el nivel de log.
    logger.error('contact-rate-limit', new Error('Tope por IP superado'), {
      ip,
      limit: RATE_LIMIT_MAX,
    })
    throw createError({ statusCode: 429, statusMessage: RATE_LIMITED })
  }

  if (!result.ok && result.reason === 'too-long') {
    throw createError({
      statusCode: 400,
      statusMessage: `Hay campos demasiado largos. El mensaje admite hasta ${MAX_MESSAGE_LEN} caracteres.`,
      data: { tooLong: result.tooLong },
    })
  }

  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Faltan campos obligatorios',
      data: { missing: result.missing },
    })
  }

  // ── Radicación de la calificación en el tablero, solo para `resenas` ──
  //
  // Va DESPUÉS de tamaño, honeypot, tope y validación, y ANTES del gate de Resend: una
  // calificación no manda correo, así que una variable de correo ausente no puede
  // impedir radicarla. El tablero es su único destino (SCEN-12501): si falla, el
  // visitante ve el error con lo que escribió intacto; si radica, se responde ahí.
  if (body.type === 'resenas') {
    const rating = parseRating(body.estrellas)
    if (rating === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Faltan campos obligatorios',
        data: { missing: ['estrellas'] },
      })
    }

    // Sin barra final: con ella la llamada sale a `//api/web-ratings`. El `trim` va
    // antes porque un salto de línea pegado al final del valor en Vercel sobrevive al
    // regex, y una URL de puros espacios cuenta como ausente.
    const adminUrl = (config.rentacarAdminUrl as string | undefined)?.trim().replace(/\/+$/, '')
    const pqrsKey = config.pqrsApiKey as string | undefined
    if (!adminUrl || !pqrsKey) {
      // Fail-closed y ruidoso: sin tablero la calificación no tiene adónde ir.
      // `pqrsApiKey` tiene que estar declarada en runtimeConfig o Nuxt ignora la
      // variable de entorno (nuxt.config.ts lo explica junto a `pqrsApiKey`).
      const missing = [
        ...(adminUrl ? [] : ['NUXT_RENTACAR_ADMIN_URL']),
        ...(pqrsKey ? [] : ['NUXT_PQRS_API_KEY']),
      ]
      logger.error(
        'web-rating-config',
        new Error(`Falta configuración para radicar la calificación: ${missing.join(' / ')}`),
        { missing },
      )
      throw createError({ statusCode: 500, statusMessage: GENERIC_FAILURE })
    }

    const clientIp = getRequestIP(event, { xForwardedFor: true })
    // El del visitante: sin reenviarlo, `source_user_agent` del tablero guardaría el de Nitro.
    const userAgent = getRequestHeader(event, 'user-agent') ?? ''
    // Opcionales en el formulario: en blanco viajan como null, no como texto vacío.
    const optionalText = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
    let filed: unknown
    try {
      filed = await $fetch<{ id?: string; received_at?: string }>(`${adminUrl}/api/web-ratings`, {
        method: 'POST',
        timeout: WEB_RATING_TIMEOUT_MS,
        // Una redirección nunca es el tablero respondiendo: el tablero sin la ruta
        // contesta 307 a /login, y seguirla trae el HTML de /login con 200.
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pqrsKey,
          // Vercel sobrescribe x-forwarded-for con la NAT del funnel, que metería a
          // todos los visitantes en el mismo cubo del tope del tablero.
          ...(clientIp ? { 'x-real-client-ip': clientIp } : {}),
          ...(userAgent ? { 'user-agent': userAgent } : {}),
        },
        body: {
          // La marca la pone ESTE servidor, no el navegador: lo que venga en el
          // cuerpo del visitante se ignora.
          franchise: config.public.rentacarFranchise,
          rating,
          customer_name: body.nombre,
          customer_email: body.email,
          customer_phone: optionalText(body.telefono),
          reservation_code: optionalText(body.reserva),
          message: body.mensaje,
          // La frase que la persona leyó bajo el formulario, y la versión de la
          // política que esa frase enlaza.
          consent_text: OPINION_CONSENT_TEXT,
          consent_policy_version: POLICY_VERSION,
          source_path: '/opinion',
        },
      })
    } catch (error) {
      const status = statusOf(error)
      const context = { franchise: config.public.rentacarFranchise, status }
      if (status === 429) {
        logger.error('web-rating-rate-limit', error, {
          ...context,
          retryAfter: (error as { data?: { retry_after?: unknown } })?.data?.retry_after,
        })
        throw createError({ statusCode: 429, statusMessage: RATE_LIMITED })
      }
      if (status === 400) {
        // Los dos contratos se separaron (p. ej. el `isEmail` de la web acepta algo
        // que el zod del tablero rechaza): no es culpa del visitante. Los campos que
        // rechazó van al log; sin ellos la deriva no dice dónde está.
        logger.error('web-rating-contract', error, {
          ...context,
          fields: (error as { data?: { fields?: unknown } })?.data?.fields,
        })
        throw createError({ statusCode: 502, statusMessage: GENERIC_FAILURE })
      }
      if (status === undefined && isRedirectRejection(error)) {
        // Lo que llega cuando el tablero desplegado aún no tiene la ruta.
        logger.error('web-rating-contract', error, { ...context, received: 'redirect' })
        throw createError({ statusCode: 502, statusMessage: GENERIC_FAILURE })
      }
      logger.error('web-rating-file', error, context)
      throw createError({ statusCode: 502, statusMessage: GENERIC_FAILURE })
    }
    // Radicado es `201 { id, received_at }`, no cualquier promesa resuelta: una página
    // de proxy, de mantenimiento o el /login también resuelven con 2xx. Va fuera del
    // try para que el catch no lo reclasifique como `web-rating-file`.
    const filedId = (filed as { id?: unknown } | null | undefined)?.id
    if (typeof filedId !== 'string' || filedId.length === 0) {
      logger.error(
        'web-rating-contract',
        new Error('El tablero respondió 2xx sin el id de la calificación radicada'),
        { franchise: config.public.rentacarFranchise, status: '2xx', received: describeReceived(filed) },
      )
      throw createError({ statusCode: 502, statusMessage: GENERIC_FAILURE })
    }
    // Radicada: el correo de `resenas` está apagado (SCEN-12501). Nada de Resend.
    return { ok: true }
  }

  if (!apiKey || !to || !from) {
    logger.error(
      'contact-config',
      new Error(
        'Falta configuración de correo (NUXT_RESEND_API_KEY / NUXT_CONTACT_EMAIL_TO / NUXT_CONTACT_EMAIL_FROM)',
      ),
      { hasApiKey: Boolean(apiKey), hasTo: Boolean(to), hasFrom: Boolean(from) },
    )
    throw createError({ statusCode: 500, statusMessage: GENERIC_FAILURE })
  }

  try {
    await $fetch<unknown>(RESEND_ENDPOINT, {
      method: 'POST',
      timeout: SEND_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from,
        to: [to],
        subject: result.email.subject,
        text: result.email.text,
        ...(result.email.replyTo ? { reply_to: result.email.replyTo } : {}),
      },
    })
  } catch (error) {
    // Sin este log la queja se pierde SIN RASTRO: el cliente ve un mensaje
    // genérico y en el servidor no queda nada que explique por qué falló.
    logger.error('contact-send', error, { type: (body as ContactFormPayload)?.type })
    throw createError({ statusCode: 502, statusMessage: GENERIC_FAILURE })
  }

  return { ok: true }
})
