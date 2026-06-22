import { test, expect, type Page } from '@playwright/test';

/**
 * El botón "atrás" del navegador debe recorrer los pasos del slideover de
 * reserva (Datos → Resumen → listado), NO saltar al index perdiendo la búsqueda.
 *
 * Fix en CategorySelectionSection.vue: abrir el resumen y pasar a "datos"
 * empujan entradas de historial (pushState); un listener `popstate` reconcilia
 * el estado por la URL ya retrocedida. La X / Esc cierran del todo
 * (history.go(-n)). Tras enviar, un guard (lastSubmittedCode) evita reabrir.
 *
 * Requiere disponibilidad real (tarjetas). Sin backend de disponibilidad el
 * test se salta, igual que reservation-back-url-cleanup.
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-07-10' +
  '/fecha-devolucion/2026-07-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

async function gotoListingWithHistory(page: Page) {
  // index → search, para que exista una entrada de "listado" real en el historial.
  await page.goto('/');
  await page.goto(searchPath);
  await page.waitForLoadState('networkidle');
}

function cardButtons(page: Page) {
  return page.locator('.boton-seleccion');
}

test.describe('Reservation Back button — recorre pasos, no salta al index', () => {
  test('Back desde Resumen vuelve al listado (no al index), con tarjetas', async ({ page }) => {
    await gotoListingWithHistory(page);
    const cards = cardButtons(page);
    const count = await cards.count();
    test.skip(count === 0, 'Sin disponibilidad para la fecha de prueba (backend)');

    await cards.first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/categoria\//);

    await page.goBack();

    // Volvió al listado: misma URL de búsqueda, sin /categoria, diálogo cerrado,
    // tarjetas presentes (la página NO se re-montó perdiendo el listado).
    await expect(page).not.toHaveURL(/\/categoria\//);
    await expect(page).toHaveURL(/\/buscar-vehiculos\//);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(cardButtons(page).first()).toBeVisible();
  });

  test('Back desde Datos baja a Resumen (no cierra ni salta)', async ({ page }) => {
    await gotoListingWithHistory(page);
    const cards = cardButtons(page);
    test.skip((await cards.count()) === 0, 'Sin disponibilidad');

    await cards.first().click();
    await page.getByTestId('reservation-next-test').click(); // Siguiente → Datos
    await expect(page.getByText('Datos para reservar')).toBeVisible();
    await expect(page).toHaveURL(/reservar=/);

    await page.goBack();

    // Bajó a Resumen: diálogo sigue abierto, paso "Resumen de la selección".
    await expect(page.locator('[role="dialog"]').first()).toBeVisible();
    await expect(page.getByText('Resumen de la selección')).toBeVisible();
    await expect(page).not.toHaveURL(/reservar=/);
  });

  test('Cerrar (X) desde Datos cierra del todo y deja el body interactivo', async ({ page }) => {
    await gotoListingWithHistory(page);
    const cards = cardButtons(page);
    test.skip((await cards.count()) === 0, 'Sin disponibilidad');

    await cards.first().click();
    await page.getByTestId('reservation-next-test').click();
    await expect(page.getByText('Datos para reservar')).toBeVisible();

    // Escape (equivalente a la X de reka-ui) cierra desde cualquier paso.
    await page.keyboard.press('Escape');

    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/categoria\//);
    const bodyPe = await page.evaluate(() => getComputedStyle(document.body).pointerEvents);
    expect(bodyPe).not.toBe('none');
  });
});
