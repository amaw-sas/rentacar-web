import type { CityExpandedContent } from './types'

export const cityName = "Montería"
export const citySlug = "monteria"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Montería, la Perla del Sinú, combina la tranquilidad de una ciudad ribereña con la fuerza de la capital ganadera del Caribe colombiano. Desde el Aeropuerto Los Garzones toma tu carro y pasea por la Ronda del Sinú al atardecer, visita Lorica con su arquitectura árabe-libanesa o escápate a las playas de Coveñas y San Bernardo del Viento. Reserva sin anticipos, con precios bajos y disponibilidad los 7 días. En una región donde las distancias entre fincas, pueblos y playas son largas, el carro es indispensable."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Montería, la Perla del Sinú, combina la tranquilidad de una ciudad ribereña con la fuerza de la capital ganadera del Caribe colombiano. Desde el Aeropuerto Los Garzones toma tu carro y pasea por la Ronda del Sinú al atardecer, visita Lorica con su arquitectura árabe-libanesa o escápate a las playas de Coveñas y San Bernardo del Viento. Reserva sin anticipos, con precios bajos y disponibilidad los 7 días. En una región donde las distancias entre fincas, pueblos y playas son largas, el carro es indispensable."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Montería, la Perla del Sinú, es la capital ganadera de Colombia y una ciudad que sorprende con su desarrollo y calidad de vida. Con un carro de alquiler puedes explorar esta pujante ciudad y descubrir las maravillas del departamento de Córdoba. El Aeropuerto Los Garzones te conecta con las principales ciudades del país. Tener vehículo propio te permite recorrer la emblemática Ronda del Sinú, visitar pueblos como Lorica y San Antero, conocer las playas del Golfo de Morrosquillo y explorar la sabana cordobesa con sus fincas ganaderas. Montería combina modernidad, tradición sabanera y una gastronomía excepcional basada en carne de res de primera calidad.`,
        destinations: [
            {
                name: 'Santa Cruz de Lorica',
                time: '1 hora',
                description: 'Ciudad Patrimonio Nacional con arquitectura árabe única en Colombia. Influencia sirio-libanesa en sus edificios, gastronomía y cultura. El Mercado Público es imperdible.'
            },
            {
                name: 'San Antero y Playas del Golfo',
                time: '1.5 horas',
                description: 'Playas del Golfo de Morrosquillo con aguas tranquilas y manglares. Coveñas, Playa Blanca y San Antero ofrecen sol, playa y mariscos frescos. Ideal para familia.'
            },
            {
                name: 'Tierralta y Urrá',
                time: '1.5 horas',
                description: 'Represa de Urrá con paisajes de montaña, deportes náuticos y comunidades indígenas Embera. Naturaleza exuberante del Alto Sinú y ecoturismo comunitario.'
            },
            {
                name: 'Ronda del Sinú',
                time: '10 minutos',
                description: 'El parque lineal más largo de Latinoamérica a orillas del río Sinú. 6 km de senderos, fauna silvestre, restaurantes y el corazón de la vida monteriana. Imperdible al atardecer.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Montería NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora por toda la ciudad.',
            tolls: 'Hacia Lorica hay un peaje (~$8.900 COP). Hacia las playas del Golfo hay 2 peajes (~$18.000 COP total). Las vías están en buen estado.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En centros comerciales como Buenavista o Alamedas hay tarifa con consumo.'
        },
        bestSeason: 'Montería tiene clima caliente todo el año (28-36°C). La temporada seca de diciembre a marzo es ideal para playas del Golfo y turismo en general. Las ferias ganaderas en junio atraen visitantes de todo el país. Para Lorica, cualquier época es buena pero evita las horas de máximo calor.'
    }
