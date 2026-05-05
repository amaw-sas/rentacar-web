/**
 * Brand-specific configuration for Alquilatucarro
 *
 * This file imports shared configuration from @rentacar-main/logic
 * and only defines brand-specific overrides for the Alquilatucarro brand.
 */
import {
  defaultConfig,
  uiConfig,
  organizationConfig,
  faqsConfig,
} from '@rentacar-main/logic/src'

export default defineAppConfig({
  // Shared default timezone
  defaultTimezone: defaultConfig.defaultTimezone,

  // Shared UI configuration (Nuxt UI component slots and variants)
  ui: uiConfig,

  // Organization: shared base + brand-specific overrides
  organization: {
    ...organizationConfig, // name, address, postalcode
    logo: "/images/brand/logo.svg",
    brand: "Alquilatucarro",
    otherbrands: ["Alquilame", "Alquicarros"],
  },

  // Brand-specific reservation configuration
  reservation: {
    website: "https://alquilatucarro.com",
  },

  // Brand-specific franchise information
  franchise: {
    name: "alquilatucarro.com",
    shortname: "alquilatucarro",
    website: "https://alquilatucarro.com",
    title: "Alquiler de Carros en Colombia desde $32/día",
    description:
      "Alquila carros en Bogotá, Medellín, Cali y 16 ciudades más. Hasta 60% descuento por reserva anticipada. Sin pago previo. Flota renovada cada 2 años.",
    logo: "/images/brand/logo.svg",
    oglogo: "/images/brand/og-logo.png",
    svglogo: "/images/brand/logo.svg",
    ogImage: "/img/og-alquilatucarro.jpg",
    phone: "+57 301 672 9250",
    whatsapp: "https://wa.me/573016729250",
    email: "alquilatucarro@gmail.com",
    socialmedia: [
      "https://www.facebook.com/alquilerdecarroscolombia",
      "https://www.instagram.com/alquilatucarro",
      "https://twitter.com/Alquilercarrosc",
      "https://www.youtube.com/@alquilatucarro",
      "https://www.tiktok.com/@alquilatucarro",
      "https://co.pinterest.com/alquilatucarro/",
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
            src: "/images/avatares/uifaces-popular-image5.webp",
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
            src: "/images/avatares/uifaces-popular-image4.webp",
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
            src: "/images/avatares/uifaces-popular-image3.webp",
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
            src: "/images/avatares/uifaces-popular-image2.webp",
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
            src: "/images/avatares/uifaces-human-image6.webp",
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
            src: "/images/avatares/uifaces-popular-image.webp",
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
})
