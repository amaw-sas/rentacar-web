import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CategorySelectionSection.vue', import.meta.url)),
  'utf8',
)

const submitButtonBlock = (() => {
  // Label is a ternary (`Solicitando` / `Solicitar reserva`) — never `>Solicitar`.
  // Anchor on stable text so the block is never empty (issue 322 SCEN-322-CI03).
  const start = source.indexOf('Solicitar reserva')
  const before = source.lastIndexOf('<u-button', start)
  const after = source.indexOf('</u-button>', start) + '</u-button>'.length
  return source.slice(before, after)
})()

describe('CategorySelectionSection — Solicitar reserva button loading state', () => {
  beforeAll(() => {
    expect(submitButtonBlock.length).toBeGreaterThan(20)
    expect(submitButtonBlock).toContain('Solicitar reserva')
  })

  it('preserves brand green background during loading (overrides Nuxt UI neutral+solid disabled:bg-inverted)', () => {
    expect(submitButtonBlock).toMatch(/disabled:bg-green-700/)
    expect(submitButtonBlock).toMatch(/aria-disabled:bg-green-700/)
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
    expect(script).toMatch(/const awaitingSearch = computed\(\(\) => searchOutdated\.value && !showLoadingResults\.value\)/)
    expect(script).toMatch(/searchOutdated,?\s*\n?\s*\} = storeToRefs\(storeSearch\)/)
  })

  it('hides horizon banner, results header and grid while awaitingSearch', () => {
    expect(template).toMatch(/v-if="allBeyondHorizon && !awaitingSearch"/)
    expect(template).toMatch(/v-if="showLoadingResults \|\| \(hasRenderableAvailable && !awaitingSearch\)"/)
    expect(template).toMatch(/v-if="showLoadingResults \|\| resultSlots\.length"/)
    expect(script).toMatch(/awaitingSearch\.value\s*\n\s*\? \[\]/)
  })
})
