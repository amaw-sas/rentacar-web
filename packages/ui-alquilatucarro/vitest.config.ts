import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Simple node environment for utility function tests
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),  // Project root for server utilities
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
});
