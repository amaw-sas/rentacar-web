import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Scenarios for the reservations proxy routes:
//
// 1. Both routes refuse to run if NUXT_RENTACAR_ADMIN_URL or
//    NUXT_RENTACAR_ADMIN_API_KEY is missing (500 — fail loud).
// 2. Both routes inject the admin API key as `x-api-key` and forward the
//    request body unchanged to the admin.
// 3. Both routes return the admin response unchanged.
// 4. Browser never sees the API key (verified indirectly: no header
//    derived from request headers, only from runtimeConfig).

const mockReadBody = vi.fn()
const mockFetch = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockGetRequestIP = vi.fn()

vi.stubGlobal('$fetch', (...args: unknown[]) => mockFetch(...args))
vi.stubGlobal('useRuntimeConfig', () => mockUseRuntimeConfig())

vi.mock('h3', () => ({
  defineEventHandler: (handler: Function) => handler,
  readBody: (...args: unknown[]) => mockReadBody(...args),
  getRequestIP: (...args: unknown[]) => mockGetRequestIP(...args),
  createError: (e: any) => {
    const err = new Error(e.statusMessage || 'error') as Error & {
      statusCode?: number
    }
    err.statusCode = e.statusCode
    return err
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

async function loadAvailability() {
  return (await import('../availability.post')).default
}

async function loadRecord() {
  return (await import('../record.post')).default
}

// Fix B — both proxies forward the end-user's real IP to the admin in the
// custom header x-real-client-ip. This funnel is a Vercel project, so Vercel
// overwrites x-forwarded-for with the funnel's shared NAT egress IP; without
// this the dashboard buckets every operator under one IP and its per-IP rate
// limit becomes a global cap. getRequestIP(event,{xForwardedFor:true}) yields
// the real client IP. The header is OMITTED when the IP is unavailable.
describe('reservations proxy — real client IP forwarding (Fix B)', () => {
  const ADMIN = {
    rentacarAdminUrl: 'https://admin.example.com',
    rentacarAdminApiKey: 'secret-key',
  }

  it('availability.post forwards the real IP in x-real-client-ip', async () => {
    mockUseRuntimeConfig.mockReturnValue(ADMIN)
    mockReadBody.mockResolvedValue({ pickupLocation: 'BOG' })
    mockGetRequestIP.mockReturnValue('181.63.178.28')
    mockFetch.mockResolvedValue([{ code: 'C' }])

    const handler = await loadAvailability()
    await handler({} as any)

    expect(mockGetRequestIP).toHaveBeenCalledWith(expect.anything(), {
      xForwardedFor: true,
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://admin.example.com/api/reservations/availability',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'secret-key',
          'x-real-client-ip': '181.63.178.28',
        }),
      })
    )
  })

  it('record.post forwards the real IP in x-real-client-ip', async () => {
    mockUseRuntimeConfig.mockReturnValue(ADMIN)
    mockReadBody.mockResolvedValue({ fullname: 'Juan Perez' })
    mockGetRequestIP.mockReturnValue('181.63.178.28')
    mockFetch.mockResolvedValue({ id: 'res-123' })

    const handler = await loadRecord()
    await handler({} as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://admin.example.com/api/reservations',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'secret-key',
          'x-real-client-ip': '181.63.178.28',
        }),
      })
    )
  })

  it('omits x-real-client-ip when getRequestIP returns undefined', async () => {
    mockUseRuntimeConfig.mockReturnValue(ADMIN)
    mockReadBody.mockResolvedValue({ fullname: 'Juan Perez' })
    mockGetRequestIP.mockReturnValue(undefined)
    mockFetch.mockResolvedValue({ id: 'res-123' })

    const handler = await loadRecord()
    await handler({} as any)

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers).not.toHaveProperty('x-real-client-ip')
    expect(headers['x-api-key']).toBe('secret-key')
  })
})

describe('availability.post', () => {
  it('throws 500 when admin URL or API key is missing', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      rentacarAdminUrl: '',
      rentacarAdminApiKey: '',
    })
    const handler = await loadAvailability()
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('forwards body and injects x-api-key header', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      rentacarAdminUrl: 'https://admin.example.com',
      rentacarAdminApiKey: 'secret-key',
    })
    mockReadBody.mockResolvedValue({
      pickupLocation: 'BOG',
      returnLocation: 'BOG',
      pickupDateTime: '2026-04-15T09:00',
      returnDateTime: '2026-04-20T09:00',
    })
    mockFetch.mockResolvedValue([{ code: 'C', available: true }])

    const handler = await loadAvailability()
    const result = await handler({} as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://admin.example.com/api/reservations/availability',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'secret-key' }),
        body: expect.objectContaining({ pickupLocation: 'BOG' }),
      })
    )
    expect(result).toEqual([{ code: 'C', available: true }])
  })
})

describe('record.post', () => {
  it('throws 500 when admin URL or API key is missing', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      rentacarAdminUrl: 'https://admin.example.com',
      rentacarAdminApiKey: '',
    })
    const handler = await loadRecord()
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('forwards body and injects x-api-key header to /api/reservations', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      rentacarAdminUrl: 'https://admin.example.com',
      rentacarAdminApiKey: 'secret-key',
    })
    mockReadBody.mockResolvedValue({ fullname: 'Juan Perez', franchise: 'alquilame' })
    mockFetch.mockResolvedValue({ id: 'res-123', reservation_code: 'AV78' })

    const handler = await loadRecord()
    const result = await handler({} as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://admin.example.com/api/reservations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'secret-key' }),
        body: expect.objectContaining({ fullname: 'Juan Perez' }),
      })
    )
    expect(result).toEqual({ id: 'res-123', reservation_code: 'AV78' })
  })

  it('forwards monthly_mileage unchanged on monthly reservations', async () => {
    mockUseRuntimeConfig.mockReturnValue({
      rentacarAdminUrl: 'https://admin.example.com',
      rentacarAdminApiKey: 'secret-key',
    })
    mockReadBody.mockResolvedValue({
      fullname: 'Juan Perez',
      franchise: 'alquilame',
      monthly_mileage: '3k_kms',
      total_price: 1000000,
      total_price_to_pay: 1190000,
    })
    mockFetch.mockResolvedValue({ id: 'res-456', reservation_code: 'MM01' })

    const handler = await loadRecord()
    await handler({} as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://admin.example.com/api/reservations',
      expect.objectContaining({
        body: expect.objectContaining({
          monthly_mileage: '3k_kms',
          total_price_to_pay: 1190000,
        }),
      })
    )
  })
})
