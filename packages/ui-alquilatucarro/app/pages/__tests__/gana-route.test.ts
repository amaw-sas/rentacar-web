/**
 * /gana — la ruta debe ser alcanzable.
 *
 * Existía `public/gana/` (con el video). Nitro trata un directorio estático como
 * índice y redirige `/gana` a `/gana/`; el middleware `trailing-slash.ts` quita
 * la barra y devuelve a `/gana`, produciendo un bucle infinito de 301: la página
 * nunca cargaba y el prerender no podía generarla. `/blog` funciona precisamente
 * porque NO tiene `public/blog/`.
 *
 *   - SCEN-GANA-01: ningún asset estático puede vivir bajo `public/gana/`.
 *   - SCEN-GANA-02: el video se sirve desde `/videos/gana/` y el archivo existe.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilatucarro

describe('/gana — ruta alcanzable', () => {
  it('SCEN-GANA-01: no existe public/gana/ (colisiona con la ruta y causa bucle 301)', () => {
    expect(existsSync(join(ROOT, 'public/gana'))).toBe(false)
  })

  it('SCEN-GANA-02: el video se sirve desde /videos/gana/ y el archivo existe', () => {
    const page = readFileSync(join(ROOT, 'app/pages/gana/index.vue'), 'utf-8')
    expect(page).toContain('/videos/gana/explicativo.mp4')
    expect(page).not.toMatch(/src="\/gana\//)
    expect(existsSync(join(ROOT, 'public/videos/gana/explicativo.mp4'))).toBe(true)
  })
})
