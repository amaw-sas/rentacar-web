import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: false },
  alias: {
    '@fixture/useReservationConfirmation': fileURLToPath(
      new URL('../../../src/composables/useReservationConfirmation.ts', import.meta.url),
    ),
    '@rentacar-main/logic/utils': fileURLToPath(
      new URL('../../../src/utils/index.ts', import.meta.url),
    ),
  },
})
