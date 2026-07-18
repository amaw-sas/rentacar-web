import { normalizeReservationCode } from '@rentacar-main/logic/utils'

interface ReservationExistsResponse {
  exists: boolean
}

const RESERVATION_LOOKUP_TIMEOUT_MS = 3_000

function reservationNotFound() {
  return createError({
    statusCode: 404,
    statusMessage: 'Reserva no encontrada',
    // Required by Nuxt to replace the previous page during client navigation.
    fatal: true,
  })
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined

  const statusCode = 'statusCode' in error ? error.statusCode : undefined
  if (typeof statusCode === 'number') return statusCode

  const status = 'status' in error ? error.status : undefined
  return typeof status === 'number' ? status : undefined
}

function logLookupFailure(error: unknown) {
  const statusCode = getStatusCode(error)
  const errorName = error instanceof Error ? error.name : 'UnknownError'

  // Do not log the reservation code: it is already a bearer-like value in the
  // URL and adding it to application logs would increase its exposure.
  console.error(
    '[reservation-confirmation] Existence lookup unavailable; rendering fail open.',
    { errorName, statusCode },
  )
}

/**
 * Validate a confirmation route before rendering its success state. The API
 * response intentionally contains only an existence boolean; reservation data
 * never reaches the browser or the Nuxt payload.
 */
export default async function useReservationConfirmation() {
  const route = useRoute()
  const reserveCode = normalizeReservationCode(route.params.reserveCode)

  if (!reserveCode) {
    throw reservationNotFound()
  }

  try {
    const lookup = await useFetch<ReservationExistsResponse>(
      `/api/reservations/${encodeURIComponent(reserveCode)}/exists`,
      {
        cache: 'no-store',
        timeout: RESERVATION_LOOKUP_TIMEOUT_MS,
      },
    )

    if (lookup.error.value) {
      if (getStatusCode(lookup.error.value) === 404) throw reservationNotFound()

      logLookupFailure(lookup.error.value)
      return { reserveCode }
    }

    if (lookup.data.value?.exists === false) throw reservationNotFound()

    if (lookup.data.value?.exists !== true) {
      logLookupFailure(new Error('Unexpected reservation lookup response'))
    }
  } catch (error) {
    if (getStatusCode(error) === 404) throw reservationNotFound()

    logLookupFailure(error)
    return { reserveCode }
  }

  return { reserveCode }
}
