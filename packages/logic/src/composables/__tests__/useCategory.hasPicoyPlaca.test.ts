import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured (issue #93): the LU category is exempt from pico y placa
// — like the rest of its "L" family (LP, LY) — but its result card never
// rendered the "sin pico y placa" badge. CategoryTags.vue (all three brands)
// gates that badge on hasPicoyPlaca(), whose whitelist is the single source
// of truth. LU was missing from the array, so hasPicoyPlaca() returned false.
//
// Fix: add "LU" to the whitelist. Since hasPicoyPlaca is `categoryCode
// ? WHITELIST.includes(categoryCode) : false`, the array membership set IS
// the observable behavior — asserting the literal pins the scenario exactly.
// Source-level test mirrors the sibling suites, which deliberately avoid
// mocking Nuxt auto-imports (useFetchRentacarData) and Pinia.

const source = readFileSync(
  fileURLToPath(new URL('../useCategory.ts', import.meta.url)),
  'utf8',
)

function extractHasPicoyPlaca(): string {
  const start = source.indexOf('const hasPicoyPlaca =')
  expect(start, 'missing hasPicoyPlaca').toBeGreaterThan(-1)
  const end = source.indexOf(';', source.indexOf('.includes', start)) + 1
  return source.slice(start, end)
}

function whitelist(): string[] {
  const block = extractHasPicoyPlaca()
  const captured = block.match(/\[([^\]]*)\]/)?.[1]
  if (captured === undefined) throw new Error('missing whitelist array literal')
  return captured
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean)
}

describe('useCategory.hasPicoyPlaca — pico y placa exemption whitelist (issue #93)', () => {
  const codes = whitelist()

  it('SCEN-LU-1: LU is exempt → badge renders', () => {
    expect(codes).toContain('LU')
  })

  it('SCEN-LU-3: prior exempt categories stay exempt (no regression)', () => {
    for (const code of ['FU', 'FL', 'GL', 'LY', 'LP']) {
      expect(codes, `${code} dropped from whitelist`).toContain(code)
    }
  })

  it('SCEN-LU-2: a non-exempt category (C) is not in the whitelist', () => {
    expect(codes).not.toContain('C')
  })

  it('returns false when categoryCode is falsy, true only via the whitelist', () => {
    const block = extractHasPicoyPlaca()
    expect(block).toMatch(/categoryCode\.value\)\s*\?/)
    expect(block).toMatch(/\.includes\(categoryCode\.value\)\s*:\s*false/)
  })
})
