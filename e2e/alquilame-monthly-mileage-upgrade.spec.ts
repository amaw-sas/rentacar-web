import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Alquilame — la mensualidad incluye 1.000 km y ofrece otros 1.000 km como
 * servicio adicional. La tarifa mensual sale del catálogo; Localiza solo se
 * stubbea porque no decide la disponibilidad de una mensualidad.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

const MONTHLY_RESULT =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-08-10' +
  '/fecha-devolucion/2026-09-09' +
  '/hora-recogida/12:00pm' +
  '/hora-devolucion/12:00pm';

function stubMonthlyAvailability(page: Page) {
  return page.route('**/api/reservations/availability', async (route: Route) => {
    // Dejar que el catálogo hidrate antes de que el store construya las cards.
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

function cop(text: string): number {
  return Number(text.replace(/\D/g, ''));
}

test.describe('alquilame — ampliación mensual de kilometraje', () => {
  test.skip(BRAND !== 'alquilame', 'Escenario específico de alquilame');

  test('1.000 km por defecto → ampliar a 2.000 km → resumen reconciliado', async ({ page }) => {
    await stubMonthlyAvailability(page);
    await page.goto(MONTHLY_RESULT);

    const includedRows = page.getByTestId('monthly-mileage-included-test');
    await expect(includedRows.first()).toBeVisible({ timeout: 30_000 });

    const card = page.locator('.categoria').filter({ has: includedRows.first() }).first();
    const included = card.getByTestId('monthly-mileage-included-test');
    const upgradeLine = card.getByTestId('monthly-mileage-upgrade-line-test');
    const total = card.getByTestId('category-total-price-test');

    await expect(included).toContainText('1.000 kilómetros');
    await expect(included).toContainText('incluidos');
    await expect(upgradeLine).toHaveCount(0);
    const total1k = cop(await total.innerText());

    await card.getByRole('button', { name: 'Servicios adicionales' }).click();
    const upgrade = card.getByTestId('monthly-mileage-upgrade-test');
    await expect(upgrade).toBeVisible();
    await expect(upgrade).toHaveAttribute(
      'aria-label',
      '1.000 km adicionales (2.000 km en total)',
    );

    await upgrade.click();
    await expect(included).toContainText('1.000 kilómetros');
    await expect(upgradeLine).toContainText('+ 1.000 kilómetros adicionales');
    await expect(upgradeLine).toBeVisible();
    const total2k = cop(await total.innerText());
    const displayedUpgrade = cop(await upgradeLine.locator('.valor-tarifa').innerText());
    expect(total2k).toBeGreaterThan(total1k);
    expect(displayedUpgrade).toBe(total2k - total1k);

    // Desmarcar restaura exactamente el plan y el total base.
    await upgrade.click();
    await expect(included).toContainText('1.000 kilómetros');
    await expect(upgradeLine).toHaveCount(0);
    expect(cop(await total.innerText())).toBe(total1k);

    // La selección también llega al siguiente paso; no es estado cosmético.
    await upgrade.click();
    await card.getByRole('button', { name: 'Solicitar este vehículo' }).click();
    await expect(page.getByTestId('resume-monthly-mileage-included-test')).toContainText(
      '1.000 kilómetros',
    );
    await expect(page.getByTestId('resume-monthly-mileage-included-test')).toContainText(
      'incluidos',
    );
    await expect(page.getByTestId('resume-monthly-mileage-upgrade-line-test')).toContainText(
      displayedUpgrade.toLocaleString('es-CO'),
    );
  });
});
