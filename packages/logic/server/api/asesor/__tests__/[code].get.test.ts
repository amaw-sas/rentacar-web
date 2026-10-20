import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const query = { select: vi.fn(), eq: vi.fn(), maybeSingle }
const from = vi.fn(() => query)
const useSupabaseAdminClient = vi.fn(() => ({ from }))
const setResponseHeader = vi.fn()
let param = 'daniela'

vi.mock('../../../utils/supabase', () => ({ useSupabaseAdminClient }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  param = 'daniela'
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  useSupabaseAdminClient.mockImplementation(() => ({ from }))
  maybeSingle.mockResolvedValue({ data: { code: 'daniela', name: 'Daniela' }, error: null })
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('getRouterParam', () => param)
  vi.stubGlobal('getRequestIP', () => '203.0.113.10')
  vi.stubGlobal('getRequestHeader', () => undefined)
  vi.stubGlobal('setResponseHeader', setResponseHeader)
  vi.stubGlobal('createError', (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadHandler() {
  return (await import('../[code].get')).default
}

describe('GET /api/asesor/:code', () => {
  it('returns exactly { code, name } with no-store', async () => {
    maybeSingle.mockResolvedValue({
      data: { code: 'daniela', name: 'Daniela', phone: '300', notes: 'x' },
      error: null,
    })
    const handler = await loadHandler()

    await expect(handler({} as never)).resolves.toEqual({ code: 'daniela', name: 'Daniela' })
    expect(setResponseHeader).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', 'no-store')
    expect(from).toHaveBeenCalledWith('referrals')
    expect(query.select).toHaveBeenCalledWith('code,name')
    expect(query.eq).toHaveBeenCalledWith('code', 'daniela')
    expect(query.eq).toHaveBeenCalledWith('status', 'active')
    expect(query.eq).toHaveBeenCalledWith('type', 'salesperson')
  })

  it('normalizes the code (decode, trim, lowercase)', async () => {
    param = '%20Daniela%20'
    const handler = await loadHandler()
    await handler({} as never)
    expect(query.eq).toHaveBeenCalledWith('code', 'daniela')
  })

  it('404 for an unknown code', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const handler = await loadHandler()
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
    expect(setResponseHeader).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', 'no-store')
  })

  it.each(['camila-bot', 'CAMILA-BOT', 'a/b', 'a b', 'a?b', 'a#b', '', '   ', 'x'.repeat(61), '%E0%A4%A'])(
    '404 without querying for %j',
    async (value) => {
      param = value
      const handler = await loadHandler()
      await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
      expect(from).not.toHaveBeenCalled()
      expect(useSupabaseAdminClient).not.toHaveBeenCalled()
    },
  )

  it('accepts a 60-char code', async () => {
    param = 'x'.repeat(60)
    const handler = await loadHandler()
    await handler({} as never)
    expect(from).toHaveBeenCalled()
  })

  it('returns 502 (not 404) on a supabase error', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'down' } })
    const handler = await loadHandler()
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('returns 429 on the 31st call within the window', async () => {
    const handler = await loadHandler()
    for (let i = 0; i < 30; i++) await handler({} as never)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('keys the limiter on cf-connecting-ip when present (distinct visitors behind one edge IP)', async () => {
    let cf = 'visitor-a'
    vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => (name === 'cf-connecting-ip' ? cf : undefined))
    const handler = await loadHandler()
    for (let i = 0; i < 30; i++) await handler({} as never)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
    cf = 'visitor-b'
    await expect(handler({} as never)).resolves.toEqual({ code: 'daniela', name: 'Daniela' })
  })

  it('same cf-connecting-ip shares a bucket even if the socket IP changes', async () => {
    let ip = '10.0.0.1'
    vi.stubGlobal('getRequestIP', () => ip)
    vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => (name === 'cf-connecting-ip' ? 'visitor-a' : undefined))
    const handler = await loadHandler()
    for (let i = 0; i < 30; i++) await handler({} as never)
    ip = '10.0.0.2'
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('falls back to getRequestIP when the header is absent', async () => {
    let ip = '10.0.0.1'
    vi.stubGlobal('getRequestIP', () => ip)
    const handler = await loadHandler()
    for (let i = 0; i < 30; i++) await handler({} as never)
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
    ip = '10.0.0.2'
    await expect(handler({} as never)).resolves.toBeDefined()
  })

  it('does not share its limiter with exists.get', async () => {
    const asesor = await loadHandler()
    for (let i = 0; i < 30; i++) await asesor({} as never)
    await expect(asesor({} as never)).rejects.toMatchObject({ statusCode: 429 })

    vi.stubGlobal('getRouterParam', () => 'AV78')
    vi.doMock('../../../utils/supabase', () => ({
      useSupabaseAdminClient,
      useSupabaseAdminClient: () => ({ from }),
    }))
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarFranchise: 'alquilatucarro' } }))
    maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null })
    const exists = (await import('../../reservations/[reserveCode]/exists.get')).default
    await expect(exists({} as never)).resolves.toEqual({ exists: true })
  })
})
