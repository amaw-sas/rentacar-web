import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Resilience SCEN (issue #2): when useAsyncData returns an error from
// /api/rentacar-data, the plugin must re-throw with the original error as
// `cause`, and console.error once with "[rentacar-data] fetch failed:".
//
// Issue #221 SCEN-003: during hydration the plugin must not replace a
// payload-restored useState cities snapshot with a divergent fetch result.

type StubFetched = { value: unknown }
type StubError = { value: Error | null }
type NuxtHook = () => void

describe('plugins/rentacar-data', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('defineNuxtPlugin', (fn: () => Promise<void>) => fn)
    vi.stubGlobal('useState', () => ({ value: null }))
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    consoleSpy.mockRestore()
  })

  describe('error path: re-throws with cause chain', () => {
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

  describe('happy path populates state', () => {
    it('populates useState when fetched.value is non-null and error is null', async () => {
      const payload = {
        categories: [{ id: 'B' }],
        branches: [{ code: 'BOG-01' }],
        extras: { extraDriverDayPrice: 12000 },
        vehicleCategories: { B: {} },
        cities: [{ id: 'bogota', name: 'Bogotá' }],
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
  })

  describe('SCEN-003: hydration must not replace the SSR cities snapshot', () => {
    it('skips useAsyncData entirely when useState already has the payload snapshot', async () => {
      const existing = {
        categories: [],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [
          { id: 'bogota', name: 'Bogotá' },
          { id: 'medellin', name: 'Medellín' },
        ],
      }
      const stateRef = { value: existing as unknown }
      vi.stubGlobal('useState', () => stateRef)

      const useAsyncDataSpy = vi.fn()
      vi.stubGlobal('useAsyncData', useAsyncDataSpy)

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>

      await plugin()

      // Snapshot S stays S — first client paint matches SSR HTML (issue #221).
      expect(stateRef.value).toBe(existing)
      expect((stateRef.value as { cities: unknown[] }).cities).toHaveLength(2)
      expect(useAsyncDataSpy).not.toHaveBeenCalled()
    })

    it('does not overwrite useState if useAsyncData returns a divergent body', async () => {
      // Race: state filled between the empty check and assign (or concurrent path).
      // Simulate: start empty so useAsyncData runs, then state is set before assign
      // by returning divergent fetched while state was already written.
      const existing = {
        categories: [],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [
          { id: 'bogota', name: 'Bogotá' },
          { id: 'medellin', name: 'Medellín' },
        ],
      }
      const divergent = {
        ...existing,
        cities: [{ id: 'only-cali', name: 'Cali' }],
      }
      // Start empty so plugin enters useAsyncData path
      const stateRef = { value: null as unknown }
      vi.stubGlobal('useState', () => stateRef)

      const fetchFactory = vi.fn(async () => divergent)
      vi.stubGlobal(
        'useAsyncData',
        async (_key: string, fn: () => Promise<unknown>) => {
          // Another path populated state while we were "fetching"
          stateRef.value = existing
          const value = await fn()
          return {
            data: { value } as StubFetched,
            error: { value: null } as StubError,
          }
        },
      )
      vi.stubGlobal('$fetch', fetchFactory)

      // Plugin calls useAsyncData with factory that is $fetch — wire it:
      // Actually the plugin passes () => $fetch(...), so we need useAsyncData to call fn.
      vi.stubGlobal(
        'useAsyncData',
        async (_key: string, fn: () => Promise<unknown>) => {
          stateRef.value = existing
          const value = await fn()
          return {
            data: { value } as StubFetched,
            error: { value: null } as StubError,
          }
        },
      )
      vi.stubGlobal('$fetch', fetchFactory)

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>
      await plugin()

      expect(stateRef.value).toBe(existing)
      expect((stateRef.value as { cities: unknown[] }).cities).toHaveLength(2)
      expect(fetchFactory).toHaveBeenCalled()
    })

    it('getCachedData returns only real payload snapshots (never null)', async () => {
      const snapshot = {
        categories: [],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [{ id: 'bogota', name: 'Bogotá' }],
      }
      const stateRef = { value: null as unknown }
      vi.stubGlobal('useState', () => stateRef)

      type CacheOpts = {
        getCachedData?: (
          key: string,
          nuxtApp: { payload: { data: Record<string, unknown> }; isHydrating: boolean },
        ) => unknown
      }
      let capturedOpts: CacheOpts | undefined
      const fetchFactory = vi.fn(async () => snapshot)

      vi.stubGlobal(
        'useAsyncData',
        async (_key: string, fn: () => Promise<unknown>, opts?: CacheOpts) => {
          capturedOpts = opts
          const cached = opts?.getCachedData?.('rentacar-data', {
            payload: { data: { 'rentacar-data': snapshot } },
            isHydrating: true,
          })
          if (cached !== undefined) {
            return {
              data: { value: cached } as StubFetched,
              error: { value: null } as StubError,
            }
          }
          return {
            data: { value: await fn() } as StubFetched,
            error: { value: null } as StubError,
          }
        },
      )
      vi.stubGlobal('$fetch', fetchFactory)

      const plugin = (await import('../rentacar-data')).default as unknown as () => Promise<void>
      await plugin()

      expect(capturedOpts?.getCachedData).toBeTypeOf('function')
      const fromPayload = capturedOpts!.getCachedData!('rentacar-data', {
        payload: { data: { 'rentacar-data': snapshot } },
        isHydrating: true,
      })
      expect(fromPayload).toBe(snapshot)

      // Missing / null payload → undefined (allows recovery fetch), never null.
      const missing = capturedOpts!.getCachedData!('rentacar-data', {
        payload: { data: {} },
        isHydrating: true,
      })
      expect(missing).toBeUndefined()

      const poisonedNull = capturedOpts!.getCachedData!('rentacar-data', {
        payload: { data: { 'rentacar-data': null } },
        isHydrating: true,
      })
      expect(poisonedNull).toBeUndefined()

      expect(stateRef.value).toBe(snapshot)
    })
  })

  describe('open-session catalog freshness', () => {
    function installClientGlobals() {
      const windowListeners = new Map<string, EventListener>()
      const documentListeners = new Map<string, EventListener>()
      vi.stubGlobal('window', {
        addEventListener: vi.fn((name: string, listener: EventListener) => {
          windowListeners.set(name, listener)
        }),
        removeEventListener: vi.fn((name: string) => windowListeners.delete(name)),
      })
      vi.stubGlobal('document', {
        visibilityState: 'visible',
        addEventListener: vi.fn((name: string, listener: EventListener) => {
          documentListeners.set(name, listener)
        }),
        removeEventListener: vi.fn((name: string) => documentListeners.delete(name)),
      })
      return { windowListeners, documentListeners }
    }

    function nuxtAppWithMountedHook() {
      let mounted: NuxtHook | undefined
      return {
        app: {
          hook: vi.fn((name: string, callback: NuxtHook) => {
            if (name === 'app:mounted') mounted = callback
          }),
        },
        mounted: () => mounted?.(),
      }
    }

    it('keeps the SSR object through hydration, then refreshes an expired timestamp after mount', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-18T20:00:00Z'))
      installClientGlobals()
      const hooks = nuxtAppWithMountedHook()
      const existing = {
        catalogFetchedAt: Date.now() - 60 * 60 * 1000,
        categories: [{ id: 'PRICE-A' }],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
      }
      const fresh = {
        ...existing,
        catalogFetchedAt: Date.now(),
        categories: [{ id: 'PRICE-B' }],
      }
      const stateRef = { value: existing as unknown }
      const fetchSpy = vi.fn(async () => fresh)
      const useAsyncDataSpy = vi.fn()
      vi.stubGlobal('useState', () => stateRef)
      vi.stubGlobal('useAsyncData', useAsyncDataSpy)
      vi.stubGlobal('$fetch', fetchSpy)

      const plugin = (await import('../rentacar-data')).default as unknown as (app: unknown) => Promise<void>
      await plugin(hooks.app)

      expect(stateRef.value).toBe(existing)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(useAsyncDataSpy).not.toHaveBeenCalled()

      hooks.mounted()
      await Promise.resolve()
      await Promise.resolve()

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(stateRef.value).toBe(fresh)
    })

    it('refreshes a fresh mounted snapshot at its exact one-hour expiry', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-18T20:00:00Z'))
      installClientGlobals()
      const hooks = nuxtAppWithMountedHook()
      const existing = {
        catalogFetchedAt: Date.now() - 15 * 60 * 1000,
        categories: [{ id: 'PRICE-A' }],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
      }
      const fresh = {
        ...existing,
        catalogFetchedAt: Date.now() + 45 * 60 * 1000,
        categories: [{ id: 'PRICE-B' }],
      }
      const stateRef = { value: existing as unknown }
      const fetchSpy = vi.fn(async () => fresh)
      vi.stubGlobal('useState', () => stateRef)
      vi.stubGlobal('useAsyncData', vi.fn())
      vi.stubGlobal('$fetch', fetchSpy)

      const plugin = (await import('../rentacar-data')).default as unknown as (app: unknown) => Promise<void>
      await plugin(hooks.app)
      hooks.mounted()

      await vi.advanceTimersByTimeAsync(45 * 60 * 1000 - 1)
      expect(fetchSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(stateRef.value).toBe(fresh)
    })

    it('uses focus to catch an expired snapshot after a throttled/backgrounded timer', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-18T20:00:00Z'))
      const { windowListeners } = installClientGlobals()
      const hooks = nuxtAppWithMountedHook()
      const existing = {
        catalogFetchedAt: Date.now(),
        categories: [{ id: 'PRICE-A' }],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
      }
      const fresh = {
        ...existing,
        catalogFetchedAt: Date.now() + 61 * 60 * 1000,
        categories: [{ id: 'PRICE-B' }],
      }
      const stateRef = { value: existing as unknown }
      const fetchSpy = vi.fn(async () => fresh)
      vi.stubGlobal('useState', () => stateRef)
      vi.stubGlobal('useAsyncData', vi.fn())
      vi.stubGlobal('$fetch', fetchSpy)

      const plugin = (await import('../rentacar-data')).default as unknown as (app: unknown) => Promise<void>
      await plugin(hooks.app)
      hooks.mounted()
      expect(fetchSpy).not.toHaveBeenCalled()

      vi.setSystemTime(new Date('2026-07-18T21:01:00Z'))
      windowListeners.get('focus')?.(new Event('focus'))
      await Promise.resolve()
      await Promise.resolve()

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(stateRef.value).toBe(fresh)
    })

    it('fails closed instead of displaying an expired catalog when refresh fails', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-18T20:00:00Z'))
      installClientGlobals()
      const hooks = nuxtAppWithMountedHook()
      const expired = {
        catalogFetchedAt: Date.now() - 60 * 60 * 1000,
        categories: [{ id: 'PRICE-A' }],
        branches: [],
        extras: undefined,
        vehicleCategories: {},
        cities: [],
      }
      const stateRef = { value: expired as unknown }
      const fetchError = new Error('offline')
      vi.stubGlobal('useState', () => stateRef)
      vi.stubGlobal('useAsyncData', vi.fn())
      vi.stubGlobal('$fetch', vi.fn(async () => { throw fetchError }))

      const plugin = (await import('../rentacar-data')).default as unknown as (app: unknown) => Promise<void>
      await plugin(hooks.app)
      expect(stateRef.value).toBe(expired)

      hooks.mounted()
      expect(stateRef.value).toBeNull()
      await Promise.resolve()
      await Promise.resolve()

      expect(stateRef.value).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('[rentacar-data] stale refresh failed:', fetchError)
    })
  })
})
