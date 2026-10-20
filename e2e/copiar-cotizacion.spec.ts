import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/cotizacion-por-asesor/scenarios/cotizacion-por-asesor.scenarios.md
 *   SCEN-001 (activar con código), SCEN-002 (código inexistente), SCEN-007 (el
 *   visitante no consulta /api/asesor), SCEN-008 (texto Alquilame). Del #519 siguen
 *   las agotadas fuera y la casilla Seguro Total.
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
  await page.route('**/api/asesor/**', (route) => {
    const code = decodeURIComponent(route.request().url().split('/api/asesor/')[1] ?? '');
    return code === 'daniela'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'daniela', name: 'Daniela' }) })
      : route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
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

test.describe('Copiar cotización por asesor — alquilame', () => {
  test.skip(BRAND !== 'alquilame', 'Escenarios específicos de alquilame');

  test('SCEN-001/008: ?asesor=daniela activa el panel con su nombre y copia el texto Alquilame', async ({ page }) => {
    await stubClipboardAndAvailability(page);
    await page.goto(`${SEARCH_PATH}?asesor=daniela&utm_source=x`);

    await expect(page.getByTestId('copy-quote-advisor')).toHaveText('Asesor: Daniela', { timeout: 30_000 });
    await expect(page).toHaveURL(/utm_source=x/);
    expect(page.url()).not.toContain('asesor=');

    const button = page.getByTestId('copy-quote-button');
    await button.click();
    await expect(button).toContainText('Copiada');

    const text = await lastCopied(page);
    expect(text.startsWith('¡Hola! Esta es tu cotización en Alquilame 🚗')).toBe(true);
    // Una línea por gama con precio (el nombre sale del catálogo, sin código); la agotada no.
    const gamaLines = text.split('\n').filter((l) => l.startsWith('🚙 '));
    expect(gamaLines).toHaveLength(PRICED.length);
    for (const line of gamaLines) expect(line).toMatch(/^🚙 .+ — \*\$[\d.]+ COP\*$/);
    expect(text).toContain('*$500.000 COP*');
    expect(text).toContain('*$420.000 COP*');
    expect(text).toContain('con seguro básico');
    expect(text).toContain('⚠️ Este precio se mantiene 20 minutos.');
    expect(text).not.toMatch(/deducible|http/);

    await page.reload();
    await expect(page.getByTestId('copy-quote-advisor')).toHaveText('Asesor: Daniela', { timeout: 30_000 });
  });

  test('«Con Seguro Total» marcado: la cotización dice con Seguro Total', async ({ page }) => {
    await stubClipboardAndAvailability(page);
    await page.goto(`${SEARCH_PATH}?asesor=daniela`);

    await expect(page.getByTestId('copy-quote-panel')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('checkbox', { name: 'Con Seguro Total' }).check();
    await page.getByTestId('copy-quote-button').click();

    const text = await lastCopied(page);
    expect(text).toContain('con Seguro Total');
    expect(text).not.toContain('seguro básico');
  });

  test('SCEN-002: un código inexistente avisa y no activa el panel', async ({ page }) => {
    await stubClipboardAndAvailability(page);
    await page.goto(`${SEARCH_PATH}?asesor=danela`);

    await expect(page.getByText('Código de asesor no encontrado').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('¡Vehículos Disponibles!')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="copy-quote-panel"]')).toHaveCount(0);
    expect(page.url()).not.toContain('asesor=');
  });

  test('SCEN-007: el visitante no consulta /api/asesor ni ve el panel', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const advisorCalls: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/asesor/')) advisorCalls.push(r.url());
    });
    await stubClipboardAndAvailability(page);
    await page.goto(SEARCH_PATH);

    // Espera a que los resultados pinten antes de afirmar la ausencia.
    await expect(page.getByText('¡Vehículos Disponibles!')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="copy-quote-panel"]')).toHaveCount(0);
    expect(advisorCalls).toEqual([]);
    await context.close();
  });
});
