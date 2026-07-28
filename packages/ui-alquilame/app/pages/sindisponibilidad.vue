<template>
  <!-- Notas de diseño y de copy: ver el bloque del <script setup>. Vue renderiza
       los comentarios del template al HTML, así que aquí no va contexto interno. -->
  <div
    class="relative min-h-screen"
    style="background-image:url('/images/reservado/fondo-tiquete.webp');background-size:cover;background-position:center"
  >
    <div class="absolute inset-0 bg-black/10" aria-hidden="true" />

    <div class="relative max-w-2xl mx-auto px-4 py-12 sm:py-16" role="status">
      <div class="shadow-2xl">
        <!-- Bloque superior del tiquete -->
        <div class="bg-white rounded-t-3xl px-6 pt-10 pb-8 text-center">
          <!-- X en rojo de marca (#cc022b). El #ff0000 puro de antes no está en
               la paleta y chillaba junto al rojo del header. -->
          <div class="pb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60px" height="60px" fill="#cc022b" aria-hidden="true">
              <path d="M175 175C184.4 165.7 199.6 165.7 208.1 175L255.1 222.1L303 175C312.4 165.7 327.6 165.7 336.1 175C346.3 184.4 346.3 199.6 336.1 208.1L289.9 255.1L336.1 303C346.3 312.4 346.3 327.6 336.1 336.1C327.6 346.3 312.4 346.3 303 336.1L255.1 289.9L208.1 336.1C199.6 346.3 184.4 346.3 175 336.1C165.7 327.6 165.7 312.4 175 303L222.1 255.1L175 208.1C165.7 199.6 165.7 184.4 175 175V175zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
            </svg>
          </div>

          <h1 class="font-heading font-extrabold text-3xl sm:text-4xl text-gray-900 mb-5">
            Sin disponibilidad para esas fechas
          </h1>

          <p class="text-lg text-gray-600">
            Nuestra página va a seguir mostrando ese vehículo como disponible, pero
            el inventario para esas fechas ya está agotado. Si repites la misma
            búsqueda vas a llegar aquí otra vez.
          </p>
        </div>

        <!-- Divisor troquelado -->
        <div class="ticket-divider bg-white" aria-hidden="true">
          <div class="border-t-2 border-dashed border-gray-300 mx-8" />
        </div>

        <!-- Bloque inferior del tiquete -->
        <div class="bg-white rounded-b-3xl px-6 pt-8 pb-10 text-center">
          <div class="border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 class="font-heading font-bold text-gray-900 mb-2">¿Qué puedes hacer?</h2>
            <p class="text-gray-600 mb-5">
              Cambia las fechas. Un día de diferencia suele ser suficiente.
              También puedes probar otra ciudad o categoría.
            </p>
            <button
              type="button"
              class="inline-flex items-center justify-center font-semibold rounded-full bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 px-6 py-3 text-base shadow-lg shadow-brand-600/25 transition-colors"
              @click="buscarConOtrasFechas"
            >
              Buscar con otras fechas
            </button>
          </div>

          <div class="border border-gray-200 rounded-2xl p-5">
            <h2 class="font-heading font-bold text-gray-900 mb-2">¿Necesitas esas fechas exactas?</h2>
            <p class="text-gray-600 mb-5">
              Escríbenos y te ayudamos a buscar alternativas.
            </p>
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 font-semibold rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover px-6 py-2.5 text-base transition-all duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29"/></svg>
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createCurrentDateObject } from '@rentacar-main/logic/utils'

/**
 * Desenlace "no hay stock". Comparte el tratamiento de tiquete con /reservado
 * (foto full-bleed + tarjeta blanca troquelada) para que las tres pantallas
 * finales del flujo se lean como la misma familia.
 *
 * Antes esta página no pintaba fondo propio y dejaba ver el respaldo vinotinto
 * del layout (default.vue: `from-brand-900 to-brand-950`), que nunca fue una
 * decisión de diseño — era el único sitio donde ese respaldo quedaba a la vista.
 *
 * El aviso del inventario se queda a propósito: el catálogo va a seguir
 * mostrando ese vehículo como disponible, así que sin esa frase el cliente
 * repite la búsqueda y vuelve a caer aquí.
 *
 * La foto va en `style` inline + preload, igual que en /reservado: es el LCP y
 * en rutas no-home la hoja de estilos llega tarde, así que una utility de
 * Tailwind retrasaría su descubrimiento.
 *
 * Estas notas viven en el script y no en el template: Vue renderiza los
 * comentarios del template al HTML, así que ahí viajarían al cliente en cada
 * carga y quedarían a la vista en el código fuente público.
 */
const { franchise } = useAppConfig()
const store = useStoreReservationForm()

/**
 * Rompe el bucle de fechas.
 *
 * El `Searcher` está atado en dos direcciones al store (Searcher.vue:570-590),
 * así que volver a /reservas sin tocar nada prefila LAS MISMAS fechas que
 * acaban de fallar: el cliente busca, ve el vehículo disponible otra vez, lo
 * pide y aterriza de nuevo en esta página. La versión anterior era peor todavía
 * — reconstruía el deep link completo con esas fechas.
 *
 * Se limpian solo las fechas, a los mismos valores con los que arranca el store
 * (mañana / +8 días, useStoreReservationForm.ts:59-63). La sede se conserva:
 * el cliente sigue queriendo esa ciudad, lo que no puede repetir son las fechas.
 */
function buscarConOtrasFechas() {
  store.fechaRecogida = createCurrentDateObject().add({ days: 1 }).toString()
  store.fechaDevolucion = createCurrentDateObject().add({ days: 8 }).toString()
  navigateTo('/reservas')
}

useHead({
  title: 'Sin disponibilidad',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ],
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/images/reservado/fondo-tiquete.webp',
      fetchpriority: 'high',
      key: 'sindisponibilidad-background'
    }
  ]
})

useSeoMeta({
  description: 'El vehículo solicitado no está disponible para esta fecha. Intenta con otras fechas.',
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* Muescas del tiquete: el mask recorta dos semicírculos transparentes en los
   bordes del divisor, dejando ver la foto de fondo — el troquel clásico.
   Mismo bloque que reservado/[reserveCode]/index.vue. */
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
