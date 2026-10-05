// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchVisitorCountry, __resetVisitorCountryForTests } from '../fetchVisitorCountry'

describe('fetchVisitorCountry (client)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    __resetVisitorCountryForTests()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uppercases a valid country', async () => {
    const f = vi.fn().mockResolvedValue({ country: 'us', source: 'cf' })
    vi.stubGlobal('$fetch', f)
    expect(await fetchVisitorCountry()).toBe('US')
    expect(f.mock.calls[0][0]).toBe('/api/visitor-country')
  })

  it('memoizes: two calls, one request', async () => {
    const f = vi.fn().mockResolvedValue({ country: 'US', source: 'cf' })
    vi.stubGlobal('$fetch', f)
    await fetchVisitorCountry()
    await fetchVisitorCountry()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('asks once, without automatic retries (a failed lookup must not double the noise)', async () => {
    const f = vi.fn().mockResolvedValue({ country: 'US', source: 'cf' })
    vi.stubGlobal('$fetch', f)
    await fetchVisitorCountry()
    expect(f).toHaveBeenCalledWith('/api/visitor-country', expect.objectContaining({ retry: 0 }))
  })

  it('returns null when the request rejects', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('boom')))
    expect(await fetchVisitorCountry()).toBeNull()
  })

  it.each([
    ['string garbage', 'garbage'],
    ['null body', null],
    ['country null', { country: null, source: 'none' }],
    ['3-letter country', { country: 'USA', source: 'cf' }],
    ['numeric country', { country: 12, source: 'cf' }],
  ])('returns null for %s', async (_n, body) => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(body))
    expect(await fetchVisitorCountry()).toBeNull()
  })

  it('returns null at 1500 ms when the endpoint is slower', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('$fetch', vi.fn(() => new Promise(() => {})))
    let result: string | null | undefined
    fetchVisitorCountry().then((v) => { result = v })
    await vi.advanceTimersByTimeAsync(1499)
    expect(result).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(result).toBeNull()
  })
})
