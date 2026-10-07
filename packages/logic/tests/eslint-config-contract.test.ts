/**
 * Contract for the repo's single ESLint flat config (/eslint.config.mjs).
 *
 * The lint was dead for a long time — `eslint` was missing from every package
 * while CI hid the failure behind `continue-on-error`. Three deliberate
 * exceptions were declared when it was revived, and one parser fix. Each one is
 * a decision somebody could silently undo; these assertions are what makes
 * undoing it loud.
 *
 * It lives in `packages/logic/tests` for the same reason
 * `nuxt-config-hygiene.test.ts` does: that is the brand-agnostic suite CI runs
 * on every PR (`pnpm --filter @rentacar-main/logic test`).
 */
import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const p = (rel: string) => `${REPO_ROOT}${rel}`;

const A_PAGE = 'packages/ui-alquilame/app/pages/index.vue';
const A_COMPONENT = 'packages/ui-alquilame/app/components/CategorySelectionSection.vue';
const A_PROD_TS = 'packages/logic/src/utils/validation/reservationForm.ts';
const A_TEST_TS = 'packages/logic/src/composables/__tests__/useRecordReservationForm.iva.test.ts';

/** The six files that failed to PARSE while the preset forced jsx on .vue. */
const ANGLE_ASSERTION_FILES = [
  'packages/ui-alquicarros/app/pages/index.vue',
  'packages/ui-alquilame/app/pages/index.vue',
  'packages/ui-alquilatucarro/app/pages/index.vue',
  'packages/ui-alquicarros/app/pages/blog/[...slug].vue',
  'packages/ui-alquilame/app/pages/blog/[...slug].vue',
  'packages/ui-alquilatucarro/app/pages/blog/[...slug].vue',
];

const eslint = new ESLint({ cwd: REPO_ROOT });

const severityOf = (rules: Record<string, unknown> | undefined, name: string): number => {
  const entry = rules?.[name];
  if (entry === undefined) return -1; // not configured at all
  const raw = Array.isArray(entry) ? entry[0] : entry;
  if (raw === 'off' || raw === 0) return 0;
  if (raw === 'warn' || raw === 1) return 1;
  return 2;
};

describe('eslint.config.mjs — the config loads and covers the monorepo', () => {
  it('resolves a config for files in all four packages', { timeout: 120_000 }, async () => {
    for (const rel of [
      'packages/logic/src/index.ts',
      'packages/ui-alquilatucarro/app/app.vue',
      'packages/ui-alquilame/app/app.vue',
      'packages/ui-alquicarros/app/app.vue',
    ]) {
      const cfg = await eslint.calculateConfigForFile(p(rel));
      expect(cfg, rel).toBeTruthy();
      expect(Object.keys(cfg.rules ?? {}).length, rel).toBeGreaterThan(50);
    }
  });
});

describe('parser fix — .vue is parsed without JSX', () => {
  it('disables jsx for .vue files', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_PAGE));
    expect(cfg.languageOptions?.parserOptions?.ecmaFeatures?.jsx).toBe(false);
  });

  it('parses the angle-bracket type assertion `<Type>{...}` without a fatal error', { timeout: 120_000 }, async () => {
    // `useSchemaOrg([<FAQPage>{...}])` is valid TS that compiles and ships; with
    // jsx on it produced "Parsing error: '}' expected." and the whole file went
    // unlinted. A fatal message has ruleId === null.
    const results = await eslint.lintFiles(ANGLE_ASSERTION_FILES.map(p));
    const fatal = results.flatMap(r =>
      r.messages.filter(m => m.fatal || m.ruleId === null).map(m => `${r.filePath}:${m.line} ${m.message}`),
    );
    expect(fatal).toEqual([]);
  });
});

describe('declared exception 1 — import/first is off only in tests', () => {
  it('is off for a test file, because the suites import after vi.mock()', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_TEST_TS));
    expect(severityOf(cfg.rules, 'import/first')).toBe(0);
  });

  it('still bites in production code', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_PROD_TS));
    expect(severityOf(cfg.rules, 'import/first')).toBe(2);
  });
});

describe('declared exception 2 — single template root stays scoped to pages/layouts', () => {
  it('errors on a page, with documentation comments allowed', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_PAGE));
    const entry = cfg.rules?.['vue/no-multiple-template-root'];
    expect(severityOf(cfg.rules, 'vue/no-multiple-template-root')).toBe(2);
    expect(Array.isArray(entry) && entry[1]).toMatchObject({ disallowComments: false });
  });

  it('does NOT apply to components — Vue 3 allows several roots there', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_COMPONENT));
    expect(severityOf(cfg.rules, 'vue/no-multiple-template-root')).toBeLessThan(2);
  });
});

describe('declared exception 3 — no-explicit-any is a ratchet, not a mute', () => {
  it('is a warning, so every occurrence still prints on each run', { timeout: 60_000 }, async () => {
    const cfg = await eslint.calculateConfigForFile(p(A_PROD_TS));
    expect(severityOf(cfg.rules, '@typescript-eslint/no-explicit-any')).toBe(1);
  });

  it('is capped by --max-warnings in the root lint script, so the count can only go down', async () => {
    const pkg = await import(`${REPO_ROOT}package.json`, { with: { type: 'json' } });
    expect(pkg.default.scripts.lint).toMatch(/--max-warnings[= ]\d+/);
  });
});
