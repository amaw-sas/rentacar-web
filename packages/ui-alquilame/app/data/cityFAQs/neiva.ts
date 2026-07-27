import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Neiva"
export const citySlug = "neiva"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Neiva?',
            content: getCityPickupAnswer('Neiva')
        },
        {
            label: '¿Qué vehículo recomiendan para Neiva y el Huila?',
            content: 'Un sedán con buen aire acondicionado es ideal para el clima cálido de Neiva. Para el Desierto de la Tatacoa o San Agustín, recomendamos camioneta por las carreteras de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Neiva?',
            content: getCityPriceAnswer('Neiva')
        },
        {
            label: '¿Hay pico y placa en Neiva?',
            content: 'Neiva tiene pico y placa rotativo según el último dígito de la placa en días hábiles. Te informamos la restricción vigente al entregar el vehículo. Fines de semana sin restricción.'
        },
        {
            label: '¿Cómo llego al Desierto de la Tatacoa en carro?',
            content: 'El Desierto de la Tatacoa está a 45 minutos de Neiva por Villavieja. La vía es pavimentada. Recomendamos llegar al atardecer para ver las estrellas en el observatorio astronómico.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Neiva?',
            content: 'Destinos del Huila: Desierto de la Tatacoa (45min), San Agustín y parque arqueológico (4h), Represa de Betania (1h), Termales de Rivera (30min), Pitalito (3h). Arqueología y naturaleza única.'
        }
    ]
