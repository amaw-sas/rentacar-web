import { test, expect, type Page } from '@playwright/test';

// F3 (issue #112): alquilame's Searcher moved off the city landing into /reservas
// (landing now shows a 'Reservar' CTA). Other brands keep it in the city hero.
// The Searcher widget + calendar behaviour are identical at both heroes.
const SEARCHER_HERO = process.env.BRAND === 'alquilame' ? '/reservas' : '/armenia';

// Holdout: docs/specs/2026-05-06-searcher-calendar-autoclose/scenarios/
//          searcher-calendar-autoclose.scenarios.md
// Spec:    docs/specs/2026-05-06-searcher-calendar-autoclose-design.md
// Selectors: docs/specs/2026-05-06-searcher-calendar-autoclose/implementation/
//            selectors.md (Step 0 spike)
//
// Two <Searcher /> instances render in CityPage.vue (lines 79 + 91): one for
// desktop (hidden sm:block), one for mobile (sm:hidden). Tests use .first()
// at desktop viewport and .last() at mobile viewport — same convention as
// e2e/searcher-mobile-label-click.spec.ts.

const PICKUP_TRIGGER = 'button[aria-label="Seleccione una día de recogida"]';
const RETURN_TRIGGER = 'button[aria-label="Seleccione una día de devolución"]';
const AVAILABLE_DAY =
  '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-unavailable]):not([data-outside-view]):not([data-selected])';

// `#pickup-date` and `#return-date` are hidden <input> elements that mirror
// the date in ISO format ("YYYY-MM-DD") via v-model. Read their `value`
// attribute directly — locale-independent and always parseable.
async function readDateISO(page: Page, inputId: string): Promise<string> {
  const value = await page.locator(`#${inputId}`).first().getAttribute('value');
  return value || '';
}

test.describe('Searcher calendar autoclose - desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');
  });

  test('SCEN-001: cierra popover de recogida tras seleccionar día', async ({ page }) => {
    const trigger = page.locator(PICKUP_TRIGGER).first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);

    await page.locator(AVAILABLE_DAY).first().click();

    // Post-fix expectations: popover closes after day selection
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test('SCEN-002: cierra popover de devolución tras seleccionar día', async ({ page }) => {
    const trigger = page.locator(RETURN_TRIGGER).first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);

    await page.locator(AVAILABLE_DAY).first().click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test('SCEN-003: seleccionar recogida no abre popover de devolución', async ({ page }) => {
    const pickupTrigger = page.locator(PICKUP_TRIGGER).first();
    const returnTrigger = page.locator(RETURN_TRIGGER).first();

    await pickupTrigger.click();
    await expect(pickupTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(returnTrigger).toHaveAttribute('aria-expanded', 'false');

    await page.locator(AVAILABLE_DAY).first().click();

    // Pickup closes (SCEN-001), return stays closed (no chaining)
    await expect(pickupTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(returnTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test('SCEN-005: seleccionar recogida setea devolución +7 días sin abrir su popover', async ({ page }) => {
    const pickupTrigger = page.locator(PICKUP_TRIGGER).first();
    const returnTrigger = page.locator(RETURN_TRIGGER).first();

    await pickupTrigger.click();

    // Read target ISO from the cell we're about to click — locale-independent
    const targetCell = page.locator(AVAILABLE_DAY).first();
    const targetISO = await targetCell.getAttribute('data-value');
    expect(targetISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await targetCell.click();

    // Pickup popover closes; return popover stays closed (no auto-open)
    await expect(pickupTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(returnTrigger).toHaveAttribute('aria-expanded', 'false');

    // Compute expected return date from ISO components (timezone-safe)
    const [py, pm, pd] = targetISO!.split('-').map((n) => parseInt(n, 10));
    const pickupLocal = new Date(py, pm - 1, pd);
    const returnLocal = new Date(pickupLocal);
    returnLocal.setDate(pickupLocal.getDate() + 7);
    const expectedReturnISO =
      `${returnLocal.getFullYear()}-` +
      `${String(returnLocal.getMonth() + 1).padStart(2, '0')}-` +
      `${String(returnLocal.getDate()).padStart(2, '0')}`;

    expect(await readDateISO(page, 'pickup-date')).toBe(targetISO);
    expect(await readDateISO(page, 'return-date')).toBe(expectedReturnISO);
  });

  test('R1 sanity: popover permanece abierto al abrir sin seleccionar día', async ({ page }) => {
    const trigger = page.locator(PICKUP_TRIGGER).first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.waitForTimeout(1000);

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);
  });

  test('R2 sanity: navegar mes no cierra popover', async ({ page }) => {
    const trigger = page.locator(PICKUP_TRIGGER).first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const nextMonth = page.getByRole('button', { name: 'Mes siguiente' });
    await nextMonth.click();
    await nextMonth.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);
  });
});

test.describe('Searcher calendar autoclose - mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  // Updated for the unified widget (docs/specs/2026-06-22-searcher-unified-widget):
  // the native <input type="date"> mobile inputs were removed in favour of
  // full-screen u-slideover date pickers. The mobile surface is now a button
  // trigger (data-testid="*-date-mobile-trigger") that opens a [role=dialog]
  // calendar; the desktop date segments stay hidden at this viewport. The full
  // drawer behaviour is covered by e2e/searcher-unified-widget.spec.ts.
  test('SCEN-004: triggers de fecha móviles abren slideover, segmentos desktop ocultos', async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const mobilePickup = page.getByTestId('pickup-date-mobile-trigger').last();
    const mobileReturn = page.getByTestId('return-date-mobile-trigger').last();

    await expect(mobilePickup).toBeVisible();
    await expect(mobileReturn).toBeVisible();

    // No native date input exists anywhere on the mobile searcher view.
    await expect(page.locator('input[type="date"]')).toHaveCount(0);

    // Tapping the pickup trigger opens a bottom-sheet calendar dialog.
    await mobilePickup.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-side', 'bottom');
    await expect(dialog.getByRole('grid')).toHaveCount(1);

    // Desktop variant is hidden via `hidden sm:block` parent at this viewport.
    const desktopPickup = page.locator('#pickup-date').first();
    await expect(desktopPickup).toBeHidden();
  });
});
