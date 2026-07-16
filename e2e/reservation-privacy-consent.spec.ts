import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/2026-07-16-issue-311-consentimiento-datos/scenarios/
 *          consentimiento-datos-pre-marcado.scenarios.md
 * Issue:   https://github.com/amaw-sas/rentacar-web/issues/311
 *
 * Ley 1581/2012 (habeas data): el consentimiento de tratamiento de datos debe
 * ser previo, EXPRESO e informado. La casilla venía pre-marcada (consentimiento
 * por omisión) desde el default del store compartido. Estos escenarios cubren el
 * grid de alquilatucarro; el wizard de alquicarros se cubre en
 * alquicarros-reservation-wizard.spec.ts (SCEN-311-03/04) y alquilame comparte
 * el mismo store (guard fuente-level en packages/logic).
 *
 * Harness: misma convención que reservation-phone-revalidation.spec.ts —
 * availability stubeada por page.route, categoría real 'C', deep-link
 * /categoria/C?reservar=C directo al formulario de datos.
 */

// Fechas SIEMPRE futuras: una fecha fija rota con el tiempo — el server la
// corrige con un 302 que pierde `?reservar=<code>` y el formulario nunca abre.
const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  `/fecha-recogida/${futureDate(20)}` +
  `/fecha-devolucion/${futureDate(22)}` +
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
    referenceToken: 'STUB-TOKEN-311',
    rateQualifier: 'STUB',
  },
];

const CONSENT_ERROR = 'Debe aceptar las políticas de privacidad';

async function stubAvailability(page: Page) {
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY_STUB),
    }),
  );
}

/** Abre el paso "Datos" por deep-link y espera el formulario hidratado. */
async function openReservationForm(page: Page) {
  await stubAvailability(page);
  await page.goto(`${searchPath}/categoria/${STUB_CODE}?reservar=${STUB_CODE}`);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('input#telefono')).toBeVisible({ timeout: 15_000 });
}

/** Llena todos los campos personales con valores válidos (sin tocar la casilla). */
async function fillValidPersonalData(page: Page) {
  await page.getByPlaceholder('Nombres*').fill('Pablo');
  await page.getByPlaceholder('Apellidos*').fill('Díaz');
  await page.getByPlaceholder('ID Número*').fill('1020304050');
  await page.getByPlaceholder('Email*').fill('pablo@example.com');
  await page.getByRole('combobox', { name: 'Tipo de identificación' }).click();
  await page.getByRole('option', { name: 'Cédula' }).click();

  // VueTelInput solo produce el +57 que exige isValidPhoneNumber tras
  // teclear + blur (misma convención que los otros specs de reserva).
  const phone = page.locator('input#telefono');
  await phone.click();
  await phone.pressSequentially('3001234567', { delay: 40 });
  await phone.blur();
  await expect(phone).toHaveValue(/\+57/, { timeout: 5_000 });
}

test.describe('Consentimiento de datos NO pre-marcado (issue #311) — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-311-01: la casilla aparece SIN marcar al abrir el formulario', async ({
    page,
  }) => {
    await openReservationForm(page);

    const consent = page.locator('[data-testid="privacy-consent-checkbox-test"]');
    await expect(consent).toBeVisible();
    await expect(consent).not.toBeChecked();
  });

  test('SCEN-311-02: submit válido sin consentimiento → bloqueado con mensaje y sin POST de registro', async ({
    page,
  }) => {
    await openReservationForm(page);
    await fillValidPersonalData(page);

    // Vigilar el endpoint de registro: un submit bloqueado no debe emitirlo.
    let recordRequests = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/reservations/record')) recordRequests += 1;
    });

    const urlBefore = page.url();
    await page.getByRole('button', { name: /Solicitar reserva/i }).click();

    await expect(page.getByText(CONSENT_ERROR)).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toBe(urlBefore);
    expect(recordRequests).toBe(0);
  });
});
