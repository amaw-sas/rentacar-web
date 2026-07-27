import type { CityExpandedContent } from './types'

export const cityName = "Bucaramanga"
export const citySlug = "bucaramanga"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Conocida como la Ciudad Bonita, Bucaramanga es el punto de partida para la aventura extrema en Santander. Desde el Aeropuerto Palonegro puedes recoger tu carro y lanzarte al Cañón del Chicamocha para parapente, cruzar al Cerro del Santísimo o perderte en los pueblos coloniales de Girón y Barichara. También puedes explorar San Gil, la capital del turismo de aventura, a solo una hora. Reserva sin anticipos y con descuentos de hasta el 60%. Bucaramanga tiene parques, miradores y montañas que solo se descubren con ruedas propias."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Conocida como la Ciudad Bonita, Bucaramanga es el punto de partida para la aventura extrema en Santander. Desde el Aeropuerto Palonegro puedes recoger tu carro y lanzarte al Cañón del Chicamocha para parapente, cruzar al Cerro del Santísimo o perderte en los pueblos coloniales de Girón y Barichara. También puedes explorar San Gil, la capital del turismo de aventura, a solo una hora. Reserva sin anticipos y con descuentos de hasta el 60%. Bucaramanga tiene parques, miradores y montañas que solo se descubren con ruedas propias."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Bucaramanga, la Ciudad Bonita de Colombia, te sorprende con su clima perfecto y paisajes de montaña espectaculares. Con un carro de alquiler puedes explorar el área metropolitana más limpia del país y aventurarte al impresionante Cañón del Chicamocha. El Aeropuerto Internacional Palonegro está en Lebrija, a 30 minutos del centro, lo que hace ideal recoger tu vehículo al llegar. Tener carro propio es casi indispensable aquí: te permite visitar pueblos coloniales como Girón, practicar deportes extremos en el Cañón, subir al Cerro del Santísimo y explorar la Mesa de los Santos. Bucaramanga combina modernidad, naturaleza extrema y la calidez de la gente santandereana en una experiencia única.`,
        destinations: [
            {
                name: 'Cañón del Chicamocha (Panachi)',
                time: '1.5 horas',
                description: 'Uno de los cañones más profundos del mundo. Teleférico de 6.3 km, deportes extremos, parapente y vistas que quitan el aliento. El parque Panachi tiene atracciones para toda la familia.'
            },
            {
                name: 'Girón',
                time: '20 minutos',
                description: 'Pueblo colonial mejor conservado de Santander. Calles empedradas, arquitectura blanca, dulces típicos y el río de Oro. Patrimonio Nacional a minutos de Bucaramanga.'
            },
            {
                name: 'Mesa de los Santos',
                time: '1 hora',
                description: 'Meseta a 1.600 msnm con clima perfecto, haciendas cafeteras y miradores al Cañón del Chicamocha. Parapente, camping y gastronomía santandereana de altura.'
            },
            {
                name: 'San Gil',
                time: '2 horas',
                description: 'Capital del turismo extremo en Colombia. Rafting en el río Fonce, torrentismo, espeleología y el Parque El Gallineral. Meca de la aventura para todas las edades.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Bucaramanga tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:00 a 8:00 AM y de 5:30 a 7:30 PM. Sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia el Cañón del Chicamocha hay un peaje (~$10.000 COP). Hacia San Gil hay 2 peajes (~$18.000 COP total). Las vías son de montaña, bien mantenidas pero con curvas.',
            parking: 'En Cabecera y zonas comerciales los parqueaderos cuestan entre $2.500-5.000 COP/hora. En centros comerciales como Cacique o Megamall hay tarifa con consumo.'
        },
        bestSeason: 'Bucaramanga tiene clima templado perfecto todo el año (22-28°C), por algo la llaman Ciudad Bonita. La temporada seca de diciembre a marzo es ideal para deportes extremos y el Cañón. Para parapente, los mejores vientos son de diciembre a febrero. Evita puentes festivos si buscas menos congestión en las vías de montaña.'
    }
