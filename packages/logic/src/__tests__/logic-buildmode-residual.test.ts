import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Regression guard for the build-mode multi-project residual (follows issue #18).
 *
 * In `vue-tsc -b`, the server/node projects pull in whatever the app's
 * `app.config.ts` imports (Nitro needs app.config types). Two leaks dragged the
 * app composables/stores — which use app-only auto-imports — into that context,
 * producing TS2304:
 *   1. app.config.ts importing the full barrel `@rentacar-main/logic/src`
 *      (`export *` of every composable/store) instead of the narrow `/config`.
 *   2. utils/index.ts re-exporting `ReservationResumeProps`, whose type is
 *      `ReturnType<typeof useCategory>` — a value import of the useCategory
 *      composable that the utils barrel then drags everywhere.
 *
 * These assertions lock both fixes so the leak cannot silently return.
 */

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const;

function readRepoFile(relFromPackages: string): string {
  const url = new URL(`../../../${relFromPackages}`, import.meta.url);
  return readFileSync(fileURLToPath(url), 'utf8');
}

describe('logic build-mode residual: shared config stays composable-free', () => {
  for (const brand of BRANDS) {
    it(`${brand}/app.config.ts imports shared config from the narrow /config entry`, () => {
      const src = readRepoFile(`${brand}/app/app.config.ts`);
      // Must use the composable-free entry...
      expect(src).toContain("from '@rentacar-main/logic/config'");
      // ...and must NOT pull the full barrel, which re-exports every composable
      // and store and leaks them into the server/node typecheck projects.
      expect(src).not.toMatch(/from\s+['"]@rentacar-main\/logic\/src['"]/);
    });
  }

  it('utils/index.ts does not re-export ReservationResumeProps (composable bridge)', () => {
    const src = readRepoFile('logic/src/utils/index.ts');
    expect(src).not.toMatch(/export\b.*ReservationResumeProps/);
  });
});
