import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Manizales"
export const citySlug = "manizales"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Manizales?',
            content: getCityPickupAnswer('Manizales')
        },
        {
            label: '¿Qué vehículo recomiendan para Manizales?',
            content: 'Manizales es ciudad de montaña con calles empinadas. Un carro con buen torque es importante. Para visitar el Nevado del Ruiz o termales por carreteras rurales, recomendamos camioneta.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Manizales?',
            content: getCityPriceAnswer('Manizales')
        },
        {
            label: '¿Aplica pico y placa en Manizales?',
            content: 'Sí, Manizales tiene pico y placa según el último dígito de la placa en días hábiles. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Puedo subir al Nevado del Ruiz en carro?',
            content: 'Puedes llegar en carro hasta el sector de Las Brisas (4.050 msnm). El acceso al Parque Nacional requiere registro previo. Recomendamos camioneta y salir temprano para evitar neblina.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Manizales?',
            content: 'Destinos de Caldas: Nevado del Ruiz (2h), Termales de Santa Rosa (1.5h), Salamina pueblo patrimonio (2h), Recinto del Pensamiento (20min), y Chinchiná zona cafetera (30min).'
        }
    ]
