import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Cartagena"
export const citySlug = "cartagena"

export const faqs: FAQ[] = [
        {
            label: '¿Aplica pico y placa en Cartagena?',
            content: 'Sí. Mucha guía sigue diciendo que Cartagena no restringe, pero la medida está vigente de lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 6:00 a 8:00 PM. Te indicamos la restricción de tu vehículo al entregarlo.',
        },
        {
            label: '¿Dónde puedo recoger mi carro reservado en Cartagena?',
            content: getCityPickupAnswer('Cartagena')
        },
        {
            label: '¿Vale la pena tener carro durante una visita a Cartagena?',
            content: 'El centro histórico se recorre a pie. El vehículo resulta útil cuando quieres llegar a Barú o Playa Blanca, tomar el ferry para una salida a las Islas del Rosario o continuar por carretera hacia Barranquilla y Santa Marta.'
        },
        {
            label: '¿Qué categoría de vehículo conviene alquilar en Cartagena?',
            content: 'Un carro compacto es suficiente para circular en Cartagena y llegar hasta Barú. Para hacer la ruta costera o viajar a Santa Marta, elige un sedán con aire acondicionado potente y tendrás mayor comodidad.'
        },
        {
            label: '¿Cómo encuentro el valor del alquiler de carro en Cartagena?',
            content: getCityPriceAnswer('Cartagena')
        },
        {
            label: '¿Se puede conducir el carro alquilado de Cartagena a Santa Marta?',
            content: 'Sí. El recorrido toma 4 horas por una vía segura y bien pavimentada. Si no quieres hacer el regreso, puedes pedir el servicio de una sola vía y entregar el vehículo en Santa Marta.'
        },
        {
            label: '¿Hasta dónde puedo llegar en carro para visitar Playa Blanca?',
            content: 'La playa queda en Barú, a 1 hora de Cartagena, y la carretera llega hasta su parqueadero. Sal temprano si quieres aprovechar el lugar durante todo el día.'
        }
    ]
