import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Escenario capturado en /reservas con una búsqueda de 30 días (Gama CX,
// Bogotá Aeropuerto, 10 ago → 9 sep 2026), marcando Seguro Total:
//
//   Seguro Total 30 días ........ $ 0        ← la línea
//   Total 30 días ............... $ 4.642.000
//   (desmarcando Seguro Total) .. $ 4.166.000
//
// El extra cobra $ 476.000 y la línea dice que es gratis. La causa es que
// `getTotalCoveragePrice` multiplica por `coverageQuantity`, y en una reserva
// mensual los campos diarios llegan en 0 (coverageQuantity, coverageUnitCharge
// y vehicleDayCharge) porque el precio vive en `month_prices`. El total sí era
// correcto: getActualTotalPrice ya leía `monthPrice.total_insurance_price`.
//
// El mismo 0 rompía la píldora de descuento: getDiscount arranca en
// `vehicleDayCharge + coverageUnitCharge` y una guarda devolvía "0" para no
// dividir por cero, matando un ahorro real (220.000 → 154.733 = 30%).
//
// Test a nivel de fuente, como los demás de este composable: evita mockear los
// auto-imports de Nuxt (useFetchRentacarData, useState) y Pinia.

const source = readFileSync(
  fileURLToPath(new URL('../useCategory.ts', import.meta.url)),
  'utf8',
)

function extractComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  const end = source.indexOf('\n   })', start) + '\n   })'.length
  return source.slice(start, end)
}

describe('useCategory.getTotalCoveragePrice — el Seguro Total mensual no puede valer 0', () => {
  const block = extractComputed('getTotalCoveragePrice')

  it('lee el recargo mensual de month_prices en vez de multiplicar cantidades diarias', () => {
    expect(block).toContain('haveMonthlyReservation')
    expect(block).toContain('total_insurance_price')
  })

  it('conserva la fórmula diaria para reservas por día', () => {
    expect(block).toContain('effectiveTotalCoverageUnitCharge')
    expect(block).toContain('coverageQuantity')
  })

  it('es la MISMA fuente que usa el total, para que línea y total no diverjan', () => {
    // getActualTotalPrice ya sumaba monthPrice["total_insurance_price"]: si la
    // línea usa otra fórmula, vuelve a aparecer un extra "gratis" que sí cobra.
    const total = extractComputed('getActualTotalPrice')
    expect(total).toContain('total_insurance_price')
  })
})

describe('useCategory — ampliación mensual de 1.000 a 2.000 km', () => {
  const priceBlock = extractComputed('getMileageUpgradePrice')

  it('la casilla adapta el enum existente en ambos sentidos', () => {
    expect(source).toMatch(/withMileageUpgrade = computed<boolean>\(\{[\s\S]*?get: \(\) => withMileage\.value === "2k_kms"/)
    expect(source).toMatch(/enabled \? "2k_kms" : "1k_kms"/)
  })

  it('el recargo visible es exactamente la diferencia 2k menos 1k', () => {
    expect(priceBlock).toContain('monthPrice["2k_kms"]')
    expect(priceBlock).toContain('monthPrice["1k_kms"]')
    expect(priceBlock).toContain('Math.max')
  })

  it('no vuelve a sumar el recargo al total mensual', () => {
    const total = extractComputed('getActualTotalPrice')
    expect(total).toContain('monthPrice[mileage]')
    expect(total).not.toContain('getMileageUpgradePrice')
  })

  it('solo ofrece la ampliación cuando ambos planes tienen tarifa', () => {
    const availability = extractComputed('canUpgradeMonthlyMileage')
    expect(availability).toContain('haveMonthlyReservation')
    expect(availability).toContain('monthPrice["1k_kms"]')
    expect(availability).toContain('monthPrice["2k_kms"]')
  })
})

describe('useCategory.getDiscount — el ahorro mensual sí se muestra', () => {
  const block = extractComputed('getDiscount')

  it('calcula el descuento mensual con el precio de un día de la tabla mensual', () => {
    expect(block).toContain('haveMonthlyReservation')
    expect(block).toContain('one_day_price')
  })

  it('mantiene la guarda contra la división por cero', () => {
    // Sin ella el cálculo hacía 100 * (0 / |0|) = NaN cuando no hay base.
    expect(block).toMatch(/if \(initial <= 0\) return "0"/)
  })
})

describe('useCategory.hasDiscountToShow — la píldora se decide por el ahorro, no por discountAmount', () => {
  it('expone una compuerta derivada de getDiscount', () => {
    // `hasDiscount()` mira `discountAmount`, que en mensual llega nulo: la card
    // pintaba el precio tachado pero se comía la píldora que lo explica.
    expect(source).toMatch(/const hasDiscountToShow = computed<boolean>\(\(\) => getDiscount\.value !== "0"\)/)
    expect(source).toMatch(/^\s+hasDiscountToShow,$/m)
  })
})
