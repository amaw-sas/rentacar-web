import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useReservationConfirmation, {
  RESERVATION_RETRY_AFTER_SECONDS,
} from '../useReservationConfirmation'

const useFetchMock = vi.fn()
const requestEvent = {}
const retryAfterHeader = { value: undefined as string | undefined }
const setResponseStatusMock = vi.fn()
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('useRoute', () => ({ params: { reserveCode: 'AV78' } }))
  vi.stubGlobal('useFetch', useFetchMock)
  vi.stubGlobal('useRequestEvent', () => requestEvent)
  vi.stubGlobal('setResponseStatus', setResponseStatusMock)
  vi.stubGlobal('useResponseHeader', () => retryAfterHeader)
  vi.stubGlobal('createError', (options: Record<string, unknown>) =>
    Object.assign(new Error(String(options.statusMessage)), options),
  )
  retryAfterHeader.value = undefined
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('useReservationConfirmation', () => {
  it('keeps the confirmed-reservation happy path intact', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: { exists: true } },
      error: { value: null },
    })

    await expect(useReservationConfirmation()).resolves.toEqual({
      status: 'found',
      reserveCode: 'AV78',
    })
    expect(useFetchMock).toHaveBeenCalledWith('/api/reservations/AV78/exists', {
      cache: 'no-store',
      timeout: 3_000,
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(setResponseStatusMock).not.toHaveBeenCalled()
    expect(retryAfterHeader.value).toBeUndefined()
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

  it('throws a fatal 404 when the API reports not found', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: null },
      error: { value: Object.assign(new Error('not found'), { statusCode: 404 }) },
    })

    await expect(useReservationConfirmation()).rejects.toMatchObject({
      statusCode: 404,
      fatal: true,
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('returns an unavailable state with temporary HTTP metadata for lookup 5xx', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: null },
      error: {
        value: Object.assign(new Error('upstream unavailable'), { statusCode: 503 }),
      },
    })

    await expect(useReservationConfirmation()).resolves.toEqual({
      status: 'unavailable',
      reserveCode: null,
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(
      requestEvent,
      503,
      'Service Unavailable',
    )
    expect(retryAfterHeader.value).toBe(String(RESERVATION_RETRY_AFTER_SECONDS))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('temporary verification state'),
      expect.objectContaining({ statusCode: 503 }),
    )
  })

  it('returns an unavailable state with HTTP 503 when the lookup times out', async () => {
    useFetchMock.mockRejectedValue(
      Object.assign(new Error('request timed out'), { name: 'TimeoutError' }),
    )

    await expect(useReservationConfirmation()).resolves.toEqual({
      status: 'unavailable',
      reserveCode: null,
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(requestEvent, 503, 'Service Unavailable')
    expect(retryAfterHeader.value).toBe(String(RESERVATION_RETRY_AFTER_SECONDS))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('temporary verification state'),
      expect.objectContaining({ errorName: 'TimeoutError' }),
    )
  })

  it('returns unavailable rather than treating a non-authoritative response as found', async () => {
    useFetchMock.mockResolvedValue({
      data: { value: null },
      error: { value: null },
    })

    await expect(useReservationConfirmation()).resolves.toEqual({
      status: 'unavailable',
      reserveCode: null,
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(requestEvent, 503, 'Service Unavailable')
    expect(retryAfterHeader.value).toBe(String(RESERVATION_RETRY_AFTER_SECONDS))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('temporary verification state'),
      expect.any(Object),
    )
  })

  it('rejects malformed codes before making a lookup request', async () => {
    vi.stubGlobal('useRoute', () => ({ params: { reserveCode: 'not/a/code' } }))

    await expect(useReservationConfirmation()).rejects.toMatchObject({ statusCode: 404 })
    expect(useFetchMock).not.toHaveBeenCalled()
  })
})
