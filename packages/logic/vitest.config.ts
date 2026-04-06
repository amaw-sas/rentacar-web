import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@rentacar-main/logic': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
