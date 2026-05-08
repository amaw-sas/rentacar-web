import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Vue plugin enables `.vue` SFC parsing for mount-based component tests
  // (UnableCategoryCard.mount.test.ts). Source-string tests don't need it,
  // but having it loaded globally is cheap and unblocks the mount path.
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node', // Simple node environment for utility function tests
    root: fileURLToPath(new URL('.', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**', '**/e2e/**'],
    // Per-file environment override via `// @vitest-environment` pragma
    // takes precedence — mount tests opt into jsdom that way.
  },
  resolve: {
    alias: {
      // Nuxt resolves bare `~` to the project root for `server/`, but `~/components/...`
      // (used in `app/`) resolves to `./app/components/...`. Vitest doesn't carry
      // Nuxt's auto-rewrites, so we register the more specific alias first.
      '~/components': fileURLToPath(new URL('./app/components', import.meta.url)),
      '~': fileURLToPath(new URL('.', import.meta.url)),  // Project root for server utilities
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
});
