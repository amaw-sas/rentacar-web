/**
 * Extras en reserva mensual: precio FIJO por mes (SCEN-X1..X6).
 *
 * El pedido de negocio: la silla de bebé y el conductor adicional cuestan
 * $100.000 fijos al mes cada uno. Antes de esto la mensual cobraba
 * 30 × 12.000 = $360.000 por cada uno.
 *
 * Harness calcado de useCategory.monthlyAnchorCap.test.ts. A diferencia de
 * useCategory.extrasFallback.test.ts —que afirma sobre el TEXTO del archivo—
 * este mide plata.
 *
 * `getExtraDriverPrice` y `getBabySeatPrice` NO están en el objeto que devuelve
 * useCategory: la superficie pública son `getAdditionalsTotal` (lo que se suma
 * al total mostrado) y las cadenas `currency*` (lo que el cliente lee). Se
 * afirma contra esas dos. Marcar un solo extra a la vez aísla cada precio.
 *
 * Alcance: el registro de la reserva NO lleva este número — los extras se
 * persisten como banderas 1|0 (useRecordReservationForm.ts:79-80) y
 * total_price_to_pay sale de getActualTotalPrice, sin los adicionales. La
 * pantalla es la superficie completa de este cambio.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CategoryAvailabilityData, CategoryMonthPriceData } from '@rentacar-main/logic/utils'

type ExtrasStub = {
  extraDriverDayPrice: number | null
  babySeatDayPrice: number | null
  extraDriverMonthPrice: number | null
  babySeatMonthPrice: number | null
} | null

const h = vi.hoisted(() => ({
  store: null as null | {
    haveMonthlyReservation: { value: boolean }
    fechaRecogida: { value: string | null }
  },
  extras: null as ExtrasStub,
}))

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return { ...actual, storeToRefs: (s: unknown) => s }
})

vi.mock('../../stores/useStoreReservationForm', async () => {
  const { ref } = await import('vue')
  h.store = {
    haveMonthlyReservation: ref(true),
    fechaRecogida: ref('2026-08-01'),
  }
  return { default: () => h.store }
})

// Leído en cada llamada a useCategory, así que cada test puede reconfigurarlo.
vi.stubGlobal('useFetchRentacarData', () => ({ extras: h.extras }))

const { default: useCategory } = await import('../useCategory')

/** Precios como quedan en Supabase tras la migración 109. */
const CONFIGURED: ExtrasStub = {
  extraDriverDayPrice: 12_000,
  babySeatDayPrice: 12_000,
  extraDriverMonthPrice: 100_000,
  babySeatMonthPrice: 100_000,
}

function monthRow(): CategoryMonthPriceData {
  return {
    '1k_kms': 3_000_000,
    '2k_kms': 3_500_000,
    '3k_kms': 4_000_000,
    init_date: '2026-07-01',
    end_date: '2026-12-31',
    total_insurance_price: 400_000,
    one_day_price: 120_000,
    status: 'active',
  }
}

function categoryData(numberDays: number): CategoryAvailabilityData {
  return {
    vehicleDayCharge: 0,
    estimatedTotalAmount: 0,
    totalCoverageUnitCharge: 0,
    totalAmount: 0,
    extraHoursQuantity: 0,
    extraHoursTotalAmount: 0,
    coverageTotalAmount: 0,
    coverageQuantity: 0,
    coverageUnitCharge: 0,
    IVAFeeAmount: 0,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    discountAmount: 0,
    discountPercentage: 0,
    returnFeeAmount: 0,
    numberDays,
    categoryCode: 'GC' as CategoryAvailabilityData['categoryCode'],
    picoyplacaExempt: null,
    categoryDescription: 'Test',
    categoryModels: [],
    categoryMonthPrices: [monthRow()],
    monthAnchorGross: null,
    referenceToken: 'tok',
    rateQualifier: 'rq',
  } as CategoryAvailabilityData
}

/** Reserva mensual: 30 días y el switch de mensualidad encendido. */
function monthly() {
  h.store!.haveMonthlyReservation.value = true
  const cat = useCategory(categoryData(30))
  cat.withMileage.value = '1k_kms'
  return cat
}

/** Reserva diaria de `days` días. */
function daily(days: number) {
  h.store!.haveMonthlyReservation.value = false
  return useCategory(categoryData(days))
}

