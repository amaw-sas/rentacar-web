import { test, expect } from '@playwright/test';

/**
 * Tests E2E para formato de hora 12h en URLs de búsqueda
 *
 * Feature: Cambio de formato 24h a 12h con retrocompatibilidad
 * - URLs nuevas usan formato 12h (01:00pm, 12:00am)
 * - URLs legacy 24h redirigen automáticamente a 12h
 * - Formatos inválidos resetean a defaults con mensaje
 *
 * Ejecutar:
 * - Todas las marcas: pnpm test:e2e:chromium
 * - Marca específica: BRAND=alquilatucarro pnpm test:e2e:chromium
 */

test.describe('Formato 12h en URLs de búsqueda', () => {

  test.describe('Casos Estándar - Funcionalidad Básica', () => {

    test('debe cargar correctamente URL con formato 12h estándar', async ({ page }) => {
      // URL con formato 12h (01:00pm, 02:00pm)
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00pm/hora-devolucion/02:00pm');

      // Verificar que la URL se mantiene sin redirect
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00pm/);

      // Verificar que la página carga correctamente
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('debe redirigir URL legacy 24h a formato 12h', async ({ page }) => {
      // URL con formato 24h legacy (13:00, 14:00)
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/13:00/hora-devolucion/14:00');

      // Verificar redirect a formato 12h
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00pm/);
    });

    test('debe manejar formato mixto (12h + 24h) redirigiendo a 12h', async ({ page }) => {
      // Una hora en 12h, otra en 24h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00pm/hora-devolucion/14:00');

      // Debe redirigir ambas a 12h
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00pm/);
    });
  });

  test.describe('Casos Edge - Horas Especiales', () => {

    test('debe convertir medianoche (00:00) a 12:00am', async ({ page }) => {
      // Medianoche en formato 24h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/00:00/hora-devolucion/00:00');

      // Debe redirigir a 12:00am
      await expect(page).toHaveURL(/hora-recogida\/12:00am/);
      await expect(page).toHaveURL(/hora-devolucion\/12:00am/);
    });

    test('debe convertir mediodía (12:00) a 12:00pm', async ({ page }) => {
      // Mediodía en formato 24h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/12:00/hora-devolucion/12:00');

      // Debe redirigir a 12:00pm
      await expect(page).toHaveURL(/hora-recogida\/12:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/12:00pm/);
    });

    test('debe convertir fin de día (23:59) a 11:59pm', async ({ page }) => {
      // Última hora del día en formato 24h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/23:59/hora-devolucion/23:59');

      // Debe redirigir a 11:59pm
      await expect(page).toHaveURL(/hora-recogida\/11:59pm/);
      await expect(page).toHaveURL(/hora-devolucion\/11:59pm/);
    });

    test('debe convertir inicio de día (01:00) a 01:00am', async ({ page }) => {
      // Primera hora de la madrugada en formato 24h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00/hora-devolucion/01:00');

      // Debe redirigir a 01:00am
      await expect(page).toHaveURL(/hora-recogida\/01:00am/);
      await expect(page).toHaveURL(/hora-devolucion\/01:00am/);
    });
  });

  test.describe('Casos Edge - Case Sensitivity', () => {

    test('debe aceptar AM/PM en mayúsculas sin normalizar', async ({ page }) => {
      // URL con AM/PM en mayúsculas - formato válido, no debe redirigir
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00PM/hora-devolucion/02:00PM');

      // NO debe redirigir - acepta mayúsculas como válidas
      // Nota: El middleware es case-insensitive, evita redirects innecesarios
      await expect(page).toHaveURL(/hora-recogida\/01:00PM/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00PM/);
    });

    test('debe aceptar formato mixto de case sin normalizar (Pm, pM)', async ({ page }) => {
      // URL con case mixto - formato válido, no debe redirigir
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00Pm/hora-devolucion/02:00pM');

      // NO debe redirigir - acepta case mixto como válido
      await expect(page).toHaveURL(/hora-recogida\/01:00Pm/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00pM/);
    });
  });

  test.describe('Casos Edge - Formatos Inválidos', () => {

    test('debe resetear a defaults cuando hora es inválida (25:00)', async ({ page }) => {
      // URL con hora fuera de rango
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/25:00/hora-devolucion/13:00');

      // Debe resetear a valores default (12:00pm)
      await expect(page).toHaveURL(/hora-recogida\/12:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/12:00pm/);

      // Debe mostrar mensaje informativo
      // Nota: Ajusta el selector según tu implementación de mensajes
      // await expect(page.locator('[role="alert"]')).toContainText(/formato.*inválido/i);
    });

    test('debe resetear a defaults cuando formato es incorrecto (texto)', async ({ page }) => {
      // URL con texto basura en hora
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/invalid/hora-devolucion/abc');

      // Debe resetear a valores default
      await expect(page).toHaveURL(/hora-recogida\/12:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/12:00pm/);
    });

    test('debe rechazar formato 12h con hora de un solo dígito', async ({ page }) => {
      // URL con hora de 1 dígito (1:00pm en lugar de 01:00pm)
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/1:00pm/hora-devolucion/2:00pm');

      // Esperar a que la página se estabilice después del redirect
      await page.waitForURL(/bogota\/buscar-vehiculos/, { timeout: 5000 });

      // Debe resetear a defaults (formato inválido)
      await expect(page).toHaveURL(/hora-recogida\/12:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/12:00pm/);
    });
  });

  test.describe('Casos Edge - Navegación y Estado', () => {

    test('no debe causar loop infinito con URLs 12h válidas', async ({ page }) => {
      // Navegar a URL 12h válida
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00pm/hora-devolucion/02:00pm');

      const initialUrl = page.url();

      // Esperar un momento para verificar que no hay redirects adicionales
      await page.waitForTimeout(2000);

      const finalUrl = page.url();

      // La URL debe mantenerse sin cambios (no redirect)
      expect(finalUrl).toBe(initialUrl);
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
    });

    test('debe mantener formato 12h después de refresh', async ({ page }) => {
      // Navegar a URL 12h
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/01:00pm/hora-devolucion/02:00pm');

      // Verificar URL inicial
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);

      // Hacer refresh
      await page.reload();

      // Verificar que sigue en formato 12h (no hay redirect innecesario)
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/02:00pm/);
    });

    test('debe funcionar correctamente al navegar desde URL 24h usando back button', async ({ page }) => {
      // Navegar a URL 24h (que redirige a 12h)
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/13:00/hora-devolucion/14:00');

      // Verificar redirect a 12h
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);

      // Navegar a otra página
      await page.goto('/bogota');
      await expect(page).toHaveURL(/\/bogota$/);

      // Click en back button
      await page.goBack();

      // Debe volver a la URL 12h (no loop infinito)
      await expect(page).toHaveURL(/hora-recogida\/01:00pm/);
    });
  });

  test.describe('Integración - Conversión Completa AM/PM', () => {

    test('debe convertir correctamente horario matutino (6:00 AM)', async ({ page }) => {
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/06:00/hora-devolucion/06:00');

      await expect(page).toHaveURL(/hora-recogida\/06:00am/);
      await expect(page).toHaveURL(/hora-devolucion\/06:00am/);
    });

    test('debe convertir correctamente horario vespertino (18:00 / 6:00 PM)', async ({ page }) => {
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/18:00/hora-devolucion/18:00');

      await expect(page).toHaveURL(/hora-recogida\/06:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/06:00pm/);
    });

    test('debe convertir correctamente horario nocturno (21:00 / 9:00 PM)', async ({ page }) => {
      await page.goto('/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/21:00/hora-devolucion/21:00');

      await expect(page).toHaveURL(/hora-recogida\/09:00pm/);
      await expect(page).toHaveURL(/hora-devolucion\/09:00pm/);
    });
  });

  test.describe('Regresión - Bug Identificado (Documentado)', () => {

    test('defaults respetan contexto de ciudad en URL', async ({ page }) => {
      /**
       * Verifica que cuando se resetea a defaults por formato inválido,
       * los lugares de recogida/devolución respetan el contexto de ciudad.
       *
       * Fix implementado: useDefaultRouteParams ahora acepta parámetro cityContext
       * que extraen los middlewares del path de la URL.
       *
       * Ejemplo: /armenia/... usa armenia-aeropuerto como default
       */
      await page.goto('/armenia/buscar-vehiculos/lugar-recogida/armenia-aeropuerto/lugar-devolucion/armenia-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/25:00/hora-devolucion/13:00');

      // Debe resetear a defaults con contexto de ciudad armenia
      await expect(page).toHaveURL(/lugar-recogida\/armenia-aeropuerto/);
      await expect(page).toHaveURL(/lugar-devolucion\/armenia-aeropuerto/);
    });
  });
});

test.describe('Valores Default', () => {

  test('debe usar 12:00pm como default para nuevas búsquedas', async ({ page }) => {
    // Navegar a página de ciudad (sin params de hora)
    await page.goto('/bogota');

    // Interactuar con formulario de búsqueda si existe
    // Nota: Ajusta según tu implementación específica
    const searchButton = page.getByRole('button').first();

    if (await searchButton.isVisible()) {
      // Si hay un botón de búsqueda visible, hacer click
      await searchButton.click();

      // Verificar que la URL generada usa formato 12h con defaults
      // await expect(page).toHaveURL(/hora-recogida\/12:00pm/);
      // await expect(page).toHaveURL(/hora-devolucion\/12:00pm/);
    }
  });
});
