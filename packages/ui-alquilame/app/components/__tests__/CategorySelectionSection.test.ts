import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CategorySelectionSection.vue', import.meta.url)),
  'utf8',
)

const submitButtonBlock = (() => {
  // The label is rendered via a ternary — `{{ isSubmittingForm ? 'Solicitando'
  // : 'Solicitar reserva' }}` — so the literal `>Solicitar reserva` never
  // appears in the source. Anchor on the label text that is actually present.
  const start = source.indexOf('Solicitar reserva')
  const before = source.lastIndexOf('<u-button', start)
  const after = source.indexOf('</u-button>', start) + '</u-button>'.length
  return source.slice(before, after)
})()

describe('CategorySelectionSection — Solicitar reserva button loading state', () => {
  beforeAll(() => {
    expect(submitButtonBlock).toContain('Solicitar reserva')
  })

  it('preserves brand-600 background during loading (overrides Nuxt UI neutral+solid disabled:bg-inverted)', () => {
    expect(submitButtonBlock).toMatch(/disabled:bg-brand-600/)
    expect(submitButtonBlock).toMatch(/aria-disabled:bg-brand-600/)
  })

  it('dims the button subtly while loading so users perceive the state', () => {
    expect(submitButtonBlock).toMatch(/disabled:opacity-80/)
    expect(submitButtonBlock).toMatch(/aria-disabled:opacity-80/)
  })

  it('hides the trailing chevron during loading so the label has room on a single line', () => {
    expect(submitButtonBlock).toMatch(/<ChevronRightIcon[^>]*v-if="!isSubmittingForm"[^>]*\/>/)
    expect(submitButtonBlock).toMatch(/cls="size-5"/)
    expect(submitButtonBlock).not.toMatch(/animate-spin/)
  })
})
