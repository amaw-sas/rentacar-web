import { test, expect } from '@playwright/test';

/**
 * Validates the fix in packages/logic/src/stores/useStoreReservationForm.ts
 * (stripReservarParam) for the bug where pressing browser Back after a
 * reservation submission left the Searcher non-interactive.
 *
 * Root cause: CategorySelectionSection writes `?reservar=<code>` into the URL
 * via history.replaceState when the form slideover opens. On Back, that URL
 * is restored, the watch auto-reopens the form slideover, and reka-ui Dialog
 * modal (default true on u-slideover) applies pointer-events: none on body
 * even with `:overlay="false"`, leaving the underlying Searcher blocked.
 *
 * These tests exercise the OBSERVABLE MECHANISM both sides:
 *   1. URL with `?reservar=X` reproduces the lockout symptom (baseline).
 *   2. URL without `?reservar=X` (the state the fix guarantees before
 *      navigateTo) leaves the Searcher interactive.
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

  test('fix: URL without ?reservar=<code> leaves body interactive and Searcher select clickable', async ({ page }) => {
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
