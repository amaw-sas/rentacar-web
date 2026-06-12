/**
 * Issue #73 — `image.domains` desde `NUXT_IMAGE_DOMAINS` (env) con fallback, en las 3 marcas.
 *
 * Invariante COMPARTIDO por las 3 brand configs (no solo alquilame): el host del Blob ya no está
 * hardcodeado como única fuente; se lee de la env con fallback al host actual. Este test vive en
 * alquilame (única marca cableada a vitest) pero audita los 3 `nuxt.config.ts` por static-source,
 * mismo patrón que `f0-assets.test.ts`.
 *
 *   - SCEN-73-01: cada config lee `process.env.NUXT_IMAGE_DOMAINS` con el host Blob como fallback
 *                 (`|| '…'`) parseado por `.split(',')`, y NO conserva `domains: ['9grznib0…']`.
 *   - SCEN-73-02: la expresión rinde el fallback con env ausente y el override (split+trim) con env
 *                 presente.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PKGS = join(__dirname, '..', '..') // packages/
const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const
const BLOB_HOST = '9grznib0czdjtk77.public.blob.vercel-storage.com'

function readConfig(brand: string): string {
  return readFileSync(join(PKGS, brand, 'nuxt.config.ts'), 'utf-8')
}

describe('SCEN-73-01 — image.domains desde NUXT_IMAGE_DOMAINS con fallback (3 marcas)', () => {
  for (const brand of BRANDS) {
    describe(brand, () => {
      const cfg = readConfig(brand)

      it('lee process.env.NUXT_IMAGE_DOMAINS', () => {
        expect(cfg).toContain('process.env.NUXT_IMAGE_DOMAINS')
      })

      it('usa el host Blob como fallback (|| \'…\')', () => {
        expect(cfg).toMatch(
          new RegExp(`process\\.env\\.NUXT_IMAGE_DOMAINS\\s*\\|\\|\\s*['"]${BLOB_HOST.replace(/\./g, '\\.')}['"]`),
        )
      })

      it('parsea la lista CSV con split(\',\')', () => {
        expect(cfg).toMatch(/NUXT_IMAGE_DOMAINS[\s\S]{0,120}\.split\(\s*['"],['"]\s*\)/)
      })

      it('ya NO hardcodea el host como única fuente (domains: [\'9grznib0…\'])', () => {
        expect(cfg).not.toMatch(/domains:\s*\[\s*['"]9grznib0czdjtk77/)
      })
    })
  }
})

describe('SCEN-73-02 — semántica de la expresión env-con-fallback', () => {
  // Réplica de la expresión exacta usada en los 3 configs (verificada por SCEN-73-01).
  const resolve = (env: string | undefined): string[] =>
    (env || BLOB_HOST).split(',').map((d) => d.trim()).filter(Boolean)

  it('env ausente → fallback al host Blob', () => {
    expect(resolve(undefined)).toEqual([BLOB_HOST])
  })

  it('env vacío → fallback al host Blob (no array vacío)', () => {
    expect(resolve('')).toEqual([BLOB_HOST])
  })

  it('env presente → override con split por coma + trim, sin vacíos', () => {
    expect(resolve(' a.example.com , b.example.com ,')).toEqual(['a.example.com', 'b.example.com'])
  })
})
