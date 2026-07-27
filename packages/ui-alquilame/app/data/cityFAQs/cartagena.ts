import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Cartagena"
export const citySlug = "cartagena"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Cartagena?',
            content: getCityPickupAnswer('Cartagena')
        },
        {
            label: '¿Necesito carro para moverme en Cartagena?',
            content: 'El centro histórico es peatonal, pero un carro es ideal para visitar playas como Barú, Playa Blanca, o escapadas a Islas del Rosario (ferry). También facilita ir a Santa Marta o Barranquilla.'
        },
        {
            label: '¿Qué vehículo recomiendan para Cartagena?',
            content: 'Un compacto es suficiente para Cartagena y Barú. Si planeas viajar a Santa Marta o hacer el recorrido por la costa, un sedán con aire acondicionado potente te dará mayor confort.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cartagena?',
            content: getCityPriceAnswer('Cartagena')
        },
        {
            label: '¿Puedo viajar a Santa Marta con el carro de Cartagena?',
            content: 'Sí, Santa Marta está a 4 horas por carretera. Es una ruta segura y bien pavimentada. Puedes devolver el carro en Santa Marta si prefieres no regresar. Ofrecemos servicio one-way.'
        },
        {
            label: '¿Cómo llego a Playa Blanca con carro?',
            content: 'Playa Blanca está en Barú, a 1 hora de Cartagena. Puedes llegar en carro hasta el parqueadero de la playa. Recomendamos salir temprano para disfrutar el día completo.'
        }
    ]
