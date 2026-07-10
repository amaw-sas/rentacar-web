import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Tope duro de 30 días de alquiler — las 3 marcas.
 *
 * Holdout: docs/specs/max-rental-days/scenarios/max-rental-days.scenarios.md
 *   - SCEN-MRD-01: una URL de 31 días se cotiza como 30.
 *   - SCEN-MRD-02: el recorte no depende del exceso (45 días → 30).
 *   - SCEN-MRD-03: la hora de devolución no puede empujar el conteo (05:00pm → 12:00pm).
 *   - SCEN-MRD-04: la mensualidad legítima no se toca.
 *   - SCEN-MRD-05: un alquiler regular no se recorta.
 *
 * El observable es el CUERPO del POST a /api/reservations/availability: es lo que la
 * app le pide de verdad al backend, es idéntico en las 3 marcas, y no depende de cómo
 * cada una pinte el resumen. `returnDateTime` es la ventana efectiva tras el recorte.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// El wizard/grid vive en /reservas en alquicarros y alquilame; en alquilatucarro la
// búsqueda por ruta sigue bajo /{city}/buscar-vehiculos.
function searchPath(from: string, to: string, pickupHour = '12:00pm', returnHour = '12:00pm') {
  const tail =
    `/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto` +
    `/fecha-recogida/${from}/fecha-devolucion/${to}` +
    `/hora-recogida/${pickupHour}/hora-devolucion/${returnHour}`;
  return BRAND === 'alquilatucarro' ? `/bogota/buscar-vehiculos${tail}` : `/reservas${tail}`;
}

/**
 * El retardo NO es cosmético: `useStoreSearchData.search()` congela la lista de gamas
 * con lo que haya en `categoriesAdminData` en ese instante, y ese catálogo hidrata
 * client-side desde `rentacar-data`. Un stub a 0 ms gana la carrera y deja la lista
 * vacía. También adelanta al `watchDebounced(…, 50 ms)` de useSearch que anula
 * `categoriesAvailabilityData`. 700 ms reproduce el orden de producción.
 */
