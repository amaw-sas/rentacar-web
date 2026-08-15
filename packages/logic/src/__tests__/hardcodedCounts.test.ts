/**
 * SCEN-004 y SCEN-005 de docs/specs/conteo-sedes-derivado.
 *
 * Ningún texto de las tres marcas puede volver a llevar el número de sedes o de
 * ciudades escrito a mano. La auditoría del 2026-08-14 encontró siete sitios con
 * "27 sedes" (eran 31) y cuatro con conteos de ciudades pasados de fecha, y el
 * patrón se repitió en las tres marcas porque el fichero se copió tal cual.
 *
 * Esta guarda cubre los ficheros que se corrigieron y sus gemelos por marca. Es
 * la versión multimarca de SCEN-BLOG-01, que ya protegía el blog de alquilame.
 *
 * Deliberadamente NO barre todo el repo: hay cifras legítimas pegadas a la
 * palabra "ciudades" en prosa editorial de las páginas de ciudad ("una ciudad de
 * más de 300.000 habitantes"), y una guarda global las confundiría con conteos.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const REPO = join(__dirname, '..', '..', '..', '..') // → raíz del monorepo
const BRANDS = ['alquilame', 'alquilatucarro', 'alquicarros'] as const

/** Ficheros que anuncian cobertura y que por tanto no pueden llevar la cifra. */
const GUARDED = [
  'app/components/Hero/Description.vue',
  'app/pages/blog/index.vue',
  'app/pages/blog/[...slug].vue',
  'app/pages/gana/index.vue',
] as const

/** "27 sedes", "más de 20 ciudades", "nuestras 19 sedes"… */
const HARDCODED_COUNT = /\d+\s+(sedes?|ciudades|agencias|sucursales)\b/i

/**
 * El source sin comentarios. Todas las guardas de aquí miran lo que ve el
 * cliente: un comentario que cuenta por qué el número dejó de estar escrito
 * ("decía 27 sedes cuando eran 31") no es una cifra en la página.
 */
function visibleText(code: string): string {
  return code
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function sources(): { path: string; code: string }[] {
  const out: { path: string; code: string }[] = []
  for (const brand of BRANDS) {
    for (const rel of GUARDED) {
      const full = join(REPO, 'packages', `ui-${brand}`, rel)
      // No todas las marcas tienen todas las páginas; ausente == nada que vigilar.
      if (!existsSync(full)) continue
      out.push({ path: `ui-${brand}/${rel}`, code: readFileSync(full, 'utf-8') })
    }
  }
  return out
}

describe('conteo de sedes y ciudades — nunca escrito a mano', () => {
  const files = sources()

  it('encuentra los ficheros vigilados en las tres marcas', () => {
    // Si un rename deja la lista vacía, los tests de abajo pasarían en vacío.
    expect(files.length).toBeGreaterThanOrEqual(10)
  })

  it.each(files.map((f) => [f.path, f.code] as const))(
    'SCEN-004/005: %s no quema el número',
    (path, code) => {
      const hit = visibleText(code).match(HARDCODED_COUNT)
      expect(hit?.[0], `${path} lleva "${hit?.[0]}" escrito a mano`).toBeUndefined()
    },
  )

  it('SCEN-006: el que habla de sedes usa el conteo de sedes', () => {
    for (const { path, code } of files) {
      if (!/\bsedes\b/.test(visibleText(code))) continue
      expect(code, `${path} habla de sedes sin useBranchCount`).toContain('useBranchCount')
    }
  })
})
