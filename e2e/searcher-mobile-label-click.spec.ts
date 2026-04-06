import { test, expect } from '@playwright/test';

test.describe('Searcher - Mobile Form Field Fix', () => {
  test('componente móvil select está visible y funcional', async ({ page }) => {
    // Configurar viewport móvil (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Ir a página de ciudad con searcher
    await page.goto('/armenia');

    // Esperar que el componente searcher esté visible
    await page.waitForLoadState('networkidle');

    // Verificar que el select nativo móvil está visible
    // Nota: Hay dos Searcher en la página (desktop en hidden lg:flex y mobile en lg:hidden)
    // El segundo (.last()) es el que está visible en móvil
    const mobileSelect = page.locator('select#pickup-location-mobile').last();
    await expect(mobileSelect).toBeVisible();

    // Verificar que el componente desktop está oculto (por CSS)
    // El primero (.first()) es el del contenedor desktop que está hidden en móvil
    const desktopComponent = page.locator('#pickup-location').first();
    await expect(desktopComponent).toBeHidden();

    // Enfocar el select móvil directamente (simula interacción del usuario)
    await mobileSelect.focus();

    // VERIFICACIÓN CRÍTICA: El componente desktop NO debe activarse
    // Si el bug existe, el u-select-menu desktop se abrirá (mostrará dropdown)
    // Buscamos el dropdown/popover del u-select-menu
    const desktopDropdown = page.locator('[role="listbox"], [role="menu"]');

    // El dropdown NO debe estar visible en móvil
    // Esperamos que NO haya ningún dropdown visible
    await expect(desktopDropdown).toHaveCount(0);

    // Verificar que el select nativo móvil está enfocado
    await expect(mobileSelect).toBeFocused();
  });

  test('input móvil date está visible y funcional', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/armenia');
    await page.waitForLoadState('networkidle');

    // Enfocar el input date móvil directamente
    const mobileDateInput = page.locator('input#pickup-date-mobile[type="date"]').last();
    await expect(mobileDateInput).toBeVisible();

    await mobileDateInput.focus();

    // Verificar que el input date nativo móvil está enfocado
    await expect(mobileDateInput).toBeFocused();

    // Verificar que el componente desktop NO está enfocado
    const desktopDateInput = page.locator('#pickup-date').first();
    await expect(desktopDateInput).not.toBeFocused();

    // Verificar que no hay dropdowns o popovers activos del componente desktop
    const desktopPopover = page.locator('[role="dialog"], [role="menu"]');
    await expect(desktopPopover).toHaveCount(0);
  });
});
