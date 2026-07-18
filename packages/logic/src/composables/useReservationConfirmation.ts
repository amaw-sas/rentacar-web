import { normalizeReservationCode } from '@rentacar-main/logic/utils'

interface ReservationExistsResponse {
  exists: boolean
}

function reservationNotFound() {
  return createError({
    statusCode: 404,
    statusMessage: 'Reserva no encontrada',
    // Required by Nuxt to replace the previous page during client navigation.
    fatal: true,
  })
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
      { cache: 'no-store' },
    )

    if (lookup.error.value || lookup.data.value?.exists !== true) {
      throw reservationNotFound()
    }
  } catch {
    throw reservationNotFound()
  }

  return { reserveCode }
}
