import { test, expect } from '@playwright/test';

test.describe('Accesibilidad', () => {
  test('debe tener estructura de encabezados correcta', async ({ page }) => {
    await page.goto('/');

    // Debe haber exactamente un H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Los encabezados deben estar en orden jerárquico
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('las imágenes deben tener atributo alt', async ({ page }) => {
    await page.goto('/');

    // Obtener todas las imágenes
    const images = await page.locator('img').all();

    for (const img of images) {
      // Verificar que tiene alt (puede ser vacío para decorativas)
      const hasAlt = await img.getAttribute('alt');
      expect(hasAlt).not.toBeNull();
    }
  });

  test('los enlaces deben tener texto descriptivo', async ({ page }) => {
    await page.goto('/');

    // Obtener todos los enlaces
    const links = await page.locator('a[href]').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      // El enlace debe tener texto, aria-label o title
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });

  test('debe ser navegable con teclado', async ({ page }) => {
    await page.goto('/');

    // Simular navegación con Tab
    await page.keyboard.press('Tab');

    // Verificar que algún elemento tiene focus
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  /**
   * Issue #364. Este test se llamaba igual y comprobaba que
   * `getComputedStyle(body).color` fuera truthy. Estuvo en verde durante meses
   * con la home pintando texto a 1.90:1 — no es que se le escapara un caso, es
   * que no medía nada. Ahora mide.
   *
   * Tres cosas que el enfoque ingenuo se deja, y la primera casi me vuelve a
   * colar un test decorativo:
   *
   * 1. Tailwind 4 emite oklch() y Chrome lo CONSERVA en el estilo computado.
   *    Un parser de /rgba?\(/ salta el 94% de los nodos y devuelve "0 fallos"
   *    habiendo medido seis elementos. Por eso los colores se resuelven
   *    pintándolos en un canvas 1x1: el navegador acepta cualquier sintaxis y
   *    devuelve el píxel realmente pintado, que además compone el alpha solo.
   * 2. Los heroes de marca son gradientes. `background-color` sale transparente
   *    ahí, así que el fondo sale de los stops de `background-image` y se evalúa
   *    contra el PEOR. El gradiente de aliados va de #ff8a00 a #e35d0a y el
   *    veredicto cambia entre los dos extremos.
   * 3. El umbral depende del tamaño RENDERIZADO, no de la clase declarada: un
   *    `text-3xl` puede venir sobrescrito por un breakpoint posterior.
   *
   * El fondo se resuelve subiendo hasta el primer ancestro OPACO, componiendo
   * las capas translúcidas del camino. Subir al revés hace que el gradiente del
   * layout gane a un bg-white interior que lo tapa — falso positivo masivo.
   */
  test('el texto cumple el contraste mínimo de WCAG AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const failures = await page.evaluate(() => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      const ctx = cv.getContext('2d', { willReadFrequently: true })!;
      const valid = (c: string) => {
        try {
          return c.length > 0 && CSS.supports('color', c);
        } catch {
          return false;
        }
      };
      /**
       * Pinta las capas sobre blanco y devuelve el píxel resultante. Tailwind 4
       * emite oklch() y Chrome lo conserva en el estilo computado, así que un
       * parser de rgb() se salta casi todos los nodos. El canvas acepta cualquier
       * sintaxis CSS y de paso compone el alpha él solo.
       */
      const paint = (layers: string[]): [number, number, number] => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
        for (const c of layers) {
          if (!valid(c)) continue;
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
        }
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      const alphaOf = (c: string) => {
        const modern = /\/\s*([\d.]+)(%?)\s*\)/.exec(c);
        if (modern) return modern[2] === '%' ? Number(modern[1]) / 100 : Number(modern[1]);
        const legacy = /^(?:rgba|hsla)\(\s*[^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/.exec(c);
        return legacy ? Number(legacy[1]) : 1;
      };
      const COLOR_FN =
        /(?:oklch|oklab|rgba?|hsla?|lab|lch|color)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-fA-F]{3,8}/g;
      const lum = ([r, g, b]: [number, number, number]) => {
        const f = (c: number) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a: [number, number, number], b: [number, number, number]) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };

      /**
       * Sube hasta el primer ancestro con fondo OPACO y compone encima las capas
       * translúcidas del camino. Si ese fondo es un gradiente, devuelve un
       * candidato por stop para poder evaluar contra el peor.
       *
       * El sentido del recorrido importa: yendo de fuera hacia dentro, el
       * gradiente del layout gana a un bg-white interior que lo tapa, y la página
       * entera sale como fallo.
       */
      const backgroundsBehind = (el: Element): [number, number, number][] => {
        const translucentAbove: string[] = [];
        for (let node: Element | null = el; node; node = node.parentElement) {
          const cs = getComputedStyle(node);
          const img = cs.backgroundImage;
          if (img.length > 0 && img !== 'none') {
            const stops = (img.match(COLOR_FN) ?? []).filter(valid);
            if (stops.length > 0) {
              return stops.map((s) => paint([s, ...translucentAbove.slice().reverse()]));
            }
          }
          const bc = cs.backgroundColor;
          if (valid(bc)) {
            const alpha = alphaOf(bc);
            if (alpha >= 1) return [paint([bc, ...translucentAbove.slice().reverse()])];
            if (alpha > 0) translucentAbove.push(bc);
          }
        }
        return [paint(translucentAbove.slice().reverse())];
      };

      const out: { text: string; ratio: number; min: number; tag: string }[] = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        // Solo nodos que pintan texto propio, visibles y no vacíos.
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (!own) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        if (!valid(cs.color)) continue;

        const size = parseFloat(cs.fontSize);
        const weight = Number(cs.fontWeight) || 400;
        // WCAG 2.1: texto grande es >=24px, o >=18.66px en negrita.
        const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
        const min = isLarge ? 3 : 4.5;

        // El color del texto se compone SOBRE cada fondo candidato, así un
        // text-*/75 se mide como se pinta y no como se declara.
        const worst = Math.min(
          ...backgroundsBehind(el).map((bg) =>
            ratio(paint([`rgb(${bg[0]},${bg[1]},${bg[2]})`, cs.color]), bg),
          ),
        );
        if (worst < min) {
          out.push({ text: own.slice(0, 60), ratio: Number(worst.toFixed(2)), min, tag: el.tagName });
        }
      }
      return out;
    });

    expect(
      failures,
      `Texto por debajo del mínimo AA:\n${failures
        .map((f) => `  ${f.tag} "${f.text}" → ${f.ratio}:1 (mínimo ${f.min}:1)`)
        .join('\n')}`,
    ).toEqual([]);
  });

  test('los formularios deben tener labels', async ({ page }) => {
    await page.goto('/');

    // Si hay inputs, deben tener labels o aria-label
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      if (id) {
        // Verificar si hay un label asociado
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || placeholder).toBeTruthy();
      } else {
        // Sin id, debe tener aria-label o placeholder
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    }
  });

  test('debe tener lang en el HTML', async ({ page }) => {
    await page.goto('/');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    // Debe ser español (es, es-CO, es-419, etc.)
    expect(lang).toMatch(/^es/);
  });
});
