import type { ReservasApiData } from '@rentacar-main/logic/utils';

export default function useFetchRentacarData(): ReservasApiData {
    const data = useState<ReservasApiData | null>('rentacar-data')

    if (!data.value) {
      throw new Error('[useFetchRentacarData] Data not loaded. Ensure rentacar-data plugin has run.')
    }

    return data.value;
}