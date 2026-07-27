import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Barranquilla"
export const citySlug = "barranquilla"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Barranquilla?',
            content: getCityPickupAnswer('Barranquilla')
        },
        {
            label: '¿Qué vehículo recomiendan para Barranquilla?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima de Barranquilla. Si planeas visitar otras ciudades de la costa como Cartagena o Santa Marta, un sedán te dará más comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Barranquilla?',
            content: getCityPriceAnswer('Barranquilla')
        },
        {
            label: '¿Puedo viajar a Cartagena o Santa Marta desde Barranquilla?',
            content: 'Sí, Cartagena está a 2 horas y Santa Marta a 1.5 horas. Ambas rutas son seguras y bien pavimentadas. Puedes devolver el carro en cualquiera de estas ciudades.'
        },
        {
            label: '¿Hay pico y placa en Barranquilla?',
            content: 'Actualmente Barranquilla no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Barranquilla?',
            content: 'Destinos recomendados: Cartagena (2h), Santa Marta y Parque Tayrona (2h), Puerto Colombia y sus playas (30min), y Usiacurí, pueblo artesanal (1h).'
        }
    ]