function stubAvailability(page: Page, sink: { body?: Record<string, string> }) {
  return page.route('**/api/reservations/availability', async (route: Route) => {
    sink.body = route.request().postDataJSON();
    await new Promise((r) => setTimeout(r, 700));
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

/** Ninguna reserva se crea desde este spec. */
function blockRecord(page: Page) {
  return page.route('**/api/reservations/record', (route: Route) => route.abort());
}

async function windowRequestedFor(page: Page, path: string) {
  const sink: { body?: Record<string, string> } = {};
  await stubAvailability(page, sink);
  await blockRecord(page);
  await page.goto(path);
  await expect.poll(() => sink.body?.returnDateTime, { timeout: 30_000 }).toBeTruthy();
  return sink.body!;
}

const PICKUP = '2026-08-15';
const PICKUP_AT = '2026-08-15T12:00:00';
const CEILING_AT = '2026-09-14T12:00:00'; // pickup + 30 días, misma hora

test.describe('tope duro de 30 días', () => {
  test('SCEN-MRD-01 — una URL de 31 días se cotiza como 30', async ({ page }) => {
    const body = await windowRequestedFor(page, searchPath(PICKUP, '2026-09-15'));
    expect(body.pickupDateTime).toBe(PICKUP_AT);
    expect(body.returnDateTime).toBe(CEILING_AT);
  });

  test('SCEN-MRD-02 — 45 días se recortan al mismo tope', async ({ page }) => {
    const body = await windowRequestedFor(page, searchPath(PICKUP, '2026-09-29'));
    expect(body.returnDateTime).toBe(CEILING_AT);
  });

  test('SCEN-MRD-03 — la hora de devolución no empuja el conteo por encima del tope', async ({ page }) => {
    // 05:00pm sobre la fecha tope = 30 días + 5 h > GRACE_HOURS ⇒ 31 días facturables.
    const body = await windowRequestedFor(page, searchPath(PICKUP, '2026-09-14', '12:00pm', '05:00pm'));
    expect(body.returnDateTime).toBe(CEILING_AT);
  });

  test('SCEN-MRD-04 — la mensualidad legítima no se toca', async ({ page }) => {
    const body = await windowRequestedFor(page, searchPath(PICKUP, '2026-09-14'));
    expect(body.pickupDateTime).toBe(PICKUP_AT);
    expect(body.returnDateTime).toBe(CEILING_AT);
  });

  test('SCEN-MRD-05 — un alquiler regular de 29 días no se recorta', async ({ page }) => {
    const body = await windowRequestedFor(page, searchPath(PICKUP, '2026-09-13'));
    expect(body.returnDateTime).toBe('2026-09-13T12:00:00');
  });
});

/**
 * La ventana recortada tiene que ATERRIZAR en la mensualidad, no solo medir 30 días,
 * y el buscador no debe ofrecer horas que rompan el tope. Ambos observables son del
 * wizard de alquicarros; las otras marcas los pintan distinto.
 */
test.describe('consecuencias en la UI (solo alquicarros)', () => {
  test.skip(BRAND !== 'alquicarros', 'observables del wizard de alquicarros');

  test('SCEN-MRD-04 — una URL de 31 días aterriza en la mensualidad', async ({ page }) => {
    await blockRecord(page);
    await page.goto(searchPath(PICKUP, '2026-09-15')); // 31 días → recortado a 30
    const aside = page.locator('aside').first();
    await expect(aside).toContainText('15 de ago de 2026', { timeout: 30_000 });
    await expect(aside).toContainText('30 días');

    // El Paso 3 sólo se llama "Seguro y km" cuando haveMonthlyReservation es true.
    await expect(page.getByTestId('wizard-step-3-test')).toContainText('Seguro y km');

    await page.getByTestId('wizard-select-C-test').click();
    await page.getByRole('button', { name: /^Continuar$/ }).first().click();
    await expect(page.getByTestId('wizard-mileage-1k_kms-test')).toBeVisible();
    await expect(page.getByTestId('wizard-mileage-2k_kms-test')).toBeVisible();
    await expect(aside).toContainText('Kilometraje');
  });

  test('SCEN-MRD-07 — con 30 días el select no ofrece horas posteriores a la recogida', async ({ page }) => {
    await blockRecord(page);
    await page.goto(searchPath(PICKUP, '2026-09-14')); // mensual exacto, recogida 12:00pm
    await expect(page.locator('aside').first()).toContainText('30 días', { timeout: 30_000 });
    // "Seguro y km" confirma que haveMonthlyReservation quedó en true, pero NO que la
    // búsqueda asentó: doSearch fija ese flag ANTES de lanzar search(). La señal real de
    // asentamiento es que la disponibilidad ya pintó las gamas.
    await expect(page.getByTestId('wizard-step-3-test')).toContainText('Seguro y km', { timeout: 30_000 });
    await expect(page.getByTestId('wizard-select-C-test')).toBeVisible({ timeout: 30_000 });

    // El buscador (#searcher) NO existe hasta que el Paso 1 lo monta, y un click que
    // llegue mientras doSearch sigue en vuelo se pierde: la red de seguridad de
    // deep-links devuelve el wizard a su paso y lo desmonta. Reintentar hasta que monte.
    await expect
      .poll(async () => {
        if ((await page.locator('#searcher').count()) === 0) {
          await page.getByTestId('wizard-step-1-test').click({ timeout: 5_000 }).catch(() => {});
        }
        return page.locator('#searcher').count();
      }, { timeout: 30_000 })
      .toBeGreaterThan(0);

    const trigger = () => page.getByTestId('return-hour-desktop-test').locator('visible=true').first();
    await expect(trigger()).toBeVisible({ timeout: 15_000 });

    // El buscador se renderiza dos veces (variante móvil + escritorio): `.first()` a secas
    // cae en la oculta y el click expira. Tomar la visible, y reintentar la apertura por si
    // el nodo se recicla mientras el popover monta.
    let options: string[] = [];
    await expect
      .poll(async () => {
        try {
          await trigger().click({ timeout: 3_000 });
        } catch {
          return 0;
        }
        options = await page.getByRole('option').allInnerTexts();
        return options.length;
      }, { timeout: 30_000 })
      .toBeGreaterThan(0);

    expect(options.length).toBeGreaterThan(0);
    // Mediodía es la hora de recogida: nada después de ella.
    const afterPickup = options.filter((o) => /p\.\s?m\./i.test(o) && !/^12:/.test(o.trim()));
    expect(afterPickup).toEqual([]);
    expect(options[options.length - 1]).toMatch(/Mediod/i);
  });
});
