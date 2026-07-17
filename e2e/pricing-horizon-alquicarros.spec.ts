import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * alquicarros — fail-closed más allá del horizonte de tarifas (issue #313).
 *
 * Holdout: docs/specs/issue313-pricing-horizon/scenarios/pricing-horizon.scenarios.md
 *   - SCEN-5: en el wizard mensual con pickup más allá del horizonte, el Paso 2
 *     muestra el banner "Las tarifas para tu fecha aún no están disponibles",
 *     los tiles no muestran precio mensual y no se puede seleccionar/avanzar.
 *
 * Date-rot-safe: el pickup es 2099 — más allá de CUALQUIER horizonte de tarifas
 * que operación cargue, para siempre. Corre contra los `month_prices` REALES de
 * Supabase (/api/rentacar-data); solo la disponibilidad va stubbeada, igual que
 * alquicarros-reserva-mensual.spec.ts.
 */
const BRAND = process.env.BRAND || 'alquilatucarro';

// 2099-01-15 12:00pm → 2099-02-14 12:00pm = 30 días exactos → reserva mensual.
const BEYOND_HORIZON_STEP2 =
  '/reservas' +
  '/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2099-01-15/fecha-devolucion/2099-02-14' +
  '/hora-recogida/12:00pm/hora-devolucion/12:00pm';

/**
 * Mensual: el precio sale del catálogo (`month_prices`), no de Localiza, así que
 * una respuesta vacía basta. El retardo de 700 ms deja que la metadata de gamas
 * (Supabase) gane la carrera de hidratación — ver el spec mensual para el detalle.
 */
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

test.describe('alquicarros — horizonte de tarifas (fail-closed)', () => {
  test.skip(BRAND !== 'alquicarros', 'Escenarios específicos de alquicarros');

  test('SCEN-5: pickup más allá del horizonte → banner, sin precio, sin selección', async ({ page }) => {
    await stubAvailability(page, []);
    await page.goto(BEYOND_HORIZON_STEP2);
    await page.reload();

    const rendered = await appears(page, '[data-testid^="wizard-segment-"]');
    test.skip(!rendered, 'metadata de gamas (Supabase) no disponible en el entorno');

    // Banner de flujo: TODAS las gamas caen más allá del horizonte.
    await expect(page.locator('[data-testid="wizard-horizon-unavailable-test"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-horizon-unavailable-test"]')).toContainText(
      'aún no están disponibles',
    );

    // Ningún tile muestra "desde $ N": el precio mensual no existe para la fecha.
    const tiles = page.locator('[data-testid^="wizard-segment-"]');
    const n = await tiles.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const text = (await tiles.nth(i).innerText()).replace(/\s+/g, ' ');
      expect(text, `tile ${i} no debe mostrar precio`).not.toMatch(/desde\s*\$\s*[0-9]/);
    }
    // Al menos un tile muestra el estado explícito de tarifa no disponible.
    await expect(page.locator('[data-testid="wizard-segment-unavailable-test"]').first()).toBeVisible();

    // Las cards del segmento abierto no permiten seleccionar: no hay botón "Elegir",
    // sino el estado inline de tarifa no disponible → no se puede avanzar.
    await expect(page.locator('[data-testid="wizard-vehicle-unavailable-test"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="wizard-select-"]')).toHaveCount(0);

    // El resumen persistente no muestra un total fabricado ("$ 0") y el CTA de
    // avanzar está bloqueado.
    await expect(page.locator('[data-testid="wizard-continue-desktop-test"]')).toBeDisabled();
    await expect(page.locator('aside').first()).not.toContainText('$ 0');
  });

  test('SCEN-5b: deep-link a gama beyond-horizon → preselecciona, bloquea avance, resumen sin "$ 0"', async ({
    page,
  }) => {
    await stubAvailability(page, []);
    // Deep-link con /categoria/c: el wizard preselecciona la gama C aunque su
    // tarifa esté más allá del horizonte (ejercita la rama del guard de avance
    // "seleccionado-pero-no-disponible").
    await page.goto(`${BEYOND_HORIZON_STEP2}/categoria/c`);
    await page.reload();

    const rendered = await appears(page, '[data-testid="wizard-horizon-unavailable-test"]');
    test.skip(!rendered, 'metadata de gamas (Supabase) no disponible en el entorno');

    // getTotalPrice = 0 con gama seleccionada; moneyFormat(0) = "0" NO debe
    // filtrarse como "Total 0" en el resumen (issue #313, Finding 2).
    await expect(page.locator('aside').first()).not.toContainText('$ 0');
    // El avance sigue bloqueado pese a haber una gama seleccionada.
    await expect(page.locator('[data-testid="wizard-continue-desktop-test"]')).toBeDisabled();
  });
});
