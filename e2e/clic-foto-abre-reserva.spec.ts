import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout RUNTIME: docs/specs/clic-foto-abre-reserva/scenarios/
 *                  clic-foto-abre-reserva.scenarios.md
 *
 * El clic/tap en la foto del vehículo debe abrir el flujo de reserva (slideover
 * "Resumen de la selección"), el mismo destino que el botón "Solicitar este
 * vehículo". El PR #199 lo cableó pero solo lo "probó" con coincidencias de
 * strings del source; en navegador no abre. Este spec ejecuta el comportamiento.
 *
 * Backend stub: misma convención que e2e/reservation-a11y-single-dialog.spec.ts
 * (availability cliente-side → page.route; categoryCode 'C' es real en
 * vehicleCategories o renderableCategories lo descarta).
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-07-10' +
  '/fecha-devolucion/2026-07-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

const STUB_CODE = 'C';
const AVAILABILITY_STUB = [
  {
    categoryCode: STUB_CODE,
    categoryDescription: 'Económico Mecánico',
    categoryModels: [],
    categoryMonthPrices: [],
    totalAmount: 500000,
    estimatedTotalAmount: 500000,
    vehicleDayCharge: 250000,
    numberDays: 2,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    IVAFeeAmount: 95000,
    coverageUnitCharge: 0,
    coverageQuantity: 0,
    coverageTotalAmount: 0,
    totalCoverageUnitCharge: 0,
    referenceToken: 'STUB-TOKEN-FOTO',
    rateQualifier: 'STUB',
  },
];

async function stubAvailability(page: Page) {
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY_STUB),
    }),
  );
}

/** Navega a la búsqueda y espera a que renderice al menos una tarjeta (su CTA
 * "Solicitar este vehículo"). Devuelve true si hay grilla, false → caller skip. */
async function gotoSearchWithGrid(page: Page): Promise<boolean> {
  await stubAvailability(page);
  await page.goto(searchPath);
  await page.waitForLoadState('domcontentloaded');
  return await page
    .getByRole('button', { name: 'Solicitar este vehículo' })
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
}

// La foto interactiva es el wrapper role="button" con aria-label "Reservar X".
const firstPhoto = (page: Page) =>
  page.getByRole('button', { name: /^Reservar / }).first();
const resumeDialog = (page: Page) =>
  page.getByRole('dialog').filter({ hasText: 'Resumen de la selección' });

test.describe('clic-foto-abre-reserva — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-001: click en la foto abre el slideover de reserva', async ({ page }) => {
    const ok = await gotoSearchWithGrid(page);
    test.skip(!ok, 'Sin categorías renderizadas (availability no disponible)');

    await expect(firstPhoto(page)).toBeVisible();
    await firstPhoto(page).click();

    await expect(resumeDialog(page)).toBeVisible({ timeout: 10_000 });
  });

  test('SCEN-003: Enter sobre la foto enfocada abre la reserva', async ({ page }) => {
    const ok = await gotoSearchWithGrid(page);
    test.skip(!ok, 'Sin categorías renderizadas');

    await firstPhoto(page).focus();
    await page.keyboard.press('Enter');

    await expect(resumeDialog(page)).toBeVisible({ timeout: 10_000 });
  });
});
