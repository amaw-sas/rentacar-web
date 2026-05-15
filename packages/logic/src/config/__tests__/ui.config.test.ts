// External
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Issue #50 — availability-searcher toast overflows the mobile viewport.
 *
 * Encodes the root-cause regression invariant. End-to-end behaviour is the
 * holdout (docs/specs/2026-05-15-issue-50-mobile-toast-overflow/scenarios/),
 * validated by runtime DOM oracles; this is the unit-level contract guard.
 *
 * Root cause: @nuxt/ui 4.2.1's default `*-center` toaster position variant
 * centers the viewport with `left-1/2 transform -translate-x-1/2`. Under
 * Tailwind v4, `-translate-x-1/2` emits the standalone `translate` property
 * while the legacy `transform` class ALSO applies `translateX(-50%)` — the
 * -50% shift lands twice, pushing the toast off the left edge.
 *
 * app.config `ui.toaster` overrides cannot fix this (tailwind-variants emits
 * the library default position variant AFTER the app.config override, so
 * tailwind-merge keeps the broken classes — verified at runtime). The fix is
 * a scoped CSS rule shipped once by the shared logic layer and inherited by
 * all 3 brands via `extends`.
 */
describe('issue #50 — shared toaster centering CSS', () => {
  const css = readFileSync(
    fileURLToPath(new URL('../../assets/issue-50-toaster.css', import.meta.url)),
    'utf8',
  );
  const nuxtConfig = readFileSync(
    fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
    'utf8',
  );

  it('is wired into the shared logic layer so all brands inherit it', () => {
    // The filename can only appear inside the layer `css: []` array.
    expect(nuxtConfig).toContain('issue-50-toaster.css');
  });

  it('scopes the override to the broken centered variants only', () => {
    // Token match (`~=`) on BOTH broken classes — not substring — so brand
    // `ui` overrides / arbitrary values containing "left-1/2" don't match,
    // and left/right-anchored toasters are untouched.
    expect(css).toMatch(
      /ol\[data-slot="viewport"\]\[class~="left-1\/2"\]\[class~="-translate-x-1\/2"\]/,
    );
  });

  it('neutralises BOTH halves of the Tailwind-v4 double -50% shift', () => {
    expect(css).toMatch(/transform:\s*none\s*!important/);
    expect(css).toMatch(/translate:\s*none\s*!important/);
  });

  it('re-centers transform-free without clamping width or vertical offset', () => {
    expect(css).toMatch(/inset-inline:\s*0\s*!important/);
    expect(css).toMatch(/margin-inline:\s*auto\s*!important/);
    // Must NOT hard-set width/top — the default responsive width
    // (w-[calc(100%-2rem)] sm:w-96) and top/bottom offset stay authoritative.
    expect(css).not.toMatch(/(^|\s|;)\s*width:/);
    expect(css).not.toMatch(/(^|\s|;)\s*(top|bottom):/);
  });

  // Upstream-drift guard: this workaround is ONLY needed while @nuxt/ui's
  // default centered toaster variant still emits the double-shifting
  // `left-1/2 transform -translate-x-1/2`. If a @nuxt/ui upgrade changes or
  // fixes that, this test fails on purpose → re-evaluate / remove the CSS
  // workaround and the selector above. Globs dist (filename is hashed) so it
  // is resilient to bundler output naming.
  it('the @nuxt/ui defect this works around still exists upstream', () => {
    // @nuxt/ui blocks `./package.json` in its exports map, so resolve the
    // dist dir via the layer's own node_modules (pnpm symlink, followed by
    // readdirSync) instead of Node module resolution.
    const uiDist = fileURLToPath(
      new URL('../../../node_modules/@nuxt/ui/dist', import.meta.url),
    );
    const signature = 'left-1/2 transform -translate-x-1/2';
    const walk = (dir: string): boolean =>
      readdirSync(dir, { withFileTypes: true }).some((e) => {
        const p = join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        if (!e.name.endsWith('.mjs') && !e.name.endsWith('.js')) return false;
        return readFileSync(p, 'utf8').includes(signature);
      });
    expect(walk(uiDist)).toBe(true);
  });
});
