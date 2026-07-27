import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Valledupar'
export const citySlug = 'valledupar'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde me entregan el carro de alquiler en Valledupar?',
    content: getCityPickupAnswer('Valledupar'),
  },
  {
    label: '¿Cuál categoría de vehículo conviene para recorrer Valledupar?',
    content: 'Un compacto con buen aire acondicionado es una elección práctica para manejar dentro de Valledupar. Si vas a subir a la Sierra Nevada o entrar por caminos rurales hacia pueblos indígenas, escoge una camioneta para afrontar mejor ese tipo de ruta.',
  },
  {
    label: '¿Dónde veo cuánto vale rentar un carro en Valledupar?',
    content: getCityPriceAnswer('Valledupar'),
  },
  {
    label: '¿Los carros particulares tienen pico y placa en Valledupar?',
    content: 'No hay pico y placa para vehículos particulares en Valledupar. Puedes circular por la ciudad cualquier día de la semana sin depender del número final de la placa.',
  },
  {
    label: '¿Se puede llegar al Guatapurí en un carro alquilado?',
    content: 'Sí. El río Guatapurí cruza Valledupar y cuenta con diferentes accesos a balnearios. El más conocido es el Balneario Hurtado, ubicado a 10 minutos del centro; puedes ir en carro y pasar allí una parte del día para descansar del calor.',
  },
  {
    label: '¿Qué lugares del Cesar quedan al alcance desde Valledupar?',
    content: 'El Guatapurí y sus balnearios están a 10 minutos, mientras que Manaure Balcón del Cesar queda a una hora. Para conocer Pueblo Bello y la Sierra Nevada calcula una hora y media. La Mina, un pueblo patrimonio, está a dos horas. Con estas distancias puedes combinar naturaleza y cultura vallenata en varios recorridos.',
  },
]
