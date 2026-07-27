import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Valledupar"
export const citySlug = "valledupar"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Valledupar?',
            content: getCityPickupAnswer('Valledupar')
        },
        {
            label: '¿Qué vehículo recomiendan para Valledupar?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima cálido de Valledupar. Para visitar la Sierra Nevada o pueblos indígenas, recomendamos camioneta por los caminos rurales.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Valledupar?',
            content: getCityPriceAnswer('Valledupar')
        },
        {
            label: '¿Hay pico y placa en Valledupar?',
            content: 'Valledupar no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad.'
        },
        {
            label: '¿Puedo visitar el Río Guatapurí con carro?',
            content: 'Sí, el Río Guatapurí atraviesa la ciudad y hay varios balnearios accesibles en carro. El más famoso es el Balneario Hurtado a 10 minutos del centro. Ideal para refrescarse del calor.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Valledupar?',
            content: 'Destinos del Cesar: Río Guatapurí y balnearios (10min), Manaure Balcón del Cesar (1h), Pueblo Bello y Sierra Nevada (1.5h), La Mina pueblo patrimonio (2h). Cuna del vallenato y naturaleza.'
        }
    ]
