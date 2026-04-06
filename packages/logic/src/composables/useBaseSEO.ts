// External dependencies
import type { AutoRental, Brand, OpeningHoursSpecification, SearchAction, EntryPoint } from 'schema-dts';

export const useBaseSEO = () => {

    const { franchise, organization } = useAppConfig();
    const route = useRoute();

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
            potentialAction: <SearchAction>{
                '@type': 'SearchAction',
                target: <EntryPoint>{
                    '@type': 'EntryPoint',
                    urlTemplate: `${franchise.website}/{search_term_string}`
                },
                'query-input': 'required name=search_term_string'
            }
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
            openingHoursSpecification: [
                <OpeningHoursSpecification>{
                    '@type': "OpeningHoursSpecification",
                    dayOfWeek: 'Saturday',
                    opens: '07:00',
                    closes: '12:00',
                },
                <OpeningHoursSpecification>{
                    '@type': "OpeningHoursSpecification",
                    dayOfWeek: ['Monday', 'Tuesday','Wednesday','Thursday','Friday'],
                    opens: '07:00',
                    closes: '17:00',
                },
            ],
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
        }
    ])
}