import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/copiar-cotizacion/scenarios/copiar-cotizacion.scenarios.md
 *   SCEN-001 (copia básica), SCEN-002 (visitante sin botón), SCEN-004 (agotadas
 *   fuera), SCEN-006 (Seguro Total).
 *
 * Solo alquilame. Disponibilidad simulada en el cliente (misma convención que
 * reservation-a11y-single-dialog.spec.ts): 'C' y 'CX' con precio, 'F' agotada
 * (999999999). Los códigos deben existir en vehicleCategories (Supabase vía SSR)
 * o renderableCategories los descarta.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const SEARCH_PATH =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  `/fecha-recogida/${futureDate(20)}` +
  `/fecha-devolucion/${futureDate(22)}` +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

const PRICED = ['C', 'CX'];
const SOLD_OUT = 'F';

const row = (code: string, amount: number) => ({
  categoryCode: code,
  categoryDescription: `Gama ${code} Mecánico`,
  categoryModels: [],
  categoryMonthPrices: [],
  totalAmount: amount,
  estimatedTotalAmount: amount,
  vehicleDayCharge: Math.round(amount / 2),
  numberDays: 2,
  taxFeeAmount: 0,
  taxFeePercentage: 0,
  IVAFeeAmount: Math.round(amount * 0.19),
  coverageUnitCharge: 30000,
  coverageQuantity: 0,
  coverageTotalAmount: 0,
  totalCoverageUnitCharge: 30000,
  referenceToken: `STUB-${code}`,
  rateQualifier: 'STUB',
});

const AVAILABILITY = [row('C', 500000), row('CX', 420000), row(SOLD_OUT, 999999999)];

async function stubClipboardAndAvailability(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __copied: string[] }).__copied = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (t: string) => {
          (window as unknown as { __copied: string[] }).__copied.push(t);
        },
      },
    });
  });
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY),
    }),
  );
}

const lastCopied = (page: Page) =>
  page.evaluate(() => {
    const list = (window as unknown as { __copied: string[] }).__copied;
    return list[list.length - 1] ?? '';
  });

test.describe('Copiar cotización — alquilame', () => {
  test.skip(BRAND !== 'alquilame', 'Escenarios específicos de alquilame');

  test('SCEN-001/004: con ?asesor=1 copia las gamas con precio y deja fuera la agotada', async ({ page }) => {
    await stubClipboardAndAvailability(page);
    await page.goto(`${SEARCH_PATH}?asesor=1`);

    const button = page.getByTestId('copy-quote-button');
    await expect(button).toBeVisible({ timeout: 30_000 });
    await button.click();
    await expect(button).toContainText('Copiada');

    const text = await lastCopied(page);
    expect(text).toContain('*Recoges:*');
    for (const code of PRICED) expect(text).toContain(`${code}    `);
    expect(text).not.toContain(`${SOLD_OUT}    `);
    expect(text).toContain('Esta cotización estará disponible durante 20 minutos');
    expect(text).toContain('seguro básico');
  });

  test('SCEN-006: con «Con Seguro Total» marcado el pie dice Seguro Total', async ({ page }) => {
    await stubClipboardAndAvailability(page);
    await page.goto(`${SEARCH_PATH}?asesor=1`);

    await expect(page.getByTestId('copy-quote-panel')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('checkbox', { name: 'Con Seguro Total' }).check();
    await page.getByTestId('copy-quote-button').click();

    const text = await lastCopied(page);
    expect(text).toContain('Seguro Total');
    expect(text).not.toContain('seguro básico');
  });

  test('SCEN-002: sin ?asesor el panel no existe en el DOM', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await stubClipboardAndAvailability(page);
    await page.goto(SEARCH_PATH);

    // Espera a que los resultados pinten antes de afirmar la ausencia.
    await expect(page.getByText('¡Vehículos Disponibles!')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="copy-quote-panel"]')).toHaveCount(0);
    await context.close();
  });
});
