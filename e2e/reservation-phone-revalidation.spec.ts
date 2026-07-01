import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/2026-07-01-phone-field-revalidation/scenarios/
 *          phone-field-revalidation.scenarios.md
 * Issue:   https://github.com/amaw-sas/rentacar-web/issues/276
 *
 * VueTelInput no se integra con UFormField (no usa useFormField), así que UForm
 * nunca revalida `telefono` con sus propios eventos: el error del campo solo
 * aparece en el submit completo y, una vez visible, queda OBSOLETO — no se quita
 * al corregir el número a uno válido, solo al reenviar. El fix (issue #276)
 * puentea la revalidación desde usePhoneField: @blur + watch debounced que
 * revalida `telefono` cuando ya hay error, para que se limpie al corregir.
 *
 * Backend: availability se stubea (page.route). El categoryCode debe ser una key
 * real de vehicleCategories (SSR/Supabase) o no renderiza tarjeta — 'C' es real
 * (ver e2e/reservation-a11y-single-dialog.spec.ts, misma convención).
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-07-10' +
  '/fecha-devolucion/2026-07-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

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
    referenceToken: 'STUB-TOKEN-276',
    rateQualifier: 'STUB',
  },
];

// El mensaje de error es exclusivo del campo teléfono: ninguna otra validación
// del formulario menciona "teléfono"/"WhatsApp", así que aísla el error sin
// necesitar llenar el resto de campos.
const PHONE_INVALID_ERROR = 'Número de teléfono o WhatsApp no válido';

async function stubAvailability(page: Page) {
  await page.route('**/api/reservations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AVAILABILITY_STUB),
    }),
  );
}

/** Navega a la búsqueda y confirma que hay tarjetas; devuelve el code o null. */
async function gotoSearchAndGetCode(page: Page): Promise<string | null> {
  await stubAvailability(page);
  await page.goto(searchPath);
  await page.waitForLoadState('domcontentloaded');
  const rendered = await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll('button')).some((b) =>
          /Grupo\s+[A-Z0-9]+\s*\(/.test(b.textContent ?? ''),
        ),
      { timeout: 20_000 },
    )
    .then(() => true)
    .catch(() => false);
  return rendered ? STUB_CODE : null;
}

/** Abre el paso "Datos" por deep-link y devuelve el input de teléfono visible. */
async function openReservationForm(page: Page) {
  await page.goto(`${searchPath}/categoria/${STUB_CODE}?reservar=${STUB_CODE}`);
  await page.waitForLoadState('domcontentloaded');
  const phone = page.locator('input#telefono');
  await expect(phone).toBeVisible({ timeout: 15_000 });
  return phone;
}

test.describe('Reserva — revalidación del teléfono (issue #276) — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-276-01: corregir el teléfono limpia el error SIN reenviar', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas (SSR vehicleCategories no disponible)');

    const phone = await openReservationForm(page);

    // Número inválido (largo suficiente para pasar minLength y llegar a la regla
    // isValidPhoneNumber → mensaje "no válido").
    await phone.click();
    await phone.pressSequentially('300123', { delay: 60 });

    // Submit completo: es la ÚNICA vía por la que hoy se valida el teléfono.
    await page.getByRole('button', { name: /Solicitar reserva/i }).click();
    await expect(page.getByText(PHONE_INVALID_ERROR)).toBeVisible({ timeout: 10_000 });

    // Completar a un número válido (como el usuario: sigue tecleando hasta
    // 3001234567, que VueTelInput reformatea a "+57 300 1234567") y perder foco.
    // NO se vuelve a pulsar "Solicitar reserva".
    await phone.click();
    await phone.press('End');
    await phone.pressSequentially('4567', { delay: 60 });
    await phone.blur();

    // El error obsoleto desaparece por su cuenta (blur + watch debounced).
    await expect(page.getByText(PHONE_INVALID_ERROR)).toHaveCount(0, { timeout: 10_000 });
  });

  test('SCEN-276-01b: el error se limpia al terminar de escribir (debounce) SIN perder foco', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    const phone = await openReservationForm(page);

    await phone.click();
    await phone.pressSequentially('300123', { delay: 60 });
    await page.getByRole('button', { name: /Solicitar reserva/i }).click();
    await expect(page.getByText(PHONE_INVALID_ERROR)).toBeVisible({ timeout: 10_000 });

    // Completar a válido y quedarse EN el campo (sin blur): solo el watch
    // debounced puede limpiar el error obsoleto — cubre la rama que SCEN-276-01
    // (que hace blur) no ejercita.
    await phone.press('End');
    await phone.pressSequentially('4567', { delay: 60 });
    await expect(page.locator('input#telefono')).toBeFocused();
    await expect(page.getByText(PHONE_INVALID_ERROR)).toHaveCount(0, { timeout: 10_000 });
    // El campo sigue enfocado: nunca se perdió el foco.
    await expect(phone).toBeFocused();
  });

  test('SCEN-276-02: un número válido nunca muestra el error "no válido"', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    const phone = await openReservationForm(page);

    await phone.click();
    await phone.pressSequentially('3001234567', { delay: 60 });
    await phone.blur();

    await expect(page.getByText(PHONE_INVALID_ERROR)).toHaveCount(0);
  });

  test('SCEN-276-03: control — el campo nativo "Nombres" sí limpia su error al instante', async ({
    page,
  }) => {
    const code = await gotoSearchAndGetCode(page);
    test.skip(!code, 'Sin categorías renderizadas');

    await openReservationForm(page);

    // Submit con "Nombres" vacío → error nativo del UInput.
    await page.getByRole('button', { name: /Solicitar reserva/i }).click();
    const nombres = page.locator('input[autocomplete="given-name"]');
    await expect(nombres).toBeVisible();
    await expect(page.getByText('Escribe tus nombres')).toBeVisible({ timeout: 10_000 });

    // Corregir + blur: un UInput nativo (validateOn input/blur/change) limpia su
    // error al instante — prueba de contraste de que el fix del teléfono no
    // alteró el comportamiento nativo de @nuxt/ui.
    await nombres.fill('Pablo');
    await nombres.blur();
    await expect(page.getByText('Escribe tus nombres')).toHaveCount(0, { timeout: 10_000 });
  });
});
