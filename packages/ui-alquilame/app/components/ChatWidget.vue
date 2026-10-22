<template>
  <!--
    Barra de contacto — los tres canales siempre a un toque, sin lanzador ni
    menú (decisión del dueño, spec 2026-10-22-barra-contacto-alquilame):
      - Chat IA  → desktop abre el panel inline (overlay, sin navegar, patrón
                   Intercom/Crisp); móvil navega a /chat (pantalla completa).
                   Visible con el switch de chat del dashboard.
      - Llamar   → enlace tel: con el número de useCallPhone. Siempre visible.
      - WhatsApp → enlace wa.me, visible sólo cuando su interruptor maestro y
                   su horario del dashboard lo permiten.
    Los bloques visibles se reparten el ancho en partes iguales.

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

      <!-- Backdrop: atenúa la página con el panel abierto; tocarlo lo cierra. -->
      <button
        v-if="chatEnabled && panelOpen"
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
        <ChatConversation :active="panelOpen" variant="panel" @dismiss="closeAll" />
      </div>

      <!-- Toda la superficie (saludo + barra) se oculta con el resumen de reserva
           abierto: su pie ya trae su propio CTA de WhatsApp. -->
      <template v-if="!hideContactButtons">
        <!-- Dock: el saludo y la barra comparten ancla. En móvil la barra va a lo
             ancho y el saludo sale del borde izquierdo, sobre Chat IA; en
             escritorio el dock es la fila de píldoras y el saludo se apila
             encima, desde el borde de Chat IA. -->
        <!-- Además espera al estado del chat (SCEN-BC-16: se pinta una sola vez,
             ya con su composición final) y se aparta mientras un slideover o
             modal tiene la página inerte (SCEN-BC-14). -->
        <div v-if="surfaceVisible" class="contact-dock">
          <!-- --bar-items: cuántos bloques comparten la barra, para que la cola
               apunte al centro de Chat IA (el primero). -->
          <div v-if="chatEnabled" class="teaser-slot" :style="{ '--bar-items': barItemCount }">
            <!-- Reserva estable para las dos burbujas: aparecen con
                 transform/opacity sin cambiar la geometría del contenedor. -->
            <div class="teaser-stack teaser-sizer" aria-hidden="true">
              <p class="teaser-bubble teaser-bubble-1">{{ TEASER_LINE_1 }}</p>
              <p class="teaser-bubble teaser-bubble-2">{{ teaserLine2 }}</p>
              <svg class="teaser-tail" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 0h18L9 10z" fill="#fff" /></svg>
            </div>
            <div v-if="teaserOpen" class="teaser-stack teaser-live">
              <div
                class="teaser-bubble teaser-bubble-1 teaser-bubble-entering pointer-events-auto"
                @click="openChat('teaser')"
              >
                <button
                  type="button"
                  class="teaser-close"
                  aria-label="Cerrar mensaje"
                  @click.stop="teaser.dismiss()"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                {{ TEASER_LINE_1 }}
              </div>
              <div
                v-if="teaserStep === 2"
                class="teaser-bubble teaser-bubble-2 teaser-bubble-entering pointer-events-auto"
                @click="openChat('teaser')"
              >
                {{ teaserLine2 }}
              </div>
              <svg class="teaser-tail" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 0h18L9 10z" fill="#fff" /></svg>
            </div>
          </div>

        <!-- La barra es lo único que queda bajo el panel: se mide para anclarlo. -->
        <!-- data-analytics-placement: el plugin de analítica atribuye los
             clics de Llamar y WhatsApp a 'fab' (SCEN-BC-15). -->
        <nav
          ref="barEl"
          aria-label="Contacto"
          data-analytics-placement="fab"
          class="contact-bar pointer-events-auto"
        >
          <button
            v-if="chatEnabled"
            ref="chatButtonEl"
            type="button"
            class="bar-item bar-chat"
            :aria-expanded="panelOpen"
            :aria-label="chatAriaLabel"
            @click="toggleChat"
          >
            <span class="bar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
              <!-- No leídos REALES mandan; si no hay, el contador sintético del
                   teaser. El conteo va en el aria-label del botón. -->
              <span v-if="badgeCount > 0" class="bar-badge" aria-hidden="true">{{ badgeCount > 9 ? '9+' : badgeCount }}</span>
            </span>
            <span class="bar-label">Chat IA</span>
          </button>
          <a
            ref="callLinkEl"
            :href="callHref"
            class="bar-item bar-call"
            :aria-label="`Llamar al ${callDisplay}`"
            @click="teaser.engage('llamada')"
          >
            <span class="bar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </span>
            <span class="bar-label">Llamar</span>
          </a>
          <a
            v-if="whatsappVisible"
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="bar-item bar-whatsapp"
            aria-label="Abrir WhatsApp"
            @click="teaser.engage('whatsapp')"
          >
            <span class="bar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" /></svg>
            </span>
            <span class="bar-label">WhatsApp</span>
          </a>
        </nav>
        </div>
      </template>
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

