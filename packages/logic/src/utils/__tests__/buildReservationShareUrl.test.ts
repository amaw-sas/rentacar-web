import { describe, it, expect } from 'vitest'
import { buildReservationShareUrl } from '../referidoPath'

const TAIL = 'lugar-recogida/cali-aeropuerto/lugar-devolucion/cali-aeropuerto/fecha-recogida/2026-10-20/hora-recogida/07:30/fecha-devolucion/2026-10-22/hora-devolucion/10:30'
const ORIGIN = 'https://www.example.co'

// Formula that shipped before the advisor feature (PR #519 and earlier).
const legacy = (origin: string, path: string, vehiculo: string, totalInsurance: boolean) =>
  `${origin}${path.replace(/\/categoria\/[^/]+$/, '')}/categoria/${vehiculo.toLowerCase()}${totalInsurance ? '?seguro=total' : ''}`

describe('buildReservationShareUrl', () => {
  it('advisor + existing /referido/otro/ + seguro -> /referido/daniela/ and ?seguro=total', () => {
    expect(
      buildReservationShareUrl({
        origin: ORIGIN,
        path: `/reservas/referido/otro/${TAIL}/categoria/c`,
        vehiculo: 'F',
        totalInsurance: true,
        advisorCode: 'daniela',
      }),
    ).toBe(`${ORIGIN}/reservas/referido/daniela/${TAIL}/categoria/f?seguro=total`)
  })

  it('advisor without existing referido inserts it before lugar-recogida (alquilatucarro shape)', () => {
    expect(
      buildReservationShareUrl({
        origin: ORIGIN,
        path: `/cali/buscar-vehiculos/${TAIL}`,
        vehiculo: 'GY',
        totalInsurance: false,
        advisorCode: 'daniela',
      }),
    ).toBe(`${ORIGIN}/cali/buscar-vehiculos/referido/daniela/${TAIL}/categoria/gy`)
  })

  it.each([
    ['alquilame', `/reservas/${TAIL}`],
    ['alquilame con categoria previa', `/reservas/${TAIL}/categoria/c`],
    ['alquilame con referido de la URL', `/reservas/referido/otro/${TAIL}`],
    ['alquilatucarro', `/cali/buscar-vehiculos/${TAIL}`],
    ['alquilatucarro con categoria previa', `/cali/buscar-vehiculos/${TAIL}/categoria/f`],
  ])('without advisor is byte-identical to the old formula: %s', (_n, path) => {
    for (const totalInsurance of [false, true]) {
      expect(buildReservationShareUrl({ origin: ORIGIN, path, vehiculo: 'GY', totalInsurance, advisorCode: undefined })).toBe(
        legacy(ORIGIN, path, 'GY', totalInsurance),
      )
      expect(buildReservationShareUrl({ origin: ORIGIN, path, vehiculo: 'GY', totalInsurance })).toBe(
        legacy(ORIGIN, path, 'GY', totalInsurance),
      )
    }
  })
})
