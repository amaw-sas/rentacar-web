import type { CityExpandedContent } from './types'

export const cityName = "Villavicencio"
export const citySlug = "villavicencio"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Villavicencio es la puerta a los Llanos Orientales, donde Colombia se vuelve horizonte infinito, atardeceres rojos y cultura llanera auténtica. Desde la ciudad explora el Bioparque Los Ocarros, el Mirador de Buenavista y las rutas hacia Acacías, Restrepo y Puerto López — el ombligo de Colombia. Reserva sin anticipos y con hasta 60% de descuento. Los Llanos son extensión pura: hatos ganaderos, ríos y sabana que se recorren con la libertad de un vehículo propio."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Villavicencio, la Puerta al Llano, es donde los Andes se despiden y comienza la inmensa planicie de la Orinoquía colombiana. Con un carro de alquiler puedes explorar esta pujante ciudad y adentrarte en el paisaje llanero de atardeceres infinitos, hatos ganaderos y fauna silvestre. El Aeropuerto Vanguardia te conecta con Bogotá en vuelos cortos, aunque la vía terrestre desde la capital es una experiencia en sí misma. Tener vehículo propio te permite recorrer Caño Cristales (en temporada), visitar Acacías y sus termales, explorar hatos turísticos y vivir la cultura llanera de joropo, mamona y coleo. Villavicencio combina sabana, ríos, biodiversidad y el espíritu libre del llanero colombiano.`,
        destinations: [
            {
                name: 'Caño Cristales (vía La Macarena)',
                time: '45 minutos en avioneta',
                description: 'El río más hermoso del mundo con sus colores únicos. Solo accesible en avioneta desde Villavicencio (junio a noviembre). Experiencia de vida que requiere planificación anticipada.'
            },
            {
                name: 'Acacías y Termales',
                time: '30 minutos',
                description: 'Municipio llanero con el Festival del Retorno y termales naturales. Aguas medicinales, fincas turísticas y el corazón de la cultura llanera. Mamona y joropo garantizados.'
            },
            {
                name: 'Puerto López (Centro Geográfico)',
                time: '1.5 horas',
                description: 'El Ombligo de Colombia, punto geográfico central del país. Obelisco, atardeceres llaneros sobre el río Meta y gastronomía de río. Ruta hacia los llanos profundos.'
            },
            {
                name: 'Bioparque Los Ocarros',
                time: '20 minutos',
                description: 'Zoológico especializado en fauna llanera y amazónica. Dantas, chigüiros, anacondas y jaguares en ambientes naturales. Educación ambiental sobre ecosistemas colombianos.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Villavicencio tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:30 a 8:30 AM y de 5:30 a 7:30 PM. Aplica en el casco urbano.',
            tolls: 'La vía Bogotá-Villavicencio tiene 2 peajes (~$26.000 COP total). Es una vía de montaña espectacular pero con curvas. Hacia Acacías y Puerto López las vías son planas.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Viva Villavicencio y Unicentro hay tarifa con consumo.'
        },
        bestSeason: 'Villavicencio tiene clima cálido-húmedo (24-33°C). La temporada seca de diciembre a marzo es ideal para explorar el llano. Caño Cristales solo está abierto de junio a noviembre cuando el río tiene colores. El Torneo del Joropo en junio-julio es la máxima expresión cultural llanera.'
    }
