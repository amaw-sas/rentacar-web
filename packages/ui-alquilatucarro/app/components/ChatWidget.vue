<template>
  <!--
    Contact FAB — botón flotante de contacto (WhatsApp + Llamar) SIN modal.

    Reemplaza el antiguo UModal de @nuxt/ui, cuyo cuerpo (`flex-1 overflow-y-auto`
    dentro de un contenido max-h-[100dvh] centrado por transform) colapsaba a ~0
    en Safari iOS, dejando el chat inservible en iPhone. Este FAB es HTML/CSS
    plano: no usa Reka UI Dialog, así que el bug de flexbox de iOS no aplica.

    IMPORTANTE — no usar role="menu"/"menuitem" aquí: base.css aplica hacks
    !important a los dropdowns de @nuxt/ui
      [role="menu"] { background-color: white !important }       → recuadro blanco
      [role="menu"] [role="menuitem"] span { color:#1f2937 ... } → íconos grises
    Esto NO es un menú ARIA (no hay navegación por flechas), es una lista de
    enlaces con patrón disclosure (el botón toggle tiene aria-expanded /
    aria-controls). Sin esos roles, los hacks de dropdown no colisionan.

    Es el ÚNICO FAB de la página: se monta una sola vez vía <LazyChatWidget /> en
    app/layouts/default.vue (y gana.vue). Ninguna otra vista debe montar otro.

    Acciones config-driven (sin números hardcodeados, todo de useAppConfig()):
      - WhatsApp → franchise.whatsapp (URL deep-link completa, se usa tal cual).
      - Llamar   → franchise.phone envuelto en un enlace tel:.
    Ambos son <a href> → los listeners globales de conversión en nuxt.config.ts
    (a[href*="wa.me"] y a[href^="tel:"]) siguen disparando clic_boton_whatsapp /
    clic_boton_llamada sin cambios.

    Hidratación: `open` es client-only (arranca en false, solo lo cambia la
    interacción del usuario), y todo va dentro de <ClientOnly>, así SSR/ISR nunca
    hornea un estado expandido.
  -->
  <ClientOnly>
    <div class="fixed inset-0 pointer-events-none z-[60]">
      <!-- Backdrop (solo interactivo cuando está abierto) -->
      <button
        v-if="open"
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 cursor-default pointer-events-auto"
        @click="open = false"
      />

      <div class="absolute bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-auto">
        <!-- Lista de enlaces de contacto (sin roles de menú ARIA, ver nota arriba).
             Cada item es UN solo <a> que envuelve etiqueta + círculo, así toda el
             área (texto incluido) es clickeable, no solo el ícono. -->
        <ul
          v-show="open"
          id="contact-fab-menu"
          aria-label="Opciones de contacto"
          class="flex flex-col items-end gap-3 transition-all duration-200"
        >
          <li class="flex">
            <a
              :href="`tel:${franchise.phone}`"
              :aria-label="`Llamar al ${franchise.phone}`"
              class="group flex items-center gap-3 rounded-full"
            >
              <span class="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-medium px-4 py-2 rounded-full shadow-md whitespace-nowrap">
                Llámanos directamente
              </span>
              <span class="flex items-center justify-center w-12 h-12 rounded-full bg-white text-blue-600 shadow-lg ring-1 ring-gray-200 transition-transform duration-200 group-hover:scale-110">
                <PhoneIcon cls="size-5" />
              </span>
            </a>
          </li>
          <li class="flex">
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir WhatsApp"
              class="group flex items-center gap-3 rounded-full"
            >
              <span class="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-medium px-4 py-2 rounded-full shadow-md whitespace-nowrap">
                Chatea por WhatsApp
              </span>
              <span class="flex items-center justify-center w-12 h-12 rounded-full bg-white text-[#25D366] shadow-lg ring-1 ring-gray-200 transition-transform duration-200 group-hover:scale-110">
                <WhatsappIcon cls="size-5" />
              </span>
            </a>
          </li>
        </ul>

        <!-- Botón toggle principal -->
        <button
          type="button"
          :aria-expanded="open"
          aria-controls="contact-fab-menu"
          :aria-label="open ? 'Cerrar opciones de contacto' : 'Abrir opciones de contacto'"
          class="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200"
          :class="{ 'animate-pulse-attention': !open }"
          @click="open = !open"
        >
          <svg
            v-if="!open"
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  IconsWhatsappIcon as WhatsappIcon,
  IconsPhoneIcon as PhoneIcon,
} from '#components'

const { franchise } = useAppConfig()

// Estado client-only: arranca colapsado, solo lo cambia la interacción del
// usuario en el cliente. SSR/ISR nunca hornea un FAB expandido (lección #109).
const open = ref(false)
</script>

<style scoped>
/* iOS Safari dibuja un rectángulo gris al tocar (ignora el rounded-full).
   Lo eliminamos para que no quede el "cuadrado" alrededor de los botones. */
a,
button {
  -webkit-tap-highlight-color: transparent;
}

@keyframes pulse-attention {
  0%,
  100% {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 14px rgba(34, 197, 94, 0);
  }
}

.animate-pulse-attention {
  animation: pulse-attention 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse-attention {
    animation: none;
  }
}
</style>
