import { test, expect } from '@playwright/test';

/**
 * alquilame — /reservas por PATH + independencia de buscar-vehiculos (directiva).
 *
 * Holdout: docs/specs/alquilame-routing/scenarios/reservas-path-migration.scenarios.md
 *   - SCEN-AL-01: /{city}/buscar-vehiculos/<resto> → 301 /reservas/<resto> (server middleware).
 *   - SCEN-AL-02: el buscador arma un PATH /reservas/lugar-recogida/... (no query).
 *   - SCEN-AL-03: deep-link /reservas/.../categoria/[X] aterriza en la CARD con los
 *     selectores de seguro/adicionales visibles y el slideover CERRADO; "Solicitar"
 *     abre el resumen (flujo operador).
 *
 * Solo alquilame (las otras marcas conservan su propio flujo). Requiere backend de
 * disponibilidad (dashboard) para el grid — sin datos, los tests de grid se saltan.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// Cola de segmentos de un resultado /reservas (fechas futuras para pasar el guard
// de fecha del middleware). El grid puebla vía useSearchByRouteParams.
const RESULT_TAIL =
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-08-15' +
  '/fecha-devolucion/2026-08-20' +
  '/hora-recogida/12:00pm' +
  '/hora-devolucion/12:00pm';
const RESERVAS_RESULT = `/reservas${RESULT_TAIL}`;
const LEGACY_BUSCAR_VEHICULOS = `/bogota/buscar-vehiculos${RESULT_TAIL}`;

test.describe('alquilame — /reservas PATH migration', () => {
  test.skip(BRAND !== 'alquilame', 'Escenarios específicos de alquilame');

  test('SCEN-AL-01: buscar-vehiculos redirige 301 → /reservas conservando el resto del path', async ({ request }) => {
    const res = await request.get(LEGACY_BUSCAR_VEHICULOS, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    const location = res.headers()['location'];
    expect(location).toBe(RESERVAS_RESULT);
  });

  test('SCEN-AL-01: la variante con categoría preserva la gama en el redirect (link operador)', async ({ request }) => {
    const res = await request.get(`${LEGACY_BUSCAR_VEHICULOS}/categoria/c`, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toBe(`${RESERVAS_RESULT}/categoria/c`);
  });

  test('SCEN-AL-02: el submit del buscador en /reservas limpio apunta a un PATH /reservas (no query string)', async ({ page }) => {
    // En /reservas limpio el buscador arranca con la sede + fechas por defecto
    // (tomorrow/+7), así que el guard está satisfecho y el NuxtLink :to resuelto es
    // el PATH de búsqueda. El submit es un <a href> (no la forma vieja por query).
    await page.goto('/reservas');
    await page.waitForLoadState('networkidle');

    const submit = page.locator('a.search-button').first();
    await expect(submit).toBeVisible({ timeout: 10_000 });
    const href = await submit.getAttribute('href');
    expect(href).toMatch(/^\/reservas\/lugar-recogida\//);
    expect(href).not.toContain('?lugar_recogida='); // no es la forma vieja por query
  });

  test('SCEN-AL-03: deep-link con categoría aterriza en la card (slideover cerrado), y "Solicitar" lo abre', async ({ page }) => {
    await page.goto(RESERVAS_RESULT);
    await page.waitForLoadState('networkidle');

    // Extraer un código de gama realmente disponible (las cards son "Grupo X (...)").
    const code = await page.evaluate(() => {
      for (const b of Array.from(document.querySelectorAll('button'))) {
        const m = (b.textContent ?? '').match(/Grupo\s+([A-Z0-9]+)\s*\(/);
        if (m) return m[1];
      }
      return null;
    });
    test.skip(!code, 'Backend sin datos para la fecha de prueba (grid vacío)');

    // Entrar por el deep-link con categoría (el link que comparte el operador).
    await page.goto(`${RESERVAS_RESULT}/categoria/${(code as string).toLowerCase()}`);
    await page.waitForLoadState('networkidle');

    // La card de esa gama existe y está enfocable (ancla de scroll).
    const card = page.locator(`#categoria-${code}`);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // FLUJO OPERADOR: el slideover NO se auto-abre — el cliente ve los selectores
    // de seguro/adicionales en la card primero.
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveCount(0);

    // Los selectores de seguro viven en la card y están visibles.
    await expect(card.getByText(/Seguro/i).first()).toBeVisible();

    // "Solicitar este vehículo" abre el resumen (slideover).
    await card.getByRole('button', { name: /Solicitar este veh/i }).click();
    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });

    // Back cierra el slideover y NO deja <body> con pointer-events:none (regresión
    // #25/#65): en el link operador la URL ya trae /categoria, así que el open NO
    // debe empujar una entrada duplicada que reabra el resumen al retroceder.
    await page.goBack();
    await expect(dialog).toHaveCount(0);
    const bodyPE = await page.evaluate(() => getComputedStyle(document.body).pointerEvents);
    expect(bodyPE).not.toBe('none');
  });
});
