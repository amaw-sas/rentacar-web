import { test, expect, type Route, type Page } from '@playwright/test';

/**
 * Outdated-search notice. After a search, changing pickup date/hour in the
 * form WITHOUT pressing "BUSCAR VEHÍCULOS" used to show "¡Oops! Nos quedamos
 * sin carritos en <city> para el <new date>": the watcher in useSearch nulls
 * the stale availability and the empty-inventory block read that as "searched
 * and empty". Now an "Actualiza tu búsqueda" notice replaces it.
 *
 *   SCEN-1: results loaded → change pickup date → notice, no Oops, no cards
 *   SCEN-2: click BUSCAR → notice gone, cards visible
 *   SCEN-3: LLNRAG009 on load → Oops still visible (no regression)
 *   SCEN-4: after LLNRAG009, change date → notice, no Oops, no grid
 *   SCEN-5: change pickup hour instead of date → notice
 *   SCEN-6: change date while the search is still loading → notice after results land
 *   SCEN-7: change then revert the date → notice stays; BUSCAR → cards
 *
 * Desktop viewport only, buscar-vehiculos deep link: alquilatucarro (see
 * BUSCAR_VEHICULOS_FLOW_SPECS in playwright.config.ts). Like the tooltip spec,
 * a renderable category code is discovered from the live catalog and only the
 * availability POST is stubbed.
 */

const NOTICE = '[data-testid="search-outdated-notice"]';
const CITY_RESTRICTED = new Set(['CX', 'GY']);

const NO_AVAILABILITY_BODY = {
  error: 'no_available_categories_error',
  message: 'Lo sentimos, No se encontraron vehículos disponibles',
  shortText: 'LLNRAG009',
};

// Same helper as clic-foto-abre-reserva.spec.ts: dates relative to today so the
// spec never goes stale.
const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const PICKUP_DATE = futureDate(20);
const RETURN_DATE = futureDate(23);

const BOGOTA_URL =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  `/fecha-recogida/${PICKUP_DATE}` +
  `/fecha-devolucion/${RETURN_DATE}` +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

function successStub(categoryCode: string, delayMs = 0) {
  const payload = [
    {
      categoryCode,
      estimatedTotalAmount: 250000,
      totalAmount: 250000,
      numberDays: 3,
      referenceToken: 'tok',
      rateQualifier: 'rq',
      returnFeeAmount: 0,
      vehicleDayCharge: 80000,
      taxFeeAmount: 0,
      taxFeePercentage: 0,
      IVAFeeAmount: 0,
      coverageUnitCharge: 0,
      coverageQuantity: 0,
      coverageTotalAmount: 0,
    },
  ];
  return async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route
      .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
      .catch(() => {});
  };
}

const llnrag009Stub = (route: Route) =>
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify(NO_AVAILABILITY_BODY),
  });

async function discoverRenderableCode(page: Page): Promise<string | null> {
  const res = await page.request.get('/api/rentacar-data');
  if (!res.ok()) return null;
  const data = await res.json();
  const vehicleCategories: Record<string, unknown> = data.vehicleCategories ?? {};
  const categories: Array<{ id?: string }> = data.categories ?? [];
  return (
    categories.find((c) => c?.id && !CITY_RESTRICTED.has(c.id) && vehicleCategories[c.id])?.id ??
    null
  );
}

// Real form UI: open the pickup calendar and pick a day other than the current one.
async function changePickupDate(page: Page) {
  await page.locator('button[aria-label="Seleccione una día de recogida"]').first().click();
  await page
    .locator(
      '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-unavailable]):not([data-outside-view]):not([data-selected])',
    )
    .last()
    .click();
}

// Pick the day that was selected before (same URL date) back again.
async function revertPickupDate(page: Page, isoDay: string) {
  await page.locator('button[aria-label="Seleccione una día de recogida"]').first().click();
  await page.locator(`[data-reka-calendar-cell-trigger][data-value="${isoDay}"]`).click();
}

async function changePickupHour(page: Page) {
  await page.getByTestId('pickup-hour-desktop-test').first().click();
  await page.getByRole('option').filter({ hasNotText: '08:00' }).first().click();
}

// "BUSCAR VEHÍCULOS" is a NuxtLink (<a>), not a <button>.
const buscar = (page: Page) => page.getByRole('link', { name: /BUSCAR VEH/i }).first();
const oops = (page: Page) => page.getByText(/Nos quedamos sin carritos/);
const cards = (page: Page) => page.locator('[data-testid="vehicle-result-card-slot"]');

test.describe('Outdated search notice', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  let code: string;

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop form controls');
    const found = await discoverRenderableCode(page);
    test.skip(!found, 'No renderable category in the live catalog (Supabase unreachable?)');
    code = found as string;
  });

  test('SCEN-1: changing pickup date after results shows the notice, not Oops, no cards', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(BOGOTA_URL);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);

    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(oops(page)).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);
  });

  test('SCEN-2: clicking BUSCAR clears the notice and shows cars', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(BOGOTA_URL);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);
    await expect(page.locator(NOTICE)).toBeVisible();

    await buscar(page).click();

    await expect(page.locator(NOTICE)).toHaveCount(0);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(oops(page)).toHaveCount(0);
  });

  test('SCEN-3: LLNRAG009 on load still shows Oops (no regression)', async ({ page }) => {
    await page.route('**/api/reservations/availability', llnrag009Stub);
    await page.goto(BOGOTA_URL);

    await expect(oops(page)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(NOTICE)).toHaveCount(0);
  });

  test('SCEN-4: after LLNRAG009, changing the date swaps Oops for the notice, no grid', async ({ page }) => {
    await page.route('**/api/reservations/availability', llnrag009Stub);
    await page.goto(BOGOTA_URL);
    await expect(oops(page)).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);

    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(oops(page)).toHaveCount(0);
    await expect(page.locator('.categoria-no-disponible')).toHaveCount(0);
    await expect(page.locator('[data-testid="vehicle-results-list"]')).toHaveCount(0);
  });

  test('SCEN-5: changing the pickup hour shows the notice', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(BOGOTA_URL);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });

    await changePickupHour(page);

    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(oops(page)).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);
  });

  test('SCEN-6: a date change while loading shows the notice once the stale results arrive', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code, 3_000));
    await page.goto(BOGOTA_URL);
    // Loading placeholders are up; change the date before the response lands.
    await expect(page.locator('[data-testid="vehicle-result-placeholder"]').first()).toBeVisible({ timeout: 30_000 });
    await changePickupDate(page);

    await expect(page.locator(NOTICE)).toBeVisible({ timeout: 15_000 });
    await expect(cards(page)).toHaveCount(0);
    await expect(oops(page)).toHaveCount(0);
  });

  test('SCEN-7: change then revert keeps the notice until BUSCAR', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(BOGOTA_URL);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);
    await expect(page.locator(NOTICE)).toBeVisible();
    await revertPickupDate(page, PICKUP_DATE);
    // Give the 50ms debounce room to (wrongly) clear it.
    await page.waitForTimeout(500);
    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    await buscar(page).click();
    await expect(page.locator(NOTICE)).toHaveCount(0);
    await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });
  });
});
