import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The results block unmounts when availability is nulled; searchOutdated must
// keep it mounted so the "Actualiza tu búsqueda" notice can render. Also the
// same-search click (#129) compares PATHS, not hrefs (route.fullPath keeps utm).

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const fragment = (src: string, from: string) => {
  const start = src.indexOf(from)
  expect(start, `missing ${from}`).toBeGreaterThan(-1)
  return src.slice(start, src.indexOf(')\n', start))
}

describe('alquilame results gates include searchOutdated', () => {
  it('reservas/Results.vue resultsActive includes searchOutdated', () => {
    const f = fragment(read('../reservas/Results.vue'), 'const resultsActive = computed(')
    expect(f).toMatch(/searchOutdated\.value/)
  })

  it('pages/reservas/index.vue resultsActive gates searchOutdated with hasResultsQuery', () => {
    const f = fragment(read('../../pages/reservas/index.vue'), 'const resultsActive = computed(')
    expect(f).toMatch(/searchOutdated\.value && hasResultsQuery\.value/)
  })
})

describe('Searcher same-search click compares paths', () => {
  for (const [brand, rel] of [
    ['alquilame', '../Searcher.vue'],
    ['alquilatucarro', '../../../../ui-alquilatucarro/app/components/Searcher.vue'],
  ] as const) {
    it(`${brand}: target.path === current.path, not href`, () => {
      const src = read(rel)
      const f = src.slice(src.indexOf('const onSearchClick'), src.indexOf('};', src.indexOf('const onSearchClick')))
      expect(f).toMatch(/target\.path === current\.path/)
      expect(f).not.toMatch(/target\.href === current\.href/)
    })
  }
})
