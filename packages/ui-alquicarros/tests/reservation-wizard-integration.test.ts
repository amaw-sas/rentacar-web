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

// SCEN-W-09 histórico: CityPage en mode="results" montaba el wizard. Ese modo
// quedó inalcanzable con routing independence (buscar-vehiculos eliminado de
// alquicarros; el único caller de CityPage es pages/[city]/index.vue con
// mode="landing") y SCEN-322-X06 eliminó el bloque y su import estático para
// que las landings de ciudad no descarguen el motor. La única superficie del
// wizard es /reservas.
describe('Paso 10 — el wizard vive en /reservas; CityPage ya no lo monta (SCEN-W-09 → SCEN-322-X06)', () => {
  it('CityPage no renderiza ni importa el wizard (ni el grid legacy)', () => {
    const src = cityPage()
    expect(src).not.toMatch(/<ReservationWizard\b/)
    expect(src).not.toMatch(/components\/wizard/)
    expect(src).not.toMatch(/<CategorySelectionSection\b/)
  })

  it('/reservas sigue montando el wizard (única superficie de reserva)', () => {
    expect(read('app/pages/reservas/index.vue')).toMatch(/<ReservationWizard\b/)
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

  it('al arrancar una búsqueda nueva se descarta la gama elegida (evita cotización congelada — hallazgo PR / #401)', () => {
    const src = shell()
    // La decisión (flanco pending false→true → descartar gama) vive ahora en
    // computeStaleTransition, unit-testeada en reservation-wizard-machine.test.ts.
    // El shell la cablea con flush:'sync' y anula selectedCategory como consecuencia.
    expect(src).toMatch(/computeStaleTransition/)
    expect(src).toMatch(/selectedCategory\.value = null/)
    expect(src).toMatch(/flush: 'sync'/)
  })

  it('la presencia de pickup se evalúa TRIMEADA (whitespace no cuenta), consistente con deriveStepFromRoute', () => {
    expect(shell()).toMatch(/String\(raw\)\.trim\(\)/)
    expect(read('app/pages/reservas/index.vue')).toMatch(/hasPickup/)
  })
})

describe('Invalidación de cotización por deriva del tramo (#401)', () => {
  const stepVehicle = () => read('app/components/wizard/steps/StepVehicle.vue')
  const stepCoverage = () => read('app/components/wizard/steps/StepCoverage.vue')
  const stepExtras = () => read('app/components/wizard/steps/StepExtras.vue')
  const summary = () => read('app/components/wizard/WizardSummary.vue')

  it('el watcher de invalidación captura con flush:sync vía computeStaleTransition', () => {
    const src = shell()
    expect(src).toMatch(/\[pending, liveSearchSignature\]/)
    expect(src).toMatch(/computeStaleTransition/)
    expect(src).toMatch(/flush: 'sync'/)
  })

  it('SCEN-401-04 (no-rebote): el watcher de invalidación NO mueve al usuario (sin goTo ni maxReachedStep)', () => {
    const src = shell()
    // Acota al CUERPO del watcher de invalidación (de su fuente al flush).
    const start = src.indexOf('[pending, liveSearchSignature]')
    const block = src.slice(start, src.indexOf("{ flush: 'sync' }", start))
    expect(block.length).toBeGreaterThan(0)
    expect(block).not.toMatch(/goTo/)
    expect(block).not.toMatch(/maxReachedStep/)
    // Su única secuela sobre la máquina es anular la gama, no navegar.
    expect(block).toMatch(/selectedCategory\.value = null/)
  })

  it('la firma del tramo vivo se deriva de los SEIS campos con reservationSearchSignature', () => {
    const src = shell()
    expect(src).toMatch(/reservationSearchSignature/)
    expect(src).toMatch(/liveSearchSignature[\s\S]{0,200}lugarRecogida[\s\S]{0,200}horaDevolucion/)
  })

  it('la adopción inicial va en onMounted, condicionada a searchSettled O gama', () => {
    const src = shell()
    expect(src).toMatch(/onMounted\(/)
    expect(src).toMatch(/quotedSearchSignature\.value = liveSearchSignature\.value/)
    expect(src).toMatch(/searchSettled\.value \|\| selectedCategory\.value/)
  })

  it('el @skip de Adicionales se enruta por un handler gateado (no wizard.next directo)', () => {
    const src = shell()
    expect(src).toMatch(/@skip="onSkipExtras"/)
    expect(src).not.toMatch(/@skip="wizard\.next"/)
    const fn = src.slice(src.indexOf('function onSkipExtras'))
    expect(fn.slice(0, 200)).toMatch(/canAdvanceCurrent/)
  })

  it('searchStale viaja como prop a los pasos 2/3/4 y al resumen', () => {
    const src = shell()
    // Cuatro superficies reciben el pestillo.
    expect((src.match(/:search-stale="searchStale"/g) ?? []).length).toBe(4)
  })

  it('los pasos 2/3/4 renderizan WizardStaleNotice cuando el tramo está rancio', () => {
    expect(stepVehicle()).toMatch(/<WizardStaleNotice\b/)
    expect(stepCoverage()).toMatch(/<WizardStaleNotice\b/)
    expect(stepExtras()).toMatch(/<WizardStaleNotice\b/)
  })

  it('en StepVehicle el aviso PRECEDE al error y al vacío (gana el orden de guardas)', () => {
    const src = stepVehicle()
    const stale = src.indexOf('v-else-if="searchStale"')
    const error = src.indexOf('v-else-if="availabilityError"')
    const empty = src.indexOf('v-else-if="groups.length === 0"')
    expect(stale).toBeGreaterThan(-1)
    expect(stale).toBeLessThan(error)
    expect(stale).toBeLessThan(empty)
  })

  it('en StepCoverage/StepExtras el v-if del aviso va DENTRO del componente (los watchers de script no-opean)', () => {
    // El aviso y su template alterno conviven en el mismo root: v-if / template v-else.
    expect(stepCoverage()).toMatch(/WizardStaleNotice v-if="searchStale"[\s\S]{0,80}<template v-else>/)
    expect(stepExtras()).toMatch(/WizardStaleNotice v-if="searchStale"[\s\S]{0,80}<template v-else>/)
  })

  it('el resumen añade la causa (desktop + móvil) sin ocultar el tramo vivo', () => {
    const src = summary()
    expect(src).toMatch(/v-else-if="searchStale"/)
    expect(src).toMatch(/data-testid="wizard-stale-reason"/)
    expect(src).toMatch(/data-testid="wizard-stale-reason-mobile"/)
    // La franja móvil va ENCIMA del transition del detalle (visible sin expandir).
    expect(src.indexOf('wizard-stale-reason-mobile')).toBeLessThan(src.indexOf('<transition'))
  })
})

describe('Aislamiento SEO — CityPage sigue mode-aware sin romper el landing', () => {
  it('el wizard solo se monta en mode="results" (landing conserva su marketing)', () => {
    const src = cityPage()
    // el bloque del wizard sigue gateado por mode/results (no aparece en landing)
    expect(src).toMatch(/mode === 'results'|resultsActive/)
  })
})
