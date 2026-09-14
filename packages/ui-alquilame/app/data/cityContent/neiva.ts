import type { CityExpandedContent } from './types'

export const cityName = 'Neiva'
export const citySlug = 'neiva'

export const metaDescription = 'Alquiler de carros en Neiva para recorrer la Tatacoa, Rivera, Betania y San Agustín con tu propio itinerario por el Huila.'

export const pullQuoteSource = 'En Neiva, el calor opita acompaña una ruta que cambia del desierto a los paisajes de montaña. Desde el Aeropuerto Benito Salas puedes organizar jornadas hacia la Tatacoa, Rivera, Betania o San Agustín sin amarrarte a un recorrido grupal. Un carro te deja escoger dónde hacer una pausa y a qué hora volver a la capital del Huila.'

export const content: CityExpandedContent = {
  intro: `El calor de Neiva se siente desde que sales del Aeropuerto Benito Salas, que conecta la capital del Huila con Bogotá y otras ciudades. También anuncia el tipo de viaje que ofrece la región: jornadas de carretera y contrastes entre desierto, nevados y arqueología. El alquiler de carros en Neiva permite usar la ciudad como base. Desde allí salen las rutas a la Tatacoa, Rivera, Betania y la zona arqueológica de San Agustín. No tienes que encajar todos esos lugares en una excursión con horario fijo. Puedes llegar al desierto cuando baja el sol, quedarte para observar el cielo y regresar cuando termine tu plan. También puedes dedicar otro día a una ruta más larga por la montaña. Durante el Festival del Bambuco, esa autonomía ayuda a repartir el tiempo entre las actividades de la ciudad y los recorridos por fuera. El carro se vuelve parte del itinerario. En el Huila, el horario del sol pesa tanto como la distancia.`,
  destinations: [
    {
      name: 'Desierto de la Tatacoa',
      time: '45 minutos',
      description: 'El segundo desierto más grande de Colombia se divide en dos paisajes. El Cuzco muestra tonos rojos; Los Hoyos, una gama gris que cambia con la luz. Al final de la tarde comienza la observación astronómica bajo uno de los cielos más limpios del país.',
    },
    {
      name: 'San Agustín',
      time: '4 horas',
      description: 'El parque arqueológico de San Agustín merece una jornada completa. Este sitio, reconocido como Patrimonio de la Humanidad, conserva estatuas milenarias y la mayor necrópolis prehispánica de América. Es una visita extensa, no una parada rápida.',
    },
    {
      name: 'Embalse de Betania',
      time: '40 minutos',
      description: 'El embalse de Betania es conocido como el mar interior del Huila. Allí el paisaje cambia por completo: hay deportes náuticos, pesca deportiva, restaurantes flotantes y playas artificiales. Es una alternativa para bajar el ritmo después de una mañana de carretera.',
    },
    {
      name: 'Rivera y Termales',
      time: '30 minutos',
      description: 'Los termales de Rivera reúnen aguas medicinales y piscinas para toda la familia. Funcionan bien como cierre de un recorrido exigente. El carro también permite llevar lo necesario para pasar varias horas antes de volver a Neiva.',
    },
  ],
  drivingTips: {
    picoPlaca: 'Neiva no tiene pico y placa para carros particulares. Solo hay cierres puntuales en fechas de eventos, como el Día sin Carro.',
    tolls: 'La ruta hacia la Tatacoa no tiene peajes. Hacia San Agustín, estos cobros suman cerca de $25.000 COP. Esa carretera es larga, montañosa y se mantiene en buen estado.',
    parking: 'Los parqueaderos del centro y de las zonas comerciales cobran entre $2.000 y $3.500 COP por hora. En la Tatacoa, el estacionamiento suele ser informal y está disponible en hoteles y observatorios.',
  },
  bestSeason: 'Neiva mantiene temperaturas altas, entre 30 y 40 °C, y la hora de salida cambia mucho la experiencia. La Tatacoa se disfruta al atardecer y de noche durante la observación astronómica. De junio a agosto suelen presentarse cielos despejados. El Festival del Bambuco se celebra entre junio y julio: la ciudad está más animada, pero la demanda también sube. Para el trayecto a San Agustín, la temporada seca de diciembre a febrero facilita el recorrido por carretera.',
}
