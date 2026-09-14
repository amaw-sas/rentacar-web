import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Ibagué'
export const citySlug = 'ibague'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger un carro de alquiler en Ibagué?',
    content: getCityPickupAnswer('Ibagué'),
  },
  {
    label: '¿Qué carro debería elegir para recorrer Ibagué y el Tolima?',
    content: 'Un sedán funciona bien dentro de Ibagué y en la vía hacia el Nevado del Tolima. Para entrar al Cañón del Combeima o recorrer caminos rurales que llevan a fincas cafeteras, una camioneta ofrece mejor desempeño.',
  },
  {
    label: '¿Cómo puedo consultar el precio de alquiler en Ibagué?',
    content: getCityPriceAnswer('Ibagué'),
  },
  {
    label: '¿Debo revisar el pico y placa antes de conducir en Ibagué?',
    content: 'Sí, de 6:00 AM a 9:00 PM de lunes a viernes. Los carros matriculados en Ibagué descansan en hora valle; una placa de otra ciudad no tiene esa pausa. Te explicamos la medida al entregarte el vehículo.',
  },
  {
    label: '¿Qué condiciones tiene la vía al Cañón del Combeima?',
    content: 'El cañón está a 30 minutos de Ibagué. La carretera mantiene pavimento hasta Juntas y luego se vuelve destapada rumbo al Nevado. Si quieres continuar hacia los termales y las cascadas, recomendamos una camioneta.',
  },
  {
    label: '¿A qué destinos puedo viajar por carretera desde Ibagué?',
    content: 'El Cañón del Combeima y el Nevado del Tolima quedan a 30 minutos; Melgar y Girardot, a 2 horas; Honda y el río Magdalena, a 2 horas; y Salento, cruzando el Alto de la Línea, a 2.5 horas. La ruta combina montaña y clima cálido.',
  },
]
