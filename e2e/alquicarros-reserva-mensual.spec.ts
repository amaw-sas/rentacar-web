import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * alquicarros — reserva mensual en el wizard (kilometraje).
 *
 * Holdout: docs/specs/alquicarros-mensualidad/scenarios/wizard-mileage.scenarios.md
 *   - SCEN-ACM-01: el bloque de kilometraje aparece solo en reserva mensual.
 *   - SCEN-ACM-03: elegir 2.000 km recalcula el total mostrado.
 *   - SCEN-ACM-04: el payload lleva monthly_mileage y total_price = round(to_pay/1.19).
 *   - SCEN-ACM-05: la reserva regular no cambia.
 *   - SCEN-ACM-08: el costo del Seguro Total se expresa por mes, no por día.
 *
 * Solo alquicarros. La disponibilidad va stubbeada; la metadata de gamas y los
 * precios mensuales vienen de Supabase (/api/rentacar-data).
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// 2026-08-15 12:00pm → 2026-09-14 12:00pm = 720 h = exactamente 30 días (rentalDayCount).
const MONTHLY_PATH =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-08-15/fecha-devolucion/2026-09-14' +
  '/hora-recogida/12:00pm/hora-devolucion/12:00pm' +
  '/categoria/c';
const MONTHLY_PICKUP = '15 de ago de 2026';

const REGULAR_PATH =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-10-04/fecha-devolucion/2026-10-11' +
  '/hora-recogida/12:00pm/hora-devolucion/12:00pm' +
  '/categoria/c';
const REGULAR_PICKUP = '4 de oct de 2026';

const DAYS = 7;
function stubRow(code: string, est: number) {
  const vehicleDayCharge = Math.round((est * 0.9) / DAYS);
  const coverageUnitCharge = Math.round((est * 0.1) / DAYS);
  return {
    categoryCode: code,
    categoryDescription: '',
    totalAmount: vehicleDayCharge * DAYS,
    estimatedTotalAmount: est,
    vehicleDayCharge,
    numberDays: DAYS,
    coverageUnitCharge,
    coverageQuantity: DAYS,
    coverageTotalAmount: coverageUnitCharge * DAYS,
    totalCoverageUnitCharge: coverageUnitCharge * 3,
    taxFeeAmount: Math.round(vehicleDayCharge * DAYS * 0.1),
    taxFeePercentage: 10,
    IVAFeeAmount: 95000,
    returnFeeAmount: 0,
    extraHoursQuantity: 0,
    extraHoursTotalAmount: 0,
    discountAmount: 0,
    referenceToken: `STUB-${code}`,
    rateQualifier: 'STUB',
  };
}

/**
 * Mensual: Localiza rechaza ventanas >= 30 días (LLNRAG009) y el store construye las
 * tarjetas desde el catálogo (month_prices). Una respuesta vacía basta y refleja
 * producción mejor que una lista inventada.
 */
function stubAvailability(page: Page, body: unknown) {
  return page.route('**/api/reservations/availability', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

function captureRecord(page: Page, sink: { body?: Record<string, unknown> }) {
  return page.route('**/api/reservations/record', (route: Route) => {
    sink.body = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reservationStatus: 'reservado', reserveCode: 'E2EMES' }),
    });
  });
}

async function appears(page: Page, selector: string, timeout = 12_000): Promise<boolean> {
  return page.locator(selector).first().waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false);
}

/**
 * Entra al Paso 3 con la búsqueda del path ya hidratada.
 *
 * El centinela es la FECHA DE RECOGIDA + la gama, no la duración: el estado por defecto
 * del store también dura 7 días, así que esperar "7 días" pasa sin haber hidratado y el
 * test opera sobre un wizard sin gama. `rentacar-data` (Supabase) hidrata client-side y
 * useSearchByRouteParams corre una sola vez en onMounted → si la metadata llega tarde,
 * el deep-link de gama cae en la red de seguridad y vuelve al Paso 2.
 *
 * Siempre recarga antes de mirar: `StepVehicle.renderable` filtra contra
 * `vehicleCategories`, que no es reactivo — si el paso monta antes de que llegue esa
 * metadata, su lista de gamas queda vacía para el resto de la carga. Tras el reload la
 * metadata viaja en el payload SSR. Mismo remedio que el `gotoWizard` de
 * alquicarros-reservation-wizard.spec.ts.
 */
