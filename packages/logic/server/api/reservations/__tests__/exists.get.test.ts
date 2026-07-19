import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const query = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle,
}
query.select.mockReturnValue(query)
query.eq.mockReturnValue(query)

const from = vi.fn(() => query)
const useSupabaseAdminClient = vi.fn(() => ({ from }))
const setResponseHeader = vi.fn()
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

vi.mock('../../../utils/supabase', () => ({
  useSupabaseAdminClient,
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  useSupabaseAdminClient.mockImplementation(() => ({ from }))
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('getRouterParam', () => 'AV78')
  vi.stubGlobal('getRequestIP', () => '203.0.113.10')
  vi.stubGlobal('setResponseHeader', setResponseHeader)
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarFranchise: 'alquilatucarro' },
  }))
  vi.stubGlobal('createError', (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
  )
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  vi.unstubAllGlobals()
})

async function loadHandler() {
  return (await import('../[reserveCode]/exists.get')).default
}

describe('GET /api/reservations/:reserveCode/exists', () => {
  it('returns only an existence boolean for a matching brand reservation', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'internal-id' }, error: null })
    const handler = await loadHandler()

    await expect(handler({} as never)).resolves.toEqual({ exists: true })
    expect(from).toHaveBeenCalledWith('reservations')
    expect(query.select).toHaveBeenCalledWith('id')
    expect(query.eq).toHaveBeenNthCalledWith(1, 'reservation_code', 'AV78')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'franchise', 'alquilatucarro')
  })

  it('returns exists=false without exposing reservation data when no row matches', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const handler = await loadHandler()

    await expect(handler({} as never)).resolves.toEqual({ exists: false })
  })

  it('rejects malformed codes before querying Supabase', async () => {
    vi.stubGlobal('getRouterParam', () => 'invalid/code')
    const handler = await loadHandler()

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
    expect(from).not.toHaveBeenCalled()
  })

  it('reports an unavailable lookup without treating it as an existing reservation', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'database unavailable' } })
    const handler = await loadHandler()

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 503 })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase lookup unavailable'),
      expect.any(Object),
    )
  })

  it('maps missing server configuration to 503 and logs it without querying', async () => {
    useSupabaseAdminClient.mockImplementationOnce(() => {
      throw new Error('missing service role configuration')
    })
    const handler = await loadHandler()

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 503 })
    expect(from).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('rate-limits repeated lookups per IP and returns retry metadata', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const handler = await loadHandler()

    for (let request = 0; request < 30; request += 1) {
      await expect(handler({} as never)).resolves.toEqual({ exists: false })
    }

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
    expect(from).toHaveBeenCalledTimes(30)
    expect(setResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'X-RateLimit-Remaining',
      '0',
    )
    expect(setResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Retry-After',
      expect.any(Number),
    )

    vi.stubGlobal('getRequestIP', () => '203.0.113.11')
    await expect(handler({} as never)).resolves.toEqual({ exists: false })
    expect(from).toHaveBeenCalledTimes(31)
  })
})
