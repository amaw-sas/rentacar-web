import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The debounced param watcher delegates to store.invalidateIfParamsChanged()
// (nulls data + flags outdated only if params really differ from the last
// search) WITHOUT touching `error`: alquicarros reads it from the shared store.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

function extractDebouncedWatcher(): string {
  const start = source.indexOf('watchDebounced(')
  expect(start, 'missing watchDebounced block').toBeGreaterThan(-1)
  const end = source.indexOf('{ debounce:', start)
  expect(end, 'missing debounce option').toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('useSearch — debounced watcher flags the search as outdated', () => {
  const block = extractDebouncedWatcher()

  it('delegates invalidation to the store and only re-arms Buscar when it returns true', () => {
    expect(block).toMatch(/if\s*\(invalidateIfParamsChanged\(\)\)\s*animateSearchButton\.value\s*=\s*true/)
  })

  it('does not unconditionally null data or set the flag in the watcher', () => {
    expect(block).not.toMatch(/categoriesAvailabilityData\.value\s*=/)
    expect(block).not.toMatch(/searchOutdated\.value\s*=/)
  })

  it('does not assign the shared error ref', () => {
    expect(block).not.toMatch(/errorSearchResponse\.value\s*=/)
    expect(block).not.toMatch(/\berror\.value\s*=/)
  })

  it('takes invalidateIfParamsChanged from the store', () => {
    expect(source).toMatch(/const\s*\{[^}]*invalidateIfParamsChanged[^}]*\}\s*=\s*storeSearchData/)
  })

  it('the availability watcher never disables Buscar while the search is outdated', () => {
    const start = source.indexOf('watch(categoriesAvailabilityData')
    const end = source.indexOf('});', start)
    const w = source.slice(start, end)
    expect(w).toMatch(/!searchOutdated\.value/)
    expect(w).toMatch(/animateSearchButton\.value\s*=\s*false/)
  })
})
