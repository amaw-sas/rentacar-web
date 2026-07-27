import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Ibagué"
export const citySlug = "ibague"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Ibagué?',
            content: getCityPickupAnswer('Ibagué')
        },
        {
            label: '¿Qué vehículo recomiendan para Ibagué y el Tolima?',
            content: 'Un sedán es ideal para Ibagué y la vía al Nevado del Tolima. Para visitar el Cañón del Combeima o fincas cafeteras por caminos rurales, recomendamos camioneta por mejor desempeño.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Ibagué?',
            content: getCityPriceAnswer('Ibagué')
        },
        {
            label: '¿Aplica pico y placa en Ibagué?',
            content: 'Sí, Ibagué tiene pico y placa según el último dígito de la placa en horarios pico. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Cómo llego al Cañón del Combeima en carro?',
            content: 'El Cañón del Combeima está a 30 minutos de Ibagué. La vía es pavimentada hasta Juntas, luego destapada hacia el Nevado. Recomendamos camioneta para subir a los termales y cascadas.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Ibagué?',
            content: 'Destinos del Tolima: Cañón del Combeima y Nevado del Tolima (30min), Melgar y Girardot (2h), Honda río Magdalena (2h), Salento por el Alto de la Línea (2.5h). Naturaleza y clima cálido.'
        }
    ]
