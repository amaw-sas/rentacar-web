import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Issue #322 PR10 (SCEN-322-K03): city testimonials moved out of the master
// catalog payload into this per-city endpoint. Contract under test:
//   - valid slug + active city row → parsed testimonials
//   - unknown/inactive city → { testimonials: [] } (non-critical block, the
//     city page must keep rendering)
//   - invalid slug charset → 400 (the slug participates in the cache key)
//   - DB error → 500

const maybeSingle = vi.fn()

vi.mock('../../utils/supabase', () => ({
  useSupabaseClient: () => ({
    from: (table: string) => {
      expect(table).toBe('cities')
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle,
      }
      return q
    },
  }),
}))

describe('server/api/city-testimonials.get (#322 PR10)', () => {
  let handler: (event: unknown) => Promise<{ testimonials: unknown[] }>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.stubGlobal('defineCachedEventHandler', (fn: unknown) => fn)
    vi.stubGlobal('createError', (opts: { message?: string; statusMessage?: string; statusCode?: number }) =>
      Object.assign(new Error(opts?.message ?? opts?.statusMessage ?? 'error'), opts),
    )
    vi.stubGlobal('useRuntimeConfig', () => ({ app: { buildId: 'test-build' } }))
    handler = (await import('../city-testimonials.get')).default as unknown as typeof handler
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const eventWithSlug = (slug: unknown) => {
    vi.stubGlobal('getQuery', () => ({ slug }))
    return {}
  }

  it('returns parsed testimonials for an active city', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        testimonials: [
          { user: { name: 'Ana', description: 'CO', avatar: { src: 'a.webp', alt: 'Ana' } }, quote: 'Excelente' },
          { malformed: true },
        ],
      },
      error: null,
    })

    const result = await handler(eventWithSlug('bogota'))

    expect(result.testimonials).toHaveLength(1)
    expect((result.testimonials[0] as { quote: string }).quote).toBe('Excelente')
  })

  it('returns an empty list for an unknown or inactive city (no 404 — block is non-critical)', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await handler(eventWithSlug('atlantida'))

    expect(result.testimonials).toEqual([])
  })

  it.each(['Bogotá', 'a/b', '../etc', '', 'UPPER', 'x'.repeat(65)])(
    'rejects slug %j with 400 (cache-key charset guard)',
    async (slug) => {
      await expect(handler(eventWithSlug(slug))).rejects.toMatchObject({ statusCode: 400 })
      expect(maybeSingle).not.toHaveBeenCalled()
    },
  )

  it('throws 500 on a DB error', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })

    await expect(handler(eventWithSlug('bogota'))).rejects.toMatchObject({ statusCode: 500 })
  })
})
