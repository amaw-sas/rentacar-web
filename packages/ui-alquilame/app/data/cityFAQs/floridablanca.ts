import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Floridablanca'
export const citySlug = 'floridablanca'

export const faqs: FAQ[] = [
  {
    label: '¿En qué sede puedo recoger un carro alquilado en Floridablanca?',
    content: getCityPickupAnswer('Floridablanca'),
  },
  {
    label: '¿Qué vehículo funciona mejor para viajar desde Floridablanca?',
    content: 'Un sedán es cómodo para circular por el área metropolitana de Bucaramanga. Si tu recorrido incluye San Gil, el Cañón del Chicamocha o actividades de aventura, una camioneta es la categoría recomendada.',
  },
  {
    label: '¿Cómo consulto las tarifas de alquiler de carros en Floridablanca?',
    content: getCityPriceAnswer('Floridablanca'),
  },
  {
    label: '¿El pico y placa de Bucaramanga también rige en Floridablanca?',
    content: 'Sí. Floridablanca aplica la misma restricción del área metropolitana de Bucaramanga. Cuando te entreguemos el vehículo te confirmaremos el turno que corresponde a su placa. No hay pico y placa los fines de semana ni los festivos.',
  },
  {
    label: '¿Cambian las condiciones si alquilo en Floridablanca y no en Bucaramanga?',
    content: 'No cambian ni la tarifa ni las condiciones. Floridablanca queda a 15 minutos de Bucaramanga y ambas ubicaciones tienen acceso sencillo a las vías principales. Escoge la sede que quede mejor para tu punto de llegada o para el inicio de la ruta.',
  },
  {
    label: '¿Qué rutas de Santander puedo empezar en Floridablanca?',
    content: 'La Mesa de los Santos queda a 45 minutos y el Cañón del Chicamocha, a una hora. Para llegar a San Gil, capital del turismo extremo, calcula dos horas; Barichara está a dos horas y media. Estas distancias permiten combinar paisajes de montaña, pueblos y actividades de aventura.',
  },
]
