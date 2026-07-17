import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * E2E del wizard de reserva acompañada (alquicarros) — Fase 4 / Paso 13.
 * Holdout: docs/specs/2026-07-01-alquicarros-reservation-wizard/scenarios/
 *
 * SOLO alquicarros: el wizard reemplaza el flujo CategorySelectionSection de las
 * marcas hermanas. `test.skip` cuando BRAND != alquicarros.
 *
 * Backend: /api/reservations/availability y /record se stubean con page.route
 * (determinista, sin backend ni carrera de hidratación). /api/rentacar-data viene
 * de Supabase server-side (categorías + vehicleCategories) — si esa metadata no
 * está disponible en el entorno, los tiles/cards no renderan y el test se salta
 * (igual que reservation-phone-revalidation.spec.ts). Los códigos del stub (C, CX,
 * F, G4, LE) deben existir en el catálogo Supabase de alquicarros.
 *
 * Cubre SCEN-W-03/05 (segmentos + selección), W-06 (Seguro recalcula), W-07
 * (Adicionales + Omitir), W-09 (deep-link /reservas?query → Paso 2), W-11 (submit),
 * W-12 (vacío/error), W-14 (elegir gama por UI → Paso 3), y SCEN-AC-01 (la ruta
 * legacy /{city}/buscar-vehiculos redirige 301 → /reservas — independencia de
 * enrutamiento, buscar-vehiculos quedó exclusiva de alquilatucarro).
 */

const BRAND = process.env.BRAND || 'alquilatucarro';
test.skip(BRAND !== 'alquicarros', 'Wizard es exclusivo de alquicarros');

