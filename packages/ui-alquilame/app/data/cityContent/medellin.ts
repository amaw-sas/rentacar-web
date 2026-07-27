import type { CityExpandedContent } from './types'

export const cityName = "Medellín"
export const citySlug = "medellin"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Medellín, la Ciudad de la Eterna Primavera, se ha convertido en destino obligado para viajeros de todo el mundo. Recoge tu carro en el Aeropuerto José María Córdova y descubre por qué: la transformación de la Comuna 13, el Parque Arví entre las montañas, el Jardín Botánico en pleno centro, y a dos horas la piedra de Guatapé con su vista de 360 grados. Reserva sin anticipos y aprovecha hasta 60% de descuento. Medellín tiene tanto dentro como fuera del valle que un carro propio multiplica lo que puedes vivir."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Medellín, la Ciudad de la Eterna Primavera, se ha convertido en destino obligado para viajeros de todo el mundo. Recoge tu carro en el Aeropuerto José María Córdova y descubre por qué: la transformación de la Comuna 13, el Parque Arví entre las montañas, el Jardín Botánico en pleno centro, y a dos horas la piedra de Guatapé con su vista de 360 grados. Reserva sin anticipos y aprovecha hasta 60% de descuento. Medellín tiene tanto dentro como fuera del valle que un carro propio multiplica lo que puedes vivir."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Medellín, la ciudad de la eterna primavera, ofrece el clima perfecto para explorar Antioquia en carro. Con temperaturas entre 22-28°C todo el año, puedes disfrutar de pueblos mágicos, paisajes de montaña y la hospitalidad paisa sin preocuparte por el clima. El Aeropuerto José María Córdova está en Rionegro, a 45 minutos del centro, lo que hace ideal recoger tu carro directamente al llegar y comenzar tu aventura. Medellín es el punto de partida perfecto para recorrer el Eje Cafetero, visitar Guatapé, explorar Santa Fe de Antioquia o aventurarte hacia la costa caribe. Con un vehículo propio evitas las limitaciones del transporte público y puedes descubrir joyas escondidas como Jardín, San Rafael o el Peñol a tu propio ritmo.`,
        destinations: [
            {
                name: 'Guatapé y El Peñol',
                time: '2 horas',
                description: 'El pueblo más colorido de Colombia con su famosa piedra de 740 escalones. Vistas espectaculares del embalse, deportes acuáticos y gastronomía local. Imperdible para cualquier visitante.'
            },
            {
                name: 'Santa Fe de Antioquia',
                time: '1.5 horas',
                description: 'Pueblo colonial de clima cálido, perfecto para escapar del fresco de Medellín. Arquitectura histórica, el famoso Puente de Occidente y deliciosos tamarindos.'
            },
            {
                name: 'Jardín',
                time: '3 horas',
                description: 'Considerado uno de los pueblos más bonitos de Colombia. Calles empedradas, arquitectura paisa tradicional, cultivos de café y la Cueva del Esplendor con su cascada interior.'
            },
            {
                name: 'San Rafael',
                time: '2.5 horas',
                description: 'Paraíso de cascadas y ríos cristalinos. Ideal para los amantes de la naturaleza y el ecoturismo. Múltiples pozos naturales para nadar en aguas turquesas.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Medellín tiene pico y placa de lunes a viernes según rotación del último dígito de la placa, en horario continuo de 5:00 AM a 8:00 PM. Los sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Guatapé hay un peaje (~$12.000 COP). Hacia Santa Fe de Antioquia el túnel de occidente tiene peaje (~$15.600 COP). Las vías están en excelente estado.',
            parking: 'El centro y El Poblado tienen parqueaderos entre $3.000-6.000 COP/hora. En centros comerciales como Santafé o El Tesoro suele haber tarifa plana o gratis con consumo.'
        },
        bestSeason: 'Medellín tiene clima primaveral todo el año, pero la temporada más seca es de diciembre a febrero y junio a agosto. La Feria de las Flores en agosto atrae muchos visitantes, así que reserva con anticipación. Para Guatapé y pueblos cercanos, cualquier época es buena, aunque los fines de semana largos tienen más afluencia.'
    }
