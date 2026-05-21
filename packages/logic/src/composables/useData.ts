// Types
import type { City } from '@rentacar-main/logic/utils';

export const useData = () => {

    const { cities, faqs } = useFetchRentacarData();

    const getCityById = (id: string): City | undefined => {
        return cities.find((city: City) => city.id === id);
    };

    return {
        cities,
        faqs,
        getCityById
    }
}