const appConfig = useAppConfig() as ReturnType<typeof useAppConfig> & {
  chatGreeting?: { line2?: string }
}
const { franchise } = appConfig
// Llamar marca con el número que resuelve el composable compartido (el de desvío
// de Google si algún día alquilame lo tiene), nunca con el teléfono crudo de la
// franquicia (SCEN-LINK-08).
const { telHref: callHref, display: callDisplay } = useCallPhone()
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

// Estado client-only: arranca cerrado (lección #109).
const panelOpen = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const chatButtonEl = ref<HTMLButtonElement | null>(null)
const callLinkEl = ref<HTMLAnchorElement | null>(null)
const isDesktop = useMediaQuery('(min-width: 768px)')

// El panel se ancla SOBRE lo único que queda visible debajo de él: la barra de
// contacto (<nav>). No se mide el dock, que incluye el teaser-sizer oculto y su
// hueco.
const barEl = ref<HTMLElement | null>(null)
const barHeight = ref(0)
let barObserver: ResizeObserver | null = null
const panelLiftStyle = computed(() => {
  const lift = chatPanelLiftPx(barHeight.value)
  return lift === null ? undefined : `--panel-lift: ${lift}px`
})
function measureBar() {
  barHeight.value = barEl.value?.getBoundingClientRect().height ?? 0
}
// La barra vive detrás de varios v-if (overlay de reserva, estado del chat,
// modales), así que el observer se re-engancha cuando aparece o desaparece.
// En servidor el ref es null y ResizeObserver nunca se toca.
watch(barEl, (el) => {
  barObserver?.disconnect()
  barObserver = null
  if (!el) return
  measureBar()
  // jsdom no implementa ResizeObserver. La medida sincrónica de `openChat`
  // basta para colocar el panel; sin observador solo se pierde el reajuste
  // posterior, que en un entorno sin layout no tiene nada que observar.
  if (typeof ResizeObserver === 'undefined') return
  barObserver = new ResizeObserver(measureBar)
  barObserver.observe(el)
}, { immediate: true })
onBeforeUnmount(() => barObserver?.disconnect())

// El pie del slideover de reserva ya trae su propio CTA de WhatsApp y la barra
// se le montaría encima, así que la superficie se oculta en TODO viewport
// mientras el overlay está abierto. `isDesktop` solo decide panel o /chat.
const hideContactButtons = computed(() => reservationOverlayOpen.value)

