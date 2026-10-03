import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/2026-10-03-selector-licencia/scenarios/selector-licencia.scenarios.md
 *
 * El documento que el cliente debe presentar al recoger depende de su LICENCIA
 * de conducción, no del documento con que se registró. La pregunta es
 * obligatoria (sin default) y solo UI: nunca viaja en el payload del registro.
 *
 * Harness: misma convención que reservation-privacy-consent.spec.ts —
 * availability stubeada por page.route, categoría real 'C', deep-link
 * /categoria/C?reservar=C directo al formulario de datos (grid alquilatucarro).
 */

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
    referenceToken: 'STUB-TOKEN-LIC',
    rateQualifier: 'STUB',
  },
];

const COL_NOTICE =
  'Al recoger el carro deberás presentar tu cédula colombiana. No se acepta pasaporte ni cédula de extranjería si presentas una licencia de conducción colombiana.';
const EXT_NOTICE =
  'Al recoger el carro deberás presentar tu pasaporte o cédula de extranjería. No se acepta la cédula colombiana si presentas una licencia de conducción extranjera.';
const LICENSE_ERROR = 'Selecciona el tipo de licencia de conducción';

async function stubAvailability(page: Page) {
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY_STUB),
    }),
  );
}

async function openReservationForm(page: Page) {
  await stubAvailability(page);
  await page.goto(`${searchPath}/categoria/${STUB_CODE}?reservar=${STUB_CODE}`);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('input#telefono')).toBeVisible({ timeout: 15_000 });
}

/** Todos los campos válidos MENOS la pregunta de licencia. */
async function fillEverythingButLicense(page: Page) {
  await page.getByPlaceholder('Nombres*').fill('Pablo');
  await page.getByPlaceholder('Apellidos*').fill('Díaz');
  await page.getByPlaceholder('ID Número*').fill('1020304050');
  await page.getByPlaceholder('Email*').fill('pablo@example.com');
  await page.getByRole('combobox', { name: 'Tipo de identificación' }).click();
  await page.getByRole('option', { name: 'Cédula' }).click();
  const phone = page.locator('input#telefono');
  await phone.click();
  await phone.pressSequentially('3001234567', { delay: 40 });
  await phone.blur();
  await expect(phone).toHaveValue(/\+57/, { timeout: 5_000 });
  await page.locator('[data-testid="privacy-consent-checkbox-test"]').check();
}

const notice = (page: Page) => page.locator('[data-testid="license-document-notice"]');

test.describe('Pregunta de licencia de conducción — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-LIC-01: arranca sin responder y sin aviso', async ({ page }) => {
    await openReservationForm(page);

    await expect(page.getByRole('radio', { name: 'Colombiana' })).not.toBeChecked();
    await expect(page.getByRole('radio', { name: 'Extranjera' })).not.toBeChecked();
    await expect(notice(page)).toHaveCount(0);
  });

  test('SCEN-LIC-02/03: cada respuesta muestra SU aviso y alternar lo reemplaza', async ({
    page,
  }) => {
    await openReservationForm(page);

    await page.getByRole('radio', { name: 'Extranjera' }).check();
    await expect(notice(page)).toHaveCount(1);
    await expect(notice(page)).toHaveText(EXT_NOTICE);
    // El aviso vive en una región viva para que el lector de pantalla lo anuncie.
    await expect(page.locator('[role="status"] [data-testid="license-document-notice"]')).toHaveCount(1);
    await page.screenshot({ path: 'e2e-results/licencia/alquilatucarro-extranjera.png', fullPage: false });

    await page.getByRole('radio', { name: 'Colombiana' }).check();
    await expect(notice(page)).toHaveCount(1);
    await expect(notice(page)).toHaveText(COL_NOTICE);
    await page.screenshot({ path: 'e2e-results/licencia/alquilatucarro-colombiana.png', fullPage: false });

    await page.getByRole('radio', { name: 'Extranjera' }).check();
    await expect(notice(page)).toHaveText(EXT_NOTICE);
  });

  test('SCEN-LIC-04: submit sin responder → bloqueado con mensaje y sin POST de registro', async ({
    page,
  }) => {
    await openReservationForm(page);
    await fillEverythingButLicense(page);

    let recordRequests = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/reservations/record')) recordRequests += 1;
    });

    const urlBefore = page.url();
    await page.getByRole('button', { name: /Solicitar reserva/i }).click();

    await expect(page.getByText(LICENSE_ERROR)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e-results/licencia/alquilatucarro-error.png', fullPage: false });
    expect(page.url()).toBe(urlBefore);
    expect(recordRequests).toBe(0);
  });

  test('SCEN-LIC-05: con la pregunta respondida el POST sale SIN ninguna clave de licencia', async ({
    page,
  }) => {
    await openReservationForm(page);
    await fillEverythingButLicense(page);
    await page.getByRole('radio', { name: 'Colombiana' }).check();

    await page.route('**/api/reservations/record', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reservationStatus: 'reservado', reserveCode: 'E2ELIC' }),
      }),
    );

    const [request] = await Promise.all([
      page.waitForRequest('**/api/reservations/record'),
      page.getByRole('button', { name: /Solicitar reserva/i }).click(),
    ]);

    const body = request.postData() ?? '';
    expect(body.length).toBeGreaterThan(0);
    expect(body).not.toMatch(/tipoLicencia/i);
    expect(body).not.toMatch(/licen/i);
    // El resto del payload sigue intacto: el documento de registro viaja normal.
    expect(body).toContain('identification_type');
  });
});
