import { watch, type Ref } from 'vue'
import type { ReservasApiData } from '@rentacar-main/logic/utils'

export const CATALOG_MAX_AGE_MS = 60 * 60 * 1000
export const CATALOG_REFRESH_CHECK_MS = 60 * 1000

export function hasFreshCatalog(snapshot: ReservasApiData | null, now = Date.now()): boolean {
  const fetchedAt = snapshot?.catalogFetchedAt
  return typeof fetchedAt === 'number'
    && Number.isFinite(fetchedAt)
    && fetchedAt > 0
    && now - fetchedAt < CATALOG_MAX_AGE_MS
}

function copyCatalog(target: ReservasApiData, source: ReservasApiData): void {
  if (source.catalogFetchedAt === undefined) delete target.catalogFetchedAt
  else target.catalogFetchedAt = source.catalogFetchedAt
  target.categories.splice(0, target.categories.length, ...source.categories)
  target.branches.splice(0, target.branches.length, ...source.branches)
  target.cities.splice(0, target.cities.length, ...source.cities)
  target.faqs.splice(0, target.faqs.length, ...source.faqs)

  for (const key of Object.keys(target.vehicleCategories)) delete target.vehicleCategories[key]
  Object.assign(target.vehicleCategories, source.vehicleCategories)

  for (const key of Object.keys(target.franchiseTestimonials)) delete target.franchiseTestimonials[key]
  Object.assign(target.franchiseTestimonials, source.franchiseTestimonials)

  target.extras = source.extras
}

function clearCatalog(target: ReservasApiData): void {
  delete target.catalogFetchedAt
  target.categories.splice(0)
  target.branches.splice(0)
  target.cities.splice(0)
  target.faqs.splice(0)
  for (const key of Object.keys(target.vehicleCategories)) delete target.vehicleCategories[key]
  for (const key of Object.keys(target.franchiseTestimonials)) delete target.franchiseTestimonials[key]
  target.extras = undefined
}

interface CatalogFreshnessController {
  check: () => Promise<void>
}

type NuxtAppWithCatalogFreshness = ReturnType<typeof useNuxtApp> & {
  _routeCatalogFreshness?: CatalogFreshnessController
}

function routeUsesCatalog(router: ReturnType<typeof useRouter>): boolean {
  const middleware = router.currentRoute.value.meta.middleware
  const entries = Array.isArray(middleware) ? middleware : [middleware]
  return entries.some(entry => entry === 'rentacar-data')
}

/**
 * Installs freshness checks only after a catalog route invokes this composable.
 * Static/content routes never create the controller or fetch the catalog.
 */
export function installRouteCatalogFreshness(
  catalog: Ref<ReservasApiData>,
  loaded: Ref<boolean>,
): CatalogFreshnessController | undefined {
  if (typeof window === 'undefined') return

  const nuxtApp = useNuxtApp() as NuxtAppWithCatalogFreshness
  if (nuxtApp._routeCatalogFreshness) return nuxtApp._routeCatalogFreshness

  const router = useRouter()
  let expiryTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let refreshPromise: Promise<void> | undefined

  const clearTimers = () => {
    if (expiryTimer) clearTimeout(expiryTimer)
    if (retryTimer) clearTimeout(retryTimer)
    expiryTimer = undefined
    retryTimer = undefined
  }

  const scheduleAtExpiry = () => {
    if (expiryTimer) clearTimeout(expiryTimer)
    const fetchedAt = catalog.value.catalogFetchedAt
    const remaining = typeof fetchedAt === 'number' && Number.isFinite(fetchedAt)
      ? Math.max(0, CATALOG_MAX_AGE_MS - (Date.now() - fetchedAt))
      : 0
    expiryTimer = setTimeout(() => { void check() }, remaining)
  }

  const fetchFresh = (): Promise<void> => {
    if (!routeUsesCatalog(router)) {
      clearTimers()
      return Promise.resolve()
    }
    if (refreshPromise) return refreshPromise

    clearCatalog(catalog.value)
    loaded.value = false
    refreshPromise = $fetch<ReservasApiData>('/api/rentacar-data')
      .then((fresh) => {
        if (!hasFreshCatalog(fresh)) {
          throw new Error('response is missing a current catalogFetchedAt')
        }
        copyCatalog(catalog.value, fresh)
        loaded.value = true
        scheduleAtExpiry()
      })
      .catch((error) => {
        console.error('[rentacar-data] stale refresh failed:', error)
        retryTimer = setTimeout(() => { void fetchFresh() }, CATALOG_REFRESH_CHECK_MS)
      })
      .finally(() => {
        refreshPromise = undefined
      })

    return refreshPromise
  }

  const check = (): Promise<void> => {
    if (!routeUsesCatalog(router)) {
      clearTimers()
      return Promise.resolve()
    }
    if (!loaded.value) return Promise.resolve()
    if (!hasFreshCatalog(catalog.value)) return fetchFresh()
    scheduleAtExpiry()
    return Promise.resolve()
  }

  const onFocus = () => { void check() }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void check()
  }
  const cleanup = () => {
    clearTimers()
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  nuxtApp.hook('app:mounted', () => { void check() })
  nuxtApp.hook('page:finish', () => { void check() })
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', cleanup, { once: true })

  nuxtApp._routeCatalogFreshness = { check }
  return nuxtApp._routeCatalogFreshness
}

