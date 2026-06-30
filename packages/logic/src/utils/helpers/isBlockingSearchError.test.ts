/**
 * Dogfood hallazgo #1: tras una búsqueda fallida en /reservas el botón BUSCAR
 * quedaba deshabilitado para la consulta idéntica, contradiciendo el mensaje
 * "intenta de nuevo". El núcleo del fix es distinguir un error BLOQUEANTE
 * (técnico/transitorio → reintentable) de la respuesta terminal válida de
 * inventario agotado (no_available_categories_error).
 *
 * SCEN-4: predicado puro isBlockingSearchError.
 */
import { describe, it, expect } from 'vitest'
import { isBlockingSearchError } from './isBlockingSearchError'

describe('isBlockingSearchError', () => {
  it('returns false for null/undefined (no error → not blocking)', () => {
    expect(isBlockingSearchError(null)).toBe(false)
    expect(isBlockingSearchError(undefined)).toBe(false)
  })

  it('returns true for a technical/transient server_error (retryable)', () => {
    expect(isBlockingSearchError({ error: 'server_error', message: '' })).toBe(true)
  })

  it('returns false for no_available_categories_error (valid terminal answer)', () => {
    expect(
      isBlockingSearchError({ error: 'no_available_categories_error', message: '' }),
    ).toBe(false)
  })

  it('returns true for any other blocking error code', () => {
    expect(isBlockingSearchError({ error: 'same_hour_error', message: '' })).toBe(true)
  })
})
