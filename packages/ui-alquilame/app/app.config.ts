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
} from '@rentacar-main/logic/config'

export default defineAppConfig({
  // Shared default timezone
  defaultTimezone: defaultConfig.defaultTimezone,

  // Shared UI configuration (Nuxt UI component slots and variants) +
  // brand primary. `brand` is the custom scale defined in theme.css (#CC022B).
  ui: {
    ...uiConfig,
    colors: { primary: 'brand', neutral: 'zinc' },
  },

  // Organization: shared base + brand-specific overrides
  organization: {
    ...organizationConfig, // name, address, postalcode
    logo: "/images/brand/logo.svg",
    brand: "Alquilame",
    otherbrands: ["Alquilatucarro", "Alquicarros"],
  },

  // Brand-specific reservation configuration
  reservation: {
    website: "https://alquilame.co",
  },

  // Brand-specific franchise information
  franchise: {
    name: "alquilame.co",
    shortname: "alquilame",
    // Feature flag (Escudo): muestra el chat IA por marca. Apagar = ocultar el
    // item "Chat" del FAB y redirigir /chat. Toggle por config + redeploy.
    chatEnabled: false,
    website: "https://alquilame.co",
    title: "Alquiler de Carros en Colombia desde $32/día",
    description:
      "Alquila carros en Bogotá, Medellín, Cali y 16 ciudades más. Hasta 60% descuento por reserva anticipada. Sin pago previo. Flota renovada cada 2 años.",
    logo: "/images/brand/logo.svg",
    oglogo: "/images/brand/og-logo.png",
    svglogo: "/images/brand/logo.svg",
    ogImage: "/img/og-alquilame.jpg",
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
  },

})
