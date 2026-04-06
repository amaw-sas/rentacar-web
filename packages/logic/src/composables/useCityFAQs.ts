// External dependencies
import type { FAQPage } from 'schema-dts';

export interface FAQ {
    label: string
    content: string
}

/**
 * City-specific FAQs for major cities with local details
 */
const citySpecificFAQs: Record<string, FAQ[]> = {
    'Bogotá': [
        {
            label: '¿Dónde puedo recoger mi carro en Bogotá?',
            content: 'Contamos con entrega en el Aeropuerto El Dorado (llegadas nacionales e internacionales) y en nuestra sede del centro. Coordinamos la hora exacta para esperarte a tu llegada.'
        },
        {
            label: '¿Qué vehículo recomiendan para moverse en Bogotá?',
            content: 'Para Bogotá recomendamos carros compactos por su maniobrabilidad en el tráfico y facilidad de parqueo. Si planeas salir hacia Villa de Leyva o el Eje Cafetero, un sedán ofrece más comodidad para viajes largos.'
        },
        {
            label: '¿Aplica pico y placa al carro alquilado en Bogotá?',
            content: 'Sí, los vehículos de alquiler están sujetos al pico y placa de Bogotá según el último dígito de la placa. Te informamos la restricción al momento de la entrega para que puedas planificar tu día.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Bogotá?',
            content: 'Los precios en Bogotá inician desde $110.000 COP/día para compactos. Reservando con 15+ días de anticipación puedes obtener hasta 60% de descuento. Los fines de semana y festivos tienen tarifas especiales.'
        },
        {
            label: '¿Puedo viajar a otras ciudades con el carro alquilado en Bogotá?',
            content: 'Sí, puedes viajar a cualquier ciudad de Colombia. Destinos populares desde Bogotá incluyen Villa de Leyva (3h), Girardot (2.5h) y el Eje Cafetero (7h). Ofrecemos devolución en otra ciudad con cargo adicional.'
        },
        {
            label: '¿Qué documentos necesito para alquilar en Bogotá?',
            content: 'Necesitas: licencia de conducción vigente, cédula o pasaporte (mayores de 21 años), y tarjeta de crédito con cupo disponible. Para extranjeros, la licencia de su país es válida durante su estadía como turista.'
        }
    ],
    'Medellín': [
        {
            label: '¿Dónde puedo recoger mi carro en Medellín?',
            content: 'Ofrecemos entrega en el Aeropuerto José María Córdova (Rionegro) y en nuestra sede de El Poblado. El aeropuerto está a 45 minutos del centro, ideal para iniciar tu viaje directamente.'
        },
        {
            label: '¿Qué vehículo recomiendan para Medellín y alrededores?',
            content: 'Para Medellín ciudad un compacto es ideal. Si planeas visitar Guatapé, Santa Fe de Antioquia o el Eje Cafetero, recomendamos sedán o camioneta para mayor comodidad en las carreteras de montaña.'
        },
        {
            label: '¿Aplica pico y placa en Medellín?',
            content: 'Sí, Medellín tiene pico y placa según el último dígito de la placa. Te informamos la restricción al entregar el vehículo. Los sábados, domingos y festivos no hay restricción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Medellín?',
            content: 'Los precios en Medellín inician desde $115.000 COP/día para compactos. Reservando con anticipación puedes obtener hasta 60% de descuento. Ofrecemos tarifas semanales y mensuales con mejores precios.'
        },
        {
            label: '¿Puedo devolver el carro en otra ciudad diferente a Medellín?',
            content: 'Sí, ofrecemos devolución en cualquiera de nuestras 19 ciudades. Destinos frecuentes desde Medellín: Cartagena, Santa Marta y el Eje Cafetero. El cargo por traslado varía según la distancia.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Medellín?',
            content: 'Destinos imperdibles: Guatapé y El Peñol (2h), Santa Fe de Antioquia (1.5h), Jardín (3h), y San Rafael (2.5h). Un carro te da libertad para explorar pueblos y paisajes a tu ritmo.'
        }
    ],
    'Cali': [
        {
            label: '¿Dónde puedo recoger mi carro en Cali?',
            content: 'Contamos con entrega en el Aeropuerto Alfonso Bonilla Aragón y en nuestra sede del norte de Cali. Coordinamos la hora para esperarte a tu llegada.'
        },
        {
            label: '¿Qué vehículo recomiendan para Cali?',
            content: 'Para Cali ciudad un compacto es perfecto. Si planeas visitar el Pacífico (Buenaventura) o San Cipriano, una camioneta ofrece mejor desempeño en esas rutas. Para el Eje Cafetero, un sedán es ideal.'
        },
        {
            label: '¿Aplica pico y placa en Cali?',
            content: 'Sí, Cali tiene restricción de pico y placa según el último dígito de la placa. Te informamos al entregar el vehículo. Los fines de semana y festivos puedes circular sin restricción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cali?',
            content: 'Los precios en Cali inician desde $105.000 COP/día para compactos. Con reserva anticipada puedes obtener hasta 60% de descuento. Ofrecemos tarifas especiales para alquileres de una semana o más.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Cali?',
            content: 'Destinos populares: Buga y el Señor de los Milagros (1.5h), Lago Calima (2h), Popayán (3h), y el Parque Natural Farallones. El carro te permite explorar el Valle del Cauca con total libertad.'
        },
        {
            label: '¿Puedo viajar al Pacífico con el carro alquilado?',
            content: 'Sí, puedes viajar a Buenaventura y la costa Pacífica. Recomendamos camioneta para mayor comodidad. Algunas zonas requieren precauciones especiales que te indicamos al momento de la reserva.'
        }
    ],
    'Cartagena': [
        {
            label: '¿Dónde puedo recoger mi carro en Cartagena?',
            content: 'Ofrecemos entrega en el Aeropuerto Rafael Núñez y en el centro histórico. El aeropuerto está a 15 minutos de la ciudad amurallada, ideal para comenzar tu aventura caribeña.'
        },
        {
            label: '¿Necesito carro para moverme en Cartagena?',
            content: 'El centro histórico es peatonal, pero un carro es ideal para visitar playas como Barú, Playa Blanca, o escapadas a Islas del Rosario (ferry). También facilita ir a Santa Marta o Barranquilla.'
        },
        {
            label: '¿Qué vehículo recomiendan para Cartagena?',
            content: 'Un compacto es suficiente para Cartagena y Barú. Si planeas viajar a Santa Marta o hacer el recorrido por la costa, un sedán con aire acondicionado potente te dará mayor confort.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cartagena?',
            content: 'Los precios en Cartagena inician desde $120.000 COP/día. En temporada alta (diciembre-enero, Semana Santa) los precios pueden variar. Reserva con anticipación para mejores tarifas.'
        },
        {
            label: '¿Puedo viajar a Santa Marta con el carro de Cartagena?',
            content: 'Sí, Santa Marta está a 4 horas por carretera. Es una ruta segura y bien pavimentada. Puedes devolver el carro en Santa Marta si prefieres no regresar. Ofrecemos servicio one-way.'
        },
        {
            label: '¿Cómo llego a Playa Blanca con carro?',
            content: 'Playa Blanca está en Barú, a 1 hora de Cartagena. Puedes llegar en carro hasta el parqueadero de la playa. Recomendamos salir temprano para disfrutar el día completo.'
        }
    ],
    'Barranquilla': [
        {
            label: '¿Dónde puedo recoger mi carro en Barranquilla?',
            content: 'Contamos con entrega en el Aeropuerto Ernesto Cortissoz y en nuestra sede del norte. Coordinamos la hora exacta para recibirte a tu llegada.'
        },
        {
            label: '¿Qué vehículo recomiendan para Barranquilla?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima de Barranquilla. Si planeas visitar otras ciudades de la costa como Cartagena o Santa Marta, un sedán te dará más comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Barranquilla?',
            content: 'Los precios en Barranquilla inician desde $100.000 COP/día para compactos. Durante el Carnaval de Barranquilla los precios pueden variar. Reserva con anticipación.'
        },
        {
            label: '¿Puedo viajar a Cartagena o Santa Marta desde Barranquilla?',
            content: 'Sí, Cartagena está a 2 horas y Santa Marta a 1.5 horas. Ambas rutas son seguras y bien pavimentadas. Puedes devolver el carro en cualquiera de estas ciudades.'
        },
        {
            label: '¿Hay pico y placa en Barranquilla?',
            content: 'Actualmente Barranquilla no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Barranquilla?',
            content: 'Destinos recomendados: Cartagena (2h), Santa Marta y Parque Tayrona (2h), Puerto Colombia y sus playas (30min), y Usiacurí, pueblo artesanal (1h).'
        }
    ],
    'Santa Marta': [
        {
            label: '¿Dónde puedo recoger mi carro en Santa Marta?',
            content: 'Ofrecemos entrega en el Aeropuerto Simón Bolívar y en nuestra sede del centro. El aeropuerto está a 20 minutos del centro histórico y las playas.'
        },
        {
            label: '¿Qué vehículo recomiendan para Santa Marta?',
            content: 'Un compacto con aire acondicionado es ideal para la ciudad y playas cercanas. Para visitar el Parque Tayrona o Minca, recomendamos camioneta por los caminos de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Santa Marta?',
            content: 'Los precios en Santa Marta inician desde $110.000 COP/día para compactos. En temporada alta (diciembre-enero, Semana Santa) los precios pueden variar. Reserva con anticipación para mejores tarifas.'
        },
        {
            label: '¿Puedo entrar al Parque Tayrona con carro?',
            content: 'Puedes llegar en carro hasta el parqueadero de El Zaino (entrada principal) o Calabazo. Desde allí el acceso es a pie o en transporte interno del parque. El carro queda seguro en los parqueaderos.'
        },
        {
            label: '¿Hay pico y placa en Santa Marta?',
            content: 'Santa Marta no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Santa Marta?',
            content: 'Destinos imperdibles: Parque Tayrona (45min), Minca y sus cascadas (45min), Taganga (15min), Palomino (1.5h), y Cartagena (4h). Un carro te da libertad para explorar la Sierra Nevada.'
        }
    ],
    'Pereira': [
        {
            label: '¿Dónde puedo recoger mi carro en Pereira?',
            content: 'Contamos con entrega en el Aeropuerto Internacional Matecaña y en nuestra sede del centro. El aeropuerto está a 15 minutos del centro de la ciudad.'
        },
        {
            label: '¿Qué vehículo recomiendan para el Eje Cafetero?',
            content: 'Un sedán es ideal para recorrer el Eje Cafetero con comodidad. Si planeas visitar fincas cafeteras por caminos destapados o el Valle del Cocora, una camioneta te dará mejor desempeño.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Pereira?',
            content: 'Los precios en Pereira inician desde $105.000 COP/día para compactos. Reservando con anticipación puedes obtener hasta 60% de descuento. Ofrecemos tarifas especiales para recorrer el Eje Cafetero.'
        },
        {
            label: '¿Aplica pico y placa en Pereira?',
            content: 'Sí, Pereira tiene pico y placa según el último dígito de la placa de lunes a viernes. Te informamos la restricción al entregar el vehículo. Los fines de semana y festivos no hay restricción.'
        },
        {
            label: '¿Puedo visitar Salento y el Valle del Cocora con el carro?',
            content: 'Sí, Salento está a 45 minutos de Pereira. Puedes llegar en carro hasta el pueblo y tomar un Willys al Valle del Cocora, o si tienes camioneta, subir directamente. La ruta es pavimentada hasta Salento.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Pereira?',
            content: 'Destinos del Eje Cafetero: Salento y Valle del Cocora (45min), Filandia (40min), Santa Rosa de Cabal y termales (30min), Manizales (1h), y Armenia (45min). Paisaje Cultural Cafetero Patrimonio UNESCO.'
        }
    ],
    'Bucaramanga': [
        {
            label: '¿Dónde puedo recoger mi carro en Bucaramanga?',
            content: 'Ofrecemos entrega en el Aeropuerto Palonegro y en nuestra sede de Floridablanca. El aeropuerto está a 30 minutos del centro de Bucaramanga por autopista.'
        },
        {
            label: '¿Qué vehículo recomiendan para Bucaramanga y alrededores?',
            content: 'Un sedán es ideal para la ciudad y viajes a pueblos cercanos. Para San Gil y deportes extremos o el Cañón del Chicamocha, recomendamos camioneta por las carreteras de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Bucaramanga?',
            content: 'Los precios en Bucaramanga inician desde $100.000 COP/día para compactos. Reservando con anticipación puedes obtener hasta 60% de descuento. Ideal para recorrer Santander.'
        },
        {
            label: '¿Aplica pico y placa en Bucaramanga?',
            content: 'Sí, Bucaramanga tiene pico y placa rotativo según el último dígito de la placa. Te informamos la restricción al entregar el vehículo. Los fines de semana puedes circular sin restricción.'
        },
        {
            label: '¿Cómo llego al Cañón del Chicamocha en carro?',
            content: 'El Cañón del Chicamocha está a 1 hora de Bucaramanga por la vía a San Gil. La carretera es pavimentada con vistas espectaculares. Puedes parar en el Parque Nacional del Chicamocha (Panachi).'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Bucaramanga?',
            content: 'Destinos de aventura: San Gil y deportes extremos (2h), Barichara pueblo patrimonio (2.5h), Cañón del Chicamocha (1h), y Girón pueblo colonial (15min). Santander es el destino de aventura de Colombia.'
        }
    ],
    'Armenia': [
        {
            label: '¿Dónde puedo recoger mi carro en Armenia?',
            content: 'Contamos con entrega en el Aeropuerto El Edén y en nuestra sede del centro. El aeropuerto está a 15 minutos del centro de Armenia.'
        },
        {
            label: '¿Qué vehículo recomiendan para recorrer el Eje Cafetero?',
            content: 'Un sedán ofrece comodidad para las carreteras del Quindío. Si planeas visitar fincas cafeteras por caminos rurales o subir al Valle del Cocora, una camioneta es mejor opción.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Armenia?',
            content: 'Los precios en Armenia inician desde $100.000 COP/día para compactos. Con reserva anticipada puedes obtener hasta 60% de descuento. Perfecta base para explorar el Eje Cafetero.'
        },
        {
            label: '¿Hay pico y placa en Armenia?',
            content: 'Armenia tiene pico y placa rotativo pero con horarios limitados. Te informamos la restricción vigente al entregar el vehículo. La mayoría de destinos turísticos están fuera del área urbana.'
        },
        {
            label: '¿Puedo visitar el Parque del Café con el carro?',
            content: 'Sí, el Parque del Café está a 20 minutos de Armenia con amplio parqueadero. También puedes visitar PANACA (30min) y el Parque Los Arrieros en el mismo día.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Armenia?',
            content: 'Destinos del Quindío: Salento y Valle del Cocora (40min), Filandia (30min), Parque del Café (20min), Buenavista mirador (25min), y fincas cafeteras. Todo el Paisaje Cultural Cafetero a tu alcance.'
        }
    ],
    'Manizales': [
        {
            label: '¿Dónde puedo recoger mi carro en Manizales?',
            content: 'Ofrecemos entrega en el Aeropuerto La Nubia y en nuestra sede del centro. El aeropuerto está a 15 minutos del centro de la ciudad.'
        },
        {
            label: '¿Qué vehículo recomiendan para Manizales?',
            content: 'Manizales es ciudad de montaña con calles empinadas. Un carro con buen torque es importante. Para visitar el Nevado del Ruiz o termales por carreteras rurales, recomendamos camioneta.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Manizales?',
            content: 'Los precios en Manizales inician desde $105.000 COP/día para compactos. Reservando con anticipación obtienes hasta 60% de descuento. Ideal para explorar Caldas y el Eje Cafetero.'
        },
        {
            label: '¿Aplica pico y placa en Manizales?',
            content: 'Sí, Manizales tiene pico y placa según el último dígito de la placa en días hábiles. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Puedo subir al Nevado del Ruiz en carro?',
            content: 'Puedes llegar en carro hasta el sector de Las Brisas (4.050 msnm). El acceso al Parque Nacional requiere registro previo. Recomendamos camioneta y salir temprano para evitar neblina.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Manizales?',
            content: 'Destinos de Caldas: Nevado del Ruiz (2h), Termales de Santa Rosa (1.5h), Salamina pueblo patrimonio (2h), Recinto del Pensamiento (20min), y Chinchiná zona cafetera (30min).'
        }
    ],
    'Villavicencio': [
        {
            label: '¿Dónde puedo recoger mi carro en Villavicencio?',
            content: 'Contamos con entrega en el Aeropuerto Vanguardia y en nuestra sede del centro. El aeropuerto está a 10 minutos del centro de la ciudad.'
        },
        {
            label: '¿Qué vehículo recomiendan para los Llanos?',
            content: 'Un sedán es suficiente para Villavicencio y vías principales. Si planeas explorar fincas llaneras, rutas rurales o ir hacia Caño Cristales (La Macarena), una camioneta 4x4 es indispensable.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Villavicencio?',
            content: 'Los precios en Villavicencio inician desde $95.000 COP/día para compactos. Con reserva anticipada puedes obtener hasta 60% de descuento. Puerta de entrada a los Llanos Orientales.'
        },
        {
            label: '¿Hay pico y placa en Villavicencio?',
            content: 'Villavicencio no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad y el departamento.'
        },
        {
            label: '¿Cómo es la vía Bogotá-Villavicencio?',
            content: 'La vía Bogotá-Villavicencio es moderna y pavimentada (2.5h). Pasas por el túnel de Buenavista. Recomendamos viajar de día para disfrutar el paisaje del piedemonte llanero.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Villavicencio?',
            content: 'Destinos llaneros: Bioparque Los Ocarros (15min), Puerto López y el Obelisco (1h), Caño Cristales en La Macarena (requiere vuelo), fincas con coleo y mamona. Vive la cultura llanera.'
        }
    ],
    'Valledupar': [
        {
            label: '¿Dónde puedo recoger mi carro en Valledupar?',
            content: 'Ofrecemos entrega en el Aeropuerto Alfonso López Pumarejo y en nuestra sede del centro. El aeropuerto está a 5 minutos del centro de la ciudad.'
        },
        {
            label: '¿Qué vehículo recomiendan para Valledupar?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima cálido de Valledupar. Para visitar la Sierra Nevada o pueblos indígenas, recomendamos camioneta por los caminos rurales.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Valledupar?',
            content: 'Los precios en Valledupar inician desde $95.000 COP/día para compactos. Reservando con anticipación obtienes hasta 60% de descuento. Durante el Festival Vallenato los precios pueden variar.'
        },
        {
            label: '¿Hay pico y placa en Valledupar?',
            content: 'Valledupar no tiene restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda la ciudad.'
        },
        {
            label: '¿Puedo visitar el Río Guatapurí con carro?',
            content: 'Sí, el Río Guatapurí atraviesa la ciudad y hay varios balnearios accesibles en carro. El más famoso es el Balneario Hurtado a 10 minutos del centro. Ideal para refrescarse del calor.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Valledupar?',
            content: 'Destinos del Cesar: Río Guatapurí y balnearios (10min), Manaure Balcón del Cesar (1h), Pueblo Bello y Sierra Nevada (1.5h), La Mina pueblo patrimonio (2h). Cuna del vallenato y naturaleza.'
        }
    ],
    'Ibagué': [
        {
            label: '¿Dónde puedo recoger mi carro en Ibagué?',
            content: 'Contamos con entrega en el Aeropuerto Perales y en nuestra sede del centro. El aeropuerto está a 10 minutos del centro de Ibagué, la Capital Musical de Colombia.'
        },
        {
            label: '¿Qué vehículo recomiendan para Ibagué y el Tolima?',
            content: 'Un sedán es ideal para Ibagué y la vía al Nevado del Tolima. Para visitar el Cañón del Combeima o fincas cafeteras por caminos rurales, recomendamos camioneta por mejor desempeño.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Ibagué?',
            content: 'Los precios en Ibagué inician desde $95.000 COP/día para compactos. Reservando con anticipación puedes obtener hasta 60% de descuento. Punto estratégico entre Bogotá y el Eje Cafetero.'
        },
        {
            label: '¿Aplica pico y placa en Ibagué?',
            content: 'Sí, Ibagué tiene pico y placa según el último dígito de la placa en horarios pico. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Cómo llego al Cañón del Combeima en carro?',
            content: 'El Cañón del Combeima está a 30 minutos de Ibagué. La vía es pavimentada hasta Juntas, luego destapada hacia el Nevado. Recomendamos camioneta para subir a los termales y cascadas.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Ibagué?',
            content: 'Destinos del Tolima: Cañón del Combeima y Nevado del Tolima (30min), Melgar y Girardot (2h), Honda río Magdalena (2h), Salento por el Alto de la Línea (2.5h). Naturaleza y clima cálido.'
        }
    ],
    'Neiva': [
        {
            label: '¿Dónde puedo recoger mi carro en Neiva?',
            content: 'Ofrecemos entrega en el Aeropuerto Benito Salas y en nuestra sede del centro. El aeropuerto está a 10 minutos del centro de Neiva, puerta al Desierto de la Tatacoa.'
        },
        {
            label: '¿Qué vehículo recomiendan para Neiva y el Huila?',
            content: 'Un sedán con buen aire acondicionado es ideal para el clima cálido de Neiva. Para el Desierto de la Tatacoa o San Agustín, recomendamos camioneta por las carreteras de montaña.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Neiva?',
            content: 'Los precios en Neiva inician desde $90.000 COP/día para compactos. Con reserva anticipada obtienes hasta 60% de descuento. Base perfecta para explorar las maravillas del Huila.'
        },
        {
            label: '¿Hay pico y placa en Neiva?',
            content: 'Neiva tiene pico y placa rotativo según el último dígito de la placa en días hábiles. Te informamos la restricción vigente al entregar el vehículo. Fines de semana sin restricción.'
        },
        {
            label: '¿Cómo llego al Desierto de la Tatacoa en carro?',
            content: 'El Desierto de la Tatacoa está a 45 minutos de Neiva por Villavieja. La vía es pavimentada. Recomendamos llegar al atardecer para ver las estrellas en el observatorio astronómico.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Neiva?',
            content: 'Destinos del Huila: Desierto de la Tatacoa (45min), San Agustín y parque arqueológico (4h), Represa de Betania (1h), Termales de Rivera (30min), Pitalito (3h). Arqueología y naturaleza única.'
        }
    ],
    'Cúcuta': [
        {
            label: '¿Dónde puedo recoger mi carro en Cúcuta?',
            content: 'Contamos con entrega en el Aeropuerto Camilo Daza y en nuestra sede del centro. El aeropuerto está a 10 minutos del centro de Cúcuta, ciudad fronteriza con Venezuela.'
        },
        {
            label: '¿Qué vehículo recomiendan para Cúcuta?',
            content: 'Un compacto con excelente aire acondicionado es esencial para el clima cálido de Cúcuta (promedio 28°C). Para viajes a Pamplona o la zona montañosa, un sedán ofrece más confort.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Cúcuta?',
            content: 'Los precios en Cúcuta inician desde $90.000 COP/día para compactos. Reservando con anticipación puedes obtener hasta 60% de descuento. Ciudad estratégica del nororiente colombiano.'
        },
        {
            label: '¿Aplica pico y placa en Cúcuta?',
            content: 'Cúcuta tiene pico y placa según el último dígito de la placa en horarios específicos. Te informamos la restricción al entregar el vehículo. Los fines de semana puedes circular libremente.'
        },
        {
            label: '¿Puedo cruzar a Venezuela con el carro alquilado?',
            content: 'No, los vehículos de alquiler no pueden cruzar fronteras internacionales. Si necesitas visitar Venezuela, puedes dejar el carro en nuestra sede y cruzar por el puente internacional.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Cúcuta?',
            content: 'Destinos de Norte de Santander: Pamplona ciudad estudiantil (1.5h), Villa del Rosario sitio histórico (15min), Chinácota clima templado (1h), Ocaña (3h). Historia y comercio fronterizo.'
        }
    ],
    'Montería': [
        {
            label: '¿Dónde puedo recoger mi carro en Montería?',
            content: 'Ofrecemos entrega en el Aeropuerto Los Garzones y en nuestra sede del centro. El aeropuerto está a 15 minutos del centro de Montería, capital ganadera de Colombia.'
        },
        {
            label: '¿Qué vehículo recomiendan para Montería y Córdoba?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima cálido de Montería. Para visitar fincas ganaderas o la zona costera, recomendamos camioneta para caminos rurales.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Montería?',
            content: 'Los precios en Montería inician desde $95.000 COP/día para compactos. Con reserva anticipada obtienes hasta 60% de descuento. Ideal para explorar el Sinú y la sabana cordobesa.'
        },
        {
            label: '¿Hay pico y placa en Montería?',
            content: 'Montería no tiene restricción de pico y placa para vehículos particulares actualmente. Puedes circular libremente cualquier día de la semana por toda la ciudad y el departamento.'
        },
        {
            label: '¿Puedo viajar a las playas desde Montería?',
            content: 'Sí, las playas de Coveñas y Tolú están a 1.5 horas de Montería por carretera pavimentada. También puedes ir a San Antero (1h) o tomar lanchas a las Islas de San Bernardo.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Montería?',
            content: 'Destinos de Córdoba: Coveñas y Tolú playas (1.5h), Lorica pueblo patrimonio (1h), Ciénaga de Ayapel (2h), Tierralta y Nudo de Paramillo (2h). Ganadería, playas y naturaleza.'
        }
    ],
    'Floridablanca': [
        {
            label: '¿Dónde puedo recoger mi carro en Floridablanca?',
            content: 'Contamos con sede en Floridablanca y también ofrecemos entrega en el Aeropuerto Palonegro de Bucaramanga. Floridablanca es parte del área metropolitana, a 15 minutos del centro de Bucaramanga.'
        },
        {
            label: '¿Qué vehículo recomiendan para Floridablanca?',
            content: 'Un sedán es ideal para moverse por el área metropolitana de Bucaramanga. Si planeas visitar San Gil, el Cañón del Chicamocha o hacer deportes extremos, recomendamos camioneta.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Floridablanca?',
            content: 'Los precios en Floridablanca inician desde $95.000 COP/día para compactos. Reservando con anticipación obtienes hasta 60% de descuento. Mismas tarifas que nuestra sede de Bucaramanga.'
        },
        {
            label: '¿Aplica pico y placa en Floridablanca?',
            content: 'Floridablanca comparte el pico y placa del área metropolitana de Bucaramanga. Te informamos la restricción al entregar el vehículo. Fines de semana y festivos sin restricción.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Floridablanca o Bucaramanga?',
            content: 'No hay diferencia en tarifas ni condiciones. Floridablanca está a 15 minutos de Bucaramanga. Elige la sede más conveniente para tu ubicación. Ambas tienen acceso fácil a las vías principales.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Floridablanca?',
            content: 'Destinos desde el área metropolitana: San Gil capital extrema (2h), Barichara pueblo más lindo de Colombia (2.5h), Cañón del Chicamocha (1h), Mesa de los Santos (45min). Aventura santandereana.'
        }
    ],
    'Palmira': [
        {
            label: '¿Dónde puedo recoger mi carro en Palmira?',
            content: 'Contamos con sede en Palmira y también servicio en el Aeropuerto Alfonso Bonilla Aragón de Cali. Palmira está a 25 minutos del aeropuerto, ideal si tu destino es el Valle del Cauca.'
        },
        {
            label: '¿Qué vehículo recomiendan para Palmira?',
            content: 'Un compacto es perfecto para Palmira y el Valle del Cauca. Si planeas visitar el Lago Calima, Buga o hacer rutas por la cordillera, un sedán te dará mayor comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Palmira?',
            content: 'Los precios en Palmira inician desde $100.000 COP/día para compactos. Con reserva anticipada obtienes hasta 60% de descuento. Ubicación estratégica en el corazón del Valle.'
        },
        {
            label: '¿Hay pico y placa en Palmira?',
            content: 'Palmira tiene pico y placa según el último dígito de la placa en días hábiles. Te informamos la restricción vigente al entregar el vehículo. Fines de semana sin restricción vehicular.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Palmira o Cali?',
            content: 'Las tarifas son similares. Palmira está más cerca del aeropuerto (25min vs 45min a Cali centro). Si tu destino es el norte del Valle o el Eje Cafetero, Palmira puede ser más conveniente.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Palmira?',
            content: 'Destinos del Valle: Buga y el Señor de los Milagros (30min), Lago Calima (1.5h), Cali (30min), Parque Natural Farallones (1h), Hacienda El Paraíso de María (40min). Historia y naturaleza.'
        }
    ],
    'Soledad': [
        {
            label: '¿Dónde puedo recoger mi carro en Soledad?',
            content: 'Contamos con sede en Soledad y servicio en el Aeropuerto Ernesto Cortissoz de Barranquilla. Soledad es parte del área metropolitana, el aeropuerto está dentro del municipio.'
        },
        {
            label: '¿Qué vehículo recomiendan para Soledad?',
            content: 'Un compacto con excelente aire acondicionado es ideal para el clima caribeño de Soledad. Para viajes a Cartagena, Santa Marta o playas, un sedán ofrece más comodidad.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Soledad?',
            content: 'Los precios en Soledad inician desde $95.000 COP/día para compactos. Con reserva anticipada obtienes hasta 60% de descuento. Durante el Carnaval de Barranquilla los precios pueden variar.'
        },
        {
            label: '¿Hay pico y placa en Soledad?',
            content: 'Soledad y Barranquilla no tienen restricción de pico y placa para vehículos particulares. Puedes circular libremente cualquier día de la semana por toda el área metropolitana.'
        },
        {
            label: '¿Hay diferencia entre alquilar en Soledad o Barranquilla?',
            content: 'Las tarifas son iguales. Soledad tiene la ventaja de estar junto al aeropuerto, ideal si llegas por avión. Para ir al centro de Barranquilla son solo 20 minutos.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Soledad?',
            content: 'Destinos desde el área metropolitana: Cartagena (2h), Santa Marta y Parque Tayrona (2h), Puerto Colombia playas (30min), Usiacurí artesanías (1h). Todo el Caribe colombiano a tu alcance.'
        }
    ]
}

