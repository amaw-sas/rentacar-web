import type ReservasApiData from '../src/utils/types/data/ReservasApiData'

/**
 * Loads reservation catalog data once per request and keeps a single
 * useState snapshot for the whole app.
 *
 * Hydration safety (issue #221): the footer (and other SSR markup) bakes
 * `cities` from this snapshot into the HTML. If the client first paint
 * replaced that snapshot with a network body, Vue would report children/text
 * mismatches on the city links column and "N ciudades" copy.
 *
 * Rules:
 * 1. If useState already holds a payload-restored snapshot, keep it — do not
 *    fetch or overwrite (SSR HTML and first client paint share one object).
 * 2. When filling from useAsyncData, only accept a real payload snapshot
 *    (`!= null`). Never return `null` from getCachedData — Nuxt treats any
 *    non-undefined value as a durable cache hit and would poison the SPA
 *    session with an empty catalog.
 * 3. Only write useState when it is still empty.
 */
export default defineNuxtPlugin(async () => {
  const data = useState<ReservasApiData | null>('rentacar-data', () => null)

  // Payload.state already restored the SSR snapshot — freeze it for first paint.
  if (data.value) return

  const { data: fetched, error } = await useAsyncData(
    'rentacar-data',
    () => $fetch<ReservasApiData>('/api/rentacar-data'),
    {
      getCachedData(key, nuxtApp) {
        const cached = nuxtApp.payload.data[key] as ReservasApiData | null | undefined
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
})
