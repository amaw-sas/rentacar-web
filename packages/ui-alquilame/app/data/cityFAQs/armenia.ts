import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Armenia'
export const citySlug = 'armenia'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger el carro de alquiler en Armenia?',
    content: getCityPickupAnswer('Armenia'),
  },
  {
    label: '¿Necesito una camioneta para viajar por el Quindío?',
    content: 'No para las vías principales: un sedán brinda comodidad en las carreteras del Quindío. La camioneta es mejor alternativa si visitarás fincas cafeteras por caminos rurales o subirás al Valle del Cocora.',
  },
  {
    label: '¿Qué factores cambian el precio del alquiler en Armenia?',
    content: getCityPriceAnswer('Armenia'),
  },
  {
    label: '¿Cómo funciona el pico y placa para un carro alquilado en Armenia?',
    content: 'Sí aplica, y no es corto: rige de 7:00 AM a 7:00 PM de lunes a viernes, en todo el perímetro urbano. Te indicamos la restricción vigente para tu placa cuando recibas el vehículo.',
  },
  {
    label: '¿Puedo llegar en carro al Parque del Café?',
    content: 'Sí. Desde Armenia son 20 minutos y el parque cuenta con bastante espacio para parquear. En la misma jornada también puedes incluir PANACA, a 30 minutos, y el Parque Los Arrieros.',
  },
  {
    label: '¿Qué lugares del Quindío quedan cerca de Armenia en carro?',
    content: 'El Parque del Café está a 20 minutos, Buenavista y su mirador a 25 minutos, Filandia a 30 minutos, y Salento con el Valle del Cocora a 40 minutos. Las fincas cafeteras completan una ruta por el Paisaje Cultural Cafetero.',
  },
]
