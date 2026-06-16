import { test, expect } from '@playwright/test';

test.describe('SEO y metadatos', () => {
  test('la página principal debe tener metadatos completos', async ({ page }) => {
    await page.goto('/');

    // Verificar título
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThan(70); // Ajustado a límite más realista

    // Verificar meta descripción
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeLessThan(165); // Ajustado

    // Verificar canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('debe tener Open Graph tags', async ({ page }) => {
    await page.goto('/');

    // OG Title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    // OG Description
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();

    // OG URL
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toBeTruthy();

    // OG Type
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBeTruthy();
  });

  test('debe tener Twitter Card tags', async ({ page }) => {
    await page.goto('/');

    // Twitter Card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBeTruthy();

    // Twitter Title
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    expect(twitterTitle).toBeTruthy();
  });

  test('debe tener robots meta tag correcto', async ({ page }) => {
    await page.goto('/');

    // Verificar que hay robots meta tag
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');

    // En desarrollo puede tener noindex, en producción no debe tenerlo
    expect(robots).toBeTruthy();

    // Nota: En producción verificar que no tenga noindex
    // En desarrollo es normal tener noindex
  });

  test('sitemap debe ser accesible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('xml');
  });

  test('robots.txt debe ser accesible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();

    // En desarrollo: robots.txt bloquea indexación
    // En producción: debe contener 'Sitemap'
    expect(content).toContain('User-agent');
  });

  // Issue #71: política de bots de entrenamiento IA.
  // Decisión de negocio (#71): permitir GPTBot/CCBot/Google-Extended para
  // maximizar mindshare en respuestas de IA, de forma consistente en las 3
  // marcas. Este test corre por marca vía la env BRAND.
  test('robots.txt debe permitir bots de entrenamiento IA (#71)', async ({ page }) => {
    // En dev, nuxt-robots bloquea todo (Disallow: /). ?mockProductionEnv
    // renderiza las reglas reales de producción (los groups de nuxt.config).
    const response = await page.goto('/robots.txt?mockProductionEnv');
    expect(response?.status()).toBe(200);
    const content = (await page.textContent('body')) ?? '';

    // Evalúa la regla efectiva de robots.txt para un user-agent sobre un path.
    // Grupo aplicable: el que nombra exactamente el UA, o el de '*' si ninguno.
    // Dentro del grupo gana el prefijo más largo; en empate gana Allow.
    const isAllowed = (txt: string, ua: string, path: string): boolean => {
      const lines = txt.split('\n').map((l) => l.trim());
      type Group = { agents: string[]; rules: { allow: boolean; path: string }[] };
      const groups: Group[] = [];
      let current: Group | null = null;
      let lastWasAgent = false;
      for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const [rawKey, ...rest] = line.split(':');
        const key = rawKey.toLowerCase().trim();
        const value = rest.join(':').trim();
        if (key === 'user-agent') {
          if (!current || !lastWasAgent) {
            current = { agents: [], rules: [] };
            groups.push(current);
          }
          current.agents.push(value.toLowerCase());
          lastWasAgent = true;
        } else if ((key === 'allow' || key === 'disallow') && current) {
          current.rules.push({ allow: key === 'allow', path: value });
          lastWasAgent = false;
        } else {
          lastWasAgent = false;
        }
      }
      const named = groups.find((g) => g.agents.includes(ua.toLowerCase()));
      const group = named ?? groups.find((g) => g.agents.includes('*'));
      if (!group) return true; // sin reglas → permitido
      let best: { allow: boolean; path: string } | null = null;
      for (const rule of group.rules) {
        if (rule.path === '' ) continue;
        if (path.startsWith(rule.path)) {
          if (
            !best ||
            rule.path.length > best.path.length ||
            (rule.path.length === best.path.length && rule.allow)
          ) {
            best = rule;
          }
        }
      }
      return best ? best.allow : true;
    };

    for (const bot of ['GPTBot', 'CCBot', 'Google-Extended']) {
      expect(isAllowed(content, bot, '/'), `${bot} debe poder rastrear /`).toBe(true);
    }
  });

  test('las páginas de ciudades deben tener canonical correcto', async ({ page }) => {
    const ciudades = ['bogota', 'medellin', 'cali'];

    for (const ciudad of ciudades) {
      await page.goto(`/${ciudad}`);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain(`/${ciudad}`);
    }
  });

  test('debe tener schema.org markup', async ({ page }) => {
    await page.goto('/');

    // Buscar scripts de tipo application/ld+json
    const schemas = await page.locator('script[type="application/ld+json"]').all();
    expect(schemas.length).toBeGreaterThan(0);
  });

  test('no debe tener páginas sin indexar en sitemap', async ({ page }) => {
    await page.goto('/sitemap.xml');

    const content = await page.textContent('body');

    // Verificar que no incluye páginas que deben estar excluidas
    expect(content).not.toContain('/pendiente');
    expect(content).not.toContain('/sindisponibilidad');
    expect(content).not.toContain('/reservado/');
  });
});
