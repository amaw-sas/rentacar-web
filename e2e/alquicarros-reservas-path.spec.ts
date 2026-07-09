import { test, expect } from '@playwright/test';

/**
 * alquicarros — wizard de /reservas por PATH (routing independence, fase 3).
 *
 * Holdout: docs/specs/alquicarros-routing/scenarios/reservas-path-migration.scenarios.md
 *   - SCEN-ACP-01: /{city}/buscar-vehiculos/<resto> → 301 /reservas/<resto> (server middleware).
 *   - SCEN-ACP-02: el buscador de /reservas limpio arma un PATH /reservas/lugar-recogida/... (no query).
 *   - SCEN-ACP-03: deep-link /reservas/.../categoria/[X] → wizard en Paso 3 (Seguro) con la gama X.
 *   - SCEN-ACP-05: al avanzar en una página PATH, la URL refleja `?paso=` (híbrido) sin perder el PATH.
 *
 * Solo alquicarros. Requiere backend de disponibilidad (dashboard) para el wizard.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

const RESULT_TAIL =
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-08-15' +
  '/fecha-devolucion/2026-08-20' +
  '/hora-recogida/12:00pm' +
  '/hora-devolucion/12:00pm';
const RESERVAS_RESULT = `/reservas${RESULT_TAIL}`;
const LEGACY_BUSCAR_VEHICULOS = `/bogota/buscar-vehiculos${RESULT_TAIL}`;

test.describe('alquicarros — wizard /reservas por PATH', () => {
  test.skip(BRAND !== 'alquicarros', 'Escenarios específicos de alquicarros');

  test('SCEN-ACP-01: buscar-vehiculos redirige 301 → /reservas conservando el resto del path', async ({ request }) => {
    const res = await request.get(LEGACY_BUSCAR_VEHICULOS, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toBe(RESERVAS_RESULT);
  });

  test('SCEN-ACP-01: la variante con categoría preserva la gama en el redirect (link operador)', async ({ request }) => {
    const res = await request.get(`${LEGACY_BUSCAR_VEHICULOS}/categoria/c`, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toBe(`${RESERVAS_RESULT}/categoria/c`);
  });

  test('SCEN-ACP-02: el buscador de /reservas limpio (Paso 1) apunta a un PATH /reservas', async ({ page }) => {
    await page.goto('/reservas');
    await page.waitForLoadState('networkidle');
    const submit = page.locator('a.search-button').first();
    await expect(submit).toBeVisible({ timeout: 10_000 });
    const href = await submit.getAttribute('href');
    expect(href).toMatch(/^\/reservas\/lugar-recogida\//);
    expect(href).not.toContain('?lugar_recogida=');
  });

  test('SCEN-ACP-03/05: deep-link con categoría → Paso 3 (Seguro) con gama; avanzar refleja ?paso=', async ({ page }) => {
    // Confirmar disponibilidad de una gama en la página de resultados.
    await page.goto(RESERVAS_RESULT);
    await page.waitForLoadState('networkidle');
    const code = await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const m = (el.textContent ?? '').match(/Grupo\s+([A-Z0-9]+)\s*\(/);
        if (m) return m[1];
      }
      return null;
    });
    test.skip(!code, 'Backend sin datos para la fecha de prueba');

    await page.goto(`${RESERVAS_RESULT}/categoria/${(code as string).toLowerCase()}`);
    await page.waitForLoadState('networkidle');

    // SCEN-ACP-03: el paso activo del stepper (aria-current="step") es Seguro (Paso 3).
    const activeStep = page.locator('[aria-current="step"]').first();
    await expect(activeStep).toContainText(/Seguro/i, { timeout: 10_000 });

    // SCEN-ACP-05: avanzar (Continuar) refleja ?paso= en la URL SIN perder el PATH.
    await page.getByRole('button', { name: /Continuar/i }).first().click();
    await expect(page).toHaveURL(/\/reservas\/lugar-recogida\/[^?]*\?paso=/, { timeout: 10_000 });
  });
});
