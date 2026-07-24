/**
 * Issue #402: un enlace /reservas sin `lugar_devolucion` dejaba la devolución en
 * null y la búsqueda moría en missing_parameters. La regla distingue AUSENTE
 * (enlace corto legítimo → cae a la recogida en silencio) de INVÁLIDO (el slug
 * no resuelve → cae a la recogida y hay que avisar).
 *
 * Holdout: docs/specs/issue-402-reservas-sin-lugar/scenarios/reservas-return-branch.scenarios.md
 * Cubre las 4 filas de la tabla de verdad + los dos casos de cadena vacía.
 */
import { describe, it, expect } from 'vitest'
import { resolveReturnBranch } from './resolveReturnBranch'
import { resolveReturnBranch as fromBarrel } from '../index'

const PICKUP = 'AABOT'
const RETURN = 'AAMDE'

describe('resolveReturnBranch', () => {
  // Fila 1 — slug ausente: enlace corto legítimo, sin aviso.
  it('sin slug de devolución cae a la recogida y no marca corrección', () => {
    expect(resolveReturnBranch(undefined, undefined, PICKUP)).toEqual({
      code: PICKUP,
      corrected: false,
    })
  })

  it('sin slug y sin recogida resoluble devuelve null sin marcar corrección', () => {
    expect(resolveReturnBranch(undefined, undefined, null)).toEqual({
      code: null,
      corrected: false,
    })
  })

  it('un slug de cadena vacía se comporta como ausente', () => {
    expect(resolveReturnBranch('', undefined, PICKUP)).toEqual({
      code: PICKUP,
      corrected: false,
    })
  })

  // Fila 2 — el slug resuelve: one-way legítimo, intacto.
  it('un slug que resuelve conserva su propia sede', () => {
    expect(resolveReturnBranch('medellin-centro', RETURN, PICKUP)).toEqual({
      code: RETURN,
      corrected: false,
    })
  })

  // Fila 2 → 3 por veracidad: un code de cadena vacía NO es una sede.
  it('un code de cadena vacía no se escribe: cae a la recogida y marca corrección', () => {
    expect(resolveReturnBranch('sede-mal-configurada', '', PICKUP)).toEqual({
      code: PICKUP,
      corrected: true,
    })
  })

  // Fila 3 — el usuario pidió una sede que no existe: hay que decírselo.
  it('un slug que no resuelve cae a la recogida y marca corrección', () => {
    expect(resolveReturnBranch('sede-que-no-existe', undefined, PICKUP)).toEqual({
      code: PICKUP,
      corrected: true,
    })
  })

  // Fila 4 — sin recogida a la que caer no hay corrección que anunciar.
  it('un slug que no resuelve sin recogida resoluble no marca corrección', () => {
    expect(resolveReturnBranch('sede-que-no-existe', undefined, null)).toEqual({
      code: null,
      corrected: false,
    })
  })

  // El barril es como lo consumen las marcas; los helpers vecinos solo se
  // importan en relativo, así que sin esto el re-export no se ejercita aquí.
  it('se resuelve desde el barril de utils', () => {
    expect(fromBarrel('sede-que-no-existe', undefined, PICKUP)).toEqual({
      code: PICKUP,
      corrected: true,
    })
  })
})
