import type { CityExpandedContent } from './types'

export const cityName = "Cúcuta"
export const citySlug = "cucuta"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Cúcuta, la Perla del Norte, es el principal punto fronterizo de Colombia con Venezuela y un centro comercial en constante movimiento. Recoge tu carro en el Aeropuerto Camilo Daza y muévete con agilidad entre el Parque Santander, el Malecón, Villa del Rosario y la zona de frontera. Desde Cúcuta también puedes subir a Pamplona o a los pueblos de montaña de Norte de Santander. Sin anticipos, precios bajos y disponibilidad inmediata los 7 días. Para negocios o turismo, en Cúcuta el carro es la forma más práctica de cubrir terreno."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Cúcuta, la Perla del Norte, es el principal punto fronterizo de Colombia con Venezuela y un centro comercial en constante movimiento. Recoge tu carro en el Aeropuerto Camilo Daza y muévete con agilidad entre el Parque Santander, el Malecón, Villa del Rosario y la zona de frontera. Desde Cúcuta también puedes subir a Pamplona o a los pueblos de montaña de Norte de Santander. Sin anticipos, precios bajos y disponibilidad inmediata los 7 días. Para negocios o turismo, en Cúcuta el carro es la forma más práctica de cubrir terreno."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Cúcuta, la Perla del Norte, es la principal ciudad fronteriza de Colombia con Venezuela y un punto estratégico del nororiente del país. Con un carro de alquiler puedes explorar esta ciudad comercial y aventurarte hacia destinos únicos como Pamplona, la Villa del Rosario histórica y las montañas de Norte de Santander. El Aeropuerto Internacional Camilo Daza te conecta con las principales ciudades colombianas. Tener vehículo propio te permite moverte con libertad por esta extensa ciudad, visitar centros comerciales de frontera, explorar el Área Metropolitana y descubrir tesoros coloniales en pueblos cercanos. Cúcuta combina historia bolivariana, comercio dinámico y la calidez de su gente en una experiencia fronteriza única.`,
        destinations: [
            {
                name: 'Villa del Rosario',
                time: '15 minutos',
                description: 'Cuna de la Gran Colombia donde nació la primera Constitución. Casa natal del General Santander, Templo Histórico y el árbol donde se firmó la Constitución de 1821. Historia viva.'
            },
            {
                name: 'Pamplona',
                time: '1.5 horas',
                description: 'Ciudad colonial fundada en 1549, una de las más antiguas de Colombia. Arquitectura religiosa impresionante, clima frío de montaña y tradición universitaria. La Semana Santa es espectacular.'
            },
            {
                name: 'Chinácota',
                time: '1 hora',
                description: 'Pueblo de clima templado conocido por sus dulces y brevas. Descanso entre montañas, piscinas naturales y gastronomía típica nortesantandereana. Escape del calor cucuteño.'
            },
            {
                name: 'Área Metropolitana (Los Patios, El Zulia)',
                time: '20 minutos',
                description: 'Municipios conurbados con centros comerciales, restaurantes y vida nocturna. El Zulia tiene fincas de descanso y Los Patios ofrece opciones gastronómicas variadas.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cúcuta tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:30 a 8:30 AM y de 5:00 a 7:30 PM. La zona fronteriza tiene congestión adicional.',
            tolls: 'Hacia Pamplona hay un peaje (~$11.300 COP). La vía es de montaña con muchas curvas, toma precauciones. No hay peajes dentro del área metropolitana.',
            parking: 'En Ventura Plaza, Unicentro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En la zona de frontera el parqueo es más complicado, evita dejar el carro en la calle.'
        },
        bestSeason: 'Cúcuta es una de las ciudades más calientes de Colombia (28-38°C). La mejor época es de diciembre a febrero cuando el calor es más soportable. Para Pamplona lleva ropa abrigada (10-18°C). Evita los días de mayor movimiento fronterizo si no necesitas ir a la frontera.'
    }
