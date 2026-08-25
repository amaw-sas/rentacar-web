<template>
  <!-- Notas de diseño y de copy: ver el bloque del <script setup>. Vue renderiza
       los comentarios del template al HTML, así que aquí no va contexto interno. -->
  <div
    class="relative min-h-screen"
    style="background-image:url('/images/reservado/fondo-tiquete.webp');background-size:cover;background-position:center"
  >
    <div class="absolute inset-0 bg-black/10" aria-hidden="true" />

    <div class="relative max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div class="shadow-2xl">
        <!-- Bloque superior del tiquete -->
        <div class="bg-white rounded-t-3xl px-6 pt-10 pb-8 text-center">
          <!-- Reloj en ámbar (#f59e0b). El #ff8a00 suelto de antes no estaba en
               ninguna escala. -->
          <div class="pb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60px" height="60px" fill="#f59e0b" aria-hidden="true">
              <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
            </svg>
          </div>

          <h1 class="font-heading font-extrabold text-3xl sm:text-4xl text-gray-900 mb-5">
            Recibimos tu solicitud
          </h1>

          <p class="text-lg text-gray-600">
            Todavía no es una reserva confirmada. Estamos verificando la
            disponibilidad y te escribimos apenas tengamos respuesta.
            No necesitas hacer nada por ahora.
          </p>
        </div>

        <!-- Divisor troquelado -->
        <div class="ticket-divider bg-white" aria-hidden="true">
          <div class="border-t-2 border-dashed border-gray-300 mx-8" />
        </div>

        <!-- Bloque inferior del tiquete -->
        <div class="bg-white rounded-b-3xl px-6 pt-8 pb-10 text-center">
          <div class="border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 class="font-heading font-bold text-gray-900 mb-4">Te avisamos por</h2>
            <div class="flex flex-wrap justify-center gap-x-10 gap-y-3">
              <div class="flex items-center gap-2 text-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29"/></svg>
                <span>WhatsApp</span>
              </div>
              <div class="flex items-center gap-2 text-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span>Correo electrónico</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-4">
              Revisa también la carpeta de spam.
            </p>
          </div>

          <div class="border border-gray-200 rounded-2xl p-5 mb-6">
            <h2 class="font-heading font-bold text-gray-900 mb-2">¿Cuánto se demora?</h2>
            <p class="text-gray-600">
              Depende de la temporada. A veces respondemos en un par de horas;
              en temporada alta puede tomarnos algunos días.
            </p>
            <!-- El botón de abajo ya estaba, pero nada lo señalaba como la
                 salida. Sin esta frase el cliente que lleva dos días esperando
                 no sabe que puede escribir (issue #460). -->
            <p class="text-gray-600 mt-3">
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

          <!-- Salida hacia una reserva nueva: el operador que atiende una fila
               venía usando el Atrás del navegador. -->
          <div class="mt-4">
            <NuxtLink
              data-testid="nueva-reserva-link"
              to="/reservas"
              class="inline-flex items-center justify-center gap-2 font-semibold rounded-full border border-gray-300 text-gray-900 hover:bg-gray-50 px-6 py-2.5 text-base transition-all duration-200"
            >
              Hacer otra reserva
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Desenlace "en revisión". Mismo tratamiento de tiquete que /reservado y
 * /sindisponibilidad; antes esta página no pintaba fondo propio y dejaba ver el
 * respaldo vinotinto del layout (default.vue: `from-brand-900 to-brand-950`),
 * que nunca fue una decisión de diseño — era el único sitio donde asomaba.
 *
 * Decisiones de copy (acordadas con el negocio):
 *   - NO se muestra el código de reserva aunque el backend lo devuelva: al
 *     verlo, el cliente da por hecho que la reserva ya quedó, y aquí todavía
 *     está en revisión.
 *   - Sirve también a las mensualidades, que SIEMPRE pasan por revisión manual.
 *     Por eso el texto no promete un flujo automático.
 *   - El tiempo es el real: depende de la temporada y de la gestión del
 *     proveedor. El estimado fijo que había aquí se rompía solo fuera de
 *     horario y generaba el reclamo por WhatsApp.
 *
 * Estas notas viven en el script y no en el template: Vue emite los comentarios
 * del template al HTML en desarrollo y preview (en producción el compilador los
 * descarta), y el script se minifica siempre. Es el lado seguro para el contexto
 * de negocio.
 */
const { franchise } = useAppConfig()

useHead({
  title: 'Reserva en proceso',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ],
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/images/reservado/fondo-tiquete.webp',
      fetchpriority: 'high',
      key: 'pendiente-background'
    }
  ]
})

useSeoMeta({
  description: 'Tu solicitud de alquiler de carro está en revisión. Te avisamos por WhatsApp y correo.',
})

// Issue #472 — la solicitud ya salió: el formulario queda listo para el siguiente
// cliente. Sin esto, retroceder desde aquí devuelve al operador un formulario con
// los datos del cliente anterior y el CTA de envío girando para siempre.
// En `onMounted` y no en el submit: aquí el formulario ya está desmontado, así que
// no reabre la ventana de doble-POST.
onMounted(() => {
  useStoreReservationForm().resetAfterReservation()
})
</script>

<style scoped>
/* Muescas del tiquete — mismo bloque que reservado/[reserveCode]/index.vue. */
.ticket-divider {
  height: 32px;
  display: flex;
  align-items: center;
  mask-image:
    radial-gradient(circle 16px at 0 50%, transparent 15px, black 16px),
    radial-gradient(circle 16px at 100% 50%, transparent 15px, black 16px);
  mask-composite: intersect;
  -webkit-mask-image:
    radial-gradient(circle 16px at 0 50%, transparent 15px, black 16px),
    radial-gradient(circle 16px at 100% 50%, transparent 15px, black 16px);
  -webkit-mask-composite: source-in;
}
.ticket-divider > div {
  flex: 1;
}
</style>
