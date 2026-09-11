/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre SCEN-PQRS-023, 025, 027, 027b, 027c y 028 en el proxy de Nuxt.
 *
 * ESTA RED NO EXISTÍA. `contact.post.test.ts` tiene tres tests y los tres usan
 * `type: 'resenas'`, así que la bifurcación por tipo entraría sin nada que proteja las
 * otras tres ramas. Aquí se ejercitan los cuatro tipos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let body: Record<string, unknown>

vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: async () => body,
  getRequestIP: () => '190.1.2.3',
  getRequestHeader: (_e: unknown, name: string) =>
    name.toLowerCase() === 'content-length' ? '512' : undefined,
  createError: (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
}))

/** Auto-import de Nitro desde el layer `logic`; bajo vitest no existe (ver contact.post.test.ts). */
let rateLimit: ReturnType<typeof vi.fn>

const CONFIG = {
  resendApiKey: 're_test',
  contactEmailTo: 'buzon@ejemplo.com',
  contactEmailFrom: 'web@ejemplo.com',
  rentacarAdminUrl: 'https://dashboard.example',
  pqrsApiKey: 'clave-pqrs',
  public: { rentacarFranchise: 'alquilame' },
}

const QUEJA = {
  type: 'quejas',
  nombre: 'Ana Pérez',
  email: 'ana@ejemplo.com',
  mensaje: 'El carro llegó sucio.',
  pqrs_type: 'Queja',
  consentimiento: true,
  telefono: '3001234567',
  reserva: 'AV33Y396IHA',
}

let fetchMock: ReturnType<typeof vi.fn>

/** Llamadas al dashboard y a Resend, separadas por URL. */
const alDashboard = () => fetchMock.mock.calls.filter((c) => String(c[0]).includes('dashboard.example'))
const aResend = () => fetchMock.mock.calls.filter((c) => String(c[0]).includes('resend.com'))

async function run(config: Record<string, unknown> = CONFIG) {
  vi.stubGlobal('useRuntimeConfig', () => config)
  const handler = (await import('../contact.post')).default as unknown as (e: unknown) => Promise<unknown>
  try {
    return { ok: await handler({}), error: null as Record<string, unknown> | null }
  } catch (e) {
    return { ok: null, error: e as unknown as Record<string, unknown> }
  }
}

