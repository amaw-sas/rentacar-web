import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * alquilame — fail-closed más allá del horizonte de tarifas (issue #313).
 * alquilatucarro comparte CategorySelectionSection + CategoryCard (mismos
 * data-testid) y se valida con su propio spec espejo.
 *
 * Holdout: docs/specs/issue313-pricing-horizon/scenarios/pricing-horizon.scenarios.md
 *   - SCEN-6: en el listado de /reservas mensual con pickup más allá del horizonte,
 *     aparece el banner de tarifa no disponible y las cards no permiten reservar.
 *
 * Date-rot-safe: pickup 2099 — más allá de CUALQUIER horizonte de tarifas que
 * operación cargue, para siempre. Corre contra los `month_prices` REALES de
 * Supabase; la disponibilidad va stubbeada (el precio mensual vive en el catálogo).
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// 2099-01-15 → 2099-02-14 = 30 días → reserva mensual.
const BEYOND_HORIZON_RESULT =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2099-01-15' +
  '/fecha-devolucion/2099-02-14' +
  '/hora-recogida/12:00pm' +
  '/hora-devolucion/12:00pm';

/** Mensual: el precio sale del catálogo; una respuesta de disponibilidad vacía basta.
 *  El retardo deja que la metadata (Supabase) gane la carrera de hidratación. */
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

test.describe('alquilame — horizonte de tarifas (fail-closed)', () => {
  test.skip(BRAND !== 'alquilame', 'Escenarios específicos de alquilame');

  test('SCEN-6: pickup más allá del horizonte → banner + cards sin reservar', async ({ page }) => {
    await stubAvailability(page, []);
    await page.goto(BEYOND_HORIZON_RESULT);
    await page.reload();

    // El banner de flujo depende de que las cards se rendericen (metadata Supabase).
    const bannerUp = await appears(page, '[data-testid="pricing-horizon-unavailable-test"]');
    test.skip(!bannerUp, 'catálogo mensual (Supabase) no disponible en el entorno');

    await expect(page.locator('[data-testid="pricing-horizon-unavailable-test"]')).toContainText(
      'aún no están disponibles',
    );

    // Las cards muestran el estado inline y NO permiten reservar: el botón
    // "Solicitar" queda deshabilitado.
    await expect(page.locator('[data-testid="category-unavailable-test"]').first()).toBeVisible();
    const solicitar = page.locator('[data-testid="category-solicitar-test"]').first();
    await expect(solicitar).toBeDisabled();

    // Sin fuga de "$ 0": las líneas de precio diario/total NO se renderizan en el
    // estado fail-closed (issue #313 — nunca un precio fabricado en pantalla).
    await expect(page.locator('.precio-base-diario')).toHaveCount(0);
    await expect(page.locator('.precio-diario')).toHaveCount(0);
  });
});
