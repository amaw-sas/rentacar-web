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
    content: 'La medida rota y funciona en horarios limitados. Cuando recibas el vehículo te indicamos la restricción vigente para su placa. Ten presente que la mayoría de los atractivos turísticos queda por fuera del perímetro urbano.',
  },
  {
    label: '¿Puedo llegar en carro al Parque del Café?',
    content: 'Sí. Desde Armenia son 20 minutos y el parque cuenta con bastante espacio para estacionar. En la misma jornada también puedes incluir PANACA, a 30 minutos, y el Parque Los Arrieros.',
  },
  {
    label: '¿Qué lugares del Quindío quedan cerca de Armenia en carro?',
    content: 'El Parque del Café está a 20 minutos, Buenavista y su mirador a 25 minutos, Filandia a 30 minutos, y Salento con el Valle del Cocora a 40 minutos. Las fincas cafeteras completan una ruta por el Paisaje Cultural Cafetero.',
  },
]
