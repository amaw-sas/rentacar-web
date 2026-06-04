import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/issue-65-a11y-reservation-slideover/scenarios/
 *          a11y-reservation-slideover.scenarios.md
 * Issue:   https://github.com/amaw-sas/rentacar-web/issues/65 (épico #63, Ola 0)
 *
 * Invariante central: en el flujo de reserva (Resumen → Datos) hay en todo
 * momento 0 o 1 [role=dialog] visible; si hay uno, tiene aria-modal="true".
 * Antes del fix, "Datos" estaba anidado en el #footer de "Resumen" y se abrían
 * dos diálogos modales simultáneos. Tras des-anidar a hermanos mutuamente
 * excluyentes, solo uno está activo por ruta de entrada.
 *
 * Backend: requiere categorías reales (admin availability). Sin ellas, los
 * tests dependientes hacen test.skip — misma convención que
 * e2e/reservation-back-url-cleanup.spec.ts. Fechas futuras para maximizar
 * disponibilidad real.
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-07-10' +
  '/fecha-devolucion/2026-07-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

// Availability is fetched CLIENT-SIDE (useFetchCategoriesAvailabilityData),
// so page.route intercepts it. The admin backend (NUXT_RENTACAR_ADMIN_URL)
// points at a local :3000 that isn't running in this env, so we stub. The
// categoryCode MUST be a real vehicleCategories key (loaded via SSR from
// Supabase) or renderableCategories drops it and no card renders — 'C' is real
// (see /api/rentacar-data). estimatedTotalAmount != 999999999 → real card,
// not a "No disponible" placeholder.
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
    totalCoverageUnitCharge: 0,
    referenceToken: 'STUB-TOKEN-65',
    rateQualifier: 'STUB',
  },
];

async function stubAvailability(page: Page) {
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY_STUB),
    }),
  );
}

async function firstAvailableCategoryCode(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(
      (b) => b.textContent ?? '',
    );
    for (const text of buttons) {
      const m = text.match(/Grupo\s+([A-Z0-9]+)\s*\(/);
      if (m) return m[1];
    }
    return null;
  });
}

/** Navigate to the search page and return the first rendered category code, or
 * null (caller skips). Avoids networkidle: dev server may retry admin calls. */
