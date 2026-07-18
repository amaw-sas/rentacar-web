import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useReservationConfirmation from '../useReservationConfirmation'

const useFetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('useRoute', () => ({ params: { reserveCode: 'AV78' } }))
  vi.stubGlobal('useFetch', useFetchMock)
  vi.stubGlobal('createError', (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('useReservationConfirmation', () => {
  it('keeps the confirmed-reservation happy path intact', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: { exists: true } },
      error: { value: null },
    })

    await expect(useReservationConfirmation()).resolves.toEqual({ reserveCode: 'AV78' })
    expect(useFetchMock).toHaveBeenCalledWith('/api/reservations/AV78/exists', {
      cache: 'no-store',
    })
  })

  it('throws a real 404 when the reservation does not exist', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: { exists: false } },
      error: { value: null },
    })

    await expect(useReservationConfirmation()).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Reserva no encontrada',
      fatal: true,
    })
  })

  it('fails closed with a 404 when the lookup fails', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: null },
      error: { value: new Error('upstream unavailable') },
    })

    await expect(useReservationConfirmation()).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejects malformed codes before making a lookup request', async () => {
    vi.stubGlobal('useRoute', () => ({ params: { reserveCode: 'not/a/code' } }))

    await expect(useReservationConfirmation()).rejects.toMatchObject({ statusCode: 404 })
    expect(useFetchMock).not.toHaveBeenCalled()
  })
})
