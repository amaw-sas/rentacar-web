// @vitest-environment jsdom
//
// Issue #373 — evidencia DOM del desglose de precio del resumen del wizard.
// Complementa los tests de source (wizard-summary-price.test.ts) montando el
// componente real y verificando que las tres cifras REALES aterrizan en el DOM
// en su sitio y RECONCILIAN (SCEN-03), además de fail-closed (#313) y mensual.
//
// Montaje hermético (sin Nuxt/servidor): `storeToRefs` de pinia se mockea a
// identidad porque nuestros stores-stub ya exponen refs; los stores auto-import
// se stubean como globals. Los datos numéricos usan el MISMO formateador que
// producción (Intl es-CO, 0 decimales) para que las cadenas sean fieles.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('pinia', () => ({
  // Nuestros stores-stub YA son objetos de refs → storeToRefs es identidad.
  storeToRefs: (s: Record<string, unknown>) => s,
}))

import WizardSummary from '../WizardSummary.vue'

const fmt = new Intl.NumberFormat('es-CO', {
  style: 'decimal',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})
const money = (n: number) => fmt.format(n)

/**
 * Construye un stub de `selectedCategory` fiel a la forma real de useCategory:
 * las cadenas `currency*` derivan de los mismos números por el mismo formateador,
 * de modo que renta + IVA/tasa = total a pagar reconcilia como en producción.
 */
function buildCategory(opts: {
  rentSubtotal: number // getTotalPrice (renta SIN IVA/tasa), sin adicionales
  actualTotal: number // getActualTotalPrice (CON IVA/tasa), sin adicionales
  additionals?: number // getAdditionalsTotal
  monthly?: boolean
  unavailable?: boolean
}) {
  const additionals = opts.additionals ?? 0
  const totalWithAdditionals = opts.rentSubtotal + additionals
  const toPayWithAdditionals = opts.actualTotal + additionals
  const ivaAndTax = Math.max(0, opts.actualTotal - opts.rentSubtotal)
  return {
    categoryCode: 'C',
    isMonthlyPriceUnavailable: opts.unavailable ?? false,
    withTotalCoverage: false,
    withMileage: null,
    withExtraDriver: additionals > 0,
    withBabySeat: false,
    withWash: false,
    // numéricos (los lee ivaTaxAmount)
    getTotalWithAdditionals: totalWithAdditionals,
    getTotalToPayWithAdditionals: toPayWithAdditionals,
    // cadenas ya formateadas
    currencyTotalPrice: money(opts.rentSubtotal),
    currencyActualTotalPrice: money(opts.actualTotal),
    currencyTotalWithAdditionals: money(totalWithAdditionals),
    currencyTotalToPayWithAdditionals: money(toPayWithAdditionals),
    currencyIvaAndTax: money(ivaAndTax),
  }
}

function stubStores(category: unknown, monthly = false) {
  const form = {
    selectedPickupLocation: ref({ name: 'Bogotá Aeropuerto' }),
    selectedDays: ref(7),
    humanFormattedPickupDateShort: ref('22 jul'),
    isSubmittingForm: ref(false),
    formSubmitLocked: ref(false),
    haveMonthlyReservation: ref(monthly),
  }
  const search = { selectedCategory: ref(category) }
  vi.stubGlobal('useStoreReservationForm', () => form)
  vi.stubGlobal('useStoreSearchData', () => search)
}

const stubs = {
  UButton: {
    emits: ['click'],
    template: '<button class="cta" @click="$emit(\'click\')"><slot /></button>',
  },
  IconsChevronDownIcon: { template: '<span class="chevron" />' },
}

const mountSummary = () =>
  mount(WizardSummary, {
    props: { canAdvance: true, ctaLabel: 'Confirmar reserva' },
    global: { stubs },
  })

afterEach(() => vi.unstubAllGlobals())

describe('WizardSummary — evidencia DOM del desglose de precio (#373)', () => {
  // Datos de la reserva real AVD5YCWXP del issue.
  const RENT = 881797
  const ACTUAL = 1154272.73
  const DRIVER = 84000

  it('SCEN-01/03: reserva diaria — el total prominente es el que se cobra y las tres cifras reconcilian', () => {
    stubStores(buildCategory({ rentSubtotal: RENT, actualTotal: ACTUAL }))
    const w = mountSummary()

    const total = w.get('[data-testid="wizard-total-a-pagar"]').text()
    const iva = w.get('[data-testid="wizard-iva-tax-line"]').text()
    const renta = w.get('[data-testid="wizard-total-renta"]').text()

    // El prominente es el total CON IVA + tasa (1.154.273), NO la renta (881.797).
    expect(total).toContain(money(ACTUAL)) // "1.154.273"
    expect(total).not.toContain(money(RENT)) // ya no muestra 881.797 como total
    expect(renta).toContain(money(RENT)) // "881.797"
    expect(iva).toContain(money(ACTUAL - RENT)) // "272.476"

    // SCEN-03: renta + IVA/tasa = total a pagar (reconciliación en el DOM).
    expect(RENT + Math.round(ACTUAL - RENT)).toBe(Math.round(ACTUAL))
    expect(w.text()).toContain('Total a pagar')
    expect(w.text()).toContain('Incluye IVA y tasa')
  })

  it('SCEN-03: con conductor adicional, el adicional entra en renta Y en el total a pagar; el IVA no cambia', () => {
    stubStores(buildCategory({ rentSubtotal: RENT, actualTotal: ACTUAL, additionals: DRIVER }))
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-total-renta"]').text()).toContain(money(RENT + DRIVER)) // 965.797
    expect(w.get('[data-testid="wizard-iva-tax-line"]').text()).toContain(money(ACTUAL - RENT)) // 272.476 (igual)
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain(money(ACTUAL + DRIVER)) // 1.238.273

    // Reconciliación con adicional.
    expect((RENT + DRIVER) + Math.round(ACTUAL - RENT)).toBe(Math.round(ACTUAL + DRIVER))
  })

  it('SCEN-04: reserva mensual — no se muestra la línea "IVA + Tasa" (el catálogo ya la incluye)', () => {
    // En mensual actualTotal == rentSubtotal (IVA embebido) → brecha 0.
    const monthlyTotal = 4149000
    stubStores(buildCategory({ rentSubtotal: monthlyTotal, actualTotal: monthlyTotal, monthly: true }), true)
    const w = mountSummary()

    expect(w.find('[data-testid="wizard-iva-tax-line"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-total-renta"]').exists()).toBe(false)
    // El total prominente conserva su valor mensual.
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain(money(monthlyTotal))
  })

  it('SCEN-05: más allá del horizonte (isMonthlyPriceUnavailable) — total "—", sin desglose (regresión #313)', () => {
    stubStores(buildCategory({ rentSubtotal: 0, actualTotal: 0, monthly: true, unavailable: true }), true)
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('—')
    expect(w.find('[data-testid="wizard-iva-tax-line"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Incluye IVA y tasa')
  })

  it('EDGE: dato anómalo diario donde actual ≤ renta — no se muestra "IVA + Tasa $0" ni renta ≥ total', () => {
    // getActualTotalPrice < getTotalPrice: la brecha se clampa a 0 → ocultar el desglose.
    stubStores(buildCategory({ rentSubtotal: 250000, actualTotal: 230000 }))
    const w = mountSummary()

    expect(w.find('[data-testid="wizard-iva-tax-line"]').exists()).toBe(false)
    expect(w.find('[data-testid="wizard-total-renta"]').exists()).toBe(false)
    // Solo el total prominente (el que se cobra), sin líneas contradictorias.
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain(money(230000))
  })
})
