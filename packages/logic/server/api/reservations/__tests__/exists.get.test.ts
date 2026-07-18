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

vi.mock('../../../utils/supabase', () => ({
  useSupabaseAdminClient: () => ({ from }),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('getRouterParam', () => 'AV78')
  vi.stubGlobal('setResponseHeader', vi.fn())
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarFranchise: 'alquilatucarro' },
  }))
  vi.stubGlobal('createError', (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
  )
})

afterEach(() => {
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
  })
})
