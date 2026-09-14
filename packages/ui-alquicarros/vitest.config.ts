import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Vue plugin enables `.vue` SFC parsing for mount-based component tests
  // (SearcherSelectDrawer.mount.test.ts). Source-string tests don't need it,
  // but having it loaded globally is cheap and unblocks the mount path.
  // Absolute asset URLs (`src="/images/asesora-avatar.webp"`) stay plain strings:
  // they live in the logic layer's public/, which Vite can't resolve as imports.
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
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
