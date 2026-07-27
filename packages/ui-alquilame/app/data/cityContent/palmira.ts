import type { CityExpandedContent } from './types'

export const cityName = "Palmira"
export const citySlug = "palmira"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Palmira, la Capital Agrícola de Colombia, tiene una ubicación clave junto al Aeropuerto Alfonso Bonilla Aragón. Desde la ciudad puedes recorrer las haciendas azucareras del Valle del Cauca, visitar la Basílica del Señor de los Milagros en Buga, explorar Cali a 30 minutos o subir al Lago Calima. Reserva sin anticipos y con descuentos de hasta el 60%. Palmira es un punto de partida práctico para descubrir todo el Valle con la comodidad de un vehículo propio."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Palmira, la Capital Agrícola de Colombia, tiene una ubicación clave junto al Aeropuerto Alfonso Bonilla Aragón. Desde la ciudad puedes recorrer las haciendas azucareras del Valle del Cauca, visitar la Basílica del Señor de los Milagros en Buga, explorar Cali a 30 minutos o subir al Lago Calima. Reserva sin anticipos y con descuentos de hasta el 60%. Palmira es un punto de partida práctico para descubrir todo el Valle con la comodidad de un vehículo propio."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Palmira, la Villa de las Palmas y Capital Agrícola de Colombia, es una ciudad pujante en el corazón del Valle del Cauca. Con un carro de alquiler puedes explorar esta ciudad de más de 300.000 habitantes y acceder fácilmente a destinos cercanos como Buga, Cali o el Lago Calima. El Aeropuerto Alfonso Bonilla Aragón de Cali está a solo 20 minutos, facilitando el inicio de tu viaje. Tener vehículo propio te permite recorrer la zona agroindustrial más importante del país, visitar haciendas azucareras históricas, conocer la Basílica de Buga y explorar el corredor turístico del Valle. Palmira combina tradición agrícola, ubicación estratégica y la calidez de la gente vallecaucana.`,
        destinations: [
            {
                name: 'Basílica del Señor de los Milagros (Buga)',
                time: '40 minutos',
                description: 'El santuario más visitado de Colombia, a corta distancia desde Palmira. Millones de peregrinos al año, arquitectura impresionante y dulces típicos de Buga.'
            },
            {
                name: 'Cali',
                time: '30 minutos',
                description: 'La capital de la salsa está a minutos. Zoológico, Cristo Rey, Gato de Tejada, barrios bohemios y la mejor rumba salsera del mundo. Perfecta para un día completo.'
            },
            {
                name: 'Haciendas del Valle del Cauca',
                time: '30 minutos',
                description: 'Recorre haciendas históricas como El Paraíso (de la novela María) o Piedechinche con su museo de la caña. Historia azucarera y arquitectura colonial vallecaucana.'
            },
            {
                name: 'Amaime y zona rural',
                time: '25 minutos',
                description: 'Corregimiento con balnearios en el río Amaime. Restaurantes de campo, sancocho valluno y paisajes de caña de azúcar hasta el horizonte. Domingo típico vallecaucano.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Palmira tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 7:00 PM. Los fines de semana sin restricción.',
            tolls: 'Hacia Buga hay un peaje (~$10.500 COP). Hacia Cali no hay peajes por la vía principal. Las vías del Valle están en excelente estado, planas y bien señalizadas.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Llanogrande y Unicentro hay tarifa con consumo.'
        },
        bestSeason: 'Palmira tiene clima cálido agradable todo el año (23-32°C). Las fiestas patronales en enero y la Feria de la Agricultura en agosto son épocas festivas. La temporada seca de diciembre a marzo es ideal para viajes por carretera. Para Buga, cualquier época es buena aunque domingos y festivos hay más peregrinos.'
    }
