/**
 * Handler de /api/contact — lo que ve el visitante y lo que queda en el log.
 *
 *   - Un fallo de configuración NO puede pintar los nombres de las variables de
 *     entorno en la pantalla de un cliente; el detalle va al log del servidor.
 *   - Un fallo del proveedor de correo tiene que dejar rastro: sin log, la
 *     queja se pierde sin que nadie sepa por qué.
 *   - El endpoint SÍ se frena por IP, y esto lo comprueba: 10 envíos por hora
 *     con clave propia («contacto:<ip>»), separada del contador del blog. Antes
 *     este docblock afirmaba el freno sin que existiera, y sin una sola
 *     aserción de 429 debajo; el freno se construyó después, y estas pruebas
 *     son las que lo sostienen.
 *   - Y se frena por tamaño, dos veces: 413 por content-length antes de leer el
 *     cuerpo, y 400 por campo largo después.
 *
 * h3 se sustituye entero: interesa la lógica del handler, no el ciclo HTTP.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'node:module'
import { POLICY_VERSION, OPINION_CONSENT_TEXT } from '../../../app/utils/policy'

/**
 * El `createFetchError` de verdad, el que usa `$fetch` en Nitro. ofetch no es
 * dependencia directa de esta marca (llega con nuxt), así que se resuelve desde nuxt:
 * así los fallos del tablero en las pruebas tienen la forma real —getters sobre una
 * `Response`, `data` sacado de `response._data`— y no un objeto armado a mano que
 * `statusOf` podría leer aunque el real no.
 */
type FetchErrorContext = { request: string; options: { method: string }; response?: Response; error?: Error }
const requireFromNuxt = createRequire(createRequire(import.meta.url).resolve('nuxt/package.json'))
const { createFetchError } = requireFromNuxt('ofetch') as {
  createFetchError: (ctx: FetchErrorContext) => Error
}

/** La marca que este despliegue tiene horneada en `runtimeConfig.public`. */
const BRAND = 'alquilatucarro'
/** La versión de la política publicada de esta marca (app/utils/policy.ts). */
const EXPECTED_POLICY_VERSION = '2025-01'

let body: Record<string, unknown>
let ip: string | undefined
let contentLength: string | undefined
let userAgent: string | undefined

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: async () => body,
  getRequestIP: () => ip,
  getRequestHeader: (_e: unknown, name: string) => {
    const header = name.toLowerCase()
    if (header === 'content-length') return contentLength
    if (header === 'user-agent') return userAgent
    return undefined
  },
  createError: (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
}))

/**
 * `checkBlogRateLimit` llega por auto-import de Nitro desde el layer `logic`, y
 * ese auto-import no existe bajo vitest. Se declara como global, igual que hace
 * `server/middleware/__tests__/blog-api-auth.test.ts` con la misma función.
 */
let rateLimit: ReturnType<typeof vi.fn>

const VALID = {
  type: 'resenas',
  estrellas: '2 de 5',
  nombre: 'Ana Ramírez',
  email: 'ana@ejemplo.com',
  mensaje: 'El carro llegó sin gasolina.',
}

const CONFIG = {
  resendApiKey: 're_test',
  contactEmailTo: 'buzon@ejemplo.com',
  contactEmailFrom: 'web@ejemplo.com',
  // Sin estas dos una calificación baja falla cerrado antes de llegar a Resend.
  rentacarAdminUrl: 'https://dashboard.example',
  pqrsApiKey: 'clave-pqrs',
  public: { rentacarFranchise: BRAND },
}

/**
 * Los fallos de Resend que siguen siendo visibles son los de los OTROS formularios:
 * en una calificación baja, Resend corre después de radicar en el tablero y su
 * fallo ya no se le muestra al cliente (SCEN-11819). Por eso estos casos usan un
 * referido.
 */
const REFERIDO_VALIDO = {
  type: 'referidos',
  nombre: 'Luis Gómez',
  email: 'luis@ejemplo.com',
  telefono: '3001112233',
}

let send: ReturnType<typeof vi.fn>
let errorLog: ReturnType<typeof vi.spyOn>

async function handler() {
  return (await import('../contact.post')).default as unknown as (event: unknown) => Promise<unknown>
}

/** Ejecuta el handler y devuelve el error que lanzó, o null si no lanzó. */
async function run(config: Record<string, unknown> = CONFIG) {
  vi.stubGlobal('useRuntimeConfig', () => config)
  try {
    return { ok: await (await handler())({}), error: null as Record<string, unknown> | null }
  } catch (e) {
    return { ok: null, error: e as unknown as Record<string, unknown> }
  }
}

