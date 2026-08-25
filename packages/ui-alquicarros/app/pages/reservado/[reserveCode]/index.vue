<template>
  <ReservationConfirmation
    :status="validation.status"
    :reserve-code="reserveCode"
    :show="show"
    :recap="recap"
    :whatsapp-url="franchise.whatsapp"
    :email="franchise.email"
    :phone="franchise.phone"
  />
</template>

<script setup lang="ts">
import useReservationConfirmation from '@rentacar-main/logic/composables/useReservationConfirmation'
import { useReservationRecap } from '~/composables/useReservationRecap'

// El endpoint solo devuelve un booleano de existencia (el código es tipo bearer).
const validation = await useReservationConfirmation()
const reserveCode = validation.reserveCode

// Recap efímero: sale del snapshot congelado en el submit, gateado por código.
// En refresh / link compartido el store está vacío → show=false → degrada.
const { show, recap } = useReservationRecap()

const { franchise } = useAppConfig()

useHead({
  title: validation.status === 'found'
    ? 'Reserva confirmada'
    : 'Verificando reserva',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

useSeoMeta({
  description: validation.status === 'found'
    ? 'Tu reserva de alquiler de carro ha sido confirmada. Revisa tu correo para los detalles.'
    : 'Estamos verificando tu reserva. Intenta en unos minutos.',
})

// Issue #472 — la reserva se cerró: el formulario queda listo para el siguiente
// cliente. Sin esto, retroceder desde aquí devuelve al operador un formulario con
// los datos del cliente anterior y el CTA girando en "Confirmando…" para siempre.
// En `onMounted` y no en el submit: aquí el formulario ya está desmontado, así que
// no reabre la ventana de doble-POST. El recap de arriba lee `lastReservationSummary`,
// que el reset no toca.
onMounted(() => {
  useStoreReservationForm().resetAfterReservation()
})

// Lazy load js-confetti (solo se carga en esta página de confirmación)
onMounted(async () => {
  if (validation.status !== 'found') return

  const JSConfetti = (await import('js-confetti')).default
  const confetti = new JSConfetti()
  confetti.addConfetti()
})
</script>
