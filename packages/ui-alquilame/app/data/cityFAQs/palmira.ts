import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Palmira'
export const citySlug = 'palmira'

export const faqs: FAQ[] = [
  {
    label: '¿En qué lugar puedo recibir un carro de alquiler en Palmira?',
    content: getCityPickupAnswer('Palmira'),
  },
  {
    label: '¿Qué carro conviene para manejar desde Palmira?',
    content: 'Un compacto resulta práctico para los trayectos por Palmira y el Valle del Cauca. Si tu itinerario sigue hacia el Lago Calima, Buga o las carreteras de la cordillera, un sedán te dará más comodidad durante las distancias largas.',
  },
  {
    label: '¿Cómo puedo cotizar el alquiler de un vehículo en Palmira?',
    content: getCityPriceAnswer('Palmira'),
  },
  {
    label: '¿Cómo opera el pico y placa para carros en Palmira?',
    content: 'Palmira no tiene pico y placa permanente para carros particulares. La medida que mucha gente recuerda es la de Cali, que es la ciudad vecina.',
  },
  {
    label: '¿Me conviene alquilar el carro en Palmira o en Cali?',
    content: 'Las tarifas son parecidas. Desde Palmira llegas al aeropuerto en 25 minutos, mientras que desde el centro de Cali el trayecto toma 45 minutos. Palmira también ofrece una salida más conveniente cuando el viaje continúa hacia el norte del Valle o el Eje Cafetero.',
  },
  {
    label: '¿A dónde puedo viajar en carro desde Palmira?',
    content: 'Buga y la Basílica del Señor de los Milagros quedan a 30 minutos; Cali también está a media hora. La Hacienda El Paraíso, vinculada con María, se encuentra a 40 minutos. Calcula una hora para el Parque Natural Farallones y una hora y media para el Lago Calima. El conjunto permite alternar historia y naturaleza.',
  },
]
