import { test, expect } from '@playwright/test';

test.describe('Página principal', () => {
  test('debe cargar correctamente y mostrar elementos clave', async ({ page }) => {
    await page.goto('/');

    // Verificar título
    await expect(page).toHaveTitle(/Alquilatucarro/);

    // Verificar que hay un H1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/ALQUILER/i);

    // Verificar que hay un botón de búsqueda o acción
    const searchButton = page.getByRole('button').first();
    await expect(searchButton).toBeVisible();
  });

  test('debe poder acceder directamente a páginas de ciudades', async ({ page }) => {
    // Navegar directamente a la página de Bogotá
    await page.goto('/bogota');

    // Verificar que la página cargó correctamente
    await expect(page).toHaveURL(/\/bogota/);

    // Verificar que hay un H1 visible con "Bogotá"
    const h1WithBogota = page.getByRole('heading', { name: /bogotá/i, level: 1 });
    await expect(h1WithBogota).toBeVisible();
  });

  test('debe ser responsivo en móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verificar que hay un H1 visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('debe mostrar el footer con enlaces legales', async ({ page }) => {
    await page.goto('/');

    // Scroll al footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verificar enlaces de términos y privacidad
    const terminosLink = page.getByRole('link', { name: /términos/i });
    await expect(terminosLink).toBeVisible();

    const privacidadLink = page.getByRole('link', { name: /privacidad/i });
    await expect(privacidadLink).toBeVisible();
  });
});
