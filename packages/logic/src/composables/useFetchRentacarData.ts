import type { ReservasApiData } from '@rentacar-main/logic/utils';

const EMPTY_SENTINEL: ReservasApiData = Object.freeze({
  categories: Object.freeze([]),
  branches: Object.freeze([]),
  extras: undefined,
  vehicleCategories: Object.freeze({}),
  cities: Object.freeze([]),
  franchiseTestimonials: Object.freeze({}),
  faqs: Object.freeze([]),
}) as unknown as ReservasApiData;

export default function useFetchRentacarData(): ReservasApiData {
  const data = useState<ReservasApiData | null>('rentacar-data')

  return data.value ?? EMPTY_SENTINEL
}
