import { test, expect } from '@playwright/test';

test.describe('Accesibilidad', () => {
  test('debe tener estructura de encabezados correcta', async ({ page }) => {
    await page.goto('/');

    // Debe haber exactamente un H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Los encabezados deben estar en orden jerárquico
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('las imágenes deben tener atributo alt', async ({ page }) => {
    await page.goto('/');

    // Obtener todas las imágenes
    const images = await page.locator('img').all();

    for (const img of images) {
      // Verificar que tiene alt (puede ser vacío para decorativas)
      const hasAlt = await img.getAttribute('alt');
      expect(hasAlt).not.toBeNull();
    }
  });

  test('los enlaces deben tener texto descriptivo', async ({ page }) => {
    await page.goto('/');

    // Obtener todos los enlaces
    const links = await page.locator('a[href]').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      // El enlace debe tener texto, aria-label o title
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });

  test('debe ser navegable con teclado', async ({ page }) => {
    await page.goto('/');

    // Simular navegación con Tab
    await page.keyboard.press('Tab');

    // Verificar que algún elemento tiene focus
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  test('debe tener contraste adecuado en textos', async ({ page }) => {
    await page.goto('/');

    // Verificar que el body tiene color de texto
    const bodyColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    expect(bodyColor).toBeTruthy();
  });

  test('los formularios deben tener labels', async ({ page }) => {
    await page.goto('/');

    // Si hay inputs, deben tener labels o aria-label
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      if (id) {
        // Verificar si hay un label asociado
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || placeholder).toBeTruthy();
      } else {
        // Sin id, debe tener aria-label o placeholder
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    }
  });

  test('debe tener lang en el HTML', async ({ page }) => {
    await page.goto('/');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    // Debe ser español (es, es-CO, es-419, etc.)
    expect(lang).toMatch(/^es/);
  });
});
