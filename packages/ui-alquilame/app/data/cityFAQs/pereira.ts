import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Pereira'
export const citySlug = 'pereira'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger el carro que alquile en Pereira?',
    content: getCityPickupAnswer('Pereira'),
  },
  {
    label: '¿Me sirve un sedán para recorrer el Eje Cafetero desde Pereira?',
    content: 'Sí. Un sedán permite viajar con comodidad por las carreteras principales del Eje Cafetero. Elige una camioneta si vas a entrar a fincas por vías destapadas o planeas subir al Valle del Cocora.',
  },
  {
    label: '¿De qué depende la tarifa de alquiler de carros en Pereira?',
    content: getCityPriceAnswer('Pereira'),
  },
  {
    label: '¿Cuándo debo tener en cuenta el pico y placa de Pereira?',
    content: 'La restricción aplica de lunes a viernes y rota según el último dígito de la placa. Al entregarte el carro te contamos cuál medida le corresponde. Sábados, domingos y festivos puedes circular sin esa limitación.',
  },
  {
    label: '¿Cómo visito Salento y el Valle del Cocora desde Pereira?',
    content: 'Salento queda a 45 minutos de Pereira por una carretera pavimentada. Puedes estacionar en el pueblo y continuar al valle en un Willys; si viajas en camioneta, también puedes subir directamente.',
  },
  {
    label: '¿Qué ruta puedo armar en carro por los alrededores de Pereira?',
    content: 'Desde Pereira puedes enlazar Filandia en 40 minutos, Santa Rosa de Cabal y sus termales en 30 minutos, Salento y el Valle del Cocora en 45 minutos, Armenia en 45 minutos y Manizales en 1 hora. Todos hacen parte del Paisaje Cultural Cafetero, reconocido por la UNESCO.',
  },
]
