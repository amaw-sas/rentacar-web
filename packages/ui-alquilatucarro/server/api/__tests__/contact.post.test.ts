/**
 * Handler de /api/contact — lo que ve el visitante y lo que queda en el log.
 *
 *   - Un fallo de configuración NO puede pintar los nombres de las variables de
 *     entorno en la pantalla de un cliente; el detalle va al log del servidor.
 *   - Un fallo del proveedor de correo tiene que dejar rastro: sin log, la
 *     queja se pierde sin que nadie sepa por qué.
 *
 * OJO — lo que este archivo NO cubre: el endpoint es público, sin autenticar y
 * SIN NINGÚN FRENO POR IP. El honeypot vive en el navegador, así que un bucle
 * de curl ni lo ve y puede disparar envíos de Resend sin tope. El docblock que
 * venía de alquilame afirmaba lo contrario («el endpoint se frena por IP») y
 * era falso en las dos marcas: `contact.post.ts` nunca llama a `getRequestIP`
 * y aquí no hay ni una aserción de 429. El único rate limit del repo es
 * `logic/server/utils/rate-limit.ts`, atado al RPC `check_blog_rate_limit` de
 * Supabase y solo para las rutas de blog. Cerrar el hueco necesita su propia
 * migración; hasta entonces, que se lea aquí en vez de creerse cubierto.
 *
 * h3 se sustituye entero: interesa la lógica del handler, no el ciclo HTTP.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let body: Record<string, unknown>

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: async () => body,
  createError: (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
}))

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
  send = vi.fn(async () => ({ id: 'x' }))
  vi.stubGlobal('$fetch', send)
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
