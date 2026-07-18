import { normalizeReservationCode } from '@rentacar-main/logic/utils'
import { useSupabaseAdminClient } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const reserveCode = normalizeReservationCode(getRouterParam(event, 'reserveCode'))
  if (!reserveCode) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Reserva no encontrada',
    })
  }

  const franchise = useRuntimeConfig(event).public?.rentacarFranchise
  if (typeof franchise !== 'string' || franchise.length === 0) {
    throw createError({
      statusCode: 503,
      statusMessage: 'No fue posible validar la reserva',
    })
  }

  const supabase = useSupabaseAdminClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('reservation_code', reserveCode)
    .eq('franchise', franchise)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'No fue posible validar la reserva',
    })
  }

  return { exists: data !== null }
})
