import type { CityExpandedContent } from './types'

export const cityName = "Santa Marta"
export const citySlug = "santa-marta"

export const metaDescription = "Alquiler de carros en Santa Marta para conectar la bahía con Tayrona, Minca, Taganga y Palomino, entre el Caribe y la Sierra Nevada."

export const pullQuoteSource = "Santa Marta cambia de paisaje en pocos kilómetros: bahía, selva y montaña comparten la misma ruta. Con carro puedes amanecer rumbo a Tayrona y buscar el aire fresco de Minca al día siguiente. Taganga y Palomino quedan como paradas posibles, no como excursiones atadas a un horario ajeno."

export const content: CityExpandedContent = {
        intro: `En Santa Marta, el mar Caribe, la selva y las cumbres nevadas de la Sierra aparecen separados por pocos kilómetros. La ciudad más antigua de Colombia, fundada en 1525, es la entrada natural al Parque Tayrona y conserva además la historia del lugar donde murió el Libertador Simón Bolívar. El Aeropuerto Internacional Simón Bolívar la conecta con las principales ciudades del país y permite iniciar la ruta desde la costa. El alquiler de carros en Santa Marta es especialmente útil porque muchos de sus atractivos están fuera del centro: puedes subir a Minca, llegar a playas remotas como Palomino, visitar Tayrona sin depender de un grupo y recorrer pueblos de la Zona Bananera. Un vehículo también da espacio para llevar lo necesario en días de playa o montaña. Tú decides si cada jornada termina junto a la bahía, entre el bosque tropical o en el aire más fresco de la Sierra Nevada.`,
        destinations: [
            {
                name: 'Parque Nacional Tayrona',
                time: '45 minutos',
                description: 'En el parque natural más emblemático del país, los caminos atraviesan la selva hasta playas vírgenes como Cabo San Juan. Allí la Sierra Nevada llega al mar. Compra la entrada con anticipación.'
            },
            {
                name: 'Minca',
                time: '45 minutos',
                description: 'Sube hasta este pueblo de la Sierra Nevada, ubicado a 650 metros sobre el nivel del mar. Sus fincas de café, cascadas, aves y temperatura fresca ofrecen una pausa frente al calor costero.'
            },
            {
                name: 'Palomino',
                time: '1.5 horas',
                description: 'El río Palomino desemboca aquí en el mar, junto a una playa de espíritu bohemio cada vez más conocida. Puedes hacer tubing, practicar surf y cerrar el día con el ambiente mochilero del lugar.'
            },
            {
                name: 'Taganga',
                time: '15 minutos',
                description: 'Este antiguo poblado pesquero se convirtió en un destino de buceo. Su bahía tranquila reúne restaurantes de mariscos frescos y sirve como salida en lancha hacia otras playas cercanas.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Los vehículos particulares pueden circular cualquier día y a cualquier hora, pues Santa Marta no les aplica restricción de pico y placa.',
            tolls: 'Hacia Palomino se paga un peaje de unos $9.200 COP. El recorrido a Barranquilla incluye 3, que suman cerca de $30.000 COP. Para subir a Minca o llegar a Taganga no pasas por ninguno.',
            parking: 'Una hora en los estacionamientos del centro histórico o El Rodadero cuesta entre $3.000 y $6.000 COP. En Taganga hay pocos lugares para parquear y encontrarlos se vuelve más difícil durante la temporada alta.'
        },
        bestSeason: 'La temperatura de Santa Marta oscila entre 28 y 34 °C durante todo el año. De diciembre a abril, el tiempo seco favorece las jornadas de playa y las caminatas en Tayrona. El parque cierra cada año en febrero y junio para su recuperación ecológica, así que verifica las fechas antes de salir. Minca recibe visitantes en cualquier temporada, aunque las lluvias son más frecuentes entre mayo y noviembre.'
    }
