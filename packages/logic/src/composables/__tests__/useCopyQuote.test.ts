/**
 * useCopyQuote (docs/specs/copiar-cotizacion): SCEN-004/006/007/008/010/011 y
 * el flujo de sede de devolución / horas extra (SCEN-005).
 *
 * Usa el useCategory REAL con stores y useFetchRentacarData simulados, de modo
 * que los precios del texto son los que calcula la tarjeta, no copias.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import type { CategoryAvailabilityData, CategoryMonthPriceData } from '@rentacar-main/logic/utils'

const h = vi.hoisted(() => ({
  form: null as unknown as Record<string, Ref<unknown>>,
  search: null as unknown as Record<string, Ref<unknown>>,
  extras: null as null | { babySeatDayPrice: number | null; babySeatMonthPrice: number | null },
  toast: { add: vi.fn() },
}))

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return { ...actual, storeToRefs: (s: unknown) => s }
})

vi.mock('../../stores/useStoreReservationForm', async () => {
  const { ref } = await import('vue')
  h.form = {
    haveMonthlyReservation: ref(false),
    fechaRecogida: ref('2026-10-16'),
    horaRecogida: ref('07:30'),
    fechaDevolucion: ref('2026-10-18'),
    horaDevolucion: ref('07:30'),
    selectedPickupLocation: ref({ name: 'Cali Aeropuerto' }),
    selectedReturnLocation: ref({ name: 'Cali Aeropuerto' }),
  }
  return { default: () => h.form }
})

vi.mock('../../stores/useStoreSearchData', async () => {
  const { ref } = await import('vue')
  h.search = { pending: ref(false), searchOutdated: ref(false) }
  return { default: () => h.search }
})

vi.stubGlobal('useFetchRentacarData', () => ({ extras: h.extras }))
vi.stubGlobal('useToast', () => h.toast)

const { default: useCategory } = await import('../useCategory')
const { default: useCopyQuote } = await import('../useCopyQuote')

function monthRow(over: Partial<CategoryMonthPriceData> = {}): CategoryMonthPriceData {
  return {
    '1k_kms': 3_000_000,
    '2k_kms': 3_500_000,
    '3k_kms': 0,
    init_date: '2026-07-01',
    end_date: '2026-12-31',
    total_insurance_price: 400_000,
    one_day_price: 120_000,
    status: 'active',
    ...over,
  }
}

function row(over: Partial<CategoryAvailabilityData> = {}): CategoryAvailabilityData {
  return {
    vehicleDayCharge: 100_000,
    estimatedTotalAmount: 250_000,
    totalCoverageUnitCharge: 30_000,
    totalAmount: 200_000,
    extraHoursQuantity: 0,
    extraHoursTotalAmount: 0,
    coverageTotalAmount: 20_000,
    coverageQuantity: 2,
    coverageUnitCharge: 10_000,
    IVAFeeAmount: 25_000,
    IVAFeePercentage: 19,
    taxFeeAmount: 5_000,
    taxFeePercentage: 2,
    discountAmount: 0,
    discountPercentage: 0,
    returnFeeAmount: 0,
    numberDays: 2,
    categoryCode: 'C',
    picoyplacaExempt: null,
    categoryDescription: ' Económico mecánico ',
    categoryModels: [],
    categoryMonthPrices: [],
    monthAnchorGross: null,
    referenceToken: 'tok',
    rateQualifier: 'rq',
    ...over,
  } as CategoryAvailabilityData
}

const OFF = { totalCoverage: false, babySeat: false }
const SOLD_OUT = 999999999

let writeText: ReturnType<typeof vi.fn>

beforeEach(() => {
  h.form.haveMonthlyReservation.value = false
  h.form.fechaRecogida.value = '2026-10-16'
  h.form.selectedPickupLocation.value = { name: 'Cali Aeropuerto' }
  h.form.selectedReturnLocation.value = { name: 'Cali Aeropuerto' }
  h.search.pending.value = false
  h.search.searchOutdated.value = false
  h.extras = null
  h.toast.add.mockReset()
  writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SCEN-004: gamas agotadas', () => {
  it('excluye la gama agotada y formatea el total de las demás', () => {
    const rows = ref([
      row({ categoryCode: 'C', categoryDescription: 'Económico', estimatedTotalAmount: 250_000 }),
      row({ categoryCode: 'F', categoryDescription: 'Sedán', estimatedTotalAmount: SOLD_OUT }),
      row({ categoryCode: 'G', categoryDescription: 'Camioneta', estimatedTotalAmount: 1_234_000 }),
    ])
    const text = useCopyQuote(rows).buildText(OFF)!
    expect(text).toContain('C    Económico    $250.000')
    expect(text).toContain('G    Camioneta    $1.234.000')
    expect(text).not.toContain('Sedán')
    expect(text).not.toMatch(/^F\s/m)
    expect(text).not.toContain('999.999.999')
  })

  it('devuelve null cuando todas están agotadas', () => {
    const rows = ref([row({ estimatedTotalAmount: SOLD_OUT })])
    expect(useCopyQuote(rows).buildText(OFF)).toBeNull()
  })
})

describe('SCEN-006: Seguro Total', () => {
  it('cotizable usa el total con Seguro Total; la gama sin precio sale básica y marcada', () => {
    const quotable = row({ categoryCode: 'C', categoryDescription: 'Económico' })
    const unquotable = row({
      categoryCode: 'F',
      categoryDescription: 'Sedán',
      totalCoverageUnitCharge: null,
      estimatedTotalAmount: 310_000,
    })

    // Esperado calculado aparte, con otra instancia de useCategory.
    const ref1 = useCategory(quotable)
    ref1.withTotalCoverage.value = true
    const expected = ref1.getActualTotalPrice.value
    // subtotal 200000 + 30000*2 = 260000; tasa 2% = 5200; IVA 19% de 265200 = 50388
    expect(expected).toBe(315_588)

    const text = useCopyQuote(ref([quotable, unquotable])).buildText({ totalCoverage: true, babySeat: false })!
    expect(text).toContain('C    Económico    $315.588')
    expect(text).toContain('F    Sedán    $310.000 (sin Seguro Total)')
    expect(text).toContain('· Con Seguro Total (deducible $0)')
  })

  it('en mensual exige total_insurance_price > 0 en la fila del mes', () => {
    h.form.haveMonthlyReservation.value = true
    const withIns = row({ categoryCode: 'C', categoryMonthPrices: [monthRow()] })
    const noIns = row({
      categoryCode: 'F',
      categoryMonthPrices: [monthRow({ total_insurance_price: 0 })],
    })
    const text = useCopyQuote(ref([withIns, noIns])).buildText({ totalCoverage: true, babySeat: false })!
    expect(text).toContain('C    Económico mecánico    $3.400.000')
    expect(text).toContain('F    Económico mecánico    $3.000.000 (sin Seguro Total)')
  })
})

describe('SCEN-011: reserva mensual', () => {
  beforeEach(() => {
    h.form.haveMonthlyReservation.value = true
  })

  it('una gama que solo vende 2k se cotiza con el plan de 2.000 km', () => {
    const only2k = row({ categoryMonthPrices: [monthRow({ '1k_kms': 0 })] })
    const text = useCopyQuote(ref([only2k])).buildText(OFF)!
    expect(text).toContain('$3.500.000')
    expect(text).toContain('· Plan mensual de 2.000 km')
    expect(text).toContain('*Total: 30 días*')
    expect(text).not.toContain('horas extra')
  })

  it('omite la gama sin precio mensual aunque tenga cargo por otra sede', () => {
    const good = row({ categoryCode: 'C', categoryMonthPrices: [monthRow()] })
    const noPrice = row({ categoryCode: 'F', categoryMonthPrices: [], returnFeeAmount: 80_000 })
    const text = useCopyQuote(ref([noPrice, good])).buildText(OFF)!
    expect(text).toContain('C    Económico mecánico    $3.000.000')
    expect(text).not.toMatch(/^F\s/m)
    expect(text).not.toContain('$80.000')
  })

  it('con silla: precio fijo del mes', () => {
    const text = useCopyQuote(ref([row({ categoryMonthPrices: [monthRow()] })])).buildText({
      totalCoverage: false,
      babySeat: true,
    })!
    expect(text).toContain('Silla de bebé: $100.000 el mes, se paga al recoger.')
  })
})

describe('SCEN-007: silla de bebé aparte', () => {
  it('no cambia las líneas de precio y agrega la línea de la silla', () => {
    const rows = ref([row({ categoryCode: 'C', categoryDescription: 'Económico' })])
    const q = useCopyQuote(rows)
    const priceLines = (t: string) => t.split('\n').filter((l) => l.startsWith('C    '))
    const off = q.buildText(OFF)!
    const on = q.buildText({ totalCoverage: false, babySeat: true })!
    expect(priceLines(on)).toEqual(priceLines(off))
    expect(on).toContain('Silla de bebé: $24.000 (2 días × $12.000), se paga al recoger.')
    expect(off).not.toContain('Silla de bebé')
  })

  it('usa el diario de extras cuando existe', () => {
    h.extras = { babySeatDayPrice: 15_000, babySeatMonthPrice: null }
    const text = useCopyQuote(ref([row()])).buildText({ totalCoverage: false, babySeat: true })!
    expect(text).toContain('Silla de bebé: $30.000 (2 días × $15.000), se paga al recoger.')
  })
})

describe('SCEN-008: el portapapeles falla', () => {
  it('devuelve false, avisa con toast de error y no lanza', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = await useCopyQuote(ref([row()])).copy(OFF)
    expect(ok).toBe(false)
    expect(h.toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No se pudo copiar', color: 'error' }),
    )
  })

  it('si armar el texto lanza: devuelve false, toast de error y no escribe', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = row()
    Object.defineProperty(broken, 'categoryCode', {
      get() {
        throw new Error('boom')
      },
    })
    const ok = await useCopyQuote(ref([broken])).copy(OFF)
    expect(ok).toBe(false)
    expect(writeText).not.toHaveBeenCalled()
    expect(h.toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No se pudo copiar', color: 'error' }),
    )
  })

  it('éxito: escribe el texto y confirma', async () => {
    const q = useCopyQuote(ref([row()]))
    expect(await q.copy(OFF)).toBe(true)
    expect(writeText).toHaveBeenCalledWith(q.buildText(OFF))
    expect(h.toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cotización copiada',
        description: 'Pégala en WhatsApp para el cliente',
        icon: 'i-heroicons-clipboard-document-check',
        color: 'success',
      }),
    )
  })

  it('sin gamas copiables: toast de error y no toca el portapapeles', async () => {
    const q = useCopyQuote(ref([row({ estimatedTotalAmount: SOLD_OUT })]))
    expect(await q.copy(OFF)).toBe(false)
    expect(writeText).not.toHaveBeenCalled()
    expect(h.toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No hay gamas para copiar', color: 'error' }),
    )
  })
})

describe('SCEN-010: canCopy', () => {
  it('true con resultados vigentes', () => {
    expect(useCopyQuote(ref([row()])).canCopy.value).toBe(true)
  })
  it('false con la búsqueda desactualizada', () => {
    h.search.searchOutdated.value = true
    expect(useCopyQuote(ref([row()])).canCopy.value).toBe(false)
  })
  it('false mientras busca', () => {
    h.search.pending.value = true
    expect(useCopyQuote(ref([row()])).canCopy.value).toBe(false)
  })
  it('false si todas están agotadas o no hay filas', () => {
    expect(useCopyQuote(ref([row({ estimatedTotalAmount: SOLD_OUT })])).canCopy.value).toBe(false)
    expect(useCopyQuote(ref([])).canCopy.value).toBe(false)
  })
  it('false si todas las filas regulares tienen precio 0', () => {
    expect(useCopyQuote(ref([row({ estimatedTotalAmount: 0 })])).canCopy.value).toBe(false)
  })
  it('en mensual false si ninguna fila tiene plan vendible', () => {
    h.form.haveMonthlyReservation.value = true
    expect(useCopyQuote(ref([row({ categoryMonthPrices: [] })])).canCopy.value).toBe(false)
    expect(useCopyQuote(ref([row({ categoryMonthPrices: [monthRow()] })])).canCopy.value).toBe(true)
  })
  it('reacciona al cambio de searchOutdated', () => {
    const q = useCopyQuote(ref([row()]))
    expect(q.canCopy.value).toBe(true)
    h.search.searchOutdated.value = true
    expect(q.canCopy.value).toBe(false)
  })
})

describe('SCEN-005: otra sede y horas extra', () => {
  it('fluyen al texto', () => {
    h.form.selectedReturnLocation.value = { name: 'Cali Centro' }
    const r = row({ extraHoursQuantity: 3, extraHoursTotalAmount: 30_000, returnFeeAmount: 50_000, estimatedTotalAmount: 300_000 })
    const text = useCopyQuote(ref([r])).buildText(OFF)!
    expect(text).toContain('*Entregas:*\nCali Centro')
    expect(text).toContain('*Total: 2 días y 3 horas extra*')
    expect(text).toContain('· Recoge en Cali Aeropuerto, entrega en Cali Centro')
    expect(text).toContain('Cada precio incluye las horas extra.')
    expect(text).toContain('$300.000')
  })
})
