import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Dogfood hallazgo #1: en /reservas, tras un error BLOQUEANTE (p.ej. server_error)
// el botón BUSCAR quedaba deshabilitado para la consulta idéntica. Causa: el
// store asigna categoriesAvailabilityData = [] (no-null) ante el error, y el
// watcher de useSearch apagaba animateSearchButton en cuanto el valor !== null,
// sin distinguir resultado-real de error. La infra de retry (#129 onSearchClick)
// ya existe; lo único que la bloqueaba era ese apagado.
//
// Fix: el watcher NO debe apagar el botón cuando el resultado fue un error
// bloqueante (isBlockingSearchError(error)). Un resultado real o inventario
// vacío (no_available_categories_error) sí lo deshabilita (dedup). Encodamos la
// guarda como source-text (precedente: useSearch.searchLinkParams.test.ts); la
// verificación behavioral real es runtime + el test del predicado.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

function extractWatcher(): string {
  const start = source.indexOf('watch(categoriesAvailabilityData')
  expect(start, 'missing categoriesAvailabilityData watcher').toBeGreaterThan(-1)
  const end = source.indexOf('});', start) + '});'.length
  return source.slice(start, end)
}

describe('useSearch — BUSCAR stays enabled after a blocking search error', () => {
  it('imports the isBlockingSearchError predicate', () => {
    expect(source).toMatch(/isBlockingSearchError/)
  })

  const block = extractWatcher()

  it('guards the animateSearchButton disable with the blocking-error predicate', () => {
    // The disable must only happen for a real/empty-inventory result, never for a
    // blocking error — so the disable line is gated by !isBlockingSearchError(...).
    expect(block).toMatch(/!isBlockingSearchError\(/)
    expect(block).toMatch(/animateSearchButton\.value\s*=\s*false/)
  })

  it('still only disables when there is a result (newValue !== null)', () => {
    expect(block).toMatch(/newValue\s*!==\s*null/)
  })
})