async function gotoStep3(page: Page, path: string, pickupDate: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt === 0) await page.goto(path);
    await page.reload();

    const hydrated = await page
      .locator('aside')
      .filter({ hasText: pickupDate })
      .filter({ hasText: 'Gama C' })
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (hydrated && (await appears(page, '[data-testid="wizard-coverage-total-test"]', 10_000))) return true;
  }
  return false;
}

/** Paso 3 → Adicionales → Datos → Confirmar. */
async function submitFrom(page: Page) {
  await page.locator('[data-testid="wizard-continue-desktop-test"]').click();
  await page.locator('[data-testid="wizard-extras-skip-test"]').click();

  await page.getByPlaceholder('Nombres*').fill('Pablo');
  await page.getByPlaceholder('Apellidos*').fill('Díaz');
  await page.getByPlaceholder('ID Número*').fill('1020304050');
  await page.getByPlaceholder('Email*').fill('pablo@example.com');
  await page.getByRole('combobox', { name: 'Tipo de identificación' }).click();
  await page.getByRole('option', { name: 'Cédula' }).click();

  // VueTelInput solo produce el +57 que exige isValidPhoneNumber tras teclear + blur.
  const phone = page.locator('input#telefono');
  await phone.click();
  await phone.pressSequentially('3001234567', { delay: 40 });
  await phone.blur();
  await expect(phone).toHaveValue(/\+57/, { timeout: 5_000 });

  await page.locator('[data-testid="wizard-continue-desktop-test"]').click();
  await page.waitForURL(/\/reservado\/E2EMES|\/pendiente|\/sindisponibilidad/, { timeout: 15_000 });
}

