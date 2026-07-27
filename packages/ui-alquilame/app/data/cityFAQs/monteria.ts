import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Montería'
export const citySlug = 'monteria'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger mi carro de alquiler en Montería?',
    content: getCityPickupAnswer('Montería'),
  },
  {
    label: '¿Qué vehículo conviene para viajar por Montería y Córdoba?',
    content: 'Un compacto con aire acondicionado funciona bien frente al calor de Montería. Si el recorrido incluye fincas ganaderas, caminos rurales o la zona costera, te recomendamos escoger una camioneta.',
  },
  {
    label: '¿Cómo consulto una tarifa de alquiler de carros en Montería?',
    content: getCityPriceAnswer('Montería'),
  },
  {
    label: '¿Los carros particulares tienen pico y placa en Montería?',
    content: 'No hay una restricción vigente para vehículos particulares. Puedes conducir cualquier día de la semana tanto dentro de Montería como por el resto del departamento.',
  },
  {
    label: '¿Cuánto tarda el viaje desde Montería hasta las playas?',
    content: 'Por carretera pavimentada llegas a Coveñas y Tolú en 1.5 horas. San Antero queda a 1 hora, y desde la costa también salen lanchas con destino a las Islas de San Bernardo.',
  },
  {
    label: '¿Qué destinos de Córdoba puedo recorrer en carro desde Montería?',
    content: 'Lorica, pueblo patrimonio, está a 1 hora; Coveñas y Tolú, a 1.5 horas; la Ciénaga de Ayapel, a 2 horas; y Tierralta con el Nudo de Paramillo, a 2 horas. La región reúne ganadería, playas y naturaleza.',
  },
]
