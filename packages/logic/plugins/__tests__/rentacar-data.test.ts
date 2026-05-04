import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// SCEN-002: when useAsyncData returns an error from /api/rentacar-data,
// the plugin must re-throw with the original error preserved as `cause`,
// and console.error must be invoked exactly once with the
// "[rentacar-data] fetch failed:" prefix before the throw.
//
// This replaces the pre-fix try/catch that swallowed the error and let
// build/SSR continue with broken state — issue #2's root cause.

type StubFetched = { value: unknown }
type StubError = { value: Error | null }

describe('plugins/rentacar-data', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('defineNuxtPlugin', (fn: () => Promise<void>) => fn)
    vi.stubGlobal('useState', () => ({ value: null }))
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    consoleSpy.mockRestore()
  })

  describe('SCEN-002: re-throws with cause chain on /api/rentacar-data error', () => {
    it('throws an Error wrapping the original error as cause', async () => {
      const originalError = new Error('Supabase down')
      vi.stubGlobal('useAsyncData', async (_key: string, _fn: unknown) => ({
        data: { value: null } as StubFetched,
        error: { value: originalError } as StubError,
      }))

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      await expect(plugin()).rejects.toThrow(/Failed to load reservation data/)
    })

    it('preserves originalError as Error.cause (chain reachable)', async () => {
      const originalError = new Error('Supabase down')
      vi.stubGlobal('useAsyncData', async () => ({
        data: { value: null } as StubFetched,
        error: { value: originalError } as StubError,
      }))

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      let captured: Error | null = null
      try {
        await plugin()
      } catch (err) {
        captured = err as Error
      }

      expect(captured).not.toBeNull()
      expect((captured as Error).cause).toBe(originalError)
    })

    it('logs to console.error exactly once before throwing, with [rentacar-data] prefix', async () => {
      const originalError = new Error('Supabase down')
      vi.stubGlobal('useAsyncData', async () => ({
        data: { value: null } as StubFetched,
        error: { value: originalError } as StubError,
      }))

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      await expect(plugin()).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledTimes(1)
      const firstArg = consoleSpy.mock.calls[0]![0]
      expect(firstArg).toContain('[rentacar-data] fetch failed:')
    })
  })

  describe('SCEN-002: happy path does not throw and populates state', () => {
    it('populates useState when fetched.value is non-null and error is null', async () => {
      const payload = {
        categories: [{ id: 'B' }],
        branches: [{ code: 'BOG-01' }],
        extras: { extraDriverDayPrice: 12000 },
        vehicleCategories: { B: {} },
      }
      const stateRef = { value: null as unknown }
      vi.stubGlobal('useState', () => stateRef)
      vi.stubGlobal('useAsyncData', async () => ({
        data: { value: payload } as StubFetched,
        error: { value: null } as StubError,
      }))

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      await expect(plugin()).resolves.not.toThrow()
      expect(stateRef.value).toBe(payload)
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('skips fetch (early return) when useState already has data', async () => {
      const existing = { categories: [], branches: [], extras: undefined, vehicleCategories: {} }
      vi.stubGlobal('useState', () => ({ value: existing }))

      const useAsyncDataSpy = vi.fn()
      vi.stubGlobal('useAsyncData', useAsyncDataSpy)

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      await plugin()

      expect(useAsyncDataSpy).not.toHaveBeenCalled()
    })
  })
})
