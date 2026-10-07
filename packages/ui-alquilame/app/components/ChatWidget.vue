<template>
  <!--
    FAB de contacto — un único botón flotante (lanzador) que despliega el menú
    de canales: Chat 24/7 y WhatsApp.
      - Chat  → desktop abre el panel inline (overlay, sin navegar, patrón
                Intercom/Crisp); móvil navega a /chat (pantalla completa). Lleva
                un chip verde con brillo: el chat IA está disponible 24/7.
      - WhatsApp → enlace wa.me, visible sólo cuando su interruptor maestro y
                   su horario del dashboard lo permiten.
      - Sin acceso telefónico: delta de marca, alquilame no lo ofrece (no hay
                   fila de llamada ni número de desvío).
    Colapsado por defecto: un solo círculo no tapa el contenido de la página.

    HTML/CSS plano (sin Reka UI Dialog, sin role="menu" — los hacks !important
    de base.css romperían colores). Todo bajo <ClientOnly>: SSR/ISR nunca
    hornea estado abierto. El cuerpo del chat es <ChatConversation> (triplicado
    en cada app), compartido con la página /chat.
  -->
  <ClientOnly>
    <!-- SCEN-322-X05: teleported to <body> so the overlay lives OUTSIDE the app
         root (#__nuxt) — that lets the whole page behind the backdrop be marked
         inert while the panel is open without inerting the chat itself. -->
    <Teleport to="body">
    <div class="contact-fab-layer fixed inset-0 pointer-events-none z-[60]">
      <!-- Región aria-live persistente (siempre en el DOM, nunca v-if): anuncia
           un mensaje nuevo cuando llega con el chat cerrado. -->
      <span class="sr-only" role="status" aria-live="polite">{{ chatEnabled ? announce : '' }}</span>
      <!-- Región aria-live del teaser proactivo (texto sin emoji, nunca v-if). -->
      <span class="sr-only" role="status" aria-live="polite">{{ teaserAllowed ? teaserAnnounce : '' }}</span>

      <!-- Backdrop: atenúa la página con el menú o el panel abiertos. El inert del
           fondo sigue siendo solo del panel; el menú se descarta al tocar fuera. -->
      <button
        v-if="menuOpen || (chatEnabled && panelOpen)"
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 cursor-default pointer-events-auto"
        @click="closeAll"
      />

      <!-- Panel de chat inline (solo desktop) -->
      <div
        v-if="chatEnabled && panelOpen"
        ref="panelEl"
        role="dialog"
        aria-modal="true"
        aria-label="Chat de asistencia"
        tabindex="-1"
        class="chat-panel pointer-events-auto"
        :style="panelLiftStyle"
      >
        <ChatConversation :active="panelOpen" variant="panel" @dismiss="panelOpen = false" />
      </div>

      <!-- data-shift-left mueve el stack a la izquierda con el resumen de reserva
           abierto en escritorio (>=1024px); ver CSS. En movil el rediseno oculta
           el stack entero via hideContactButtons, asi que no hay lift. -->
      <div
        v-if="(chatEnabled || whatsappVisible) && !hideContactButtons"
        class="contact-fab-stack absolute right-6 flex flex-col items-end gap-4 pointer-events-none"
        :data-shift-left="shiftLeft"
      >
        <!-- Reserva estable para las dos etapas del teaser. La burbuja aparece
             con transform/opacity sin cambiar la geometría del contenedor ni
             mover el FAB a mitad de sesión. -->
        <div v-if="chatEnabled" class="teaser-slot">
          <div class="teaser-bubble teaser-sizer" aria-hidden="true">
            <p class="teaser-line">{{ TEASER_LINE_1 }}</p>
            <p class="teaser-line teaser-line-2">{{ TEASER_LINE_2 }}</p>
          </div>
          <div
            v-if="teaserOpen"
            :key="teaserStep"
            class="teaser-bubble pointer-events-auto"
            :class="{ 'teaser-bubble-entering': teaserStep === 1 }"
            @click="openChat"
          >
            <button
              ref="teaserCloseEl"
              type="button"
              class="teaser-close"
              aria-label="Cerrar mensaje"
              @click.stop="teaser.dismiss()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <p class="teaser-line">{{ TEASER_LINE_1 }}</p>
            <p v-if="teaserStep === 2" class="teaser-line teaser-line-2">{{ TEASER_LINE_2 }}</p>
          </div>
        </div>

        <!-- Menú de canales: oculto hasta tocar el lanzador (v-show, sin
             transición). Sigue montado para que el lanzador lo controle por id. -->
        <ul
          v-show="menuOpen"
          id="contact-fab-menu"
          aria-label="Opciones de contacto"
          class="flex flex-col items-end gap-3 pointer-events-auto"
        >
          <li v-if="chatEnabled" class="flex">
            <button
              type="button"
              class="fab-item"
              :aria-expanded="panelOpen"
              :aria-label="panelOpen ? 'Cerrar Chat 24 horas' : 'Abrir Chat 24 horas'"
              @click="toggleChat"
            >
              <span class="fab-label">Chat 24 horas</span>
              <span class="fab-circle fab-chat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
                <!-- Sin mensajes: punto verde 24/7. Con conteo real o sintético,
                     una sola insignia; los no leídos reales siempre mandan. -->
                <span
                  v-if="unread === 0 && displayedSyntheticCount === 0"
                  class="fab-chip fab-chip-glow"
                  title="Disponible 24/7"
                />
                <span v-if="unread > 0 || displayedSyntheticCount > 0" class="fab-badge fab-badge-option" aria-hidden="true">{{ unread > 0 ? (unread > 9 ? '9+' : unread) : displayedSyntheticCount }}</span>
              </span>
            </button>
          </li>
          <li v-if="whatsappVisible" class="flex">
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="fab-item"
              aria-label="Abrir WhatsApp"
              @click="onChannelLink('whatsapp')"
            >
              <span class="fab-label">WhatsApp</span>
              <span class="fab-circle fab-whatsapp">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" /></svg>
              </span>
            </a>
          </li>
        </ul>

        <!-- Lanzador (toggle). Con el menú o el panel abiertos es una X. Su altura
             es lo único que queda bajo el panel, así que es lo que se mide. -->
        <button
          ref="launcherEl"
          type="button"
          :aria-expanded="menuOpen || panelOpen"
          aria-controls="contact-fab-menu"
          :aria-label="menuOpen || panelOpen ? 'Cerrar' : badgeCount > 0 ? `Abrir opciones de contacto (${badgeCount} ${badgeCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'})` : 'Abrir opciones de contacto'"
          class="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200 pointer-events-auto"
          :class="{ 'animate-pulse-attention': !menuOpen && !panelOpen && badgeCount === 0 }"
          @click="toggle"
        >
          <svg v-if="!menuOpen && !panelOpen" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>

          <!-- Insignia del lanzador: no leídos REALES mandan; si no hay, el contador
               sintético del teaser. Abrir el menú NO limpia nada (solo abrir el chat
               → markRead). Con el menú/panel abierto el lanzador es una X: la
               insignia se OCULTA y el conteo vive en el círculo de Chat. -->
          <span v-if="badgeCount > 0 && !menuOpen && !panelOpen" class="fab-badge" aria-hidden="true">{{ badgeCount > 9 ? '9+' : badgeCount }}</span>
        </button>
      </div>
    </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import {
  isContactTeaserRouteExcluded,
  TEASER_LINE_1,
  TEASER_LINE_2,
} from '@rentacar-main/logic/composables/useContactTeaser'
import { chatPanelLiftPx } from '@rentacar-main/logic/utils/chatPanelLift'

// The conversation/SSE/markdown graph is interaction-only. Because the panel
// is also guarded by v-if, this loader is not requested until desktop chat is
// opened (mobile keeps using the already route-split /chat page).
const ChatConversation = defineAsyncComponent(() => import('./ChatConversation.vue'))

const { franchise } = useAppConfig()
// alquilame no tiene acceso tel: (delta de marca), así que no usa useCallPhone.
const route = useRoute()
const { reservationOverlayOpen } = storeToRefs(useStoreSearchData())
// Visibilidad del chat = el switch por marca del dashboard manda (auto-import
// useChatStatus). Fetch client-only, fail-closed. Reemplaza al viejo flag de
// entorno NUXT_PUBLIC_CHAT_ENABLED (runtimeConfig.public.chatEnabled ya no gobierna
// la visibilidad; el operador prende/apaga cada marca desde /chat-knowledge).
const {
  enabled: chatEnabled,
  whatsappVisible,
  resolved: chatStatusResolved,
} = useChatStatus(franchise.shortname as string)

// Estado client-only: arranca colapsado (lección #109).
const menuOpen = ref(false)
const panelOpen = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const teaserCloseEl = ref<HTMLButtonElement | null>(null)
const isDesktop = useMediaQuery('(min-width: 768px)')

// El panel se ancla SOBRE lo único que queda visible debajo de él: el lanzador.
// `openChat` cierra el menú antes de abrir el panel, así que se mide el botón
// (siempre montado mientras el stack lo esté) y no el <ul>, que con `v-show`
// colapsado mide 0, ni `.contact-fab-stack`, que incluye el teaser-sizer oculto
// y su hueco (122 px medidos).
const launcherEl = ref<HTMLElement | null>(null)
const launcherHeight = ref(0)
let launcherObserver: ResizeObserver | null = null
const panelLiftStyle = computed(() => {
  const lift = chatPanelLiftPx(launcherHeight.value)
  return lift === null ? undefined : `--panel-lift: ${lift}px`
})
function measureLauncher() {
  launcherHeight.value = launcherEl.value?.getBoundingClientRect().height ?? 0
}
// El lanzador vive detrás de un v-if (switches del dashboard, overlay de reserva),
// así que el observer se re-engancha cuando el elemento aparece o desaparece.
// En servidor el ref es null y ResizeObserver nunca se toca.
watch(launcherEl, (el) => {
  launcherObserver?.disconnect()
  launcherObserver = null
  if (!el) return
  measureLauncher()
  // jsdom no implementa ResizeObserver. La medida sincrónica de `openChat`
  // basta para colocar el panel; sin observador solo se pierde el reajuste
  // posterior, que en un entorno sin layout no tiene nada que observar.
  if (typeof ResizeObserver === 'undefined') return
  launcherObserver = new ResizeObserver(measureLauncher)
  launcherObserver.observe(el)
}, { immediate: true })
onBeforeUnmount(() => launcherObserver?.disconnect())

// Desplazamiento a la izquierda de main (>=1024px), conservado tal cual.
// OJO: hoy es INALCANZABLE — `hideContactButtons` de abajo desmonta el stack en
// cuanto el overlay se abre, y la misma escritura enciende las dos banderas, así
// que no queda ningún estado en el que este cálculo se pueda observar. Se deja
// intacto porque es una feature certificada de main y su retirada no es de este
// merge; va anotado como seguimiento.
const reservationSummaryOpen = useState<boolean>('reservation-slideover-open', () => false)
const isWideViewport = useMediaQuery('(min-width: 1024px)')
const shiftLeft = computed(() => isWideViewport.value && reservationSummaryOpen.value)

// El pie del slideover de reserva ya trae su propio CTA de WhatsApp y el stack
// flotante se le montaba encima en escritorio, así que se oculta en TODO viewport
// mientras el overlay está abierto. Absorbe la partición en 1024 que traíamos:
// ocultar siempre cubre por definición la banda de 768 a 1023 donde la barra
// inferior del wizard de alquicarros (`lg:hidden fixed inset-x-0 bottom-0`)
// ocupa el ancho completo. `isDesktop` sigue vivo para el panel inline del chat.
const hideContactButtons = computed(() => reservationOverlayOpen.value)

// Cuando el stack se desmonta (overlay de reserva, o ambos canales apagados) el
// menú se cierra: sin esto reaparecería ya abierto al volver el stack. El panel
// vive fuera del stack y conserva su propio watcher de `chatEnabled`.
watch(() => (chatEnabled.value || whatsappVisible.value) && !hideContactButtons.value, (visible) => {
  if (!visible) menuOpen.value = false
})

// Singleton compartido con ChatConversation: leemos el contador de no leídos para
// la insignia del FAB y la región aria-live. El getter es SSR-safe (instancia
// inerte en servidor). La insignia se limpia cuando la SUPERFICIE monta
// (onSurfaceMounted → markRead), no aquí: marcar leído en openChat borraría el
// separador "Mensajes nuevos" antes de que ChatConversation capture su ancla.
const { unread, announce, emitReopenedFromBadge, prepareChatOpen } = useChatUnreadBadge(franchise.shortname as string)

// Teaser proactivo (saludo + badge sintético). Singleton por marca, SSR-safe
// (instancia inerte en servidor). El texto/keys viven en el composable.
const teaser = useContactTeaser()
const { syntheticCount, teaserVisible, teaserStep, teaserAnnounce } = teaser

// The dashboard switch gates every chat-derived surface. Reservation URLs keep
// direct contact available but suppress the proactive invitation throughout the
// funnel, including deep links to summary and the following step.
const teaserAllowed = computed(
  () => chatEnabled.value && !isContactTeaserRouteExcluded(route.path),
)
const displayedSyntheticCount = computed(() =>
  teaserAllowed.value ? syntheticCount.value : 0,
)

// La insignia del lanzador fusiona no leídos REALES (mandan, solo con el chat
// encendido) con el contador sintético del teaser; el chip del ítem Chat del
// menú sigue en el conteo real/sintético de la opción.
const badgeCount = computed(() => {
  if (chatEnabled.value && unread.value > 0) return unread.value
  return displayedSyntheticCount.value
})

// La burbuja de saludo solo cuando NO hay no leídos reales y el FAB está
// colapsado (ni menú ni panel abiertos).
const teaserOpen = computed(
  () =>
    teaserAllowed.value &&
    teaserVisible.value &&
    unread.value === 0 &&
    !menuOpen.value &&
    !panelOpen.value,
)

// Step 2 replaces the compact bubble inside its reserved slot so no existing
// layout box moves. If a keyboard user was on Close, carry focus to the new
// button instead of dropping it when that keyed subtree is replaced.
watch(teaserStep, async () => {
  if (typeof document === 'undefined' || document.activeElement !== teaserCloseEl.value) return
  await nextTick()
  teaserCloseEl.value?.focus({ preventScroll: true })
})

// Wait for the status request to settle before scheduling anything: enabled is
// fail-closed and initially false, but that loading value must not terminally
// suppress teasers for brands whose API response is ON.
watch(
  [chatStatusResolved, teaserAllowed],
  ([resolved, allowed]) => {
    if (!resolved) return
    if (allowed) {
      teaser.start({
        realUnread: () => unread.value,
        allowed: () => teaserAllowed.value,
      })
    } else {
      teaser.stop()
    }
  },
  { immediate: true },
)

// A focus revalidation can turn the switch OFF while the panel is open. Close
// it locally so ChatConversation (and its typing indicator) immediately unmounts.
watch(chatEnabled, (enabled) => {
  if (!enabled) panelOpen.value = false
})

// Cuando aparece un no leído REAL, el teaser sintético queda cancelado para toda
// la sesión (no resucita al leerlo). immediate: cubre tanto el no leído que llega
// en vivo como uno restaurado al montar.
watch(unread, (v) => { if (v > 0) teaser.suppressForSession() }, { immediate: true })

// SCEN-322-A02: Escape cierra menú/panel; foco al panel al abrir.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAll()
}
watch(panelOpen, async (open) => {
  if (open) {
    await nextTick()
    panelEl.value?.focus()
  }
})

