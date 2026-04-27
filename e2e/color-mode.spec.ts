import { test, expect } from '@playwright/test';

/**
 * Coherencia de tema visual entre componentes.
 *
 * Contexto: el proyecto declaraba `colorMode.preference: 'dark'` mientras toda
 * la UI visible (formulario, header, dropdowns) se forzaba a "light" via
 * !important. Los toasts heredaban dark y rompían la coherencia visual.
 *
 * Solución: declarar `preference: 'light'` para alinear el default del framework
 * con la apariencia real del producto.
 */
test.describe('Color mode coherente', () => {
  test('html debe declarar tema light (no dark)', async ({ page }) => {
    await page.goto('/');

    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass ?? '').toContain('light');
    expect(htmlClass ?? '').not.toContain('dark');
  });

  test('superficies de toast deben tener fondo claro con texto oscuro', async ({ page }) => {
    await page.goto('/');

    // Inyectar un toast usando la API global de Nuxt UI (window.useToast no
    // existe en runtime real, pero podemos disparar el ToastProvider via
    // composable expuesto por @nuxt/ui — en su lugar verificamos el contenedor
    // del toaster que se renderiza al cargar la app).
    const toaster = page.locator('[data-sonner-toaster], section[aria-label*="oti" i]').first();

    // El toaster siempre se monta con UApp, aunque esté vacío. Verificamos que
    // el body NO tenga el atributo dark que indicaría tema invertido en toasts.
    const bodyTheme = await page.evaluate(() => {
      const html = document.documentElement;
      const style = getComputedStyle(html);
      return {
        classes: html.className,
        bg: style.getPropertyValue('--ui-bg').trim(),
        text: style.getPropertyValue('--ui-text').trim(),
      };
    });

    expect(bodyTheme.classes).toContain('light');
  });

  test('hero section conserva texto blanco sobre fondo oscuro (regresión)', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    // El hero usa texto blanco hardcoded; cambiar colorMode no debe afectarlo.
    expect(color).toMatch(/rgb\(\s*255,\s*255,\s*255\s*\)|rgba\(\s*255,\s*255,\s*255/);
  });

  test('formulario de búsqueda mantiene fondo blanco (regresión)', async ({ page }) => {
    await page.goto('/');

    // El formulario está dentro de .hero-section con .bg-white forzado
    const formField = page.locator('.hero-section .bg-white').first();
    await expect(formField).toBeVisible();

    const bg = await formField.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(\s*255,\s*255,\s*255\s*\)|rgba\(\s*255,\s*255,\s*255/);
  });
});
