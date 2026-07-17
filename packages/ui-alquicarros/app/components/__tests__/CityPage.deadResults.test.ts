import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CityPage.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X06 (issue #322): the mode === 'results' block statically imported
// the ReservationWizard, so every city LANDING downloaded the reservation
// engine it never renders. Verified dead: the only CityPage consumer is
// pages/[city]/index.vue with mode="landing" (buscar-vehiculos no longer exists
// in alquicarros). The branch was removed — landings must not pull the engine.
describe('SCEN-322-X06 — city landings do not download the reservation engine', () => {
  it('has no static import of the wizard', () => {
    expect(source).not.toMatch(/ReservationWizard/)
    expect(source).not.toMatch(/components\/wizard/)
  })

  it('the dead results section is gone', () => {
    expect(source).not.toMatch(/id="seleccion-categorias"/)
  })

  it('keeps the mode prop for CityHero and the marketing/contact gates', () => {
    expect(source).toMatch(/<CityHero :city="city" :mode="mode" \/>/)
    expect(source).toMatch(/mode\s*!==\s*['"]results['"]/)
  })
})
