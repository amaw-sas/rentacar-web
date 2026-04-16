import { test, expect } from '@playwright/test';

/**
 * Validates the fix in packages/logic/src/stores/useStoreReservationForm.ts
 * (stripReservarParam) for two back-button bugs after a reservation submit:
 *
 *   1. URL with `?reservar=<code>` auto-reopens the FORM slideover, and
 *      reka-ui Dialog modal lock blocks the Searcher even with :overlay="false".
 *   2. URL with `/categoria/<code>` (no query) auto-reopens the RESUME
 *      slideover; a second submit from there reuses stale selectedCategory
 *      state and the admin rejects it as sin_disponibilidad.
 *
 * Fix: strip BOTH pieces from the URL via history.replaceState before
 * navigateTo, so Back lands on the bare search URL.
 *
 * These tests exercise the OBSERVABLE MECHANISM both sides:
 *   - Baseline: URL with `?reservar=X` locks body pointer-events.
 *   - Baseline: URL with only `/categoria/X` auto-opens a dialog.
 *   - Fix mechanism: bare search URL leaves Searcher interactive, no dialog.
 *
 * They do not submit a real reservation against the admin backend.
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-05-10' +
  '/fecha-devolucion/2026-05-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

test.describe('Reservation Back URL cleanup — Searcher stays interactive', () => {
  test('baseline: URL with ?reservar=<code> locks body pointer-events via Dialog modal', async ({ page }) => {
    await page.goto(searchPath);
    await page.waitForLoadState('networkidle');

    // CategoryCards render as `Grupo X (...)` buttons. Extract a valid code
    // so the watch in CategorySelectionSection matches a real category.
    const code = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(
        (b) => b.textContent ?? '',
      );
      for (const text of buttons) {
        const m = text.match(/Grupo\s+([A-Z0-9]+)\s*\(/);
        if (m) return m[1];
      }
      return null;
    });

    test.skip(!code, 'No se detectaron categorías renderizadas (backend sin datos para la fecha de prueba)');

    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('networkidle');

    // Wait for the reservation form slideover to auto-open (resume first, form on top).
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Reka-ui Dialog with modal: true applies pointer-events: none on body.
    // This is the exact mechanism that blocks the Searcher selects on Back.
    const bodyPointerEvents = await page.evaluate(
      () => window.getComputedStyle(document.body).pointerEvents,
    );
    expect(bodyPointerEvents).toBe('none');
  });

  test('baseline: URL with /categoria/<code> (no query) auto-opens resume slideover', async ({ page }) => {
    await page.goto(searchPath);
    await page.waitForLoadState('networkidle');

    const code = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(
        (b) => b.textContent ?? '',
      );
      for (const text of buttons) {
        const m = text.match(/Grupo\s+([A-Z0-9]+)\s*\(/);
        if (m) return m[1];
      }
      return null;
    });

    test.skip(!code, 'No se detectaron categorías renderizadas');

    // Only /categoria/<code> — no ?reservar=. This is exactly the URL the old
    // fix left behind on Back, and the state that drove the second bug.
    await page.goto(`${searchPath}/categoria/${code}`);
    await page.waitForLoadState('networkidle');

    // At least one dialog (resume slideover) must auto-open.
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
  });

  test('fix: bare search URL (no /categoria/, no ?reservar=) leaves body interactive and Searcher clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(searchPath);
    await page.waitForLoadState('networkidle');

    // Body must not have pointer-events: none (no modal active).
    const bodyPointerEvents = await page.evaluate(
      () => window.getComputedStyle(document.body).pointerEvents,
    );
    expect(bodyPointerEvents).not.toBe('none');

    // The desktop pickup location u-select-menu must be interactive.
    const pickupSelect = page.locator('[data-testid="pickup-location-test"]').first();
    await expect(pickupSelect).toBeVisible();
    await pickupSelect.click();

    // Clicking it opens a reka-ui listbox.
    const listbox = page.locator('[role="listbox"]').first();
    await expect(listbox).toBeVisible({ timeout: 5_000 });
  });
});
