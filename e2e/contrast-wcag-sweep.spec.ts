/**
 * Barrido de contraste WCAG por ruta (issue #364).
 *
 * El worktree no tiene .env.local, así que /api/rentacar-data da 500 y las rutas
 * que declaran `middleware: ["rentacar-data"]` no renderizan en SSR. Pero ese
 * middleware es POR PÁGINA, no global: /terminos-condiciones sí carga.
 *
 * Así que entramos por una ruta que renderiza y navegamos en CLIENTE. El
 * middleware corre entonces en el navegador y su $fetch pasa por la red, donde
 * page.route sí puede interceptarlo (agent-browser no intercepta — de ahí que
 * esto sea Playwright y no la sonda del otro barrido).
 *
 * El stub va con colecciones vacías a propósito: los colores no dependen de los
 * datos, y una respuesta con forma válida basta para que el layout, el hero y
 * las secciones estáticas se pinten. Lo que dependa de datos (las cards de flota)
 * no se podrá medir aquí y queda para la verificación con credenciales.
 */
import { test, expect } from '@playwright/test';
import { CONTRAST_PROBE } from './support/contrast-probe';

const CATALOG = {
  catalogFetchedAt: Date.now(),
  categories: [],
  branches: [],
  extras: undefined,
  vehicleCategories: [],
  // Una ciudad para que /bogota exista. transformCities produce { id, name,
  // description } donde id ES el slug. Los colores no dependen de los datos;
  // esto solo hace que la ruta resuelva.
  cities: [{ id: 'bogota', name: 'Bogotá', description: 'Alquiler de carros en Bogotá.' }],
  franchiseTestimonials: [],
  faqs: [],
};

/**
 * Rutas alcanzables. Las que declaran `middleware: ["rentacar-data"]` (home,
 * ciudad, wizard) hay que alcanzarlas por navegación de cliente; el resto entra
 * directo. `linkName` es el enlace de cabecera que dispara la navegación SPA.
 */
const ROUTES = [
  { path: '/', label: 'home', viaClient: true, ready: '#hero' },
  { path: '/bogota', label: 'ciudad', viaClient: true, ready: '#hero' },
  { path: '/reservas', label: 'wizard paso 1', viaClient: true, ready: '#hero' },
  { path: '/blog', label: 'blog', viaClient: false, ready: 'main' },
  { path: '/terminos-condiciones', label: 'términos', viaClient: false, ready: 'main' },
  { path: '/politica-privacidad', label: 'privacidad', viaClient: false, ready: 'main' },
] as const;

for (const [label, width, height] of [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
] as const) {
  for (const route of ROUTES) {
    test(`#364 contraste — ${route.label} (${label})`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width, height });
      await page.route('**/api/rentacar-data**', (r) =>
        route === undefined
          ? r.continue()
          : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) }),
      );

      if (route.viaClient) {
        // Entrada por una ruta sin el middleware, luego navegación de cliente:
        // ahí el $fetch del middleware pasa por la red y page.route lo intercepta.
        await page.goto('/terminos-condiciones');
        await page.waitForLoadState('networkidle');
        // Hay que esperar a la HIDRATACIÓN: el router solo existe después.
        // Un <a href> inyectado no sirve — no es NuxtLink, provoca navegación
        // completa y vuelve al SSR que da 500 sin credenciales.
        await page.waitForFunction(
          () =>
            Boolean(
              (document.querySelector('#__nuxt') as unknown as { __vue_app__?: { config: { globalProperties: Record<string, unknown> } } })
                ?.__vue_app__?.config.globalProperties.$router,
            ),
          null,
          { timeout: 20_000 },
        );
        await page.evaluate((p) => {
          const app = (document.querySelector('#__nuxt') as unknown as {
            __vue_app__: { config: { globalProperties: { $router: { push: (to: string) => void } } } };
          }).__vue_app__;
          app.config.globalProperties.$router.push(p);
        }, route.path);
      } else {
        await page.goto(route.path);
      }
      await page.waitForSelector(route.ready, { timeout: 25_000 });
      await page.waitForLoadState('networkidle');
      // El peer worktree sirve en :4000 y la navegación interna puede rebotar allí.
      expect(new URL(page.url()).origin, 'la navegación rebotó a otro origen').toBe(
        new URL(baseURL ?? 'http://localhost').origin,
      );

      // SCEN-364-03: ¿llegaron a renderizar las cards de flota? Con el stub vacío
      // puede que no, y entonces el precio NO queda medido — hay que saberlo en
      // vez de suponerlo por un "0 fallos".
      if (route.path === '/') {
        const fleetCards = await page.locator('[data-testid="fleet-card-cta-test"]').count();
        console.log(`[${label}] cards de flota renderizadas: ${fleetCards}`);
      }

      const { checked, failures, overImage } = await page.evaluate(CONTRAST_PROBE);
      console.log(
        `[${label}] ${route.path} → ${checked} nodos, ${failures.length} fallos` +
          (overImage.length > 0 ? `, ${overImage.length} sobre imagen (revisión manual)` : ''),
      );
      for (const f of failures) {
        console.log(`    ${f.tag} "${f.text}" → ${f.ratio}:1 (min ${f.min}) sobre ${f.bg}`);
      }
      expect(checked).toBeGreaterThan(20);
      expect(failures).toEqual([]);

      // SCEN-364-10: el estado hover del marquee. El issue midió el reposo y se
      // dejó que pasar el ratón EMPEORABA el contraste (2.36:1 frente a 1.90:1).
      if (route.path === '/') {
        // El marquee se mueve, y Playwright no puede posar el puntero sobre un
        // elemento inestable. Se congela SOLO el desplazamiento; los colores y
        // los estados :hover quedan intactos, que es lo que se está midiendo.
        await page.addStyleTag({ content: '.marquee-track { animation: none !important; }' });
        const ally = page.locator('#partners span').first();
        await ally.hover();
        await page.waitForTimeout(400);
        const hovered = await page.evaluate(CONTRAST_PROBE);
        console.log(`[${label}] con el ratón sobre un aliado → ${hovered.failures.length} fallos`);
        expect(
          hovered.failures,
          `Contraste bajo CON HOVER:\n${hovered.failures
            .map((f) => `  ${f.tag} "${f.text}" → ${f.ratio}:1 (mínimo ${f.min}:1)`)
            .join('\n')}`,
        ).toEqual([]);
      }

    });
  }
}
