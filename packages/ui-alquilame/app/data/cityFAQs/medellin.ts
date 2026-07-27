import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Medellín"
export const citySlug = "medellin"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger el carro que reserve en Medellín?',
            content: getCityPickupAnswer('Medellín')
        },
        {
            label: '¿Cuál vehículo funciona mejor en Medellín y sus carreteras?',
            content: 'Para los desplazamientos dentro de la ciudad suele bastar un compacto. Si vas a conducir hasta Guatapé, Santa Fe de Antioquia o el Eje Cafetero, un sedán o una camioneta te dará mayor comodidad en las vías de montaña.'
        },
        {
            label: '¿Debo tener en cuenta el pico y placa de Medellín?',
            content: 'Sí. La restricción se asigna con el último número de la placa y te explicaremos cuál corresponde cuando entreguemos el vehículo. La medida no rige los sábados, domingos ni días festivos.'
        },
        {
            label: '¿Dónde veo la tarifa de un carro de alquiler en Medellín?',
            content: getCityPriceAnswer('Medellín')
        },
        {
            label: '¿Puedo entregar el vehículo fuera de Medellín?',
            content: 'Sí. Puedes elegir como punto de devolución cualquiera de nuestras 19 ciudades. Cartagena, Santa Marta y las ciudades del Eje Cafetero son destinos frecuentes desde Medellín; el valor adicional del traslado cambia según la distancia.'
        },
        {
            label: '¿Qué recorridos por carretera salen de Medellín?',
            content: 'Puedes llegar a Guatapé y El Peñol en 2 horas, a Santa Fe de Antioquia en 1.5 horas, a Jardín en 3 horas y a San Rafael en 2.5 horas. Al ir en carro decides tus paradas y el tiempo que pasas en cada pueblo.'
        }
    ]
