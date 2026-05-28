import { test, expect, type Route } from '@playwright/test';

/**
 * Close-delay contract for the total-price tooltip on an available CategoryCard.
 * Issue #37. The composable contract (open/close timing) is unit-tested in
 * packages/logic/src/composables/__tests__/useDelayedClose.test.ts (S1–S7);
 * this spec is the integration-level proof against the real Reka/Nuxt UI
 * tooltip wired in CategoryCard.vue.
 *
 *   R1: hovering the price opens the tooltip (after Reka's open delay).
 *   R2: leaving the trigger keeps the tooltip open for the close delay, then
 *       it disappears (the operator can move into it to read price details).
 *
 * SKIPPED — same blocker as SCEN-U4 in unable-cards-on-empty-inventory.spec.ts.
 * The price tooltip only exists on an *available* CategoryCard, which requires
 * the availability categoryCode to match an admin category that also has a
 * vehicleCategories entry. Admin data + vehicleCategories come from
 * /api/rentacar-data, which is SSR-loaded and NOT interceptable via
 * page.route — so stubbing only the availability response leaves the page in
 * the all-unable branch and `.precio-total` never renders (verified: this spec
 * fails with "`.precio-total` not found" against a dev server). Un-skip once a
 * server-side rentacar-data fixture exists. The close-delay contract is fully
 * covered meanwhile at the unit layer (useDelayedClose.test.ts S1–S7).
 */

const B_AVAILABILITY = [
  {
    categoryCode: 'B',
    estimatedTotalAmount: 250000,
    totalAmount: 250000,
    numberDays: 3,
    referenceToken: 'tok-b',
    rateQualifier: 'rq-b',
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

function stubAvailabilityArray(payload: unknown) {
  return (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
}

const BOGOTA_3DAY_URL =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-10-04' +
  '/fecha-devolucion/2026-10-07' +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

const PRICE_TRIGGER = '.precio-total';
// Distinctive line that only exists inside the tooltip content.
const TOOLTIP_LINE = 'Seguro día:';

test.describe.skip('Total-price tooltip close-delay (#37)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/reservations/availability', stubAvailabilityArray(B_AVAILABILITY));
    await page.goto(BOGOTA_3DAY_URL);
  });

  test('R1: hovering the price opens the tooltip', async ({ page }) => {
    const trigger = page.locator(PRICE_TRIGGER).first();
    await expect(trigger).toBeVisible({ timeout: 30_000 });

    await trigger.hover();
    // Reka opens after its delay-duration (3s); allow margin.
    await expect(page.getByText(TOOLTIP_LINE)).toBeVisible({ timeout: 8_000 });
  });

  test('R2: leaving the trigger keeps the tooltip open through the close delay', async ({ page }) => {
    const trigger = page.locator(PRICE_TRIGGER).first();
    await expect(trigger).toBeVisible({ timeout: 30_000 });

    await trigger.hover();
    const tooltip = page.getByText(TOOLTIP_LINE);
    await expect(tooltip).toBeVisible({ timeout: 8_000 });

    // Move the pointer off the trigger (hover-leave).
    await page.locator('h1, header').first().hover();

    // Still visible shortly after leaving (close delay is 3s).
    await page.waitForTimeout(1_000);
    await expect(tooltip).toBeVisible();

    // Gone once the close delay elapses.
    await expect(tooltip).toBeHidden({ timeout: 6_000 });
  });
});
