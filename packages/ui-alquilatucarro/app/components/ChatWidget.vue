<template>
  <!--
    FAB de contacto — 3 vías en orden Chat · WhatsApp · Llamar.
      - Chat  → desktop abre el panel inline (overlay, sin navegar, patrón
                Intercom/Crisp); móvil navega a /chat (pantalla completa). Lleva
                un chip verde con brillo: el chat IA está disponible 24/7.
      - WhatsApp / Llamar → enlaces wa.me / tel: (los listeners de conversión
                de nuxt.config siguen disparando), sin indicador de horario.

    HTML/CSS plano (sin Reka UI Dialog, sin role="menu" — los hacks !important
    de base.css romperían colores). Todo bajo <ClientOnly>: SSR/ISR nunca
    hornea estado abierto. El cuerpo del chat es <ChatConversation> (triplicado
    en cada app), compartido con la página /chat.
  -->
  <ClientOnly>
    <div class="fixed inset-0 pointer-events-none z-[60]">
      <!-- Backdrop -->
      <button
        v-if="menuOpen || panelOpen"
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 cursor-default pointer-events-auto"
        @click="closeAll"
      />

      <!-- Panel de chat inline (solo desktop) -->
      <div v-if="panelOpen" class="chat-panel pointer-events-auto">
        <ChatConversation variant="panel" @dismiss="panelOpen = false" />
      </div>

      <div class="absolute bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-auto">
        <!-- Menú de 3 vías (orden: Chat, WhatsApp, Llamar) -->
        <ul
          v-show="menuOpen"
          id="contact-fab-menu"
          aria-label="Opciones de contacto"
          class="flex flex-col items-end gap-3"
        >
          <li v-if="chatEnabled" class="flex">
            <button type="button" class="fab-item" @click="openChat">
              <span class="fab-label">Chat 24 horas</span>
              <span class="fab-circle fab-chat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                <span class="fab-chip fab-chip-glow" title="Disponible 24/7" />
              </span>
            </button>
          </li>
          <li class="flex">
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="fab-item"
              aria-label="Abrir WhatsApp"
            >
              <span class="fab-label">WhatsApp</span>
              <span class="fab-circle fab-whatsapp">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" /></svg>
              </span>
            </a>
          </li>
          <li class="flex">
            <a
              :href="`tel:${franchise.phone}`"
              class="fab-item"
              :aria-label="`Llamar al ${franchise.phone}`"
            >
              <span class="fab-label">Llámanos</span>
              <span class="fab-circle fab-call">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92" /></svg>
              </span>
            </a>
          </li>
        </ul>

        <!-- Botón flotante (toggle) -->
        <button
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="contact-fab-menu"
          :aria-label="menuOpen || panelOpen ? 'Cerrar' : 'Abrir opciones de contacto'"
          class="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200"
          :class="{ 'animate-pulse-attention': !menuOpen && !panelOpen }"
          @click="toggle"
        >
          <svg v-if="!menuOpen && !panelOpen" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const { franchise } = useAppConfig()
// Feature flag por entorno (Escudo): NUXT_PUBLIC_CHAT_ENABLED en el proyecto Vercel.
const chatEnabled = useRuntimeConfig().public.chatEnabled === 'true'

// Estado client-only: arranca colapsado (lección #109).
const menuOpen = ref(false)
const panelOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 768px)')

function toggle() {
  if (panelOpen.value) panelOpen.value = false
  else menuOpen.value = !menuOpen.value
}
function closeAll() {
  menuOpen.value = false
  panelOpen.value = false
}
function openChat() {
  menuOpen.value = false
  // Desktop: panel inline sobre la página (no navega). Móvil: /chat full-screen.
  if (isDesktop.value) panelOpen.value = true
  else navigateTo('/chat')
}
</script>

<style scoped>
a,
button { -webkit-tap-highlight-color: transparent; }

/* --- Items del menú FAB --- */
.fab-item { display: flex; align-items: center; gap: 0.75rem; border-radius: 9999px; }
.fab-label {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  color: #111827;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}
.fab-circle {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 3rem; height: 3rem; flex-shrink: 0;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, filter 0.15s ease;
}
.fab-item:hover .fab-circle { transform: scale(1.08); }
/* Icono coloreado por canal sobre círculo blanco. */
.fab-chat { color: var(--ui-primary, #cc022b); }
.fab-whatsapp { color: #25d366; }
.fab-call { color: #2563eb; }
/* Chip de disponibilidad (solo el Chat: verde con brillo pulsante = 24/7). */
.fab-chip {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 9999px;
  border: 2px solid #fff;
}
.fab-chip-glow {
  background: #22c55e;
  animation: chip-glow 1.6s ease-in-out infinite;
}
@keyframes chip-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  50% { box-shadow: 0 0 7px 2px rgba(34, 197, 94, 0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .fab-chip-glow { animation: none; box-shadow: 0 0 5px 1px rgba(34, 197, 94, 0.8); }
}

/* --- Panel inline (desktop) --- */
.chat-panel {
  position: absolute;
  bottom: 6rem;
  right: 1.5rem;
  width: 24rem;
  max-width: calc(100vw - 2rem);
  height: 32rem;
  max-height: min(75dvh, 40rem);
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Pulso de atención del FAB (respeta reduce-motion) */
@keyframes pulse-attention {
  0%, 100% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(204, 2, 43, 0.4); }
  50% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 14px rgba(204, 2, 43, 0); }
}
.animate-pulse-attention { animation: pulse-attention 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .animate-pulse-attention { animation: none; } }
</style>