/**
 * Generates template-based FAQs for cities without specific content
 * Returns FAQs with city name interpolated
 */
const generateTemplateFAQs = (cityName: string): FAQ[] => {
    return [
        {
            label: `¿Cuáles son los requisitos para alquilar un carro en ${cityName}?`,
            content: `Para alquilar un carro en ${cityName} necesitas: ser mayor de 21 años, presentar licencia de conducción vigente (nacional o extranjera), documento de identidad (cédula o pasaporte) y una tarjeta de crédito con cupo disponible a nombre del conductor principal.`
        },
        {
            label: `¿Puedo recoger el carro en el aeropuerto de ${cityName}?`,
            content: `Sí, contamos con servicio de entrega y recogida en el aeropuerto de ${cityName}. Puedes coordinar la hora exacta al momento de hacer tu reserva para que te esperemos a tu llegada.`
        },
        {
            label: `¿Qué tipos de vehículos están disponibles en ${cityName}?`,
            content: `En ${cityName} ofrecemos tres categorías: carros compactos ideales para la ciudad, sedanes cómodos para viajes largos, y camionetas para familias o rutas de aventura. La disponibilidad depende de la fecha de tu reserva.`
        },
        {
            label: `¿Cuánto cuesta alquilar un carro en ${cityName}?`,
            content: `Los precios de alquiler en ${cityName} varían según el tipo de vehículo y temporada. Los compactos inician desde $120.000 COP por día. Reservando con anticipación puedes obtener hasta 60% de descuento.`
        },
        {
            label: `¿Puedo devolver el carro en otra ciudad diferente a ${cityName}?`,
            content: `Sí, ofrecemos servicio de devolución en ciudad diferente. Si recoges en ${cityName} puedes devolver en cualquiera de nuestras 19 ciudades. Este servicio tiene un cargo adicional por traslado.`
        },
        {
            label: `¿El seguro está incluido en el alquiler en ${cityName}?`,
            content: `Todos nuestros vehículos en ${cityName} incluyen seguro básico obligatorio (SOAT) y responsabilidad civil. Ofrecemos protecciones adicionales opcionales para mayor tranquilidad durante tu viaje.`
        }
    ]
}

/**
 * Returns FAQs for a city - uses specific FAQs if available, otherwise template
 */
const getCityFAQs = (cityName: string): FAQ[] => {
    return citySpecificFAQs[cityName] || generateTemplateFAQs(cityName)
}

/**
 * Composable to add FAQPage structured data for city pages
 * Enables FAQ rich snippets in Google SERPs
 */
export const useCityFAQSchema = (cityName: string) => {
    const cityFAQs = getCityFAQs(cityName)

    useSchemaOrg([
        <FAQPage>{
            '@type': 'FAQPage',
            mainEntity: cityFAQs.map(faq =>
                defineQuestion({
                    name: faq.label,
                    acceptedAnswer: faq.content
                })
            )
        }
    ])

    return {
        faqs: cityFAQs
    }
}

/**
 * Returns city-specific FAQs for display in UI
 * Uses specific FAQs for major cities, template for others
 */
export const useCityFAQs = (cityName: string): FAQ[] => {
    return getCityFAQs(cityName)
}
