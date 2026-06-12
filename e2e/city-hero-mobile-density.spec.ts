import { test, expect } from '@playwright/test';

// F3 (issue #112): alquilame's Searcher-in-hero moved to /reservas (the city
// landing now shows a 'Reservar' CTA). Other brands keep the search hero on the
// city landing. The hero density / search-button layout is identical at both.
const SEARCHER_HERO = process.env.BRAND === 'alquilame' ? '/reservas' : '/bogota';

test.describe('City hero - mobile density + hamburger alignment', () => {
  test('search button is visible inside hero on iPhone 13 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const searchButton = page.getByRole('link', { name: /BUSCAR VEHÍCULOS/i }).last();
    await expect(searchButton).toBeVisible();

    const box = await searchButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  });

  test('search button is visible on iPhone SE viewport (worst-case)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const searchButton = page.getByRole('link', { name: /BUSCAR VEHÍCULOS/i }).last();
    await expect(searchButton).toBeVisible();
  });

  test('hamburger button is vertically centered with mobile logo in header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const hamburger = page.getByRole('button', { name: /Abrir menú de navegación/i });
    const logo = page.locator('header a[aria-label="alquilatucarro"]:visible').first();

    await expect(hamburger).toBeVisible();
    await expect(logo).toBeVisible();

    const hamburgerBox = await hamburger.boundingBox();
    const logoBox = await logo.boundingBox();
    expect(hamburgerBox).not.toBeNull();
    expect(logoBox).not.toBeNull();

    const hamburgerCenter = hamburgerBox!.y + hamburgerBox!.height / 2;
    const logoCenter = logoBox!.y + logoBox!.height / 2;

    expect(Math.abs(hamburgerCenter - logoCenter)).toBeLessThanOrEqual(8);
  });

  test('mobile form cards use compact vertical padding', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const mobileSelect = page.locator('select#pickup-location-mobile').last();
    await expect(mobileSelect).toBeVisible();

    const card = mobileSelect.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    const padding = await card.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        top: parseFloat(style.paddingTop),
        bottom: parseFloat(style.paddingBottom),
      };
    });

    expect(padding.top).toBeLessThan(8);
    expect(padding.bottom).toBeLessThan(8);
  });

  test('desktop form spacing is preserved at 1280 width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');

    const desktopField = page.locator('#pickup-location').first();
    await expect(desktopField).toBeVisible();

    const card = desktopField.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    const padding = await card.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.paddingTop);
    });

    expect(padding).toBeGreaterThanOrEqual(8);
  });
});
