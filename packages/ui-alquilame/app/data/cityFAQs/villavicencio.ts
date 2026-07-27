import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Villavicencio"
export const citySlug = "villavicencio"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Villavicencio?',
            content: getCityPickupAnswer('Villavicencio')
        },
        {
            label: '¿Qué vehículo recomiendan para los Llanos?',
            content: 'Un sedán es suficiente para Villavicencio y vías principales. Si planeas explorar fincas llaneras, rutas rurales o ir hacia Caño Cristales (La Macarena), una camioneta 4x4 es indispensable.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Villavicencio?',
            content: getCityPriceAnswer('Villavicencio')
        },
        {
            label: '¿Hay pico y placa en Villavicencio?',
            content: 'Villavicencio no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad y el departamento.'
        },
        {
            label: '¿Cómo es la vía Bogotá-Villavicencio?',
            content: 'La vía Bogotá-Villavicencio es moderna y pavimentada (2.5h). Pasas por el túnel de Buenavista. Recomendamos viajar de día para disfrutar el paisaje del piedemonte llanero.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Villavicencio?',
            content: 'Destinos llaneros: Bioparque Los Ocarros (15min), Puerto López y el Obelisco (1h), Caño Cristales en La Macarena (requiere vuelo), fincas con coleo y mamona. Vive la cultura llanera.'
        }
    ]
