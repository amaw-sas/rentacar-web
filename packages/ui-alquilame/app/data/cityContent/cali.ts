import type { CityExpandedContent } from './types'

export const cityName = "Cali"
export const citySlug = "cali"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Cali no solo es la capital mundial de la salsa: es gastronomía valluna, atardeceres desde el Cristo Rey y una vida nocturna que no para. Recoge tu carro en el Aeropuerto Alfonso Bonilla Aragón y recorre el Barrio San Antonio, el Zoológico de Cali, la Iglesia La Ermita y, si te animas, escápate al Lago Calima o a Buga en el mismo viaje. Sin anticipos, con hasta 60% de descuento por reserva anticipada y disponibilidad los 7 días. La Sucursal del Cielo se disfruta mejor cuando tú decides el ritmo."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Cali no solo es la capital mundial de la salsa: es gastronomía valluna, atardeceres desde el Cristo Rey y una vida nocturna que no para. Recoge tu carro en el Aeropuerto Alfonso Bonilla Aragón y recorre el Barrio San Antonio, el Zoológico de Cali, la Iglesia La Ermita y, si te animas, escápate al Lago Calima o a Buga en el mismo viaje. Sin anticipos, con hasta 60% de descuento por reserva anticipada y disponibilidad los 7 días. La Sucursal del Cielo se disfruta mejor cuando tú decides el ritmo."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Cali, la capital mundial de la salsa, te invita a explorar el suroccidente colombiano con total libertad. Con un carro de alquiler puedes moverte por esta vibrante ciudad de más de 2.5 millones de habitantes y escapar fácilmente a destinos cercanos como San Cipriano, Buga o la costa del Pacífico. El Aeropuerto Internacional Alfonso Bonilla Aragón te conecta con las principales ciudades del país, siendo el punto de partida ideal para descubrir el Valle del Cauca. Ya sea que vengas a bailar salsa, por negocios o turismo, contar con vehículo propio te permite visitar el Zoológico de Cali, subir a Cristo Rey al atardecer y explorar barrios emblemáticos como San Antonio o Granada a tu propio ritmo, sin depender del transporte público.`,
        destinations: [
            {
                name: 'San Cipriano',
                time: '2 horas',
                description: 'Reserva natural accesible en brujitas (carros sobre rieles). Ríos cristalinos, cascadas y naturaleza virgen del Pacífico. Experiencia única que combina aventura y ecoturismo.'
            },
            {
                name: 'Basílica del Señor de los Milagros - Buga',
                time: '1.5 horas',
                description: 'El santuario más visitado de Colombia. Ciudad colonial con arquitectura histórica, dulces típicos y una fe que atrae millones de peregrinos cada año.'
            },
            {
                name: 'Lago Calima',
                time: '2 horas',
                description: 'Destino de deportes náuticos y vientos perfectos para kitesurf y windsurf. Paisajes de montaña, fincas de descanso y clima templado ideal para escapadas de fin de semana.'
            },
            {
                name: 'Haciendas del Valle del Cauca',
                time: '1 hora',
                description: 'Recorre las históricas haciendas azucareras como El Paraíso (inspiración de María de Jorge Isaacs) o Piedechinche. Historia, arquitectura colonial y cultura vallecaucana.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cali tiene pico y placa de lunes a viernes según rotación del último dígito de la placa, en horario de 6:00 AM a 7:00 PM. Los sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Buga hay un peaje (~$10.500 COP). Hacia el Lago Calima encontrarás el peaje de Mediacanoa (~$10.500 COP). Las vías están en buen estado general.',
            parking: 'En el centro y San Antonio los parqueaderos cuestan entre $3.000-5.000 COP/hora. En centros comerciales como Chipichape o Jardín Plaza suele ser gratis con consumo mínimo.'
        },
        bestSeason: 'Cali tiene clima cálido todo el año (25-32°C). La Feria de Cali en diciembre es el evento más importante, pero también la época de mayor demanda. Para evitar multitudes, visita entre febrero y mayo o agosto y noviembre. Si planeas ir a San Cipriano, la temporada seca (diciembre-marzo y julio-agosto) es ideal para disfrutar los ríos cristalinos.'
    }
