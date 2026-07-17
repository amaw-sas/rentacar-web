// External dependencies
import type { AutoRental, Brand, EntryPoint, ReserveAction, RentalCarReservation, SoftwareApplication } from 'schema-dts';

export const useBaseSEO = () => {

    const { franchise, organization } = useAppConfig();
    const route = useRoute();
    // Issue #116: public base of the dashboard's documented API (D2), shared by
    // the 3 brands. Default + NUXT_PUBLIC_* override declared in logic nuxt.config.
    // Trailing slashes are trimmed so `${apiBase}/api/...` never doubles up; an
    // empty/missing value disables the programmatic EntryPoint (fail-soft below).
    const apiBase = (useRuntimeConfig().public.rentacarPublicApiBase ?? '').replace(/\/+$/, '');

    useSeoMeta({
        title: franchise.name,
        description: franchise.description,
    });

    useHead({
        title: franchise.title,
        templateParams: {
            schemaOrg: {
            host: franchise.website,
            path: route.path,
            inLanguage: 'es',
            }
        },
        htmlAttrs: {
            lang: "es",
        },
    });

    useSchemaOrg([
        defineWebSite({
            inLanguage: "es",
        }),
        defineWebPage({
            title: organization.name,
        }),
        defineOrganization({
            name: "AMAW SAS",
            logo: organization.logo,
            brand: <Brand>{
                name: organization.brand
            },
            subOrganization: organization.otherbrands.map((brand: string) => (<Brand>{
                name: brand
            }))
        }),
        <AutoRental>{
            '@type': "AutoRental",
            url: franchise.website,
            name: franchise.name,
            alternateName: franchise.shortname,
            description: franchise.description,
            logo: franchise.logo,
            paymentAccepted: [
                'Credit Card',
            ],
            currenciesAccepted: 'COP',
            areaServed: {
                '@type': 'Country',
                name: 'Colombia'
            },
            image: franchise.logo,
            telephone: franchise.phone,
            email: franchise.email,
            priceRange: "$$",
            // Issue #315: no org-level openingHoursSpecification. A single global
            // hours block can't be true for a multi-branch operation (airports
            // 06:00–22:00 + Sundays, 24h branches, branches closed some days), so
            // it was publishing wrong hours to Google. Per-branch hours live in
            // Supabase `locations.schedule` (contract v2, issue #47) and are not
            // modeled at this org level.
            keywords: [
                franchise.name,
                "renta de carros",
                "alquiler de carros", 
                "renta de vehiculos",
                "alquiler de vehiculos",
                "renta de autos",
                "alquiler de autos"
            ],
            sameAs: franchise.socialmedia,
            // Acción de reserva descubrible por agentes (épico #63, W1 + #116).
            // Dos EntryPoints: (1) web humano resoluble hoy; (2) programático hacia
            // la API pública documentada del dashboard (D2). El actionApplication
            // apunta al OpenAPI fetchable; el endpoint de creación exige x-api-key
            // (documentado en ese OpenAPI).
            potentialAction: <ReserveAction>{
                '@type': 'ReserveAction',
                name: `Reservar vehículo en ${franchise.name}`,
                target: [
                    <EntryPoint>{
                        '@type': 'EntryPoint',
                        urlTemplate: franchise.website,
                        actionPlatform: [
                            'https://schema.org/DesktopWebPlatform',
                            'https://schema.org/MobileWebPlatform',
                        ],
                    },
                    // Programmatic route emitted only when the API base resolves —
                    // otherwise we degrade to the web-only EntryPoint of #64.
                    ...(apiBase ? [<EntryPoint>{
                        '@type': 'EntryPoint',
                        urlTemplate: `${apiBase}/api/reservations`,
                        httpMethod: 'POST',
                        contentType: 'application/json',
                        encodingType: 'application/json',
                        actionApplication: <SoftwareApplication>{
                            '@type': 'SoftwareApplication',
                            name: 'Rentacar Reservations API',
                            applicationCategory: 'BusinessApplication',
                            url: `${apiBase}/api/openapi`,
                        },
                    }] : []),
                ],
                result: <RentalCarReservation>{
                    '@type': 'RentalCarReservation',
                },
            },
        }
    ])
}
