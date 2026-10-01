import { test, expect, type Route, type Page } from '@playwright/test';

/**
 * alquilame counterpart of search-outdated-notice.spec.ts. alquilame has no
 * /{city}/buscar-vehiculos route: results live on /reservas/lugar-recogida/...
 * (PATH params). Only runs with BRAND=alquilame (see ALQUILAME_ONLY_SPECS in
 * playwright.config.ts).
 *
 *   SCEN-1: results loaded → change pickup date → notice, no Oops, no results
 *   SCEN-2: click BUSCAR → notice gone, results visible
 *   SCEN-4: after LLNRAG009, change date → notice, no Oops
 *   SCEN-8: cold /reservas?query load, same-day off-grid hour → results, no notice
 */

const NOTICE = '[data-testid="search-outdated-notice"]';
const CITY_RESTRICTED = new Set(['CX', 'GY']);

// Same helper as clic-foto-abre-reserva.spec.ts: dates relative to today so the
// spec never goes stale.
const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const PICKUP_DATE = futureDate(20);
const RETURN_DATE = futureDate(23);

const URL_ =
  '/reservas/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  `/fecha-recogida/${PICKUP_DATE}` +
  `/fecha-devolucion/${RETURN_DATE}` +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

function successStub(categoryCode: string) {
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
  return (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
}

const llnrag009Stub = (route: Route) =>
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      error: 'no_available_categories_error',
      message: 'Lo sentimos, No se encontraron vehículos disponibles',
      shortText: 'LLNRAG009',
    }),
  });

async function discoverRenderableCode(page: Page): Promise<string | null> {
  const res = await page.request.get('/api/rentacar-data');
  if (!res.ok()) return null;
  const data = await res.json();
  const vc: Record<string, unknown> = data.vehicleCategories ?? {};
  const cats: Array<{ id?: string }> = data.categories ?? [];
  return cats.find((c) => c?.id && !CITY_RESTRICTED.has(c.id) && vc[c.id])?.id ?? null;
}

async function changePickupDate(page: Page) {
  await page.locator('button[aria-label="Seleccione una día de recogida"]').first().click();
  await page
    .locator(
      '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-unavailable]):not([data-outside-view]):not([data-selected])',
    )
    .last()
    .click();
}

const oops = (page: Page) => page.getByText(/Nos quedamos sin carritos/);
const available = (page: Page) => page.getByText('¡Vehículos Disponibles!');
const buscar = (page: Page) => page.getByRole('link', { name: /BUSCAR VEH/i }).first();

test.describe('alquilame outdated search notice', () => {
  test.use({ viewport: { width: 1280, height: 900 }, timezoneId: 'America/Bogota' });

  let code: string;

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop form controls');
    const found = await discoverRenderableCode(page);
    test.skip(!found, 'No renderable category in the live catalog (Supabase unreachable?)');
    code = found as string;
  });

  test('SCEN-1: changing the date after results shows the notice, not Oops, no results', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(URL_);
    await expect(available(page)).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);

    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(oops(page)).toHaveCount(0);
    await expect(available(page)).toHaveCount(0);
  });

  test('SCEN-2: clicking BUSCAR clears the notice and shows results', async ({ page }) => {
    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(URL_);
    await expect(available(page)).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);
    await expect(page.locator(NOTICE)).toBeVisible();

    await buscar(page).click();

    await expect(page.locator(NOTICE)).toHaveCount(0);
    await expect(available(page)).toBeVisible({ timeout: 30_000 });
    await expect(oops(page)).toHaveCount(0);
  });

  test('SCEN-4: after LLNRAG009, changing the date swaps Oops for the notice', async ({ page }) => {
    await page.route('**/api/reservations/availability', llnrag009Stub);
    await page.goto(URL_);
    await expect(oops(page)).toBeVisible({ timeout: 30_000 });

    await changePickupDate(page);

    await expect(page.locator(NOTICE)).toBeVisible();
    await expect(oops(page)).toHaveCount(0);
    await expect(page.locator('.categoria-no-disponible')).toHaveCount(0);
  });

  test('SCEN-8: cold /reservas?query load with a same-day off-grid hour shows results, not the notice', async ({ page }) => {
    // The app runs on America/Bogota: the browser timezone is pinned above and
    // the link's dates/hour are computed for that zone, whatever the runner's is.
    const bogota = (d: Date) => {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
          .formatToParts(d)
          .map((x) => [x.type, x.value]),
      );
      return { date: `${p.year}-${p.month}-${p.day}`, hour: `${p.hour}:${p.minute}` };
    };
    const now = new Date();
    const here = bogota(now);
    test.skip(Number(here.hour.slice(0, 2)) >= 22, 'too close to midnight for a same-day pickup');
    // Pickup = today, now + 30 min (not a bookable slot, so useSearch clamps it).
    const pickup = bogota(new Date(now.getTime() + 30 * 60_000));
    const returnDay = bogota(new Date(now.getTime() + 2 * 86_400_000)).date;

    await page.route('**/api/reservations/availability', successStub(code));
    await page.goto(
      `/reservas?lugar_recogida=bogota-aeropuerto&fecha_recogida=${here.date}&fecha_devolucion=${returnDay}` +
        `&hora_recogida=${pickup.hour}&hora_devolucion=${pickup.hour}`,
    );

    await expect(available(page)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500); // past the 50 ms debounced watcher
    await expect(page.locator(NOTICE)).toHaveCount(0);
    await expect(available(page)).toBeVisible();
  });
});
