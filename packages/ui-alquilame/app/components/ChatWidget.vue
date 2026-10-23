<template>
  <!--
    Contacto — los tres canales (spec 2026-10-22-contactanos-movil-alquilame,
    que reemplaza en móvil a la barra de 2026-10-22-barra-contacto-alquilame):
      - Chat IA  → desktop abre el panel inline (overlay, sin navegar, patrón
                   Intercom/Crisp); móvil navega a /chat (pantalla completa).
                   Visible con el switch de chat del dashboard.
      - Llamar   → enlace tel: con el número de useCallPhone. Siempre visible.
      - WhatsApp → enlace wa.me, visible sólo cuando su interruptor maestro y
                   su horario del dashboard lo permiten.
    Móvil (< 768 px): una píldora verde «Contáctanos» abajo a la derecha; al
    tocarla despliega encima los canales como píldoras blancas y pasa a
    «Cerrar». Se pliega con «Cerrar», Escape, un toque fuera o al elegir canal.
    El saludo es UNA burbuja corta sobre el botón.
    Escritorio: sin botón; los canales son tres píldoras de color en fila y el
    saludo son dos burbujas. El cambio de composición es CSS (la lista de
    canales existe siempre); solo el saludo decide en JS cuántas burbujas pinta.

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
      <span class="sr-only" role="status" aria-live="polite">{{ teaserAllowed ? teaserLiveText : '' }}</span>

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
        <!-- Dock: saludo, canales y botón comparten ancla. En móvil el dock es
             el botón «Contáctanos» abajo a la derecha y el saludo y el menú se
             apilan encima; en escritorio el dock es la fila de píldoras y el
             saludo se apila encima, desde el borde de Chat IA. -->
        <!-- Además espera al estado del chat (SCEN-BC-16: se pinta una sola vez,
             ya con su composición final) y se aparta mientras un slideover o
             modal tiene la página inerte (SCEN-BC-14). -->
        <div
          v-if="surfaceVisible"
          ref="dockEl"
          class="contact-dock"
          :class="{ 'contact-dock--open': contactMenuOpen }"
        >
          <div v-if="chatEnabled" class="teaser-slot">
            <!-- Reserva estable para las burbujas: aparecen con
                 transform/opacity sin cambiar la geometría del contenedor. -->
            <div v-if="compactGreeting" class="teaser-stack teaser-sizer" aria-hidden="true">
              <p class="teaser-bubble teaser-bubble-1 teaser-bubble-solo">{{ mobileLine }}</p>
              <svg class="teaser-tail" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 0h18L9 10z" fill="#fff" /></svg>
            </div>
            <div v-else class="teaser-stack teaser-sizer" aria-hidden="true">
              <p class="teaser-bubble teaser-bubble-1">{{ TEASER_LINE_1 }}</p>
              <p class="teaser-bubble teaser-bubble-2">{{ teaserLine2 }}</p>
              <svg class="teaser-tail" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 0h18L9 10z" fill="#fff" /></svg>
            </div>
            <div v-if="teaserOpen" class="teaser-stack teaser-live">
              <div
                class="teaser-bubble teaser-bubble-1 teaser-bubble-entering pointer-events-auto"
                :class="{ 'teaser-bubble-solo': compactGreeting }"
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
                {{ compactGreeting ? mobileLine : TEASER_LINE_1 }}
              </div>
              <!-- La segunda burbuja es solo de escritorio: en el celular el
                   saludo es una sola línea corta. -->
              <div
                v-if="!compactGreeting && teaserStep === 2"
                class="teaser-bubble teaser-bubble-2 teaser-bubble-entering pointer-events-auto"
                @click="openChat('teaser')"
              >
                {{ teaserLine2 }}
              </div>
              <svg class="teaser-tail" width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 0h18L9 10z" fill="#fff" /></svg>
            </div>
          </div>

        <!-- Botón «Contáctanos» (solo móvil; en escritorio el CSS lo quita). Va
             antes de la lista de canales en el DOM para que Tab y VoiceOver recorran botón →
             Chat IA → Llamar → WhatsApp; el menú es absoluto, así que el orden no
             cambia la geometría. -->
        <button
          ref="toggleEl"
          type="button"
          class="contact-toggle pointer-events-auto"
          aria-controls="contact-menu"
          :aria-expanded="contactMenuOpen"
          :aria-label="toggleAriaLabel"
          @click="toggleContactMenu"
        >
          <svg v-if="contactMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
          <!-- Las dos etiquetas comparten celda: el botón mide siempre lo de
               «Contáctanos» y ni su borde izquierdo ni la insignia saltan al
               abrir. La inactiva se oculta a la vista y al lector. -->
          <span class="toggle-label">
            <span :class="{ 'toggle-label-off': contactMenuOpen }" :aria-hidden="contactMenuOpen ? 'true' : undefined">Contáctanos</span>
            <span :class="{ 'toggle-label-off': !contactMenuOpen }" :aria-hidden="contactMenuOpen ? undefined : 'true'">Cerrar</span>
          </span>
          <!-- Con el menú abierto el conteo ya va en Chat IA. -->
          <span v-if="badgeCount > 0 && !contactMenuOpen" class="toggle-badge" aria-hidden="true">{{ badgeCount > 9 ? '9+' : badgeCount }}</span>
        </button>

        <!-- En escritorio la fila es lo único que queda bajo el panel: se mide
             para anclarlo. En móvil es el menú que despliega «Contáctanos». -->
        <!-- data-analytics-placement: el plugin de analítica atribuye los
             clics de Llamar y WhatsApp a 'fab' (SCEN-BC-15, SCEN-CM-12). -->
        <nav
          ref="barEl"
          id="contact-menu"
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
            @click="teaser.engage('llamada'); closeContactMenu(true)"
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
            @click="teaser.engage('whatsapp'); closeContactMenu(true)"
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
  chatGreeting?: { line2?: string, mobileLine?: string }
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