const DAYS = 7;
function stubRow(code: string, est: number) {
  const vehicleDayCharge = Math.round((est * 0.7) / DAYS);
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
    totalCoverageUnitCharge: coverageUnitCharge * 3, // Total > Básico (delta positivo)
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

// Multi-segmento: Económicos (C, CX), Sedanes (F), Camionetas-SUV (G4), Premium (LE).
const AVAILABILITY_STUB = [
  stubRow('C', 850000),
  stubRow('CX', 920000),
  stubRow('F', 1100000),
  stubRow('G4', 1500000),
  stubRow('LE', 2200000),
];

/**
 * El retardo NO es cosmético. `useStoreSearchData.search()` congela
 * `categoriesAvailabilityData` con el catálogo que exista en `categoriesAdminData` en ese
 * instante, y ese catálogo (`rentacar-data`, Supabase) hidrata client-side. Un stub que
 * responde en 0 ms gana esa carrera y deja la lista de gamas vacía para siempre: el Paso 2
 * muestra "Sin vehículos" y estos tests se saltaban solos. Con backend real la petición
 * tarda lo suficiente; 700 ms reproduce ese orden.
 */
function stubAvailability(page: Page, body: unknown, status = 200) {
  return page.route('**/api/reservations/availability', async (route: Route) => {
    if (status === 200) await new Promise((r) => setTimeout(r, 700));
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}
function stubRecord(page: Page) {
  return page.route('**/api/reservations/record', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // El estado debe ser 'reservado' (español) — routeForReservationStatus
      // normaliza a minúsculas y 'reserved' (inglés) cae en default → null → no navega.
      body: JSON.stringify({ reservationStatus: 'reservado', reserveCode: 'E2ECODE' }),
    }),
  );
}

// Superficie de reserva de alquicarros = el wizard en `/reservas` (query params).
// La ruta legacy `/{city}/buscar-vehiculos/...` fue eliminada (independencia de
// enrutamiento) y ahora redirige 301 → /reservas (ver SCEN-AC-01).
const RESERVAS_SEARCH =
  '/reservas' +
  '?lugar_recogida=bogota-aeropuerto&lugar_devolucion=bogota-aeropuerto' +
  '&fecha_recogida=2026-10-04&fecha_devolucion=2026-10-11' +
  '&hora_recogida=12:00pm&hora_devolucion=12:00pm&paso=vehiculo';

// URL legacy buscar-vehiculos — ya no resuelve; solo se usa para asertar el 301.
const LEGACY_CITY_SEARCH =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-10-04/fecha-devolucion/2026-10-11' +
  '/hora-recogida/12:00pm/hora-devolucion/12:00pm';

/** Espera a que aparezca un selector; true si apareció dentro del timeout. */
async function appears(page: Page, selector: string, timeout = 12_000): Promise<boolean> {
  return page
    .locator(selector)
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

/**
 * Navega a una ruta del wizard y espera `selector`. Reintenta con un reload: la
 * disponibilidad la stubea page.route, pero /api/rentacar-data (Supabase) hidrata
 * client-side y useSearchByRouteParams corre una vez onMounted — si esa metadata
 * llega tarde el merge queda vacío en el primer intento. Un reload la reejecuta con
 * rentacar-data ya caliente (mismo race documentado que reservation-phone-revalidation).
 * Devuelve true si `selector` fue visible; false → el entorno no tiene la metadata.
 */
async function gotoWizard(page: Page, path: string, selector: string): Promise<boolean> {
  await page.goto(path);
  if (await appears(page, selector)) return true;
  await page.reload();
  return appears(page, selector, 20_000);
}

/**
 * Lleva el wizard hasta el Paso 3 (Seguro) con la gama C elegida, manejando la UI:
 * deep-link a `/reservas` (Paso 2) → abrir el segmento Económicos → elegir la card
 * de la gama C → Continuar. Reemplaza el viejo deep-link de path `/categoria/C`
 * (que vivía en la ruta buscar-vehiculos ya eliminada). Devuelve true si llegó al
 * selector de cobertura; false si la metadata Supabase no está en el entorno.
 */
async function gotoCoverageWithGamaC(page: Page): Promise<boolean> {
  const atStep2 = await gotoWizard(page, RESERVAS_SEARCH, '[data-testid^="wizard-segment-"]');
  if (!atStep2) return false;
  // NO clickear el tile: StepVehicle auto-abre el primer segmento y `toggleSegment` es un
  // toggle, así que pulsarlo lo cierra. Y elegir se hace con el botón "Elegir": el centro
  // de la card es el carrusel, que aísla sus clics con @click.stop.
  await page.locator('[data-testid="wizard-select-C-test"]').click();
  await page.locator('[data-testid="wizard-continue-desktop-test"]').click();
  return appears(page, '[data-testid="wizard-coverage-total-test"]');
}

test.describe('alquicarros — wizard de reserva (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 1000 } });

  test('SCEN-AC-01: la ruta legacy /{city}/buscar-vehiculos redirige 301 → /reservas', async ({ page }) => {
    // La request directa NO debe seguir el redirect: asertamos el 301 + Location.
    // Desde el PR #307 el redirect es path→path (server/middleware/redirect-buscar-vehiculos):
    // conserva el resto de la URL en vez de tirar al usuario a la /reservas limpia.
    const resp = await page.request.get(LEGACY_CITY_SEARCH, { maxRedirects: 0 });
    expect(resp.status()).toBe(301);
    expect(resp.headers()['location']).toBe(
      LEGACY_CITY_SEARCH.replace('/bogota/buscar-vehiculos', '/reservas'),
    );
  });

  test('SCEN-W-09/03: deep-link (/reservas?query) entra en Paso 2 con tiles de segmento', async ({ page }) => {
    await stubAvailability(page, AVAILABILITY_STUB);
    const rendered = await gotoWizard(page, RESERVAS_SEARCH, '[data-testid^="wizard-segment-"]');
    test.skip(!rendered, 'vehicleCategories (Supabase) no disponible en el entorno');

    await expect(page.getByRole('heading', { name: 'Elige tu vehículo' })).toBeVisible();
    await expect(page.locator('[data-testid="wizard-segment-economicos-test"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-segment-sedanes-test"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-segment-premium-test"]')).toBeVisible();
    // El paso "2 Vehículo" está activo en la barra.
    await expect(page.getByRole('button', { name: /2\s*Vehículo/ })).toBeVisible();
  });

  test('SCEN-W-06/07/11: Seguro→Adicionales→Datos→submit (elige gama por UI)', async ({ page }) => {
    // Entra a /reservas (Paso 2), abre Económicos y elige la gama C por UI para
    // llegar al Paso 3 (Seguro). Reemplaza el viejo deep-link de path /categoria/C
    // (ruta buscar-vehiculos eliminada). Ejercita Seguro→Adicionales→Datos→submit.
    await stubAvailability(page, AVAILABILITY_STUB);
    const rendered = await gotoCoverageWithGamaC(page);
    test.skip(!rendered, 'vehicleCategories (Supabase) no disponible en el entorno');
    await stubRecord(page);

    const sidebar = page.locator('aside');
    await expect(sidebar).toContainText('Gama C');
    await expect(page.getByRole('heading', { name: 'Elige tu cobertura' })).toBeVisible();
    const totalBasico = (await sidebar.locator('.price-md').first().textContent())?.trim();

    // SCEN-W-06 — elegir Seguro Total sube el total del sidebar
    await page.locator('[data-testid="wizard-coverage-total-test"]').click();
    await expect(sidebar).toContainText('Seguro Total');
    await expect
      .poll(async () => (await sidebar.locator('.price-md').first().textContent())?.trim())
      .not.toBe(totalBasico);

    // Avanzar a Adicionales, luego Omitir → Datos (SCEN-W-07)
    await page.locator('[data-testid="wizard-continue-desktop-test"]').click();
    await expect(page.getByRole('heading', { name: 'Servicios adicionales' })).toBeVisible();
    await page.locator('[data-testid="wizard-extras-skip-test"]').click();
    await expect(page.getByRole('heading', { name: 'Tus datos para reservar' })).toBeVisible();

    // Paso 5 — llenar el formulario y confirmar (SCEN-W-11 → /reservado/[code])
    await page.getByPlaceholder('Nombres*').fill('Pablo');
    await page.getByPlaceholder('Apellidos*').fill('Díaz');
    await page.getByPlaceholder('ID Número*').fill('1020304050');
    await page.getByPlaceholder('Email*').fill('pablo@example.com');
    // Tipo de identificación es un combobox (@nuxt/ui u-select): abrir + elegir opción.
    await page.getByRole('combobox', { name: 'Tipo de identificación' }).click();
    await page.getByRole('option', { name: 'Cédula' }).click();
    // VueTelInput valida contra formato internacional: isValidPhoneNumber exige
    // `+57…`, que el widget produce SOLO tras reformatear el número completo. Hay
    // que teclear, hacer blur y esperar el reformateo antes de confirmar.
    const phone = page.locator('input#telefono');
    await phone.click();
    await phone.pressSequentially('3001234567', { delay: 40 });
    await phone.blur();
    await expect(phone).toHaveValue(/\+57/, { timeout: 5_000 });

    // #311 (SCEN-311-01/03/04): la casilla de tratamiento de datos llega SIN
    // marcar (Ley 1581: consentimiento expreso) y mantiene el CTA deshabilitado;
    // marcarla — como haría el usuario real — lo habilita y permite confirmar.
    const consent = page.locator('[data-testid="privacy-consent-checkbox-test"]');
    const confirmCta = page.locator('[data-testid="wizard-continue-desktop-test"]');
    await expect(consent).not.toBeChecked();
    await expect(confirmCta).toBeDisabled();
    await consent.check();
    await expect(confirmCta).toBeEnabled();

    await confirmCta.click();
    await page.waitForURL(/\/reservado\/E2ECODE|\/pendiente|\/sindisponibilidad/, { timeout: 15_000 });
    expect(page.url()).toContain('/reservado/E2ECODE');
  });

  test('SCEN-W-14: elegir la gama C por UI lleva al Paso 3 con la gama fijada', async ({ page }) => {
    await stubAvailability(page, AVAILABILITY_STUB);
    const cov = await gotoCoverageWithGamaC(page);
    test.skip(!cov, 'vehicleCategories (Supabase) no disponible en el entorno');

    await expect(page.getByRole('heading', { name: 'Elige tu cobertura' })).toBeVisible();
    await expect(page.locator('aside')).toContainText('Gama C');
  });

  test('SCEN-W-12: cero categorías → estado vacío con CTA "ajustar búsqueda"', async ({ page }) => {
    await stubAvailability(page, []);
    await page.goto(RESERVAS_SEARCH);
    await expect(page.locator('[data-testid="wizard-vehicle-empty-test"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="wizard-adjust-search-test"]')).toBeVisible();
  });

  test('SCEN-W-12: error de disponibilidad → banner inline accionable', async ({ page }) => {
    await stubAvailability(page, { error: 'server_error', message: 'boom' }, 500);
    await page.goto(RESERVAS_SEARCH);
    await expect(page.locator('[data-testid="wizard-vehicle-error-test"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="wizard-adjust-search-test"]')).toBeVisible();
  });
});
