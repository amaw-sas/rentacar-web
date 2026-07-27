import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Medellín"
export const citySlug = "medellin"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Medellín?',
            content: getCityPickupAnswer('Medellín')
        },
        {
            label: '¿Qué vehículo recomiendan para Medellín y alrededores?',
            content: 'Para Medellín ciudad un compacto es ideal. Si planeas visitar Guatapé, Santa Fe de Antioquia o el Eje Cafetero, recomendamos sedán o camioneta para mayor comodidad en las carreteras de montaña.'
        },
        {
            label: '¿Aplica pico y placa en Medellín?',
            content: 'Sí, Medellín tiene pico y placa según el último dígito de la placa. Te informamos la restricción al entregar el vehículo. Los sábados, domingos y festivos no hay restricción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Medellín?',
            content: getCityPriceAnswer('Medellín')
        },
        {
            label: '¿Puedo devolver el carro en otra ciudad diferente a Medellín?',
            content: 'Sí, ofrecemos devolución en cualquiera de nuestras 19 ciudades. Destinos frecuentes desde Medellín: Cartagena, Santa Marta y el Eje Cafetero. El cargo por traslado varía según la distancia.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Medellín?',
            content: 'Destinos imperdibles: Guatapé y El Peñol (2h), Santa Fe de Antioquia (1.5h), Jardín (3h), y San Rafael (2.5h). Un carro te da libertad para explorar pueblos y paisajes a tu ritmo.'
        }
    ]
