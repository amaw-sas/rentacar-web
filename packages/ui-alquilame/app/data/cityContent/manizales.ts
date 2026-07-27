import type { CityExpandedContent } from './types'

export const cityName = "Manizales"
export const citySlug = "manizales"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Entre volcanes nevados y fincas cafeteras, Manizales ofrece una experiencia única en el Eje Cafetero. Recorre la ciudad en carro y aventúrate hacia el Parque Nacional Los Nevados, sube al mirador de Chipre, visita el Recinto del Pensamiento o baja a los termales de Santa Rosa de Cabal. Reserva en línea sin anticipos y con descuentos de hasta el 60%. La Ciudad de las Puertas Abiertas tiene carreteras de montaña que premian a quien se anima a recorrerlas con calma y libertad."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
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
    }
