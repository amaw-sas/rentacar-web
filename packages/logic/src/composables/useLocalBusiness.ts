// External dependencies
import type { LocalBusiness, OpeningHoursSpecification, PostalAddress } from 'schema-dts';

interface Branch {
    id: number
    code: string
    name: string
    city: string
}

export const useLocalBusiness = (cityId: string, cityName: string) => {
    const { franchise } = useAppConfig()
    const { branches } = useFetchRentacarData()

    const cityBranches = (branches as Branch[]).filter(
        (branch) => branch.city === cityId
    )

    if (cityBranches.length === 0) return

    const localBusinesses = cityBranches.map((branch) => {
        const isAirport = branch.name.toLowerCase().includes('aeropuerto')

        return <LocalBusiness>{
            '@type': 'AutoRental',
            '@id': `${franchise.website}/${cityId}#${branch.code}`,
            name: `Alquilatucarro ${branch.name}`,
            description: `Alquiler de carros en ${branch.name}, ${cityName}. Reserva sin anticipos, recoge tu vehículo y paga al final.`,
            url: `${franchise.website}/${cityId}`,
            telephone: franchise.phone,
            email: franchise.email,
            image: franchise.logo,
            logo: franchise.logo,
            priceRange: '$$',
            currenciesAccepted: 'COP',
            paymentAccepted: ['Credit Card'],
            address: <PostalAddress>{
                '@type': 'PostalAddress',
                addressLocality: cityName,
                addressCountry: 'CO'
            },
            openingHoursSpecification: [
                <OpeningHoursSpecification>{
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: isAirport ? '06:00' : '07:00',
                    closes: isAirport ? '22:00' : '17:00'
                },
                <OpeningHoursSpecification>{
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: 'Saturday',
                    opens: '07:00',
                    closes: isAirport ? '22:00' : '12:00'
                },
                ...(isAirport ? [<OpeningHoursSpecification>{
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: 'Sunday',
                    opens: '06:00',
                    closes: '22:00'
                }] : [])
            ],
            areaServed: {
                '@type': 'City',
                name: cityName,
                containedInPlace: {
                    '@type': 'Country',
                    name: 'Colombia'
                }
            },
            sameAs: franchise.socialmedia
        }
    })

    useSchemaOrg(localBusinesses)

    return {
        branches: cityBranches,
        localBusinesses
    }
}
