import { test, expect } from '@playwright/test';

/**
 * SCEN-006 (docs/specs/2026-09-30-hydration-stale-catalog-race): the home
 * "Elige una ciudad" control is server-rendered looking interactive, but until
 * hydration finishes it used to swallow clicks in silence (~6s window measured
 * live in production on 2026-09-30). A pre-hydration click must show a visible
 * loading state and open the dialog by itself once hydration lands; a
 * post-hydration click opens it directly.
 *
 * Solo alquilatucarro: las otras marcas tienen su propio selector y no
 * comparten este componente.
 */
const brand = process.env.BRAND || 'alquilatucarro';
test.skip(brand !== 'alquilatucarro', 'SelectBranch prehydration UX es de alquilatucarro');

// El defecto es visible en móvil (drawer) y escritorio (USelectMenu); el
// drawer da la aserción más determinista (role=dialog con título).
test.use({ viewport: { width: 390, height: 844 } });

test.describe('SelectBranch pre-hydration', () => {
  test('un clic antes de hidratar muestra carga y abre el diálogo solo', async ({ page }) => {
    // Garantiza una ventana pre-hidratación: retener SOLO la primera petición
    // de /_nuxt/ (la raíz del grafo de módulos) pospone toda la hidratación
    // 3 s sin multiplicar el waterfall de dev.
    let held = false;
    await page.route('**/_nuxt/**', async (route) => {
      if (!held) {
        held = true;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const trigger = page.locator('#select-branch-mobile');
    await trigger.click({ timeout: 2500 });

    // Estado de carga visible, nunca un clic tragado en silencio.
    await expect(page.locator('html.sb-prehydrate-wait')).toHaveCount(1);

    // Al terminar la hidratación, el diálogo se abre sin un segundo clic.
    await expect(
      page.getByRole('dialog').getByText('Elige una ciudad'),
    ).toBeVisible({ timeout: 30_000 });

    // Y el estado de carga se retira.
    await expect(page.locator('html.sb-prehydrate-wait')).toHaveCount(0);
  });

  test('un clic después de hidratar abre directo, sin estado de carga', async ({ page }) => {
    await page.goto('/');
    // Hidratación terminada: el capturador global marca __sbHydrated.
    await page.waitForFunction(() => (window as { __sbHydrated?: boolean }).__sbHydrated === true);

    await page.locator('#select-branch-mobile').click();

    await expect(
      page.getByRole('dialog').getByText('Elige una ciudad'),
    ).toBeVisible();
    await expect(page.locator('html.sb-prehydrate-wait')).toHaveCount(0);
  });
});
