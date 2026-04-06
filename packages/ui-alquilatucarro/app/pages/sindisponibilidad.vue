<template>
  <div class="text-white max-w-2xl mx-auto text-center py-12 px-4">
    <!-- Icono X -->
    <div class="pb-4 flex justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64px" height="64px" fill="#ff0000" aria-hidden="true">
        <path d="M175 175C184.4 165.7 199.6 165.7 208.1 175L255.1 222.1L303 175C312.4 165.7 327.6 165.7 336.1 175C346.3 184.4 346.3 199.6 336.1 208.1L289.9 255.1L336.1 303C346.3 312.4 346.3 327.6 336.1 336.1C327.6 346.3 312.4 346.3 303 336.1L255.1 289.9L208.1 336.1C199.6 346.3 184.4 346.3 175 336.1C165.7 327.6 165.7 312.4 175 303L222.1 255.1L175 208.1C165.7 199.6 165.7 184.4 175 175V175zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
      </svg>
    </div>

    <!-- Título -->
    <h1 class="text-3xl font-bold mb-4">Sin disponibilidad para la fecha de recogida</h1>

    <!-- Mensaje -->
    <p class="text-lg text-gray-200 mb-8">
      Aunque el vehículo aparece disponible en nuestra página,<br>
      nuestro inventario ya está agotado para esta fecha.
    </p>

    <!-- Qué hacer -->
    <div class="bg-white/10 rounded-xl p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">¿Qué puedes hacer?</h2>
      <p class="text-gray-300 mb-4">
        Intenta cambiar las fechas de tu búsqueda,<br>
        incluso un día de diferencia puede marcar la diferencia.
      </p>
      <NuxtLink
        :to="searchUrl"
        class="inline-block bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Modificar búsqueda
      </NuxtLink>
    </div>

    <!-- Ayuda -->
    <div class="bg-white/10 rounded-xl p-6">
      <h2 class="text-lg font-semibold mb-2">¿Necesitas ayuda?</h2>
      <p class="text-gray-300">
        📱 Escríbenos por WhatsApp
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">

const { franchise } = useAppConfig()
const store = useStoreReservationForm()

const searchUrl = computed(() => {
  const city = store.selectedPickupLocation?.city || 'bogota'
  const lugar_recogida = store.lugarRecogida || 'bog'
  const lugar_devolucion = store.lugarDevolucion || lugar_recogida
  const fecha_recogida = store.fechaRecogida || ''
  const fecha_devolucion = store.fechaDevolucion || ''
  const hora_recogida = store.horaRecogida || '12:00'
  const hora_devolucion = store.horaDevolucion || '12:00'

  return `/${city}/buscar-vehiculos/lugar-recogida/${lugar_recogida}/lugar-devolucion/${lugar_devolucion}/fecha-recogida/${fecha_recogida}/fecha-devolucion/${fecha_devolucion}/hora-recogida/${hora_recogida}/hora-devolucion/${hora_devolucion}`
})

useHead({
  title: `Sin Disponibilidad | ${franchise.shortname}`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

useSeoMeta({
  description: 'El vehículo solicitado no está disponible para esta fecha. Intenta con otras fechas.',
})
</script>