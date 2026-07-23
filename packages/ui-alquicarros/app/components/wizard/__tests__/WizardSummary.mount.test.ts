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
  returnFee?: number // returnFeeAmount (YA sumado dentro de rentSubtotal)
  monthly?: boolean
  unavailable?: boolean
}) {
  const additionals = opts.additionals ?? 0
  const returnFee = opts.returnFee ?? 0
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
    // numéricos (los lee ivaTaxAmount / returnFeeLabel)
    getTotalWithAdditionals: totalWithAdditionals,
    getTotalToPayWithAdditionals: toPayWithAdditionals,
    returnFeeAmount: returnFee,
    // cadenas ya formateadas
    currencyTotalPrice: money(opts.rentSubtotal),
    currencyActualTotalPrice: money(opts.actualTotal),
    currencyTotalWithAdditionals: money(totalWithAdditionals),
    currencyTotalToPayWithAdditionals: money(toPayWithAdditionals),
    currencyIvaAndTax: money(ivaAndTax),
    currencyReturnFee: money(returnFee),
  }
}

/** Sede de recogida por defecto de los stubs (Bogotá). */
const PICKUP_BRANCH = { name: 'Bogotá Aeropuerto', city: 'bogota' }

/**
 * Refs del form que el resumen lee. `trip` sobrescribe el tramo (sedes, códigos,
 * fechas y horas) para cubrir round-trip vs one-way (#367) sin tocar el resto.
 */
function stubStores(category: unknown, monthly = false, trip: Record<string, unknown> = {}) {
  const form = {
    selectedPickupLocation: ref(PICKUP_BRANCH),
    selectedReturnLocation: ref(PICKUP_BRANCH),
    lugarRecogida: ref('BOG-AEROPUERTO'),
    lugarDevolucion: ref('BOG-AEROPUERTO'),
    selectedDays: ref(7),
    humanFormattedPickupDateShort: ref('22 de jul de 2026'),
    humanFormattedPickupHour: ref('10:00 a. m.'),
    humanFormattedReturnDateShort: ref('29 de jul de 2026'),
    humanFormattedReturnHour: ref('6:00 p. m.'),
    isSubmittingForm: ref(false),
    formSubmitLocked: ref(false),
    haveMonthlyReservation: ref(monthly),
    ...Object.fromEntries(Object.entries(trip).map(([k, v]) => [k, ref(v)])),
  }
  const search = { selectedCategory: ref(category) }
  vi.stubGlobal('useStoreReservationForm', () => form)
  vi.stubGlobal('useStoreSearchData', () => search)
}

/** Tramo one-way Bogotá → Medellín (ciudades distintas). */
const ONE_WAY_OTHER_CITY = {
  lugarDevolucion: 'MED-CENTRO',
  selectedReturnLocation: { name: 'Medellín Centro', city: 'medellin' },
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

    // SCEN-06: los importes llevan el signo peso "$ ".
    // El prominente es el total CON IVA + tasa (1.154.273), NO la renta (881.797).
    expect(total).toContain('$ ' + money(ACTUAL)) // "$ 1.154.273"
    expect(total).not.toContain(money(RENT)) // ya no muestra 881.797 como total
    expect(renta).toContain('$ ' + money(RENT)) // "$ 881.797"
    expect(iva).toContain('$ ' + money(ACTUAL - RENT)) // "$ 272.476"

    // SCEN-03: renta + IVA/tasa = total a pagar (reconciliación en el DOM).
    expect(RENT + Math.round(ACTUAL - RENT)).toBe(Math.round(ACTUAL))
    expect(w.text()).toContain('Total a pagar')
    expect(w.text()).toContain('Incluye IVA y tasa')
  })

  it('SCEN-03: con conductor adicional, el adicional entra en renta Y en el total a pagar; el IVA no cambia', () => {
    stubStores(buildCategory({ rentSubtotal: RENT, actualTotal: ACTUAL, additionals: DRIVER }))
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-total-renta"]').text()).toContain('$ ' + money(RENT + DRIVER)) // $ 965.797
    expect(w.get('[data-testid="wizard-iva-tax-line"]').text()).toContain('$ ' + money(ACTUAL - RENT)) // $ 272.476 (igual)
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('$ ' + money(ACTUAL + DRIVER)) // $ 1.238.273

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
    // El total prominente conserva su valor mensual, con signo peso.
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('$ ' + money(monthlyTotal))
  })

  it('SCEN-05: más allá del horizonte (isMonthlyPriceUnavailable) — total "—" SIN "$", sin desglose (regresión #313)', () => {
    stubStores(buildCategory({ rentSubtotal: 0, actualTotal: 0, monthly: true, unavailable: true }), true)
    const w = mountSummary()

    const total = w.get('[data-testid="wizard-total-a-pagar"]').text()
    expect(total).toContain('—')
    expect(total).not.toContain('$') // fail-closed no antepone "$" al guion
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
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('$ ' + money(230000))
  })
})

