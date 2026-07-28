import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Soledad'
export const citySlug = 'soledad'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde recibo el carro de alquiler cuando llego a Soledad?',
    content: getCityPickupAnswer('Soledad'),
  },
  {
    label: '¿Qué clase de carro es práctica para salir desde Soledad?',
    content: 'Un compacto con aire acondicionado de buen desempeño se adapta al calor de Soledad. Si piensas viajar por carretera hasta Cartagena, Santa Marta o las playas del Atlántico, un sedán ofrece un nivel adicional de comodidad.',
  },
  {
    label: '¿Cómo conozco el costo de alquilar un carro en Soledad?',
    content: getCityPriceAnswer('Soledad'),
  },
  {
    label: '¿Existe pico y placa para particulares en Soledad?',
    content: 'Los vehículos particulares no tienen pico y placa en Soledad ni en Barranquilla. Puedes circular por el área metropolitana cualquier día de la semana sin una restricción asociada al número de la placa.',
  },
  {
    label: '¿Es mejor alquilar en Soledad o en Barranquilla?',
    content: 'La tarifa es la misma. Soledad está junto al aeropuerto, una ventaja si llegas en avión y quieres recibir el carro de inmediato. Desde allí tardas apenas 20 minutos en alcanzar el centro de Barranquilla.',
  },
  {
    label: '¿Qué destinos del Caribe puedo visitar desde Soledad?',
    content: 'Puerto Colombia y sus playas están a 30 minutos, y Usiacurí, conocido por sus artesanías, queda a una hora. Para un viaje más largo, calcula dos horas tanto hacia Cartagena como hacia Santa Marta y el Parque Tayrona. Son rutas que permiten recorrer distintos paisajes del Caribe colombiano.',
  },
]