/**
 * Route-level reservation catalog loader.
 *
 * `lazy: true` keeps SPA navigation responsive while SSR still resolves the
 * catalog before rendering. Page ISR owns the one-hour cache clock; the API
 * response carries its fetch timestamp so an open booking route can refresh at
 * the same boundary without a second server-cache TTL.
 */
export async function useRentacarData() {
  const catalog = useState<ReservasApiData>('rentacar-data', () => ({
    categories: [],
    branches: [],
    extras: undefined,
    vehicleCategories: {},
    cities: [],
    franchiseTestimonials: {},
    faqs: [],
  }))
  const loaded = useState<boolean>('rentacar-data-loaded', () => false)
  let freshness: CatalogFreshnessController | undefined

  const asyncData = await useAsyncData<ReservasApiData>(
    'rentacar-data-request',
    () => $fetch<ReservasApiData>('/api/rentacar-data'),
    {
      lazy: true,
      server: true,
      immediate: !loaded.value,
      getCachedData(key, nuxtApp) {
        const cached = nuxtApp.payload.data[key] as ReservasApiData | null | undefined
        // Preserve the SSR object through hydration even if its timestamp is at
        // the boundary; the mounted route controller refreshes after first paint.
        if (cached != null && (nuxtApp.isHydrating || hasFreshCatalog(cached))) return cached
        return undefined
      },
    },
  )

  const accept = (value: ReservasApiData | null | undefined) => {
    if (!value) return
    const currentFetchedAt = catalog.value.catalogFetchedAt ?? 0
    const incomingFetchedAt = value.catalogFetchedAt ?? 0
    if (loaded.value && incomingFetchedAt <= currentFetchedAt) return
    // On SSR keep the exact useAsyncData object so Nuxt/devalue serializes one
    // shared graph, not two catalog copies. During a lazy client navigation the
    // empty state may already have been destructured by child components, so
    // mutate that stable object in place instead.
    if (import.meta.server) catalog.value = value
    else copyCatalog(catalog.value, value)
    loaded.value = true
    if (freshness && !useNuxtApp().isHydrating) void freshness.check()
  }

  accept(asyncData.data.value)
  watch(asyncData.data, accept)

  const fail = (error: unknown) => {
    if (!error) return
    console.error('[rentacar-data] fetch failed:', error)
    if (import.meta.client) {
      showError(createError({
        statusCode: 503,
        statusMessage: 'No fue posible cargar los datos de reserva',
        cause: error,
      }))
    }
  }

  fail(asyncData.error.value)
  watch(asyncData.error, fail)

  freshness = installRouteCatalogFreshness(catalog, loaded)

  if (asyncData.error.value) {
    throw new Error('[rentacar-data] Failed to load reservation data', {
      cause: asyncData.error.value,
    })
  }

  return asyncData
}
