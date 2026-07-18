/**
 * Brand-specific configuration for Alquicarros
 *
 * This file imports shared configuration from @rentacar-main/logic
 * and only defines brand-specific overrides for the Alquicarros brand.
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
  // brand primary. `brand` is the custom scale defined in theme.css (#EF9600).
  ui: {
    ...uiConfig,
    colors: { primary: 'brand', neutral: 'zinc' },
  },

  // Organization: shared base + brand-specific overrides
  organization: {
    ...organizationConfig, // name, address, postalcode
    logo: "/images/brand/logo.svg",
    brand: "Alquicarros",
    otherbrands: ["Alquilatucarro", "Alquilame"],
  },

  // Brand-specific reservation configuration
  reservation: {
    website: "https://alquicarros.com",
  },

  // Brand-specific franchise information
  franchise: {
    name: "alquicarros.com",
    shortname: "alquicarros",
    website: "https://alquicarros.com",
    title: "Alquiler de Carros en Colombia desde $220.000 COP/día",
    description:
      "Alquila carros desde $220.000 COP/día en Bogotá, Medellín, Cali y 16 ciudades más. Reserva sin pago previo y ahorra hasta 60% por anticipación.",
    logo: "/images/brand/logo.svg",
    oglogo: "/images/brand/og-logo.png",
    svglogo: "/images/brand/logo.svg",
    ogImage: "/img/og-alquicarros.jpg",
    phone: "+57 318 770 3670",
    whatsapp: "https://wa.me/573187703670",
    email: "alquicarros@gmail.com",
    socialmedia: [
      "https://www.facebook.com/alquicarroscolombia",
      "https://www.instagram.com/alquicarroscolombia",
      "https://x.com/alquicarroscol",
      "https://www.youtube.com/@alquilacarros",
      "https://www.tiktok.com/@alquicarroscol",
      "https://co.pinterest.com/alquicarroscol/",
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
