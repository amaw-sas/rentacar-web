import { test, expect, type Route } from '@playwright/test';

/**
 * Issue #10 — silent failure when /api/reservations/availability returns
 * a structured Localiza error. Holdout scenarios at
 *   docs/specs/2026-05-04-availability-error-feedback/scenarios/
 *
 * Coverage in this file:
 *   SCEN-001: no_available_categories_error → inline "¡Oops!" block
 *   SCEN-002: generic Localiza error      → toast (specific message)
 *   SCEN-003: server_error                → "Servicio temporalmente no disponible"
 *   SCEN-005: empty admin data + error    → some visible feedback
 *   SCEN-006: issue #10 reproduction URL  → inline "¡Oops!"
 *
 * /api/rentacar-data is fetched server-side from real Supabase. The tests
 * rely on `bogota-aeropuerto` and `monteria-aeropuerto` slugs existing in
 * production data — both are canonical (see `useDefaultRouteParams.ts`).
 *
 * The brand under test is selected by the `BRAND` env var and hits the
 * matching dev server (see playwright.config.ts).
 */

const NO_AVAILABILITY_BODY = {
  error: 'no_available_categories_error',
  message:
    'Lo sentimos, No se encontraron vehículos disponibles, inténta cambiando el día o la sede de recogida',
  shortText: 'LLNRAG009',
};

const OUT_OF_SCHEDULE_BODY = {
  error: 'out_of_schedule_pickup_date_error',
  message: 'La fecha de recogida está fuera del horario de operación de la sede',
  shortText: 'LLNRRE010',
};

const SERVER_ERROR_BODY = {
  error: 'server_error',
  message: 'El servicio no está disponible en este momento.',
};

function stubAvailability(body: Record<string, unknown>) {
  return (route: Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
}

const BOGOTA_SEARCH_URL =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-10-04' +
  '/fecha-devolucion/2026-11-03' +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

const ARMENIA_MONTERIA_REPRODUCTION_URL =
  '/armenia/buscar-vehiculos' +
  '/lugar-recogida/monteria-aeropuerto' +
  '/lugar-devolucion/monteria-aeropuerto' +
  '/fecha-recogida/2026-10-04' +
  '/fecha-devolucion/2026-11-03' +
  '/hora-recogida/08:00am' +
  '/hora-devolucion/08:00am';

test.describe('Availability error feedback (issue #10)', () => {
  test('SCEN-001: no_available_categories_error renders inline "¡Oops!" block', async ({
    page,
  }) => {
    await page.route(
      '**/api/reservations/availability',
      stubAvailability(NO_AVAILABILITY_BODY),
    );

    await page.goto(BOGOTA_SEARCH_URL);

    const oopsBlock = page.getByText('¡Oops!');
    await expect(oopsBlock).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Nos quedamos sin carritos/)).toBeVisible();

    const errorToast = page.getByRole('alert').filter({
      hasText: 'Lo sentimos, No se encontraron',
    });
    await expect(errorToast).toHaveCount(0);

    await expect(
      page.getByText('Servicio temporalmente no disponible'),
    ).toHaveCount(0);
  });

  test('SCEN-002: generic Localiza error surfaces a toast with the specific message', async ({
    page,
  }) => {
    await page.route(
      '**/api/reservations/availability',
      stubAvailability(OUT_OF_SCHEDULE_BODY),
    );

    await page.goto(BOGOTA_SEARCH_URL);

    // NuxtUI 4 renders error-color toasts with role="alert" (not "status").
    const toast = page.getByRole('alert').filter({
      hasText: 'La fecha de recogida está fuera del horario',
    });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('¡Oops!')).toHaveCount(0);
    await expect(
      page.getByText('Servicio temporalmente no disponible'),
    ).toHaveCount(0);
  });

  test('SCEN-003: server_error renders WhatsApp fallback block', async ({ page }) => {
    await page.route(
      '**/api/reservations/availability',
      stubAvailability(SERVER_ERROR_BODY),
    );

    await page.goto(BOGOTA_SEARCH_URL);

    await expect(
      page.getByText('Servicio temporalmente no disponible'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /WhatsApp/ })).toBeVisible();

    await expect(page.getByText('¡Oops!')).toHaveCount(0);
  });

  test('SCEN-005: when admin data is empty, availability error still surfaces feedback', async ({
    page,
  }) => {
    await page.route('**/api/rentacar-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: [],
          branches: [],
          extras: undefined,
          vehicleCategories: {},
        }),
      }),
    );
    await page.route(
      '**/api/reservations/availability',
      stubAvailability(NO_AVAILABILITY_BODY),
    );

    await page.goto(BOGOTA_SEARCH_URL);

    const anyFeedback = page
      .getByText('¡Oops!')
      .or(page.getByText('Servicio temporalmente no disponible'))
      .or(
        page.locator('[role="status"]').filter({ hasText: NO_AVAILABILITY_BODY.message }),
      );

    await expect(anyFeedback.first()).toBeVisible({ timeout: 15_000 });
  });

  test('SCEN-006: regression guard — issue #10 exact reproduction URL', async ({
    page,
  }) => {
    await page.route(
      '**/api/reservations/availability',
      stubAvailability(NO_AVAILABILITY_BODY),
    );

    await page.goto(ARMENIA_MONTERIA_REPRODUCTION_URL);

    await expect(page.getByText('¡Oops!')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Nos quedamos sin carritos/)).toBeVisible();
  });
});