// Menú del botón «Contáctanos» (solo móvil). Arranca cerrado, como el panel.
// El <nav> vive siempre en el DOM: el CSS lo esconde en móvil mientras el menú
// está cerrado, así la primera pintura ya es la del botón y no salta.
const contactMenuOpen = ref(false)
const toggleEl = ref<HTMLButtonElement | null>(null)
const dockEl = ref<HTMLElement | null>(null)

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
// En móvil la insignia va en «Contáctanos» cerrado; abierto dice «Cerrar» y el
// conteo queda en Chat IA, dentro del menú.
const toggleAriaLabel = computed(() => {
  const n = badgeCount.value
  if (n <= 0 || contactMenuOpen.value) return undefined
  return `Contáctanos, ${n} ${n === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}`
})

// La burbuja de saludo solo cuando NO hay no leídos reales y el panel y el menú
// «Contáctanos» están cerrados (con el menú abierto solo se esconde: el saludo
// sigue vivo hasta que el cliente elija canal o pliegue el menú).
const teaserOpen = computed(
  () =>
    teaserAllowed.value &&
    teaserVisible.value &&
    unread.value === 0 &&
    !panelOpen.value &&
    !contactMenuOpen.value,
)

// Línea 2 del saludo: override de la marca en app.config (`chatGreeting.line2`),
// igual que ChatConversation; si falta, la compartida.
const teaserLine2 = appConfig.chatGreeting?.line2 ?? TEASER_LINE_2
// En el celular el saludo es UNA burbuja corta (`chatGreeting.mobileLine`) en vez
// de las dos líneas: dos burbujas sobre un botón pequeño tapaban la pantalla. Es
// lo único que se decide en JS por viewport, porque cambia el texto anunciado y
// no solo la geometría. El widget es client-only, así que el media query ya
// tiene su valor real en la primera pintura.
const compactGreeting = computed(() => !isDesktop.value)
const mobileLine = appConfig.chatGreeting?.mobileLine ?? TEASER_LINE_1
// El lector de pantalla oye lo mismo que se ve: en móvil la línea corta, que no
// cambia en el paso 2, así que no se vuelve a anunciar.
const teaserLiveText = computed(() => {
  if (!compactGreeting.value) return teaserAnnounce.value
  return teaserAnnounce.value ? mobileLine : ''
})

// En el celular el saludo es una burbuja: el teaser se queda en el paso 1 para no
// anunciar ni contar (insignia «2») una segunda que nadie ve. El tope se fija al
// arrancar; si luego el viewport cruza los 768 px no se reanuda ni se corta el
// paso 2 (girar la tablet a mitad del saludo no justifica la complejidad).
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
        maxStep: compactGreeting.value ? 1 : 2,
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
  closeContactMenu()
  if (panelOpen.value) panelOpen.value = false
  else openChat('fab')
}

