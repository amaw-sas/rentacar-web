// @vitest-environment jsdom
//
// Issue #401 — evidencia DOM de las superficies de cotización rancia. Cuando el
// tramo vivo deja de coincidir con el que pidió la disponibilidad, `searchStale`
// se enciende y la gama se anula: cada superficie debe DEJAR de afirmar precios y
// disponibilidad que ya no valen y explicar por qué.
//
// Mismo arnés hermético que WizardSummary.mount.test.ts: `storeToRefs` de pinia se
// mockea a identidad (nuestros stores-stub ya son objetos de refs) y los stores
// auto-import se stubean como globals. WizardStaleNotice se registra REAL (sin deps)
// para que la evidencia incluya su copy y su botón de vuelta.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('pinia', () => ({
  storeToRefs: (s: Record<string, unknown>) => s,
}))

import WizardSummary from '../WizardSummary.vue'
import WizardStaleNotice from '../WizardStaleNotice.vue'
import StepCoverage from '../steps/StepCoverage.vue'
import StepExtras from '../steps/StepExtras.vue'
import StepVehicle from '../steps/StepVehicle.vue'

const fmt = new Intl.NumberFormat('es-CO', {
  style: 'decimal',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})
const money = (n: number) => fmt.format(n)

afterEach(() => vi.unstubAllGlobals())

// ── WizardSummary rancio (SCEN-401-01/-02/-10) ────────────────────────────────

const summaryStubs = {
  UButton: {
    emits: ['click'],
    template: '<button class="cta" @click="$emit(\'click\')"><slot /></button>',
  },
  IconsChevronDownIcon: { template: '<span class="chevron" />' },
}

function stubSummaryStores(trip: Record<string, unknown> = {}) {
  const form = {
    selectedPickupLocation: ref({ name: 'Bogotá Aeropuerto', city: 'bogota' }),
    selectedReturnLocation: ref({ name: 'Medellín Centro', city: 'medellin' }),
    lugarRecogida: ref('BOG-A'),
    lugarDevolucion: ref('MED-CENTRO'),
    selectedDays: ref(7),
    humanFormattedPickupDateShort: ref('22 de jul de 2026'),
    humanFormattedPickupHour: ref('10:00 a. m.'),
    humanFormattedReturnDateShort: ref('29 de jul de 2026'),
    humanFormattedReturnHour: ref('6:00 p. m.'),
    isSubmittingForm: ref(false),
    formSubmitLocked: ref(false),
    haveMonthlyReservation: ref(false),
    ...Object.fromEntries(Object.entries(trip).map(([k, v]) => [k, ref(v)])),
  }
  // Gama anulada: es la consecuencia observable de la rancia.
  const search = { selectedCategory: ref(null) }
  vi.stubGlobal('useStoreReservationForm', () => form)
  vi.stubGlobal('useStoreSearchData', () => search)
}

const mountSummaryStale = () =>
  mount(WizardSummary, {
    props: { canAdvance: false, ctaLabel: 'Continuar', searchStale: true },
    global: { stubs: summaryStubs },
  })

