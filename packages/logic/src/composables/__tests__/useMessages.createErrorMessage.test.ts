import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LocalizaErrorResponse } from '@rentacar-main/logic/utils'

// Unit-pins the copy mapping in createErrorMessage: which dashboard error codes
// get a friendly, customer-facing toast vs. which pass their backend message
// through. Mirrors the toast mock used by the store tests.

const TOAST_ADD = vi.fn()

const makeError = (error: LocalizaErrorResponse['error'], message: string) =>
  ({ error, message } as LocalizaErrorResponse)

const callCreateErrorMessage = async (resp: LocalizaErrorResponse) => {
  const { default: useMessages } = await import('../useMessages')
  useMessages().createErrorMessage(resp)
  return TOAST_ADD.mock.calls.at(-1)![0] as { title: string; description: string; color: string }
}

describe('useMessages.createErrorMessage copy mapping', () => {
  beforeEach(() => {
    TOAST_ADD.mockClear()
    vi.stubGlobal('useToast', () => ({ add: TOAST_ADD, clear: vi.fn() }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('same_hour_error → friendly "return after pickup" notice (not the confusing backend copy)', async () => {
    const toast = await callCreateErrorMessage(
      makeError('same_hour_error', 'El día y hora de recogida son iguales a los de devolución'),
    )
    expect(toast.title).toBe('Revisa las fechas')
    expect(toast.description).toBe('La devolución debe ser posterior a la recogida.')
    expect(toast.color).toBe('error')
  })

  it.each(['server_error', 'connection_timeout', 'unknown_error'] as const)(
    '%s → generic friendly retry notice (no bare "Error", no technical message)',
    async (code) => {
      const toast = await callCreateErrorMessage(makeError(code, 'Some raw technical message'))
      expect(toast.title).toBe('No pudimos completar la búsqueda')
      expect(toast.description).toBe(
        'Ocurrió un problema al consultar la disponibilidad. Por favor intenta de nuevo en unos minutos.',
      )
    },
  )

  it('inferior_pickup_date keeps its existing friendly mapping (regression)', async () => {
    const toast = await callCreateErrorMessage(
      makeError('inferior_pickup_date', 'Selecciona la fecha de recogida igual o posterior a la fecha actual'),
    )
    expect(toast.title).toBe('Revisa la hora de recogida')
    expect(toast.description).toBe('Por favor escoge una hora de recogida posterior a la hora actual.')
  })

  it('out_of_schedule PICKUP hour → names the pickup branch (pickup ≠ return possible)', async () => {
    const toast = await callCreateErrorMessage(
      makeError('out_of_schedule_pickup_hour_error', 'La hora de recogida está por fuera del horario'),
    )
    expect(toast.title).toBe('Sede de recogida cerrada')
    expect(toast.description).toBe('La sede donde recoges el carro no abre a esa hora. Elige otra hora de recogida.')
  })

  it('out_of_schedule RETURN hour → names the return branch (distinct from pickup)', async () => {
    const toast = await callCreateErrorMessage(
      makeError('out_of_schedule_return_hour_error', 'La hora de devolución está por fuera del horario'),
    )
    expect(toast.title).toBe('Sede de devolución cerrada')
    expect(toast.description).toBe('La sede donde entregas el carro no abre a esa hora. Elige otra hora de devolución.')
  })

  it('an unmapped validation code (out_of_schedule_pickup_date_error) still passes its backend message through', async () => {
    // We deliberately do NOT over-reach into a blanket catch-all: date-level
    // validation codes keep their descriptive backend copy and the "Error" title.
    const toast = await callCreateErrorMessage(
      makeError('out_of_schedule_pickup_date_error', 'La fecha de recogida está fuera del horario'),
    )
    expect(toast.title).toBe('Error')
    expect(toast.description).toBe('La fecha de recogida está fuera del horario')
  })

  it('one_way_not_available → clear "entrega en otra sede" notice (not the generic fallback) — SCEN-OW-01', async () => {
    const toast = await callCreateErrorMessage(
      makeError('one_way_not_available', 'Ha ocurrido un error inesperado, por favor contacte a nuestros asesores'),
    )
    expect(toast.title).toBe('Entrega en otra sede no disponible')
    expect(toast.description).toBe(
      'Por ahora no podemos cotizar la entrega en una sede distinta a la de recogida. Elige la misma sede para recoger y devolver, o escríbenos y te ayudamos.',
    )
    expect(toast.color).toBe('error')
    // Must NOT collapse into the generic unknown_error copy.
    expect(toast.title).not.toBe('No pudimos completar la búsqueda')
  })
})
