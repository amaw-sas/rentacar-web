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

  // Pre-PR review 2026-10-05: the preload asks early, while results are on
  // screen. A cold endpoint answering after the 1.5 s cap must still serve the
  // form opened later — the cap applies per call, the request is kept.
  it('keeps a late answer for the next call (the cap is per call, one request)', async () => {
    vi.useFakeTimers()
    let answer!: (body: unknown) => void
    const f = vi.fn(() => new Promise((res) => { answer = res }))
    vi.stubGlobal('$fetch', f)

    const early = fetchVisitorCountry()
    await vi.advanceTimersByTimeAsync(1500)
    expect(await early).toBeNull()

    answer({ country: 'US', source: 'cloudflare' })
    await vi.advanceTimersByTimeAsync(0)
    expect(await fetchVisitorCountry()).toBe('US')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('a failed request is not retried within the page (one request)', async () => {
    const f = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('$fetch', f)
    expect(await fetchVisitorCountry()).toBeNull()
    expect(await fetchVisitorCountry()).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
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
