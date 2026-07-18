import type ReservasApiData from '../src/utils/types/data/ReservasApiData'

export const CATALOG_MAX_AGE_MS = 60 * 60 * 1000
export const CATALOG_REFRESH_CHECK_MS = 60 * 1000

function hasFreshTimestamp(snapshot: ReservasApiData | null, now = Date.now()): boolean {
  const fetchedAt = snapshot?.catalogFetchedAt
  return typeof fetchedAt === 'number'
    && Number.isFinite(fetchedAt)
    && fetchedAt > 0
    && now - fetchedAt < CATALOG_MAX_AGE_MS
}

/**
 * Loads reservation catalog data once per request, then keeps the open client
 * session within the same one-hour freshness window as the ISR document.
 *
 * Hydration safety (issue #221): the footer (and other SSR markup) bakes
 * `cities` from this snapshot into the HTML. If the client first paint
 * replaced that snapshot with a network body, Vue would report children/text
 * mismatches on the city links column and "N ciudades" copy.
 *
 * Rules:
 * 1. If useState already holds a payload-restored snapshot, keep it through
 *    hydration (SSR HTML and first client paint share one object).
 * 2. When filling from useAsyncData, only accept a real payload snapshot
 *    (`!= null`). Never return `null` from getCachedData — Nuxt treats any
 *    non-undefined value as a durable cache hit and would poison the SPA
 *    session with an empty catalog.
 * 3. Only write the initial useState when it is still empty.
 * 4. After app mount, use the server's `catalogFetchedAt` to refresh exactly at
 *    expiry. A minute check plus focus/visibility checks cover throttled tabs.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const data = useState<ReservasApiData | null>('rentacar-data', () => null)

  // Payload.state already restored the SSR snapshot — freeze it for first
  // paint. A missing snapshot still uses the existing blocking initial load.
  if (!data.value) {
    const { data: fetched, error } = await useAsyncData(
      'rentacar-data',
      () => $fetch<ReservasApiData>('/api/rentacar-data'),
      {
        getCachedData(key, cachedNuxtApp) {
          const cached = cachedNuxtApp.payload.data[key] as ReservasApiData | null | undefined
          // Real snapshot only. `null` must NOT be returned — it would be a
          // permanent cache hit and block recovery for the SPA session.
          if (cached != null) return cached
          return undefined
        },
      },
    )

    if (error.value) {
      console.error('[rentacar-data] fetch failed:', error.value)
      throw new Error('[rentacar-data] Failed to load reservation data', { cause: error.value })
    }

    // Fill only when empty. Do not overwrite a snapshot set by a concurrent path.
    if (!data.value && fetched.value) {
      data.value = fetched.value
    }
  }

  // Server execution stops here. Client refresh is deliberately registered on
  // app:mounted, never during hydration, so SSR markup and the first paint keep
  // the exact same catalog object.
  if (typeof window === 'undefined') return

  let expiryTimer: ReturnType<typeof setTimeout> | null = null
  let checkInterval: ReturnType<typeof setInterval> | null = null
  let refreshPromise: Promise<void> | null = null
  let listenersAttached = false

  const clearExpiryTimer = () => {
    if (expiryTimer !== null) clearTimeout(expiryTimer)
    expiryTimer = null
  }

  const scheduleAtExpiry = () => {
    clearExpiryTimer()
    const fetchedAt = data.value?.catalogFetchedAt
    const remaining = typeof fetchedAt === 'number' && Number.isFinite(fetchedAt)
      ? Math.max(0, CATALOG_MAX_AGE_MS - (Date.now() - fetchedAt))
      : 0
    expiryTimer = setTimeout(() => { void refreshIfStale() }, remaining)
  }

  const refreshIfStale = (): Promise<void> => {
    if (hasFreshTimestamp(data.value)) {
      scheduleAtExpiry()
      return Promise.resolve()
    }
    if (refreshPromise) return refreshPromise

    // Fail closed at the SLA boundary: once the payload timestamp expires,
    // remove it before awaiting the network so no tariff surface can keep
    // rendering prices older than one hour. A successful response repopulates
    // the reactive catalog immediately; failures remain empty and retry.
    data.value = null
    refreshPromise = $fetch<ReservasApiData>('/api/rentacar-data')
      .then((fresh) => {
        if (!hasFreshTimestamp(fresh)) {
          throw new Error('response is missing a current catalogFetchedAt')
        }
        data.value = fresh
        scheduleAtExpiry()
      })
      .catch((error) => {
        // Never restore the expired snapshot or advance its timestamp. Keep
        // retrying every minute until a genuinely fresh body is available.
        console.error('[rentacar-data] stale refresh failed:', error)
        clearExpiryTimer()
        expiryTimer = setTimeout(() => { void refreshIfStale() }, CATALOG_REFRESH_CHECK_MS)
      })
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  const onFocus = () => { void refreshIfStale() }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void refreshIfStale()
  }
  const cleanup = () => {
    clearExpiryTimer()
    if (checkInterval !== null) clearInterval(checkInterval)
    checkInterval = null
    if (!listenersAttached) return
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    listenersAttached = false
  }

  nuxtApp.hook('app:mounted', () => {
    listenersAttached = true
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    checkInterval = setInterval(() => { void refreshIfStale() }, CATALOG_REFRESH_CHECK_MS)
    void refreshIfStale()
  })
  window.addEventListener('pagehide', cleanup, { once: true })
})
