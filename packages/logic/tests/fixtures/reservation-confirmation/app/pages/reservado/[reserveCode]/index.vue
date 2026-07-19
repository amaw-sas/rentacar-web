<template>
  <main>
    <section
      v-if="validation.status === 'unavailable'"
      data-reservation-state="unavailable"
    >
      <h1>Estamos verificando tu reserva</h1>
      <p>Intenta en unos minutos.</p>
    </section>

    <section v-else data-reservation-state="confirmed">
      <h1>¡Tu reserva está confirmada!</h1>
      <p>{{ validation.reserveCode }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import useReservationConfirmation from '@fixture/useReservationConfirmation'

const validation = await useReservationConfirmation()

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
