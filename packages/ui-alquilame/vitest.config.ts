import { defineConfig, configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Vue SFC support so component tests can mount real .vue files. Per-file
  // env override (`// @vitest-environment happy-dom`) opts those into a DOM;
  // utility/source tests keep the default node env.
  plugins: [vue()],
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
