import { test, expect } from '@playwright/test';

// Función auxiliar para crear regex insensible a acentos
// Permite buscar "bogota" y encontrar "Bogotá", "cucuta" → "Cúcuta", etc.
function createAccentInsensitiveRegex(str: string): RegExp {
  const accentMap: Record<string, string> = {
    'a': '[aáàäâ]',
    'e': '[eéèëê]',
    'i': '[iíìïî]',
    'o': '[oóòöô]',
    'u': '[uúùüû]',
  };

  let pattern = str.replace(/-/g, '[ -]');
  pattern = pattern.replace(/[aeiou]/gi, (char) =>
    accentMap[char.toLowerCase()] || char
  );

  return new RegExp(pattern, 'i');
}

test.describe('Páginas de ciudades', () => {
  // NOTA: Armenia (primera alfabéticamente) puede experimentar timeouts intermitentes
  // durante cold start del servidor Nuxt en WSL2 debido a competencia de recursos
  // en pruebas paralelas. Configuración de retry y timeout aumentado mitigan esto.
  const ciudades = [
    'armenia',
    'barranquilla',
    'bogota',
    'bucaramanga',
    'cali',
    'cartagena',
    'cucuta',
    'ibague',
    'manizales',
    'medellin',
    'monteria',
    'neiva',
    'pereira',
    'santa-marta',
    'valledupar',
    'villavicencio',
    'floridablanca',
    'palmira',
    'soledad',
  ];

  for (const ciudad of ciudades) {
    test(`debe cargar correctamente la página de ${ciudad}`, async ({ page }) => {
      // Navegar a la página de la ciudad
      // waitUntil: 'domcontentloaded' es suficiente para SSR - no necesitamos esperar todos los recursos
      const response = await page.goto(`/${ciudad}`, { waitUntil: 'domcontentloaded' });

      // Verificar que no hay errores 404
      expect(response?.status()).toBe(200);

      // Verificar URL correcta
      await expect(page).toHaveURL(new RegExp(`/${ciudad}`));

      // Verificar que el H1 con el nombre de la ciudad es visible
      // Usar getByRole con texto espera implícitamente a la hidratación SSR
      // Crear regex insensible a acentos para manejar tildes (Bogotá, Cúcuta, etc.)
      const cityNameRegex = createAccentInsensitiveRegex(ciudad);
      const h1 = page.getByRole('heading', { level: 1 }).filter({ hasText: cityNameRegex });
      await expect(h1.first()).toBeVisible();

      // Verificar meta descripción
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
    });
  }

  test('debe tener SEO correcto en página de Bogotá', async ({ page }) => {
    await page.goto('/bogota');

    // Verificar título
    await expect(page).toHaveTitle(/bogotá/i);

    // Verificar canonical
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/bogota$/);

    // Verificar Open Graph
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });
});
