import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Pereira"
export const citySlug = "pereira"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Pereira?',
            content: getCityPickupAnswer('Pereira')
        },
        {
            label: '¿Qué vehículo recomiendan para el Eje Cafetero?',
            content: 'Un sedán es ideal para recorrer el Eje Cafetero con comodidad. Si planeas visitar fincas cafeteras por caminos destapados o el Valle del Cocora, una camioneta te dará mejor desempeño.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Pereira?',
            content: getCityPriceAnswer('Pereira')
        },
        {
            label: '¿Aplica pico y placa en Pereira?',
            content: 'Sí, Pereira tiene pico y placa según el último dígito de la placa de lunes a viernes. Te informamos la restricción al entregar el vehículo. Los fines de semana y festivos no hay restricción.'
        },
        {
            label: '¿Puedo visitar Salento y el Valle del Cocora con el carro?',
            content: 'Sí, Salento está a 45 minutos de Pereira. Puedes llegar en carro hasta el pueblo y tomar un Willys al Valle del Cocora, o si tienes camioneta, subir directamente. La ruta es pavimentada hasta Salento.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Pereira?',
            content: 'Destinos del Eje Cafetero: Salento y Valle del Cocora (45min), Filandia (40min), Santa Rosa de Cabal y termales (30min), Manizales (1h), y Armenia (45min). Paisaje Cultural Cafetero Patrimonio UNESCO.'
        }
    ]
