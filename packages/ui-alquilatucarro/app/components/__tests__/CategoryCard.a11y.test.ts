import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CategoryCard.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-A01 — category info buttons have accessible names', () => {
  it('does not use alt= on buttons for info icons', () => {
    expect(source).not.toMatch(/alt=["']info["']/)
  })

  it('exposes aria-label on info controls', () => {
    const labels = source.match(/aria-label="[^"]+"/g) ?? []
    expect(labels.length).toBeGreaterThanOrEqual(5)
  })
})
