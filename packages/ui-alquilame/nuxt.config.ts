// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Extender del logic layer
  extends: ['@rentacar-main/logic'],

  ssr: true,

  devServer: {
    port: 4002
  },

  devtools: { enabled: false },

  // Component Islands: renderiza componentes estáticos sin hidratación Vue
  // Reduce JavaScript en el cliente para mejorar LCP
  // TEMPORALMENTE DESACTIVADO: Puede interferir con Pinia hydration
  experimental: {
    componentIslands: false,
  },

  // Configuración de app: CSS crítico, preloads y atributos HTML
  app: {
    head: {
      htmlAttrs: {
        lang: 'es',
      },
      style: [
        {
          key: 'critical-cls',
          innerHTML: `@layer theme, base, components, utilities;
            @layer base {
            *, *::before, *::after { box-sizing: border-box; }
            body { margin: 0; font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif; }
            /* Preflight block-margin reset — sin esto, al primer paint (solo crítico)
               el <h1> del hero carga su margen UA (0.67em ≈ 24px) y el <p> 1em (16px);
               al aterrizar el CSS inyectado (trae Preflight → margin:0) colapsan y la
               columna de texto encoge 48px, jalando el Searcher hacia arriba → CLS
               /reservas (box-probe). Reservar el estado asentado desde el primer paint. */
            h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd, pre { margin: 0; }
            img { max-width: 100%; height: auto; display: block; }
            picture { display: block; }
            svg { max-width: 100%; height: auto; }
            header svg { max-height: 3.5rem !important; max-width: 10rem !important; }
            }
            @layer utilities {
            .w-2\\.5 { width: 0.625rem; } .h-2\\.5 { height: 0.625rem; }
            .w-4 { width: 1rem; } .h-4 { height: 1rem; }
            .w-5 { width: 1.25rem; } .h-5 { height: 1.25rem; }
            @media (min-width: 768px) { .md\\:w-4 { width: 1rem; } .md\\:h-4 { height: 1rem; } .md\\:text-base { font-size: 1rem; line-height: 1.5rem; } .md\\:w-fit { width: fit-content; } .md\\:flex-row { flex-direction: row; } .md\\:flex-wrap { flex-wrap: wrap; } }
            .mx-auto { margin-left: auto; margin-right: auto; }
            @media (min-width: 768px) { header .md\\:hidden { display: none !important; } header .md\\:flex { display: flex !important; } }
            @media (max-width: 767px) { header .hidden { display: none !important; } }
            @media (min-width: 1024px) { header .lg\\:block { display: block !important; } }
            .block { display: block; }
            .bg-white { background-color: #fff; }
            .text-white { color: #fff; }
            .text-black { color: #000; }
            .w-full { width: 100%; }
            /* CLS fix: aspect-ratio para contenedor de imagen hero */
            .aspect-\\[100\\/81\\] { aspect-ratio: 100/81; }
            /* Critical: Layout background para LCP inmediato */
            .min-h-screen { min-height: 100vh; }
            .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
            .from-\\[\\#000073\\] { --tw-gradient-from: #000073; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
            .via-blue-800 { --tw-gradient-via: #1e40af; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to, transparent); }
            .to-blue-900 { --tw-gradient-to: #1e3a8a; }
            .bg-\\[\\#000073\\] { background-color: #000073; }
            /* Critical: Nuxt UI grid classes - previene CLS en Desktop */
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .gap-8 { gap: 2rem; }
            .items-center { align-items: center; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .isolate { isolation: isolate; }
            /* Header mobile positioning - CRÍTICO para CLS */
            .left-0 { left: 0; }
            .top-0 { top: 0; }
            .right-4 { right: 1rem; }
            .top-4 { top: 1rem; }
            .left-1\\/2 { left: 50%; }
            /* Icon colors - CRÍTICO para CLS (evita iconos negros) */
            .text-red-600 { color: #dc2626; }
            .text-gray-600 { color: #4b5563; }
            /* Header sizes - CRÍTICO para CLS (bandera y logo) */
            .w-32 { width: 8rem; }
            .h-32 { height: 8rem; }
            .h-6 { height: 1.5rem; }
            .h-8 { height: 2rem; }
            .h-10 { height: 2.5rem; }
            .w-auto { width: auto; }
            /*
              Tailwind v4 translate: usar la PROPIEDAD CSS translate (no
              transform: translate(...)). Tailwind v4 emite estas utilidades
              mediante la propiedad translate; si el critical CSS las emitiera
              por transform, ambas (distintas propiedades) se APILAN al cargar
              el CSS principal y el translate se dobla (-translate-y-1/2 da -100%).
              Emitir por translate hace que critical y CSS principal usen la
              misma propiedad: no se apilan (cascada, no suma).
            */
            .transform, .-translate-x-1\\/2, .-translate-y-1\\/2, .-translate-x-\\[10\\%\\], .-translate-y-\\[10\\%\\] {
              --tw-translate-x: 0;
              --tw-translate-y: 0;
              translate: var(--tw-translate-x) var(--tw-translate-y);
            }
            .-translate-x-1\\/2 { --tw-translate-x: -50%; }
            .-translate-y-1\\/2 { --tw-translate-y: -50%; }
            .-translate-x-\\[10\\%\\] { --tw-translate-x: -10%; }
            .-translate-y-\\[10\\%\\] { --tw-translate-y: -10%; }
            /* Hero container padding */
            .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
            .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
            .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            /*
              Reskin hero (F1/F2/F3, #112) above-the-fold utilities — keep in
              sync with components/{home,city}/Hero.vue. Omitted here they ship
              ONLY in the JS-injected stylesheet (there is no render-blocking
              <link>) and apply AFTER first paint, so the hero reflows as they
              land: the inner container gains py-10 (grid drops +40px), the grid
              gains gap-10, and the h1 collapses to leading-[1.1] — the residual
              city CLS after the card fix. These reserve the above-the-fold hero
              geometry from the first paint.
            */
            .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
            @media (min-width: 768px) { .md\\:py-12 { padding-top: 3rem; padding-bottom: 3rem; } }
            .gap-10 { gap: 2.5rem; }
            .gap-5 { gap: 1.25rem; }
            .gap-x-5 { column-gap: 1.25rem; }
            .gap-y-2 { row-gap: 0.5rem; }
            .aspect-\\[16\\/10\\] { aspect-ratio: 16 / 10; }
            .aspect-\\[16\\/9\\] { aspect-ratio: 16 / 9; }
            .leading-\\[1\\.1\\] { line-height: 1.1; }
            /* SEO Dashboard Critical CSS */
            .bg-gray-900 { background-color: #111827; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-700 { background-color: #374151; }
            .bg-red-600 { background-color: #dc2626; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-300 { color: #d1d5db; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-full { border-radius: 9999px; }
            .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
            .border-gray-600 { border-color: #4b5563; }
            .border-gray-700 { border-color: #374151; }
            .border { border-width: 1px; }
            .p-8 { padding: 2rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .w-64 { width: 16rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .font-semibold { font-weight: 600; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            /* UPageHero/UPageSection gaps - CRÍTICO para CLS */
            .gap-16 { gap: 4rem; }
            /* Nuxt UI PageHero slot margins - CRÍTICO para CLS */
            .mt-10 { margin-top: 2.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            /* Nuxt UI PageHero typography - CRÍTICO para CLS */
            .text-5xl { font-size: 3rem; line-height: 1; }
            .tracking-tight { letter-spacing: -0.025em; }
            .font-bold { font-weight: 700; }
            .text-pretty { text-wrap: pretty; }
            .text-center { text-align: center; }
            .justify-center { justify-content: center; }
            .flex-row { flex-direction: row; }
            .space-x-0\\.5 > :not(:last-child) { margin-right: 0.125rem; }
            /* Star rating text - CRÍTICO para CLS */
            .ml-2 { margin-left: 0.5rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            /* SelectBranch/Searcher responsive visibility - CRÍTICO para CLS */
            .hidden { display: none; }
            @media (min-width: 640px) {
              .sm\\:hidden { display: none; }
              .sm\\:flex { display: flex; }
              .sm\\:block { display: block; }
            }
            /* Hero Title typography - CRÍTICO para CLS */
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .uppercase { text-transform: uppercase; }
            .tracking-wide { letter-spacing: 0.025em; }
            /* Hero body layout - CRÍTICO para CLS */
            .justify-items-center { justify-items: center; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .min-w-80 { min-width: 20rem; }
            .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
            /* Max-width container */
            .max-w-\\(--ui-container\\), .max-w-7xl { max-width: 80rem; }
            @media (min-width: 640px) {
              /* UPageSection padding */
              .sm\\:py-16 { padding-top: 4rem; padding-bottom: 4rem; }
              .sm\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
              /* UPageHero padding */
              .sm\\:py-32 { padding-top: 8rem; padding-bottom: 8rem; }
              .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
              .sm\\:gap-y-16 { row-gap: 4rem; }
              .sm\\:gap-y-24 { row-gap: 6rem; }
              .sm\\:gap-16 { gap: 4rem; }
              .sm\\:text-7xl { font-size: 4.5rem; line-height: 1; }
            }
            @media (min-width: 1024px) {
              /* CityPage Searcher visibility - CRÍTICO para CLS */
              .lg\\:hidden { display: none; }
              .lg\\:flex { display: flex; }
              .lg\\:flex-col { flex-direction: column; }
              .lg\\:flex-row { flex-direction: row; }
              .lg\\:items-center { align-items: center; }
              /* Blog sidebar layout - CRÍTICO para CLS */
              .lg\\:w-2\\/3 { width: 66.666667%; }
              .lg\\:w-1\\/3 { width: 33.333333%; }
            }
            /* CityPage Searcher containers height - CRÍTICO para CLS */
            .h-\\[410px\\] { height: 410px; }
            .h-\\[360px\\] { height: 360px; }
            @media (min-width: 1024px) {
              /* UPage wrapper grid */
              .lg\\:grid { display: grid; }
              .lg\\:grid-cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)); }
              .lg\\:gap-10 { gap: 2.5rem; }
              /* Hero section span full width in UPage grid */
              .lg\\:col-span-10 { grid-column: span 10 / span 10; }
              /* Hero container grid */
              .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .lg\\:items-center { align-items: center; }
              /* UPageSection padding */
              .lg\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
              .lg\\:py-32 { padding-top: 8rem; padding-bottom: 8rem; }
              /* UPageHero padding - CRÍTICO para CLS */
              .lg\\:py-40 { padding-top: 10rem; padding-bottom: 10rem; }
              .lg\\:py-20 { padding-top: 5rem; padding-bottom: 5rem; }
              .lg\\:py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
              .lg\\:text-5xl { font-size: 3rem; line-height: 1; }
              .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
              /* order-last para imagen en desktop - CRÍTICO para CLS */
              .lg\\:order-last { order: 9999; }
            }
            /* CRÍTICO CLS: Sobrescribir padding-top del hero (base.css usa !important) */
            /* Sin esto, el padding-top cambia de 6rem a 2rem cuando carga el stylesheet diferido */
            [data-slot="root"].relative.isolate:not(section[id]) [data-slot="container"] {
              padding-top: 1rem !important;
            }
            @media (min-width: 1024px) {
              [data-slot="root"].relative.isolate:not(section[id]) [data-slot="container"] {
                padding-top: 2rem !important;
              }
            }
            /* City Page hero - también usa padding custom con !important */
            .hero-section div[class*="max-w-"][class*="mx-auto"] {
              padding-top: 2rem !important;
              padding-bottom: 1rem !important;
            }
            @media (min-width: 1024px) {
              .hero-section div[class*="max-w-"][class*="mx-auto"] {
                padding-top: 3rem !important;
                padding-bottom: 1.5rem !important;
              }
            }
            /* SEO Dashboard Critical CSS - Grid Layout */
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            @media (min-width: 768px) {
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .md\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
            }
            @media (min-width: 1024px) {
              .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            /* SEO Dashboard - Alert colors with opacity */
            .bg-yellow-900\\/30 { background-color: rgb(113 63 18 / 0.3); }
            .bg-blue-900\\/30 { background-color: rgb(30 58 138 / 0.3); }
            .bg-blue-900\\/20 { background-color: rgb(30 58 138 / 0.2); }
            .bg-red-900\\/20 { background-color: rgb(127 29 29 / 0.2); }
            .bg-gray-900\\/50 { background-color: rgb(17 24 39 / 0.5); }
            .bg-gray-700\\/30 { background-color: rgb(55 65 81 / 0.3); }
            .border-yellow-700 { border-color: #b45309; }
            .border-blue-700 { border-color: #1d4ed8; }
            .border-red-800 { border-color: #991b1b; }
            .border-yellow-800 { border-color: #92400e; }
            .border-purple-700 { border-color: #7e22ce; }
            .text-yellow-400 { color: #facc15; }
            .text-yellow-300 { color: #fde047; }
            .text-yellow-300\\/70 { color: rgb(253 224 71 / 0.7); }
            .text-yellow-500 { color: #eab308; }
            .text-blue-400 { color: #60a5fa; }
            .text-blue-300 { color: #93c5fd; }
            .text-green-400 { color: #4ade80; }
            .text-green-300 { color: #86efac; }
            .text-red-400 { color: #f87171; }
            .text-red-500 { color: #ef4444; }
            .text-red-300 { color: #fca5a5; }
            .text-red-300\\/70 { color: rgb(252 165 165 / 0.7); }
            .text-purple-400 { color: #c084fc; }
            .text-cyan-400 { color: #22d3ee; }
            .text-orange-400 { color: #fb923c; }
            .text-emerald-400 { color: #34d399; }
            /* SEO Dashboard - Progress bar colors */
            .bg-green-500 { background-color: #22c55e; }
            .bg-green-600 { background-color: #16a34a; }
            .bg-blue-500 { background-color: #3b82f6; }
            .bg-blue-600 { background-color: #2563eb; }
            .bg-yellow-500 { background-color: #eab308; }
            .bg-yellow-600 { background-color: #ca8a04; }
            .bg-purple-400 { background-color: #c084fc; }
            .bg-purple-500 { background-color: #a855f7; }
            .bg-purple-600 { background-color: #9333ea; }
            .bg-cyan-500 { background-color: #06b6d4; }
            /* SEO Dashboard - Status badge colors */
            .bg-green-900 { background-color: #14532d; }
            .bg-yellow-900 { background-color: #713f12; }
            .bg-blue-900 { background-color: #1e3a8a; }
            .bg-red-900 { background-color: #7f1d1d; }
            .bg-purple-900 { background-color: #581c87; }
            .bg-purple-900\\/30 { background-color: rgb(88 28 135 / 0.3); }
            /* SEO Dashboard - Layout utilities */
            .flex-1 { flex: 1 1 0%; }
            .items-baseline { align-items: baseline; }
            .min-h-\\[calc\\(100vh-4rem\\)\\] { min-height: calc(100vh - 4rem); }
            .h-2 { height: 0.5rem; }
            .h-3 { height: 0.75rem; }
            .w-3 { width: 0.75rem; }
            .h-12 { height: 3rem; }
            .w-12 { width: 3rem; }
            .h-24 { height: 6rem; }
            .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
            .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
            .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
            .opacity-50 { opacity: 0.5; }
            .transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
            .transition-all { transition-property: all; transition-duration: 150ms; }
            .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; }
            .divide-gray-700 > :not([hidden]) ~ :not([hidden]) { border-color: #374151; }
            .overflow-hidden { overflow: hidden; }
            .overflow-x-auto { overflow-x: auto; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
            .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
            .mt-0\\.5 { margin-top: 0.125rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .ml-auto { margin-left: auto; }
            .pt-4 { padding-top: 1rem; }
            .border-b { border-bottom-width: 1px; }
            .border-t { border-top-width: 1px; }
            .border-l-4 { border-left-width: 4px; }
            .border-green-500 { border-color: #22c55e; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .font-medium { font-weight: 500; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .animate-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            /* SEO Dashboard - Hover states */
            .hover\\:bg-gray-600:hover { background-color: #4b5563; }
            .hover\\:bg-gray-700:hover { background-color: #374151; }
            .hover\\:bg-red-700:hover { background-color: #b91c1c; }
            .hover\\:text-white:hover { color: #fff; }
            .hover\\:text-red-400:hover { color: #f87171; }
            .hover\\:text-blue-300:hover { color: #93c5fd; }
            /* SEO Dashboard - Table styles */
            table { border-collapse: collapse; width: 100%; }
            th, td { text-align: left; }
            .bg-gray-750 { background-color: #2d3748; }
            /* SEO Dashboard - Gradient background */
            .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-blue-900\\/50 { --tw-gradient-from: rgb(30 58 138 / 0.5); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
            .from-purple-900\\/30 { --tw-gradient-from: rgb(88 28 135 / 0.3); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
            .to-purple-900\\/50 { --tw-gradient-to: rgb(88 28 135 / 0.5); }
            .to-blue-900\\/30 { --tw-gradient-to: rgb(30 58 138 / 0.3); }
            /* SEO Dashboard - Additional missing classes */
            .bg-blue-700 { background-color: #1d4ed8; }
            .bg-emerald-500 { background-color: #10b981; }
            .bg-pink-500 { background-color: #ec4899; }
            .bg-emerald-900\\/20 { background-color: rgb(6 78 59 / 0.2); }
            .bg-green-900\\/20 { background-color: rgb(20 83 45 / 0.2); }
            .bg-orange-900\\/20 { background-color: rgb(124 45 18 / 0.2); }
            .bg-red-900\\/20 { background-color: rgb(127 29 29 / 0.2); }
            .bg-red-900\\/30 { background-color: rgb(127 29 29 / 0.3); }
            .bg-red-900\\/50 { background-color: rgb(127 29 29 / 0.5); }
            .border-emerald-800 { border-color: #065f46; }
            .border-green-800 { border-color: #166534; }
            .border-orange-800 { border-color: #9a3412; }
            .border-r { border-right-width: 1px; }
            .border-red-500 { border-color: #ef4444; }
            .border-red-700 { border-color: #b91c1c; }
            .text-blue-200 { color: #bfdbfe; }
            .text-pink-400 { color: #f472b6; }
            .text-gray-500 { color: #6b7280; }
            .inline-flex { display: inline-flex; }
            .flex-wrap { flex-wrap: wrap; }
            .items-end { align-items: flex-end; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .gap-1 { gap: 0.25rem; }
            .p-3 { padding: 0.75rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-8 { margin-top: 2rem; }
            .w-6 { width: 1.5rem; }
            .w-8 { width: 2rem; }
            .w-10 { width: 2.5rem; }
            .w-24 { width: 6rem; }
            .max-w-md { max-width: 28rem; }
            .max-w-xs { max-width: 20rem; }
            .rounded { border-radius: 0.25rem; }
            .rounded-t { border-top-left-radius: 0.25rem; border-top-right-radius: 0.25rem; }
            .font-normal { font-weight: 400; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .underline { text-decoration-line: underline; }
            .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-duration: 150ms; }
            .duration-500 { transition-duration: 500ms; }
            .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
            .placeholder-gray-400::placeholder { color: #9ca3af; }
            /*
              Hero h1 usa la clase de componente .heading-hero (typography.css:
              @apply text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight
              tracking-tight) JUNTO a utilidades text-3xl/leading-[1.1] inline. En el
              render final gana heading-hero, pero está en el CSS inyectado (no en el
              crítico): con solo crítico el h1 pinta a text-3xl (30px) y salta a 36px
              cuando aterriza heading-hero → la columna del Searcher (fila 2 del grid
              en móvil) se desplaza (city/reservas). Se declara heading-hero aquí, al
              FINAL del layer para ganar a text-3xl/leading-[1.1] del crítico, con los
              mismos valores por breakpoint → el h1 tiene su tamaño final desde el
              primer paint. Paridad con alquicarros #291. Ver web#289.
            */
            .heading-hero { font-size: 2.25rem; line-height: 1.25; font-weight: 800; letter-spacing: -0.025em; }
            @media (min-width: 768px) { .heading-hero { font-size: 3rem; } }
            @media (min-width: 1024px) { .heading-hero { font-size: 4.5rem; } }
            }
          `,
        },
      ],
      link: [
        // Brand favicon. Only the .ico is a real brand asset; the prior SVG was a
        // generic placeholder and was removed so the .ico wins in modern browsers.
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  modules: ['@nuxtjs/seo', '@nuxt/ui', '@nuxt/image', '@pinia/nuxt', 'nuxt-llms', 'nuxt-vitalizer', '@nuxtjs/mdc'],

  // Fuentes de marca self-hosted (@nuxt/fonts, bundled con @nuxt/ui).
  // configKey top-level `fonts` — NO se añade a `modules[]`.
  // Self-hosted: @nuxt/fonts descarga y sirve local (sin <link> a Google).
  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', weights: [700, 800] },
      { name: 'DM Sans', weights: [400, 500, 600] },
    ],
  },

  // Optimización de imágenes — Vercel Image Optimization
  image: {
    provider: 'vercel',
    quality: 80,
    // Whitelist del host Blob compartido (modelos de vehículos en Supabase, las 3 marcas).
    // Sin esto, @nuxt/image NO optimiza URLs externas y las imágenes salen como JPEG ~412KB crudo
    // en vez de enrutarse por el optimizador Vercel (/_vercel/image → webp ~45KB).
    // Configurable vía NUXT_IMAGE_DOMAINS (lista CSV) con FALLBACK al host actual: si la env falta
    // en cualquier target de Vercel, la red de seguridad de #48/#72 se mantiene (no hay fallo
    // silencioso → las imágenes nunca vuelven a salir crudas). La env solo habilita rotar el host.
    domains: (process.env.NUXT_IMAGE_DOMAINS || '9grznib0czdjtk77.public.blob.vercel-storage.com')
      .split(',').map((d) => d.trim()).filter(Boolean),
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      // The Vercel image optimizer only accepts widths present in images.sizes,
      // which @nuxt/image derives from these screen values at build time. The
      // runtime srcset for our 800px images on 2x screens requests w=1536, so
      // 1536 must be a screen value here — otherwise /_vercel/image returns 400
      // and the image breaks (#161). Keep this in sync with the widths the
      // generated srcset can actually request.
      xxl: 1536,
    },
  },

  // Optimización Core Web Vitals
  vitalizer: {
    // Diferir stylesheets para eliminar render-blocking CSS
    // Requiere CSS crítico inline suficiente para evitar FOUC
    disableStylesheets: 'entry',
    // Remueve prefetch links para mejorar FCP
    disablePrefetchLinks: true,
  },

  // Configuración SEO
  site: {
    url: 'https://alquilame.co',
    name: 'Alquilame',
    description: 'Alquila carros en Bogotá, Medellín, Cali y 16 ciudades más.',
    defaultLocale: 'es',
    currentLocale: 'es',
  },

  colorMode: {
    preference: 'light',
  },

  // Auto-imports desde logic layer (manejado automáticamente por extends)

  runtimeConfig: {
    // Server-only config (not exposed to client)
    // These can be overridden by NUXT_* env vars at runtime
    seoPassword: '',
    // GSC OAuth credentials (server-only for security)
    // Override with NUXT_GSC_CLIENT_ID, NUXT_GSC_CLIENT_SECRET, NUXT_GSC_REDIRECT_URI
    gscClientId: '',
    gscClientSecret: '',
    gscRedirectUri: '',
    // Supabase (server-only, for reference data queries)
    supabaseUrl: '',
    supabaseAnonKey: '',
    blogApiKey: '',
    blogApiAllowedIps: '',
    // Rentacar admin (server-only — proxied via /api/reservations/*)
    // Override with NUXT_RENTACAR_ADMIN_URL and NUXT_RENTACAR_ADMIN_API_KEY
    rentacarAdminUrl: '',
    rentacarAdminApiKey: '',
    // Public config (exposed to client)
    public: {
      rentacarFranchise: "alquilame",
      rentacarApiReservasFormRecordEndpoint: "/api/reservations/record",
      rentacarApiReservasCategoriesAvailabilityEndpoint: "/api/reservations/availability",
      isTest: process.env.NODE_ENV === "test",
    },
  },

  pinia: {
    storesDirs: ["stores/**"]
  },

  postcss: {
    plugins: {
      'postcss-nested': {} // Habilita postcss-nested
    }
  },

  ogImage: {
    enabled: false
  },

  typescript: {
    strict: true,
    typeCheck: false  // Fix: Evita errores de typecheck en build
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['@vueuse/core']
    },
    define: {
      // Enable detailed hydration mismatch warnings in production
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
    },
    // Fix para timeout de vite-node al cargar módulos
    // https://github.com/nuxt/nuxt/issues/32789
    // https://github.com/nuxt/nuxt/pull/32874
    viteNode: {
      requestTimeout: 180000, // 3 minutos (aumentado desde 60s por defecto)
    }
  },

  hooks: {
    // @nuxt/image 1.11.0 hardcodes Vercel Build Output images.formats to
    // ['image/webp','image/avif'] and merges via defu (which CONCATENATES
    // arrays). A plain nitro.vercel.config.images cannot override it. This
    // post-module hook hard-assigns the authoritative block so the Vercel
    // optimizer serves webp-only with our cache/size/host allowlist.
    'nitro:config'(nitroConfig: { vercel?: { config?: { images?: unknown } } }) {
      nitroConfig.vercel = nitroConfig.vercel || {}
      nitroConfig.vercel.config = nitroConfig.vercel.config || {}
      nitroConfig.vercel.config.images = {
        // Must include every width the @nuxt/image srcset can request, or the
        // Vercel optimizer returns 400 and the image breaks. Our 800px images on
        // 2x screens request w=1536, so 1536 must be here. Keep in sync with
        // `image.screens` above (#161).
        sizes: [320, 640, 768, 1024, 1280, 1536],
        qualities: [80],
        formats: ['image/webp'],
        minimumCacheTTL: 2678400,
        remotePatterns: [
          { protocol: 'https', hostname: '^[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com$' },
        ],
      }
    },
  },

  nitro: {
    esbuild: {
      options: {
        target: 'node20'
      }
    },
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      '/': { isr: 3600 },
      '/armenia': { isr: 3600 },
      '/barranquilla': { isr: 3600 },
      '/bogota': { isr: 3600 },
      '/bucaramanga': { isr: 3600 },
      '/cali': { isr: 3600 },
      '/cartagena': { isr: 3600 },
      '/cucuta': { isr: 3600 },
      '/ibague': { isr: 3600 },
      '/manizales': { isr: 3600 },
      '/medellin': { isr: 3600 },
      '/monteria': { isr: 3600 },
      '/neiva': { isr: 3600 },
      '/pereira': { isr: 3600 },
      '/santa-marta': { isr: 3600 },
      '/valledupar': { isr: 3600 },
      '/villavicencio': { isr: 3600 },
      '/floridablanca': { isr: 3600 },
      '/palmira': { isr: 3600 },
      '/soledad': { isr: 3600 },
      // Blog — ISR como las city pages (issue #52)
      '/blog': { isr: 3600 },
      '/blog/**': { isr: 3600 },
    },
    prerender: {
      routes: [
        '/',
        '/armenia',
        '/barranquilla',
        '/bogota',
        '/bucaramanga',
        '/cali',
        '/cartagena',
        '/cucuta',
        '/ibague',
        '/manizales',
        '/medellin',
        '/monteria',
        '/neiva',
        '/pereira',
        '/santa-marta',
        '/valledupar',
        '/villavicencio',
        '/floridablanca',
        '/palmira',
        '/soledad',
        '/gana',
        '/gana/terminos-condiciones',
        '/gana/politicas-privacidad',
        // Blog — SSR (not prerendered: content comes from Vercel Blob at runtime)
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  sitemap: {
    urls: [
      // Homepage - máxima prioridad
      { loc: '/', changefreq: 'weekly', priority: 1.0 },
      // Ciudades principales - alta prioridad
      { loc: '/bogota', changefreq: 'monthly', priority: 0.9 },
      { loc: '/medellin', changefreq: 'monthly', priority: 0.9 },
      { loc: '/cali', changefreq: 'monthly', priority: 0.9 },
      { loc: '/cartagena', changefreq: 'monthly', priority: 0.9 },
      { loc: '/barranquilla', changefreq: 'monthly', priority: 0.9 },
      // Ciudades secundarias - prioridad media
      { loc: '/armenia', changefreq: 'monthly', priority: 0.8 },
      { loc: '/bucaramanga', changefreq: 'monthly', priority: 0.8 },
      { loc: '/cucuta', changefreq: 'monthly', priority: 0.8 },
      { loc: '/ibague', changefreq: 'monthly', priority: 0.8 },
      { loc: '/manizales', changefreq: 'monthly', priority: 0.8 },
      { loc: '/monteria', changefreq: 'monthly', priority: 0.8 },
      { loc: '/neiva', changefreq: 'monthly', priority: 0.8 },
      { loc: '/pereira', changefreq: 'monthly', priority: 0.8 },
      { loc: '/santa-marta', changefreq: 'monthly', priority: 0.8 },
      { loc: '/valledupar', changefreq: 'monthly', priority: 0.8 },
      { loc: '/villavicencio', changefreq: 'monthly', priority: 0.8 },
      { loc: '/floridablanca', changefreq: 'monthly', priority: 0.8 },
      { loc: '/palmira', changefreq: 'monthly', priority: 0.8 },
      { loc: '/soledad', changefreq: 'monthly', priority: 0.8 },
      // Blog index — individual /blog/* posts come from sitemap.sources (dynamic, Supabase)
      { loc: '/blog', changefreq: 'weekly', priority: 0.8 },
    ],
    sources: ['/api/__sitemap__/blog'],
    exclude: ['/pendiente', '/sindisponibilidad', '/reservado/**', '/*/buscar-vehiculos/**', '/seo/**'],
  },

  robots: {
    // Bots de entrenamiento IA (GPTBot, CCBot, Google-Extended, etc.) permitidos
    // vía wildcard. Decisión #71: priorizar mindshare en IA. No agregar grupos de
    // bloqueo aquí — rompe la consistencia con las 3 marcas.
    blockNonSeoBots: false,
    disallow: ['/seo', '/seo/*'],
    allow: [
      '/',
      '/armenia',
      '/barranquilla',
      '/bogota',
      '/bucaramanga',
      '/cali',
      '/cartagena',
      '/cucuta',
      '/ibague',
      '/manizales',
      '/medellin',
      '/monteria',
      '/neiva',
      '/pereira',
      '/santa-marta',
      '/valledupar',
      '/villavicencio',
      '/floridablanca',
      '/palmira',
      '/soledad',
      '/blog',
      '/blog/*',
    ],
    sitemap: "/sitemap.xml"
  },

  llms: {
    domain: 'https://alquilame.co',
    title: 'Alquilame',
    description: 'Los mejores precios en alquiler de carros y alquiler de camionetas en varias zonas del país. Reserva Ahora! Tenemos variedad de carros nuevos renovando nuestra flota cada 2 años. Alquiler de carros en Bogotá, Medellín, Barranquilla, Cali, Cartagena, Bucaramanga, Ibagué, Manizales, Cúcuta, Santa Marta, Pereira, Montería y Villavicencio.',
    sections: [
      {
        title: 'Lugares',
        description: 'Ciudades de Colombia donde se presta el servicio de alquiler de carros',
        links: [
          {
            title: 'Armenia',
            description: '¿Planeas visitar Armenia? En Alquilame Armenia puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto El Edén. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como Salento, Filandia o el Parque del Café. Nuestra sede en Armenia te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en el corazón del Paisaje Cultural Cafetero, declarado Patrimonio de la Humanidad!',
            href: '/armenia',
          },
          {
            title: 'Barranquilla',
            description: '¿Planeas visitar Barranquilla? En Alquilame Barranquilla puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Ernesto Cortissoz. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Malecón del Río, el Museo del Caribe o el Zoológico de Barranquilla. Nuestra sede en Barranquilla te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Puerta de Oro de Colombia, epicentro del Carnaval más famoso del país!',
            href: '/barranquilla',
          },
          {
            title: 'Bogotá',
            description: '¿Planeas visitar Bogotá? En Alquilame Bogotá puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto El Dorado. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Museo del Oro, el Cerro de Monserrate o la Zona Rosa. Nuestra sede en Bogotá te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la capital a 2.600 metros más cerca de las estrellas!',
            href: '/bogota',
          },
          {
            title: 'Bucaramanga',
            description: '¿Planeas visitar Bucaramanga? En Alquilame Bucaramanga puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Palonegro. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Parque Nacional del Chicamocha, el Ecoparque Cerro del Santísimo o el centro histórico. Nuestra sede en Bucaramanga te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Ciudad Bonita de Colombia, famosa por sus parques y aventura extrema!',
            href: '/bucaramanga',
          },
          {
            title: 'Cali',
            description: '¿Planeas visitar Cali? En Alquilame Cali puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Alfonso Bonilla Aragón. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Zoológico de Cali, la Iglesia La Ermita o el Cristo Rey. Nuestra sede en Cali te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la capital mundial de la salsa, donde el ritmo nunca para!',
            href: '/cali',
          },
          {
            title: 'Cartagena',
            description: '¿Planeas visitar Cartagena? En Alquilame Cartagena puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Rafael Núñez. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Castillo de San Felipe, el Centro Histórico o las Islas del Rosario. Nuestra sede en Cartagena te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Heroica, joya colonial del Caribe!',
            href: '/cartagena',
          },
          {
            title: 'Cúcuta',
            description: '¿Planeas visitar Cúcuta? En Alquilame Cúcuta puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Camilo Daza. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Malecón, el Parque Santander o el Puente Internacional Simón Bolívar. Nuestra sede en Cúcuta te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Perla del Norte, puerta fronteriza con Venezuela!',
            href: '/cucuta',
          },
          {
            title: 'Ibagué',
            description: '¿Planeas visitar Ibagué? En Alquilame Ibagué puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Perales. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Cañón del Combeima, el Jardín Botánico San Jorge o el Conservatorio del Tolima. Nuestra sede en Ibagué te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Capital Musical de Colombia, cuna de festivales folclóricos!',
            href: '/ibague',
          },
          {
            title: 'Manizales',
            description: '¿Planeas visitar Manizales? En Alquilame Manizales puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto La Nubia. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como la Catedral Basílica, el Ecoparque Los Yarumos o el Nevado del Ruiz. Nuestra sede en Manizales te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Ciudad de las Puertas Abiertas, entre volcanes y café!',
            href: '/manizales',
          },
          {
            title: 'Medellín',
            description: '¿Planeas visitar Medellín? En Alquilame Medellín puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto José María Córdova. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Parque Arví, la Comuna 13 o el Jardín Botánico. Nuestra sede en Medellín te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Ciudad de la Eterna Primavera, ejemplo de innovación urbana!',
            href: '/medellin',
          },
          {
            title: 'Montería',
            description: '¿Planeas visitar Montería? En Alquilame Montería puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Los Garzones. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Río Sinú, el Parque Ronda del Sinú o el Sombrero Vueltiao. Nuestra sede en Montería te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Perla del Sinú, capital ganadera del Caribe!',
            href: '/monteria',
          },
          {
            title: 'Neiva',
            description: '¿Planeas visitar Neiva? En Alquilame Neiva puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Benito Salas. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Desierto de la Tatacoa, el Parque Andino o el Festival del Bambuco. Nuestra sede en Neiva te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Puerta del Sur, cerca de maravillas arqueológicas!',
            href: '/neiva',
          },
          {
            title: 'Pereira',
            description: '¿Planeas visitar Pereira? En Alquilame Pereira puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Matecaña. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Bioparque Ukumarí, el Santuario de Fauna y Flora Otún Quimbaya o el Cerrito. Nuestra sede en Pereira te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Querendona, Trasnochadora y Morena del Eje Cafetero!',
            href: '/pereira',
          },
          {
            title: 'Santa Marta',
            description: '¿Planeas visitar Santa Marta? En Alquilame Santa Marta puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Simón Bolívar. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Parque Tayrona, la Quinta de San Pedro Alejandrino o Taganga. Nuestra sede en Santa Marta te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Bahía Más Linda de América!',
            href: '/santa-marta',
          },
          {
            title: 'Valledupar',
            description: '¿Planeas visitar Valledupar? En Alquilame Valledupar puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Alfonso López. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Río Guatapurí, la Plaza Alfonso López o el Festival Vallenato. Nuestra sede en Valledupar te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Cuna del Vallenato, tierra de acordeones y leyendas!',
            href: '/valledupar',
          },
          {
            title: 'Villavicencio',
            description: '¿Planeas visitar Villavicencio? En Alquilame Villavicencio puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Vanguardia. Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Bioparque Los Ocarros, el Mirador de Buenavista o Caño Cristales (cerca). Nuestra sede en Villavicencio te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Puerta al Llano, con sabores de llanero auténtico!',
            href: '/villavicencio',
          },
          {
            title: 'Floridablanca',
            description: '¿Planeas visitar Floridablanca? En Alquilame Floridablanca puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Palonegro (Bucaramanga). Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Ecoparque Cerro El Santísimo, el Jardín Botánico Eloy Valenzuela o Cañón del Chicamocha. Nuestra sede en Floridablanca te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Ciudad Dulce de Colombia, famosa por sus obleas!',
            href: '/floridablanca',
          },
          {
            title: 'Palmira',
            description: '¿Planeas visitar Palmira? En Alquilame Palmira puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Alfonso Bonilla Aragón (Cali). Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Lago Calima, el Parque del Azúcar o el centro histórico. Nuestra sede en Palmira te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en la Villa de las Palmas, corazón agrícola del Valle!',
            href: '/palmira',
          },
          {
            title: 'Soledad',
            description: '¿Planeas visitar Soledad? En Alquilame Soledad puedes reservar en línea sin anticipos y recoger directamente en el Aeropuerto Ernesto Cortissoz (Barranquilla). Aprovecha descuentos de hasta el 60% por reserva anticipada y elige entre carros compactos, sedanes o camionetas para recorrer lugares como el Malecón del Río, el Parque Sagrado Corazón o el Museo del Carnaval. Nuestra sede en Soledad te ofrece precios bajos y disponibilidad inmediata los 7 días de la semana. ¡Alquila fácil, sin trámites largos y comienza tu aventura en el municipio más poblado del Atlántico, vibrante y carnavalero!',
            href: '/soledad',
          },
        ],
      },
    ],
  },
})
