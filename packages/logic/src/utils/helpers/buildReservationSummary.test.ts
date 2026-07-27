import { describe, it, expect } from 'vitest'
import { reactive, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildReservationSummary, type ReservationSummaryFields } from './buildReservationSummary'

/**
 * SCEN-368A-10 (issue #368 hallazgo 1) — el snapshot congela nombre y total
 * leyendo `selectedCategory` con la semántica de auto-unwrap del deep ref, SIN
 * `.value`. `useStoreSearchData().selectedCategory` es `toReactive` del retorno
 * de `useCategory`, así que un `reactive({ ...refs })` reproduce EXACTO ese
 * acceso: `.categoryDescription` devuelve el string, `.categoryDescription.value`
 * daría `undefined`. Este es el oracle independiente que el revisor pidió.
 *
 * El paquete logic testea `useCategory` a nivel de fuente para no bootear Nuxt
 * auto-imports ni Pinia (ver useCategory.getTotalPrice.test.ts). Aquí aislamos la
 * captura en `buildReservationSummary` para poder ejercerla con esa misma
 * semántica reactiva sin montar nada; un guard de fuente ata la llamada a
 * `submitForm`.
 */

const FIELDS: ReservationSummaryFields = {
  pickupDate: '15 de agosto de 2026',
  pickupTime: '12:00 p. m.',
  returnDate: '22 de agosto de 2026',
  returnTime: '12:00 p. m.',
  pickupBranch: 'Bogotá Aeropuerto',
  pickupCity: 'bogota',
  returnBranch: 'Bogotá Aeropuerto',
  returnCity: 'bogota',
  days: 7,
  haveTotalInsurance: true,
  haveMonthlyReservation: false,
  monthlyMileage: null,
}

describe('SCEN-368A-10 — buildReservationSummary congela nombre y total sin `.value`', () => {
  const category = reactive({
    categoryDescription: ref('Compacto'),
    currencyTotalToPayWithAdditionals: ref('$ 150.000'),
  })

  it('lee categoryName y total desdesenvueltos (undefined si se añade `.value`)', () => {
    const s = buildReservationSummary('ABCD1234', category, FIELDS)
    expect(s.code).toBe('ABCD1234')
    expect(s.categoryName).toBe('Compacto')
    expect(s.total).toBe('$ 150.000')
  })

  it('arrastra los campos del formulario ya resueltos sin tocarlos', () => {
    const s = buildReservationSummary('ABCD1234', category, FIELDS)
    expect(s.pickupBranch).toBe('Bogotá Aeropuerto')
    expect(s.pickupCity).toBe('bogota')
    expect(s.days).toBe(7)
    expect(s.haveTotalInsurance).toBe(true)
    expect(s.haveMonthlyReservation).toBe(false)
    expect(s.monthlyMileage).toBeNull()
  })

  it('categoría null → categoryName/total null (la regla de completitud oculta el recap)', () => {
    const s = buildReservationSummary('ABCD1234', null, FIELDS)
    expect(s.code).toBe('ABCD1234')
    expect(s.categoryName).toBeNull()
    expect(s.total).toBeNull()
  })
})

describe('SCEN-368A-10 — submitForm cablea el snapshot en la rama /reservado', () => {
  const store = readFileSync(
    fileURLToPath(new URL('../../stores/useStoreReservationForm.ts', import.meta.url)),
    'utf8',
  )
  const submitBlock = (() => {
    const start = store.indexOf('const submitForm =')
    expect(start, 'no se encontró submitForm').toBeGreaterThan(-1)
    return store.slice(start, store.indexOf('\n  };', start))
  })()

  it('asigna lastReservationSummary desde buildReservationSummary', () => {
    expect(submitBlock).toMatch(/lastReservationSummary\.value\s*=\s*buildReservationSummary\(/)
  })

  it('congela antes de navegar (la captura precede al navigateTo de /reservado)', () => {
    const capture = submitBlock.indexOf('buildReservationSummary(')
    const reservadoNavigate = submitBlock.indexOf("navigateTo({ path: route })")
    expect(capture).toBeGreaterThan(-1)
    expect(reservadoNavigate).toBeGreaterThan(-1)
    expect(capture).toBeLessThan(reservadoNavigate)
  })

  it('pasa selectedCategory sin `.value` en las propiedades de categoría', () => {
    // El bug que el revisor cazó: leer categoryDescription.value / …WithAdditionals.value
    expect(submitBlock).not.toMatch(/categoryDescription\.value/)
    expect(submitBlock).not.toMatch(/currencyTotalToPayWithAdditionals\.value/)
  })
})
