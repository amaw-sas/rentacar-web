import type { CityExpandedContent } from './types'

export const cityName = "Floridablanca"
export const citySlug = "floridablanca"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Floridablanca, la Ciudad Jardín de Santander, forma parte del área metropolitana de Bucaramanga y es un punto estratégico para recorrer la región. El Aeropuerto Palonegro conecta el área metropolitana con las principales ciudades del país. Desde Floridablanca puedes visitar el Jardín Botánico Eloy Valenzuela, subir al Cerro del Santísimo, cruzar a Girón o lanzarte al Cañón del Chicamocha y Mesa de los Santos. Sin anticipos y con descuentos de hasta el 60%, Floridablanca ofrece la tranquilidad de una ciudad residencial con toda la aventura santandereana a menos de una hora."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
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
