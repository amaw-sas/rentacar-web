<template>
  <div class="text-white max-w-2xl mx-auto text-center py-12 px-4">
    <!-- Icono de reloj -->
    <div class="pb-4 flex justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64px" height="64px" fill="#ff8a00" aria-hidden="true">
        <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
      </svg>
    </div>

    <!-- Título -->
    <h1 class="text-3xl font-bold mb-4">¡Tu solicitud está en proceso!</h1>

    <!-- Mensaje principal -->
    <p class="text-lg text-gray-200 mb-8">
      Estamos verificando la disponibilidad de tu vehículo.<br>
      No necesitas hacer nada más.
    </p>

    <!-- Notificaciones -->
    <div class="bg-white/10 rounded-xl p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Te notificaremos por:</h2>
      <div class="flex justify-center gap-8">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📱</span>
          <span>WhatsApp</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">📧</span>
          <span>Correo electrónico</span>
        </div>
      </div>
    </div>

    <!-- Tiempo estimado -->
    <p class="text-gray-300">
      <span class="font-semibold text-white">Tiempo estimado:</span> 3 a 5 horas
    </p>
    <p class="text-sm text-gray-400 mt-2">
      Revisa tu bandeja de entrada y carpeta de spam
    </p>
  </div>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

useHead({
  title: `Reserva en Proceso | ${franchise.shortname}`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

useSeoMeta({
  description: 'Tu reserva de alquiler de carro está siendo procesada. Recibirás confirmación por correo.',
})
</script>