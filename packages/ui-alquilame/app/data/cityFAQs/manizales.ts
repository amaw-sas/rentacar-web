import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Manizales'
export const citySlug = 'manizales'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger mi carro alquilado en Manizales?',
    content: getCityPickupAnswer('Manizales'),
  },
  {
    label: '¿Qué tipo de carro conviene para las lomas de Manizales?',
    content: 'Busca un vehículo con buen torque para las calles empinadas de la ciudad. Una camioneta es la opción recomendada cuando el itinerario incluye el Nevado del Ruiz, los termales o carreteras rurales.',
  },
  {
    label: '¿Cómo se calcula el precio de un alquiler de carros en Manizales?',
    content: getCityPriceAnswer('Manizales'),
  },
  {
    label: '¿El pico y placa de Manizales afecta a los carros alquilados?',
    content: 'Sí. En días hábiles la medida cambia de acuerdo con el último número de la placa. Revisamos la restricción contigo en el momento de la entrega; no aplica durante fines de semana ni festivos.',
  },
  {
    label: '¿Hasta dónde puedo subir en carro rumbo al Nevado del Ruiz?',
    content: 'Puedes avanzar hasta el sector de Las Brisas, ubicado a 4.050 msnm. El ingreso al Parque Nacional exige registro previo. Sal temprano para reducir el riesgo de neblina y, para esta ruta, prefiere una camioneta.',
  },
  {
    label: '¿Qué paseos por Caldas puedo hacer desde Manizales?',
    content: 'Puedes ir al Recinto del Pensamiento en 20 minutos, a Chinchiná y su zona cafetera en 30 minutos, a los Termales de Santa Rosa en 1.5 horas, o dedicar 2 horas al Nevado del Ruiz y 2 horas a Salamina, pueblo patrimonio.',
  },
]