// SCEN-BC-14: los slideovers y modales de Nuxt UI no llevan z-index, así que la
// capa fija (z-60) quedaría encima y robaría los toques de su última fila.
// Mientras una capa modal de reka está abierta pone `body { pointer-events:
// none }` (la página de fuera queda inerte): la superficie se aparta igual.
// Las capas no modales (popover) no lo hacen y no la ocultan.
// Exige además una capa real en el DOM: reka 2.6.0 a veces deja ese `none`
// pegado sin ninguna capa abierta (issues #25/#65), y en esa página muerta la
// barra es la única salida. Nuxt UI porta cada capa directo a <body>, así que
// basta con mirar sus hijos directos (sin subtree) para notar que se fue la
// última.
const modalLayerOpen = ref(false)
let bodyObserver: MutationObserver | null = null
function syncModalLayer() {
  modalLayerOpen.value =
    document.body.style.pointerEvents === 'none'
    && document.querySelector('[data-dismissable-layer]') !== null
}
onMounted(() => {
  if (typeof MutationObserver === 'undefined') return
  syncModalLayer()
  bodyObserver = new MutationObserver(syncModalLayer)
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style'], childList: true })
})
onBeforeUnmount(() => bodyObserver?.disconnect())

// SCEN-BC-16: el estado arranca con el chat apagado y WhatsApp encendido hasta
// que responde el dashboard. Pintar antes mostraría [Llamar|WhatsApp] y luego
// tres bloques. La barra espera esa respuesta; si no llega en 1,5 s sale igual
// (Llamar nunca depende del dashboard).
const STATUS_FALLBACK_MS = 1500
const statusFallbackElapsed = ref(false)
let statusFallbackTimer: ReturnType<typeof setTimeout> | null = null
function clearStatusFallback() {
  if (statusFallbackTimer === null) return
  clearTimeout(statusFallbackTimer)
  statusFallbackTimer = null
}
onMounted(() => {
  if (chatStatusResolved.value) return
  statusFallbackTimer = setTimeout(() => {
    statusFallbackTimer = null
    statusFallbackElapsed.value = true
  }, STATUS_FALLBACK_MS)
})
watch(chatStatusResolved, (resolved) => { if (resolved) clearStatusFallback() })
onBeforeUnmount(clearStatusFallback)
const surfaceVisible = computed(
  () => (chatStatusResolved.value || statusFallbackElapsed.value) && !modalLayerOpen.value,
)

// Singleton compartido con ChatConversation: leemos el contador de no leídos para
// la insignia de Chat IA y la región aria-live. El getter es SSR-safe (instancia
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

// La insignia de Chat IA fusiona no leídos REALES (mandan, solo con el chat
// encendido) con el contador sintético del teaser.
const badgeCount = computed(() => {
  if (chatEnabled.value && unread.value > 0) return unread.value
  return displayedSyntheticCount.value
})
// El conteo va en el nombre accesible; sin conteo manda el texto visible.
const chatAriaLabel = computed(() => {
  const n = badgeCount.value
  if (n <= 0) return undefined
  return `Chat IA, ${n} ${n === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}`
})

// La burbuja de saludo solo cuando NO hay no leídos reales y el panel está
// cerrado.
const teaserOpen = computed(
  () =>
    teaserAllowed.value &&
    teaserVisible.value &&
    unread.value === 0 &&
    !panelOpen.value,
)

// Línea 2 del saludo: override de la marca en app.config (`chatGreeting.line2`),
// igual que ChatConversation; si falta, la compartida.
const teaserLine2 = appConfig.chatGreeting?.line2 ?? TEASER_LINE_2
// Bloques de la barra cuando el saludo existe (Chat IA está encendido): Chat IA,
// Llamar y WhatsApp si su horario lo deja. La cola apunta al centro del primero.
const barItemCount = computed(() => (whatsappVisible.value ? 3 : 2))

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
// Chat IA desaparece con el switch, así que si el foco estaba dentro del panel
// o en el propio Chat IA pasa a Llamar antes de cerrar, en vez de caer a <body>.
watch(chatEnabled, (enabled) => {
  if (enabled) return
  if (typeof document !== 'undefined') {
    const active = document.activeElement
    if (panelEl.value?.contains(active) || chatButtonEl.value === active) {
      callLinkEl.value?.focus({ preventScroll: true })
    }
  }
  panelOpen.value = false
})

