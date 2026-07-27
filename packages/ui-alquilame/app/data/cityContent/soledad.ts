import type { CityExpandedContent } from './types'

export const cityName = "Soledad"
export const citySlug = "soledad"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Soledad es el municipio más poblado del Atlántico y sede del Aeropuerto Ernesto Cortissoz, lo que la convierte en la entrada natural al área metropolitana de Barranquilla. Recoge tu carro apenas aterrizas y muévete sin restricciones entre Soledad, Barranquilla, Puerto Colombia y las playas de Juan de Acosta. Si vienes para el Carnaval, el carro te permite ir de comparsa en comparsa sin esperar transporte. Reserva sin anticipos, con hasta 60% de descuento y entrega los 7 días. En el Atlántico, tener ruedas propias lo cambia todo."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "Soledad es el municipio más poblado del Atlántico y sede del Aeropuerto Ernesto Cortissoz, lo que la convierte en la entrada natural al área metropolitana de Barranquilla. Recoge tu carro apenas aterrizas y muévete sin restricciones entre Soledad, Barranquilla, Puerto Colombia y las playas de Juan de Acosta. Si vienes para el Carnaval, el carro te permite ir de comparsa en comparsa sin esperar transporte. Reserva sin anticipos, con hasta 60% de descuento y entrega los 7 días. En el Atlántico, tener ruedas propias lo cambia todo."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Soledad, el segundo municipio más poblado del Atlántico, es parte integral del Área Metropolitana de Barranquilla y un importante centro industrial y comercial del Caribe colombiano. Con un carro de alquiler puedes moverte fácilmente entre Soledad, Barranquilla y los destinos turísticos de la costa norte. El Aeropuerto Internacional Ernesto Cortissoz está en Soledad, a solo minutos del centro, lo que hace ideal recoger tu vehículo al llegar. Tener carro propio te permite explorar Barranquilla, visitar Puerto Colombia, aventurarte a Santa Marta o Cartagena, y conocer la vida comercial soledeña. Soledad combina ubicación estratégica, actividad industrial y el espíritu alegre del Carnaval de Barranquilla.`,
        destinations: [
            {
                name: 'Barranquilla',
                time: '20 minutos',
                description: 'La Puerta de Oro de Colombia está al lado. Malecón del Río, Museo del Caribe, zoológico y la mejor vida nocturna del Caribe. El Carnaval de Barranquilla es Patrimonio de la Humanidad.'
            },
            {
                name: 'Puerto Colombia y Salgar',
                time: '35 minutos',
                description: 'Pueblos costeros con el histórico muelle de Puerto Colombia, playas locales y restaurantes de pescado fresco. Paseo dominical tradicional de barranquilleros y soledeños.'
            },
            {
                name: 'Santa Marta y Parque Tayrona',
                time: '2.5 horas',
                description: 'La ciudad más antigua de Sudamérica y el parque natural más icónico de Colombia. Playas vírgenes, Sierra Nevada y biodiversidad única. Road trip imperdible.'
            },
            {
                name: 'Cartagena',
                time: '2.5 horas',
                description: 'La Ciudad Amurallada Patrimonio de la Humanidad. Historia colonial, gastronomía, playas de Barú y atardeceres en las murallas. Destino obligado desde Soledad.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Soledad comparte esquema de pico y placa con Barranquilla: lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 8:00 PM.',
            tolls: 'Hacia Cartagena hay 2 peajes (~$25.000 COP total). Hacia Santa Marta hay 3 peajes (~$30.000 COP total). Hacia Puerto Colombia no hay peajes.',
            parking: 'En zonas comerciales como Gran Centro los parqueaderos cuestan entre $2.500-5.000 COP/hora. Cerca del aeropuerto hay parqueaderos de largo plazo más económicos.'
        },
        bestSeason: 'Soledad tiene clima caliente todo el año (28-35°C), típico del Caribe colombiano. La época del Carnaval (febrero-marzo) es la más festiva pero con alta demanda. La temporada seca de diciembre a abril es ideal para playas. Si buscas precios bajos, considera septiembre a noviembre.'
    }
