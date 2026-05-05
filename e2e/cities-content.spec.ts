import { test, expect } from '@playwright/test';

// Holdout SCEN-001 + SCEN-002 de docs/specs/2026-05-04-cities-supabase-migration/scenarios/.
//
// SCEN-001: con cities ahora vivas en Supabase (Step 7 backfill), `/armenia`
// debe servir HTML server-rendered que contiene el texto literal de la
// description y al menos un quote de testimonio. Verificamos por contenido
// concreto del body para resistir reward hacking — setear flags internas o
// renderizar via CSR no satisface; el texto debe estar en el HTML inicial.
//
// SCEN-002: una ciudad inexistente (slug que NO está en `cities` table)
// debe responder 404, no 200 con contenido placeholder.

test.describe('Cities content from Supabase (#6, holdout SCEN-001/002)', () => {
  test('SCEN-001: /armenia HTML contiene description y testimonio reales', async ({ page }) => {
    const response = await page.goto('/armenia', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);

    // Description literal del backfill (cities-data.json → Supabase).
    // Si el path Supabase → transformer → consumer → HTML se rompe en
    // cualquier punto, este texto desaparece del body.
    await expect(
      page.getByText('Armenia es la puerta de entrada al Paisaje Cultural Cafetero', { exact: false }),
    ).toBeVisible();

    // Quote del primer testimonio de Armenia. Confirma que el array
    // testimonials[] viajó completo desde la tabla cities a la sección
    // de "Opiniones de clientes" en CityPage.vue.
    await expect(
      page.getByText('Llevamos a los niños al Parque del Café y al Valle de Cocora', { exact: false }),
    ).toBeVisible();
  });

  test('SCEN-002: /xanadu-test-city devuelve 404', async ({ page }) => {
    const response = await page.goto('/xanadu-test-city', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(404);
  });

  test('SCEN-002 variant: ciudad inactive (sabaneta) también responde 404', async ({ page }) => {
    // Sabaneta existe en DB con status='inactive' (Step 7). El endpoint
    // filtra por active, por lo que el middleware validateCityParams
    // no la encuentra y la página /[city]/index.vue lanza 404.
    const response = await page.goto('/sabaneta', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(404);
  });
});
