/**
 * Brand-specific configuration for Alquilame
 *
 * This file imports shared configuration from @rentacar-main/logic
 * and only defines brand-specific overrides for the Alquilame brand.
 */
import {
  defaultConfig,
  uiConfig,
  organizationConfig,
  faqsConfig,
  citiesConfig,
} from '@rentacar-main/logic/src'

export default defineAppConfig({
  // Shared default timezone
  defaultTimezone: defaultConfig.defaultTimezone,

  // Shared UI configuration (Nuxt UI component slots and variants)
  ui: uiConfig,

  // Organization: shared base + brand-specific overrides
  organization: {
    ...organizationConfig, // name, address, postalcode
    logo: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilame%2Fimg%2Flogo.png?alt=media&token=placeholder-token-1",
    brand: "Alquilame",
    otherbrands: ["Alquilatucarro", "Alquicarros"],
  },

  // Brand-specific reservation configuration
  reservation: {
    website: "https://alquilame.com",
  },

  // Brand-specific franchise information
  franchise: {
    name: "alquilame.com",
    shortname: "alquilame",
    website: "https://alquilame.com",
    title: "Alquiler de Carros en Colombia desde $32/día",
    description:
      "Alquila carros en Bogotá, Medellín, Cali y 16 ciudades más. Hasta 60% descuento por reserva anticipada. Sin pago previo. Flota renovada cada 2 años.",
    logo: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilame%2Fimg%2Flogo.png?alt=media&token=placeholder-token-1",
    oglogo: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilame%2Fimg%2Fog-logo.png?alt=media&token=placeholder-token-2",
    svglogo: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilame%2Fimg%2Flogo.svg?alt=media&token=placeholder-token-3",
    ogImage: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilame%2Fimg%2Fog-alquilame.jpg?alt=media&token=placeholder-token-4",
    phone: "+57 301 672 9250",
    whatsapp: "https://wa.me/573146826821",
    email: "alquilame@gmail.com",
    socialmedia: [
      "https://www.facebook.com/alquilamecom",
      "https://www.instagram.com/alquilame.com",
      "https://twitter.com/alquilame",
      "https://www.youtube.com/@alquilame",
      "https://www.tiktok.com/@alquilame",
      "https://co.pinterest.com/alquilame/",
    ],
    footerLinks: [
      {
        link: "/terminos-condiciones",
        label: "Términos y condiciones",
      },
      {
        link: "/politica-privacidad",
        label: "Política de privacidad",
      },
      {
        link: "https://docs.google.com/forms/d/e/1FAIpQLSe5NLCil5hQNqsdPhwDM3DYe3wbGiUyr-2VK4RBTYE3YQbcug/viewform",
        label: "Quejas y reclamos",
      },
      {
        link: "/gana",
        label: "Gana comisiones",
      },
      {
        link: "/blog",
        label: "Blog",
      },
    ],
    testimonials: [
      {
        user: {
          name: "Stephany M. García",
          description: "Peru",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image5.webp?alt=media&token=b6467738-4692-48dd-937c-16c81f715926",
            alt: "Stephany M. García",
          },
        },
        quote:
          "Durante nuestra estadía en Bogotá, tuvimos la oportunidad de visitar Monserrate y La Candelaria. Fue muy cómodo desplazarse entre estos destinos y disfrutar de la vista panorámica a nuestro propio ritmo.",
      },
      {
        user: {
          name: "Sandra Milena Barona",
          description: "Colombia",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image4.webp?alt=media&token=5d545267-03e6-4e83-a081-4a16259805e2",
            alt: "Sandra Milena Barona",
          },
        },
        quote:
          "Hicimos una parada en el Metrocable de Medellín al final de la tarde, después de explorar Comuna 13. Contar con transporte propio nos dio la libertad de hacer ese recorrido sin prisas y apreciar la transformación urbana.",
      },
      {
        user: {
          name: "Luis Javier Rodríguez M.",
          description: "Honduras",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image3.webp?alt=media&token=54d9ed05-162a-4b20-a485-bdc87aaeb27f",
            alt: "Luis Javier Rodríguez M.",
          },
        },
        quote:
          "En Cali, visitamos el Zoológico y subimos a Cristo Rey para ver la ciudad desde arriba. Tener un auto nos permitió movernos con facilidad y disfrutar de la salsa y el ambiente sin preocupaciones.",
      },
      {
        user: {
          name: "Carlos Andrés Mejía",
          description: "Colombia",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image2.webp?alt=media&token=24560311-369e-4f54-9a1a-36f0da7ec9f7",
            alt: "Carlos Andrés Mejía",
          },
        },
        quote:
          "Me encantó el servicio en Barranquilla. Todo muy puntual y el carro en excelente estado. Pude conocer el Carnaval Museum y Bocas de Ceniza sin complicaciones. ¡Totalmente recomendado!",
      },
      {
        user: {
          name: "Ana Lucía Torres",
          description: "Ecuador",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-human-image6.webp?alt=media&token=bb28b34b-f738-40ee-be58-e5fd35751da2",
            alt: "Ana Lucía Torres",
          },
        },
        quote:
          "Viajar en familia a Cartagena fue muy fácil gracias a este servicio de alquiler. Recorrimos la Ciudad Amurallada y el Castillo San Felipe, con buen precio y excelente atención.",
      },
      {
        user: {
          name: "Esteban Páez",
          description: "Colombia",
          avatar: {
            src: "https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2Fuifaces-popular-image.webp?alt=media&token=556252eb-f9e0-4cc5-832a-0e97d691b4d0",
            alt: "Esteban Páez",
          },
        },
        quote:
          "Excelente alternativa para recorrer Bucaramanga. El auto fue perfecto para ir al Cañón del Chicamocha y Girón, muy limpio, seguro y con buen consumo de gasolina.",
      },
    ],
  },

  // Shared FAQs (generic car rental information)
  faqs: faqsConfig,

  // Shared cities configuration (Colombian cities with rental services)
  cities: citiesConfig,
})
