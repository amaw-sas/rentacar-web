// External
import { computed, type ComputedRef } from 'vue'

// Types
import type { City } from '@rentacar-main/logic/utils';

/**
 * Shared cities + FAQs from the rentacar-data snapshot.
 *
 * Reactive reads via `computed` (same pattern as useStoreAdminData / issue #10):
 * a one-shot destructure of `useFetchRentacarData()` could freeze the empty
 * sentinel if setup ran before the plugin populated useState, and would never
 * recover — while `useCityCount()` re-reads inside its own computed and could
 * show FALLBACK/live count against an empty footer `v-for` (issue #221).
 */
export const useData = () => {
  const cities: ComputedRef<City[]> = computed(
    () => useFetchRentacarData().cities as City[],
  )

  const faqs = computed(() => useFetchRentacarData().faqs)

  const getCityById = (id: string): City | undefined => {
    return cities.value.find((city: City) => city.id === id)
  }

  return {
    cities,
    faqs,
    getCityById,
  }
}
