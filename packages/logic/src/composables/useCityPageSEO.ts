// External dependencies

// Internal dependencies - composables
import { useBaseSEO } from './useBaseSEO';
import { useData } from './useData';
import { useCityBreadcrumbs } from './useBreadcrumbs';
import { useCityFAQSchema } from './useCityFAQs';

export function truncateForSEO(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    if (maxLength <= 3) return '.'.repeat(Math.max(0, maxLength));

    const contentBudget = maxLength - 3;
    const candidate = text.substring(0, contentBudget + 1);
    const lastSpace = candidate.lastIndexOf(' ');
    const truncated = lastSpace > 0
        ? candidate.substring(0, lastSpace)
        : candidate.substring(0, contentBudget);

    return `${truncated.trimEnd()}...`;
}

export const getCityPageTitle = (cityName: string): string =>
    `Alquiler de carros en ${cityName}`;

export const useCityPageSEO = () => {
    useBaseSEO()

    const { getCityById } = useData();
    const { franchise } = useAppConfig();

    const route = useRoute();
    const cityParam = route.params.city;
    const city = cityParam ? getCityById(cityParam as string) : undefined

    // Descripción SEO: conserva el texto factual y único de la ciudad dentro del
    // presupuesto completo, incluida la elipsis.
    const cityDescription = city?.description
        ? truncateForSEO(city.description, 155)
        : franchise.description;

    // Título bare: el template global agrega la marca una sola vez. No publica un
    // precio hasta tener una tarifa válida para ciudad y fechas concretas.
    const cityTitle = city
        ? getCityPageTitle(city.name)
        : franchise.title

    // Social share image: the per-brand static asset (franchise.ogImage,
    // absolutized by nuxt-seo via site.url), NOT a Blob model image — so social
    // caches never break when the vehicle catalog churns. Without this, city
    // landing pages rendered with no og:image/twitter:image (issue #49).
    const cityShareImageAlt = city
        ? `Alquiler de carros en ${city.name} — ${franchise.name}`
        : franchise.name

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
        ogImage: franchise.ogImage,
        ogImageAlt: cityShareImageAlt,
        twitterImage: franchise.ogImage,
        twitterImageAlt: cityShareImageAlt,
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
