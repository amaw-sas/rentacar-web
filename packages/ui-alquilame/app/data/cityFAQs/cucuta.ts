import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Cúcuta"
export const citySlug = "cucuta"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Cúcuta?',
            content: getCityPickupAnswer('Cúcuta')
        },
        {
            label: '¿Qué vehículo recomiendan para Cúcuta?',
            content: 'Un compacto con excelente aire acondicionado es esencial para el clima cálido de Cúcuta (promedio 28°C). Para viajes a Pamplona o la zona montañosa, un sedán ofrece más confort.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cúcuta?',
            content: getCityPriceAnswer('Cúcuta')
        },
        {
            label: '¿Aplica pico y placa en Cúcuta?',
            content: 'Cúcuta tiene pico y placa según el último dígito de la placa en horarios específicos. Te informamos la restricción al entregar el vehículo. Los fines de semana puedes circular libremente.'
        },
        {
            label: '¿Puedo cruzar a Venezuela con el carro alquilado?',
            content: 'No, los vehículos de alquiler no pueden cruzar fronteras internacionales. Si necesitas visitar Venezuela, puedes dejar el carro en nuestra sede y cruzar por el puente internacional.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Cúcuta?',
            content: 'Destinos de Norte de Santander: Pamplona ciudad estudiantil (1.5h), Villa del Rosario sitio histórico (15min), Chinácota clima templado (1h), Ocaña (3h). Historia y comercio fronterizo.'
        }
    ]
