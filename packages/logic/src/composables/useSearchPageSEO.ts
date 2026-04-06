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
        ? `Busca y compara vehículos disponibles en ${city.name}. Sedanes, compactos, SUVs y camionetas con precios desde $32 USD/día.`
        : 'Busca y compara vehículos disponibles para alquiler. Diferentes categorías y precios competitivos.';

    useHead({
        title: `Buscar Vehículos en ${city?.name} | ${franchise.title}`,
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
