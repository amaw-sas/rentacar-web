import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Simple node environment for utility function tests
    root: fileURLToPath(new URL('.', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
});
