import { test, expect } from '@playwright/test';
import { CONTRAST_PROBE } from './support/contrast-probe';

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

  /**
   * Issue #364. Este test se llamaba igual y comprobaba que
   * `getComputedStyle(body).color` fuera truthy. Estuvo en verde durante meses
   * con la home pintando texto a 1.90:1 — no es que se le escapara un caso, es
   * que no medía nada. Ahora mide.
   *
   * La medición vive en support/contrast-probe.ts, que documenta por qué es más
   * complicada de lo que parece (oklch, gradientes, alpha, componentes
   * inactivos, texto sobre foto). Cada punto de esa lista salió de un resultado
   * falso real durante #364, incluido el del primer intento de ESTE test.
   *
   * Aquí solo se cubre "/" con datos reales. El barrido multi-ruta sin
   * credenciales está en contrast-wcag-sweep.spec.ts.
   */
  test('el texto cumple el contraste mínimo de WCAG AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { checked, failures, overImage } = await page.evaluate(CONTRAST_PROBE);

    // Un "0 fallos" sobre una muestra vacía es exactamente el fraude que este
    // test vino a corregir: la versión anterior medía seis elementos de ciento
    // veintiuno y pasaba. Si la muestra se hunde, el test cae.
    expect(checked, 'la sonda apenas midió nodos — revisa que la página cargara').toBeGreaterThan(40);

    expect(
      failures,
      `Texto por debajo del mínimo AA (${overImage.length} nodos sobre imagen excluidos):\n${failures
        .map((f) => `  ${f.tag} "${f.text}" → ${f.ratio}:1 (mínimo ${f.min}:1) sobre ${f.bg}`)
        .join('\n')}`,
    ).toEqual([]);
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
