import type ReservasApiData from '../src/utils/types/data/ReservasApiData'

export default defineNuxtPlugin(async () => {
  const data = useState<ReservasApiData | null>('rentacar-data', () => null)

  if (data.value) return

  const { data: fetched, error } = await useAsyncData('rentacar-data', () =>
    $fetch<ReservasApiData>('/api/rentacar-data')
  )

  if (error.value) {
    console.error('[rentacar-data] fetch failed:', error.value)
    throw new Error('[rentacar-data] Failed to load reservation data', { cause: error.value })
  }

  if (fetched.value) data.value = fetched.value
})
