import type { CityExpandedContent } from './types'

export const cityName = "Santa Marta"
export const citySlug = "santa-marta"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Santa Marta tiene algo que pocas ciudades ofrecen: sierra nevada, playas caribeñas y selva tropical a minutos de distancia. Recoge tu carro en el Aeropuerto Simón Bolívar y en el mismo viaje puedes visitar el Parque Tayrona, subir a Minca por café y cascadas, explorar Taganga al atardecer o llegar hasta Palomino. La Quinta de San Pedro Alejandrino y el centro histórico completan la experiencia. Reserva sin anticipos, con descuentos de hasta el 60% y entrega inmediata. La Bahía Más Linda de América tiene demasiado para verlo desde un solo punto."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Santa Marta tiene algo que pocas ciudades ofrecen: sierra nevada, playas caribeñas y selva tropical a minutos de distancia. Recoge tu carro en el Aeropuerto Simón Bolívar y en el mismo viaje puedes visitar el Parque Tayrona, subir a Minca por café y cascadas, explorar Taganga al atardecer o llegar hasta Palomino. La Quinta de San Pedro Alejandrino y el centro histórico completan la experiencia. Reserva sin anticipos, con descuentos de hasta el 60% y entrega inmediata. La Bahía Más Linda de América tiene demasiado para verlo desde un solo punto."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Santa Marta, la ciudad más antigua de Colombia fundada en 1525, es la puerta de entrada al Parque Tayrona y la Sierra Nevada. Con un carro de alquiler puedes explorar esta región de contrastes únicos: playas caribeñas, montañas nevadas y selva tropical en pocos kilómetros. El Aeropuerto Internacional Simón Bolívar te conecta con las principales ciudades del país. Tener vehículo propio es casi esencial aquí, ya que te permite acceder a playas remotas como Palomino, subir a Minca en la Sierra Nevada, visitar el Parque Tayrona a tu ritmo y explorar pueblos de la Zona Bananera. Santa Marta combina historia colonial, naturaleza exuberante y la magia de ser el lugar donde murió el Libertador Simón Bolívar.`,
        destinations: [
            {
                name: 'Parque Nacional Tayrona',
                time: '45 minutos',
                description: 'El parque natural más icónico de Colombia. Playas vírgenes como Cabo San Juan, senderos en la selva y encuentro de Sierra Nevada con el mar. Reserva entrada con anticipación.'
            },
            {
                name: 'Minca',
                time: '45 minutos',
                description: 'Pueblo de montaña en la Sierra Nevada a 650 msnm. Fincas cafeteras, cascadas, avistamiento de aves y temperaturas frescas. Escape perfecto del calor de la costa.'
            },
            {
                name: 'Palomino',
                time: '1.5 horas',
                description: 'Playa bohemia donde el río Palomino se encuentra con el mar. Tubing por el río, surf, ambiente mochilero y atardeceres espectaculares. Cada vez más popular.'
            },
            {
                name: 'Taganga',
                time: '15 minutos',
                description: 'Antiguo pueblo de pescadores convertido en destino de buceo. Bahía tranquila, restaurantes de mariscos frescos y punto de partida para playas cercanas en lancha.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Santa Marta NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora.',
            tolls: 'Hacia Palomino hay un peaje (~$9.200 COP). Hacia Barranquilla hay 3 peajes (~$30.000 COP total). No hay peajes hacia Minca ni Taganga.',
            parking: 'En el centro histórico y El Rodadero los parqueaderos cuestan entre $3.000-6.000 COP/hora. En Taganga el parqueo es limitado y en temporada alta se complica.'
        },
        bestSeason: 'Santa Marta tiene clima cálido todo el año (28-34°C). La temporada seca de diciembre a abril es ideal para playas y Tayrona. El Parque Tayrona cierra cada año en febrero y junio para recuperación ecológica (verifica fechas). Para Minca, cualquier época es buena, con lluvias más frecuentes de mayo a noviembre.'
    }
