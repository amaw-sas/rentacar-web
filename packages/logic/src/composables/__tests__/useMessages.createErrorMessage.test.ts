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

  it('out_of_schedule HOUR codes keep the "local cerrado" mapping (regression)', async () => {
    const toast = await callCreateErrorMessage(
      makeError('out_of_schedule_return_hour_error', 'La hora de devolución está por fuera del horario'),
    )
    expect(toast.title).toBe('Local cerrado a esa hora')
    expect(toast.description).toBe('La sede seleccionada no está abierta en el horario que elegiste.')
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
})
