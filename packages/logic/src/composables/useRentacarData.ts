import { watch } from 'vue'
import type { ReservasApiData } from '@rentacar-main/logic/utils'

function copyCatalog(target: ReservasApiData, source: ReservasApiData): void {
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

/**
 * Route-level reservation catalog loader.
 *
 * `lazy: true` keeps SPA navigation responsive while SSR still resolves the
 * catalog before rendering. The endpoint remains a cached Nitro handler (one
 * hour) and its Supabase query/response shape is deliberately unchanged.
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

  const asyncData = await useAsyncData<ReservasApiData>(
    'rentacar-data-request',
    () => $fetch<ReservasApiData>('/api/rentacar-data'),
    {
      lazy: true,
      server: true,
      immediate: !loaded.value,
      getCachedData(key, nuxtApp) {
        const cached = nuxtApp.payload.data[key] as ReservasApiData | null | undefined
        return cached ?? undefined
      },
    },
  )

  const accept = (value: ReservasApiData | null | undefined) => {
    if (!value || loaded.value) return
    // On SSR keep the exact useAsyncData object so Nuxt/devalue serializes one
    // shared graph, not two catalog copies. During a lazy client navigation the
    // empty state may already have been destructured by child components, so
    // mutate that stable object in place instead.
    if (import.meta.server) catalog.value = value
    else copyCatalog(catalog.value, value)
    loaded.value = true
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

  if (asyncData.error.value) {
    throw new Error('[rentacar-data] Failed to load reservation data', {
      cause: asyncData.error.value,
    })
  }

  return asyncData
}
