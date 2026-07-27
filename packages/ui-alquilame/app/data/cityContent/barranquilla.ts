import type { CityExpandedContent } from './types'

export const cityName = "Barranquilla"
export const citySlug = "barranquilla"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "La Puerta de Oro de Colombia te espera con su Carnaval, su brisa caribeña y su energía inagotable. Alquila tu carro en el Aeropuerto Ernesto Cortissoz y recorre Barranquilla sin límites: el Malecón del Río al atardecer, el Museo del Caribe para entender la cultura costeña o el Zoológico con los más pequeños. Reserva sin anticipos, con precios bajos y disponibilidad inmediata. Ya sea por negocios o por la fiesta más grande de Colombia, en Barranquilla tener carro propio marca la diferencia."

// Keep this independent from the short SEO meta so all three editorial separators survive.
export const pullQuoteSource = "La Puerta de Oro de Colombia te espera con su Carnaval, su brisa caribeña y su energía inagotable. Alquila tu carro en el Aeropuerto Ernesto Cortissoz y recorre Barranquilla sin límites: el Malecón del Río al atardecer, el Museo del Caribe para entender la cultura costeña o el Zoológico con los más pequeños. Reserva sin anticipos, con precios bajos y disponibilidad inmediata. Ya sea por negocios o por la fiesta más grande de Colombia, en Barranquilla tener carro propio marca la diferencia."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
        intro: `Barranquilla, la Puerta de Oro de Colombia, es una ciudad vibrante donde nació el Carnaval más importante del país. Con un carro de alquiler puedes explorar esta metrópoli de más de 1.2 millones de habitantes y sus alrededores caribeños con total libertad. El Aeropuerto Internacional Ernesto Cortissoz te conecta con las principales ciudades, siendo el punto estratégico para recorrer la costa norte. Tener vehículo propio te permite visitar el Malecón del Río, conocer el Museo del Caribe, escapar a las playas de Puerto Colombia y aventurarte a destinos cercanos como Santa Marta o Cartagena. Barranquilla combina cultura, gastronomía costeña y la alegría de su gente en una experiencia auténtica lejos del turismo masivo.`,
        destinations: [
            {
                name: 'Puerto Colombia y Salgar',
                time: '30 minutos',
                description: 'Pueblos costeros con historia y playas locales. El muelle de Puerto Colombia fue el más largo de Latinoamérica. Pescado fresco y ambiente relajado de pueblo de mar.'
            },
            {
                name: 'Santa Marta y Parque Tayrona',
                time: '2 horas',
                description: 'La ciudad más antigua de Colombia y el parque natural más visitado del país. Playas vírgenes, Sierra Nevada y biodiversidad única. Imperdible desde Barranquilla.'
            },
            {
                name: 'Cartagena',
                time: '2 horas',
                description: 'La ciudad amurallada Patrimonio de la Humanidad está a solo 2 horas. Ideal para un día completo explorando historia colonial, gastronomía y arquitectura única.'
            },
            {
                name: 'Bocas de Ceniza',
                time: '45 minutos',
                description: 'Donde el río Magdalena se encuentra con el mar Caribe. Experiencia única en tren turístico sobre los tajamares. Paisaje industrial-natural impresionante.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Barranquilla tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 8:00 PM. Sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Cartagena hay 2 peajes (~$25.000 COP total). Hacia Santa Marta hay 3 peajes (~$30.000 COP total). Hacia Puerto Colombia no hay peajes.',
            parking: 'En el norte y zonas comerciales los parqueaderos cuestan entre $3.000-6.000 COP/hora. En centros comerciales como Buenavista o Portal del Prado suele haber tarifa con consumo.'
        },
        bestSeason: 'Barranquilla tiene clima caliente todo el año (28-35°C). El Carnaval de Barranquilla (febrero-marzo) es la época más festiva pero con alta demanda. La temporada seca de diciembre a abril es ideal para playas. Si buscas precios bajos y menos calor, considera septiembre a noviembre.'
    }
