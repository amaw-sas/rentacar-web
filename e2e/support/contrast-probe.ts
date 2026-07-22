/**
 * Sonda de contraste WCAG compartida por los specs de accesibilidad (issue #364).
 *
 * Se ejecuta DENTRO del navegador vía page.evaluate, así que no puede cerrar
 * sobre nada del ámbito de Node: todo lo que necesita vive dentro de la función.
 *
 * Por qué es más complicada de lo que parece — cada punto viene de un falso
 * resultado real, no de precaución teórica:
 *
 * 1. Tailwind 4 emite oklch() y Chrome lo CONSERVA en el estilo computado. Un
 *    parser de rgb() mide 6 nodos de 121 y devuelve "0 fallos". Los colores se
 *    resuelven pintándolos en un canvas 1x1: acepta cualquier sintaxis CSS y
 *    compone el alpha solo.
 * 2. El fondo se resuelve SUBIENDO hasta el primer ancestro opaco. Al revés, el
 *    gradiente oscuro del layout gana a un bg-white interior que lo tapa y la
 *    página entera sale como fallo.
 * 3. Los stops de gradiente totalmente transparentes no son fondo: pintados
 *    sobre blanco devuelven blanco y, con texto blanco encima, dan 1:1.
 * 4. WCAG 2.1 SC 1.4.3 exime el texto de componentes INACTIVOS. Los pasos
 *    futuros del wizard son <button disabled> reales.
 * 5. El texto sobre FOTO no es evaluable así: su overlay suele ser hermano del
 *    texto, no ancestro. Se cuenta aparte para revisión manual.
 *
 * El umbral sale del tamaño RENDERIZADO, nunca de la clase declarada.
 */
export type ContrastFinding = {
  tag: string;
  text: string;
  ratio: number;
  min: number;
  bg: string;
};

export type ContrastReport = {
  checked: number;
  failures: ContrastFinding[];
  overImage: string[];
};

export const CONTRAST_PROBE = (): ContrastReport => {
  type Rgb = [number, number, number];
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
  const paint = (layers: string[]): Rgb => {
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
  const lum = ([r, g, b]: Rgb) => {
    const f = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a: Rgb, b: Rgb) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const backgroundsBehind = (el: Element): Rgb[] => {
    const above: string[] = [];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const img = cs.backgroundImage;
      if (img.length > 0 && img !== 'none') {
        const all = (img.match(COLOR_FN) ?? []).filter(valid);
        // Los stops totalmente transparentes NO son fondo: un rgba(...,0) pintado
        // sobre blanco devuelve blanco y, con texto blanco encima, sale 1:1 — un
        // fallo inventado. Y si hay stops opacos, ellos mandan: los translúcidos
        // se apoyan encima y no pueden ser el peor caso por sí solos.
        const opaqueStops = all.filter((s) => alphaOf(s) >= 1);
        const stops = opaqueStops.length > 0 ? opaqueStops : all.filter((s) => alphaOf(s) > 0);
        if (stops.length > 0) return stops.map((s) => paint([s, ...above.slice().reverse()]));
      }
      const bc = cs.backgroundColor;
      if (valid(bc)) {
        const a = alphaOf(bc);
        if (a >= 1) return [paint([bc, ...above.slice().reverse()])];
        if (a > 0) above.push(bc);
      }
    }
    return [paint(above.slice().reverse())];
  };

  /**
   * Texto compuesto sobre una FOTO. No es evaluable automáticamente: el backdrop
   * real es la imagen más un overlay que suele ser HERMANO del texto, no
   * ancestro, así que recorrer ancestros devuelve el color del contenedor y da
   * un ratio inventado (las cards de ciudad salían a 1.1:1).
   *
   * La auditoría original ya excluía este caso y lo verificaba aparte. Se separa
   * en vez de ignorarlo, para que quede contado y visible.
   */
  const overImagery = (el: Element) => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      for (const img of Array.from(n.querySelectorAll(':scope > img, :scope > picture'))) {
        const p = getComputedStyle(img).position;
        if (p === 'absolute' || p === 'fixed') return true;
      }
    }
    return false;
  };

  const out: { tag: string; text: string; ratio: number; min: number; bg: string }[] = [];
  const overImage: string[] = [];
  let checked = 0;
  for (const el of Array.from(document.querySelectorAll('body *'))) {
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
    // WCAG 2.1 SC 1.4.3 exime el texto que forma parte de un componente de
    // interfaz INACTIVO. Los pasos futuros del wizard son <button disabled>
    // reales, no gris decorativo. Sin esta exención la sonda grita en falso, y
    // un guard que grita en falso termina ignorado.
    if (el.closest('[disabled], [aria-disabled="true"]')) continue;
    if (overImagery(el)) {
      overImage.push(`${el.tagName} "${own.slice(0, 40)}"`);
      continue;
    }
    checked++;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const min = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    let worst = Infinity;
    let worstBg: Rgb = [255, 255, 255];
    for (const bg of backgroundsBehind(el)) {
      const v = ratio(paint([`rgb(${bg[0]},${bg[1]},${bg[2]})`, cs.color]), bg);
      if (v < worst) {
        worst = v;
        worstBg = bg;
      }
    }
    if (worst < min) {
      out.push({
        tag: el.tagName,
        text: own.slice(0, 50),
        ratio: Number(worst.toFixed(2)),
        min,
        bg: `rgb(${worstBg.join(',')})`,
      });
    }
  }
  return { checked, failures: out, overImage };
};
