import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Bogotá"
export const citySlug = "bogota"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Bogotá?',
            content: getCityPickupAnswer('Bogotá')
        },
        {
            label: '¿Qué vehículo recomiendan para moverse en Bogotá?',
            content: 'Para Bogotá recomendamos carros compactos por su maniobrabilidad en el tráfico y facilidad de parqueo. Si planeas salir hacia Villa de Leyva o el Eje Cafetero, un sedán ofrece más comodidad para viajes largos.'
        },
        {
            label: '¿Aplica pico y placa al carro alquilado en Bogotá?',
            content: 'Sí, los vehículos de alquiler están sujetos al pico y placa de Bogotá según el último dígito de la placa. Te informamos la restricción al momento de la entrega para que puedas planificar tu día.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Bogotá?',
            content: getCityPriceAnswer('Bogotá')
        },
        {
            label: '¿Puedo viajar a otras ciudades con el carro alquilado en Bogotá?',
            content: 'Sí, puedes viajar a cualquier ciudad de Colombia. Destinos populares desde Bogotá incluyen Villa de Leyva (3h), Girardot (2.5h) y el Eje Cafetero (7h). Ofrecemos devolución en otra ciudad con cargo adicional.'
        },
        {
            label: '¿Qué documentos necesito para alquilar en Bogotá?',
            content: 'Necesitas: licencia de conducción vigente, cédula o pasaporte (mayores de 21 años), y tarjeta de crédito con cupo disponible. Para extranjeros, la licencia de su país es válida durante su estadía como turista.'
        }
    ]
