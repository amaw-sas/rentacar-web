import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('debe cargar la página principal del blog', async ({ page }) => {
    await page.goto('/blog');

    // Verificar que "Blog de" sea visible
    await expect(page.getByText('Blog de', { exact: false })).toBeVisible();

    // Verificar que hay artículos
    const articles = page.locator('article, .blog-post, a[href*="/blog/"]');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  const articulos = [
    'requisitos-alquilar-carro-colombia',
    'pico-y-placa-colombia-2025',
    'tipos-carros-alquilar-cual-elegir',
    'rutas-carro-desde-bogota',
    'eje-cafetero-en-carro-guia-completa',
    'costa-caribe-cartagena-santa-marta-carro',
    'viajar-carro-con-ninos-colombia',
  ];

  for (const articulo of articulos) {
    test(`debe cargar el artículo: ${articulo}`, async ({ page }) => {
      await page.goto(`/blog/${articulo}`);

      // Verificar URL correcta
      await expect(page).toHaveURL(new RegExp(`/blog/${articulo}`));

      // Verificar que hay contenido
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      // Verificar que no es 404
      const response = await page.goto(`/blog/${articulo}`);
      expect(response?.status()).toBe(200);
    });
  }

  test('debe tener navegación entre artículos', async ({ page }) => {
    await page.goto('/blog');

    // Hacer clic en el primer artículo
    const firstArticleLink = page.locator('a[href*="/blog/"]').first();
    await firstArticleLink.click();

    // Verificar que navegó a un artículo
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByText('Carro en', { exact: false }).first()).toBeVisible();
  });

  test('debe mostrar metadata SEO en artículos', async ({ page }) => {
    await page.goto('/blog/requisitos-alquilar-carro-colombia');

    // Verificar meta descripción
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Verificar Open Graph
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /.+/);
  });
});
