import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Issue #18 regression guard. `nuxt typecheck` (nuxi) only runs `vue-tsc -b`
 * (build-mode, which loads the generated auto-import globals) when the brand
 * `tsconfig.json` declares `references`. If a brand reverts to the old
 * `extends tsconfig.base.json` + custom `paths` shape, nuxi silently falls back
 * to plain `vue-tsc --noEmit` and every Nuxt auto-import becomes TS2304 again.
 *
 * This test locks the canonical Nuxt 4 solution form across all three brands.
 */

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const;

const EXPECTED_REFERENCES = [
  './.nuxt/tsconfig.app.json',
  './.nuxt/tsconfig.server.json',
  './.nuxt/tsconfig.shared.json',
  './.nuxt/tsconfig.node.json',
];

function readBrandTsconfig(brand: string): Record<string, unknown> {
  // Parse with TypeScript so the guard reads the file exactly as nuxi/vue-tsc do
  // (tsconfig is JSONC: comments + trailing commas), instead of a brittle regex.
  const file = fileURLToPath(new URL(`../../../${brand}/tsconfig.json`, import.meta.url));
  const { config, error } = ts.readConfigFile(file, ts.sys.readFile);
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  }
  return config;
}

describe('issue #18: brand tsconfig.json stays in Nuxt 4 solution form', () => {
  for (const brand of BRANDS) {
    it(`${brand} references the four generated split tsconfigs`, () => {
      const cfg = readBrandTsconfig(brand);
      const refs = (cfg.references as Array<{ path: string }> | undefined)?.map((r) => r.path);
      expect(refs).toEqual(EXPECTED_REFERENCES);
    });

    it(`${brand} declares empty files[] and no legacy extends/paths`, () => {
      const cfg = readBrandTsconfig(brand);
      expect(cfg.files).toEqual([]);
      // Must NOT extend the base config — that reintroduces the broken plain mode.
      expect(cfg.extends).toBeUndefined();
      // The unused `@logic/*` alias must stay removed.
      const paths = (cfg.compilerOptions as { paths?: Record<string, unknown> } | undefined)?.paths;
      expect(paths?.['@logic/*']).toBeUndefined();
    });
  }

  it('all three brands share an identical tsconfig shape', () => {
    const [first, ...rest] = BRANDS.map(readBrandTsconfig);
    for (const other of rest) {
      expect(other).toEqual(first);
    }
  });
});
