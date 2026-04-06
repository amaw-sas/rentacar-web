// https://nuxt.com/docs/api/configuration/nuxt-config
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

  // Configuración para desarrollo del layer
  devtools: { enabled: false },
})
