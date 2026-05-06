import { defineConfig } from 'vitest/config';

// Root-level vitest config. Delegates to per-package configs via `projects`
// so root-invoked vitest (CI hooks, tooling) honors each package's aliases,
// excludes, and environment. Without this, vitest at root scans every
// .spec.ts/.test.ts including Playwright e2e files and pre-Nuxt server
// stubs that depend on package-local module aliases not present at root.
//
// To run a single package: `pnpm --filter <pkg> test` (per
// .claude/rules/conventions.md). This root config is for SDD hooks and
// occasional full-suite runs only.
export default defineConfig({
  test: {
    projects: [
      'packages/logic',
      'packages/ui-alquilatucarro',
      'packages/ui-alquilame',
      'packages/ui-alquicarros',
    ],
  },
});