describe('WizardSummary rancio (#401) — el precio se va, la causa aparece', () => {
  it('SCEN-401-01: no enseña ningún total (ni viejo ni otro) y dice por qué; el CTA queda deshabilitado', () => {
    stubSummaryStores()
    const w = mountSummaryStale()

    // Total prominente cae a "—" (fail-closed, sin "$").
    const total = w.get('[data-testid="wizard-total-a-pagar"]').text()
    expect(total).toContain('—')
    expect(total).not.toContain('$')
    // Sin desglose ni línea de traslado.
    expect(w.find('[data-testid="wizard-total-renta"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-iva-tax-line"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-return-fee-line"]').exists()).toBe(false)
    // La causa está escrita, y en ámbar para señalar la deriva (body-xs fija el color
    // vía --text-muted; sin el modificador `!` el amber sería CSS muerto y quedaría gris).
    const reasonDesktop = w.get('[data-testid="wizard-stale-reason"]')
    expect(reasonDesktop.text()).toMatch(/pulsa BUSCAR/i)
    expect(reasonDesktop.classes()).toContain('text-amber-800!')
    // El CTA de escritorio está deshabilitado (canAdvance=false).
    expect(w.get('[data-testid="wizard-continue-desktop-test"]').attributes('disabled')).toBeDefined()
  })

  it('SCEN-401-02: la fila de devolución sigue viva (el tramo elegido), sin "incluye traslado" colgando de un badge caduco', () => {
    stubSummaryStores()
    const w = mountSummaryStale()
    // El tramo NO se oculta: es lo que el usuario acaba de elegir.
    expect(w.get('[data-testid="wizard-return-branch"]').text()).toContain('Medellín Centro')
    expect(w.get('[data-testid="wizard-oneway-badge"]').text()).toBe('otra ciudad')
    // Pero ninguna línea de precio la acompaña.
    expect(w.find('[data-testid="wizard-return-fee-line"]').exists()).toBe(false)
  })

  it('SCEN-401-10: móvil — el motivo se ve SIN expandir el detalle (bajo el CTA muerto)', () => {
    stubSummaryStores()
    const w = mountSummaryStale()
    // Sin abrir el bottom-sheet, la franja de motivo ya está en el DOM, en ámbar.
    const reasonMobile = w.get('[data-testid="wizard-stale-reason-mobile"]')
    expect(reasonMobile.text()).toMatch(/pulsa BUSCAR/i)
    expect(reasonMobile.classes()).toContain('text-amber-800!')
    expect(w.get('[data-testid="wizard-continue-mobile-test"]').attributes('disabled')).toBeDefined()
  })

  it('camino feliz (regresión): sin searchStale y con cotización, el motivo NO aparece', () => {
    const form = {
      selectedPickupLocation: ref({ name: 'Bogotá Aeropuerto', city: 'bogota' }),
      selectedReturnLocation: ref({ name: 'Bogotá Aeropuerto', city: 'bogota' }),
      lugarRecogida: ref('BOG-A'),
      lugarDevolucion: ref('BOG-A'),
      selectedDays: ref(7),
      humanFormattedPickupDateShort: ref('22 de jul de 2026'),
      humanFormattedPickupHour: ref('10:00 a. m.'),
      humanFormattedReturnDateShort: ref('29 de jul de 2026'),
      humanFormattedReturnHour: ref('6:00 p. m.'),
      isSubmittingForm: ref(false),
      formSubmitLocked: ref(false),
      haveMonthlyReservation: ref(false),
    }
    const search = {
      selectedCategory: ref({
        categoryCode: 'C',
        isMonthlyPriceUnavailable: false,
        withTotalCoverage: false,
        withMileage: null,
        withExtraDriver: false,
        withBabySeat: false,
        withWash: false,
        getTotalWithAdditionals: 881797,
        getTotalToPayWithAdditionals: 1154273,
        returnFeeAmount: 0,
        currencyTotalPrice: money(881797),
        currencyActualTotalPrice: money(1154273),
        currencyTotalWithAdditionals: money(881797),
        currencyTotalToPayWithAdditionals: money(1154273),
        currencyIvaAndTax: money(272476),
        currencyReturnFee: money(0),
      }),
    }
    vi.stubGlobal('useStoreReservationForm', () => form)
    vi.stubGlobal('useStoreSearchData', () => search)
    const w = mount(WizardSummary, {
      props: { canAdvance: true, ctaLabel: 'Continuar', searchStale: false },
      global: { stubs: summaryStubs },
    })
    expect(w.find('[data-testid="wizard-stale-reason"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-stale-reason-mobile"]').exists()).toBe(false)
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('$ ' + money(1154273))
  })
})

// ── Pasos 3/4 rancios: el aviso SUSTITUYE el contenido (SCEN-401-04c) ──────────

describe('StepCoverage rancio (#401) — el aviso sustituye al comparador', () => {
  function stub(monthly: boolean) {
    vi.stubGlobal('useStoreSearchData', () => ({ selectedCategory: ref(null) }))
    vi.stubGlobal('useStoreReservationForm', () => ({
      haveMonthlyReservation: ref(monthly),
      fechaRecogida: ref('2026-08-01'),
    }))
    vi.stubGlobal('useMoneyFormat', () => ({ moneyFormat: (n: number) => money(n) }))
  }

  it('SCEN-401-04c: en mensual con la gama anulada NO imprime "+ $ / mes" ni marca la card Básico; muestra el aviso', () => {
    stub(true)
    const w = mount(StepCoverage, {
      props: { searchStale: true },
      // UIcon vive en la rama v-else (comparador): no se pinta con searchStale, pero
      // Vue hoistea su resolveComponent → stub para no ensuciar stderr.
      global: { components: { WizardStaleNotice }, stubs: { UIcon: true } },
    })
    const text = w.text()
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(true)
    // Ninguna afirmación falsa del comparador.
    expect(text).not.toContain('/ mes')
    expect(text).not.toContain('Seguro Básico')
    expect(text).not.toContain('Seguro Total')
    expect(text).not.toContain('Recomendado')
    expect(w.find('[data-testid="wizard-coverage-basico-test"]').exists()).toBe(false)
    // La vía de vuelta existe.
    expect(w.find('[data-testid="wizard-adjust-search-test"]').exists()).toBe(true)
  })

  it('camino feliz (regresión): sin searchStale y con gama, el comparador se renderiza y no hay aviso', () => {
    vi.stubGlobal('useStoreSearchData', () => ({
      selectedCategory: ref({
        withTotalCoverage: false,
        withMileage: '1k_kms',
        canQuoteTotalCoverage: true,
        totalCoverageUnitCharge: 20000,
        coverageUnitCharge: 5000,
        categoryMonthPrices: null,
      }),
    }))
    vi.stubGlobal('useStoreReservationForm', () => ({
      haveMonthlyReservation: ref(false),
      fechaRecogida: ref('2026-08-01'),
    }))
    vi.stubGlobal('useMoneyFormat', () => ({ moneyFormat: (n: number) => money(n) }))
    const w = mount(StepCoverage, {
      props: { searchStale: false },
      global: { components: { WizardStaleNotice }, stubs: { UIcon: true } },
    })
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-coverage-basico-test"]').exists()).toBe(true)
  })
})

