import type ReservasApiData from '../src/utils/types/data/ReservasApiData'

export default defineNuxtPlugin(async () => {
  const data = useState<ReservasApiData | null>('rentacar-data', () => null)

  if (!data.value) {
    try {
      const { data: fetched } = await useAsyncData('rentacar-data', () =>
        $fetch<ReservasApiData>('/api/rentacar-data')
      )
      if (fetched.value) {
        data.value = fetched.value
      }
    } catch (error) {
      console.error('[rentacar-data] Failed to fetch from Supabase:', error)
    }
  }
})
