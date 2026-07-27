import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Bucaramanga"
export const citySlug = "bucaramanga"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger el carro alquilado en Bucaramanga?',
            content: getCityPickupAnswer('Bucaramanga')
        },
        {
            label: '¿Qué carro se adapta mejor a Bucaramanga y sus alrededores?',
            content: 'Un sedán es una opción cómoda para la ciudad y las salidas a poblaciones cercanas. Si el plan incluye San Gil, deportes extremos o el Cañón del Chicamocha, recomendamos una camioneta para las vías de montaña.'
        },
        {
            label: '¿Dónde consulto el precio de un alquiler en Bucaramanga?',
            content: getCityPriceAnswer('Bucaramanga')
        },
        {
            label: '¿Un vehículo rentado debe cumplir pico y placa en Bucaramanga?',
            content: 'Sí. La rotación se establece con el último dígito de la placa y te indicaremos la limitación cuando recibas el carro. Durante los fines de semana puedes manejar sin esa restricción.'
        },
        {
            label: '¿Qué ruta tomo para llegar en carro al Cañón del Chicamocha?',
            content: 'Sal por la carretera que conduce a San Gil. El cañón está a 1 hora de Bucaramanga y el trayecto pavimentado ofrece grandes vistas. En el camino puedes detenerte en el Parque Nacional del Chicamocha, Panachi.'
        },
        {
            label: '¿Cuáles son las principales salidas en carro desde Bucaramanga?',
            content: 'La ruta de aventura puede incluir San Gil, a 2 horas; Barichara, pueblo patrimonio a 2.5 horas; el Cañón del Chicamocha, a 1 hora; y el casco colonial de Girón, a 15 minutos. Santander es el destino de aventura de Colombia.'
        }
    ]
