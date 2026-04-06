/**
 * Cities configuration shared across all brands
 * Information about Colombian cities where car rental services are available
 * Includes descriptions and testimonials about each city
 */
export interface Testimonial {
  user: {
    name: string;
    description: string;
    avatar: {
      src: string;
      alt: string;
    };
  };
  quote: string;
}

export interface City {
  id: string;
  name: string;
  description?: string;
  link: string;
  testimonials: Testimonial[];
}

export const citiesConfig: City[] = [
  {
    id: "armenia",
    name: "Armenia",
    description:
      "Armenia es la puerta de entrada al Paisaje Cultural Cafetero, declarado Patrimonio de la Humanidad por la UNESCO. Recoge tu carro en el Aeropuerto El Edén y en menos de una hora estarás en Salento recorriendo el Valle de Cocora, en Filandia probando café de origen o disfrutando del Parque del Café con toda la familia. Reserva en línea sin anticipos, elige entre compactos, sedanes o camionetas y aprovecha descuentos de hasta el 60%. Con disponibilidad inmediata los 7 días, Armenia se convierte en tu base perfecta para explorar el Quindío a tu ritmo.",
    link: "/armenia",
    testimonials: [
      {
        user: {
          name: "Valentina Ospina",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Valentina Ospina",
          },
        },
        quote:
          "Llevamos a los niños al Parque del Café y al Valle de Cocora en un solo fin de semana. Tener carro propio hizo posible adaptar los horarios a su ritmo sin depender de buses.",
      },
      {
        user: {
          name: "Ricardo Antúnez",
          description: "México",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Ricardo Antúnez",
          },
        },
        quote:
          "Recogí el carro en el Aeropuerto El Edén y en 40 minutos ya estaba en Salento. La carretera es bonita y el GPS del celular fue suficiente. El vehículo andaba perfecto en las subidas.",
      },
      {
        user: {
          name: "Marcela Duarte",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Marcela Duarte",
          },
        },
        quote:
          "Con mi esposo hicimos la ruta Filandia → Salento → Cocora en tres días. Parábamos donde queríamos a tomar café de origen. Esa libertad no la da ningún tour.",
      },
      {
        user: {
          name: "Diego Hernández P.",
          description: "Chile",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Diego Hernández P.",
          },
        },
        quote:
          "Vine a una reunión de negocios y aproveché para conocer el Jardín Botánico del Quindío. La entrega en aeropuerto fue rápida, sin filas ni papeleo excesivo.",
      },
      {
        user: {
          name: "Luciana Mendoza",
          description: "Argentina",
          avatar: { src: "uifaces-human-image6", alt: "Luciana Mendoza" },
        },
        quote:
          "Viajamos cuatro amigas y dividimos el costo del alquiler. Nos salió más barato que cuatro pasajes de bus y pudimos visitar fincas cafeteras fuera de los circuitos turísticos típicos.",
      },
      {
        user: {
          name: "Jhon Fredy Castaño",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Jhon Fredy Castaño" },
        },
        quote:
          "Ya es la tercera vez que alquilo acá para recorrer el Eje Cafetero. El proceso de reserva en línea es claro, sin letra pequeña, y el carro siempre llega limpio y con tanque lleno.",
      },
    ],
  },
  {
    id: "barranquilla",
    name: "Barranquilla",
    description:
      "La Puerta de Oro de Colombia te espera con su Carnaval, su brisa caribeña y su energía inagotable. Alquila tu carro en el Aeropuerto Ernesto Cortissoz y recorre Barranquilla sin límites: el Malecón del Río al atardecer, el Museo del Caribe para entender la cultura costeña o el Zoológico con los más pequeños. Reserva sin anticipos, con precios bajos y disponibilidad inmediata. Ya sea por negocios o por la fiesta más grande de Colombia, en Barranquilla tener carro propio marca la diferencia.",
    link: "/barranquilla",
    testimonials: [
      {
        user: {
          name: "Camilo Vega R.",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Camilo Vega R.",
          },
        },
        quote:
          "Vinimos para el Carnaval y fue clave tener carro. Nos movimos entre la Vía 40, el Malecón y el hotel sin esperar taxis que en esas fechas cobran el triple.",
      },
      {
        user: {
          name: "Patricia Lozano",
          description: "Venezuela",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Patricia Lozano",
          },
        },
        quote:
          "Visité a mi familia en Barranquilla y alquilé para llevar a mi mamá al Zoológico y a Bocas de Ceniza. Ella no camina mucho y con el carro pudimos hacer todo sin agotarla.",
      },
      {
        user: {
          name: "Andrés Felipe Mora",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Andrés Felipe Mora",
          },
        },
        quote:
          "Viajo por trabajo a Barranquilla cada mes. La reserva en línea me ahorra tiempo y siempre encuentro disponibilidad. El carro me lo entregan limpio y a tiempo en el aeropuerto.",
      },
      {
        user: {
          name: "María José Ruiz",
          description: "Panamá",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "María José Ruiz",
          },
        },
        quote:
          "Desde el aeropuerto fuimos directo al Castillo de Salgar al atardecer. No conocía Barranquilla y tener carro me dio la confianza de explorar a mi ritmo.",
      },
      {
        user: {
          name: "Fernando Gutiérrez",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Fernando Gutiérrez" },
        },
        quote:
          "Alquilé un fin de semana para llevar a los niños al Museo del Caribe y al Zoológico. El precio fue justo y el sedán tenía aire acondicionado potente, que en Barranquilla es indispensable.",
      },
      {
        user: {
          name: "Daniela Serrano",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Daniela Serrano" },
        },
        quote:
          "Segunda vez que reservo con ellos. Me gusta que no piden anticipos y que la devolución es igual de simple que la recogida. El Museo del Caribe vale cada minuto.",
      },
    ],
  },
  {
    id: "bogota",
    name: "Bogotá",
    description:
      "Bogotá, la capital colombiana a 2.600 metros de altura, combina historia, gastronomía y vida nocturna en una ciudad que nunca duerme. Retira tu carro en el Aeropuerto El Dorado y muévete con libertad: sube a Monserrate al amanecer, recorre La Candelaria y el Museo del Oro, escápate a la Catedral de Sal en Zipaquirá o disfruta la Zona Rosa de noche. Sin anticipos, con descuentos de hasta el 60% y entrega inmediata los 7 días. En una capital donde el tráfico dicta los tiempos, tu propio carro te devuelve el control.",
    link: "/bogota",
    testimonials: [
      {
        user: {
          name: "Julián Castillo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Julián Castillo",
          },
        },
        quote:
          "Tenía reuniones en el norte y en Chía el mismo día. Con el carro pude cubrir ambas sin depender del tráfico de TransMilenio. La recogida en El Dorado fue en menos de 15 minutos.",
      },
      {
        user: {
          name: "Carolina Pinzón",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Carolina Pinzón",
          },
        },
        quote:
          "Llevé a mis hijos a la Catedral de Sal en Zipaquirá un domingo. Con carro propio el paseo fue ida y vuelta sin estrés, con parada a almorzar en la plaza del pueblo.",
      },
      {
        user: {
          name: "Roberto Salazar",
          description: "Ecuador",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Roberto Salazar",
          },
        },
        quote:
          "Primera vez en Bogotá. Subí a Monserrate, recorrí La Candelaria y fui al Museo del Oro todo en dos días. Sin carro hubiera perdido horas esperando transporte entre cada punto.",
      },
      {
        user: {
          name: "Laura Vásquez",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Laura Vásquez",
          },
        },
        quote:
          "Viajé sola por trabajo y me sentí segura con el carro. Pude moverme de noche entre la Zona T y el hotel sin preocuparme. Vehículo en buen estado y seguro incluido.",
      },
      {
        user: {
          name: "Miguel Ángel Pardo",
          description: "México",
          avatar: { src: "uifaces-human-image6", alt: "Miguel Ángel Pardo" },
        },
        quote:
          "Vine a un congreso en Corferias y necesitaba movilidad entre el evento, el hotel y cenas con clientes. Todo impecable desde la reserva hasta la devolución.",
      },
      {
        user: {
          name: "Andrea Quintero",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Andrea Quintero" },
        },
        quote:
          "Alquilé por una semana completa mientras mi carro estaba en el taller. El precio diario fue razonable y tuve un sedán cómodo para mi ruta diaria por la Autopista Norte.",
      },
    ],
  },
  {
    id: "bucaramanga",
    name: "Bucaramanga",
    description:
      "Conocida como la Ciudad Bonita, Bucaramanga es el punto de partida para la aventura extrema en Santander. Desde el Aeropuerto Palonegro puedes recoger tu carro y lanzarte al Cañón del Chicamocha para parapente, cruzar al Cerro del Santísimo o perderte en los pueblos coloniales de Girón y Barichara. También puedes explorar San Gil, la capital del turismo de aventura, a solo una hora. Reserva sin anticipos y con descuentos de hasta el 60%. Bucaramanga tiene parques, miradores y montañas que solo se descubren con ruedas propias.",
    link: "/bucaramanga",
    testimonials: [
      {
        user: {
          name: "Sergio Mantilla",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Sergio Mantilla",
          },
        },
        quote:
          "Fuimos al Cañón del Chicamocha y al Cerro del Santísimo en un solo día. La carretera desde Bucaramanga tiene curvas, pero la camioneta respondió bien y las vistas son increíbles.",
      },
      {
        user: {
          name: "Isabel Cristina Vargas",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Isabel Cristina Vargas",
          },
        },
        quote:
          "Conocimos Girón con los niños, pueblo colonial precioso a 15 minutos de Bucaramanga. Con carro fue fácil ir y volver sin depender de horarios de buses.",
      },
      {
        user: {
          name: "Pedro Alonso Rivas",
          description: "Honduras",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Pedro Alonso Rivas",
          },
        },
        quote:
          "Quería hacer parapente en el Cañón del Chicamocha y necesitaba llegar temprano. Con el carro salí a las 6am y llegué antes que los tours grupales. Experiencia única.",
      },
      {
        user: {
          name: "Natalia Gómez",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Natalia Gómez",
          },
        },
        quote:
          "Escapada de fin de semana desde Bogotá. Recogí en Palonegro y recorrí el Parque del Agua y los miradores de la Mesa de los Santos. Bucaramanga sorprende.",
      },
      {
        user: {
          name: "Juan Pablo Ordóñez",
          description: "Ecuador",
          avatar: { src: "uifaces-human-image6", alt: "Juan Pablo Ordóñez" },
        },
        quote:
          "Vine por el parapente y me quedé cinco días explorando. El carro me permitió descubrir Panachi, San Gil y las cascadas de Juan Curí sin tours organizados.",
      },
      {
        user: {
          name: "Ximena Pedraza",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Ximena Pedraza" },
        },
        quote:
          "Siempre alquilo cuando visito a mi familia en Bucaramanga. El proceso no cambia: reservo, llego, me entregan el carro y listo. Sin sorpresas ni costos ocultos.",
      },
    ],
  },
  {
    id: "cali",
    name: "Cali",
    description:
      "Cali no solo es la capital mundial de la salsa: es gastronomía valluna, atardeceres desde el Cristo Rey y una vida nocturna que no para. Recoge tu carro en el Aeropuerto Alfonso Bonilla Aragón y recorre el Barrio San Antonio, el Zoológico de Cali, la Iglesia La Ermita y, si te animas, escápate al Lago Calima o a Buga en el mismo viaje. Sin anticipos, con hasta 60% de descuento por reserva anticipada y disponibilidad los 7 días. La Sucursal del Cielo se disfruta mejor cuando tú decides el ritmo.",
    link: "/cali",
    testimonials: [
      {
        user: {
          name: "Alejandra Muñoz",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Alejandra Muñoz",
          },
        },
        quote:
          "Vinimos desde Bogotá a conocer la salsa caleña. Con carro fuimos al Barrio San Antonio de día y a las salsotecas de la Sexta de noche sin preocuparnos por el transporte.",
      },
      {
        user: {
          name: "Tomás Rivera",
          description: "Perú",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Tomás Rivera",
          },
        },
        quote:
          "Subí al Cristo Rey al atardecer y la vista de Cali desde arriba es espectacular. El carro subió sin problema por la carretera empinada. Muy buen estado mecánico.",
      },
      {
        user: {
          name: "Diana Marcela López",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Diana Marcela López",
          },
        },
        quote:
          "El Zoológico de Cali con niños pequeños requiere carro sí o sí. Llevamos coche, lonchera, cambio de ropa... en bus habría sido imposible. El alquiler nos salvó el paseo.",
      },
      {
        user: {
          name: "Sebastián Herrera",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Sebastián Herrera",
          },
        },
        quote:
          "Viajo a Cali por negocios dos veces al mes. Me recogen en el aeropuerto Bonilla Aragón y en 30 minutos estoy en mis reuniones en el sur. Servicio puntual y profesional.",
      },
      {
        user: {
          name: "Paola Andrea Jiménez",
          description: "Chile",
          avatar: { src: "uifaces-human-image6", alt: "Paola Andrea Jiménez" },
        },
        quote:
          "Mi novio y yo hicimos el recorrido Cali → Buga → Lago Calima en tres días. Con carro pudimos parar en miradores que desde un bus ni se ven. Muy recomendado.",
      },
      {
        user: {
          name: "Gustavo Arango",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Gustavo Arango" },
        },
        quote:
          "Cuarta vez que alquilo con ellos en Cali. Lo que más valoro es la transparencia: el precio de la web es el precio final, sin cargos extra al devolver.",
      },
    ],
  },
  {
    id: "cartagena",
    name: "Cartagena",
    description:
      "Cartagena es historia colonial, playas caribeñas y atardeceres sobre la muralla, todo en una sola ciudad. Alquila desde el Aeropuerto Rafael Núñez y explora más allá del Centro Histórico: el Castillo de San Felipe, Getsemaní con su arte callejero, Playa Blanca, el Volcán del Totumo o las playas vírgenes camino a Barú. Reserva en línea sin anticipos y aprovecha hasta 60% de descuento. Cartagena tiene mucho más que la Ciudad Amurallada, y con carro propio puedes descubrir cada rincón de la Heroica sin depender de tours.",
    link: "/cartagena",
    testimonials: [
      {
        user: {
          name: "Mariana Delgado",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Mariana Delgado",
          },
        },
        quote:
          "Luna de miel en Cartagena. El carro nos permitió escapar de la Ciudad Amurallada para conocer Playa Blanca y La Boquilla sin depender de tours sobrevendidos.",
      },
      {
        user: {
          name: "Enrique Solís",
          description: "México",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Enrique Solís",
          },
        },
        quote:
          "Recorrí el Castillo de San Felipe, Getsemaní y el Convento de la Popa en un solo día. En taxi habría gastado el doble. El aire acondicionado del carro fue un alivio con el calor caribeño.",
      },
      {
        user: {
          name: "Sofía Betancourt",
          description: "Venezuela",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Sofía Betancourt",
          },
        },
        quote:
          "Vinimos en familia desde Maracaibo. Con tres niños y maletas, el alquiler fue la opción más cómoda. Nos movimos entre el hotel en Bocagrande y los planes sin complicaciones.",
      },
      {
        user: {
          name: "Pablo Emilio Giraldo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Pablo Emilio Giraldo",
          },
        },
        quote:
          "Evento corporativo en el Centro de Convenciones. Necesitaba movilidad para coordinar logística entre el hotel, el venue y las cenas. Todo funcionó perfecto.",
      },
      {
        user: {
          name: "Claudia Restrepo",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Claudia Restrepo" },
        },
        quote:
          "Viaje de amigas: fuimos a Playa Blanca, al Volcán del Totumo y terminamos en Getsemaní. Imposible hacer todo eso en transporte público. El carro fue nuestra mejor decisión.",
      },
      {
        user: {
          name: "Javier Rincón",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Javier Rincón" },
        },
        quote:
          "Vine al hay Festival y me quedé unos días extra. Con carro conocí las playas del norte de Cartagena que los turistas normalmente no visitan. Proceso de reserva sencillo.",
      },
    ],
  },
  {
    id: "cucuta",
    name: "Cúcuta",
    description:
      "Cúcuta, la Perla del Norte, es el principal punto fronterizo de Colombia con Venezuela y un centro comercial en constante movimiento. Recoge tu carro en el Aeropuerto Camilo Daza y muévete con agilidad entre el Parque Santander, el Malecón, Villa del Rosario y la zona de frontera. Desde Cúcuta también puedes subir a Pamplona o a los pueblos de montaña de Norte de Santander. Sin anticipos, precios bajos y disponibilidad inmediata los 7 días. Para negocios o turismo, en Cúcuta el carro es la forma más práctica de cubrir terreno.",
    link: "/cucuta",
    testimonials: [
      {
        user: {
          name: "Yuliana Contreras",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Yuliana Contreras",
          },
        },
        quote:
          "Necesitaba movilidad para gestiones comerciales entre Cúcuta y la zona fronteriza. El carro facilitó todo: iba y venía sin depender de horarios de transporte público.",
      },
      {
        user: {
          name: "Leonardo Suárez",
          description: "Venezuela",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Leonardo Suárez",
          },
        },
        quote:
          "Llegué por el aeropuerto Camilo Daza y recogí el carro rápidamente. Recorrí el centro, el Parque Santander y la zona comercial de San Antonio. Todo en orden.",
      },
      {
        user: {
          name: "Marta Cecilia Rojas",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Marta Cecilia Rojas",
          },
        },
        quote:
          "Fui con mis padres a conocer Chinácota y Pamplona desde Cúcuta. La carretera es de montaña pero el carro aguantó bien. Mis padres viajaron cómodos con el aire acondicionado.",
      },
      {
        user: {
          name: "Óscar Ramírez",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Óscar Ramírez",
          },
        },
        quote:
          "Viajo seguido a Cúcuta por negocios. El proceso ya lo conozco de memoria: reservo, llego, firmo y salgo. Sin filas, sin sorpresas en el precio.",
      },
      {
        user: {
          name: "Adriana Patiño",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Adriana Patiño" },
        },
        quote:
          "Fin de semana con mi esposo recorriendo pueblos cercanos. Visitamos la Catedral de Cúcuta, el Puente Internacional y terminamos en Villa del Rosario. El carro hizo posible el plan.",
      },
      {
        user: {
          name: "Freddy Carvajal",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Freddy Carvajal" },
        },
        quote:
          "Soy de Cúcuta y alquilo cuando necesito un carro extra para mi negocio. La disponibilidad inmediata y la entrega en la ciudad son lo que más me convence.",
      },
    ],
  },
  {
    id: "ibague",
    name: "Ibagué",
    description:
      "Ibagué, la Capital Musical de Colombia, está rodeada de naturaleza que pide ser explorada en carro. Desde el Aeropuerto Perales llegas rápido al Cañón del Combeima — puerta al Nevado del Tolima —, al Jardín Botánico San Jorge o a cascadas escondidas en la cordillera. Si vienes durante el Festival Folclórico, tener vehículo propio te permite moverte entre sedes y eventos sin perder un solo compás. Reserva sin anticipos, elige tu vehículo y aprovecha descuentos de hasta el 60%. Ibagué suena mejor cuando la recorres a tu manera.",
    link: "/ibague",
    testimonials: [
      {
        user: {
          name: "Santiago Morales",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Santiago Morales",
          },
        },
        quote:
          "Vine al Festival Folclórico y con carro pude ir a los eventos en distintas sedes de la ciudad sin perder ninguno. Ibagué durante el festival se vive mejor con movilidad propia.",
      },
      {
        user: {
          name: "Viviana Trujillo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Viviana Trujillo",
          },
        },
        quote:
          "El Cañón del Combeima con niños es plan obligado. Con carro subimos hasta donde quisimos, paramos a almorzar trucha fresca y bajamos a nuestro ritmo. Excelente paseo familiar.",
      },
      {
        user: {
          name: "Héctor Fabio Londoño",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Héctor Fabio Londoño",
          },
        },
        quote:
          "Recorrí la ruta del Cañón del Combeima hasta el Nevado del Tolima en una camioneta que me alquilaron. Las trochas requieren un vehículo alto y este cumplió bien.",
      },
      {
        user: {
          name: "Rosa Elena Castro",
          description: "Perú",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Rosa Elena Castro",
          },
        },
        quote:
          "No conocía Ibagué y me sorprendió. Con el carro visité el Jardín Botánico San Jorge y las cascadas cercanas. Una ciudad verde rodeada de montañas.",
      },
      {
        user: {
          name: "Camila Andrade",
          description: "Ecuador",
          avatar: { src: "uifaces-human-image6", alt: "Camila Andrade" },
        },
        quote:
          "Mi novio y yo hicimos un road trip Bogotá → Ibagué → Armenia. Ibagué fue la escala perfecta y con carro la ruta por la Línea fue cómoda y segura.",
      },
      {
        user: {
          name: "Jorge Iván Bermúdez",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Jorge Iván Bermúdez" },
        },
        quote:
          "Tercer alquiler en Ibagué. Siempre disponible, siempre sin contratiempos. Esta vez el carro lo usé para ir al Conservatorio y a reuniones en el centro. Cumplido.",
      },
    ],
  },
  {
    id: "manizales",
    name: "Manizales",
    description:
      "Entre volcanes nevados y fincas cafeteras, Manizales ofrece una experiencia única en el Eje Cafetero. Retira tu carro en el Aeropuerto La Nubia y aventúrate hacia el Parque Nacional Los Nevados, sube al mirador de Chipre, visita el Recinto del Pensamiento o baja a los termales de Santa Rosa de Cabal. Reserva en línea sin anticipos y con descuentos de hasta el 60%. La Ciudad de las Puertas Abiertas tiene carreteras de montaña que premian a quien se anima a recorrerlas con calma y libertad.",
    link: "/manizales",
    testimonials: [
      {
        user: {
          name: "Felipe Cardona",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Felipe Cardona",
          },
        },
        quote:
          "Hice la ruta cafetera completa desde Manizales: fincas en Chinchiná, el Recinto del Pensamiento y los termales de Santa Rosa. El carro fue indispensable para cubrir todo.",
      },
      {
        user: {
          name: "Lorena Agudelo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Lorena Agudelo",
          },
        },
        quote:
          "Con mi esposo subimos hacia el Nevado del Ruiz. La carretera es exigente y fría, pero la camioneta fue segura. Las vistas del Parque Los Nevados desde arriba son impresionantes.",
      },
      {
        user: {
          name: "Martín Echeverri",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Martín Echeverri",
          },
        },
        quote:
          "Evento de la Feria de Manizales y necesitaba moverme entre el hotel, la Plaza de Toros y las casetas. Sin carro hubiera sido un caos con las calles cerradas.",
      },
      {
        user: {
          name: "Gabriela Soto",
          description: "Costa Rica",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Gabriela Soto",
          },
        },
        quote:
          "Manizales me recordó a Costa Rica por lo verde. Con el carro fui al Ecoparque Los Yarumos y a la Catedral Basílica. Ciudad tranquila y bonita para recorrer.",
      },
      {
        user: {
          name: "David Alejandro Ríos",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "David Alejandro Ríos" },
        },
        quote:
          "Vine a hacer senderismo en Los Nevados y me quedé tres días extra. El carro aguantó las trochas de montaña y me llevó a termales que no salen en las guías turísticas.",
      },
      {
        user: {
          name: "Tatiana Mejía",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Tatiana Mejía" },
        },
        quote:
          "Plan familiar al Recinto del Pensamiento con los abuelos. El carro nos dejó en la puerta, sin caminar de más. Los niños disfrutaron el mariposario y nosotros el café.",
      },
    ],
  },
  {
    id: "medellin",
    name: "Medellín",
    description:
      "Medellín, la Ciudad de la Eterna Primavera, se ha convertido en destino obligado para viajeros de todo el mundo. Recoge tu carro en el Aeropuerto José María Córdova y descubre por qué: la transformación de la Comuna 13, el Parque Arví entre las montañas, el Jardín Botánico en pleno centro, y a dos horas la piedra de Guatapé con su vista de 360 grados. Reserva sin anticipos y aprovecha hasta 60% de descuento. Medellín tiene tanto dentro como fuera del valle que un carro propio multiplica lo que puedes vivir.",
    link: "/medellin",
    testimonials: [
      {
        user: {
          name: "Juan Camilo Restrepo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Juan Camilo Restrepo",
          },
        },
        quote:
          "Trabajo remoto desde Medellín un mes al año. Alquilo por semanas y me muevo entre El Poblado, Laureles y coworkings sin las limitaciones del Metro o los taxis de app.",
      },
      {
        user: {
          name: "Verónica Zapata",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Verónica Zapata",
          },
        },
        quote:
          "El Parque Arví con niños es mejor en carro: llevas comida, abrigos y te devuelves cuando quieras. Subir por Las Palmas fue rápido y la vista del valle espectacular.",
      },
      {
        user: {
          name: "Manuel Alejandro Díaz",
          description: "Argentina",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Manuel Alejandro Díaz",
          },
        },
        quote:
          "Vine de turista y recorrí la Comuna 13, Plaza Botero y el Jardín Botánico. El carro me permitió ir también a Guatapé, que está a dos horas. Sin él, me lo habría perdido.",
      },
      {
        user: {
          name: "Katherine Bustamante",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Katherine Bustamante",
          },
        },
        quote:
          "Reuniones en Rionegro y en El Poblado el mismo día. Sin carro propio ese trayecto es de dos horas en bus. En carro fueron 40 minutos. La entrega en José María Córdova fue eficiente.",
      },
      {
        user: {
          name: "Daniel Ochoa",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Daniel Ochoa" },
        },
        quote:
          "Es mi segunda vez alquilando para vacaciones en Medellín. Esta vez fui a Santa Fe de Antioquia y Jardín. La confianza de repetir se gana con buen servicio.",
      },
      {
        user: {
          name: "Lina Marcela Álvarez",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Lina Marcela Álvarez" },
        },
        quote:
          "Viaje de amigas a Medellín. Éramos cinco y con maletas. El carro fue más barato que taxis durante cuatro días y pudimos llegar a restaurantes en Las Palmas que solo se acceden en vehículo.",
      },
    ],
  },
  {
    id: "monteria",
    name: "Montería",
    description:
      "Montería, la Perla del Sinú, combina la tranquilidad de una ciudad ribereña con la fuerza de la capital ganadera del Caribe colombiano. Desde el Aeropuerto Los Garzones toma tu carro y pasea por la Ronda del Sinú al atardecer, visita Lorica con su arquitectura árabe-libanesa o escápate a las playas de Coveñas y San Bernardo del Viento. Reserva sin anticipos, con precios bajos y disponibilidad los 7 días. En una región donde las distancias entre fincas, pueblos y playas son largas, el carro es indispensable.",
    link: "/monteria",
    testimonials: [
      {
        user: {
          name: "José Luis Padilla",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "José Luis Padilla",
          },
        },
        quote:
          "Viajo a Montería cada dos meses por temas ganaderos. Necesito recorrer fincas fuera de la ciudad y el alquiler de carro me resuelve la logística sin complicaciones.",
      },
      {
        user: {
          name: "Eliana Vergara",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Eliana Vergara",
          },
        },
        quote:
          "Paseo familiar por la Ronda del Sinú y luego fuimos a Lorica, un pueblo con arquitectura árabe preciosa. Con carro la distancia de una hora se hace fácil.",
      },
      {
        user: {
          name: "Raúl Montes",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Raúl Montes",
          },
        },
        quote:
          "Primera vez en Montería. El río Sinú al atardecer es hermoso. Con el carro pude moverme también a Santa Cruz de Lorica y a playas de Coveñas en el mismo viaje.",
      },
      {
        user: {
          name: "Sandra Patricia Navarro",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Sandra Patricia Navarro",
          },
        },
        quote:
          "Fin de semana con mi esposo. Recorrimos la Ronda del Sinú en la noche, fuimos a comer a la zona gastronómica y al día siguiente a Coveñas. El carro lo hizo posible.",
      },
      {
        user: {
          name: "Alberto Charris",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Alberto Charris" },
        },
        quote:
          "Alquilo regularmente para mis viajes de trabajo a las fincas del Sinú. La entrega en aeropuerto es rápida y los carros siempre están en buenas condiciones para trocha.",
      },
      {
        user: {
          name: "Melissa Petro",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Melissa Petro" },
        },
        quote:
          "Volví a Montería después de un año y repetí el alquiler. Esta vez incluí San Bernardo del Viento en el itinerario. Playa tranquila y con carro se llega fácil.",
      },
    ],
  },
  {
    id: "neiva",
    name: "Neiva",
    description:
      "Neiva es la base ideal para dos de los tesoros más impresionantes de Colombia: el Desierto de la Tatacoa (a hora y media) y el Parque Arqueológico de San Agustín (a cuatro horas por carretera escénica). Retira tu carro en el Aeropuerto Benito Salas y arma tu propia ruta por el Huila, con paradas en termales, Rivera y pueblos cafeteros. Sin anticipos, con descuentos de hasta el 60% y entrega los 7 días. Si vienes durante el Festival del Bambuco, la movilidad propia te permite vivir cada evento sin restricciones.",
    link: "/neiva",
    testimonials: [
      {
        user: {
          name: "Andrés Tovar",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Andrés Tovar",
          },
        },
        quote:
          "El Desierto de la Tatacoa está a hora y media de Neiva. Salí temprano con el carro, vi el amanecer en el desierto rojo y volví para almorzar. Sin carro propio ese plan no funciona.",
      },
      {
        user: {
          name: "Martha Liliana Perdomo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Martha Liliana Perdomo",
          },
        },
        quote:
          "Llevé a la familia a San Agustín desde Neiva. Son casi cuatro horas pero la carretera es bonita y con carro paramos en Rivera y en los termales. Los niños durmieron la vuelta.",
      },
      {
        user: {
          name: "Carlos Eduardo Romero",
          description: "México",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Carlos Eduardo Romero",
          },
        },
        quote:
          "Vine solo a conocer la Tatacoa y quedé impresionado. El carro me permitió quedarme hasta la noche para ver las estrellas en el observatorio y volver seguro a Neiva.",
      },
      {
        user: {
          name: "Yolanda Cabrera",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Yolanda Cabrera",
          },
        },
        quote:
          "Soy de Neiva y siempre recomiendo este servicio a mis amigos que visitan. La relación precio-calidad es buena y para ir a la Tatacoa o a San Agustín, carro es la única opción real.",
      },
      {
        user: {
          name: "Francisco Javier Cortés",
          description: "Chile",
          avatar: { src: "uifaces-human-image6", alt: "Francisco Javier Cortés" },
        },
        quote:
          "Ruta Neiva → Tatacoa → San Agustín en cinco días. Las estatuas precolombinas de San Agustín son impresionantes. Sin vehículo no habría podido cubrir los distintos parques arqueológicos.",
      },
      {
        user: {
          name: "Alejandra Sánchez",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Alejandra Sánchez" },
        },
        quote:
          "Escapada romántica con mi pareja al Desierto de la Tatacoa. Con carro pudimos elegir nuestros horarios: desierto al amanecer, piscina de hotel al mediodía, observatorio de noche.",
      },
    ],
  },
  {
    id: "pereira",
    name: "Pereira",
    description:
      "Pereira, la Querendona del Eje Cafetero, tiene la ubicación perfecta: desde aquí llegas fácil a Salento, a las Termales de Santa Rosa de Cabal, al Bioparque Ukumarí y a Manizales o Armenia en menos de una hora. Alquila en el Aeropuerto Matecaña sin anticipos y con hasta 60% de descuento por reserva anticipada. Pereira es ideal como base para recorrer todo el triángulo cafetero con libertad, parando en fincas, miradores y pueblos que solo se alcanzan en vehículo propio. Disponibilidad los 7 días.",
    link: "/pereira",
    testimonials: [
      {
        user: {
          name: "Mauricio Gallego",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Mauricio Gallego",
          },
        },
        quote:
          "Recorrí fincas cafeteras por la vía a Marsella y Santa Rosa de Cabal. Cada finca tiene su propia ruta y horario, así que con carro propio pude armar mi itinerario perfecto.",
      },
      {
        user: {
          name: "Catalina Osorio",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Catalina Osorio",
          },
        },
        quote:
          "Los niños querían ver los animales del Bioparque Ukumarí y después ir a las Termales de Santa Rosa. Con carro hicimos los dos planes el mismo día sin prisas.",
      },
      {
        user: {
          name: "Rodrigo Escobar",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Rodrigo Escobar",
          },
        },
        quote:
          "Las Termales de Santa Rosa a las 6am, sin turistas. Solo posible con carro propio para llegar a esa hora. Agua caliente con vista al bosque nublado, experiencia inolvidable.",
      },
      {
        user: {
          name: "Ana María Rendón",
          description: "Ecuador",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Ana María Rendón",
          },
        },
        quote:
          "Vine de turista al Eje Cafetero. Desde Pereira con carro llegué a Salento, a Armenia y a Manizales en el mismo viaje. Pereira es base perfecta con buenas carreteras.",
      },
      {
        user: {
          name: "Esteban Loaiza",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Esteban Loaiza" },
        },
        quote:
          "Segundo alquiler con ellos en Pereira. Lo que me trae de vuelta es la sencillez: reservo, llego a Matecaña, me entregan el carro y ya. Sin depósitos exagerados ni letra menuda.",
      },
      {
        user: {
          name: "Jennifer Caicedo",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Jennifer Caicedo" },
        },
        quote:
          "Fin de semana de descanso en los termales con mi mejor amiga. El carro fue cómodo para la vía a Santa Rosa y el precio por dos días fue razonable.",
      },
    ],
  },
  {
    id: "santa-marta",
    name: "Santa Marta",
    description:
      "Santa Marta tiene algo que pocas ciudades ofrecen: sierra nevada, playas caribeñas y selva tropical a minutos de distancia. Recoge tu carro en el Aeropuerto Simón Bolívar y en el mismo viaje puedes visitar el Parque Tayrona, subir a Minca por café y cascadas, explorar Taganga al atardecer o llegar hasta Palomino. La Quinta de San Pedro Alejandrino y el centro histórico completan la experiencia. Reserva sin anticipos, con descuentos de hasta el 60% y entrega inmediata. La Bahía Más Linda de América tiene demasiado para verlo desde un solo punto.",
    link: "/santa-marta",
    testimonials: [
      {
        user: {
          name: "Nicolás Dávila",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Nicolás Dávila",
          },
        },
        quote:
          "Playa durante el día en el Tayrona y cena en Taganga al atardecer. Con carro la distancia entre ambos puntos no fue problema. Santa Marta tiene tanto por ver que el carro es esencial.",
      },
      {
        user: {
          name: "Amanda Orozco",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Amanda Orozco",
          },
        },
        quote:
          "Con tres hijos y nevera portátil, llegar al Tayrona en bus habría sido una odisea. El carro nos dejó en la entrada del parque con todo lo necesario para el día.",
      },
      {
        user: {
          name: "Bryan Acosta",
          description: "Venezuela",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Bryan Acosta",
          },
        },
        quote:
          "Subí a Minca en el carro alquilado. La carretera es de montaña pero se puede. Arriba hay cascadas, fincas de café y un fresco que no esperas tan cerca de la playa.",
      },
      {
        user: {
          name: "Gloria Amparo Nieto",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Gloria Amparo Nieto",
          },
        },
        quote:
          "Mi esposo y yo, ya jubilados, recorrimos la Quinta de San Pedro Alejandrino y las playas del Rodadero a nuestro ritmo. Sin apuros ni grupos turísticos. Así se disfruta.",
      },
      {
        user: {
          name: "Cristian Camilo Torres",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Cristian Camilo Torres" },
        },
        quote:
          "Grupo de amigos, seis días en Santa Marta. Entre todos pagamos el alquiler y salió más barato que taxis. Fuimos al Tayrona, Palomino, Minca y Taganga sin límites.",
      },
      {
        user: {
          name: "Isabela Márquez",
          description: "Perú",
          avatar: { src: "uifaces-popular-image", alt: "Isabela Márquez" },
        },
        quote:
          "Luna de miel caribeña. Santa Marta tiene playas que solo se llegan en carro: Playa Cristal, Neguanje... Alquilar fue la mejor decisión del viaje.",
      },
    ],
  },
  {
    id: "valledupar",
    name: "Valledupar",
    description:
      "Valledupar es acordeones al atardecer, el Río Guatapurí bajando cristalino de la Sierra Nevada y una tradición musical que se siente en cada esquina. Alquila tu carro en el Aeropuerto Alfonso López y recorre la Plaza Alfonso López, el Balneario Hurtado, los pueblos vallenatos de La Paz y San Diego, o adéntrate hacia la Sierra Nevada. Sin anticipos y con descuentos de hasta el 60%. Si vienes durante el Festival Vallenato, el carro te da la libertad de moverte entre parrandas, conciertos y el río sin depender de nadie.",
    link: "/valledupar",
    testimonials: [
      {
        user: {
          name: "Mario Zuleta",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Mario Zuleta",
          },
        },
        quote:
          "Vine al Festival Vallenato y con carro pude ir a los eventos en la Plaza, al Río Guatapurí y a parrandas nocturnas sin depender de nadie. El vallenato se vive mejor así.",
      },
      {
        user: {
          name: "Liliana Molina",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Liliana Molina",
          },
        },
        quote:
          "Llevé a mis hijos al Balneario Hurtado. Agua cristalina de la Sierra Nevada y con carro no tuvimos que cargar todo en bus. Parqueadero cerca y plan familiar perfecto.",
      },
      {
        user: {
          name: "César Augusto Peña",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "César Augusto Peña",
          },
        },
        quote:
          "Soy músico y vine a conocer la tierra del vallenato. Recorrí la Plaza Alfonso López, el Museo del Acordeón y pueblos como La Paz y San Diego. El carro fue indispensable.",
      },
      {
        user: {
          name: "Karen Johana Luna",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Karen Johana Luna",
          },
        },
        quote:
          "Mi novio y yo fuimos al Río Guatapurí al amanecer, antes de que llegara la gente. Solo posible con carro propio. El agua bajando de la Sierra Nevada es helada y deliciosa.",
      },
      {
        user: {
          name: "Jairo Oñate",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Jairo Oñate" },
        },
        quote:
          "Negocios en fincas ganaderas de la región. Valledupar requiere carro para cualquier gestión fuera del casco urbano. La entrega fue puntual y el vehículo confiable para las vías.",
      },
      {
        user: {
          name: "Angélica Daza",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Angélica Daza" },
        },
        quote:
          "Repito alquiler cada vez que vengo a Valledupar. El aeropuerto Alfonso López es pequeño así que la entrega es rápida, sin las demoras de los aeropuertos grandes.",
      },
    ],
  },
  {
    id: "villavicencio",
    name: "Villavicencio",
    description:
      "Villavicencio es la puerta a los Llanos Orientales, donde Colombia se vuelve horizonte infinito, atardeceres rojos y cultura llanera auténtica. Desde el Aeropuerto Vanguardia recoge tu carro y explora el Bioparque Los Ocarros, el Mirador de Buenavista, las rutas hacia Acacías, Restrepo y Puerto López — el ombligo de Colombia. Reserva sin anticipos, con hasta 60% de descuento y disponibilidad los 7 días. Los Llanos son extensión pura: hatos ganaderos, ríos y sabana que solo se recorren con la libertad de un vehículo propio.",
    link: "/villavicencio",
    testimonials: [
      {
        user: {
          name: "Germán Rodríguez",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Germán Rodríguez",
          },
        },
        quote:
          "Vine desde Bogotá a comer mamona llanera y terminé recorriendo los hatos ganaderos con el carro. Los Llanos se disfrutan con la libertad de parar donde uno quiera.",
      },
      {
        user: {
          name: "Adriana Milena Parra",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Adriana Milena Parra",
          },
        },
        quote:
          "El Bioparque Los Ocarros con niños es plan obligado. Con carro llevamos silla de bebé, lonchera y repelente sin cargar todo en bus. Perfecto para un día en familia.",
      },
      {
        user: {
          name: "Luis Fernando Gaitán",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Luis Fernando Gaitán",
          },
        },
        quote:
          "Ruta Villavicencio → Restrepo → Cumaral por la llanura. Paisajes increíbles, atardeceres rojos y carretera recta. La camioneta fue perfecta para las vías destapadas.",
      },
      {
        user: {
          name: "Sandra Milena Cárdenas",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Sandra Milena Cárdenas",
          },
        },
        quote:
          "Escapada de fin de semana desde Bogotá. Recogimos en Villavicencio y fuimos al Mirador de Buenavista. La bajada por la vía al Llano es espectacular en carro.",
      },
      {
        user: {
          name: "Iván Darío Bernal",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Iván Darío Bernal" },
        },
        quote:
          "Viajo por negocios agrícolas a los Llanos regularmente. El carro me permite cubrir fincas en Acacías, Granada y Puerto López en un solo día. Servicio confiable.",
      },
      {
        user: {
          name: "Mónica Guzmán",
          description: "Ecuador",
          avatar: { src: "uifaces-popular-image", alt: "Mónica Guzmán" },
        },
        quote:
          "No conocía los Llanos colombianos y fue una sorpresa. Con el carro recorrí el Parque Las Malocas, probé carne a la llanera y vi un amanecer llanero. Experiencia única.",
      },
    ],
  },
  {
    id: "floridablanca",
    name: "Floridablanca",
    description:
      "Floridablanca, la Ciudad Jardín de Santander, forma parte del área metropolitana de Bucaramanga y es un punto estratégico para recorrer la región. Con fácil acceso desde el Aeropuerto Palonegro, puedes recoger tu carro y visitar el Jardín Botánico Eloy Valenzuela, subir al Cerro del Santísimo, cruzar a Girón o lanzarte al Cañón del Chicamocha y Mesa de los Santos. Sin anticipos, con descuentos de hasta el 60% y entrega los 7 días. Floridablanca ofrece la tranquilidad de una ciudad residencial con toda la aventura santandereana a menos de una hora.",
    link: "/floridablanca",
    testimonials: [
      {
        user: {
          name: "Wilson Rangel",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Wilson Rangel",
          },
        },
        quote:
          "Vivo en Bucaramanga pero alquilo en Floridablanca para diligencias que requieren carro. La sede es cómoda y puedo moverme al Cañaveral, al centro y a fincas cercanas sin problema.",
      },
      {
        user: {
          name: "Rocío Amaya",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Rocío Amaya",
          },
        },
        quote:
          "Plan de domingo en el Jardín Botánico Eloy Valenzuela con los niños. Con carro nos quedamos hasta que ellos quisieron y después fuimos a comer sin depender de bus.",
      },
      {
        user: {
          name: "Omar Becerra",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Omar Becerra",
          },
        },
        quote:
          "Reuniones de negocios entre Floridablanca, Bucaramanga y Girón en un solo día. Sin carro habría sido imposible cumplir con todos los horarios. Servicio profesional.",
      },
      {
        user: {
          name: "Luz Dary Pabón",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Luz Dary Pabón",
          },
        },
        quote:
          "Visité a mi familia en Floridablanca y aprovechamos para ir al Cerro del Santísimo. La vista del área metropolitana desde arriba es impresionante, sobre todo al atardecer.",
      },
      {
        user: {
          name: "Christian Gálvez",
          description: "Perú",
          avatar: { src: "uifaces-human-image6", alt: "Christian Gálvez" },
        },
        quote:
          "Llegué por Palonegro y me quedé en Floridablanca. Desde ahí con carro recorrí el Cañón del Chicamocha y Mesa de los Santos. Todo a menos de una hora de distancia.",
      },
      {
        user: {
          name: "Paula Andrea Niño",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Paula Andrea Niño" },
        },
        quote:
          "Ya van tres veces que alquilo en Floridablanca. Siempre para fines de semana largos con mi familia. Los carros están bien mantenidos y el trato es directo y honesto.",
      },
    ],
  },
  {
    id: "palmira",
    name: "Palmira",
    description:
      "Palmira, la Capital Agrícola de Colombia, tiene una ventaja clave: el Aeropuerto Alfonso Bonilla Aragón está en su territorio, así que recoges el carro apenas aterrizas. Desde aquí recorre las haciendas azucareras del Valle del Cauca, visita la Basílica del Señor de los Milagros en Buga, explora Cali a 30 minutos o sube al Lago Calima. Sin anticipos, con descuentos de hasta el 60% y entrega inmediata. Palmira es el punto de partida más práctico para descubrir todo el Valle con la comodidad de un vehículo propio.",
    link: "/palmira",
    testimonials: [
      {
        user: {
          name: "Diego Fernando Caicedo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Diego Fernando Caicedo",
          },
        },
        quote:
          "Trabajo en agroindustria y necesito recorrer ingenios y haciendas entre Palmira y Candelaria. El carro me permite cubrir cuatro visitas al día sin perder tiempo en transporte público.",
      },
      {
        user: {
          name: "Martha Isabel Olave",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Martha Isabel Olave",
          },
        },
        quote:
          "Fuimos en familia a la Basílica del Señor de los Milagros en Buga. Desde Palmira son 40 minutos en carro y el viaje fue cómodo para mis papás mayores.",
      },
      {
        user: {
          name: "Hernán Darío Valencia",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Hernán Darío Valencia",
          },
        },
        quote:
          "El aeropuerto de Cali queda en Palmira, así que recoger el carro acá es lógico. De ahí fui directo a mis reuniones en Cali sin pasar por terminal ni esperar taxi.",
      },
      {
        user: {
          name: "Jenny Marcela Toro",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Jenny Marcela Toro",
          },
        },
        quote:
          "Fin de semana recorriendo pueblos del Valle: Palmira, Buga, Tuluá. Cada uno tiene su encanto y con carro es fácil hacer la ruta sin depender de buses intermunicipales.",
      },
      {
        user: {
          name: "Álvaro Escobar",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Álvaro Escobar" },
        },
        quote:
          "Segundo alquiler en Palmira. El servicio es consistente: mismo proceso, misma calidad. Lo uso para visitas a clientes en el sector azucarero.",
      },
      {
        user: {
          name: "Yesenia Arboleda",
          description: "Ecuador",
          avatar: { src: "uifaces-popular-image", alt: "Yesenia Arboleda" },
        },
        quote:
          "Vine de turista y no sabía que el aeropuerto de Cali está en Palmira. Recogí el carro ahí y exploré Cali, Palmira y Buga. Todo conectado y cerca, ideal con vehículo.",
      },
    ],
  },
  {
    id: "soledad",
    name: "Soledad",
    description:
      "Soledad es el municipio más poblado del Atlántico y sede del Aeropuerto Ernesto Cortissoz, lo que la convierte en la entrada natural al área metropolitana de Barranquilla. Recoge tu carro apenas aterrizas y muévete sin restricciones entre Soledad, Barranquilla, Puerto Colombia y las playas de Juan de Acosta. Si vienes para el Carnaval, el carro te permite ir de comparsa en comparsa sin esperar transporte. Reserva sin anticipos, con hasta 60% de descuento y entrega los 7 días. En el Atlántico, tener ruedas propias lo cambia todo.",
    link: "/soledad",
    testimonials: [
      {
        user: {
          name: "Rafael Donado",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image5",
            alt: "Rafael Donado",
          },
        },
        quote:
          "Tengo clientes en Soledad y Barranquilla. Con el carro cubro ambas zonas en un día sin los embotellamientos del transporte público por la Circunvalar.",
      },
      {
        user: {
          name: "Keyla Barrios",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image4",
            alt: "Keyla Barrios",
          },
        },
        quote:
          "Vinimos al Carnaval desde Bogotá. El aeropuerto Cortissoz queda en Soledad y recogimos el carro ahí. Nos movimos entre comparsas, casetas y el hotel sin estrés.",
      },
      {
        user: {
          name: "Jorge Andrés Solano",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image3",
            alt: "Jorge Andrés Solano",
          },
        },
        quote:
          "Plan familiar: Museo del Carnaval en Barranquilla, luego playa en Puerto Colombia. Con el carro mis papás no sufrieron el calor esperando bus. Aire acondicionado total.",
      },
      {
        user: {
          name: "Milena Fontalvo",
          description: "Colombia",
          avatar: {
            src: "uifaces-popular-image2",
            alt: "Milena Fontalvo",
          },
        },
        quote:
          "Viajo por trabajo entre Soledad y la zona industrial de Barranquilla. El alquiler por semana me sale más económico que taxis diarios y me da flexibilidad de horarios.",
      },
      {
        user: {
          name: "Víctor Escorcia",
          description: "Colombia",
          avatar: { src: "uifaces-human-image6", alt: "Víctor Escorcia" },
        },
        quote:
          "Alquilo cada vez que vengo al Atlántico. La recogida en el aeropuerto es práctica y desde Soledad se llega rápido a Barranquilla, Puerto Colombia y Juan de Acosta.",
      },
      {
        user: {
          name: "Angeline Herazo",
          description: "Colombia",
          avatar: { src: "uifaces-popular-image", alt: "Angeline Herazo" },
        },
        quote:
          "Primera vez que alquilo un carro y la experiencia fue sencilla. Reservé por internet, recogí en el aeropuerto y devolví al final sin complicaciones ni cobros de más.",
      },
    ],
  },
];
