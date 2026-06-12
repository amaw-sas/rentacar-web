import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../Placeholders/UnableCategoryCard.vue', import.meta.url)),
  'utf8',
)

describe('UnableCategoryCard — redesigned unavailable state', () => {
  it('SCEN-U1[a]: top banner uses bg-red-50 + border-l-4 border-red-500', () => {
    expect(source).toMatch(/bg-red-50/)
    expect(source).toMatch(/border-l-4\s+border-red-500/)
  })

  it('SCEN-U1[a]: banner uses lucide alert-triangle icon', () => {
    expect(source).toMatch(/i-lucide-alert-triangle/)
  })

  it('SCEN-U1[a]: banner consumes bannerText from useUnavailabilityContext', () => {
    expect(source).toMatch(/useUnavailabilityContext\s*\(\s*\)/)
    expect(source).toMatch(/bannerText/)
  })

  it('SCEN-U1[a]: second banner line is gated by isSpecific (no duplicated literal)', () => {
    // The literal 'No disponible para tu búsqueda' lives inside the composable;
    // the template MUST gate the second line on the exposed `isSpecific` flag,
    // never compare against the fallback string directly. This guards against
    // copy-drift if the composable's fallback ever changes.
    expect(source).toMatch(/v-if=['"]isSpecific['"]/)
    expect(source).not.toMatch(/'No disponible para tu búsqueda'/)
  })

  it('SCEN-U1[c]: legacy bg-red-100 pill is gone', () => {
    expect(source).not.toMatch(/bg-red-100/)
  })

  it('SCEN-U1[d]: two CTA labels present', () => {
    expect(source).toMatch(/Probar otras fechas/)
    expect(source).toMatch(/Probar otra sucursal cercana/)
  })

  it('SCEN-U2: scrollToSearcher handler wired', () => {
    expect(source).toMatch(/scrollToSearcher/)
    expect(source).toMatch(/getElementById\(['"]searcher['"]\)/)
    expect(source).toMatch(/scrollIntoView/)
  })

  it('SCEN-U1[e]: descripcion_larga collapsible was removed', () => {
    expect(source).not.toMatch(/descripcion_larga/)
  })
})
