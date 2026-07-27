import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Soledad"
export const citySlug = "soledad"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Soledad?',
            content: getCityPickupAnswer('Soledad')
        },
        {
            label: '¿Qué vehículo recomiendan para Soledad?',
            content: 'Un compacto con excelente aire acondicionado es ideal para el clima caribeño de Soledad. Para viajes a Cartagena, Santa Marta o playas, un sedán ofrece más comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Soledad?',
            content: getCityPriceAnswer('Soledad')
        },
        {
            label: '¿Hay pico y placa en Soledad?',
            content: 'Soledad y Barranquilla no tienen restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda el área metropolitana.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Soledad o Barranquilla?',
            content: 'Las tarifas son iguales. Soledad tiene la ventaja de estar junto al aeropuerto, ideal si llegas por avión. Para ir al centro de Barranquilla son solo 20 minutos.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Soledad?',
            content: 'Destinos desde el área metropolitana: Cartagena (2h), Santa Marta y Parque Tayrona (2h), Puerto Colombia playas (30min), Usiacurí artesanías (1h). Todo el Caribe colombiano a tu alcance.'
        }
    ]
