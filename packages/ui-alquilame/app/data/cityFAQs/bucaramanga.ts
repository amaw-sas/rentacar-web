import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Bucaramanga"
export const citySlug = "bucaramanga"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Bucaramanga?',
            content: getCityPickupAnswer('Bucaramanga')
        },
        {
            label: '¿Qué vehículo recomiendan para Bucaramanga y alrededores?',
            content: 'Un sedán es ideal para la ciudad y viajes a pueblos cercanos. Para San Gil y deportes extremos o el Cañón del Chicamocha, recomendamos camioneta por las carreteras de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Bucaramanga?',
            content: getCityPriceAnswer('Bucaramanga')
        },
        {
            label: '¿Aplica pico y placa en Bucaramanga?',
            content: 'Sí, Bucaramanga tiene pico y placa rotativo según el último dígito de la placa. Te informamos la restricción al entregar el vehículo. Los fines de semana puedes circular sin restricción.'
        },
        {
            label: '¿Cómo llego al Cañón del Chicamocha en carro?',
            content: 'El Cañón del Chicamocha está a 1 hora de Bucaramanga por la vía a San Gil. La carretera es pavimentada con vistas espectaculares. Puedes parar en el Parque Nacional del Chicamocha (Panachi).'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Bucaramanga?',
            content: 'Destinos de aventura: San Gil y deportes extremos (2h), Barichara pueblo patrimonio (2.5h), Cañón del Chicamocha (1h), y Girón pueblo colonial (15min). Santander es el destino de aventura de Colombia.'
        }
    ]
