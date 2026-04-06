// External dependencies

// Internal dependencies - composables
import { useBaseSEO } from './useBaseSEO';
import { useData } from './useData';
import { useCityBreadcrumbs } from './useBreadcrumbs';
import { useCityFAQSchema } from './useCityFAQs';

export const useCityPageSEO = () => {
    useBaseSEO()

    const { getCityById } = useData();
    const { franchise } = useAppConfig();

    const route = useRoute();
    const cityParam = route.params.city;
    const city = cityParam ? getCityById(cityParam as string) : undefined

    // Descripción SEO: usa la descripción única de la ciudad, truncada a ~155 chars
    const cityDescription = city?.description
        ? truncateForSEO(city.description, 155)
        : franchise.description;

    function truncateForSEO(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        // Corta en el último espacio antes del límite para no cortar palabras
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return truncated.substring(0, lastSpace) + '...';
    }

    // Title optimizado: ciudad primero para SEO, validación para evitar "undefined"
    const cityTitle = city
        ? `Alquiler de Carros en ${city.name} desde $32/día`
        : franchise.title

    useHead({
        title: cityTitle,
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
        description: cityDescription,
        ogDescription: cityDescription,
        twitterDescription: cityDescription,
    })

    if (city) {
        useCityBreadcrumbs(city.name, cityParam as string)
        // LocalBusiness removido: modelo de negocio es agregador digital, no sedes físicas

        // FAQPage schema para rich snippets en SERPs
        useCityFAQSchema(city.name)
    }

    return {
        city
    }
}