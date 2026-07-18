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
} from '@rentacar-main/logic/config'

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
    title: "Alquiler de Carros en Colombia desde $220.000 COP/día",
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
  },

})