// Cuando aparece un no leído REAL, el teaser sintético queda cancelado para toda
// la sesión (no resucita al leerlo). immediate: cubre tanto el no leído que llega
// en vivo como uno restaurado al montar.
watch(unread, (v) => { if (v > 0) teaser.suppressForSession() }, { immediate: true })

// SCEN-322-A02: Escape cierra el panel; foco al panel al abrir.
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

// Escape, backdrop o la «×» del panel: el panel se cierra y el foco vuelve a
// Chat IA, que es quien lo abrió. Sin panel abierto no hay nada que cerrar ni
// foco que mover.
function closeAll() {
  if (!panelOpen.value) return
  panelOpen.value = false
  chatButtonEl.value?.focus({ preventScroll: true })
}
function toggleChat() {
  if (panelOpen.value) panelOpen.value = false
  else openChat('fab')
}
// `source` es quién abrió: la burbuja del teaser o el botón Chat IA. Ahora
// conviven a la vista, así que se pasa explícito en vez de deducirlo de si la
// burbuja estaba abierta (eso inflaría el KPI del teaser). La etiqueta 'fab' se
// conserva para no romper el tablero.
function openChat(source: 'teaser' | 'fab') {
  if (!chatEnabled.value) return
  prepareChatOpen(unread.value > 0 ? 'unread_badge' : source)
  // Cualquier acción de contacto limpia el teaser sintético y marca supresión 15d.
  teaser.engage('chat')
  // Abrir el chat es lo único que limpia la insignia — lo hace la superficie al
  // montar (onSurfaceMounted → markRead). Aquí solo el beacon.
  if (unread.value > 0) emitReopenedFromBadge()
  // Desktop: panel inline sobre la página (no navega). Móvil: /chat full-screen.
  if (isDesktop.value) {
    // Medida sincrónica antes de abrir: el panel nace con el bottom correcto en
    // vez de saltar un frame desde el fallback.
    measureBar()
    panelOpen.value = true
  }
  else navigateTo('/chat')
}
</script>

<style scoped>
a,
button { -webkit-tap-highlight-color: transparent; }

/* --- Barra de contacto (móvil) ---
   Pegada al borde inferior, a lo ancho. Los 64 px de contenido quedan arriba y
   el safe area de iOS se suma debajo, en CSS puro (sin medir con JS, sin CLS). */
.contact-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: calc(64px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.12);
}
/* Bloques iguales sin separación: 1, 2 o 3 se reparten el ancho. Cada uno es
   una columna, icono arriba y texto abajo, centrada en los 64 px de contenido
   (el safe area va como padding debajo). */
