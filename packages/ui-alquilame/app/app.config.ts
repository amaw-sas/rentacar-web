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
    website: "https://alquilame.co",
    title: "Alquiler de Carros en Colombia",
    description:
      "Alquila carros en Bogotá, Medellín, Cali y 16 ciudades más. Reserva sin pago previo y ahorra hasta 60% por anticipación.",
    logo: "/images/brand/logo.svg",
    oglogo: "/images/brand/og-logo.png",
    svglogo: "/images/brand/logo.svg",
    ogImage: "/img/og-alquilame.jpg",
    phone: "+57 300 243 6677",
    whatsapp: "https://wa.me/573002436677",
    email: "alquilame@gmail.com",
    socialmedia: [
      "https://www.facebook.com/alquilameco",
      "https://www.instagram.com/alquilamecol",
      "https://twitter.com/alquilame",
      "https://www.youtube.com/@alquilameco",
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
        link: "/quejas-y-reclamos",
        label: "Quejas y reclamos",
      },
      {
        link: "/gana",
        label: "Gana comisiones",
      },
      {
        // Convenios B2B con rentadoras (no es para un particular con un carro).
        link: "/aliados",
        label: "Sé nuestro aliado",
      },
      {
        link: "/blog",
        label: "Blog",
      },
    ],
  },

})
