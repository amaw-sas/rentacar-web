/**
 * Wizard de reserva (alquicarros) — Fase 3: integración routing/SEO/deep-links.
 *
 * Encoda los OBSERVABLES de cableado de:
 *  - SCEN-W-02 / W-01b (Paso 9): handshake búsqueda→avance en /reservas + entrada
 *    directa por query; el estado se refleja en ?paso.
 *  - SCEN-W-09 (Paso 10): CityPage mode="results" monta el wizard (external-search)
 *    en Paso 2, no CategorySelectionSection; SEO de la ruta sin cambios.
 *  - SCEN-W-14 (Paso 11): la ruta /categoria/[gama] preselecciona selectedCategory
 *    y entra en Paso 3; fallback Paso 2 si no hay match.
 *
 * Estilo source-assertion (igual que reservation-wizard-steps.test.ts). La
 * evidencia DOM/SSR/navegación viva se satisface en runtime (agent-browser) y en
 * el gate E2E (Paso 13). deriveStepFromRoute (unit) ya cubre la derivación
 * URL→paso en reservation-wizard-machine.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..') // → packages/ui-alquicarros

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const shell = () => read('app/components/wizard/ReservationWizard.vue')
const cityPage = () => read('app/components/CityPage.vue')

describe('Paso 9 — handshake búsqueda→avance en /reservas (SCEN-W-02)', () => {
  it('observa que lleguen params de búsqueda al query y avanza desde Paso 1', () => {
    const src = shell()
    // watch sobre lugar_recogida del query + avance cuando el paso actual es búsqueda
    expect(src).toMatch(/route\.query\.lugar_recogida/)
    expect(src).toMatch(/currentStep\.value === 'busqueda'/)
  })

  it('re-búsqueda con MISMOS params (URL igual, NuxtLink no navega) avanza al completarse', () => {
    // El watch de firma de query no dispara (params iguales); se observa la
    // transición de `pending` (true→false) estando en Paso 1 para avanzar.
    const src = shell()
    expect(src).toMatch(/watch\(\s*pending/)
    expect(src).toMatch(/wasPending && !isPending[\s\S]{0,80}busqueda/)
  })

  it('sincroniza el paso actual en el query string (?paso=) sin recargar', () => {
    const src = shell()
    expect(src).toMatch(/paso/)
    expect(src).toMatch(/replaceState|router\.replace/)
  })

  it('el handshake y el sync de URL NO corren en contexto de búsqueda externa (city)', () => {
    // Gateado por externalSearch: en city la URL es por path, no ?paso.
    expect(shell()).toMatch(/externalSearch/)
  })
})

describe('Paso 10 — CityPage results-mode monta el wizard (SCEN-W-09)', () => {
  it('CityPage en mode="results" renderiza el wizard, no CategorySelectionSection', () => {
    const src = cityPage()
    expect(src).toMatch(/<ReservationWizard\b/)
    expect(src).not.toMatch(/<CategorySelectionSection\b/)
  })

  it('el wizard en city usa external-search (Paso 1 lo provee CityHero, no el hero interno)', () => {
    expect(cityPage()).toMatch(/<ReservationWizard\b[^>]*external-search/)
  })

  it('el wizard acepta la prop externalSearch y NO monta StepSearch cuando es externa', () => {
    const src = shell()
    expect(src).toMatch(/externalSearch\??:\s*boolean/)
    // El hero interno (StepSearch) se gatea por !externalSearch
    expect(src).toMatch(/!externalSearch[\s\S]{0,40}isStep\('busqueda'\)|WizardStepsStepSearch\s+v-if="!externalSearch/)
  })

  it('en external, el paso "Búsqueda" del stepper ancla a #searcher (CityHero) en vez de montar Paso 1', () => {
    expect(shell()).toMatch(/#searcher|getElementById\(['"]searcher['"]\)|scrollIntoView/)
  })
})

describe('Paso 11 — deep-link /categoria/[gama] preselecciona (SCEN-W-14)', () => {
  it('lee route.params.categoria y fija selectedCategory con la fila que hace match', () => {
    const src = shell()
    expect(src).toMatch(/params\.categoria/)
    expect(src).toMatch(/selectedCategory\.value\s*=/)
  })

  it('cae a Paso 2 (vehiculo) si la gama del path no está en la disponibilidad', () => {
    // fallback observable: goTo('vehiculo') cuando no hay match
    expect(shell()).toMatch(/goTo\(['"]?(vehiculo|2)['"]?\)/)
  })
})

describe('Robustez Fase 3 — hallazgos de review (regresión)', () => {
  it('la preselección de gama excluye el centinela unable (999999999) — no preselecciona gama agotada', () => {
    expect(shell()).toMatch(/estimatedTotalAmount !== 999999999/)
  })

  it('red de seguridad: en paso ≥ seguro sin gama elegida tras asentarse la búsqueda → vuelve a Paso 2', () => {
    const src = shell()
    // gateado por una señal de "búsqueda asentada" (no por cats.length>0, que no
    // dispara con error/inventario vacío)
    expect(src).toMatch(/searchSettled/)
    expect(src).toMatch(/stepNumber\('seguro'\)|>= 3/)
    expect(src).toMatch(/maxReachedStep\.value = 2/)
  })

  it('el handshake avanza ante cualquier búsqueda nueva (firma de params), no solo cambio de pickup', () => {
    const src = shell()
    expect(src).toMatch(/fecha_recogida[\s\S]{0,120}fecha_devolucion/)
  })

  it('al arrancar una búsqueda nueva se descarta la gama elegida (evita cotización congelada — hallazgo PR)', () => {
    const src = shell()
    expect(src).toMatch(/isPending && !wasPending/)
    expect(src).toMatch(/selectedCategory\.value = null/)
  })

  it('la presencia de pickup se evalúa TRIMEADA (whitespace no cuenta), consistente con deriveStepFromRoute', () => {
    expect(shell()).toMatch(/String\(raw\)\.trim\(\)/)
    expect(read('app/pages/reservas/index.vue')).toMatch(/hasPickup/)
  })
})

describe('Aislamiento SEO — CityPage sigue mode-aware sin romper el landing', () => {
  it('el wizard solo se monta en mode="results" (landing conserva su marketing)', () => {
    const src = cityPage()
    // el bloque del wizard sigue gateado por mode/results (no aparece en landing)
    expect(src).toMatch(/mode === 'results'|resultsActive/)
  })
})
