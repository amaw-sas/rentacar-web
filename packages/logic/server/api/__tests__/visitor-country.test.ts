import { describe, it, expect, vi, beforeEach } from 'vitest'

// Visitor country endpoint. The 3 brand sites sit behind Cloudflare, so
// x-vercel-ip-country carries Cloudflare's egress country, not the visitor's.
// Contract under test:
//   - cf-ray present → only cf-ipcountry is trusted (source 'cloudflare')
//   - cf-ray absent  → x-vercel-ip-country (source 'vercel', e.g. previews)
//   - anything that is not a 2-letter code, or is 'XX', → { null, 'none' }
//   - every response is `private, no-store`

let headers: Record<string, string> = {}
const mockSetResponseHeader = vi.fn()
const mockGetRequestHeader = vi.fn((_event: unknown, name: string) => headers[name])
const mockDefineEventHandler = vi.fn((handler) => handler)

;(globalThis as Record<string, unknown>).setResponseHeader = mockSetResponseHeader
;(globalThis as Record<string, unknown>).getRequestHeader = mockGetRequestHeader
;(globalThis as Record<string, unknown>).defineEventHandler = mockDefineEventHandler

describe('GET /api/visitor-country', () => {
  let handler: (event: unknown) => { country: string | null; source: string }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    headers = {}
    handler = (await import('../visitor-country.get')).default as never
  })

  function call(h: Record<string, string>) {
    headers = h
    const result = handler({})
    expect(mockSetResponseHeader).toHaveBeenCalledWith(expect.anything(), 'cache-control', 'private, no-store')
    return result
  }

  it('cf-ray + cf-ipcountry US → cloudflare', () => {
    expect(call({ 'cf-ray': 'abc-MIA', 'cf-ipcountry': 'US' })).toEqual({ country: 'US', source: 'cloudflare' })
  })

  it('cf-ray ignores x-vercel-ip-country (Cloudflare egress IP)', () => {
    expect(call({ 'cf-ray': 'abc-MIA', 'x-vercel-ip-country': 'US' })).toEqual({ country: null, source: 'none' })
  })

  it('no cf-ray + x-vercel-ip-country es → ES via vercel', () => {
    expect(call({ 'x-vercel-ip-country': 'es' })).toEqual({ country: 'ES', source: 'vercel' })
  })

  it('empty cf-ray counts as absent', () => {
    expect(call({ 'cf-ray': '', 'x-vercel-ip-country': 'CO' })).toEqual({ country: 'CO', source: 'vercel' })
  })

  it.each(['XX', 'T1', 'USA', ''])('cf-ipcountry %j → none', (value) => {
    expect(call({ 'cf-ray': 'abc-MIA', 'cf-ipcountry': value })).toEqual({ country: null, source: 'none' })
  })

  it('no headers at all → none', () => {
    expect(call({})).toEqual({ country: null, source: 'none' })
  })
})
