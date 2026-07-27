import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Palmira"
export const citySlug = "palmira"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Palmira?',
            content: getCityPickupAnswer('Palmira')
        },
        {
            label: '¿Qué vehículo recomiendan para Palmira?',
            content: 'Un compacto es perfecto para Palmira y el Valle del Cauca. Si planeas visitar el Lago Calima, Buga o hacer rutas por la cordillera, un sedán te dará mayor comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Palmira?',
            content: getCityPriceAnswer('Palmira')
        },
        {
            label: '¿Hay pico y placa en Palmira?',
            content: 'Palmira tiene pico y placa según el último dígito de la placa en días hábiles. Te informamos la restricción vigente al entregar el vehículo. Fines de semana sin restricción vehicular.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Palmira o Cali?',
            content: 'Las tarifas son similares. Palmira está más cerca del aeropuerto (25min vs 45min a Cali centro). Si tu destino es el norte del Valle o el Eje Cafetero, Palmira puede ser más conveniente.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Palmira?',
            content: 'Destinos del Valle: Buga y el Señor de los Milagros (30min), Lago Calima (1.5h), Cali (30min), Parque Natural Farallones (1h), Hacienda El Paraíso de María (40min). Historia y naturaleza.'
        }
    ]
