import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  CATALOG_MAX_AGE_MS,
  hasFreshCatalog,
  installRouteCatalogFreshness,
  useRentacarData,
} from '../useRentacarData'

const catalogPayload = {
  categories: [{ id: 'B' }],
  branches: [{ code: 'BOG-01' }],
  extras: { extraDriverDayPrice: 12_000 },
  vehicleCategories: { B: { modelos: [] } },
  cities: [{ id: 'bogota', name: 'Bogotá', description: '' }],
  franchiseTestimonials: { atc: [] },
  faqs: [{ label: 'Pregunta', content: 'Respuesta' }],
}

describe('useRentacarData', () => {
  const states = new Map<string, ReturnType<typeof ref>>()

  beforeEach(() => {
    states.clear()
    vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
      if (!states.has(key)) states.set(key, ref(init?.()))
      return states.get(key)
    })
    vi.stubGlobal('$fetch', vi.fn())
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses the server timestamp as the one-hour freshness clock', () => {
    const now = Date.now()
    expect(hasFreshCatalog({ ...catalogPayload, catalogFetchedAt: now }, now)).toBe(true)
    expect(hasFreshCatalog({ ...catalogPayload, catalogFetchedAt: now - CATALOG_MAX_AGE_MS + 1 }, now)).toBe(true)
    expect(hasFreshCatalog({ ...catalogPayload, catalogFetchedAt: now - CATALOG_MAX_AGE_MS }, now)).toBe(false)
    expect(hasFreshCatalog(catalogPayload, now)).toBe(false)
  })

  it('refreshes an expired snapshot only while the current route declares catalog middleware', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-07-18T20:00:00Z')
    vi.setSystemTime(now)

    const hooks = new Map<string, () => void>()
    const nuxtApp = {
      isHydrating: false,
      hook: vi.fn((name: string, callback: () => void) => hooks.set(name, callback)),
    }
    const currentRoute = ref({ meta: { middleware: ['rentacar-data'] } })
    vi.stubGlobal('useNuxtApp', () => nuxtApp)
    vi.stubGlobal('useRouter', () => ({ currentRoute }))
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const expired = ref({
      ...catalogPayload,
      catalogFetchedAt: now.getTime() - CATALOG_MAX_AGE_MS,
    })
    const loaded = ref(true)
    const fresh = {
      ...catalogPayload,
      categories: [{ id: 'FRESH' }],
      catalogFetchedAt: now.getTime(),
    }
    const fetchSpy = vi.fn(async () => fresh)
    vi.stubGlobal('$fetch', fetchSpy)

    const controller = installRouteCatalogFreshness(expired, loaded)
    await controller?.check()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(loaded.value).toBe(true)
    expect(expired.value.catalogFetchedAt).toBe(now.getTime())
    expect(expired.value.categories).toEqual([{ id: 'FRESH' }])

    currentRoute.value = { meta: { middleware: [] } }
    vi.setSystemTime(new Date(now.getTime() + CATALOG_MAX_AGE_MS))
    await controller?.check()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not create catalog traffic for a static route', async () => {
    const nuxtApp = { hook: vi.fn(), isHydrating: false }
    vi.stubGlobal('useNuxtApp', () => nuxtApp)
    vi.stubGlobal('useRouter', () => ({ currentRoute: ref({ meta: {} }) }))
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)

    const controller = installRouteCatalogFreshness(ref({ ...catalogPayload }), ref(true))
    await controller?.check()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('uses lazy SSR async data and fills the stable catalog state', async () => {
    let capturedOptions: Record<string, unknown> | undefined
    vi.stubGlobal('useAsyncData', vi.fn(async (_key, _handler, options) => {
      capturedOptions = options
      return { data: ref(catalogPayload), error: ref(null) }
    }))

    await useRentacarData()

    expect(capturedOptions).toMatchObject({ lazy: true, server: true, immediate: true })
    expect(states.get('rentacar-data')?.value).toEqual(catalogPayload)
    expect(states.get('rentacar-data-loaded')?.value).toBe(true)
  })

  it('does not schedule another request after the route catalog is loaded', async () => {
    states.set('rentacar-data-loaded', ref(true))
    const useAsyncData = vi.fn(async (_key, _handler, options) => ({
      data: ref(null),
      error: ref(null),
      options,
    }))
    vi.stubGlobal('useAsyncData', useAsyncData)

    await useRentacarData()

    expect(useAsyncData.mock.calls[0]?.[2]).toMatchObject({ immediate: false })
  })

  it('preserves the original fetch error as the thrown cause', async () => {
    const original = new Error('Supabase down')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('useAsyncData', vi.fn(async () => ({
      data: ref(null),
      error: ref(original),
    })))

    let captured: Error | undefined
    try {
      await useRentacarData()
    } catch (error) {
      captured = error as Error
    }

    expect(captured?.message).toMatch(/Failed to load reservation data/)
    expect(captured?.cause).toBe(original)
    expect(consoleSpy).toHaveBeenCalledWith('[rentacar-data] fetch failed:', original)
  })
})
