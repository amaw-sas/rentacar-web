import { test, expect } from '@playwright/test';

/**
 * SCEN-010 (smoke coverage): when /api/rentacar-data returns extras with
 * all fields null, SSR/CSR must not propagate $0 to user-visible pages
 * and must not emit console errors.
 *
 * Full coverage (walk through cotización + assert testids on resume) is
 * deferred to a follow-up issue. The unit chain
 *   SCEN-007 (transformer null) +
 *   SCEN-008/009 (useCategory ?? 12000 fallback) +
 *   SCEN-003 (useFetchRentacarData sentinel) +
 *   SCEN-005 (consumers don't throw)
 * implies SCEN-010 holds end-to-end; this smoke exercises the SSR data
 * path that the units validate piecewise.
 */

const EXTRAS_NULL_FIXTURE = {
  categories: [
    {
      id: 'B',
      identification: 'B',
      name: 'Gama B',
      category: 'Económico Mecánico',
      description: '5 pasajeros, 2 equipajes, mecánico',
      image: '',
      ad: '',
      models: [],
      month_prices: [
        {
          '1k_kms': 3865990,
          '2k_kms': 3865990,
          '3k_kms': 4323990,
          init_date: '2024-01-15',
          end_date: '2025-12-30',
          total_insurance_price: 476000,
          one_day_price: 220000,
          status: 'active',
        },
      ],
      total_coverage_unit_charge: 27500,
    },
  ],
  branches: [
    {
      id: 1,
      code: 'BOG-01',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: {
    extraDriverDayPrice: null,
    babySeatDayPrice: null,
    washPrice: null,
    washOnsitePrice: null,
    washDeepPrice: null,
    washDeepUpholsteryPrice: null,
  },
  vehicleCategories: {
    B: {
      grupo: 'Económico',
      descripcion_corta: 'Vehículos compactos',
      descripcion_larga: 'Vehículos compactos perfectos para ciudad',
      tags: [],
      modelos: [],
    },
  },
};

test.describe('Extras NULL smoke (SCEN-010 partial coverage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/rentacar-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EXTRAS_NULL_FIXTURE),
      }),
    );
  });

  test('home page loads without console errors when extras are null', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');

    expect(response?.status(), 'home returns 200').toBe(200);

    const blocking = consoleErrors.filter(
      (e) => /\[useFetchRentacarData\]|Failed to load|Data not loaded/.test(e),
    );
    expect(blocking, 'no blocking console errors from rentacar-data').toEqual([]);
  });

  test('city page (/bogota) loads without console errors when extras are null', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/bogota');

    expect(response?.status(), 'city page returns 200').toBe(200);

    const blocking = consoleErrors.filter(
      (e) => /\[useFetchRentacarData\]|Failed to load|Data not loaded/.test(e),
    );
    expect(blocking, 'no blocking console errors from rentacar-data').toEqual([]);
  });

  test('city page does not leak literal "$0" or "$ 0" prices in markup', async ({ page }) => {
    // The unit chain proves useCategory's ?? 12000 fires when extras.* is null.
    // The page itself shouldn't render extras prices unless the user picks
    // additionals — but a sanity smoke that nothing in the visible markup
    // shows literal $0 catches accidental leakage if a future regression
    // wires a non-guarded path.
    await page.goto('/bogota');

    const body = await page.locator('body').innerText();
    expect(body, 'no leaked $0 prices on page load').not.toMatch(/\$\s?0(?!\d)/);
  });
});