// SCEN-322-X05: while the inline panel is open the page behind the backdrop is
// inert (not tabbable, hidden from AT). The overlay is teleported to <body>, so
// inerting the app root (#__nuxt) never touches the chat itself. The unmount
// hook prevents an orphaned inert if the widget unmounts with the panel open.
function setBackgroundInert(on: boolean) {
  if (typeof document === 'undefined') return
  const appRoot = document.getElementById('__nuxt')
  if (!appRoot) return
  if (on) appRoot.setAttribute('inert', '')
  else appRoot.removeAttribute('inert')
}
watch(panelOpen, (open) => setBackgroundInert(open))
onBeforeUnmount(() => setBackgroundInert(false))
onMounted(() => {
  if (import.meta.client) window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
  teaser.stop()
})

function toggle() {
  if (panelOpen.value) closePanel()
  else menuOpen.value = !menuOpen.value
}
function closePanel() {
  panelOpen.value = false
}
// Si el foco está DENTRO del menú (los ítems van antes del lanzador en el orden
// de tab), ocultar el <ul> lo mandaría a <body> y el siguiente Tab arrancaría
// desde el inicio de la página. Se devuelve al lanzador ANTES de ocultar.
function restoreFocusToLauncher() {
  if (typeof document === 'undefined') return
  const menuEl = document.getElementById('contact-fab-menu')
  if (menuEl && menuEl.contains(document.activeElement)) launcherEl.value?.focus({ preventScroll: true })
}
function closeAll() {
  restoreFocusToLauncher()
  menuOpen.value = false
  closePanel()
}
function onChannelLink(channel: 'whatsapp' | 'llamada') {
  teaser.engage(channel)
  restoreFocusToLauncher()
  menuOpen.value = false
}
function toggleChat() {
  if (panelOpen.value) closePanel()
  else openChat()
}
function openChat() {
  if (!chatEnabled.value) return
  prepareChatOpen(
    // teaserOpen (no teaserVisible): con el menú abierto la burbuja está oculta,
    // así que abrir el chat desde la fila del menú es 'fab'. Atribuir 'teaser'
    // ahí inflaría el KPI del teaser de forma determinista.
    unread.value > 0 ? 'unread_badge' : teaserOpen.value ? 'teaser' : 'fab',
  )
  // Cualquier acción de contacto limpia el teaser sintético y marca supresión 15d.
  teaser.engage('chat')
  // Abrir el chat (no el menú) es lo único que limpia la insignia — lo hace la
  // superficie al montar (onSurfaceMounted → markRead). Aquí solo el beacon.
  if (unread.value > 0) emitReopenedFromBadge()
  menuOpen.value = false
  // Desktop: panel inline sobre la página (no navega). Móvil: /chat full-screen.
  if (isDesktop.value) {
    // Medida sincrónica antes de abrir: el lanzador está montado siempre (el
    // `v-show` del menú no lo afecta), así que el panel nace con el bottom
    // correcto en vez de saltar un frame desde el fallback.
    measureLauncher()
    panelOpen.value = true
  }
  else navigateTo('/chat')
}
</script>

