import type { CityExpandedContent } from './types'

export const cityName = "Neiva"
export const citySlug = "neiva"

// W1 placeholder: copied from the current city catalog so rendering stays unchanged.
export const metaDescription = "Neiva es la base ideal para dos de los tesoros más impresionantes de Colombia: el Desierto de la Tatacoa (a hora y media) y el Parque Arqueológico de San Agustín (a cuatro horas por carretera escénica). Retira tu carro en el Aeropuerto Benito Salas y arma tu propia ruta por el Huila, con paradas en termales, Rivera y pueblos cafeteros. Sin anticipos, con descuentos de hasta el 60% y entrega los 7 días. Si vienes durante el Festival del Bambuco, la movilidad propia te permite vivir cada evento sin restricciones."

// W1 placeholder: copied verbatim from the shared logic layer.
export const content: CityExpandedContent = {
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
    }
