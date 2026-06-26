import { test, expect } from '@playwright/test';

/**
 * Holdout E2E para el rediseño de "¿Por Qué Elegir …?" de alquicarros.
 * Codifica SCEN-VP-01..04 (DOM observable). SCEN-VP-05 (no regresión de otras
 * marcas) se valida por git diff.
 *
 * Solo aplica a alquicarros; bajo otra BRAND la sección difiere, así que se omite.
 */
const isAlquicarros = process.env.BRAND === 'alquicarros';

test.describe('ValueProps alquicarros — rediseño UIcon + cards', () => {
  test.skip(!isAlquicarros, 'Rediseño exclusivo de alquicarros');

  // La sección, localizada por su heading.
  const section = (page: import('@playwright/test').Page) =>
    page.locator('section', { hasText: '¿Por Qué Elegir' }).first();

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await section(page).scrollIntoViewIfNeeded();
    await expect(section(page)).toBeVisible();
  });

  test('SCEN-VP-01: 4 props con icono UIcon en badge naranja', async ({ page }) => {
    const cards = section(page).getByTestId('valueprop-card');
    await expect(cards).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const badge = cards.nth(i).getByTestId('valueprop-icon-badge');
      await expect(badge).toBeVisible();
      const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toBe('rgb(239, 150, 0)');
      // El icono UIcon vive dentro del badge y es visible.
      await expect(badge.getByTestId('valueprop-icon')).toBeVisible();
    }
  });

  test('SCEN-VP-02: cada prop es una card centrada', async ({ page }) => {
    const cards = section(page).getByTestId('valueprop-card');
    await expect(cards).toHaveCount(4);

    const radius = await cards.first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius).toBeGreaterThanOrEqual(12);
    const align = await cards.first().evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe('center');
  });

  test('SCEN-VP-03: copy y cifra viva preservados', async ({ page }) => {
    const sec = section(page);
    for (const title of ['Sin Anticipos', 'Flota Nueva', 'Asistencia 24/7', 'Cobertura Nacional']) {
      await expect(sec.getByRole('heading', { level: 3, name: title })).toBeVisible();
    }
    await expect(sec).toContainText(/\d+ ciudades de Colombia/);
  });

  test('SCEN-VP-04: el headline deriva el nombre de marca', async ({ page }) => {
    await expect(section(page).getByRole('heading', { level: 2 })).toContainText('¿Por Qué Elegir Alquicarros?');
  });
});
