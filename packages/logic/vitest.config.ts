import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: fileURLToPath(new URL('.', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@rentacar-main/logic': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
