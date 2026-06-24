import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../SelectBranch.vue', import.meta.url)),
  'utf8',
)

describe('SelectBranch — branch selection navigates in the same tab', () => {
  it('does not open the reservation page in a new tab', () => {
    expect(source).not.toMatch(/target:\s*["']_blank["']/)
  })

  it('does not navigate as external (keeps SPA client-side routing)', () => {
    expect(source).not.toMatch(/external:\s*true/)
  })

  it('still builds the reservation URL with city and branch slug', () => {
    expect(source).toMatch(
      /\/\$\{branch\.city\}\/buscar-vehiculos\/lugar-recogida\/\$\{branch\.slug\}\/lugar-devolucion\/\$\{branch\.slug\}\//,
    )
  })
})

describe('SelectBranch — unlocks after bfcache restoration (browser back button)', () => {
  it('registers a pageshow listener on mount', () => {
    expect(source).toMatch(/addEventListener\(\s*['"]pageshow['"]/)
  })

  it('removes the pageshow listener on unmount to avoid leaks', () => {
    expect(source).toMatch(/removeEventListener\(\s*['"]pageshow['"]/)
  })

  it('only resets state when the page was restored from bfcache (event.persisted)', () => {
    expect(source).toMatch(/event\.persisted|\.persisted/)
  })

  it('resets selectedBranch to null so the native select and USelectMenu become responsive again', () => {
    expect(source).toMatch(/selectedBranch\.value\s*=\s*null/)
  })
})

// directiva 2026-06-23: el home ya no usa <select> nativo en móvil; usa el mismo
// patrón que el searcher — drawer a pantalla completa con buscador y opciones
// centradas (text-lg, paridad con el calendario). Estas aserciones son
// source-string como el resto del archivo (el .vue importa de #components, que
// no tiene alias en vitest, así que no se puede montar aquí).
describe('SelectBranch — mobile uses a full-screen drawer (no native select)', () => {
  it('drops the native <select> on mobile', () => {
    expect(source).not.toMatch(/<select\b/)
  })

  it('opens a full-height slideover drawer', () => {
    expect(source).toMatch(/<u-slideover|<USlideover/)
    expect(source).toMatch(/h-dvh/)
  })

  it('has a non-autofocusing search input', () => {
    expect(source).toMatch(/Buscar ciudad/)
    expect(source).toMatch(/:autofocus="false"/)
  })

  it('renders centered, text-lg options (parity with the searcher drawers)', () => {
    expect(source).toMatch(/justify-center/)
    expect(source).toMatch(/text-lg/)
  })

  it('navigates to the reservation page when an option is selected', () => {
    expect(source).toMatch(/goToReservationPage/)
  })
})
