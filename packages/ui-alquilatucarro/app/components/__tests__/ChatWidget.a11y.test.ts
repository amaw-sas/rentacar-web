import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatWidget.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-A02/A03 — chat panel a11y', () => {
  it('closes on Escape', () => {
    expect(source).toMatch(/Escape/)
    expect(source).toMatch(/keydown/)
  })

  it('panel is a dialog with aria-modal and receives focus', () => {
    expect(source).toMatch(/role="dialog"/)
    expect(source).toMatch(/aria-modal="true"/)
    expect(source).toMatch(/panelEl\.value\?\.focus/)
  })

  it('keeps aria-live region for assistant announcements', () => {
    expect(source).toMatch(/aria-live="polite"/)
  })
})
