import type { CityExpandedContent } from './types'

export const cityName = "Pereira"
export const citySlug = "pereira"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Pereira, la Querendona del Eje Cafetero, tiene la ubicación perfecta: desde aquí llegas fácil a Salento, a las Termales de Santa Rosa de Cabal, al Bioparque Ukumarí y a Manizales o Armenia en menos de una hora. Alquila en el Aeropuerto Matecaña sin anticipos y con hasta 60% de descuento por reserva anticipada. Pereira es ideal como base para recorrer todo el triángulo cafetero con libertad, parando en fincas, miradores y pueblos que solo se alcanzan en vehículo propio. Disponibilidad los 7 días."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
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
    }
