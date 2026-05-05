import type { ReservasApiData } from '@rentacar-main/logic/utils';

const EMPTY_SENTINEL: ReservasApiData = Object.freeze({
  categories: Object.freeze([]),
  branches: Object.freeze([]),
  extras: undefined,
  vehicleCategories: Object.freeze({}),
  cities: Object.freeze([]),
}) as unknown as ReservasApiData;

export default function useFetchRentacarData(): ReservasApiData {
  const data = useState<ReservasApiData | null>('rentacar-data')

  if (!data.value) {
    if (import.meta.dev) {
      console.warn('[useFetchRentacarData] state is null; returning empty sentinel.')
    }
    return EMPTY_SENTINEL
  }

  return data.value
}
