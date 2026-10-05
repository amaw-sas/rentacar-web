import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchVisitorCountry, __resetVisitorCountryForTests } from '../fetchVisitorCountry'

describe('fetchVisitorCountry (no window)', () => {
  beforeEach(__resetVisitorCountryForTests)

  it('resolves null and never calls the HTTP client', async () => {
    expect(typeof window).toBe('undefined')
    const f = vi.fn().mockResolvedValue({ country: 'US', source: 'cf' })
    vi.stubGlobal('$fetch', f)
    expect(await fetchVisitorCountry()).toBeNull()
    expect(f).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
