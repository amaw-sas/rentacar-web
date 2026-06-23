// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  // Configurar como Nuxt Layer
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-01-22',

  // Modules required by this layer
  modules: ['@pinia/nuxt'],

  // Auto-importar composables y stores desde este layer
  // Utils no se auto-importa porque contiene principalmente tipos
  imports: {
    dirs: [
      'src/composables/**',
      'src/stores/**',
    ],
  },

  // Issue #50: shared CSS shipped by the layer so all 3 brands inherit the
  // @nuxt/ui toaster centered-viewport double-transform fix from one place.
  css: [
    fileURLToPath(new URL('./src/assets/issue-50-toaster.css', import.meta.url)),
  ],

  // Issue #116: public base URL of the dashboard's documented API (D2), shared
  // by the 3 brands (single brand-agnostic chokepoint). Consumed in useBaseSEO
  // to point the ReserveAction's programmatic EntryPoint + actionApplication at
  // the public OpenAPI. Prod MUST override via NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE
  // — the default is a Vercel project-suffix alias (fragile); a stable custom
  // domain should replace it once it exists.
  runtimeConfig: {
    public: {
      rentacarPublicApiBase: 'https://rentacar-dashboard-delta.vercel.app',
      // Feature flag (Escudo): muestra el chat IA. Default OFF; se enciende por
      // ENTORNO y por marca con la env var NUXT_PUBLIC_CHAT_ENABLED=true en el
      // proyecto Vercel correspondiente (ej. Preview ON / Production OFF). Permite
      // probar en preview sin exponerlo en producción, y encender por marca.
      // Nuxt coerciona la env string a boolean (destr), así que el valor en runtime
      // es boolean; los lectores comparan `=== true`.
      chatEnabled: false,
    },
  },

  // Configuración para desarrollo del layer
  devtools: { enabled: false },
})
