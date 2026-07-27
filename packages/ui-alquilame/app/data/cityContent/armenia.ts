import type { CityExpandedContent } from './types'

export const cityName = "Armenia"
export const citySlug = "armenia"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Armenia es la puerta de entrada al Paisaje Cultural Cafetero, declarado Patrimonio de la Humanidad por la UNESCO. Recoge tu carro en el Aeropuerto El Edén y en menos de una hora estarás en Salento recorriendo el Valle de Cocora, en Filandia probando café de origen o disfrutando del Parque del Café con toda la familia. Reserva en línea sin anticipos, elige entre compactos, sedanes o camionetas y aprovecha descuentos de hasta el 60%. Con disponibilidad inmediata los 7 días, Armenia se convierte en tu base perfecta para explorar el Quindío a tu ritmo."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Armenia es la puerta de entrada al Paisaje Cultural Cafetero, declarado Patrimonio de la Humanidad por la UNESCO. Recoge tu carro en el Aeropuerto El Edén y en menos de una hora estarás en Salento recorriendo el Valle de Cocora, en Filandia probando café de origen o disfrutando del Parque del Café con toda la familia. Reserva en línea sin anticipos, elige entre compactos, sedanes o camionetas y aprovecha descuentos de hasta el 60%. Con disponibilidad inmediata los 7 días, Armenia se convierte en tu base perfecta para explorar el Quindío a tu ritmo."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Armenia, capital del Quindío, es el epicentro del Paisaje Cultural Cafetero y la base perfecta para explorar esta región Patrimonio de la Humanidad. Con un carro de alquiler puedes recorrer las fincas cafeteras más tradicionales de Colombia, visitar parques temáticos únicos y descubrir pueblos que parecen detenidos en el tiempo. El Aeropuerto El Edén está a solo 15 minutos del centro, ideal para comenzar tu inmersión en la cultura del café. Tener vehículo propio te permite visitar el Parque del Café, explorar Filandia al amanecer, conocer el proceso del café en fincas tradicionales y recorrer la Ruta del Café a tu ritmo. Armenia ofrece la experiencia cafetera más auténtica de Colombia.`,
        destinations: [
            {
                name: 'Parque Nacional del Café',
                time: '20 minutos',
                description: 'El parque temático más visitado del Eje Cafetero. Montañas rusas, shows culturales, teleférico y todo sobre la historia del café colombiano. Diversión para toda la familia.'
            },
            {
                name: 'Filandia',
                time: '30 minutos',
                description: 'El pueblo más fotogénico del Quindío con su mirador Colina Iluminada. Artesanías en cestería, café de origen y arquitectura colorida sin el turismo masivo de Salento.'
            },
            {
                name: 'Recuca (Recorrido de la Cultura Cafetera)',
                time: '25 minutos',
                description: 'Experiencia inmersiva donde te vistes de arriero y participas en la recolección de café. Desde la semilla hasta la taza, entiendes por qué el café colombiano es único.'
            },
            {
                name: 'Jardín Botánico del Quindío',
                time: '15 minutos',
                description: 'Mariposario más grande de Colombia con cientos de especies. Senderos entre guaduales gigantes, orquídeas y un laberinto de arbustos. Naturaleza y paz.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Armenia tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:30 a 8:30 AM y de 5:30 a 6:30 PM. Solo una hora en cada franja, muy manejable.',
            tolls: 'Las vías dentro del Quindío no tienen peajes. Solo encuentras peaje si vas hacia Pereira (~$8.700 COP) o hacia Ibagué por la Línea (~$15.500 COP).',
            parking: 'En el centro de Armenia los parqueaderos cuestan entre $2.000-4.000 COP/hora. En los parques temáticos el parqueo suele estar incluido o cuesta $5.000-10.000 COP/día.'
        },
        bestSeason: 'El Quindío tiene clima templado todo el año (18-25°C). Las temporadas más secas son diciembre a febrero y junio a agosto, ideales para caminatas. La cosecha principal de café es de octubre a diciembre, cuando las fincas están más activas. Evita Semana Santa y puentes festivos si buscas precios bajos y menos multitudes.'
    }
