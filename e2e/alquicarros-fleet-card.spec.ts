import { test, expect } from '@playwright/test';

/**
 * Holdout E2E para el rediseño de las cards estáticas de flota de alquicarros.
 * Codifica SCEN-FC-01..06 (DOM observable). SCEN-FC-07 (no regresión de otras
 * marcas) se valida por git diff, no aquí.
 *
 * Solo aplica a alquicarros: las otras marcas conservan el Fleet.vue anterior.
 * Bajo otra BRAND el #fleet tiene otra estructura, así que se omite.
 */
const isAlquicarros = process.env.BRAND === 'alquicarros';

test.describe('Flota alquicarros — cards estáticas rediseñadas', () => {
  test.skip(!isAlquicarros, 'Rediseño exclusivo de alquicarros');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#fleet').scrollIntoViewIfNeeded();
    await expect(page.locator('#fleet')).toBeVisible();
  });

  // La card de Compacto, localizada por su badge superpuesto.
  const compactoCard = (page: import('@playwright/test').Page) =>
    page.locator('#fleet .group').filter({ hasText: 'Compacto - Manual' }).first();

  test('SCEN-FC-01: badge de categoría naranja superpuesto sobre la imagen', async ({ page }) => {
    const badge = compactoCard(page).locator('span', { hasText: 'Compacto - Manual' }).first();
    await expect(badge).toBeVisible();

    // Posicionado absoluto dentro del frame de imagen + naranja de marca #ef9600.
    const position = await badge.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('absolute');
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(239, 150, 0)');
  });

  test('SCEN-FC-02: el título principal son los modelos, no la categoría', async ({ page }) => {
    const title = compactoCard(page).getByRole('heading', { level: 3 });
    await expect(title).toContainText('Kia Picanto / Suzuki S-Presso o similar');

    // La categoría sola NO es un título: vive únicamente en el badge.
    await expect(page.locator('#fleet h3').filter({ hasText: /^Compacto$/ })).toHaveCount(0);
  });

  test('SCEN-FC-03: precio diario real prominente, fail-soft cuando falta', async ({ page }) => {
    const card = compactoCard(page);
    const price = card.locator('.text-brand-600').first();

    if (await price.count()) {
      await expect(price).toContainText(/\$[\d.]+\/día/);
      await expect(card).toContainText('Desde');
      await expect(card).toContainText('+ IVA');
    }
    // fail-soft: sin precio activo no hay bloque y NUNCA aparece "$0".
    await expect(card).not.toContainText('$0/día');
  });

  test('SCEN-FC-04: specs como chips redondeados independientes', async ({ page }) => {
    const card = compactoCard(page);
    // pasajeros, maletas, kilometraje -> 3 chips hermanos redondeados.
    const chips = card.locator('span.rounded-lg.border');
    await expect(chips).toHaveCount(3);

    await expect(chips.nth(0)).toContainText('5'); // pasajeros
    await expect(chips.nth(1)).toContainText('2'); // maletas (luggage real de Compacto)
    await expect(chips.nth(2)).toContainText('Kilometraje ilimitado');

    const radius = await chips.first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius).toBeGreaterThanOrEqual(8);
  });

  test('SCEN-FC-05: el toggle Mensualidad gobierna precio y chip de kilometraje', async ({ page }) => {
    const monthlyTab = page.getByTestId('fleet-tab-monthly-test');
    await expect(monthlyTab).toBeVisible();
    const card = compactoCard(page);
    const kmChip = card.locator('span.rounded-lg.border').nth(2);

    // Robusto a la carrera de hidratación: reintenta el click hasta que el
    // listener Vue esté adjunto y el chip refleje el plan mensual.
    await expect(async () => {
      await monthlyTab.click();
      await expect(kmChip).toContainText('1.000 km/mes incluidos', { timeout: 1000 });
    }).toPass({ timeout: 15000 });

    const price = card.locator('.text-brand-600').first();
    if (await price.count()) {
      await expect(price).toContainText(/\$[\d.]+\/mes/);
      await expect(card).toContainText('IVA incluido');
    }
  });

  test('SCEN-FC-06: el CTA abre el modal con SelectBranch (flujo intacto)', async ({ page }) => {
    const cta = compactoCard(page).getByTestId('fleet-card-cta-test');
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(/ver disponibilidad/i);

    const dialog = page.getByRole('dialog');
    // hydrate-on-visible: el island del modal puede no estar hidratado al primer
    // tap. Reintentar mantiene el invariante (el click abre el modal) sin perder
    // el primer tap como objetivo de diseño.
    await expect(async () => {
      await cta.click();
      await expect(dialog).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await expect(dialog).toContainText('deseas recoger tu carro');
  });
});
