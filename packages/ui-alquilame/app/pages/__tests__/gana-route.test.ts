/**
 * /gana — ruta alcanzable e identidad de marca correcta.
 *
 * Bug 1 (ruta): existía `public/gana/` (con el video). Nitro trata un directorio
 * estático como índice y redirige `/gana` a `/gana/`; el middleware
 * `trailing-slash.ts` quita la barra y devuelve a `/gana`, produciendo un bucle
 * infinito de 301: la página nunca cargaba y el prerender no podía generarla.
 * `/blog` funciona precisamente porque NO tiene `public/blog/`.
 *
 * Bug 2 (marca): el programa de referidos se portó desde alquilatucarro y se
 * quedó con SU paleta (azul marino y dorado). alquilame es ROJO; sus tokens
 * viven en assets/css/theme.css como --color-brand-N y --color-footer-from/to.
 *
 *   - SCEN-GANA-01: ningún asset estático puede vivir bajo `public/gana/`.
 *   - SCEN-GANA-02: el video se sirve desde `/videos/gana/` y el archivo existe.
 *   - SCEN-GANA-03: ninguna vista de /gana usa la paleta ajena ni el azul
 *     hardcodeado del layout.
 *   - SCEN-GANA-04: usan los tokens de marca de alquilame.
 *   - SCEN-GANA-05: el layout no usa el alias de degradado v3 roto, que con
 *     tokens @theme renderiza background-image:none.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')

// El layout propio `gana.vue` ya no existe: las tres vistas del programa usan el
// layout del sitio, así que el header y el footer reales viajan con ellas.
const GANA_FILES = [
  'app/pages/gana/index.vue',
  'app/pages/gana/terminos-condiciones.vue',
  'app/pages/gana/politicas-privacidad.vue',
]

// Ensamblados por fragmentos para que este archivo no contenga los literales que
// un grep del proyecto prohíbe en el markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))
const FOREIGN_PALETTE = new RegExp(
  String.raw`\b(?:bg|text|from|via|to|border|hover:bg|hover:text)-(?:blue|amber|yellow)-\d{2,3}\b`,
)

describe('/gana — ruta alcanzable', () => {
  it('SCEN-GANA-01: no existe public/gana/ (colisiona con la ruta y causa bucle 301)', () => {
    expect(existsSync(join(ROOT, 'public/gana'))).toBe(false)
  })

  it('SCEN-GANA-02: el video se retiró y no queda ni referencia ni archivo huérfano', () => {
    // Contrato actualizado: la página ya no muestra video (pesaba ~8 MB y los
    // pasos explican igual). Se borra también el asset para no dejar peso muerto.
    const page = read('app/pages/gana/index.vue')
    expect(page).not.toMatch(/<video\b/i)
    expect(page).not.toContain('explicativo.mp4')
    expect(existsSync(join(ROOT, 'public/videos/gana/explicativo.mp4'))).toBe(false)
  })
})

/**
 * La página vive dentro del sitio, no en una isla.
 *
 *   - SCEN-GANA-06: usa el layout por defecto (header y footer del sitio). Antes
 *     tenía un layout propio que inventaba su header y su pie de página, y el
 *     usuario perdía la navegación real.
 *   - SCEN-GANA-07: el registro es un formulario propio, no un iframe de Google
 *     Forms (sacaba al usuario del sitio y no respeta la marca).
 */
describe('/gana — integrada al sitio', () => {
  const page = read('app/pages/gana/index.vue')

  it('SCEN-GANA-06: no fuerza un layout propio', () => {
    expect(page).not.toMatch(/layout:\s*'gana'/)
  })

  it('SCEN-GANA-07: el registro usa formulario propio, no Google Forms', () => {
    expect(page).not.toMatch(/<iframe\b/i)
    expect(page).not.toContain('docs.google.com/forms')
    expect(page).toMatch(/<PublicContactForm[\s\S]*type="referidos"/)
  })
})

describe('/gana — identidad de alquilame, no de alquilatucarro', () => {
  for (const rel of GANA_FILES) {
    it(`SCEN-GANA-03: ${rel} no usa la paleta de alquilatucarro`, () => {
      const src = read(rel)
      expect(src).not.toMatch(FOREIGN_PALETTE)
      expect(src).not.toContain('#000073')
    })
  }

  it('SCEN-GANA-04: adopta los tokens de marca de alquilame', () => {
    expect(read('app/pages/gana/index.vue')).toMatch(/\btext-brand-\d{3}\b/)
    expect(read('app/pages/gana/index.vue')).toMatch(/from-footer-from/)
  })

  it('SCEN-GANA-05: ninguna vista usa el alias de degradado v3 roto', () => {
    for (const rel of GANA_FILES) expect(read(rel), rel).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('SCEN-GANA-06b: el layout propio desapareció (usan el del sitio)', () => {
    expect(existsSync(join(ROOT, 'app/layouts/gana.vue'))).toBe(false)
  })
})
