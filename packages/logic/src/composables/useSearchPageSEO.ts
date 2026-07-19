// External dependencies

// Internal dependencies - composables
import { useBaseSEO } from './useBaseSEO';
import { useData } from './useData';
import { useSearchBreadcrumbs } from './useBreadcrumbs';

export const useSearchPageSEO = () => {
    useBaseSEO()

    const { getCityById } = useData();
    const { franchise } = useAppConfig();

    const route = useRoute();
    const cityParam = route.params.city;
    const city = cityParam ? getCityById(cityParam as string) : undefined

    const searchDescription = city
        ? `Busca y compara vehículos disponibles en ${city.name}. Revisa las categorías y tarifas disponibles para las fechas de tu viaje.`
        : 'Busca y compara vehículos disponibles para alquiler según las fechas de tu viaje.';

    useHead({
        title: city ? `Buscar vehículos en ${city.name}` : 'Buscar vehículos',
        htmlAttrs: {
            lang: "es",
        },
        link: [
            {
                rel: 'canonical',
                href: `${franchise.website}/${cityParam}`
            }
        ]
    })

    useSeoMeta({
        description: searchDescription,
        ogDescription: searchDescription,
        twitterDescription: searchDescription,
    })

    if (city) {
        useSearchBreadcrumbs(city.name, cityParam as string)
    }

    return {
        city
    }
}