beforeEach(() => {
  vi.resetModules()
  body = { ...QUEJA }
  fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes('dashboard.example')) {
      return { radicado: 'PQRS-2026-000123', due_at: '2026-10-01T04:59:59.999Z' }
    }
    return { id: 'resend-x' }
  })
  vi.stubGlobal('$fetch', fetchMock)
  rateLimit = vi.fn(async () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 3_600_000 }))
  vi.stubGlobal('checkBlogRateLimit', rateLimit)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('una queja va al dashboard', () => {
  it('SCEN-023: devuelve el radicado que responde el dashboard', async () => {
    const { ok } = await run()
    expect(ok).toMatchObject({ ok: true, radicado: 'PQRS-2026-000123' })
  })

  it('llama al endpoint de PQRS con su propia clave', async () => {
    await run()
    expect(alDashboard()).toHaveLength(1)
    const [url, opts] = alDashboard()[0]!
    expect(String(url)).toContain('/api/pqrs')
    expect((opts as { headers: Record<string, string> }).headers['x-api-key']).toBe('clave-pqrs')
  })

  it('una URL del dashboard con barra final no produce `//api/pqrs`', async () => {
    // Producción tiene NUXT_RENTACAR_ADMIN_URL con barra final. Hoy el dashboard tolera
    // la barra doble, pero depender de eso es depender de un detalle de otro servicio.
    await run({ ...CONFIG, rentacarAdminUrl: 'https://dashboard.example/' })
    expect(String(alDashboard()[0]![0])).toBe('https://dashboard.example/api/pqrs')
  })

  it('SCEN-025: la marca la pone el servidor, no el navegador', async () => {
    body = { ...QUEJA, franchise: 'alquicarros' }
    await run()
    const enviado = (alDashboard()[0]![1] as { body: Record<string, unknown> }).body
    expect(enviado.franchise).toBe('alquilame')
  })

  it('SCEN-015: propaga la IP real del visitante', async () => {
    await run()
    const opts = alDashboard()[0]![1] as { headers: Record<string, string> }
    expect(opts.headers['x-real-client-ip']).toBe('190.1.2.3')
  })

  it('traduce los campos del formulario al contrato del endpoint', async () => {
    await run()
    const enviado = (alDashboard()[0]![1] as { body: Record<string, unknown> }).body
    expect(enviado).toMatchObject({
      type: 'queja',
      customer_name: 'Ana Pérez',
      customer_email: 'ana@ejemplo.com',
      customer_phone: '3001234567',
      reservation_code: 'AV33Y396IHA',
      description: 'El carro llegó sucio.',
      consent_accepted: true,
    })
    expect(String(enviado.consent_policy_version)).toMatch(/^\d{4}-\d{2}$/)
    expect(String(enviado.consent_text).length).toBeGreaterThan(40)
  })

  it('el tipo se traduce de la etiqueta que ve el cliente al valor del dominio', async () => {
    for (const [etiqueta, valor] of [
      ['Petición', 'peticion'],
      ['Queja', 'queja'],
      ['Reclamo', 'reclamo'],
      ['Sugerencia', 'sugerencia'],
    ]) {
      body = { ...QUEJA, pqrs_type: etiqueta }
      await run()
      const enviado = (alDashboard()[0]![1] as { body: Record<string, unknown> }).body
      expect(enviado.type, etiqueta).toBe(valor)
      fetchMock.mockClear()
    }
  })

  it('sin tipo elegido se radica como queja, no se pierde', async () => {
    const { pqrs_type, ...sinTipo } = QUEJA
    body = sinTipo
    const { ok } = await run()
    expect(ok).toMatchObject({ ok: true })
    expect((alDashboard()[0]![1] as { body: Record<string, unknown> }).body.type).toBe('queja')
  })

  it('SCEN-027c: durante la convivencia salen los DOS correos', async () => {
    await run()
    expect(alDashboard()).toHaveLength(1)
    expect(aResend()).toHaveLength(1)
  })

  it('SCEN-024: si el dashboard falla, el error se ve y no se inventa un radicado', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('dashboard.example')) throw new Error('dashboard caído')
      return { id: 'resend-x' }
    })
    const { ok, error } = await run()
    expect(ok).toBeNull()
    expect(error).toBeTruthy()
    expect(String(error!.statusMessage)).toMatch(/no pudimos/i)
  })

  it('SCEN-028: sin la clave configurada falla y nombra la variable', async () => {
    const { pqrsApiKey, ...sinClave } = CONFIG
    const { ok, error } = await run(sinClave)
    expect(ok).toBeNull()
    expect(error).toBeTruthy()
    const log = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join(' ')
    expect(log).toMatch(/PQRS_API_KEY/)
  })
})

/**
 * Las guardas del #487 van antes de la radicación. Un radicado consume consecutivo y
 * abre un plazo legal: lo que esas guardas rechazan no puede llegar al dashboard.
 */
describe('lo que las guardas del formulario cortan no se radica', () => {
  it('honeypot: responde ok al bot y no llama al dashboard', async () => {
    body = { ...QUEJA, website: 'http://spam.example' }
    const { ok } = await run()
    expect(ok).toEqual({ ok: true })
    expect(alDashboard()).toHaveLength(0)
  })

  it('tope por IP: 429 y el dashboard no se entera', async () => {
    rateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 3_600_000 })
    const { error } = await run()
    expect(error?.statusCode).toBe(429)
    expect(alDashboard()).toHaveLength(0)
  })
})

describe('SCEN-027: los otros tres formularios no pasan por el dashboard', () => {
  const otros = [
    { type: 'flota', negocio: 'R', nombre: 'L', telefono: '3', ubicacion: 'B', vehiculos: '2', tipos: ['A'], compromiso: true },
    { type: 'referidos', nombre: 'C', email: 'c@e.com', telefono: '3' },
    { type: 'resenas', nombre: 'D', email: 'd@e.com', mensaje: 'x', estrellas: '2 de 5' },
  ]

  for (const payload of otros) {
    it(`${payload.type}: solo Resend, y sin radicado en la respuesta`, async () => {
      body = payload
      const { ok } = await run()
      expect(alDashboard()).toHaveLength(0)
      expect(aResend()).toHaveLength(1)
      expect(ok).toEqual({ ok: true })
    })
  }
})
