import type { CityExpandedContent } from './types'

export const cityName = "Ibagué"
export const citySlug = "ibague"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Ibagué, la Capital Musical de Colombia, está rodeada de naturaleza que pide ser explorada en carro. Desde el Aeropuerto Perales llegas rápido al Cañón del Combeima — puerta al Nevado del Tolima —, al Jardín Botánico San Jorge o a cascadas escondidas en la cordillera. Si vienes durante el Festival Folclórico, tener vehículo propio te permite moverte entre sedes y eventos sin perder un solo compás. Reserva sin anticipos, elige tu vehículo y aprovecha descuentos de hasta el 60%. Ibagué suena mejor cuando la recorres a tu manera."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Ibagué, la Capital Musical de Colombia, es el corazón del Tolima y la puerta de entrada a destinos naturales espectaculares. Con un carro de alquiler puedes explorar esta ciudad de tradición musical y aventurarte hacia el Cañón del Combeima, nevados y pueblos cafeteros. El Aeropuerto Perales tiene vuelos limitados, pero la ciudad está estratégicamente ubicada entre Bogotá y el Eje Cafetero. Tener vehículo propio te permite subir al Cañón del Combeima con sus cascadas, visitar Cajamarca antes de la minería, explorar el Parque Nacional Los Nevados desde el lado tolimense y disfrutar de la gastronomía típica. Ibagué combina música, naturaleza de montaña y el espíritu festivo del Tolima Grande.`,
        destinations: [
            {
                name: 'Cañón del Combeima',
                time: '45 minutos',
                description: 'Valle espectacular con el río Combeima, cascadas, restaurantes de trucha y senderos hacia el Nevado del Tolima. Juntas es el pueblo más conocido, base para ascensos al nevado.'
            },
            {
                name: 'Nevado del Tolima',
                time: '3 horas (hasta base)',
                description: 'Volcán de 5.215 metros, hermano del Ruiz. Ascenso de 2-3 días desde Juntas. Para no escaladores, el camino hasta El Silencio ofrece vistas impresionantes del nevado y páramo.'
            },
            {
                name: 'Cajamarca',
                time: '1.5 horas',
                description: 'La despensa agrícola de Colombia, famosa por sus arvejas y paisajes de montaña. Pueblo tranquilo con arquitectura tradicional y mirador hacia el valle. Antes del proyecto minero, conócelo.'
            },
            {
                name: 'Honda',
                time: '2 horas',
                description: 'Ciudad colonial a orillas del Magdalena, el puerto más importante de la colonia. Puentes históricos, arquitectura única, subienda de peces y un pasado glorioso por descubrir.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Ibagué tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 8:00 AM y de 6:00 a 7:30 PM. Solo una hora en la mañana.',
            tolls: 'Hacia Bogotá por la Línea hay peajes (~COP 32.000 total). Hacia el Cañón del Combeima no hay peajes. Hacia Armenia hay un peaje (~$15.500 COP).',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En La Estación y centros comerciales hay tarifas con consumo.'
        },
        bestSeason: 'Ibagué tiene clima cálido (22-32°C) pero el Cañón del Combeima es más fresco. La temporada seca de junio a agosto es ideal para el Nevado del Tolima (aunque requiere guía y equipo especializado). El Festival Folclórico en junio es la época más festiva. Para el Cañón, cualquier época funciona.'
    }
