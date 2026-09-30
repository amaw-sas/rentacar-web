import { test, expect } from '@playwright/test';

/**
 * SCEN-A / SCEN-B (docs/specs/2026-09-30-hydration-stale-catalog-race):
 * ninguna carga puede emitir warnings de hidratación de Vue ni sustituir en
 * cliente una respuesta 200 del servidor por la página 404. En producción
 * (2026-09-30) ambas cosas pasaban cuando el snapshot ISR llegaba con el
 * catálogo a ≥1 h.
 *
 * Corre contra dev y contra la preview de Vercel (PLAYWRIGHT_BASE_URL).
 */
const RUTAS = ['/', '/bogota', '/medellin'];

test.describe('hidratación limpia', () => {
  for (const ruta of RUTAS) {
    test(`carga de ${ruta}: sin warnings de hidratación ni 404 de cliente`, async ({ page }) => {
      const hydrationMessages: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (message) => {
        const text = message.text();
        if (/hydration/i.test(text)) hydrationMessages.push(text);
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));

      const response = await page.goto(ruta);
      expect(response?.status()).toBe(200);

      // Deja terminar hidratación + el chequeo de frescura diferido.
      await page.waitForLoadState('load');
      await page.waitForTimeout(4000);

      expect(hydrationMessages, `warnings de hidratación en ${ruta}`).toEqual([]);
      expect(pageErrors, `errores de página en ${ruta}`).toEqual([]);

      // El servidor respondió 200: el cliente no puede estar pintando el 404.
      await expect(page.locator('main .text-8xl')).toHaveCount(0);
      expect(await page.title()).not.toMatch(/Error 404/);
    });
  }
});
