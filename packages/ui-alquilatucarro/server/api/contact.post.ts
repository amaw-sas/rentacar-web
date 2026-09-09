import { defineEventHandler, readBody, createError, getRequestIP, getRequestHeader } from 'h3'
import { validateAndCompose, MAX_MESSAGE_LEN, type ContactFormPayload } from '../utils/contact-forms'
import { logger } from '../utils/logger'

/**
 * Recepción de los formularios públicos y envío por correo al buzón del
 * operador. En alquilatucarro hoy sólo lo usan las calificaciones bajas de
 * /opinion; el resto de tipos que valida `contact-forms.ts` (quejas, flota,
 * referidos) existen porque el archivo es copia literal del de alquilame y las
 * dos copias deben poder moverse juntas.
 *
 * Se usa la API REST de Resend con `fetch` en vez del SDK: es una sola llamada
 * HTTP y así no se suma una dependencia al bundle del servidor.
 *
 * Fail-loud hacia LOS LOGS, no hacia el visitante: si falta RESEND_API_KEY el
 * endpoint devuelve 500 y deja el detalle en el log del servidor. Un formulario
 * que "parece" enviar pero se traga los mensajes es peor que uno que falla
 * visiblemente — el operador perdería clientes sin enterarse.
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
