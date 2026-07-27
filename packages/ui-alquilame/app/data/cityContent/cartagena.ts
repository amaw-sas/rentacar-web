import type { CityExpandedContent } from './types'

export const cityName = "Cartagena"
export const citySlug = "cartagena"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Cartagena es historia colonial, playas caribeñas y atardeceres sobre la muralla, todo en una sola ciudad. Alquila desde el Aeropuerto Rafael Núñez y explora más allá del Centro Histórico: el Castillo de San Felipe, Getsemaní con su arte callejero, Playa Blanca, el Volcán del Totumo o las playas vírgenes camino a Barú. Reserva en línea sin anticipos y aprovecha hasta 60% de descuento. Cartagena tiene mucho más que la Ciudad Amurallada, y con carro propio puedes descubrir cada rincón de la Heroica sin depender de tours."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Cartagena es historia colonial, playas caribeñas y atardeceres sobre la muralla, todo en una sola ciudad. Alquila desde el Aeropuerto Rafael Núñez y explora más allá del Centro Histórico: el Castillo de San Felipe, Getsemaní con su arte callejero, Playa Blanca, el Volcán del Totumo o las playas vírgenes camino a Barú. Reserva en línea sin anticipos y aprovecha hasta 60% de descuento. Cartagena tiene mucho más que la Ciudad Amurallada, y con carro propio puedes descubrir cada rincón de la Heroica sin depender de tours."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Cartagena de Indias, la joya del Caribe colombiano y Patrimonio de la Humanidad, es el destino turístico por excelencia del país. Con un carro de alquiler puedes explorar más allá de las murallas y descubrir playas paradisíacas, pueblos cercanos y la riqueza cultural de la región. El Aeropuerto Internacional Rafael Núñez está a solo 15 minutos del centro histórico, facilitando el inicio de tu aventura. Tener vehículo propio te permite escapar del calor en Playa Blanca, visitar el Volcán del Totumo, explorar las Islas del Rosario o aventurarte hasta Mompox sin las limitaciones de los tours grupales. Cartagena es perfecta para recorrer a tu ritmo entre historia colonial, gastronomía caribeña y atardeceres inolvidables.`,
        destinations: [
            {
                name: 'Playa Blanca - Isla Barú',
                time: '1 hora',
                description: 'La playa más famosa cerca de Cartagena. Arena blanca, aguas cristalinas del Caribe y ambiente relajado. Ahora accesible por carretera sin necesidad de lancha.'
            },
            {
                name: 'Volcán del Totumo',
                time: '1 hora',
                description: 'Experiencia única de baño en lodo volcánico con propiedades medicinales. Pequeño volcán de 15 metros donde flotas en lodo tibio. Imperdible y económico.'
            },
            {
                name: 'Santa Marta (por la costa)',
                time: '4 horas',
                description: 'La ruta costera más hermosa de Colombia. Playas vírgenes, pueblos pesqueros y paisajes del Caribe. Puedes hacer paradas en Barranquilla y el Parque Tayrona.'
            },
            {
                name: 'Mompox',
                time: '4.5 horas',
                description: 'Pueblo colonial detenido en el tiempo, Patrimonio de la Humanidad. Orfebrería en filigrana, arquitectura intacta y el río Magdalena. Vale cada kilómetro del viaje.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cartagena NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora por toda la ciudad.',
            tolls: 'Hacia Barú hay un peaje (~$9.000 COP). La vía a Santa Marta tiene varios peajes (~$45.000 COP total). Hacia el Volcán del Totumo no hay peajes.',
            parking: 'En el Centro Histórico y Bocagrande los parqueaderos cuestan entre $5.000-10.000 COP/hora. En Getsemaní hay opciones más económicas. Nunca dejes el carro en la calle.'
        },
        bestSeason: 'Cartagena es caliente todo el año (28-35°C). La temporada seca de diciembre a abril es ideal, con cielos despejados y mar tranquilo. Evita Semana Santa y fin de año si buscas precios bajos. La temporada de lluvias (mayo-noviembre) tiene menos turistas y mejores tarifas, aunque con aguaceros ocasionales por la tarde.'
    }