async function gotoSearchAndGetCode(page: Page): Promise<string | null> {
  await stubAvailability(page);
  await page.goto(searchPath);
  await page.waitForLoadState('domcontentloaded');
  return await Promise.race([
    page
      .waitForFunction(
        () =>
          Array.from(document.querySelectorAll('button')).some((b) =>
            /Grupo\s+[A-Z0-9]+\s*\(/.test(b.textContent ?? ''),
          ),
        { timeout: 20_000 },
      )
      .then(() => firstAvailableCategoryCode(page))
      .catch(() => null),
    page.waitForTimeout(20_000).then(() => null),
  ]);
}

const visibleDialogs = (page: Page) => page.locator('[role="dialog"]:visible');
const visibleModalDialogs = (page: Page) =>
  page.locator('[role="dialog"][aria-modal="true"]:visible');

test.describe('Reserva a11y — un solo slideover modal activo (issue #65) — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-001: deep-link ?reservar=X abre exactamente un diálogo modal y es "Datos"', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas (admin availability no disponible)');

    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');

    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 15_000 });
    await expect(visibleModalDialogs(page)).toHaveCount(1);
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Datos para reservas' }),
    ).toBeVisible();
    // El de "Resumen" NO debe estar visible.
    await expect(
      page.locator('[role="dialog"]:visible', { hasText: 'Resumen de la reserva' }),
    ).toHaveCount(0);
  });

  test('SCEN-001b: cold-load /categoria/X (sin reservar) abre solo "Resumen"', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    await page.goto(`${searchPath}/categoria/${code}`);
    await page.waitForLoadState('domcontentloaded');

    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 15_000 });
    await expect(visibleModalDialogs(page)).toHaveCount(1);
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Resumen de la reserva' }),
    ).toBeVisible();
  });

  test('SCEN-002a/002/003/004/005: flujo click — un diálogo por paso + URL', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    // SCEN-002a: click en el CTA de la tarjeta → solo "Resumen".
    // El CTA que dispara setSelectedCategory es "Solicitar este vehículo"
    // (CategoryCard.vue goNextStep), no el título "Grupo X".
    await page.getByRole('button', { name: 'Solicitar este vehículo' }).first().click();
    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 10_000 });
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Resumen de la reserva' }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/categoria/${code.toLowerCase()}$`));

    // SCEN-002 + SCEN-004: "Siguiente" → solo "Datos" + URL gana ?reservar=X.
    // Selector estable por data-testid: hay otros role=button con nombre
    // accesible "Siguiente"/"Volver" en la página (convención del proyecto).
    await page.getByTestId('reservation-next-test').click();
    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 10_000 });
    const formDialog = page.getByRole('dialog').filter({ hasText: 'Datos para reservas' });
    await expect(formDialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`reservar=${code}`));

    // SCEN-003: "Volver" en Datos → reabre "Resumen" + URL pierde ?reservar.
    await page.getByTestId('reservation-form-back-test').click();
    await expect(visibleDialogs(page)).toHaveCount(1, { timeout: 10_000 });
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Resumen de la reserva' }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/categoria/${code.toLowerCase()}$`));
    await expect(page).not.toHaveURL(/reservar=/);

    // SCEN-005: "Volver" en Resumen → cierra todo + URL base (sin /categoria).
    await page.getByTestId('reservation-resume-back-test').click();
    await expect(visibleDialogs(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/categoria\//);
    await expect(page).not.toHaveURL(/reservar=/);
  });

  test('SCEN-007: campos de texto exponen autocomplete estándar; identificación no', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Datos para reservas' }),
    ).toBeVisible({ timeout: 15_000 });

    const dialog = page.getByRole('dialog').filter({ hasText: 'Datos para reservas' });
    await expect(dialog.locator('input[autocomplete="given-name"]')).toHaveCount(1);
    await expect(dialog.locator('input[autocomplete="family-name"]')).toHaveCount(1);
    await expect(dialog.locator('input[autocomplete="email"]')).toHaveCount(1);
    // Identificación (número): no fabrica un token de datos personales. El
    // default de @nuxt/ui UInput es autocomplete="off" (señal correcta de
    // no-autocompletar para un documento de identidad). Amend SCEN-007
    // (aprobado 2026-06-04): la premisa "tampoco off" era falsa — UInput
    // siempre pone "off" y no es removible sin degradar la a11y.
    const idInput = dialog.getByRole('textbox', { name: 'Número de identificación' });
    await expect(idInput).toBeVisible();
    await expect(idInput).toHaveAttribute('autocomplete', 'off');
    // Solo el campo de identificación lleva "off": no se fabricó un token
    // personal (given-name/family-name/email/tel) sobre un campo de documento.
    await expect(dialog.locator('input[autocomplete="off"]')).toHaveCount(1);
  });

  test('SCEN-006: regresión #25 — Back tras el flujo no deja el body bloqueado', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    // Abrir "Datos" por deep-link: diálogo modal (aria-modal="true"). Nota: en
    // esta versión de reka-ui con overlay=false el <body> NO recibe
    // pointer-events:none — la modalidad es por focus-trap + aria-modal, no por
    // lock de puntero. El guard de #25 que importa es post-Back, abajo.
    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');
    const datosDialog = page.getByRole('dialog').filter({ hasText: 'Datos para reservas' });
    await expect(datosDialog).toBeVisible({ timeout: 15_000 });
    expect(await datosDialog.getAttribute('aria-modal')).toBe('true');

    // Simular navegación post-submit (los refs de slideover siguen true hasta el
    // unmount; onBeforeRouteLeave debe cerrarlos). Mismo patrón que
    // reservation-submit-back-unlocks-searcher.spec.ts.
    await page.evaluate(() => {
      const clean = window.location.pathname.replace(/\/categoria\/[^/]+$/, '');
      window.history.replaceState(window.history.state, '', clean);
      const app = (window as unknown as {
        useNuxtApp(): { $router: { push: (p: string) => Promise<unknown> } };
      }).useNuxtApp();
      return app.$router.push('/reservado/TEST65');
    });
    await page.waitForURL(/\/reservado\/TEST65$/, { timeout: 10_000 });

    // SPA Back.
    await page.goBack();
    await page.waitForURL(/buscar-vehiculos/, { timeout: 10_000 });

    // Body interactivo + sin diálogo residual.
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents), {
        timeout: 10_000,
      })
      .not.toBe('none');
    await expect(visibleDialogs(page)).toHaveCount(0);
  });

  test('SCEN-010: Escape en "Datos" (sin Volver) cierra y limpia ?reservar de la URL', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Datos para reservas' }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`reservar=${code}`));

    // Cierre por Escape (ruta a11y primaria), NO por "Volver".
    await page.keyboard.press('Escape');

    await expect(visibleDialogs(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/reservar=/);
    await expect(page).not.toHaveURL(/\/categoria\//);
  });

  test('SCEN-008: teléfono — nombre accesible "Teléfono" + autocomplete tel, sin aria-label viejo', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');
    const dialog = page.getByRole('dialog').filter({ hasText: 'Datos para reservas' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Nombre accesible computado == "Teléfono" (vía <label for="telefono">).
    await expect(
      dialog.getByRole('textbox', { name: 'Teléfono', exact: true }),
    ).toBeVisible();
    // El input de teléfono expone autocomplete="tel".
    await expect(dialog.locator('input#telefono[autocomplete="tel"]')).toHaveCount(1);
    // Ya NO existe el aria-label viejo "Número de teléfono".
    await expect(
      dialog.getByRole('textbox', { name: 'Número de teléfono' }),
    ).toHaveCount(0);
  });
});