.bar-item {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
  height: 100%;
  padding: 0 0.25rem env(safe-area-inset-bottom);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  transition: filter 0.15s ease;
}
.bar-item:hover { filter: brightness(1.08); }
.bar-item:focus-visible { outline: 3px solid #fff; outline-offset: -5px; }
/* Fondos con contraste blanco ≥ 4,5:1 medido (tokens en theme.css). */
.bar-chat { background: var(--color-contact-chat, #6d28d9); }
.bar-call { background: var(--color-contact-call, #1d4ed8); }
.bar-whatsapp { background: var(--color-contact-whatsapp, #14843f); }
.bar-icon { position: relative; display: flex; flex-shrink: 0; }
.bar-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
/* Insignia roja de mensajes sobre el icono de Chat IA (artboard G). */
.bar-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #e50a35;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  border: 2px solid var(--color-contact-chat, #6d28d9);
}

/* Dock: ancla común del saludo y la barra. En móvil ocupa el borde inferior a
   lo ancho (la barra va absoluta dentro, en bottom 0). */
.contact-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}

/* --- Saludo proactivo (teaser), sobre Chat IA ---
   Móvil: desde el borde izquierdo (Chat IA es el primer bloque), 34 px por
   encima de la barra, así nunca tapa Llamar ni WhatsApp. 280 px con 12 px de
   margen a cada lado: cabe a 320 px sin desbordar. */
.teaser-slot {
  position: absolute;
  left: 12px;
  bottom: calc(64px + env(safe-area-inset-bottom) + 34px);
  width: min(280px, calc(100vw - 24px));
}
.teaser-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.teaser-sizer { visibility: hidden; }
.teaser-live {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
}
.teaser-bubble {
  position: relative;
  margin: 0;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.35;
  color: #141414;
  box-shadow: 0 6px 20px rgba(20, 20, 20, 0.16);
  cursor: pointer;
  transform-origin: bottom left;
  will-change: transform, opacity;
}
.teaser-bubble-1 {
  border-radius: 16px 16px 16px 4px;
  padding-right: 36px; /* hueco para la × */
}
.teaser-bubble-2 { border-radius: 4px 16px 16px 16px; }
.teaser-bubble-entering { animation: teaser-pop 0.2s ease-out; }
/* Cola hacia el centro de Chat IA: ancho del bloque / 2, menos el margen
   izquierdo (12) y media cola (9). */
.teaser-tail {
  display: block;
  flex-shrink: 0;
  margin-top: -6px;
  margin-left: calc(100vw / var(--bar-items, 3) / 2 - 21px);
}
.teaser-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: #f4f5f9;
  color: #5b6170;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.teaser-close:hover { background: #e3e6ec; color: #141414; }
@keyframes teaser-pop {
  from { opacity: 0; transform: scale(0.9) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@media (prefers-reduced-motion: reduce) { .teaser-bubble-entering { animation: none; } }

/* --- Escritorio (≥ 768 px): sin barra, tres píldoras en fila abajo a la
   derecha, mismo orden y colores; icono a la izquierda del texto. La fila queda
   en bottom 1.5rem y cada píldora mide 44 px, así que FAB_STACK_BOTTOM_PX = 24
   de chatPanelLift sigue siendo cierto y el fallback del panel es 5rem. El dock
   mide lo mismo que la fila y el saludo se apila 10 px encima. --- */
@media (min-width: 768px) {
  .contact-dock {
    left: auto;
    right: 1.5rem;
    bottom: 1.5rem;
  }
  .contact-bar {
    position: relative;
    height: auto;
    gap: 0.75rem;
    box-shadow: none;
  }
  .bar-item {
    flex: 0 0 auto;
    flex-direction: row;
    height: 44px;
    padding: 0 1.25rem;
    gap: 0.5rem;
    border-radius: 9999px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.12);
    font-size: 0.9375rem;
  }
  .bar-item:focus-visible { outline: 3px solid #111827; outline-offset: 2px; }
  /* La insignia va a la esquina de la píldora Chat IA, no al icono. */
  .bar-chat { position: relative; }
  .bar-icon { position: static; }
  .bar-badge {
    left: -6px;
    right: auto;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    border-color: #fff;
  }
  /* Desde el borde de Chat IA; si la fila mide menos de 280 px se corre a la
     izquierda para no salirse por la derecha. */
  .teaser-slot {
    left: min(0px, calc(100% - 280px));
    bottom: calc(100% + 10px);
  }
  .teaser-tail { margin-left: 40px; }
}

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
   `--panel-lift` lo escribe el widget midiendo la fila de píldoras; el fallback
   de 5rem (píldora 44 + 24 + 12 px) cubre SSR y el primer frame. El alto cede al espacio
   disponible antes que desbordar por arriba: el tope de 52rem solo llega a
   aplicar con ventanas de 940 px o más, así que en portátiles de 13" y 14"
   manda siempre el espacio libre y el alto no cambia. El ancho topa en 34rem
   porque la columna de
   conversación se planta en 413 px (burbujas al 85%, ajustadas a su contenido):
   más ancho solo añade margen vacío. */
.chat-panel {
  position: absolute;
  bottom: var(--panel-lift, 5rem);
  right: 1.5rem;
  width: min(34rem, calc(100vw - 2rem));
  height: min(52rem, calc(100dvh - var(--panel-lift, 5rem) - 1.5rem));
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
</style>