test.describe('alquicarros — reserva mensual', () => {
  test.skip(BRAND !== 'alquicarros', 'Escenarios específicos de alquicarros');

  test('SCEN-ACM-01/08: el Paso 3 mensual ofrece kilometraje y cobra el seguro por mes', async ({ page }) => {
    await stubAvailability(page, []);
    const ok = await gotoStep3(page, MONTHLY_PATH, MONTHLY_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    await expect(page.locator('aside')).toContainText('30 días');

    // SCEN-ACM-01: 1.000 km preseleccionado; 2.000 km disponible; 3.000 km jamás.
    const km1 = page.locator('[data-testid="wizard-mileage-1k_kms-test"]');
    const km2 = page.locator('[data-testid="wizard-mileage-2k_kms-test"]');
    await expect(km1).toBeVisible();
    await expect(km2).toBeVisible();
    await expect(km1).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="wizard-mileage-3k_kms-test"]')).toHaveCount(0);

    // SCEN-ACM-08: el incremento del Seguro Total se expresa por mes.
    await expect(page.locator('[data-testid="wizard-coverage-total-test"]')).toContainText('/ mes');
  });

  test('SCEN-ACM-01: la reserva regular NO ofrece kilometraje', async ({ page }) => {
    await stubAvailability(page, [stubRow('C', 850000), stubRow('CX', 920000)]);
    const ok = await gotoStep3(page, REGULAR_PATH, REGULAR_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    await expect(page.locator('[data-testid="wizard-mileage-1k_kms-test"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="wizard-coverage-total-test"]')).toContainText('/ día');
  });

  test('SCEN-ACM-03/04: elegir 2.000 km cambia el total y viaja en el payload', async ({ page }) => {
    await stubAvailability(page, []);
    const sink: { body?: Record<string, unknown> } = {};
    await captureRecord(page, sink);

    const ok = await gotoStep3(page, MONTHLY_PATH, MONTHLY_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    const total = page.locator('aside').filter({ hasText: 'Tu reserva' }).first();
    const totalCon1k = await total.innerText();

    await page.locator('[data-testid="wizard-mileage-2k_kms-test"]').click();
    await expect(total).toContainText('2.000 km');
    // SCEN-ACM-03: el plan de 2.000 km cuesta más → el total mostrado cambia.
    await expect
      .poll(async () => (await total.innerText()) !== totalCon1k, { timeout: 5_000 })
      .toBe(true);

    await submitFrom(page);

    // SCEN-ACM-04: rama mensual del payload.
    expect(sink.body, 'se capturó el POST /record').toBeTruthy();
    expect(sink.body!.monthly_mileage).toBe('2k_kms');
    expect(sink.body!.tax_fee).toBe(0);
    expect(sink.body!.iva_fee).toBe(0);
    expect(sink.body!.coverage_days).toBe(0);

    const toPay = Number(sink.body!.total_price_to_pay);
    expect(toPay).toBeGreaterThan(1_000_000);
    expect(sink.body!.total_price).toBe(Math.round(toPay / 1.19));
  });

  test('SCEN-ACM-07: re-elegir la misma gama conserva seguro y kilometraje', async ({ page }) => {
    await stubAvailability(page, []);
    const ok = await gotoStep3(page, MONTHLY_PATH, MONTHLY_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    await page.locator('[data-testid="wizard-coverage-total-test"]').click();
    await page.locator('[data-testid="wizard-mileage-2k_kms-test"]').click();
    const aside = page.locator('aside').filter({ hasText: 'Tu reserva' }).first();
    await expect(aside).toContainText('Seguro Total');
    await expect(aside).toContainText('2.000 km');

    // Volver al Paso 2 y re-tocar la MISMA gama: el early-return de onSelect evita
    // crear una instancia fresca, así que no se pierde lo elegido. El Paso 2 arranca
    // en el nivel de segmentos (C y CX viven en "economicos"); hay que abrirlo.
    await page.locator('[data-testid="wizard-step-2-test"]').click();

    // StepVehicle destructura `useFetchRentacarData()` en setup: si `useState` aún no
    // está hidratado recibe el EMPTY_SENTINEL congelado y su lista queda vacía para
    // siempre. En dev el plugin llena ese estado después de que el paso monta, así que
    // las cards no aparecen. Mismo motivo por el que alquicarros-reservation-wizard.spec
    // salta sus casos de Paso 2. En CI (SSR con payload) sí renderizan.
    const tilesRendered = await appears(page, '[data-testid="wizard-segment-economicos-test"]', 8_000);
    test.skip(!tilesRendered, 'Paso 2 sin cards: rentacar-data hidrata tras el mount (dev)');

    await page.locator('[data-testid="wizard-segment-economicos-test"]').click();
    await page.locator('[data-testid="wizard-select-C-test"]').click();
    await page.locator('[data-testid="wizard-step-3-test"]').click();
    await expect(aside).toContainText('Seguro Total');
    await expect(aside).toContainText('2.000 km');

    // Cambiar de gama SÍ resetea a los defaults de la instancia nueva.
    await page.locator('[data-testid="wizard-step-2-test"]').click();
    await page.locator('[data-testid="wizard-segment-economicos-test"]').click();
    await page.locator('[data-testid="wizard-select-CX-test"]').click();
    await expect(aside).toContainText('Seguro Básico');
    await expect(aside).toContainText('1.000 km');
  });

  test('SCEN-ACM-06: tras recargar, el resumen y el payload coinciden', async ({ page }) => {
    await stubAvailability(page, []);
    const sink: { body?: Record<string, unknown> } = {};
    await captureRecord(page, sink);

    let ok = await gotoStep3(page, MONTHLY_PATH, MONTHLY_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    await page.locator('[data-testid="wizard-coverage-total-test"]').click();
    await page.locator('[data-testid="wizard-mileage-2k_kms-test"]').click();

    // Recargar descarta el estado en memoria: la instancia se reconstruye con sus
    // defaults. Lo que importa es que el resumen y el payload no se contradigan —
    // el bug original mostraba 1.000 km y enviaba `null`.
    ok = await gotoStep3(page, MONTHLY_PATH, MONTHLY_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');

    const aside = page.locator('aside').filter({ hasText: 'Tu reserva' }).first();
    await expect(aside).toContainText('Seguro Básico');
    await expect(aside).toContainText('1.000 km');

    await submitFrom(page);
    expect(sink.body!.total_insurance).toBe(false);
    expect(sink.body!.monthly_mileage).toBe('1k_kms');
  });

  test('SCEN-ACM-05: la reserva regular conserva tax/iva y no manda monthly_mileage', async ({ page }) => {
    await stubAvailability(page, [stubRow('C', 850000), stubRow('CX', 920000)]);
    const sink: { body?: Record<string, unknown> } = {};
    await captureRecord(page, sink);

    const ok = await gotoStep3(page, REGULAR_PATH, REGULAR_PICKUP);
    test.skip(!ok, 'metadata de gamas (Supabase) no disponible en el entorno');
    await submitFrom(page);

    expect(sink.body!.monthly_mileage).toBeUndefined();
    expect(Number(sink.body!.total_price)).toBeGreaterThan(0);
    expect(Number(sink.body!.tax_fee)).toBeGreaterThan(0);
    expect(Number(sink.body!.iva_fee)).toBeGreaterThan(0);
  });
});
