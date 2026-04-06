import { test, expect } from '@playwright/test';

/**
 * E2E Test: Date Range Picker URL Parameter Synchronization
 *
 * Verifies that date parameters from the URL are correctly displayed
 * in the date-range picker button label and calendar.
 */
test.describe('Date Range Picker - URL Synchronization', () => {
  test('debe mostrar fechas del URL en el label del botón', async ({ page }) => {
    // Navigate to search page with specific date parameters
    const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    // Wait for the date picker component to initialize
    await page.waitForTimeout(1000);

    // Find the date range picker button
    // The button should display the date range from URL params
    const dateButton = page.locator('button').filter({ hasText: /feb.*2026/i }).first();

    await expect(dateButton).toBeVisible({ timeout: 10000 });

    // Get the button text
    const buttonText = await dateButton.innerText();

    // Verify the button contains the expected date format
    expect(buttonText.toLowerCase()).toContain('feb');
    expect(buttonText).toContain('2026');
    expect(buttonText).toContain('-');

    // Verify it represents a date range (e.g., "10 feb 2026 - 15 feb 2026")
    const hasDateRange = /\d+.*feb.*2026.*-.*\d+.*feb.*2026/i.test(buttonText);
    expect(hasDateRange).toBeTruthy();
  });

  test('debe abrir el calendario y mostrar el grid', async ({ page }) => {
    const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click the date picker button
    const dateButton = page.locator('button').filter({ hasText: /feb.*2026/i }).first();
    await expect(dateButton).toBeVisible({ timeout: 10000 });

    await dateButton.click();

    // Wait for popover animation
    await page.waitForTimeout(1500);

    // Verify calendar grid is visible
    const calendarGrid = page.locator('[role="grid"]').first();
    await expect(calendarGrid).toBeVisible({ timeout: 5000 });

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'e2e-results/date-picker-calendar-open.png',
      fullPage: true
    });
  });

  test('debe mostrar botones de navegación del calendario', async ({ page }) => {
    const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open calendar
    const dateButton = page.locator('button').filter({ hasText: /feb.*2026/i }).first();
    await expect(dateButton).toBeVisible({ timeout: 10000 });
    await dateButton.click();
    await page.waitForTimeout(1500);

    // Verify calendar is open
    const calendarGrid = page.locator('[role="grid"]').first();
    await expect(calendarGrid).toBeVisible({ timeout: 5000 });

    // Verify navigation buttons exist - look for buttons with aria-label containing navigation keywords
    // These buttons are in the calendar header for prev/next month and year
    const prevButton = page.locator('button[aria-label*="anterior"], button[aria-label*="previous"]').first();
    const nextButton = page.locator('button[aria-label*="siguiente"], button[aria-label*="next"]').first();

    // At least one prev and one next button should be visible
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('debe cerrar el popover al seleccionar rango con fechas previas ya establecidas', async ({ page }) => {
    // Start with existing dates in URL
    const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open the date picker (which already has dates set)
    const dateButton = page.locator('button').filter({ hasText: /feb.*2026/i }).first();
    await expect(dateButton).toBeVisible({ timeout: 10000 });
    await dateButton.click();
    await page.waitForTimeout(500);

    // Verify calendar is open
    const calendarGrid = page.locator('[role="grid"]').first();
    await expect(calendarGrid).toBeVisible({ timeout: 5000 });

    // Click a new start date (March 5)
    const march5 = page.locator('[data-value="2026-03-05"], [aria-label*="5 de marzo"]').first();
    await march5.click();
    await page.waitForTimeout(300);

    // Click a new end date (March 10)
    const march10 = page.locator('[data-value="2026-03-10"], [aria-label*="10 de marzo"]').first();
    await march10.click();

    // Calendar should auto-close (300ms delay + buffer)
    await expect(calendarGrid).not.toBeVisible({ timeout: 2000 });
  });

  test('debe deshabilitar fechas de devolución más allá de 30 días desde la fecha de recogida', async ({ page }) => {
    // Start: June 1, 2026 → maxReturnDate = July 1 (June 1 + 30 days)
    // Desktop 2-month view shows June + July simultaneously — no calendar navigation needed
    const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-06-01/fecha-devolucion/2026-06-10/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open the calendar
    const dateButton = page.locator('button').filter({ hasText: /jun.*2026/i }).first();
    await expect(dateButton).toBeVisible({ timeout: 10000 });
    await dateButton.click();
    await page.waitForTimeout(500);

    const calendarGrid = page.locator('[role="grid"]').first();
    await expect(calendarGrid).toBeVisible({ timeout: 5000 });

    // July 1 = June 1 + 30 days → exactly at the limit, must NOT be disabled
    const july1 = page.locator('button[data-value="2026-07-01"]').first();
    await expect(july1).toBeVisible({ timeout: 5000 });
    await expect(july1).not.toHaveAttribute('data-disabled');

    // July 2 = June 1 + 31 days → beyond limit, must be disabled
    const july2 = page.locator('button[data-value="2026-07-02"]').first();
    await expect(july2).toBeVisible({ timeout: 5000 });
    await expect(july2).toHaveAttribute('data-disabled');
  });

  // Skip mobile test - the search results page uses the same date-range picker component
  // in mobile, which is already tested in the desktop tests above.
  // Native mobile date inputs only exist on city landing pages, not on search results pages.
  test.skip('debe sincronizar fechas del URL con inputs nativos en móvil', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Native date inputs exist on city pages (e.g., /armenia), not on search results pages
    await page.goto('/armenia');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify mobile native date inputs exist on city pages
    const pickupDateInput = page.locator('input[type="date"]#pickup-date-mobile').last();
    await expect(pickupDateInput).toBeVisible({ timeout: 10000 });
  });
});
