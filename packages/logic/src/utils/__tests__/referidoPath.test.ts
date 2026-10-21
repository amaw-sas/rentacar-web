import { describe, it, expect } from 'vitest'
import { withReferido } from '../referidoPath'

const TAIL = 'lugar-recogida/cali-aeropuerto/lugar-devolucion/cali-aeropuerto/fecha-recogida/2026-10-20/hora-recogida/07:30'

describe('withReferido', () => {
  it('alquilame / alquicarros: /reservas/lugar-recogida/...', () => {
    expect(withReferido(`/reservas/${TAIL}`, 'daniela')).toBe(`/reservas/referido/daniela/${TAIL}`)
  })

  it('alquilatucarro: /{city}/buscar-vehiculos/lugar-recogida/...', () => {
    expect(withReferido(`/cali/buscar-vehiculos/${TAIL}`, 'daniela')).toBe(
      `/cali/buscar-vehiculos/referido/daniela/${TAIL}`,
    )
  })

  it('conserva /categoria/{x} al final', () => {
    expect(withReferido(`/reservas/${TAIL}/categoria/c`, 'daniela')).toBe(
      `/reservas/referido/daniela/${TAIL}/categoria/c`,
    )
  })

  it('reemplaza un referido existente', () => {
    expect(withReferido(`/reservas/referido/otro/${TAIL}`, 'daniela')).toBe(`/reservas/referido/daniela/${TAIL}`)
    expect(withReferido(`/cali/buscar-vehiculos/referido/otro/${TAIL}/categoria/c`, 'daniela')).toBe(
      `/cali/buscar-vehiculos/referido/daniela/${TAIL}/categoria/c`,
    )
  })

  it('codifica el código', () => {
    expect(withReferido(`/reservas/${TAIL}`, 'a b/c')).toBe(`/reservas/referido/a%20b%2Fc/${TAIL}`)
  })

  it('deja igual las rutas sin /lugar-recogida/', () => {
    expect(withReferido('/reservas?lugar_recogida=x', 'daniela')).toBe('/reservas?lugar_recogida=x')
    expect(withReferido('/', 'daniela')).toBe('/')
  })
})
