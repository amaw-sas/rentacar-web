export interface CityDestination {
    name: string
    time: string
    description: string
}

export interface CityDrivingTips {
    picoPlaca: string
    tolls: string
    parking: string
}

export interface CityExpandedContent {
    intro: string
    destinations: CityDestination[]
    drivingTips: CityDrivingTips
    bestSeason: string
}

/**
 * Expanded content for major cities (~500-800 words total per city)
 * Optimized for local SEO with unique, relevant information
 */
const cityExpandedContent: Record<string, CityExpandedContent> = {
    'Cali': {
        intro: `Cali, la capital mundial de la salsa, te invita a explorar el suroccidente colombiano con total libertad. Con un carro de alquiler puedes moverte por esta vibrante ciudad de más de 2.5 millones de habitantes y escapar fácilmente a destinos cercanos como San Cipriano, Buga o la costa del Pacífico. El Aeropuerto Internacional Alfonso Bonilla Aragón te conecta con las principales ciudades del país, siendo el punto de partida ideal para descubrir el Valle del Cauca. Ya sea que vengas a bailar salsa, por negocios o turismo, contar con vehículo propio te permite visitar el Zoológico de Cali, subir a Cristo Rey al atardecer y explorar barrios emblemáticos como San Antonio o Granada a tu propio ritmo, sin depender del transporte público.`,
        destinations: [
            {
                name: 'San Cipriano',
                time: '2 horas',
                description: 'Reserva natural accesible en brujitas (carros sobre rieles). Ríos cristalinos, cascadas y naturaleza virgen del Pacífico. Experiencia única que combina aventura y ecoturismo.'
            },
            {
                name: 'Basílica del Señor de los Milagros - Buga',
                time: '1.5 horas',
                description: 'El santuario más visitado de Colombia. Ciudad colonial con arquitectura histórica, dulces típicos y una fe que atrae millones de peregrinos cada año.'
            },
            {
                name: 'Lago Calima',
                time: '2 horas',
                description: 'Destino de deportes náuticos y vientos perfectos para kitesurf y windsurf. Paisajes de montaña, fincas de descanso y clima templado ideal para escapadas de fin de semana.'
            },
            {
                name: 'Haciendas del Valle del Cauca',
                time: '1 hora',
                description: 'Recorre las históricas haciendas azucareras como El Paraíso (inspiración de María de Jorge Isaacs) o Piedechinche. Historia, arquitectura colonial y cultura vallecaucana.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cali tiene pico y placa de lunes a viernes según rotación del último dígito de la placa, en horario de 6:00 AM a 7:00 PM. Los sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Buga hay un peaje (~$10.500 COP). Hacia el Lago Calima encontrarás el peaje de Mediacanoa (~$10.500 COP). Las vías están en buen estado general.',
            parking: 'En el centro y San Antonio los parqueaderos cuestan entre $3.000-5.000 COP/hora. En centros comerciales como Chipichape o Jardín Plaza suele ser gratis con consumo mínimo.'
        },
        bestSeason: 'Cali tiene clima cálido todo el año (25-32°C). La Feria de Cali en diciembre es el evento más importante, pero también la época de mayor demanda. Para evitar multitudes, visita entre febrero y mayo o agosto y noviembre. Si planeas ir a San Cipriano, la temporada seca (diciembre-marzo y julio-agosto) es ideal para disfrutar los ríos cristalinos.'
    },
    'Cartagena': {
        intro: `Cartagena de Indias, la joya del Caribe colombiano y Patrimonio de la Humanidad, es el destino turístico por excelencia del país. Con un carro de alquiler puedes explorar más allá de las murallas y descubrir playas paradisíacas, pueblos cercanos y la riqueza cultural de la región. El Aeropuerto Internacional Rafael Núñez está a solo 15 minutos del centro histórico, facilitando el inicio de tu aventura. Tener vehículo propio te permite escapar del calor en Playa Blanca, visitar el Volcán del Totumo, explorar las Islas del Rosario o aventurarte hasta Mompox sin las limitaciones de los tours grupales. Cartagena es perfecta para recorrer a tu ritmo entre historia colonial, gastronomía caribeña y atardeceres inolvidables.`,
        destinations: [
            {
                name: 'Playa Blanca - Isla Barú',
                time: '1 hora',
                description: 'La playa más famosa cerca de Cartagena. Arena blanca, aguas cristalinas del Caribe y ambiente relajado. Ahora accesible por carretera sin necesidad de lancha.'
            },
            {
                name: 'Volcán del Totumo',
                time: '1 hora',
                description: 'Experiencia única de baño en lodo volcánico con propiedades medicinales. Pequeño volcán de 15 metros donde flotas en lodo tibio. Imperdible y económico.'
            },
            {
                name: 'Santa Marta (por la costa)',
                time: '4 horas',
                description: 'La ruta costera más hermosa de Colombia. Playas vírgenes, pueblos pesqueros y paisajes del Caribe. Puedes hacer paradas en Barranquilla y el Parque Tayrona.'
            },
            {
                name: 'Mompox',
                time: '4.5 horas',
                description: 'Pueblo colonial detenido en el tiempo, Patrimonio de la Humanidad. Orfebrería en filigrana, arquitectura intacta y el río Magdalena. Vale cada kilómetro del viaje.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cartagena NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora por toda la ciudad.',
            tolls: 'Hacia Barú hay un peaje (~$9.000 COP). La vía a Santa Marta tiene varios peajes (~$45.000 COP total). Hacia el Volcán del Totumo no hay peajes.',
            parking: 'En el Centro Histórico y Bocagrande los parqueaderos cuestan entre $5.000-10.000 COP/hora. En Getsemaní hay opciones más económicas. Nunca dejes el carro en la calle.'
        },
        bestSeason: 'Cartagena es caliente todo el año (28-35°C). La temporada seca de diciembre a abril es ideal, con cielos despejados y mar tranquilo. Evita Semana Santa y fin de año si buscas precios bajos. La temporada de lluvias (mayo-noviembre) tiene menos turistas y mejores tarifas, aunque con aguaceros ocasionales por la tarde.'
    },
    'Barranquilla': {
        intro: `Barranquilla, la Puerta de Oro de Colombia, es una ciudad vibrante donde nació el Carnaval más importante del país. Con un carro de alquiler puedes explorar esta metrópoli de más de 1.2 millones de habitantes y sus alrededores caribeños con total libertad. El Aeropuerto Internacional Ernesto Cortissoz te conecta con las principales ciudades, siendo el punto estratégico para recorrer la costa norte. Tener vehículo propio te permite visitar el Malecón del Río, conocer el Museo del Caribe, escapar a las playas de Puerto Colombia y aventurarte a destinos cercanos como Santa Marta o Cartagena. Barranquilla combina cultura, gastronomía costeña y la alegría de su gente en una experiencia auténtica lejos del turismo masivo.`,
        destinations: [
            {
                name: 'Puerto Colombia y Salgar',
                time: '30 minutos',
                description: 'Pueblos costeros con historia y playas locales. El muelle de Puerto Colombia fue el más largo de Latinoamérica. Pescado fresco y ambiente relajado de pueblo de mar.'
            },
            {
                name: 'Santa Marta y Parque Tayrona',
                time: '2 horas',
                description: 'La ciudad más antigua de Colombia y el parque natural más visitado del país. Playas vírgenes, Sierra Nevada y biodiversidad única. Imperdible desde Barranquilla.'
            },
            {
                name: 'Cartagena',
                time: '2 horas',
                description: 'La ciudad amurallada Patrimonio de la Humanidad está a solo 2 horas. Ideal para un día completo explorando historia colonial, gastronomía y arquitectura única.'
            },
            {
                name: 'Bocas de Ceniza',
                time: '45 minutos',
                description: 'Donde el río Magdalena se encuentra con el mar Caribe. Experiencia única en tren turístico sobre los tajamares. Paisaje industrial-natural impresionante.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Barranquilla tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 8:00 PM. Sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Cartagena hay 2 peajes (~$25.000 COP total). Hacia Santa Marta hay 3 peajes (~$30.000 COP total). Hacia Puerto Colombia no hay peajes.',
            parking: 'En el norte y zonas comerciales los parqueaderos cuestan entre $3.000-6.000 COP/hora. En centros comerciales como Buenavista o Portal del Prado suele haber tarifa con consumo.'
        },
        bestSeason: 'Barranquilla tiene clima caliente todo el año (28-35°C). El Carnaval de Barranquilla (febrero-marzo) es la época más festiva pero con alta demanda. La temporada seca de diciembre a abril es ideal para playas. Si buscas precios bajos y menos calor, considera septiembre a noviembre.'
    },
    'Santa Marta': {
        intro: `Santa Marta, la ciudad más antigua de Colombia fundada en 1525, es la puerta de entrada al Parque Tayrona y la Sierra Nevada. Con un carro de alquiler puedes explorar esta región de contrastes únicos: playas caribeñas, montañas nevadas y selva tropical en pocos kilómetros. El Aeropuerto Internacional Simón Bolívar te conecta con las principales ciudades del país. Tener vehículo propio es casi esencial aquí, ya que te permite acceder a playas remotas como Palomino, subir a Minca en la Sierra Nevada, visitar el Parque Tayrona a tu ritmo y explorar pueblos de la Zona Bananera. Santa Marta combina historia colonial, naturaleza exuberante y la magia de ser el lugar donde murió el Libertador Simón Bolívar.`,
        destinations: [
            {
                name: 'Parque Nacional Tayrona',
                time: '45 minutos',
                description: 'El parque natural más icónico de Colombia. Playas vírgenes como Cabo San Juan, senderos en la selva y encuentro de Sierra Nevada con el mar. Reserva entrada con anticipación.'
            },
            {
                name: 'Minca',
                time: '45 minutos',
                description: 'Pueblo de montaña en la Sierra Nevada a 650 msnm. Fincas cafeteras, cascadas, avistamiento de aves y temperaturas frescas. Escape perfecto del calor de la costa.'
            },
            {
                name: 'Palomino',
                time: '1.5 horas',
                description: 'Playa bohemia donde el río Palomino se encuentra con el mar. Tubing por el río, surf, ambiente mochilero y atardeceres espectaculares. Cada vez más popular.'
            },
            {
                name: 'Taganga',
                time: '15 minutos',
                description: 'Antiguo pueblo de pescadores convertido en destino de buceo. Bahía tranquila, restaurantes de mariscos frescos y punto de partida para playas cercanas en lancha.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Santa Marta NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora.',
            tolls: 'Hacia Palomino hay un peaje (~$9.200 COP). Hacia Barranquilla hay 3 peajes (~$30.000 COP total). No hay peajes hacia Minca ni Taganga.',
            parking: 'En el centro histórico y El Rodadero los parqueaderos cuestan entre $3.000-6.000 COP/hora. En Taganga el parqueo es limitado y en temporada alta se complica.'
        },
        bestSeason: 'Santa Marta tiene clima cálido todo el año (28-34°C). La temporada seca de diciembre a abril es ideal para playas y Tayrona. El Parque Tayrona cierra cada año en febrero y junio para recuperación ecológica (verifica fechas). Para Minca, cualquier época es buena, con lluvias más frecuentes de mayo a noviembre.'
    },
    'Bogotá': {
        intro: `Bogotá, la capital de Colombia, es el punto de partida ideal para explorar el centro del país. Con un carro de alquiler puedes moverte con total libertad por esta metrópoli de más de 8 millones de habitantes y escapar fácilmente a destinos cercanos como Villa de Leyva, Zipaquirá o Girardot. El Aeropuerto Internacional El Dorado conecta con todas las ciudades principales y es el hub más grande del país, lo que hace de Bogotá el lugar perfecto para iniciar tu road trip por Colombia. Ya sea que vengas por negocios o turismo, contar con vehículo propio te permite evitar el tráfico del transporte público, llegar a reuniones puntuales y explorar barrios como La Candelaria, Usaquén o Chapinero a tu propio ritmo.`,
        destinations: [
            {
                name: 'Villa de Leyva',
                time: '3 horas',
                description: 'Pueblo colonial mejor conservado de Colombia. Su plaza principal empedrada, la más grande del país, te transporta a la época colonial. Ideal para un fin de semana con museos, viñedos y el desierto de la Candelaria.'
            },
            {
                name: 'Catedral de Sal de Zipaquirá',
                time: '1 hora',
                description: 'Una de las maravillas de Colombia, esta catedral subterránea excavada en una mina de sal es imperdible. El viaje es corto y puedes combinarlo con el Tren de la Sabana.'
            },
            {
                name: 'Girardot y Melgar',
                time: '2.5 horas',
                description: 'Cuando el frío bogotano agota, estos destinos de tierra caliente ofrecen piscinas, sol y descanso. Perfectos para escapadas de fin de semana con familia.'
            },
            {
                name: 'Laguna de Guatavita',
                time: '1.5 horas',
                description: 'El lugar donde nació la leyenda de El Dorado. Una caminata moderada te lleva al cráter de esta laguna sagrada muisca con vistas espectaculares.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Bogotá restringe la circulación de vehículos de lunes a viernes según par/impar del último dígito de la placa. El horario es de 6:00 AM a 9:00 PM continuo. Los fines de semana y festivos no hay restricción.',
            tolls: 'Saliendo de Bogotá encontrarás peajes en todas las vías principales. Hacia Villa de Leyva hay 3 peajes (~$45.000 COP total), hacia Girardot 2 peajes (~$30.000 COP).',
            parking: 'En zonas como Chapinero y Usaquén los parqueaderos cuestan entre $4.000-8.000 COP/hora. En centros comerciales suele ser gratis con consumo.'
        },
        bestSeason: 'Bogotá tiene clima templado todo el año (14-19°C), pero la temporada seca de diciembre a febrero es ideal para viajes por carretera. Semana Santa y puentes festivos tienen alta demanda, así que reserva con mínimo 2 semanas de anticipación para mejores tarifas. Si planeas ir a tierra caliente (Girardot, Melgar), cualquier época es buena ya que siempre hace sol.'
    },
    'Medellín': {
        intro: `Medellín, la ciudad de la eterna primavera, ofrece el clima perfecto para explorar Antioquia en carro. Con temperaturas entre 22-28°C todo el año, puedes disfrutar de pueblos mágicos, paisajes de montaña y la hospitalidad paisa sin preocuparte por el clima. El Aeropuerto José María Córdova está en Rionegro, a 45 minutos del centro, lo que hace ideal recoger tu carro directamente al llegar y comenzar tu aventura. Medellín es el punto de partida perfecto para recorrer el Eje Cafetero, visitar Guatapé, explorar Santa Fe de Antioquia o aventurarte hacia la costa caribe. Con un vehículo propio evitas las limitaciones del transporte público y puedes descubrir joyas escondidas como Jardín, San Rafael o el Peñol a tu propio ritmo.`,
        destinations: [
            {
                name: 'Guatapé y El Peñol',
                time: '2 horas',
                description: 'El pueblo más colorido de Colombia con su famosa piedra de 740 escalones. Vistas espectaculares del embalse, deportes acuáticos y gastronomía local. Imperdible para cualquier visitante.'
            },
            {
                name: 'Santa Fe de Antioquia',
                time: '1.5 horas',
                description: 'Pueblo colonial de clima cálido, perfecto para escapar del fresco de Medellín. Arquitectura histórica, el famoso Puente de Occidente y deliciosos tamarindos.'
            },
            {
                name: 'Jardín',
                time: '3 horas',
                description: 'Considerado uno de los pueblos más bonitos de Colombia. Calles empedradas, arquitectura paisa tradicional, cultivos de café y la Cueva del Esplendor con su cascada interior.'
            },
            {
                name: 'San Rafael',
                time: '2.5 horas',
                description: 'Paraíso de cascadas y ríos cristalinos. Ideal para los amantes de la naturaleza y el ecoturismo. Múltiples pozos naturales para nadar en aguas turquesas.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Medellín tiene pico y placa de lunes a viernes según rotación del último dígito de la placa, en horario continuo de 5:00 AM a 8:00 PM. Los sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Guatapé hay un peaje (~$12.000 COP). Hacia Santa Fe de Antioquia el túnel de occidente tiene peaje (~$15.600 COP). Las vías están en excelente estado.',
            parking: 'El centro y El Poblado tienen parqueaderos entre $3.000-6.000 COP/hora. En centros comerciales como Santafé o El Tesoro suele haber tarifa plana o gratis con consumo.'
        },
        bestSeason: 'Medellín tiene clima primaveral todo el año, pero la temporada más seca es de diciembre a febrero y junio a agosto. La Feria de las Flores en agosto atrae muchos visitantes, así que reserva con anticipación. Para Guatapé y pueblos cercanos, cualquier época es buena, aunque los fines de semana largos tienen más afluencia.'
    },
    'Bucaramanga': {
        intro: `Bucaramanga, la Ciudad Bonita de Colombia, te sorprende con su clima perfecto y paisajes de montaña espectaculares. Con un carro de alquiler puedes explorar el área metropolitana más limpia del país y aventurarte al impresionante Cañón del Chicamocha. El Aeropuerto Internacional Palonegro está en Lebrija, a 30 minutos del centro, lo que hace ideal recoger tu vehículo al llegar. Tener carro propio es casi indispensable aquí: te permite visitar pueblos coloniales como Girón, practicar deportes extremos en el Cañón, subir al Cerro del Santísimo y explorar la Mesa de los Santos. Bucaramanga combina modernidad, naturaleza extrema y la calidez de la gente santandereana en una experiencia única.`,
        destinations: [
            {
                name: 'Cañón del Chicamocha (Panachi)',
                time: '1.5 horas',
                description: 'Uno de los cañones más profundos del mundo. Teleférico de 6.3 km, deportes extremos, parapente y vistas que quitan el aliento. El parque Panachi tiene atracciones para toda la familia.'
            },
            {
                name: 'Girón',
                time: '20 minutos',
                description: 'Pueblo colonial mejor conservado de Santander. Calles empedradas, arquitectura blanca, dulces típicos y el río de Oro. Patrimonio Nacional a minutos de Bucaramanga.'
            },
            {
                name: 'Mesa de los Santos',
                time: '1 hora',
                description: 'Meseta a 1.600 msnm con clima perfecto, haciendas cafeteras y miradores al Cañón del Chicamocha. Parapente, camping y gastronomía santandereana de altura.'
            },
            {
                name: 'San Gil',
                time: '2 horas',
                description: 'Capital del turismo extremo en Colombia. Rafting en el río Fonce, torrentismo, espeleología y el Parque El Gallineral. Meca de la aventura para todas las edades.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Bucaramanga tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:00 a 8:00 AM y de 5:30 a 7:30 PM. Sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia el Cañón del Chicamocha hay un peaje (~$10.000 COP). Hacia San Gil hay 2 peajes (~$18.000 COP total). Las vías son de montaña, bien mantenidas pero con curvas.',
            parking: 'En Cabecera y zonas comerciales los parqueaderos cuestan entre $2.500-5.000 COP/hora. En centros comerciales como Cacique o Megamall hay tarifa con consumo.'
        },
        bestSeason: 'Bucaramanga tiene clima templado perfecto todo el año (22-28°C), por algo la llaman Ciudad Bonita. La temporada seca de diciembre a marzo es ideal para deportes extremos y el Cañón. Para parapente, los mejores vientos son de diciembre a febrero. Evita puentes festivos si buscas menos congestión en las vías de montaña.'
    },
    'Pereira': {
        intro: `Pereira, la Querendona, Trasnochadora y Morena, es el corazón del Eje Cafetero y la puerta de entrada al Paisaje Cultural Cafetero declarado Patrimonio de la Humanidad. Con un carro de alquiler puedes explorar esta región de montañas verdes, fincas cafeteras y pueblos con encanto a tu propio ritmo. El Aeropuerto Internacional Matecaña está a solo 15 minutos del centro, facilitando el inicio de tu aventura cafetera. Tener vehículo propio te permite visitar las Termales de Santa Rosa, recorrer el Valle de Cocora en Salento, explorar el Bioparque Ukumarí y descubrir fincas donde nace el mejor café del mundo. Pereira combina naturaleza exuberante, cultura cafetera y vida nocturna en una mezcla irresistible.`,
        destinations: [
            {
                name: 'Termales de Santa Rosa de Cabal',
                time: '45 minutos',
                description: 'Aguas termales naturales entre cascadas y bosque de niebla. Varias opciones desde rústicas hasta de lujo. Experiencia imperdible del Eje Cafetero, especialmente al atardecer.'
            },
            {
                name: 'Salento y Valle de Cocora',
                time: '1 hora',
                description: 'El pueblo más bonito del Quindío y el hogar de las palmas de cera más altas del mundo (hasta 60m). Caminata entre palmas, trucha fresca y arquitectura colorida.'
            },
            {
                name: 'Bioparque Ukumarí',
                time: '30 minutos',
                description: 'El bioparque más grande de Latinoamérica. Más de 1.000 animales de 5 continentes en ambientes naturales. Sabana africana, bosque tropical y región andina en un solo lugar.'
            },
            {
                name: 'Santuario de Fauna y Flora Otún Quimbaya',
                time: '1 hora',
                description: 'Reserva natural para avistamiento de aves y monos aulladores. Senderos ecológicos, cascadas y biodiversidad única de los Andes. Ecoturismo auténtico.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Pereira tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 8:30 AM y de 5:30 a 7:00 PM. Sábados, domingos y festivos no hay restricción.',
            tolls: 'Hacia Salento hay un peaje (~$8.700 COP). Las vías del Eje Cafetero están en excelente estado. Hacia Santa Rosa de Cabal no hay peajes.',
            parking: 'En el centro y Circunvalar los parqueaderos cuestan entre $2.500-4.500 COP/hora. En Salento el parqueo es limitado en temporada alta, llega temprano.'
        },
        bestSeason: 'El Eje Cafetero tiene dos temporadas secas ideales: diciembre a febrero y junio a agosto. Sin embargo, el clima de montaña es impredecible y puede llover en cualquier época. Para el Valle de Cocora, madrugadores tienen las mejores fotos sin neblina. Las Termales son perfectas con cualquier clima, incluso mejor con lluvia.'
    },
    'Armenia': {
        intro: `Armenia, capital del Quindío, es el epicentro del Paisaje Cultural Cafetero y la base perfecta para explorar esta región Patrimonio de la Humanidad. Con un carro de alquiler puedes recorrer las fincas cafeteras más tradicionales de Colombia, visitar parques temáticos únicos y descubrir pueblos que parecen detenidos en el tiempo. El Aeropuerto El Edén está a solo 15 minutos del centro, ideal para comenzar tu inmersión en la cultura del café. Tener vehículo propio te permite visitar el Parque del Café, explorar Filandia al amanecer, conocer el proceso del café en fincas tradicionales y recorrer la Ruta del Café a tu ritmo. Armenia ofrece la experiencia cafetera más auténtica de Colombia.`,
        destinations: [
            {
                name: 'Parque Nacional del Café',
                time: '20 minutos',
                description: 'El parque temático más visitado del Eje Cafetero. Montañas rusas, shows culturales, teleférico y todo sobre la historia del café colombiano. Diversión para toda la familia.'
            },
            {
                name: 'Filandia',
                time: '30 minutos',
                description: 'El pueblo más fotogénico del Quindío con su mirador Colina Iluminada. Artesanías en cestería, café de origen y arquitectura colorida sin el turismo masivo de Salento.'
            },
            {
                name: 'Recuca (Recorrido de la Cultura Cafetera)',
                time: '25 minutos',
                description: 'Experiencia inmersiva donde te vistes de arriero y participas en la recolección de café. Desde la semilla hasta la taza, entiendes por qué el café colombiano es único.'
            },
            {
                name: 'Jardín Botánico del Quindío',
                time: '15 minutos',
                description: 'Mariposario más grande de Colombia con cientos de especies. Senderos entre guaduales gigantes, orquídeas y un laberinto de arbustos. Naturaleza y paz.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Armenia tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:30 a 8:30 AM y de 5:30 a 6:30 PM. Solo una hora en cada franja, muy manejable.',
            tolls: 'Las vías dentro del Quindío no tienen peajes. Solo encuentras peaje si vas hacia Pereira (~$8.700 COP) o hacia Ibagué por la Línea (~$15.500 COP).',
            parking: 'En el centro de Armenia los parqueaderos cuestan entre $2.000-4.000 COP/hora. En los parques temáticos el parqueo suele estar incluido o cuesta $5.000-10.000 COP/día.'
        },
        bestSeason: 'El Quindío tiene clima templado todo el año (18-25°C). Las temporadas más secas son diciembre a febrero y junio a agosto, ideales para caminatas. La cosecha principal de café es de octubre a diciembre, cuando las fincas están más activas. Evita Semana Santa y puentes festivos si buscas precios bajos y menos multitudes.'
    },
    'Manizales': {
        intro: `Manizales, la Ciudad de las Puertas Abiertas, te recibe entre volcanes nevados y el mejor café del mundo. Con un carro de alquiler puedes explorar esta ciudad universitaria de montaña y aventurarte hacia el Parque Nacional Los Nevados, una experiencia única en Colombia. El Aeropuerto La Nubia tiene vuelos limitados, pero el Aeropuerto de Pereira está a solo 45 minutos, ampliando tus opciones. Tener vehículo propio es casi indispensable aquí: las empinadas calles de Manizales y los accesos a volcanes y páramos requieren movilidad propia. Descubre la Catedral Basílica, sube al Nevado del Ruiz, visita el Recinto del Pensamiento y explora los Termales del Otoño. Manizales combina naturaleza extrema, cultura cafetera y espíritu universitario.`,
        destinations: [
            {
                name: 'Nevado del Ruiz',
                time: '2 horas',
                description: 'Volcán activo de 5.321 metros con paisajes de páramo lunar. Las Brisas te lleva hasta 4.800 msnm en vehículo. Aguas termales naturales y frailejones gigantes. Experiencia única.'
            },
            {
                name: 'Termales del Otoño',
                time: '1 hora',
                description: 'Complejo termal de lujo en medio del bosque de niebla. Piscinas naturales, spa y conexión con la naturaleza. El escape perfecto del clima frío de Manizales.'
            },
            {
                name: 'Recinto del Pensamiento',
                time: '20 minutos',
                description: 'Parque ecológico con mariposario, orquideario y bosque de niebla. Telesillas con vista al Nevado del Ruiz y senderos interpretativos. Café de exportación incluido.'
            },
            {
                name: 'Hacienda Venecia',
                time: '45 minutos',
                description: 'Una de las fincas cafeteras más premiadas del mundo. Tour completo del café, desde el cultivo hasta la catación profesional. Hospedaje disponible para experiencia completa.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Manizales tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 8:30 AM y de 5:30 a 7:00 PM. Las calles son muy empinadas, usa freno de motor.',
            tolls: 'Hacia el Nevado del Ruiz no hay peajes pero sí entrada al parque (~$23.000 COP extranjeros, $18.000 COP colombianos). Hacia Pereira hay un peaje (~$9.400 COP).',
            parking: 'Las calles empinadas de Manizales complican el parqueo en la calle. Usa parqueaderos (entre $2.500-5.000 COP/hora). En Cable Plaza y centros comerciales hay más opciones.'
        },
        bestSeason: 'Manizales tiene clima frío de montaña (14-22°C), trae ropa abrigada. Para ver el Nevado sin nubes, madruga en temporada seca (diciembre a febrero y junio a agosto). La Feria de Manizales en enero es espectacular pero con alta demanda. Para Los Nevados, verifica el acceso ya que cierra por actividad volcánica ocasionalmente.'
    },
    'Cúcuta': {
        intro: `Cúcuta, la Perla del Norte, es la principal ciudad fronteriza de Colombia con Venezuela y un punto estratégico del nororiente del país. Con un carro de alquiler puedes explorar esta ciudad comercial y aventurarte hacia destinos únicos como Pamplona, la Villa del Rosario histórica y las montañas de Norte de Santander. El Aeropuerto Internacional Camilo Daza te conecta con las principales ciudades colombianas. Tener vehículo propio te permite moverte con libertad por esta extensa ciudad, visitar centros comerciales de frontera, explorar el Área Metropolitana y descubrir tesoros coloniales en pueblos cercanos. Cúcuta combina historia bolivariana, comercio dinámico y la calidez de su gente en una experiencia fronteriza única.`,
        destinations: [
            {
                name: 'Villa del Rosario',
                time: '15 minutos',
                description: 'Cuna de la Gran Colombia donde nació la primera Constitución. Casa natal del General Santander, Templo Histórico y el árbol donde se firmó la Constitución de 1821. Historia viva.'
            },
            {
                name: 'Pamplona',
                time: '1.5 horas',
                description: 'Ciudad colonial fundada en 1549, una de las más antiguas de Colombia. Arquitectura religiosa impresionante, clima frío de montaña y tradición universitaria. La Semana Santa es espectacular.'
            },
            {
                name: 'Chinácota',
                time: '1 hora',
                description: 'Pueblo de clima templado conocido por sus dulces y brevas. Descanso entre montañas, piscinas naturales y gastronomía típica nortesantandereana. Escape del calor cucuteño.'
            },
            {
                name: 'Área Metropolitana (Los Patios, El Zulia)',
                time: '20 minutos',
                description: 'Municipios conurbados con centros comerciales, restaurantes y vida nocturna. El Zulia tiene fincas de descanso y Los Patios ofrece opciones gastronómicas variadas.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Cúcuta tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:30 a 8:30 AM y de 5:00 a 7:30 PM. La zona fronteriza tiene congestión adicional.',
            tolls: 'Hacia Pamplona hay un peaje (~$11.300 COP). La vía es de montaña con muchas curvas, toma precauciones. No hay peajes dentro del área metropolitana.',
            parking: 'En Ventura Plaza, Unicentro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En la zona de frontera el parqueo es más complicado, evita dejar el carro en la calle.'
        },
        bestSeason: 'Cúcuta es una de las ciudades más calientes de Colombia (28-38°C). La mejor época es de diciembre a febrero cuando el calor es más soportable. Para Pamplona lleva ropa abrigada (10-18°C). Evita los días de mayor movimiento fronterizo si no necesitas ir a la frontera.'
    },
    'Ibagué': {
        intro: `Ibagué, la Capital Musical de Colombia, es el corazón del Tolima y la puerta de entrada a destinos naturales espectaculares. Con un carro de alquiler puedes explorar esta ciudad de tradición musical y aventurarte hacia el Cañón del Combeima, nevados y pueblos cafeteros. El Aeropuerto Perales tiene vuelos limitados, pero la ciudad está estratégicamente ubicada entre Bogotá y el Eje Cafetero. Tener vehículo propio te permite subir al Cañón del Combeima con sus cascadas, visitar Cajamarca antes de la minería, explorar el Parque Nacional Los Nevados desde el lado tolimense y disfrutar de la gastronomía típica. Ibagué combina música, naturaleza de montaña y el espíritu festivo del Tolima Grande.`,
        destinations: [
            {
                name: 'Cañón del Combeima',
                time: '45 minutos',
                description: 'Valle espectacular con el río Combeima, cascadas, restaurantes de trucha y senderos hacia el Nevado del Tolima. Juntas es el pueblo más conocido, base para ascensos al nevado.'
            },
            {
                name: 'Nevado del Tolima',
                time: '3 horas (hasta base)',
                description: 'Volcán de 5.215 metros, hermano del Ruiz. Ascenso de 2-3 días desde Juntas. Para no escaladores, el camino hasta El Silencio ofrece vistas impresionantes del nevado y páramo.'
            },
            {
                name: 'Cajamarca',
                time: '1.5 horas',
                description: 'La despensa agrícola de Colombia, famosa por sus arvejas y paisajes de montaña. Pueblo tranquilo con arquitectura tradicional y mirador hacia el valle. Antes del proyecto minero, conócelo.'
            },
            {
                name: 'Honda',
                time: '2 horas',
                description: 'Ciudad colonial a orillas del Magdalena, el puerto más importante de la colonia. Puentes históricos, arquitectura única, subienda de peces y un pasado glorioso por descubrir.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Ibagué tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 8:00 AM y de 6:00 a 7:30 PM. Solo una hora en la mañana.',
            tolls: 'Hacia Bogotá por la Línea hay peajes (~$32.000 COP total). Hacia el Cañón del Combeima no hay peajes. Hacia Armenia hay un peaje (~$15.500 COP).',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En La Estación y centros comerciales hay tarifas con consumo.'
        },
        bestSeason: 'Ibagué tiene clima cálido (22-32°C) pero el Cañón del Combeima es más fresco. La temporada seca de junio a agosto es ideal para el Nevado del Tolima (aunque requiere guía y equipo especializado). El Festival Folclórico en junio es la época más festiva. Para el Cañón, cualquier época funciona.'
    },
    'Montería': {
        intro: `Montería, la Perla del Sinú, es la capital ganadera de Colombia y una ciudad que sorprende con su desarrollo y calidad de vida. Con un carro de alquiler puedes explorar esta pujante ciudad y descubrir las maravillas del departamento de Córdoba. El Aeropuerto Los Garzones te conecta con las principales ciudades del país. Tener vehículo propio te permite recorrer la emblemática Ronda del Sinú, visitar pueblos como Lorica y San Antero, conocer las playas del Golfo de Morrosquillo y explorar la sabana cordobesa con sus fincas ganaderas. Montería combina modernidad, tradición sabanera y una gastronomía excepcional basada en carne de res de primera calidad.`,
        destinations: [
            {
                name: 'Santa Cruz de Lorica',
                time: '1 hora',
                description: 'Ciudad Patrimonio Nacional con arquitectura árabe única en Colombia. Influencia sirio-libanesa en sus edificios, gastronomía y cultura. El Mercado Público es imperdible.'
            },
            {
                name: 'San Antero y Playas del Golfo',
                time: '1.5 horas',
                description: 'Playas del Golfo de Morrosquillo con aguas tranquilas y manglares. Coveñas, Playa Blanca y San Antero ofrecen sol, playa y mariscos frescos. Ideal para familia.'
            },
            {
                name: 'Tierralta y Urrá',
                time: '1.5 horas',
                description: 'Represa de Urrá con paisajes de montaña, deportes náuticos y comunidades indígenas Embera. Naturaleza exuberante del Alto Sinú y ecoturismo comunitario.'
            },
            {
                name: 'Ronda del Sinú',
                time: '10 minutos',
                description: 'El parque lineal más largo de Latinoamérica a orillas del río Sinú. 6 km de senderos, fauna silvestre, restaurantes y el corazón de la vida monteriana. Imperdible al atardecer.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Montería NO tiene pico y placa para vehículos particulares. Puedes circular libremente cualquier día y hora por toda la ciudad.',
            tolls: 'Hacia Lorica hay un peaje (~$8.900 COP). Hacia las playas del Golfo hay 2 peajes (~$18.000 COP total). Las vías están en buen estado.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En centros comerciales como Buenavista o Alamedas hay tarifa con consumo.'
        },
        bestSeason: 'Montería tiene clima caliente todo el año (28-36°C). La temporada seca de diciembre a marzo es ideal para playas del Golfo y turismo en general. Las ferias ganaderas en junio atraen visitantes de todo el país. Para Lorica, cualquier época es buena pero evita las horas de máximo calor.'
    },
    'Neiva': {
        intro: `Neiva, capital del Huila, es la puerta de entrada al Desierto de la Tatacoa y a los tesoros arqueológicos de San Agustín. Con un carro de alquiler puedes explorar esta región de contrastes espectaculares donde el desierto, los nevados y la arqueología se combinan en experiencias únicas. El Aeropuerto Benito Salas te conecta con Bogotá y otras ciudades. Tener vehículo propio es prácticamente indispensable aquí: te permite llegar al Desierto de la Tatacoa para observar estrellas, visitar San Agustín Patrimonio de la Humanidad, navegar por el embalse de Betania y disfrutar del Festival del Bambuco. Neiva combina calor intenso, amabilidad opita y acceso a maravillas naturales y culturales únicas en Colombia.`,
        destinations: [
            {
                name: 'Desierto de la Tatacoa',
                time: '45 minutos',
                description: 'Segundo desierto más grande de Colombia con paisajes marcianos. Dos zonas: El Cuzco (rojo) y Los Hoyos (gris). Observación astronómica nocturna en uno de los cielos más limpios del país.'
            },
            {
                name: 'San Agustín',
                time: '4 horas',
                description: 'Parque Arqueológico Patrimonio de la Humanidad. La mayor necrópolis prehispánica de América con estatuas milenarias misteriosas. Imprescindible aunque el viaje sea largo.'
            },
            {
                name: 'Embalse de Betania',
                time: '40 minutos',
                description: 'El mar interior del Huila. Deportes náuticos, pesca deportiva, restaurantes flotantes y playas artificiales. Escape refrescante del calor neivano.'
            },
            {
                name: 'Rivera y Termales',
                time: '30 minutos',
                description: 'Pueblo cercano con termales naturales. Los Termales de Rivera ofrecen aguas medicinales y piscinas para toda la familia. Relax después de explorar el desierto.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Neiva tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 8:00 AM y de 6:00 a 7:00 PM. Muy corto, solo una hora por franja.',
            tolls: 'Hacia la Tatacoa no hay peajes. Hacia San Agustín hay peajes (~$25.000 COP total) y la vía es de montaña, larga pero bien mantenida.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-3.500 COP/hora. En la Tatacoa hay parqueo informal en los hoteles y observatorios.'
        },
        bestSeason: 'Neiva es muy caliente (30-40°C), prepárate. La Tatacoa es mejor al atardecer y noche para observación astronómica (cielos despejados de junio a agosto). El Festival del Bambuco en junio-julio es la época más festiva pero con alta demanda. Para San Agustín, la temporada seca (diciembre a febrero) facilita el recorrido.'
    },
    'Valledupar': {
        intro: `Valledupar, la cuna del vallenato, es una ciudad mágica donde la música es parte del alma de su gente. Con un carro de alquiler puedes explorar esta capital del Cesar y descubrir la Sierra Nevada desde su vertiente oriental, los ríos cristalinos de la Serranía del Perijá y pueblos donde nacieron las leyendas del acordeón. El Aeropuerto Alfonso López Pumarejo te conecta con las principales ciudades colombianas. Tener vehículo propio te permite visitar el río Guatapurí, explorar el balneario Hurtado, conocer pueblos como La Paz y Manaure, y adentrarte en territorio indígena Arhuaco. Valledupar combina música, tradición, naturaleza y la hospitalidad más genuina del Caribe colombiano.`,
        destinations: [
            {
                name: 'Río Guatapurí',
                time: '15 minutos',
                description: 'El río sagrado de Valledupar que baja de la Sierra Nevada. Balneario natural en plena ciudad donde locales y visitantes se refrescan del calor vallenato. Imperdible al atardecer.'
            },
            {
                name: 'Balneario Hurtado',
                time: '30 minutos',
                description: 'Complejo de piscinas naturales y cascadas en el río Badillo. Agua cristalina de la Sierra Nevada, restaurantes típicos y ambiente familiar. El escape favorito de los vallenatos.'
            },
            {
                name: 'La Paz y Nabusímake',
                time: '2 horas',
                description: 'La Paz es cuna de grandes juglares vallenatos. Nabusímake es la capital espiritual del pueblo Arhuaco, visitable con permiso. Cultura indígena viva en la Sierra Nevada.'
            },
            {
                name: 'Manaure Balcón del Cesar',
                time: '1 hora',
                description: 'Pueblo de clima fresco a 1.500 msnm con vistas espectaculares al valle. Café de altura, fresas, y el Festival de la Fraternidad Colombo-Venezolana. Escape del calor intenso.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Valledupar tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:30 a 8:30 AM y de 12:00 a 2:00 PM. Horario diferente al de otras ciudades.',
            tolls: 'Hacia Manaure no hay peajes. Hacia Santa Marta hay varios peajes (~$40.000 COP total). Las vías a balnearios cercanos están en buen estado.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Guatapurí y balnearios hay parqueo informal (~$5.000 COP/día).'
        },
        bestSeason: 'Valledupar es caliente todo el año (28-38°C). El Festival de la Leyenda Vallenata en abril-mayo es el evento más importante de la música colombiana, pero reserva con mucha anticipación. La temporada seca de diciembre a marzo es ideal para balnearios. Para Manaure y zonas altas, cualquier época ofrece clima fresco.'
    },
    'Villavicencio': {
        intro: `Villavicencio, la Puerta al Llano, es donde los Andes se despiden y comienza la inmensa planicie de la Orinoquía colombiana. Con un carro de alquiler puedes explorar esta pujante ciudad y adentrarte en el paisaje llanero de atardeceres infinitos, hatos ganaderos y fauna silvestre. El Aeropuerto Vanguardia te conecta con Bogotá en vuelos cortos, aunque la vía terrestre desde la capital es una experiencia en sí misma. Tener vehículo propio te permite recorrer Caño Cristales (en temporada), visitar Acacías y sus termales, explorar hatos turísticos y vivir la cultura llanera de joropo, mamona y coleo. Villavicencio combina sabana, ríos, biodiversidad y el espíritu libre del llanero colombiano.`,
        destinations: [
            {
                name: 'Caño Cristales (vía La Macarena)',
                time: '45 minutos en avioneta',
                description: 'El río más hermoso del mundo con sus colores únicos. Solo accesible en avioneta desde Villavicencio (junio a noviembre). Experiencia de vida que requiere planificación anticipada.'
            },
            {
                name: 'Acacías y Termales',
                time: '30 minutos',
                description: 'Municipio llanero con el Festival del Retorno y termales naturales. Aguas medicinales, fincas turísticas y el corazón de la cultura llanera. Mamona y joropo garantizados.'
            },
            {
                name: 'Puerto López (Centro Geográfico)',
                time: '1.5 horas',
                description: 'El Ombligo de Colombia, punto geográfico central del país. Obelisco, atardeceres llaneros sobre el río Meta y gastronomía de río. Ruta hacia los llanos profundos.'
            },
            {
                name: 'Bioparque Los Ocarros',
                time: '20 minutos',
                description: 'Zoológico especializado en fauna llanera y amazónica. Dantas, chigüiros, anacondas y jaguares en ambientes naturales. Educación ambiental sobre ecosistemas colombianos.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Villavicencio tiene pico y placa de lunes a viernes según el último dígito de la placa, de 6:30 a 8:30 AM y de 5:30 a 7:30 PM. Aplica en el casco urbano.',
            tolls: 'La vía Bogotá-Villavicencio tiene 2 peajes (~$26.000 COP total). Es una vía de montaña espectacular pero con curvas. Hacia Acacías y Puerto López las vías son planas.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Viva Villavicencio y Unicentro hay tarifa con consumo.'
        },
        bestSeason: 'Villavicencio tiene clima cálido-húmedo (24-33°C). La temporada seca de diciembre a marzo es ideal para explorar el llano. Caño Cristales solo está abierto de junio a noviembre cuando el río tiene colores. El Torneo del Joropo en junio-julio es la máxima expresión cultural llanera.'
    },
    'Palmira': {
        intro: `Palmira, la Villa de las Palmas y Capital Agrícola de Colombia, es una ciudad pujante en el corazón del Valle del Cauca. Con un carro de alquiler puedes explorar esta ciudad de más de 300.000 habitantes y acceder fácilmente a destinos cercanos como Buga, Cali o el Lago Calima. El Aeropuerto Alfonso Bonilla Aragón de Cali está a solo 20 minutos, facilitando el inicio de tu viaje. Tener vehículo propio te permite recorrer la zona agroindustrial más importante del país, visitar haciendas azucareras históricas, conocer la Basílica de Buga y explorar el corredor turístico del Valle. Palmira combina tradición agrícola, ubicación estratégica y la calidez de la gente vallecaucana.`,
        destinations: [
            {
                name: 'Basílica del Señor de los Milagros (Buga)',
                time: '40 minutos',
                description: 'El santuario más visitado de Colombia, a corta distancia desde Palmira. Millones de peregrinos al año, arquitectura impresionante y dulces típicos de Buga.'
            },
            {
                name: 'Cali',
                time: '30 minutos',
                description: 'La capital de la salsa está a minutos. Zoológico, Cristo Rey, Gato de Tejada, barrios bohemios y la mejor rumba salsera del mundo. Perfecta para un día completo.'
            },
            {
                name: 'Haciendas del Valle del Cauca',
                time: '30 minutos',
                description: 'Recorre haciendas históricas como El Paraíso (de la novela María) o Piedechinche con su museo de la caña. Historia azucarera y arquitectura colonial vallecaucana.'
            },
            {
                name: 'Amaime y zona rural',
                time: '25 minutos',
                description: 'Corregimiento con balnearios en el río Amaime. Restaurantes de campo, sancocho valluno y paisajes de caña de azúcar hasta el horizonte. Domingo típico vallecaucano.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Palmira tiene pico y placa de lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 7:00 PM. Los fines de semana sin restricción.',
            tolls: 'Hacia Buga hay un peaje (~$10.500 COP). Hacia Cali no hay peajes por la vía principal. Las vías del Valle están en excelente estado, planas y bien señalizadas.',
            parking: 'En el centro y zonas comerciales los parqueaderos cuestan entre $2.000-4.000 COP/hora. En Llanogrande y Unicentro hay tarifa con consumo.'
        },
        bestSeason: 'Palmira tiene clima cálido agradable todo el año (23-32°C). Las fiestas patronales en enero y la Feria de la Agricultura en agosto son épocas festivas. La temporada seca de diciembre a marzo es ideal para viajes por carretera. Para Buga, cualquier época es buena aunque domingos y festivos hay más peregrinos.'
    },
    'Soledad': {
        intro: `Soledad, el segundo municipio más poblado del Atlántico, es parte integral del Área Metropolitana de Barranquilla y un importante centro industrial y comercial del Caribe colombiano. Con un carro de alquiler puedes moverte fácilmente entre Soledad, Barranquilla y los destinos turísticos de la costa norte. El Aeropuerto Internacional Ernesto Cortissoz está en Soledad, a solo minutos del centro, lo que hace ideal recoger tu vehículo al llegar. Tener carro propio te permite explorar Barranquilla, visitar Puerto Colombia, aventurarte a Santa Marta o Cartagena, y conocer la vida comercial soledeña. Soledad combina ubicación estratégica, actividad industrial y el espíritu alegre del Carnaval de Barranquilla.`,
        destinations: [
            {
                name: 'Barranquilla',
                time: '20 minutos',
                description: 'La Puerta de Oro de Colombia está al lado. Malecón del Río, Museo del Caribe, zoológico y la mejor vida nocturna del Caribe. El Carnaval de Barranquilla es Patrimonio de la Humanidad.'
            },
            {
                name: 'Puerto Colombia y Salgar',
                time: '35 minutos',
                description: 'Pueblos costeros con el histórico muelle de Puerto Colombia, playas locales y restaurantes de pescado fresco. Paseo dominical tradicional de barranquilleros y soledeños.'
            },
            {
                name: 'Santa Marta y Parque Tayrona',
                time: '2.5 horas',
                description: 'La ciudad más antigua de Sudamérica y el parque natural más icónico de Colombia. Playas vírgenes, Sierra Nevada y biodiversidad única. Road trip imperdible.'
            },
            {
                name: 'Cartagena',
                time: '2.5 horas',
                description: 'La Ciudad Amurallada Patrimonio de la Humanidad. Historia colonial, gastronomía, playas de Barú y atardeceres en las murallas. Destino obligado desde Soledad.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Soledad comparte esquema de pico y placa con Barranquilla: lunes a viernes según el último dígito de la placa, de 7:00 a 9:00 AM y de 5:00 a 8:00 PM.',
            tolls: 'Hacia Cartagena hay 2 peajes (~$25.000 COP total). Hacia Santa Marta hay 3 peajes (~$30.000 COP total). Hacia Puerto Colombia no hay peajes.',
            parking: 'En zonas comerciales como Gran Centro los parqueaderos cuestan entre $2.500-5.000 COP/hora. Cerca del aeropuerto hay parqueaderos de largo plazo más económicos.'
        },
        bestSeason: 'Soledad tiene clima caliente todo el año (28-35°C), típico del Caribe colombiano. La época del Carnaval (febrero-marzo) es la más festiva pero con alta demanda. La temporada seca de diciembre a abril es ideal para playas. Si buscas precios bajos, considera septiembre a noviembre.'
    },
    'Floridablanca': {
        intro: `Floridablanca, la Ciudad Jardín de Colombia, es el municipio con mejor calidad de vida del Área Metropolitana de Bucaramanga. Con un carro de alquiler puedes explorar este próspero municipio y acceder a todos los destinos turísticos de Santander. El Aeropuerto Internacional Palonegro está en Lebrija, a 40 minutos del centro de Floridablanca. Tener vehículo propio te permite visitar el Cañón del Chicamocha, explorar los pueblos coloniales de Santander, subir a la Mesa de los Santos y disfrutar de la gastronomía santandereana. Floridablanca combina desarrollo urbano, zonas verdes, centros comerciales modernos y acceso inmediato a naturaleza espectacular.`,
        destinations: [
            {
                name: 'Cañón del Chicamocha (Panachi)',
                time: '1.5 horas',
                description: 'Uno de los cañones más profundos del mundo. Teleférico de 6.3 km, deportes extremos, parapente y vistas que quitan el aliento. El parque Panachi tiene atracciones para toda la familia.'
            },
            {
                name: 'Girón',
                time: '10 minutos',
                description: 'Pueblo colonial Patrimonio Nacional a minutos de Floridablanca. Calles empedradas, arquitectura blanca, el río de Oro y dulces típicos. Fin de semana perfecto sin ir lejos.'
            },
            {
                name: 'Mesa de los Santos',
                time: '50 minutos',
                description: 'Meseta a 1.600 msnm con clima perfecto, haciendas cafeteras y miradores al Cañón. Parapente, golf, camping y la mejor carne oreada de Santander.'
            },
            {
                name: 'San Gil',
                time: '2 horas',
                description: 'Capital del turismo extremo en Colombia. Rafting, torrentismo, espeleología y el Parque El Gallineral. Meca de la aventura accesible desde Floridablanca.'
            }
        ],
        drivingTips: {
            picoPlaca: 'Floridablanca comparte esquema con Bucaramanga: pico y placa de lunes a viernes según el último dígito de la placa, de 6:00 a 8:00 AM y de 5:30 a 7:30 PM.',
            tolls: 'Hacia el Cañón del Chicamocha hay un peaje (~$10.000 COP). Hacia San Gil hay 2 peajes (~$18.000 COP total). Las vías son de montaña pero bien mantenidas.',
            parking: 'En Cañaveral y zonas comerciales los parqueaderos cuestan entre $2.500-5.000 COP/hora. En centros comerciales como Cañaveral hay tarifa con consumo.'
        },
        bestSeason: 'Floridablanca tiene clima templado perfecto todo el año (22-28°C). La temporada seca de diciembre a marzo es ideal para deportes extremos y parapente. La Feria Bonita de Bucaramanga en septiembre anima toda el área metropolitana. Para el Cañón, los mejores días son entre semana cuando hay menos turistas.'
    }
}

/**
 * Returns expanded content for a city if available
 */
export const useCityExpandedContent = (cityName: string): CityExpandedContent | null => {
    return cityExpandedContent[cityName] || null
}

/**
 * Check if a city has expanded content
 */
export const hasCityExpandedContent = (cityName: string): boolean => {
    return cityName in cityExpandedContent
}
