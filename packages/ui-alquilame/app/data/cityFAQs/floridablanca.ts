import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Floridablanca"
export const citySlug = "floridablanca"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Floridablanca?',
            content: getCityPickupAnswer('Floridablanca')
        },
        {
            label: '¿Qué vehículo recomiendan para Floridablanca?',
            content: 'Un sedán es ideal para moverse por el área metropolitana de Bucaramanga. Si planeas visitar San Gil, el Cañón del Chicamocha o hacer deportes extremos, recomendamos camioneta.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Floridablanca?',
            content: getCityPriceAnswer('Floridablanca')
        },
        {
            label: '¿Aplica pico y placa en Floridablanca?',
            content: 'Floridablanca comparte el pico y placa del área metropolitana de Bucaramanga. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Floridablanca o Bucaramanga?',
            content: 'No hay diferencia en tarifas ni condiciones. Floridablanca está a 15 minutos de Bucaramanga. Elige la sede más conveniente para tu ubicación. Ambas tienen acceso fácil a las vías principales.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Floridablanca?',
            content: 'Destinos desde el área metropolitana: San Gil capital extrema (2h), Barichara pueblo más lindo de Colombia (2.5h), Cañón del Chicamocha (1h), Mesa de los Santos (45min). Aventura santandereana.'
        }
    ]
