import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.stubGlobal('$fetch', (...args: unknown[]) => mockFetch(...args))
vi.stubGlobal('useRuntimeConfig', () => mockUseRuntimeConfig())

vi.mock('h3', () => ({
  defineEventHandler: (handler: Function) => handler,
  readBody: (...args: unknown[]) => mockReadBody(...args),
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

async function loadAvailability() {
  return (await import('../availability.post')).default
}

async function loadRecord() {
  return (await import('../record.post')).default
}

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
    mockReadBody.mockResolvedValue({ fullname: 'Juan Perez', franchise: 'alquilatucarro' })
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
})
