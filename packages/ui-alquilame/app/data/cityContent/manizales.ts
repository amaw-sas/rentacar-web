import type { CityExpandedContent } from './types'

export const cityName = 'Manizales'
export const citySlug = 'manizales'

export const metaDescription = 'Alquiler de carros en Manizales para recorrer sus laderas y viajar al Nevado del Ruiz, termales y fincas cafeteras. Reserva en línea.'

export const pullQuoteSource = 'Manizales trepa por la cordillera entre barrios inclinados, fincas de café y la silueta de los volcanes nevados. Un carro te permite enlazar Chipre, el Recinto del Pensamiento, los termales y las rutas de páramo con tiempo para manejar cada ascenso sin prisa. La Ciudad de las Puertas Abiertas recompensa a quien mira el paisaje, planea las curvas y se deja sorprender por la montaña.'

export const content: CityExpandedContent = {
  intro: `En Manizales casi ninguna calle parece plana: la ciudad universitaria se acomoda sobre la montaña y mira hacia volcanes, cafetales y bosques de niebla. Por eso, el alquiler de carros en Manizales resulta útil tanto para cruzar sus laderas como para salir hacia el Parque Nacional Los Nevados. El Aeropuerto La Nubia ofrece vuelos limitados; el de Pereira, a solo 45 minutos, amplía las alternativas para llegar a la región. Con vehículo propio puedes organizar una mañana en la Catedral Basílica, subir después hacia el Nevado del Ruiz y cerrar el día entre las aguas de los Termales del Otoño. Otra ruta une el Recinto del Pensamiento con una finca cafetera. Las pendientes exigen atención y buen manejo, pero a cambio aparecen vistas que no se ven desde las vías principales. La Ciudad de las Puertas Abiertas mezcla naturaleza extrema, tradición cafetera y ambiente universitario en muy pocos kilómetros.`,
  destinations: [
    {
      name: 'Nevado del Ruiz',
      time: '2 horas',
      description: 'Este volcán activo alcanza 5.321 metros y está rodeado por frailejones, aguas termales y un paisaje de páramo que parece lunar. Por el sector de Las Brisas es posible avanzar en vehículo hasta los 4.800 msnm.',
    },
    {
      name: 'Termales del Otoño',
      time: '1 hora',
      description: 'En medio del bosque de niebla encuentras piscinas de agua termal, spa y una propuesta de descanso de lujo. El contraste entre el clima frío de Manizales y el agua caliente hace parte del plan.',
    },
    {
      name: 'Recinto del Pensamiento',
      time: '20 minutos',
      description: 'Este parque ecológico reúne mariposario, orquideario, caminos interpretativos y bosque de niebla. Las telesillas abren la vista hacia el Nevado del Ruiz, y el recorrido incluye café de exportación.',
    },
    {
      name: 'Hacienda Venecia',
      time: '45 minutos',
      description: 'Una de las fincas cafeteras más premiadas del mundo muestra el proceso completo, desde el cultivo hasta una catación profesional. Puedes alargar la visita porque también dispone de hospedaje.',
    },
  ],
  drivingTips: {
    picoPlaca: 'La restricción por último dígito rige de lunes a viernes, entre 7:00 y 8:30 AM y nuevamente de 5:30 a 7:00 PM. En las calles muy empinadas de Manizales, apóyate en el freno de motor.',
    tolls: 'Para ir al Nevado del Ruiz no cruzas peajes, aunque debes pagar la entrada al parque: cerca de $23.000 COP para extranjeros y $18.000 COP para colombianos. El trayecto a Pereira sí tiene un peaje de unos $9.400 COP.',
    parking: 'Parquear sobre una calle inclinada puede ser incómodo. Es preferible usar estacionamientos, con valores de $2.500 a $5.000 COP por hora; Cable Plaza y otros centros comerciales concentran más alternativas.',
  },
  bestSeason: 'La temperatura habitual de Manizales está entre 14 y 22 °C, de modo que una chaqueta siempre es buena compañía. Para encontrar el Nevado con menos nubes, madruga durante los periodos secos de diciembre a febrero o de junio a agosto. Enero trae la Feria de Manizales y también una demanda alta. Antes de emprender la subida a Los Nevados, confirma que el acceso esté habilitado: la actividad volcánica puede ocasionar cierres.',
}
