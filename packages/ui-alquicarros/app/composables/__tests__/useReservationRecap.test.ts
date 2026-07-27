import { describe, it, expect } from 'vitest'
import { deriveReservationRecap } from '../useReservationRecap'
import type { ReservationSummary } from '@rentacar-main/logic/utils'

/**
 * Issue #368 hallazgo 1, Paso 2 — el núcleo puro que decide si el recap se pinta
 * y con qué valores. Aislado del store y la ruta para testear el gate y el mapeo
 * sin montar. El wrapper `useReservationRecap()` (auto-imports de Nuxt/Pinia) se
 * ejerce en el mount de la página (Paso 4).
 */

const FULL: ReservationSummary = {
  code: 'ABCD1234',
  categoryName: 'Compacto',
  total: '$ 150.000',
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

describe('SCEN-368A-01 — recap con valores exactos cuando el código coincide', () => {
  it('show=true y recap con nombre, total, fechas, sedes, días y seguro', () => {
    const { show, recap } = deriveReservationRecap(FULL, 'ABCD1234')
    expect(show).toBe(true)
    expect(recap).not.toBeNull()
    expect(recap!.categoryName).toBe('Compacto')
    expect(recap!.total).toBe('$ 150.000')
    expect(recap!.pickupDate).toBe('15 de agosto de 2026')
    expect(recap!.returnTime).toBe('12:00 p. m.')
    expect(recap!.pickupBranch).toBe('Bogotá Aeropuerto')
    expect(recap!.pickupCity).toBe('bogota')
    expect(recap!.days).toBe(7)
    expect(recap!.insuranceLabel).toBe('Seguro Total')
  })

  it('seguro básico cuando haveTotalInsurance=false', () => {
    const { recap } = deriveReservationRecap({ ...FULL, haveTotalInsurance: false }, 'ABCD1234')
    expect(recap!.insuranceLabel).toBe('Seguro Básico')
  })

  it('etiqueta de km solo en reserva mensual', () => {
    const monthly = deriveReservationRecap(
      { ...FULL, haveMonthlyReservation: true, monthlyMileage: '2k_kms' },
      'ABCD1234',
    )
    expect(monthly.recap!.mileageLabel).toBe('2.000 km')
    // No mensual → sin etiqueta de km
    expect(deriveReservationRecap(FULL, 'ABCD1234').recap!.mileageLabel).toBeNull()
  })
})

describe('SCEN-368A-02 — sin snapshot no hay recap', () => {
  it('summary null → show=false, recap=null', () => {
    const { show, recap } = deriveReservationRecap(null, 'ABCD1234')
    expect(show).toBe(false)
    expect(recap).toBeNull()
  })
})

describe('SCEN-368A-03 — un código que no coincide no pinta datos ajenos', () => {
  it('code AAA111 en el snapshot vs BBB222 en la URL → show=false', () => {
    const { show, recap } = deriveReservationRecap({ ...FULL, code: 'AAA111' }, 'BBB222')
    expect(show).toBe(false)
    expect(recap).toBeNull()
  })

  it('un param de URL inválido (no normalizable) → show=false', () => {
    expect(deriveReservationRecap(FULL, 'x').show).toBe(false) // < 4 chars, normalize→null
  })
})

describe('SCEN-368A-04 — un snapshot a medias se oculta', () => {
  it('categoryName ausente → show=false', () => {
    expect(deriveReservationRecap({ ...FULL, categoryName: null }, 'ABCD1234').show).toBe(false)
  })

  it('total ausente → show=false', () => {
    expect(deriveReservationRecap({ ...FULL, total: null }, 'ABCD1234').show).toBe(false)
  })
})