// --- Menú «Contáctanos» (móvil) ---
// Abrirlo solo esconde el saludo. Lo que pasa después decide su destino: elegir
// canal es un engage (GA4 contact_teaser_engaged + 15 días, vía los handlers de
// cada canal) y plegar el menú sin elegir es un dismiss, igual que la «×».
function toggleContactMenu() {
  if (contactMenuOpen.value) dismissContactMenu(true)
  else contactMenuOpen.value = true
}
// Cierre sin efecto sobre el saludo: elegir canal (el engage ya lo resolvió),
// el paso a escritorio o la superficie que se aparta. Llamar y WhatsApp
// devuelven el foco al botón: el canal enfocado se esconde con el menú y el foco
// caería a <body>.
function closeContactMenu(returnFocus = false) {
  if (!contactMenuOpen.value) return
  contactMenuOpen.value = false
  if (returnFocus) toggleEl.value?.focus({ preventScroll: true })
}
// «Cerrar», Escape o toque fuera: el cliente pliega el menú sin elegir canal.
function dismissContactMenu(returnFocus = false) {
  if (!contactMenuOpen.value) return
  closeContactMenu(returnFocus)
  teaser.dismiss()
}
// Escape que ya atendió otro (un popover, un campo) no es nuestro. El foco solo
// vuelve al botón si estaba en el dock o suelto en <body>; si el cliente está
// en otra parte de la página se queda ahí.
function onMenuKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented) return
  const active = document.activeElement
  const focusInDock = !active || active === document.body || (dockEl.value?.contains(active) ?? false)
  dismissContactMenu(focusInDock)
}
// pointerdown y no click: cierra antes de que el toque fuera haga lo suyo, y
// sin fondo que lo capture la página de detrás sigue respondiendo. El toque
// fuera no mueve el foco: el cliente ya está en otra parte de la página.
function onMenuPointerDown(e: Event) {
  const target = e.target as Node | null
  if (target && dockEl.value?.contains(target)) return
  dismissContactMenu()
}
// Los escuchas solo existen con el menú abierto.
function setMenuListeners(on: boolean) {
  if (typeof document === 'undefined') return
  if (on) {
    document.addEventListener('keydown', onMenuKeydown)
    document.addEventListener('pointerdown', onMenuPointerDown)
  } else {
    document.removeEventListener('keydown', onMenuKeydown)
    document.removeEventListener('pointerdown', onMenuPointerDown)
  }
}
watch(contactMenuOpen, open => setMenuListeners(open))
// En escritorio no hay botón que lo pliegue: se cierra sin mover el foco.
watch(isDesktop, (desktop) => { if (desktop) closeContactMenu() })
onBeforeUnmount(() => setMenuListeners(false))
// Si la superficie se aparta (resumen de reserva, modal) con el menú abierto,
// vuelve plegada: el botón reaparece cerrado.
watch(
  () => !hideContactButtons.value && surfaceVisible.value,
  (shown) => { if (!shown) contactMenuOpen.value = false },
)
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

/* --- Botón «Contáctanos» (móvil) ---
   Píldora verde de 50 px abajo a la derecha, a 16 px de los bordes; el safe
   area de iOS se suma al margen inferior en CSS puro (sin medir, sin CLS). El
   dock mide lo que mide el botón: menú y saludo cuelgan encima de él. */
