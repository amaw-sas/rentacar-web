import type { CityExpandedContent } from './types'

export const cityName = "Valledupar"
export const citySlug = "valledupar"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Valledupar es acordeones al atardecer, el Río Guatapurí bajando cristalino de la Sierra Nevada y una tradición musical que se siente en cada esquina. Alquila tu carro en el Aeropuerto Alfonso López y recorre la Plaza Alfonso López, el Balneario Hurtado, los pueblos vallenatos de La Paz y San Diego, o adéntrate hacia la Sierra Nevada. Sin anticipos y con descuentos de hasta el 60%. Si vienes durante el Festival Vallenato, el carro te da la libertad de moverte entre parrandas, conciertos y el río sin depender de nadie."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Valledupar, la cuna del vallenato, es una ciudad mágica donde la música es parte del alma de su gente. Con un carro de alquiler puedes explorar esta capital del Cesar y descubrir la Sierra Nevada desde su vertiente oriental, los ríos cristalinos de la Serranía del Perijá y pueblos donde nacieron las leyendas del acordeón. El Aeropuerto Alfonso López Pumarejo te conecta con las principales ciudades colombianas. Tener vehículo propio te permite visitar el río Guatapurí, explorar el balneario Hurtado, conocer pueblos como La Paz y Manaure, y adentrarte en territorio indígena Arhuaco. Valledupar combina música, tradición, naturaleza y la hospitalidad más genuina del Caribe colombiano.`,
        destinations: [
            {
                name: 'Río Guatapurí',
                time: '15 minutos',
                description: 'El río sagrado de Valledupar que baja de la Sierra Nevada. Balneario natural en plena ciudad donde locales y visitantes se refrescan del calor vallenato. Imperdible al atardecer.'
            },
            {
                name: 'Balneario Hurtado',
                time: '30 minutos',
                description: 'Complejo de piscinas naturales y cascadas en el río Badillo. Agua cristalina de la Sierra Nevada, restaurantes típicos y ambiente familiar. El escape favorito de los vallenatos.'
            },
            {
                name: 'La Paz y Nabusímake',
                time: '2 horas',
                description: 'La Paz es cuna de grandes juglares vallenatos. Nabusímake es la capital espiritual del pueblo Arhuaco, visitable con permiso. Cultura indígena viva en la Sierra Nevada.'
            },
            {
                name: 'Manaure Balcón del Cesar',
                time: '1 hora',
                description: 'Pueblo de clima fresco a 1.500 msnm con vistas espectaculares al valle. Café de altura, fresas, y el Festival de la Fraternidad Colombo-Venezolana. Escape del calor intenso.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Valledupar tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:30 a 8:30 AM y de 12:00 a 2:00 PM. Horario diferente al de otras ciudades.',
            tolls: 'Hacia Manaure no hay peajes. Hacia Santa Marta hay varios peajes (~$40.000 COP total). Las vías a balnearios cercanos están en buen estado.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Guatapurí y balnearios hay parqueo informal (~$5.000 COP/día).'
        },
        bestSeason: 'Valledupar es caliente todo el año (28-38°C). El Festival de la Leyenda Vallenata en abril-mayo es el evento más importante de la música colombiana, pero reserva con mucha anticipación. La temporada seca de diciembre a marzo es ideal para balnearios. Para Manaure y zonas altas, cualquier época ofrece clima fresco.'
    }
