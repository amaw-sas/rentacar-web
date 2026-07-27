import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Cali"
export const citySlug = "cali"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Cali?',
            content: getCityPickupAnswer('Cali')
        },
        {
            label: '¿Qué vehículo recomiendan para Cali?',
            content: 'Para Cali ciudad un compacto es perfecto. Si planeas visitar el Pacífico (Buenaventura) o San Cipriano, una camioneta ofrece mejor desempeño en esas rutas. Para el Eje Cafetero, un sedán es ideal.'
        },
        {
            label: '¿Aplica pico y placa en Cali?',
            content: 'Sí, Cali tiene restricción de pico y placa según el último dígito de la placa. Te informamos al entregar el vehículo. Los fines de semana y festivos puedes circular sin restricción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cali?',
            content: getCityPriceAnswer('Cali')
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Cali?',
            content: 'Destinos populares: Buga y el Señor de los Milagros (1.5h), Lago Calima (2h), Popayán (3h), y el Parque Natural Farallones. El carro te permite explorar el Valle del Cauca con total libertad.'
        },
        {
            label: '¿Puedo viajar al Pacífico con el carro alquilado?',
            content: 'Sí, puedes viajar a Buenaventura y la costa Pacífica. Recomendamos camioneta para mayor comodidad. Algunas zonas requieren precauciones especiales que te indicamos al momento de la reserva.'
        }
    ]
