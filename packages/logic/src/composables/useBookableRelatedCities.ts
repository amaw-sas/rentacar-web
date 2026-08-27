// External
import { computed, type ComputedRef } from 'vue'

// Internal
import { useRelatedCities, type RelatedCity } from './useCityRelations'
import { isBookable } from '../utils/isBookable'

/**
 * The nearby cities a switched-off city page may actually send someone to.
 *
 * `useRelatedCities` is a hand-written proximity map — it knows drive times and nothing about
 * whether we still rent anywhere. The notice on a switched-off city page uses these as its way
 * out, so offering a neighbour that is ALSO switched off would walk the customer straight into
 * the same dead end the notice exists to resolve.
 *
 * Two filters, and both matter. A neighbour must be in the live catalog at all (the map is
 * maintained by hand and can name a city that was never published) and it must be on sale.
 *
 * Capped at two because the approved copy names exactly two ("las sedes más cercanas están en X,
 * a T1, y en Y, a T2"). The map is ordered by proximity, so taking the first two that survive
 * keeps the promise the sentence makes.
 *
 * `isBookable` rather than reading the field: the catalog payload is cached for an hour, so right
 * after the deploy no city carries it, and absent means on sale.
 */
export const useBookableRelatedCities = (
  cityId: string,
  limit = 2,
): ComputedRef<RelatedCity[]> =>
  computed(() => {
    const { cities } = useFetchRentacarData()
    const catalog = Array.isArray(cities) ? cities : []

    return useRelatedCities(cityId)
      .filter((related) => {
        const live = catalog.find((c: { id: string }) => c.id === related.id)
        return live !== undefined && isBookable(live)
      })
      .slice(0, limit)
  })
