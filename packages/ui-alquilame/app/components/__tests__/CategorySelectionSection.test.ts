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

  it('preserves its green background during loading (overrides Nuxt UI neutral+solid disabled:bg-inverted)', () => {
    // El verde es el de .boton-seleccion en la card: el avance es una sola
    // cadena verde —"Solicitar este vehículo" → "Siguiente" → "Solicitar
    // reserva"— y el rojo en el último paso leía como alerta justo al enviar.
    expect(submitButtonBlock).toMatch(/disabled:bg-green-700/)
    expect(submitButtonBlock).toMatch(/aria-disabled:bg-green-700/)
    expect(submitButtonBlock).not.toMatch(/bg-brand-600/)
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

describe('CategorySelectionSection — outdated-search notice', () => {
  // Assert on template / script fragments with HTML comments stripped, so a
  // comment mentioning the same words cannot satisfy a guard.
  const scriptStart = source.indexOf('<script setup')
  const template = source.slice(0, scriptStart).replace(/<!--[\s\S]*?-->/g, '')
  const script = source.slice(scriptStart)
  const roots = template.slice(template.indexOf('<template>') + '<template>'.length).trimStart()

  it('the notice is the FIRST branch of the v-if chain that holds the Oops block', () => {
    expect(roots).toMatch(/^<div v-if="awaitingSearch"[^>]*data-testid="search-outdated-notice"/)
    const oopsAt = roots.indexOf('Nos quedamos sin carritos')
    const chainHead = roots.slice(0, oopsAt)
    // exactly one v-if opens the chain; every later branch up to Oops is v-else-if
    expect(chainHead.match(/<div v-if=/g)?.length).toBe(1)
    expect(chainHead).toMatch(/<div v-else-if="isServerError/)
    expect(chainHead).toMatch(/<div v-else-if="!hasRenderableAvailable/)
  })

  it('renders the notice copy inside the notice block', () => {
    const start = roots.indexOf('data-testid="search-outdated-notice"')
    const block = roots.slice(start, roots.indexOf('<div v-else-if', start))
    expect(block).toContain('Actualiza tu búsqueda')
    expect(block).toContain('Cambiaste los datos. Dale clic a «Buscar vehículos» para ver los carros y precios disponibles.')
  })

  it('defines awaitingSearch as outdated AND not loading (script)', () => {
    expect(script).toMatch(/const awaitingSearch = computed\(\(\) => searchOutdated\.value && !pendingSearch\.value\)/)
    expect(script).toMatch(/searchOutdated,?\s*\n?\s*\} = storeToRefs\(storeSearch\)/)
  })

  it('hides horizon banner, results header and grid while awaitingSearch', () => {
    expect(template).toMatch(/v-if="allBeyondHorizon && !awaitingSearch"/)
    expect(template).toMatch(/v-if="hasRenderableAvailable && !awaitingSearch"/)
    expect(template).toMatch(/<div v-if="!awaitingSearch" class="grid /)
  })
})
