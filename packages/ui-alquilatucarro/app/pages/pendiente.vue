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
      No necesitas hacer nada por ahora.
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

    <!-- Cuánto tarda — el porqué está en el <script setup>, que no se sirve al
         cliente. Los comentarios de plantilla sí viajan en el HTML, y este
         bloque existe justo para que la promesa vieja deje de estar en la
         página. -->
    <div class="bg-white/10 rounded-xl p-6 mb-6">
      <h2 class="text-lg font-semibold mb-2">¿Cuánto se demora?</h2>
      <p class="text-gray-200">
        Depende de la temporada. A veces respondemos en un par de horas; en
        temporada alta puede tomarnos algunos días.
      </p>
      <p class="text-gray-200 mt-3">
        Si mañana no has recibido nada, escríbenos y lo revisamos.
      </p>
    </div>

    <a
      :href="franchise.whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center justify-center gap-2 font-semibold rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover px-6 py-2.5 text-base transition-all duration-200"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29"/></svg>
      Escribir por WhatsApp
    </a>

    <p class="text-sm text-gray-400 mt-6">
      Revisa tu bandeja de entrada y carpeta de spam
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Por qué esta página ya no promete un plazo (issue #460).
 *
 * Decía que la respuesta tardaba de tres a cinco horas y que el cliente no
 * necesitaba hacer nada más. Siete de cada diez reservas se resuelven en menos
 * de dos horas, así que la cifra era hasta conservadora — y aun así estaba mal:
 * el operador puede tardar días, y a ese cliente la página le había prometido
 * horas y le había dicho que no hiciera nada.
 *
 * Afinar el número no arregla eso, porque cualquier cifra va a estar mal para
 * alguien. Lo que faltaba era qué hacer si no llega: de ahí el rango honesto,
 * la frase que dice cuándo escribir, y el botón para hacerlo.
 *
 * El detalle vive aquí y no en un comentario de plantilla porque esos sí se
 * sirven en el HTML — citar la promesa vieja la habría dejado en la página.
 */
const { franchise } = useAppConfig()

useHead({
  title: 'Reserva en proceso',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

useSeoMeta({
  description: 'Tu reserva de alquiler de carro está siendo procesada. Recibirás confirmación por correo.',
})
</script>
