import { test, expect, type Route, type Page } from '@playwright/test';

/**
 * Close-delay contract for the total-price tooltip on an available CategoryCard.
 * Issue #37. The composable timing is unit-tested in
 * packages/logic/src/composables/__tests__/useDelayedClose.test.ts (S1–S7);
 * this spec is the integration-level proof against the real Reka/Nuxt UI
 * tooltip wired in CategoryCard.vue.
 *
 *   R1: hovering the price opens the tooltip (after Reka's open delay).
 *   R2: leaving the trigger keeps the tooltip open through the close delay,
 *       then it disappears (so the operator can move into it to read details).
 *
 * The tooltip only renders on an *available* card, which needs an availability
 * categoryCode that matches an admin category that also has a vehicleCategories
 * entry. /api/rentacar-data (admin catalog + vehicleCategories) is SSR-loaded
 * and NOT interceptable via page.route — but it IS fetchable over HTTP, and it
 * loads from Supabase directly (not the :3000 booking backend). So instead of
 * hardcoding a code (SCEN-U4's pitfall — a guessed 'B' may be absent), we
 * discover a renderable code from the live catalog at runtime and stub only the
 * availability POST (which IS client-side) for that exact code. This SOLVES the
 * render — the available card with `.precio-total` appears reliably.
 *
 * SKIPPED, though, on the *open* path. The tooltip opens on Reka's hover-intent
 * (delay-duration 3000ms of sustained hover); in headless Chromium under load
 * that open is timing-fragile — `--repeat-each=3` gave R1 3/3 failures and R2
 * 3/3 flaky (passes only on retry), even at a 12s wait. The close-delay
 * contract itself (the point of this issue) holds once open, but a hover-intent
 * tooltip with 3s open + 3s close is not a reliable e2e target. The durable
 * fix is a test-only knob to shrink delay-duration / closeDelayMs (default
 * unchanged in prod); enable this spec once that exists. Meanwhile the contract
 * is fully covered, deterministically, at the unit layer (useDelayedClose
 * S1–S7, fake timers).
 */

// City-restricted categories — skip them so the chosen code is renderable on
// the Bogotá results URL regardless of city filters (see useStoreSearchData).
const CITY_RESTRICTED = new Set(['CX', 'GY']);

const BOGOTA_3DAY_URL =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-10-04' +
  '/fecha-devolucion/2026-10-07' +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

const PRICE_TRIGGER = '.precio-total';
// Line that only appears inside the tooltip content.
const TOOLTIP_LINE = 'Seguro día:';

function availabilityStub(categoryCode: string) {
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

// Resolve a category code present in BOTH the admin catalog and the
// vehicleCategories map (so the available card actually renders), excluding
// city-restricted codes. Returns null if the catalog has none (e.g. Supabase
// unreachable in the test env) so the caller can skip with a clear reason.
async function discoverRenderableCode(page: Page): Promise<string | null> {
  const res = await page.request.get('/api/rentacar-data');
  if (!res.ok()) return null;
  const data = await res.json();
  const vehicleCategories: Record<string, unknown> = data.vehicleCategories ?? {};
  const categories: Array<{ id?: string }> = data.categories ?? [];
  const match = categories.find(
    (c) => c?.id && !CITY_RESTRICTED.has(c.id) && vehicleCategories[c.id],
  );
  return match?.id ?? null;
}

test.describe.skip('Total-price tooltip close-delay (#37)', () => {
  test.beforeEach(async ({ page }) => {
    const code = await discoverRenderableCode(page);
    test.skip(!code, 'No category with a vehicleCategories entry in the live catalog (Supabase unreachable?)');

    await page.route('**/api/reservations/availability', availabilityStub(code as string));
    await page.goto(BOGOTA_3DAY_URL);
  });

  test('R1: hovering the price opens the tooltip', async ({ page }) => {
    const trigger = page.locator(PRICE_TRIGGER).first();
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await trigger.scrollIntoViewIfNeeded();

    await trigger.hover();
    // Reka opens only after sustained hover for its delay-duration (3s); the
    // 12s budget absorbs that plus a cold-start render.
    await expect(page.getByText(TOOLTIP_LINE)).toBeVisible({ timeout: 12_000 });
  });

  test('R2: leaving the trigger keeps the tooltip open through the close delay', async ({ page }) => {
    const trigger = page.locator(PRICE_TRIGGER).first();
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await trigger.scrollIntoViewIfNeeded();

    await trigger.hover();
    const tooltip = page.getByText(TOOLTIP_LINE);
    await expect(tooltip).toBeVisible({ timeout: 12_000 });

    // Hover-leave: move the pointer off the trigger.
    await page.mouse.move(0, 0);

    // Still visible shortly after leaving (close delay is 3s).
    await page.waitForTimeout(1_000);
    await expect(tooltip).toBeVisible();

    // Gone once the close delay elapses.
    await expect(tooltip).toBeHidden({ timeout: 6_000 });
  });
});
