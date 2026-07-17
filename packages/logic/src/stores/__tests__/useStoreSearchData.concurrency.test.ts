import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Issue 322 SCEN-322-E06 — search generation guard.
 */
const source = readFileSync(
  fileURLToPath(new URL('../useStoreSearchData.ts', import.meta.url)),
  'utf8',
)

describe('SCEN-322-E06 — search() descarta respuestas viejas', () => {
  it('mantiene un contador de generación y descarta si no coincide', () => {
    expect(source).toMatch(/searchGeneration/)
    expect(source).toMatch(/const gen = \+\+searchGeneration/)
    expect(source).toMatch(/if \(gen !== searchGeneration\) return/)
  })

  it('re-chequea antes de apagar pending', () => {
    // At least two discard checks (post-fetch + pre-pending).
    const discards = source.match(/if \(gen !== searchGeneration\) return/g) ?? []
    expect(discards.length).toBeGreaterThanOrEqual(2)
  })
})