.contact-dock {
  position: absolute;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom));
}
.contact-toggle {
  position: relative;
  box-sizing: border-box;
  height: 50px;
  padding: 0 18px 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 9999px;
  background: var(--color-contact-whatsapp, #14843f);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.12);
}
.contact-toggle:focus-visible { outline: 3px solid #111827; outline-offset: 2px; }
/* Las dos etiquetas en la misma celda: el ancho es siempre el de «Contáctanos». */
.toggle-label { display: grid; }
.toggle-label > span { grid-area: 1 / 1; text-align: center; }
.toggle-label-off { visibility: hidden; }
/* Insignia roja de no leídos / contador del saludo, en la esquina del botón. */
.toggle-badge {
  position: absolute;
  top: -6px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #e50a35;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  border: 2px solid #fff;
}

/* --- Menú (móvil): los canales como píldoras blancas apiladas encima del
   botón, alineadas a la derecha, 10 px entre ellas. Plegado no ocupa nada. --- */
/* El menú no captura toques: entre píldoras o a su lado caen a la página y
   cuentan como toque fuera. Solo las píldoras responden. */
.contact-bar {
  position: absolute;
  right: 0;
  bottom: calc(100% + 10px);
  display: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
}
.contact-dock--open .contact-bar { display: flex; }
/* El color de cada canal va en una variable: en móvil pinta el círculo del
   icono, en escritorio la píldora entera (tokens en theme.css, contraste
   blanco ≥ 4,5:1 medido). */
.bar-chat { --channel-color: var(--color-contact-chat, #6d28d9); }
.bar-call { --channel-color: var(--color-contact-call, #1d4ed8); }
.bar-whatsapp { --channel-color: var(--color-contact-whatsapp, #14843f); }
.bar-item {
  box-sizing: border-box;
  height: 44px;
  padding: 0 16px 0 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  transition: filter 0.15s ease;
}
.bar-item:hover { filter: brightness(1.08); }
.bar-item:focus-visible { outline: 3px solid #111827; outline-offset: 2px; }
/* Círculo de 30 px con el icono blanco sobre el color del canal. */
.bar-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  background: var(--channel-color);
  color: #fff;
}
.bar-icon svg { width: 18px; height: 18px; }
.bar-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
/* Insignia roja de mensajes en la esquina del círculo de Chat IA. */
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
  border: 2px solid #fff;
}

/* --- Saludo proactivo (teaser) ---
   Móvil: UNA burbuja alineada a la derecha, 12 px encima del botón, con la
   cola hacia él. 280 px con 16 px de margen a cada lado: cabe a 320 px sin
   desbordar. */
.teaser-slot {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  width: min(280px, calc(100vw - 32px));
}
.teaser-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
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
/* La burbuja única del móvil apunta a la derecha, al botón. */
.teaser-bubble-solo {
  border-radius: 16px 16px 4px 16px;
  transform-origin: bottom right;
}
.teaser-bubble-entering { animation: teaser-pop 0.2s ease-out; }
/* Cola hacia el botón «Contáctanos», cerca de su icono derecho. */
.teaser-tail {
  display: block;
  flex-shrink: 0;
  margin-top: -6px;
  margin-right: 28px;
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

/* --- Escritorio (≥ 768 px): sin botón «Contáctanos»; los canales son tres
   píldoras de color en fila abajo a la derecha, mismo orden; icono a la
   izquierda del texto. La fila queda en bottom 1.5rem y cada píldora mide
   44 px, así que FAB_STACK_BOTTOM_PX = 24 de chatPanelLift sigue siendo cierto
   y el fallback del panel es 5rem. El dock mide lo mismo que la fila y el
   saludo se apila 10 px encima. --- */
@media (min-width: 768px) {
  .contact-dock {
    left: auto;
    right: 1.5rem;
    bottom: 1.5rem;
  }
  .contact-toggle { display: none; }
  .contact-bar {
    position: relative;
    right: auto;
    bottom: auto;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: auto;
    gap: 0.75rem;
    box-shadow: none;
    pointer-events: auto;
  }
  .bar-item {
    flex: 0 0 auto;
    flex-direction: row;
    height: 44px;
    padding: 0 1.25rem;
    gap: 0.5rem;
    border: 0;
    border-radius: 9999px;
    background: var(--channel-color);
    color: #fff;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.12);
    font-size: 0.9375rem;
  }
  .bar-item:focus-visible { outline: 3px solid #111827; outline-offset: 2px; }
  /* La insignia va a la esquina de la píldora Chat IA, no al icono. */
  .bar-chat { position: relative; }
  .bar-icon {
    position: static;
    width: auto;
    height: auto;
    border-radius: 0;
    background: none;
  }
  .bar-icon svg { width: 22px; height: 22px; }
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
    right: auto;
    bottom: calc(100% + 10px);
  }
  .teaser-stack { align-items: flex-start; }
  .teaser-tail { margin-left: 40px; margin-right: 0; }
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
