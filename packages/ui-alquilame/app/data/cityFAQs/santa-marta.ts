import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Santa Marta"
export const citySlug = "santa-marta"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Santa Marta?',
            content: getCityPickupAnswer('Santa Marta')
        },
        {
            label: '¿Qué vehículo recomiendan para Santa Marta?',
            content: 'Un compacto con aire acondicionado es ideal para la ciudad y playas cercanas. Para visitar el Parque Tayrona o Minca, recomendamos camioneta por los caminos de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Santa Marta?',
            content: getCityPriceAnswer('Santa Marta')
        },
        {
            label: '¿Puedo entrar al Parque Tayrona con carro?',
            content: 'Puedes llegar en carro hasta el parqueadero de El Zaino (entrada principal) o Calabazo. Desde allí el acceso es a pie o en transporte interno del parque. El carro queda seguro en los parqueaderos.'
        },
        {
            label: '¿Hay pico y placa en Santa Marta?',
            content: 'Santa Marta no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Santa Marta?',
            content: 'Destinos imperdibles: Parque Tayrona (45min), Minca y sus cascadas (45min), Taganga (15min), Palomino (1.5h), y Cartagena (4h). Un carro te da libertad para explorar la Sierra Nevada.'
        }
    ]
