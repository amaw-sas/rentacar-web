import type { CityExpandedContent } from './types'

export const cityName = "Bogotá"
export const citySlug = "bogota"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Bogotá, la capital colombiana a 2.600 metros de altura, combina historia, gastronomía y vida nocturna en una ciudad que nunca duerme. Retira tu carro en el Aeropuerto El Dorado y muévete con libertad: sube a Monserrate al amanecer, recorre La Candelaria y el Museo del Oro, escápate a la Catedral de Sal en Zipaquirá o disfruta la Zona Rosa de noche. Sin anticipos, con descuentos de hasta el 60% y entrega inmediata los 7 días. En una capital donde el tráfico dicta los tiempos, tu propio carro te devuelve el control."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Bogotá, la capital colombiana a 2.600 metros de altura, combina historia, gastronomía y vida nocturna en una ciudad que nunca duerme. Retira tu carro en el Aeropuerto El Dorado y muévete con libertad: sube a Monserrate al amanecer, recorre La Candelaria y el Museo del Oro, escápate a la Catedral de Sal en Zipaquirá o disfruta la Zona Rosa de noche. Sin anticipos, con descuentos de hasta el 60% y entrega inmediata los 7 días. En una capital donde el tráfico dicta los tiempos, tu propio carro te devuelve el control."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Bogotá, la capital de Colombia, es el punto de partida ideal para explorar el centro del país. Con un carro de alquiler puedes moverte con total libertad por esta metrópoli de más de 8 millones de habitantes y escapar fácilmente a destinos cercanos como Villa de Leyva, Zipaquirá o Girardot. El Aeropuerto Internacional El Dorado conecta con todas las ciudades principales y es el hub más grande del país, lo que hace de Bogotá el lugar perfecto para iniciar tu road trip por Colombia. Ya sea que vengas por negocios o turismo, contar con vehículo propio te permite evitar el tráfico del transporte público, llegar a reuniones puntuales y explorar barrios como La Candelaria, Usaquén o Chapinero a tu propio ritmo.`,
        destinations: [
            {
                name: 'Villa de Leyva',
                time: '3 horas',
                description: 'Pueblo colonial mejor conservado de Colombia. Su plaza principal empedrada, la más grande del país, te transporta a la época colonial. Ideal para un fin de semana con museos, viñedos y el desierto de la Candelaria.'
            },
            {
                name: 'Catedral de Sal de Zipaquirá',
                time: '1 hora',
                description: 'Una de las maravillas de Colombia, esta catedral subterránea excavada en una mina de sal es imperdible. El viaje es corto y puedes combinarlo con el Tren de la Sabana.'
            },
            {
                name: 'Girardot y Melgar',
                time: '2.5 horas',
                description: 'Cuando el frío bogotano agota, estos destinos de tierra caliente ofrecen piscinas, sol y descanso. Perfectos para escapadas de fin de semana con familia.'
            },
            {
                name: 'Laguna de Guatavita',
                time: '1.5 horas',
                description: 'El lugar donde nació la leyenda de El Dorado. Una caminata moderada te lleva al cráter de esta laguna sagrada muisca con vistas espectaculares.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Bogotá restringe la circulación de vehículos de lunes a viernes según par/impar del último dígito de la placa. El horario es de 6:00 AM a 9:00 PM continuo. Los fines de semana y festivos no hay restricción.',
            tolls: 'Saliendo de Bogotá encontrarás peajes en todas las vías principales. Hacia Villa de Leyva hay 3 peajes (~$45.000 COP total), hacia Girardot 2 peajes (~$30.000 COP).',
            parking: 'En zonas como Chapinero y Usaquén los parqueaderos cuestan entre $4.000-8.000 COP/hora. En centros comerciales suele ser gratis con consumo.'
        },
        bestSeason: 'Bogotá tiene clima templado todo el año (14-19°C), pero la temporada seca de diciembre a febrero es ideal para viajes por carretera. Semana Santa y puentes festivos tienen alta demanda, así que reserva con mínimo 2 semanas de anticipación para mejores tarifas. Si planeas ir a tierra caliente (Girardot, Melgar), cualquier época es buena ya que siempre hace sol.'
    }