beforeEach(() => {
  body = { ...VALID }
  ip = '190.0.0.1'
  contentLength = '512'
  userAgent = undefined
  send = vi.fn(async () => ({ id: 'x' }))
  rateLimit = vi.fn(async () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 3_600_000 }))
  vi.stubGlobal('$fetch', send)
  vi.stubGlobal('checkBlogRateLimit', rateLimit)
  errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('configuración ausente', () => {
  it('no le enseña al visitante los nombres de las variables de entorno', async () => {
    body = { ...REFERIDO_VALIDO }
    const { error } = await run({ contactEmailTo: 'a@b.co', contactEmailFrom: 'c@d.co' })
    expect(error?.statusCode).toBe(500)
    expect(String(error?.statusMessage)).not.toMatch(/NUXT_|RESEND|API_KEY/)
    expect(String(error?.statusMessage)).toContain('No pudimos enviar tu mensaje')
  })

  it('pero el detalle sí queda en el log del servidor', async () => {
    body = { ...REFERIDO_VALIDO }
    await run({})
    expect(errorLog).toHaveBeenCalled()
    expect(errorLog.mock.calls.flat().join(' ')).toContain('NUXT_RESEND_API_KEY')
  })
})

describe('el proveedor de correo falla', () => {
  it('deja rastro en el log en vez de tragarse el error', async () => {
    body = { ...REFERIDO_VALIDO }
    send.mockRejectedValueOnce(new Error('Resend 422: subject too long'))
    const { error } = await run()
    expect(error?.statusCode).toBe(502)
    expect(errorLog.mock.calls.flat().join(' ')).toContain('subject too long')
  })
})


describe('tope por hora — que nadie queme la cuota de correos', () => {
  /**
   * El endpoint es público y sin autenticar. El honeypot vive en el navegador,
   * así que un bucle de `curl` ni lo ve y cada llamada gasta un correo de
   * Resend — la MISMA cuota por la que salen las confirmaciones de reserva
   * (3.600-5.000 al mes según notification_logs). Quemarla no cuesta unas
   * quejas: deja a clientes reales sin su confirmación.
   */
  it('cuenta con clave propia, para no comerse el cupo del blog', async () => {
    // `rate_limit_counters` no tiene columna de ámbito: sin el prefijo, las 100
    // llamadas/h del blog y las del formulario compartirían contador.
    await run()
    expect(rateLimit).toHaveBeenCalledWith('contacto:190.0.0.1', 10, 3600)
  })

  it('al pasarse devuelve 429 y NO manda el correo', async () => {
    rateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() })
    const { error } = await run()
    expect(error?.statusCode).toBe(429)
    expect(send).not.toHaveBeenCalled()
  })

  it('el 429 se lo explica a una persona, no le suelta jerga', async () => {
    rateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() })
    const { error } = await run()
    expect(String(error?.statusMessage)).toMatch(/varios mensajes/i)
    expect(String(error?.statusMessage)).not.toMatch(/rate limit|429|too many/i)
  })

  it('deja rastro en el log: hay que poder ver que alguien está golpeando', async () => {
    rateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() })
    await run()
    expect(errorLog.mock.calls.flat().join(' ')).toMatch(/contact-rate-limit/)
  })

  it('el honeypot se descarta ANTES de gastar cupo', async () => {
    // Un bot que rellena el honeypot no debe consumir el tope de nadie, y
    // tampoco debe enterarse de que existe un tope.
    body = { ...VALID, website: 'spam' }
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
    expect(rateLimit).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('si Supabase no responde, la queja pasa igual', async () => {
    // Fail-open a propósito, igual que el blog: perder la queja de un cliente
    // molesto por una caída de Supabase pesa más que el riesgo de abuso durante
    // esa misma caída.
    rateLimit.mockRejectedValueOnce(new Error('supabase caído'))
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
    expect(send).toHaveBeenCalled()
  })

  it('sin IP identificable sigue habiendo contador, no barra libre', async () => {
    ip = undefined
    await run()
    expect(rateLimit).toHaveBeenCalledWith('contacto:desconocida', 10, 3600)
  })
})

describe('corte por tamaño — el cuerpo ni siquiera se parsea', () => {
  it('16 KB pasan', async () => {
    contentLength = String(16 * 1024)
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
  })

  it('1 MB se rechaza con 413 sin leer el cuerpo', async () => {
    contentLength = String(1024 * 1024)
    const { error } = await run()
    expect(error?.statusCode).toBe(413)
    expect(send).not.toHaveBeenCalled()
    // Ni siquiera gasta cupo: se corta antes que todo lo demás.
    expect(rateLimit).not.toHaveBeenCalled()
  })

  it('sin content-length no se cae: los topes por campo siguen detrás', async () => {
    contentLength = undefined
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
  })

  it('un content-length que miente no importa', async () => {
    contentLength = 'no-soy-un-numero'
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
  })
})

