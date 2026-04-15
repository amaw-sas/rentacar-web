import { describe, it, expect } from 'vitest'
import { routeForReservationStatus } from '../reservationStatusRoute'

// Scenarios captured: after a reservation POST, the Nuxt form redirects
// based on the status returned by the backend. Two backends are in play
// during migration: admin (lowercase, snake_case) and legacy Laravel
// (capitalized Spanish). Both must route correctly.
//
// Unknown statuses must return null so the caller can stay on the page
// instead of sending the user somewhere wrong.

describe('routeForReservationStatus', () => {
  it('routes admin "reservado" to /reservado/{code}', () => {
    expect(routeForReservationStatus('reservado', 'AVD5XFK2J4A')).toBe('/reservado/AVD5XFK2J4A')
  })

  it('routes legacy "Confirmado" to /reservado/{code}', () => {
    expect(routeForReservationStatus('Confirmado', 'AVD5XFK2J4A')).toBe('/reservado/AVD5XFK2J4A')
  })

  it('routes admin "pendiente" to /pendiente', () => {
    expect(routeForReservationStatus('pendiente', 'X')).toBe('/pendiente')
  })

  it('routes legacy "Pendiente" to /pendiente', () => {
    expect(routeForReservationStatus('Pendiente', 'X')).toBe('/pendiente')
  })

  it('routes "mensualidad" to /pendiente (monthly flows await confirmation)', () => {
    expect(routeForReservationStatus('mensualidad', null)).toBe('/pendiente')
  })

  it('routes "sin_disponibilidad" to /sindisponibilidad', () => {
    expect(routeForReservationStatus('sin_disponibilidad', null)).toBe('/sindisponibilidad')
  })

  it('routes legacy "SinDisponibilidad" to /sindisponibilidad', () => {
    expect(routeForReservationStatus('SinDisponibilidad', null)).toBe('/sindisponibilidad')
  })

  it('returns null for unknown statuses so the caller stays put', () => {
    expect(routeForReservationStatus('indeterminado', 'X')).toBeNull()
    expect(routeForReservationStatus('', 'X')).toBeNull()
    expect(routeForReservationStatus(null, 'X')).toBeNull()
    expect(routeForReservationStatus(undefined, 'X')).toBeNull()
  })
})
