<template>
  <!--
    F1 contact FAB — restyled IN PLACE to the design's floating #contact-fab.

    This is the SINGLE FAB on the page: it is mounted exactly once, via
    <LazyChatWidget /> in app/layouts/default.vue. This restyle does NOT change
    where it is mounted and the home (index.vue / home/* components) must NOT
    mount a second FAB — that would duplicate it.

    Behaviour: a red pulse toggle that expands into a menu with two
    config-driven contact actions:
      - WhatsApp → franchise.whatsapp (already a full deep-link URL,
        consumed as-is, never re-wrapped).
      - Call → franchise.phone (distinct number) wrapped in a tel: link.
    No hardcoded numbers — both come from useAppConfig().franchise.

    Hydration safety (#109 lesson): the `open` state is client-only. It starts
    false and is only toggled by user interaction on the client, so SSR/ISR
    never bakes an expanded state. The whole widget is wrapped in <ClientOnly>
    so the floating overlay is never part of the prerendered HTML.
  -->
  <ClientOnly>
    <div class="fixed inset-0 pointer-events-none z-[60]">
      <!-- Backdrop (only interactive while open) -->
      <button
        v-if="open"
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 cursor-default pointer-events-auto"
        @click="open = false"
      />

      <div class="absolute bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-auto">
        <!-- Expanded menu -->
        <ul
          v-show="open"
          id="contact-fab-menu"
          role="menu"
          aria-label="Opciones de contacto"
          class="flex flex-col items-end gap-3 transition-all duration-200"
        >
          <!-- Cada item es UN solo <a> que envuelve etiqueta + círculo, así toda
               el área (incluido el texto) es clickeable, no solo el ícono. -->
          <li role="none" class="flex">
            <a
              :href="`tel:${franchise.phone}`"
              role="menuitem"
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
          <li role="none" class="flex">
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
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

        <!-- Main toggle FAB -->
        <button
          type="button"
          :aria-expanded="open"
          aria-controls="contact-fab-menu"
          :aria-label="open ? 'Cerrar opciones de contacto' : 'Abrir opciones de contacto'"
          class="relative flex items-center justify-center w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 hover:scale-105 transition-all duration-200"
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

// Client-only open state: starts collapsed, only toggled by user interaction on
// the client. SSR/ISR never bakes an expanded FAB (#109 hydration lesson).
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
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(204, 2, 43, 0.4);
  }
  50% {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 14px rgba(204, 2, 43, 0);
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
