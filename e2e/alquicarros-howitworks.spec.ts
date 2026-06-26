import { test, expect } from '@playwright/test';

/**
 * Holdout E2E para el rediseño de "Cómo Funciona" de alquicarros.
 * Codifica SCEN-HW-01..06 (DOM observable). SCEN-HW-07 (no regresión de otras
 * marcas) se valida por git diff, no aquí.
 *
 * Solo aplica a alquicarros; bajo otra BRAND el #how-it-works tiene otra
 * estructura, así que se omite.
 */
const isAlquicarros = process.env.BRAND === 'alquicarros';

test.describe('Cómo Funciona alquicarros — rediseño stepper + iconos', () => {
  test.skip(!isAlquicarros, 'Rediseño exclusivo de alquicarros');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await expect(page.locator('#how-it-works')).toBeVisible();
  });

  test('SCEN-HW-01: stepper con los 3 pasos activos (naranja)', async ({ page }) => {
    const ORANGE = 'rgb(239, 150, 0)';
    const rail = page.getByTestId('howitworks-stepper-test');
    await expect(rail).toBeVisible();

    const m1 = rail.getByTestId('step-marker-1');
    const m2 = rail.getByTestId('step-marker-2');
    const m3 = rail.getByTestId('step-marker-3');
    await expect(m1).toBeVisible();
    await expect(m2).toBeVisible();
    await expect(m3).toBeVisible();
    await expect(m1).toHaveText('1');
    await expect(m2).toHaveText('2');
    await expect(m3).toHaveText('3');

    // Los 3 marcadores con fondo naranja de marca #ef9600.
    expect(await m1.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ORANGE);
    expect(await m2.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ORANGE);
    expect(await m3.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ORANGE);

    // Ambos conectores naranja.
    expect(await rail.getByTestId('step-connector-1').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ORANGE);
    expect(await rail.getByTestId('step-connector-2').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ORANGE);
  });

  test('SCEN-HW-02: cada card usa un icono de línea naranja, sin fotos', async ({ page }) => {
    const cards = page.getByTestId('howitworks-step-card');
    await expect(cards).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const icon = cards.nth(i).getByTestId('step-icon');
      await expect(icon).toBeVisible();
      const color = await icon.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBe('rgb(239, 150, 0)');
      await expect(cards.nth(i).locator('img')).toHaveCount(0);
    }
  });

  test('SCEN-HW-03: copy corto del mockup', async ({ page }) => {
    const section = page.locator('#how-it-works');
    await expect(section.getByRole('heading', { level: 3 }).nth(0)).toHaveText('Elige ciudad y auto');
    await expect(section.getByRole('heading', { level: 3 }).nth(1)).toHaveText('Reserva en minutos');
    await expect(section.getByRole('heading', { level: 3 }).nth(2)).toHaveText('Recoge y conduce');

    await expect(section).toContainText('Selecciona la ciudad y el vehículo que mejor se adapte a tu viaje.');
    await expect(section).toContainText('Elige fechas, confirma y recibe tu confirmación al instante.');
    await expect(section).toContainText('Recoge tu auto en la sucursal seleccionada y comienza tu aventura.');
  });

  test('SCEN-HW-04: sin imágenes dentro de la sección', async ({ page }) => {
    await expect(page.locator('#how-it-works img')).toHaveCount(0);
  });

  test('SCEN-HW-05: trust footer preservado', async ({ page }) => {
    const section = page.locator('#how-it-works');
    await expect(section).toContainText('Seguridad • Transparencia • Soporte 24/7');
    await expect(section).toContainText('Estamos contigo en todo el proceso.');
  });

  test('SCEN-HW-06: presente en home y en city page', async ({ page }) => {
    await expect(page.locator('#how-it-works')).toBeVisible(); // home (beforeEach)
    await page.goto('/bogota');
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await expect(page.locator('#how-it-works')).toBeVisible();
  });
});
