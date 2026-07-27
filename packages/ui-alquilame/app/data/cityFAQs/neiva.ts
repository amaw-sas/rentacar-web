import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Neiva'
export const citySlug = 'neiva'

export const faqs: FAQ[] = [
  {
    label: '¿En qué punto recibo el carro que alquilé en Neiva?',
    content: getCityPickupAnswer('Neiva'),
  },
  {
    label: '¿Qué tipo de carro sirve para viajar por Neiva y el Huila?',
    content: 'Para conducir por Neiva, un sedán con buen aire acondicionado responde bien al clima cálido. Si tu ruta incluye el Desierto de la Tatacoa o San Agustín, elige una camioneta: tendrás una opción más adecuada para las carreteras de montaña de esos recorridos.',
  },
  {
    label: '¿Cómo consulto el precio del alquiler de un carro en Neiva?',
    content: getCityPriceAnswer('Neiva'),
  },
  {
    label: '¿Qué debo saber del pico y placa antes de manejar en Neiva?',
    content: 'La medida funciona en días hábiles y rota de acuerdo con el último dígito de la placa. Cuando recibas el carro te indicaremos la restricción vigente para que organices tus trayectos. Los fines de semana no hay restricción.',
  },
  {
    label: '¿Cuál es la ruta en carro desde Neiva hasta la Tatacoa?',
    content: 'Toma la vía hacia Villavieja; el trayecto pavimentado hasta el Desierto de la Tatacoa dura 45 minutos. Una buena opción es llegar al atardecer y alargar la visita hasta la noche para asistir a la observación de estrellas en el observatorio astronómico.',
  },
  {
    label: '¿Qué recorridos puedo armar desde Neiva con un carro alquilado?',
    content: 'Puedes ir al Desierto de la Tatacoa en 45 minutos, a los termales de Rivera en 30 minutos o a la represa de Betania en una hora. Para viajes más largos, calcula tres horas hasta Pitalito y cuatro hasta San Agustín y su parque arqueológico. La mezcla de arqueología y naturaleza permite organizar varios días distintos.',
  },
]
