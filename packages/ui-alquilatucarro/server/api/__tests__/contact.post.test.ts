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

let body: Record<string, unknown>
let ip: string | undefined
let contentLength: string | undefined

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: async () => body,
  getRequestIP: () => ip,
  getRequestHeader: (_e: unknown, name: string) =>
    name.toLowerCase() === 'content-length' ? contentLength : undefined,
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
    const { error } = await run({ contactEmailTo: 'a@b.co', contactEmailFrom: 'c@d.co' })
    expect(error?.statusCode).toBe(500)
    expect(String(error?.statusMessage)).not.toMatch(/NUXT_|RESEND|API_KEY/)
    expect(String(error?.statusMessage)).toContain('No pudimos enviar tu mensaje')
  })

  it('pero el detalle sí queda en el log del servidor', async () => {
    await run({})
    expect(errorLog).toHaveBeenCalled()
    expect(errorLog.mock.calls.flat().join(' ')).toContain('NUXT_RESEND_API_KEY')
  })
})

describe('el proveedor de correo falla', () => {
  it('deja rastro en el log en vez de tragarse el error', async () => {
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
