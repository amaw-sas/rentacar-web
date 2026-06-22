import { test, expect, type Route } from '@playwright/test';

/**
 * Issue #129 — the search flow resolved the pickup branch from the URL slug
 * without checking it belongs to the page's city, so `/barranquilla/.../
 * lugar-recogida/monteria-aeropuerto/...` rendered Barranquilla but searched
 * Montería's inventory. Holdout scenarios:
 *   docs/specs/issue-129-city-branch-validation/scenarios/
 *
 * Coverage in this file:
 *   SCEN-001: foreign pickup        → 301-style redirect to the city's branch
 *   SCEN-002: legitimate one-way    → NO redirect (return in another city kept)
 *   SCEN-003: already-consistent    → NO redirect
 *   SCEN-004: identical-URL re-click → a fresh availability POST is fired
 *
 * (SCEN-006 — city without a resolvable branch → null, no crash/loop — is covered
 *  by the helper unit test, not here, since it can't be observed via a browser URL.)
 *
 * Branch slugs used (`bogota-aeropuerto`, `monteria-aeropuerto`) are canonical
 * production data, vouched by e2e/availability-error-feedback.spec.ts. The brand
 * under test is selected by BRAND (see playwright.config.ts); a dev server for
 * that brand must already be running.
 *
 * `monteria` and `bogota` are distinct cities → `monteria-aeropuerto` under a
 * `/bogota/...` page is the foreign-pickup case #129 must correct.
 */

const DATES = '/fecha-recogida/2026-10-04/fecha-devolucion/2026-11-03/hora-recogida/08:00am/hora-devolucion/08:00am';

// Foreign pickup: Bogotá page, Montería pickup + return (the corrupt URL).
const FOREIGN_PICKUP_URL =
  '/bogota/buscar-vehiculos/lugar-recogida/monteria-aeropuerto/lugar-devolucion/monteria-aeropuerto' + DATES;

// Legitimate one-way: Bogotá pickup, Montería return (valid traslado).
const ONE_WAY_URL =
  '/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/monteria-aeropuerto' + DATES;

// Already consistent: both ends in Bogotá.
const CONSISTENT_URL =
  '/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto' + DATES;

const NO_AVAILABILITY_BODY = {
  error: 'no_available_categories_error',
  message: 'Lo sentimos, No se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
};

function stubAvailability(onCall?: () => void) {
  return (route: Route) => {
    onCall?.();
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(NO_AVAILABILITY_BODY),
    });
  };
}

test.describe('Issue #129 — city↔branch validation', () => {
  // SCEN-001: the foreign pickup is corrected to the page city's branch.
  test('SCEN-001: foreign pickup redirects to the city branch', async ({ page }) => {
    await page.route('**/api/reservations/availability', stubAvailability());
    await page.goto(FOREIGN_PICKUP_URL);
    // The corrected URL no longer carries the foreign Montería pickup…
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('lugar-recogida/monteria-aeropuerto');
    // …and the pickup segment now resolves to a Bogotá branch.
    expect(page.url()).toContain('/bogota/buscar-vehiculos');
    expect(page.url()).toContain('lugar-recogida/bogota-aeropuerto');
  });

  // SCEN-002: a legitimate one-way (return elsewhere) is NEVER touched.
  test('SCEN-002: legitimate one-way is not redirected', async ({ page }) => {
    await page.route('**/api/reservations/availability', stubAvailability());
    await page.goto(ONE_WAY_URL);
    // Settle, then assert the URL kept both the in-city pickup and the foreign return.
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('lugar-recogida/bogota-aeropuerto');
    expect(page.url()).toContain('lugar-devolucion/monteria-aeropuerto');
  });

  // SCEN-003: an already-consistent URL is left as-is.
  test('SCEN-003: consistent URL is not redirected', async ({ page }) => {
    await page.route('**/api/reservations/availability', stubAvailability());
    await page.goto(CONSISTENT_URL);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('lugar-recogida/bogota-aeropuerto');
    expect(page.url()).toContain('lugar-devolucion/bogota-aeropuerto');
  });

  // SCEN-004: clicking BUSCAR with unchanged params re-fires the search even
  // though the NuxtLink target equals the current URL (no navigation).
  test('SCEN-004: search button re-fires on identical URL', async ({ page }) => {
    let availabilityCalls = 0;
    await page.route('**/api/reservations/availability', stubAvailability(() => { availabilityCalls += 1; }));

    await page.goto(CONSISTENT_URL);
    await page.waitForLoadState('networkidle');
    const callsAfterLoad = availabilityCalls;

    // The button re-enables once the error state clears the loaded-results lock.
    const buscar = page.getByRole('link', { name: /BUSCAR VEHÍCULOS/i }).first();
    await buscar.click();

    await expect.poll(() => availabilityCalls, { timeout: 15_000 }).toBeGreaterThan(callsAfterLoad);
  });
});
