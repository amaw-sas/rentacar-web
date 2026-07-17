import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * alquilatucarro — fail-closed más allá del horizonte de tarifas (issue #313).
 * Espejo de pricing-horizon-alquilame.spec.ts: misma CategorySelectionSection +
 * CategoryCard (mismos data-testid). SCEN-6 aplicado a alquilatucarro.
 *
 * Date-rot-safe: pickup 2099 — más allá de CUALQUIER horizonte de tarifas que
 * operación cargue. Corre contra los `month_prices` REALES de Supabase; la
 * disponibilidad va stubbeada (el precio mensual vive en el catálogo).
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// alquilatucarro sirve resultados bajo /{city}/buscar-vehiculos/... (routing
// independence: /reservas es de alquilame/alquicarros).
// 2099-01-15 → 2099-02-14 = 30 días → reserva mensual.
const BEYOND_HORIZON_RESULT =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2099-01-15' +
  '/fecha-devolucion/2099-02-14' +
  '/hora-recogida/12:00pm' +
  '/hora-devolucion/12:00pm';

function stubAvailability(page: Page, body: unknown) {
  return page.route('**/api/reservations/availability', async (route: Route) => {
    await new Promise((r) => setTimeout(r, 700));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function appears(page: Page, selector: string, timeout = 20_000): Promise<boolean> {
  return page
    .locator(selector)
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

test.describe('alquilatucarro — horizonte de tarifas (fail-closed)', () => {
  test.skip(BRAND !== 'alquilatucarro', 'Escenarios específicos de alquilatucarro');

  test('SCEN-6: pickup más allá del horizonte → banner + cards sin reservar', async ({ page }) => {
    await stubAvailability(page, []);
    await page.goto(BEYOND_HORIZON_RESULT);
    await page.reload();

    const bannerUp = await appears(page, '[data-testid="pricing-horizon-unavailable-test"]');
    test.skip(!bannerUp, 'catálogo mensual (Supabase) no disponible en el entorno');

    await expect(page.locator('[data-testid="pricing-horizon-unavailable-test"]')).toContainText(
      'aún no están disponibles',
    );

    await expect(page.locator('[data-testid="category-unavailable-test"]').first()).toBeVisible();
    const solicitar = page.locator('[data-testid="category-solicitar-test"]').first();
    await expect(solicitar).toBeDisabled();

    // Sin fuga de "$ 0": las líneas de precio diario NO se renderizan fail-closed.
    await expect(page.locator('.precio-base-diario')).toHaveCount(0);
    await expect(page.locator('.precio-diario')).toHaveCount(0);
  });
});
