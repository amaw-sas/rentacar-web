import { test, expect } from '@playwright/test';

// Bug: the mobile pickup/return date fields are native <input type="date">, which
// expose a browser "clear" affordance (Android picker / desktop ✕). Clearing left
// the field blank. Requirement: the date must never become empty — clearing is
// disallowed and the last valid value is repainted.
//
// Builds on #174 (mobile inputs bind :value one-way + @change parses the clamped
// value into a DateObject so the shared desktop picker never receives a raw
// string). This spec covers the additional guard: the @change clamp repaints the
// last valid value when the field comes back empty.
//
// alquilame moved the Searcher to /reservas (issue #112); other brands keep it in
// the city hero. The mobile inputs are identical at both.
const SEARCHER_HERO = process.env.BRAND === 'alquilame' ? '/reservas' : '/armenia';

// Reproduces the native clear: empty the value and emit input+change, exactly as
// the browser's built-in clear button does. The guard lives in @change.
const attemptNativeClear = async (locator: import('@playwright/test').Locator) => {
  await locator.evaluate((el: HTMLInputElement) => {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

test.describe('Searcher móvil — no permitir borrar la fecha', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('SCEN-1: borrar el día de recogida restaura el valor previo', async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const pickup = page.locator('input#pickup-date-mobile[type="date"]').last();
    await expect(pickup).toBeVisible();

    // SCEN-3 (pre-requisito): una selección normal de fecha persiste.
    const validDate = await page.evaluate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    });
    await pickup.fill(validDate);
    await pickup.dispatchEvent('change');
    await expect(pickup).toHaveValue(validDate);

    // SCEN-1: intentar borrar → el campo NO queda vacío, se restaura.
    await attemptNativeClear(pickup);
    await expect(pickup).not.toHaveValue('');
    await expect(pickup).toHaveValue(validDate);
  });

  test('SCEN-2: borrar el día de devolución restaura el valor previo', async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const pickup = page.locator('input#pickup-date-mobile[type="date"]').last();
    const ret = page.locator('input#return-date-mobile[type="date"]').last();
    await expect(ret).toBeVisible();

    // Fijar recogida primero para que devolución tenga un rango válido.
    const pickupDate = await page.evaluate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    });
    await pickup.fill(pickupDate);
    await pickup.dispatchEvent('change');

    const returnDate = await page.evaluate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().slice(0, 10);
    });
    await ret.fill(returnDate);
    await ret.dispatchEvent('change');
    await expect(ret).toHaveValue(returnDate);

    // SCEN-2: intentar borrar devolución → se restaura.
    await attemptNativeClear(ret);
    await expect(ret).not.toHaveValue('');
    await expect(ret).toHaveValue(returnDate);
  });
});
