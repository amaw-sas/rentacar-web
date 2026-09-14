import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Villavicencio'
export const citySlug = 'villavicencio'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde recojo el carro reservado en Villavicencio?',
    content: getCityPickupAnswer('Villavicencio'),
  },
  {
    label: '¿Necesito camioneta para hacer una ruta por los Llanos?',
    content: 'Un sedán basta para desplazarte por Villavicencio y por las vías principales. Si piensas entrar a fincas, recorrer caminos rurales o dirigirte hacia La Macarena para el plan de Caño Cristales, necesitas una camioneta 4x4.',
  },
  {
    label: '¿Cómo averiguo la tarifa de un carro de alquiler en Villavicencio?',
    content: getCityPriceAnswer('Villavicencio'),
  },
  {
    label: '¿Aplica pico y placa en Villavicencio?',
    content: 'Sí, no puedes circular cualquier día. La restricción va de lunes a viernes según el último dígito de la placa, de 6:30 a 9:30 AM y de 5:00 a 8:00 PM, dentro de un polígono del centro. Te indicamos la que corresponde a tu placa al entregarte el carro.',
  },
  {
    label: '¿Cuánto demora el viaje por carretera entre Bogotá y Villavicencio?',
    content: 'El recorrido toma cerca de dos horas y media por una vía moderna y pavimentada. En el trayecto cruzas el túnel de Buenavista. De día se aprecia mejor el paisaje del piedemonte llanero durante la llegada.',
  },
  {
    label: '¿Qué planes se pueden hacer en carro saliendo de Villavicencio?',
    content: 'El Bioparque Los Ocarros está a 15 minutos y Puerto López, con su Obelisco, a una hora. También puedes visitar fincas que ofrecen coleo y mamona. Caño Cristales queda en La Macarena y exige tomar un vuelo, por lo que no corresponde a una ruta directa en carro.',
  },
]
