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

  // Configuración para desarrollo del layer
  devtools: { enabled: false },
})
