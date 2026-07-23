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

describe('CategorySelectionSection — explicit heading utilities', () => {
  it('keeps both service-error headings at their written text-3xl size', () => {
    expect(source).toMatch(
      /class="font-heading text-3xl">Servicio temporalmente no disponible<\/div>/,
    )
    expect(source).toMatch(/class="font-heading text-3xl">¡Oops!<\/div>/)
  })

  it('keeps the pricing and availability headings on their explicit responsive ramps', () => {
    expect(source).toMatch(
      /class="font-heading text-xl md:text-2xl font-extrabold">\s*Las tarifas para tu fecha aún no están disponibles/,
    )
    expect(source).toMatch(
      /class="font-heading text-lg md:text-2xl font-extrabold">¡Vehículos Disponibles!<\/div>/,
    )
  })

  it('keeps the slideover title in Plus Jakarta at the explicit 2xl/extrabold treatment', () => {
    expect(source).toContain(
      "title: 'font-heading text-gray-900 text-2xl font-extrabold'",
    )
  })

  it('does not reintroduce unlayered heading tokens on these titles', () => {
    expect(source).not.toMatch(/\bheading-(section|card)\b/)
  })
})