describe('WizardSummary — la devolución en el resumen (#367)', () => {
  const RENT = 881797
  const ACTUAL = 1154272.73
  const TRANSFER = 45000

  const daily = (extra: { returnFee?: number; additionals?: number } = {}) =>
    buildCategory({ rentSubtotal: RENT, actualTotal: ACTUAL, ...extra })

  it('SCEN-01: one-way a otra ciudad — la sede de entrega se nombra y se marca', () => {
    stubStores(daily(), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-return-branch"]').text()).toContain('Medellín Centro')
    expect(w.get('[data-testid="wizard-oneway-badge"]').text()).toBe('otra ciudad')
  })

  it('SCEN-01: la sede y su marca no se leen fusionadas ("Medellín Centrootra ciudad")', () => {
    // Vue (whitespace: 'condense') borra el nodo en blanco entre etiquetas: sin un
    // separador explícito el lector de pantalla anuncia los dos textos de corrido.
    // El margen visual del badge no arregla el flujo de texto.
    stubStores(daily(), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    // El navegador colapsa los blancos al renderizar; aquí se normalizan igual, lo
    // observable es que HAYA separación, no cuántos espacios trae el source.
    const row = w.get('[data-testid="wizard-return-branch"]').text().replace(/\s+/g, ' ')
    expect(row).not.toContain('Centrootra')
    expect(row).toContain('Medellín Centro otra ciudad')
  })

  it('SCEN-01: one-way dentro de la misma ciudad — la marca dice "otra sede"', () => {
    stubStores(daily(), false, {
      lugarDevolucion: 'BOG-NORTE',
      selectedReturnLocation: { name: 'Bogotá Norte', city: 'bogota' },
    })
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-return-branch"]').text()).toContain('Bogotá Norte')
    expect(w.get('[data-testid="wizard-oneway-badge"]').text()).toBe('otra sede')
  })

  it('SCEN-02: recogida y devolución llevan cada una su fecha y su hora; la fila "Desde" desaparece', () => {
    stubStores(daily(), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    const pickup = w.get('[data-testid="wizard-pickup-branch"]').text()
    expect(pickup).toContain('22 de jul de 2026')
    expect(pickup).toContain('10:00 a. m.')

    const dropoff = w.get('[data-testid="wizard-return-branch"]').text()
    expect(dropoff).toContain('29 de jul de 2026')
    expect(dropoff).toContain('6:00 p. m.')

    // La fecha de recogida ya vive bajo "Recogida": la fila "Desde" sobra.
    expect(w.text()).not.toContain('Desde')
  })

  it('SCEN-03: round-trip — la fila de devolución sigue, pero SIN marca de one-way', () => {
    stubStores(daily())
    const w = mountSummary()

    const dropoff = w.get('[data-testid="wizard-return-branch"]')
    expect(dropoff.text()).toContain('Bogotá Aeropuerto')
    expect(dropoff.text()).toContain('29 de jul de 2026')
    expect(w.find('[data-testid="wizard-oneway-badge"]').exists()).toBe(false)
  })

  it('SCEN-04: con tarifa de traslado — se nombra como INCLUIDA en el Total renta, no como sumando', () => {
    stubStores(daily({ returnFee: TRANSFER }), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    const line = w.get('[data-testid="wizard-return-fee-line"]').text()
    expect(line).toContain('$ ' + money(TRANSFER))
    expect(line.toLowerCase()).toContain('incluye')
    expect(line.toLowerCase()).toContain('traslado')

    // La reconciliación de #373 no se rompe: el traslado ya vive dentro de "Total renta".
    expect(w.get('[data-testid="wizard-total-renta"]').text()).toContain('$ ' + money(RENT))
    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('$ ' + money(ACTUAL))
  })

  it('SCEN-05: sin tarifa de traslado — no se renderiza la línea (nunca "traslado $ 0")', () => {
    stubStores(daily({ returnFee: 0 }))
    const w = mountSummary()

    expect(w.find('[data-testid="wizard-return-fee-line"]').exists()).toBe(false)
    expect(w.text().toLowerCase()).not.toContain('traslado')
  })

  it('SCEN-06: one-way con tarifa 0 (LLNRRE003) — la marca sigue, la línea de precio no', () => {
    stubStores(daily({ returnFee: 0 }), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    // El badge deriva de los códigos de sede, no de la tarifa: si dependiera del
    // dinero desaparecería justo en el caso que el issue denuncia.
    expect(w.get('[data-testid="wizard-oneway-badge"]').text()).toBe('otra ciudad')
    expect(w.find('[data-testid="wizard-return-fee-line"]').exists()).toBe(false)
  })

  it('SCEN-07: sin sede de devolución — "—" muted, sin marca y sin "undefined"', () => {
    // SCEN-07 admite omitir la fila O mostrar "—". Con fecha y hora presentes la rama
    // honesta es la segunda: omitirla se llevaría por delante el cuándo (ver el test
    // de regresión de abajo).
    stubStores(daily(), false, { lugarDevolucion: null, selectedReturnLocation: null })
    const w = mountSummary()

    const row = w.get('[data-testid="wizard-return-branch"]').text()
    expect(row).toContain('—')
    expect(row).toContain('29 de jul de 2026')
    expect(w.find('[data-testid="wizard-oneway-badge"]').exists()).toBe(false)
    expect(w.text()).not.toContain('undefined')
    expect(w.text()).not.toContain('null')
  })

  it('SCEN-07 (regresión): si la sede de recogida no resuelve, la FECHA sobrevive', () => {
    // `selectedPickupLocation` = searchBranchByCode(...), que da undefined con un código
    // fuera del catálogo (deep-link viejo, o la ventana antes de que llegue la admin
    // data). En main la fecha vivía en su propia fila "Desde" y aguantaba; al plegarla
    // como sub-línea de "Recogida" quedó gateada por la sede y desaparecía con ella.
    stubStores(daily(), false, { selectedPickupLocation: null })
    const w = mountSummary()

    const row = w.get('[data-testid="wizard-pickup-branch"]').text()
    expect(row).toContain('22 de jul de 2026')
    expect(row).toContain('10:00 a. m.')
    expect(w.text()).not.toContain('undefined')
  })

  it('SCEN-07: sin fecha NI sede de devolución, la fila no se emite (nada que decir)', () => {
    stubStores(daily(), false, {
      lugarDevolucion: null,
      selectedReturnLocation: null,
      humanFormattedReturnDateShort: '',
      humanFormattedReturnHour: '',
    })
    const w = mountSummary()

    expect(w.find('[data-testid="wizard-return-branch"]').exists()).toBe(false)
  })

  it('SCEN-04 (mensual): el traslado se nombra también cuando NO hay desglose de IVA', () => {
    // useCategory.ts:250,266 SUMA returnFee al total mensual, y el selector de
    // devolución no está gateado por duración: un one-way mensual cobraba el traslado
    // sin nombrarlo, porque la línea colgaba de showRentBreakdown (apagado en mensual).
    const monthlyTotal = 4149000
    stubStores(
      buildCategory({ rentSubtotal: monthlyTotal, actualTotal: monthlyTotal, returnFee: TRANSFER, monthly: true }),
      true,
      ONE_WAY_OTHER_CITY,
    )
    const w = mountSummary()

    expect(w.find('[data-testid="wizard-iva-tax-line"]').exists()).toBe(false)
    expect(w.get('[data-testid="wizard-return-fee-line"]').text()).toContain('$ ' + money(TRANSFER))
    expect(w.get('[data-testid="wizard-oneway-badge"]').text()).toBe('otra ciudad')
  })

  it('SCEN-05 + #313: más allá del horizonte no se anuncia traslado sobre un total "—"', () => {
    stubStores(
      buildCategory({ rentSubtotal: 0, actualTotal: 0, returnFee: TRANSFER, monthly: true, unavailable: true }),
      true,
      ONE_WAY_OTHER_CITY,
    )
    const w = mountSummary()

    expect(w.get('[data-testid="wizard-total-a-pagar"]').text()).toContain('—')
    expect(w.find('[data-testid="wizard-return-fee-line"]').exists()).toBe(false)
  })

  it('SCEN-01: con ciudad desconocida la marca NO afirma "misma ciudad"', () => {
    // `city` se tipa requerido pero nada lo valida en el ingest. Colapsar el caso a
    // "otra sede" understatea justo la entrega cara e inesperada en otra ciudad.
    stubStores(daily(), false, {
      selectedPickupLocation: { name: 'Bogotá Aeropuerto' },
      lugarDevolucion: 'MED-CENTRO',
      selectedReturnLocation: { name: 'Medellín Centro', city: 'medellin' },
    })
    const w = mountSummary()

    const badge = w.get('[data-testid="wizard-oneway-badge"]').text()
    expect(badge).toBe('otro punto')
    expect(badge).not.toBe('otra sede')
  })

  it('SCEN-01: la marca tampoco se fusiona con la fecha que va debajo', () => {
    // Misma trampa de `whitespace: condense` que entre sede y badge, un nodo más allá.
    stubStores(daily(), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    const row = w.get('[data-testid="wizard-return-branch"]').text().replace(/\s+/g, ' ')
    expect(row).not.toContain('ciudad29')
    expect(row).toContain('otra ciudad 29 de jul de 2026')
  })

  it('SCEN-09: el bottom-bar móvil muestra lo mismo que la tarjeta de escritorio', async () => {
    stubStores(daily({ returnFee: TRANSFER }), false, ONE_WAY_OTHER_CITY)
    const w = mountSummary()

    // El detalle móvil arranca colapsado; lo abre el botón "Ver detalle de la reserva".
    await w.get('button[aria-label="Ver detalle de la reserva"]').trigger('click')

    expect(w.get('[data-testid="wizard-return-branch-mobile"]').text()).toContain('Medellín Centro')
    expect(w.get('[data-testid="wizard-oneway-badge-mobile"]').text()).toBe('otra ciudad')
    expect(w.get('[data-testid="wizard-return-fee-line-mobile"]').text()).toContain('$ ' + money(TRANSFER))
  })
})
