import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Santa Marta"
export const citySlug = "santa-marta"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro de alquiler en Santa Marta?',
            content: getCityPickupAnswer('Santa Marta')
        },
        {
            label: '¿Qué vehículo es adecuado para viajar por Santa Marta?',
            content: 'Para la ciudad y las playas más próximas, elige un compacto con aire acondicionado. Si quieres conocer el Parque Tayrona o subir a Minca, recomendamos una camioneta por los caminos montañosos.'
        },
        {
            label: '¿Cómo consulto el precio de alquiler de carro en Santa Marta?',
            content: getCityPriceAnswer('Santa Marta')
        },
        {
            label: '¿Hasta qué punto del Parque Tayrona se permite llegar en carro?',
            content: 'Puedes conducir hasta los estacionamientos de El Zaino, la entrada principal, o de Calabazo. A partir de allí debes continuar caminando o usar el transporte interno del parque; el vehículo queda seguro en el parqueadero.'
        },
        {
            label: '¿Existe pico y placa para particulares en Santa Marta?',
            content: 'No. Los carros particulares no tienen esa limitación en Santa Marta y pueden circular por la ciudad cualquier día de la semana.'
        },
        {
            label: '¿Qué destinos puedo conectar por carretera desde Santa Marta?',
            content: 'Tayrona y Minca con sus cascadas quedan a 45 minutos; Taganga, a 15 minutos; Palomino, a 1.5 horas; y Cartagena, a 4 horas. El carro te permite organizar a tu manera la exploración de la Sierra Nevada.'
        }
    ]