/** Precio del conductor adicional aislado: es el único extra marcado. */
function extraDriverOnly(cat: ReturnType<typeof useCategory>): number {
  cat.withExtraDriver.value = true
  cat.withBabySeat.value = false
  cat.withWash.value = false
  return cat.getAdditionalsTotal.value
}

/** Precio de la silla aislado: es el único extra marcado. */
function babySeatOnly(cat: ReturnType<typeof useCategory>): number {
  cat.withExtraDriver.value = false
  cat.withBabySeat.value = true
  cat.withWash.value = false
  return cat.getAdditionalsTotal.value
}

describe('extras en reserva mensual cuestan un precio fijo por mes', () => {
  beforeEach(() => {
    h.extras = { ...CONFIGURED }
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2026-08-01'
  })

  it('SCEN-X1: mensual + conductor adicional son 100.000, no 360.000', () => {
    const cat = monthly()
    expect(extraDriverOnly(cat)).toBe(100_000)
    expect(cat.currencyExtraDriverPrice.value).toBe('100.000')
  })

  it('SCEN-X2: mensual + silla de bebé son 100.000', () => {
    const cat = monthly()
    expect(babySeatOnly(cat)).toBe(100_000)
    expect(cat.currencyBabySeatPrice.value).toBe('100.000')
  })

  it('SCEN-X3: el flujo diario de 29 días no se mueve — 29 × 12.000', () => {
    expect(extraDriverOnly(daily(29))).toBe(348_000)
    expect(babySeatOnly(daily(29))).toBe(348_000)
  })

  it('SCEN-X3: un solo día sigue costando un día', () => {
    expect(extraDriverOnly(daily(1))).toBe(12_000)
    expect(babySeatOnly(daily(1))).toBe(12_000)
  })

  it('SCEN-X4: el total a pagar sube 100.000, no 360.000', () => {
    const cat = monthly()
    const sinExtras = cat.getTotalToPayWithAdditionals.value
    cat.withExtraDriver.value = true
    expect(cat.getTotalToPayWithAdditionals.value - sinExtras).toBe(100_000)
    expect(cat.getTotalToPayWithAdditionals.value).toBe(cat.getActualTotalPrice.value + 100_000)
  })

  it('SCEN-X6: los dos extras juntos en mensual suman 200.000', () => {
    const cat = monthly()
    cat.withExtraDriver.value = true
    cat.withBabySeat.value = true
    cat.withWash.value = false
    expect(cat.getAdditionalsTotal.value).toBe(200_000)
  })

  it('el precio mensual no depende del precio diario configurado', () => {
    // Si alguien sube el precio diario, la mensual no se mueve.
    h.extras = { ...CONFIGURED, extraDriverDayPrice: 50_000, babySeatDayPrice: 50_000 }
    expect(extraDriverOnly(monthly())).toBe(100_000)
    expect(babySeatOnly(monthly())).toBe(100_000)
  })

  it('el precio mensual configurado manda sobre el respaldo', () => {
    h.extras = { ...CONFIGURED, extraDriverMonthPrice: 150_000, babySeatMonthPrice: 80_000 }
    expect(extraDriverOnly(monthly())).toBe(150_000)
    expect(babySeatOnly(monthly())).toBe(80_000)
  })
})

describe('SCEN-X5: sin configuración en base de datos el respaldo es el precio mensual', () => {
  beforeEach(() => {
    h.store!.haveMonthlyReservation.value = true
    h.store!.fechaRecogida.value = '2026-08-01'
  })

  it('extras ausente por completo → 100.000 por extra', () => {
    h.extras = null
    expect(extraDriverOnly(monthly())).toBe(100_000)
    expect(babySeatOnly(monthly())).toBe(100_000)
  })

  it('columnas mensuales en NULL → 100.000 por extra', () => {
    h.extras = { ...CONFIGURED, extraDriverMonthPrice: null, babySeatMonthPrice: null }
    expect(extraDriverOnly(monthly())).toBe(100_000)
    expect(babySeatOnly(monthly())).toBe(100_000)
  })

  it('un precio mensual de 0 configurado es un extra gratis, no el respaldo', () => {
    h.extras = { ...CONFIGURED, extraDriverMonthPrice: 0, babySeatMonthPrice: 0 }
    expect(extraDriverOnly(monthly())).toBe(0)
    expect(babySeatOnly(monthly())).toBe(0)
  })
})
