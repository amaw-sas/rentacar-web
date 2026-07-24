/**
 * Blog — alineación con el resto del sitio.
 *
 *   - SCEN-BLOG-01: el número de ciudades NO se quema en el markup. Estaba
 *     escrito "27 sedes" a mano y quedó desactualizado (son 19). Se toma del
 *     mismo origen que el footer (`cityCount` de usePublicCities), así que no
 *     puede volver a desincronizarse.
 *   - SCEN-BLOG-02: el hero usa el degradado rojo de marca, igual que
 *     /aliados, /quejas-y-reclamos y /gana, en vez del vino tinto plano que
 *     heredaba del layout.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame
const page = readFileSync(join(ROOT, 'app/pages/blog/index.vue'), 'utf-8')

describe('blog — consistencia de marca y datos', () => {
  it('SCEN-BLOG-01: no quema el conteo de ciudades ni de sedes', () => {
    expect(page).not.toMatch(/\d+\s+sedes?\b/)
    expect(page).not.toMatch(/\b\d+\s+ciudades\b/)
    expect(page).toContain('cityCount')
  })

  it('SCEN-BLOG-02: el hero usa el degradado de marca como el resto de páginas', () => {
    expect(page).toMatch(/from-footer-from[\s\S]{0,40}to-footer-to/)
  })
})