describe('mensaje demasiado largo', () => {
  it('devuelve 400 diciendo qué campo, y no manda correo', async () => {
    body = { ...VALID, mensaje: 'x'.repeat(2001) }
    const { error } = await run()
    expect(error?.statusCode).toBe(400)
    expect((error?.data as { tooLong?: string[] })?.tooLong).toEqual(['mensaje'])
    expect(send).not.toHaveBeenCalled()
  })

  it('el mensaje al visitante dice el tope en número, no "muy largo"', async () => {
    body = { ...VALID, mensaje: 'x'.repeat(2001) }
    const { error } = await run()
    expect(String(error?.statusMessage)).toMatch(/2000|2\.000/)
  })
})

/**
 * Holdout: rentacar-dashboard docs/specs/2026-10-19-calificaciones-web/scenarios/
 * calificaciones-web.scenarios.md — SCEN-11804..11807, 11818 y 11819 (mitad web).
 *
 * Una calificación baja de /opinion se radica PRIMERO en el tablero
 * (`POST <admin>/api/web-ratings`) y solo después sale el correo. El tablero es la
 * fuente de verdad: si falla, no sale correo y el visitante ve el error; si acepta,
 * el correo pasa a ser secundario y su fallo ya no le dice al cliente que falló.
 */
describe('calificación baja: el tablero antes que el correo', () => {
  const alTablero = () => send.mock.calls.filter((c) => String(c[0]).includes('/api/web-ratings'))
  const aResend = () => send.mock.calls.filter((c) => String(c[0]).includes('resend.com'))
  const logs = () => errorLog.mock.calls.flat().join(' ')

  /** La entrada del log con esa operación, ya parseada (logger.ts escribe JSON). */
  type LogEntry = { operation?: string; context?: Record<string, unknown> }
  const logEntry = (operation: string) =>
    (errorLog.mock.calls as unknown[][])
      .map((c): LogEntry => {
        try {
          return JSON.parse(String(c[0])) as LogEntry
        } catch {
          return {}
        }
      })
      .find((entry) => entry.operation === operation)

  /**
   * Lo que lanza `$fetch` de verdad: un FetchError de ofetch sobre una `Response` real
   * con su cuerpo ya parseado en `_data`. Sin `status`, el caso del timeout: no hay
   * respuesta y ofetch envuelve el AbortError.
   */
  const fallaDelTablero = (status?: number, data?: unknown) => {
    const response = status
      ? Object.assign(new Response(JSON.stringify(data ?? {}), { status }), { _data: data })
      : undefined
    return createFetchError({
      request: 'https://dashboard.example/api/web-ratings',
      options: { method: 'POST' },
      response,
      error: status ? undefined : Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }),
    })
  }

  /** El tablero responde con `respuesta`; Resend contesta normal. */
  const tableroResponde = (respuesta: () => unknown) =>
    send.mockImplementation(async (url: string) => {
      if (String(url).includes('/api/web-ratings')) return respuesta()
      return { id: 'resend-x' }
    })

  it('SCEN-11804a: primero el tablero, después Resend, y responde { ok: true }', async () => {
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
    expect(send.mock.calls.map((c) => String(c[0]))).toEqual([
      'https://dashboard.example/api/web-ratings',
      'https://api.resend.com/emails',
    ])
  })

  it('SCEN-11804a: la llamada al tablero lleva la clave, la IP real, 6 s y el cuerpo del contrato', async () => {
    body = { ...VALID, telefono: '300 123 4567', reserva: 'AV33Y3U5QA' }
    await run()
    const [url, opts] = alTablero()[0]!
    expect(url).toBe('https://dashboard.example/api/web-ratings')
    expect(opts).toMatchObject({
      method: 'POST',
      timeout: 6_000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'clave-pqrs',
        'x-real-client-ip': '190.0.0.1',
      },
    })
    expect(opts.body).toEqual({
      franchise: BRAND,
      rating: 2,
      customer_name: 'Ana Ramírez',
      customer_email: 'ana@ejemplo.com',
      customer_phone: '300 123 4567',
      reservation_code: 'AV33Y3U5QA',
      message: 'El carro llegó sin gasolina.',
      consent_text: OPINION_CONSENT_TEXT,
      consent_policy_version: POLICY_VERSION,
      source_path: '/opinion',
    })
  })

  it('SCEN-11818: lo que se guarda es la constante de la política de ESTA marca', async () => {
    await run()
    const enviado = alTablero()[0]![1].body
    expect(enviado.consent_text).toBe(
      'Al enviarlo autorizas el tratamiento de tus datos para atender tu caso, según la política de privacidad.',
    )
    expect(enviado.consent_policy_version).toBe(EXPECTED_POLICY_VERSION)
  })

  it('sin teléfono ni reserva viajan como null, no como undefined', async () => {
    await run()
    const enviado = alTablero()[0]![1].body
    expect(enviado.customer_phone).toBeNull()
    expect(enviado.reservation_code).toBeNull()
  })

  it('una URL del tablero con barra final no produce `//api/web-ratings`', async () => {
    await run({ ...CONFIG, rentacarAdminUrl: 'https://dashboard.example/' })
    expect(alTablero()[0]![0]).toBe('https://dashboard.example/api/web-ratings')
  })

  it('una URL con salto de línea final (pegada en Vercel) tampoco ensucia la ruta', async () => {
    await run({ ...CONFIG, rentacarAdminUrl: 'https://x.app/\n' })
    expect(alTablero()[0]![0]).toBe('https://x.app/api/web-ratings')
  })

  it('una URL de puros espacios cuenta como ausente: falla cerrado con su nombre en el log', async () => {
    const { error } = await run({ ...CONFIG, rentacarAdminUrl: '  \n' })
    expect(error?.statusCode).toBe(500)
    expect(logs()).toContain('NUXT_RENTACAR_ADMIN_URL')
    expect(send).not.toHaveBeenCalled()
  })

  it('reenvía el user agent del visitante, no el de Nitro', async () => {
    userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
    await run()
    expect(alTablero()[0]![1].headers['user-agent']).toBe(userAgent)
  })

  it.each([[undefined], ['']])('sin user agent (%j) no inventa la cabecera', async (ua) => {
    userAgent = ua
    await run()
    expect(alTablero()[0]![1].headers).not.toHaveProperty('user-agent')
  })

  it.each([[''], ['   ']])('teléfono y reserva en blanco (%j) viajan como null', async (blanco) => {
    body = { ...VALID, telefono: blanco, reserva: blanco }
    await run()
    const enviado = alTablero()[0]![1].body
    expect(enviado.customer_phone).toBeNull()
    expect(enviado.reservation_code).toBeNull()
  })

  it('sin IP identificable no inventa la cabecera', async () => {
    ip = undefined
    await run()
    expect(alTablero()[0]![1].headers).not.toHaveProperty('x-real-client-ip')
  })

  it('SCEN-11807: la marca la pone el servidor, no el navegador', async () => {
    body = { ...VALID, franchise: 'alquicarros' }
    await run()
    expect(alTablero()[0]![1].body.franchise).toBe(BRAND)
  })

  it('SCEN-11804b: tablero 429 → 429 con el texto de la web, sin correo', async () => {
    tableroResponde(() => { throw fallaDelTablero(429, { error: 'rate_limit', retry_after: 1800 }) })
    const { error } = await run()
    expect(error?.statusCode).toBe(429)
    expect(String(error?.statusMessage)).toMatch(/varios mensajes/i)
    expect(aResend()).toHaveLength(0)
  })

  it('SCEN-11804b: el log del 429 lleva el retry_after que dio el tablero', async () => {
    tableroResponde(() => { throw fallaDelTablero(429, { error: 'rate_limit', retry_after: 1800 }) })
    await run()
    expect(logEntry('web-rating-rate-limit')?.context).toMatchObject({ status: 429, retryAfter: 1800 })
  })

  it('SCEN-11804c: tablero 400 → log web-rating-contract y 502 genérico, sin correo', async () => {
    tableroResponde(() => { throw fallaDelTablero(400, { error: 'validation', fields: { customer_email: 'Correo inválido' } }) })
    const { error } = await run()
    expect(error?.statusCode).toBe(502)
    expect(error?.statusMessage).toBe('No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.')
    expect(logs()).toContain('web-rating-contract')
    expect(aResend()).toHaveLength(0)
  })

  it('SCEN-11804c: el log del 400 dice qué campos rechazó el tablero', async () => {
    // Sin esto, «los contratos se separaron» llega al log sin decir en qué campo.
    const fields = { customer_email: 'Correo inválido', message: 'Mensaje vacío' }
    tableroResponde(() => { throw fallaDelTablero(400, { error: 'validation', fields }) })
    await run()
    expect(logEntry('web-rating-contract')?.context).toMatchObject({ status: 400, fields })
  })

  it('SCEN-11804d: tablero 500 → log web-rating-file y 502 genérico, sin correo', async () => {
    tableroResponde(() => { throw fallaDelTablero(500) })
    const { error } = await run()
    expect(error?.statusCode).toBe(502)
    expect(error?.statusMessage).toBe('No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.')
    expect(logs()).toContain('web-rating-file')
    expect(logs()).not.toContain('web-rating-contract')
    expect(aResend()).toHaveLength(0)
  })

  it('SCEN-11804d: el tablero no responde en 6 s → log web-rating-file y 502, sin correo', async () => {
    tableroResponde(() => { throw fallaDelTablero() })
    const { error } = await run()
    expect(error?.statusCode).toBe(502)
    expect(logs()).toContain('web-rating-file')
    expect(aResend()).toHaveLength(0)
  })

  it.each([
    ['rentacarAdminUrl', 'NUXT_RENTACAR_ADMIN_URL'],
    ['pqrsApiKey', 'NUXT_PQRS_API_KEY'],
  ])('SCEN-11806b: sin %s falla cerrado: log con %s, 500 genérico, nadie recibe nada', async (key, envName) => {
    const { error } = await run({ ...CONFIG, [key]: '' })
    expect(error?.statusCode).toBe(500)
    expect(error?.statusMessage).toBe('No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.')
    expect(String(error?.statusMessage)).not.toMatch(/NUXT_/)
    expect(logs()).toContain(envName)
    expect(send).not.toHaveBeenCalled()
  })

  it('el tablero radica aunque falte TODA la configuración de Resend', async () => {
    // El gate de Resend va DESPUÉS: dejado delante, una variable de correo ausente
    // impediría radicar, y el correo nunca podría apagarse limpio.
    const { ok } = await run({ ...CONFIG, resendApiKey: '', contactEmailTo: '', contactEmailFrom: '' })
    expect(ok).toEqual({ ok: true })
    expect(alTablero()).toHaveLength(1)
    expect(aResend()).toHaveLength(0)
    expect(logs()).toContain('contact-config')
  })

  it('SCEN-11819b: tablero 201 y Resend falla → log contact-send y aun así { ok: true }', async () => {
    send.mockImplementation(async (url: string) => {
      if (String(url).includes('/api/web-ratings')) return { id: 'r1', received_at: '2026-10-19T12:00:00Z' }
      throw new Error('Resend 422: subject too long')
    })
    const { ok, error } = await run()
    expect(error).toBeNull()
    expect(ok).toEqual({ ok: true })
    expect(logs()).toContain('contact-send')
    expect(logs()).toContain('subject too long')
  })

  it('SCEN-11819a: con el tablero y Resend bien, el correo de siempre sale al buzón', async () => {
    await run()
    const [, opts] = aResend()[0]!
    expect(opts.body.to).toEqual(['buzon@ejemplo.com'])
    expect(opts.body.subject).toBe('Calificación baja de un cliente — Ana Ramírez')
  })

  it.each([
    ['3 de 5', 3],
    ['1 de 5', 1],
  ])('SCEN-11805: «%s» se radica con rating %i', async (estrellas, rating) => {
    body = { ...VALID, estrellas }
    await run()
    expect(alTablero()[0]![1].body.rating).toBe(rating)
  })

  it.each([
    ['4 de 5'],
    ['5 de 5'],
    ['7 de 5'],
    ['0 de 5'],
    ['tres'],
    ['2 de 5 extra'],
    [undefined],
  ])('SCEN-11805: estrellas %s → 400 «Faltan campos obligatorios» sin llamar a nadie', async (estrellas) => {
    body = { ...VALID, estrellas }
    const { error } = await run()
    expect(error?.statusCode).toBe(400)
    expect(error?.statusMessage).toBe('Faltan campos obligatorios')
    expect((error?.data as { missing?: string[] })?.missing).toContain('estrellas')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('SCEN-11819: los demás formularios no cambian', () => {
  it('un referido no toca el tablero de calificaciones', async () => {
    body = { ...REFERIDO_VALIDO }
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
    expect(send.mock.calls.map((c) => String(c[0]))).toEqual(['https://api.resend.com/emails'])
  })

  it('un referido sin configuración de Resend sigue fallando con 500', async () => {
    body = { ...REFERIDO_VALIDO }
    const { error } = await run({ ...CONFIG, resendApiKey: '' })
    expect(error?.statusCode).toBe(500)
    expect(send).not.toHaveBeenCalled()
  })

  it('un referido con Resend caído sigue fallando con 502', async () => {
    body = { ...REFERIDO_VALIDO }
    send.mockRejectedValueOnce(new Error('Resend 500'))
    const { error } = await run()
    expect(error?.statusCode).toBe(502)
  })
})