describe('StepExtras rancio (#401) — el aviso sustituye los toggles', () => {
  it('SCEN-401-04c: con la gama anulada no hay filas "$ " ni checkboxes; muestra el aviso y la vuelta', () => {
    vi.stubGlobal('useStoreSearchData', () => ({ selectedCategory: ref(null) }))
    const w = mount(StepExtras, {
      props: { searchStale: true },
      global: { components: { WizardStaleNotice }, stubs: { UCheckbox: true } },
    })
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(true)
    expect(w.find('[data-testid="wizard-extra-driver-test"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-extras-skip-test"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Conductor adicional')
    expect(w.find('[data-testid="wizard-adjust-search-test"]').exists()).toBe(true)
  })

  it('camino feliz (regresión): sin searchStale se renderizan los toggles y el botón Omitir', () => {
    vi.stubGlobal('useStoreSearchData', () => ({
      selectedCategory: ref({
        withExtraDriver: false,
        withBabySeat: false,
        withWash: false,
        currencyExtraDriverPrice: money(84000),
        currencyBabySeatPrice: money(20000),
        currencyWashPrice: money(30000),
      }),
    }))
    const w = mount(StepExtras, {
      props: { searchStale: false },
      global: { components: { WizardStaleNotice }, stubs: { UCheckbox: true } },
    })
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-extras-skip-test"]').exists()).toBe(true)
    expect(w.text()).toContain('Conductor adicional')
  })
})

// ── Paso 2 rancio: el aviso gana al vacío y al error (SCEN-401-03/-03b/-09) ────

describe('StepVehicle rancio (#401) — el aviso gana a "Sin vehículos" y al error', () => {
  function stub(opts: { error?: unknown } = {}) {
    vi.stubGlobal('useStoreSearchData', () => ({
      filteredCategories: ref([]),
      pending: ref(false),
      selectedCategory: ref(null),
      error: ref(opts.error ?? null),
    }))
    vi.stubGlobal('useStoreReservationForm', () => ({
      vehiculo: ref(null),
      haveMonthlyReservation: ref(false),
      fechaRecogida: ref('2026-08-01'),
    }))
    vi.stubGlobal('useFetchRentacarData', () => ({ vehicleCategories: {} }))
    vi.stubGlobal('useMoneyFormat', () => ({ moneyFormat: (n: number) => money(n) }))
    // StepVehicle usa `useWizardNotice` (#368), que llama a `useState`. Con la ranura
    // en null el banner de aviso queda vacío, así que la única superficie es el aviso
    // de rancia — justo lo que estos escenarios comprueban.
    vi.stubGlobal('useState', (_key: string, init?: () => unknown) =>
      ref(init ? init() : null),
    )
  }

  it('SCEN-401-03: con el tramo cambiado sin buscar muestra el aviso, no "Sin vehículos"', () => {
    stub()
    const w = mount(StepVehicle, {
      props: { searchStale: true },
      global: {
        components: { WizardStaleNotice },
        // Los componentes del grid viven en la rama v-else (no se pintan con
        // searchStale); stub para silenciar el resolveComponent hoisteado.
        stubs: {
          PlaceholdersCategoryCard: true,
          WizardVehicleSegmentTile: true,
          WizardVehicleCard: true,
          UIcon: true,
        },
      },
    })
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(true)
    expect(w.find('[data-testid="wizard-vehicle-empty-test"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Sin vehículos')
  })

  it('SCEN-401-09: el aviso gana al banner de error de disponibilidad (que ya no describe el tramo del usuario)', () => {
    stub({ error: { error: 'one_way_not_available', message: 'x' } })
    const w = mount(StepVehicle, {
      props: { searchStale: true },
      global: {
        components: { WizardStaleNotice },
        // Los componentes del grid viven en la rama v-else (no se pintan con
        // searchStale); stub para silenciar el resolveComponent hoisteado.
        stubs: {
          PlaceholdersCategoryCard: true,
          WizardVehicleSegmentTile: true,
          WizardVehicleCard: true,
          UIcon: true,
        },
      },
    })
    expect(w.find('[data-testid="wizard-stale-notice-test"]').exists()).toBe(true)
    expect(w.find('[data-testid="wizard-vehicle-error-test"]').exists()).toBe(false)
  })
})

// ── El aviso en sí ────────────────────────────────────────────────────────────

describe('WizardStaleNotice — copy y vía de vuelta', () => {
  it('nombra la causa y ofrece el botón que emite adjust-search', async () => {
    const w = mount(WizardStaleNotice)
    expect(w.text()).toContain('Cambiaste los datos de búsqueda')
    expect(w.text()).toMatch(/BUSCAR/)
    const btn = w.get('[data-testid="wizard-adjust-search-test"]')
    await btn.trigger('click')
    expect(w.emitted('adjust-search')).toHaveLength(1)
  })
})