<style scoped>
a,
button { -webkit-tap-highlight-color: transparent; }

/* Posición flotante normal. Al abrir la reserva el stack se oculta en todos
   los tamaños, así que no necesita elevarse para esquivar el CTA del slideover. */
.contact-fab-stack { bottom: 1.5rem; }

/* --- Botones directos de contacto --- */
.fab-item { display: flex; align-items: center; gap: 0.75rem; border-radius: 9999px; }
/* Salto a la izquierda (resumen de reserva abierto en escritorio, ≥1024px).
   Se activa por data-shift-left, NO por clase, para no tocar el `:class` que el
   invariante E8 congela. Override del ancla right-6/items-end del stack y de las
   filas del menú: [círculo][etiqueta] (row-reverse) alinea los círculos (ancho
   fijo) al borde izquierdo, sin escalonarse por el ancho variable de etiquetas. */
.contact-fab-stack[data-shift-left='true'] { right: auto; left: 1.5rem; align-items: flex-start; }
.contact-fab-stack[data-shift-left='true'] ul { align-items: flex-start; }
.contact-fab-stack[data-shift-left='true'] .fab-item { flex-direction: row-reverse; }
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
.fab-chat { background: var(--ui-primary, #cc022b); color: #fff; }
.fab-whatsapp { color: var(--color-whatsapp, #25D366); }
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
/* Insignia roja de mensajes sobre el lanzador. */
.fab-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Ajuste para el círculo de 3rem del botón Chat. */
.fab-badge-option {
  top: -0.3rem;
  right: -0.3rem;
}

/* --- Burbuja de saludo proactiva (teaser) --- */
.teaser-slot {
  position: relative;
  width: min(16rem, calc(100vw - 6rem));
  pointer-events: none;
}
.teaser-bubble {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(4px);
  color: #111827;
  padding: 0.75rem 2rem 0.75rem 0.9rem; /* margen derecho para la X */
  border-radius: 1rem 1rem 0.25rem 1rem; /* esquina hacia el FAB */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transform-origin: bottom right;
  will-change: transform, opacity;
}
.teaser-bubble-entering { animation: teaser-pop 0.2s ease-out; }
.teaser-sizer {
  position: relative;
  visibility: hidden;
  pointer-events: none;
}
.teaser-line { font-size: 0.875rem; font-weight: 500; line-height: 1.35; }
.teaser-line-2 { margin-top: 0.4rem; color: #374151; font-weight: 400; }
.teaser-close {
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  width: 2rem;
  height: 2rem; /* hit area ≥ 2rem */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #6b7280;
  transition: background 0.15s ease, color 0.15s ease;
}
.teaser-close:hover { background: rgba(0, 0, 0, 0.06); color: #111827; }
@keyframes teaser-pop {
  from { opacity: 0; transform: scale(0.9) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@media (prefers-reduced-motion: reduce) { .teaser-bubble-entering { animation: none; } }

/* Solo lector de pantalla (región aria-live). */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Panel inline (desktop) ---
   `--panel-lift` lo escribe el widget midiendo el lanzador; el fallback de
   5.75rem es el lanzador de 56 px + 24 px de la pila + 12 px de aire (SSR y
   primer frame). El alto cede al espacio
   disponible antes que desbordar por arriba: el tope de 52rem solo llega a
   aplicar con ventanas de 940 px o más, así que en portátiles de 13" y 14"
   manda siempre el espacio libre y el alto no cambia. El ancho topa en 34rem
   porque la columna de
   conversación se planta en 413 px (burbujas al 85%, ajustadas a su contenido):
   más ancho solo añade margen vacío. */
.chat-panel {
  position: absolute;
  bottom: var(--panel-lift, 5.75rem);
  right: 1.5rem;
  width: min(34rem, calc(100vw - 2rem));
  height: min(52rem, calc(100dvh - var(--panel-lift, 5.75rem) - 1.5rem));
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Pulso de atención del FAB. Color por marca vía --ui-primary (evita fijar el
   rojo de una marca). Acotado a 2 ciclos (4.8s < 5s de WCAG 2.2.2: contenido
   que parpadea sin pausa) con `forwards` para quedar en reposo; respeta
   reduce-motion. El spread animado de box-shadow no compone, por eso es finito. */
@keyframes pulse-attention {
  0%, 100% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 0 color-mix(in srgb, var(--ui-primary, transparent) 40%, transparent); }
  50% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 14px transparent; }
}
.animate-pulse-attention { animation: pulse-attention 2.4s ease-in-out 2 forwards; }
@media (prefers-reduced-motion: reduce) { .animate-pulse-attention { animation: none; } }
</style>
