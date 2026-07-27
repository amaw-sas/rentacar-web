import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Armenia"
export const citySlug = "armenia"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Armenia?',
            content: getCityPickupAnswer('Armenia')
        },
        {
            label: '¿Qué vehículo recomiendan para recorrer el Eje Cafetero?',
            content: 'Un sedán ofrece comodidad para las carreteras del Quindío. Si planeas visitar fincas cafeteras por caminos rurales o subir al Valle del Cocora, una camioneta es mejor opción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Armenia?',
            content: getCityPriceAnswer('Armenia')
        },
        {
            label: '¿Hay pico y placa en Armenia?',
            content: 'Armenia tiene pico y placa rotativo pero con horarios limitados. Te informamos la restricción vigente al entregar el vehículo. La mayoría de destinos turísticos están fuera del área urbana.'
        },
        {
            label: '¿Puedo visitar el Parque del Café con el carro?',
            content: 'Sí, el Parque del Café está a 20 minutos de Armenia con amplio parqueadero. También puedes visitar PANACA (30min) y el Parque Los Arrieros en el mismo día.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Armenia?',
            content: 'Destinos del Quindío: Salento y Valle del Cocora (40min), Filandia (30min), Parque del Café (20min), Buenavista mirador (25min), y fincas cafeteras. Todo el Paisaje Cultural Cafetero a tu alcance.'
        }
    ]
