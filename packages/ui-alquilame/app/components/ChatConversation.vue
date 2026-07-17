<template>
  <!--
    Cuerpo del chat IA compartido por las 3 marcas (triplicado en cada app —
    NO mover a logic/app, rompe el srcDir de la capa). Se usa en dos envoltorios:
      - Desktop: dentro del panel flotante de ChatWidget (variant="panel").
      - Móvil:   en la página /chat a pantalla completa (variant="page").

    Cabecera: avatar humano (asistente) con punto verde "online" (arriba a la
    derecha) + estado "Disponible 24/7" — el chat IA siempre está disponible.
    Botón cerrar a la derecha (cierra el panel en desktop, vuelve en móvil).

    Rellena su contenedor (height:100%). iOS: la zona de scroll usa `min-height:0`
    para que el hijo flex pueda encoger (evita el colapso de la lección #109).
    SVGs inline → autocontenido.
  -->
  <section class="cc-root" :class="`cc-${variant}`">
    <header class="cc-header">
      <span class="cc-avatar">
        <img class="cc-avatar-img" src="/images/asesora-avatar.webp" alt="Asesora" width="40" height="40" decoding="async" />
        <span class="cc-avatar-dot" />
      </span>

      <div class="cc-titlewrap">
        <p class="cc-title">¿En qué te ayudamos?</p>
        <p class="cc-status">En línea · Disponible 24/7</p>
      </div>

      <button type="button" class="cc-dismiss" aria-label="Cerrar chat" @click="emit('dismiss')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>

    <div ref="scrollEl" class="cc-messages">
      <p v-if="!messages.length" class="cc-empty">
        ¡Hola! 👋 Pregúntame por ciudades, precios, requisitos o tu reserva.
      </p>
      <template v-for="(m, msgIdx) in messages" :key="m.id">
        <!-- Separador "Mensajes nuevos": antes del primer mensaje no leído -->
        <div v-if="newSeparatorBeforeId && m.id === newSeparatorBeforeId" class="cc-new-sep">
          <span>Mensajes nuevos</span>
        </div>

        <!-- Usuario: siempre una sola burbuja -->
        <div v-if="m.role === 'user'" class="cc-msg is-user" :data-mid="m.id" :class="{ 'has-time': !!m.createdAt, 'is-group-start': isGroupStart(msgIdx) }">
          <span
            v-if="m.replyTo"
            class="cc-reply-quote"
            role="button"
            tabindex="0"
            @click="scrollToQuoted(m.replyTo)"
            @keydown.enter="scrollToQuoted(m.replyTo)"
          >
            <span class="cc-reply-author">{{ m.replyTo.author || 'Referencia' }}</span>
            <span class="cc-reply-preview">{{ m.replyTo.preview || m.replyTo.label }}</span>
          </span>
          {{ m.text }}
          <span v-if="m.createdAt" class="cc-time">{{ fmtTime(m.createdAt) }}</span>
        </div>

        <!-- Asistente "escribiendo": texto estático mientras llega la respuesta -->
        <div v-else-if="!m.text && isStreaming" class="cc-msg is-assistant" :class="{ 'is-group-start': isGroupStart(msgIdx) }">
          <span class="cc-typing-text" aria-live="polite">escribiendo…</span>
        </div>

        <!-- Asistente: una burbuja por tema (separador ---) -->
        <template v-else>
          <div
            v-for="(chunk, i) in bubblesFor(m)"
            :key="`${m.id}-${i}`"
            class="cc-msg is-assistant"
            :data-mid="i === 0 ? m.id : undefined"
            :class="{
              'has-time': !!m.createdAt,
              'has-parts': i === bubblesFor(m).length - 1 && !!(m.quoteTable || m.gamaCards || m.actions),
              'is-group-start': i === 0 && isGroupStart(msgIdx),
            }"
            @touchstart.passive="onSwipeStart"
            @touchmove.passive="onSwipeMove"
            @touchend="onSwipeEnd($event, () => replyToBubble(m, chunk))"
          >
            <span class="cc-swipe-hint" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11" /></svg>
            </span>
            <button type="button" class="cc-bubble-reply-btn" aria-label="Responder a este mensaje" @click="replyToBubble(m, chunk)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11" /></svg>
            </button>
            <span v-if="chunk" class="cc-text" v-html="renderChatMarkdown(chunk)" />

            <!-- Partes "code-owned": solo en la última burbuja del mensaje -->
            <template v-if="i === bubblesFor(m).length - 1">
              <!-- Tabla de cotización: una fila por gama, precio formateado es-CO -->
              <div v-if="m.quoteTable" class="cc-quote">
                <span class="cc-quote-title">{{ m.quoteTable.dias }} día(s)<template v-if="m.quoteTable.horaRecogida"> · recoge {{ m.quoteTable.horaRecogida }}, entrega {{ m.quoteTable.horaDevolucion }}</template></span>
                <div
                  v-for="f in m.quoteTable.filas"
                  :key="f.categoria"
                  class="cc-quote-row cc-replyable"
                  role="button"
                  tabindex="0"
                  :aria-label="`Responder sobre la Gama ${f.categoria}`"
                  @click="replyToGama(f, m.id)"
                  @keydown.enter="replyToGama(f, m.id)"
                  @touchstart.stop.passive="onSwipeStart"
                  @touchmove.stop.passive="onSwipeMove"
                  @touchend.stop="onSwipeEnd($event, () => replyToGama(f, m.id))"
                >
                  <span class="cc-quote-gama">{{ f.descripcion }} <span class="cc-quote-desc">(Gama {{ f.categoria }})</span></span>
                  <strong class="cc-quote-price">${{ cop(f.precioTotal) }}</strong>
                </div>
                <span class="cc-quote-note">
                  Total con IVA, tasas, seguro básico y km ilimitado.
                </span>
              </div>

              <!-- Tarjetas de modelos: foto + nombre, placeholder si no hay foto -->
              <div v-if="m.gamaCards" class="cc-cards">
                <span class="cc-cards-title">
                  Modelos de la Gama {{ m.gamaCards.gama }}<template v-if="m.gamaCards.descripcion"> · {{ m.gamaCards.descripcion }}</template>
                </span>
                <div class="cc-cards-grid">
                  <div
                    v-for="(mod, mi) in m.gamaCards.modelos"
                    :key="mi"
                    class="cc-card cc-replyable"
                    role="button"
                    tabindex="0"
                    :aria-label="`Responder sobre el modelo ${mod.nombre}`"
                    @click="replyToModelo(mod, m.gamaCards, m.id)"
                    @keydown.enter="replyToModelo(mod, m.gamaCards, m.id)"
                    @touchstart.stop.passive="onSwipeStart"
                    @touchmove.stop.passive="onSwipeMove"
                    @touchend.stop="onSwipeEnd($event, () => replyToModelo(mod, m.gamaCards, m.id))"
                  >
                    <img
                      v-if="mod.imagen"
                      :src="mod.imagen"
                      :alt="mod.nombre"
                      loading="lazy"
                      decoding="async"
                      class="cc-card-img"
                    >
                    <span v-else class="cc-card-noimg">(sin foto)</span>
                    <span class="cc-card-name">{{ mod.nombre }}</span>
                  </div>
                </div>
              </div>

              <span v-if="m.actions" class="cc-actions">
                <a v-if="m.actions.web" :href="m.actions.web" target="_blank" rel="noopener noreferrer" class="cc-link-btn">Terminar mi reserva en la web</a>
                <a v-if="m.actions.whatsapp" :href="m.actions.whatsapp" target="_blank" rel="noopener noreferrer" class="cc-link-btn cc-link-btn-wa">Escribir a un asesor</a>
                <a v-if="m.actions.share" :href="m.actions.share" target="_blank" rel="noopener noreferrer" class="cc-link-btn cc-link-btn-share">Compartir cotización</a>
              </span>
            </template>

            <span v-if="m.createdAt" class="cc-time">{{ fmtTime(m.createdAt) }}</span>
          </div>
        </template>
      </template>
      <div v-if="error" class="cc-error" role="alert">
        <p>{{ error.message }}</p>
        <a
          v-if="errorAction?.whatsapp"
          :href="errorAction.whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          class="cc-link-btn cc-link-btn-wa"
        >Escríbenos por WhatsApp</a>
      </div>

      <!-- Turno colgado: la respuesta se perdió (cierre en caliente). Reintentar
           reenvía el último mensaje del cliente sin duplicar su burbuja. Se
           suprime mientras el banner de error está activo (una sola afordancia). -->
      <div v-if="danglingUserTurn && !error" class="cc-retry" role="status">
        <span class="cc-retry-text">No se completó la respuesta</span>
        <button type="button" class="cc-retry-btn" @click="retryDangling">Reintentar</button>
      </div>
    </div>

    <div v-if="replyTo" class="cc-reply-bar">
      <div class="cc-reply-card">
        <button type="button" class="cc-reply-card-body" @click="scrollToQuoted(replyTo)">
          <span class="cc-reply-author">{{ replyTo.author || 'Referencia' }}</span>
          <span class="cc-reply-preview">{{ replyTo.preview || replyTo.label }}</span>
        </button>
        <img v-if="replyTo.image" class="cc-reply-thumb" :src="replyTo.image" alt="">
        <button type="button" class="cc-reply-bar-x" aria-label="Quitar referencia" @click="replyTo = null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    <form class="cc-input" @submit.prevent="submit">
      <input
        ref="inputEl"
        v-model="input"
        type="text"
        autocomplete="off"
        enterkeyhint="send"
        placeholder="Escribe tu mensaje…"
        aria-label="Escribe tu mensaje"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
      >
      <!-- SCEN-322-X04: while a reply streams the send slot becomes a visible
           "detener" control that aborts the in-flight turn on demand (stop()
           keeps whatever already streamed; no error banner). -->
      <button
        v-if="isStreaming"
        type="button"
        class="cc-send cc-send-active"
        aria-label="Detener respuesta"
        data-testid="chat-stop-test"
        @click="stop"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      </button>
      <button
        v-else
        type="submit"
        class="cc-send"
        :class="{ 'cc-send-active': inputFocused || input.trim() }"
        :disabled="!input.trim()"
        aria-label="Enviar mensaje"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { renderChatMarkdown, splitBubbles } from '@rentacar-main/logic/utils'

// Hora por mensaje (estilo WhatsApp), hora de Colombia, 12h.
const timeFmt = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Bogota',
})
function fmtTime(ms?: number): string {
  return ms ? timeFmt.format(new Date(ms)) : ''
}
// Precios COP enteros (ya redondeados por el server) → puntos de miles es-CO.
const copFmt = new Intl.NumberFormat('es-CO')
function cop(n: number): string {
  return copFmt.format(n)
}
// Una burbuja por tema (separador --- del bot). Si no hay texto pero sí partes
// "code-owned" (botones / tabla / tarjetas), deja una burbuja vacía para mostrarlas.
function bubblesFor(m: { text: string; actions?: unknown; quoteTable?: unknown; gamaCards?: unknown }): string[] {
  const chunks = splitBubbles(m.text)
  if (chunks.length) return chunks
  return m.actions || m.quoteTable || m.gamaCards ? [''] : []
}

withDefaults(defineProps<{ variant?: 'panel' | 'page' }>(), { variant: 'panel' })
const emit = defineEmits<{ dismiss: [] }>()

const {
  messages,
  input,
  replyTo,
  isStreaming,
  error,
  errorAction,
  submit,
  stop,
  firstUnreadAssistantId,
  danglingUserTurn,
  onSurfaceMounted,
  onSurfaceUnmounted,
  retryDangling,
} = useChatConversation()

// Primera burbuja de una racha del mismo remitente → lleva el "piquito" (WhatsApp).
// Salta placeholders del asistente que no renderizan burbuja (turnos fallidos que
// quedan vacíos para "Reintentar"): no deben partir una racha visible.
function isGroupStart(idx: number): boolean {
  const role = messages.value[idx]?.role
  for (let p = idx - 1; p >= 0; p--) {
    const m = messages.value[p]
    if (m && m.role === 'assistant' && !m.text && !m.quoteTable && !m.gamaCards && !m.actions) continue
    return m?.role !== role
  }
  return true
}

const inputFocused = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
// Boundary for the "Mensajes nuevos" separator, snapshotted on mount BEFORE
// onSurfaceMounted() advances the read-marker (which would zero it out).
const newSeparatorBeforeId = ref<string | null>(null)

// --- "Responder a" estilo WhatsApp: tocar/clic o deslizar a la derecha una gama,
// un modelo o cualquier burbuja del bot la cita arriba del área de escritura; el
// bot recibe solo `context` (los demás campos son de UI, ver useChatConversation). ---
function replyToGama(f: { categoria: string; descripcion: string; precioTotal: number }, targetId?: string) {
  replyTo.value = {
    label: `Gama ${f.categoria} · ${f.descripcion}`,
    context: `[El cliente responde sobre la Gama ${f.categoria} (${f.descripcion}), total cotizado $${f.precioTotal}.]`,
    author: 'Asesora',
    preview: `Gama ${f.categoria} · ${f.descripcion}`,
    targetId,
  }
}
function replyToModelo(mod: { nombre: string; imagen?: string }, cards: { gama: string; descripcion?: string }, targetId?: string) {
  replyTo.value = {
    label: `${mod.nombre} · Gama ${cards.gama}`,
    context: `[El cliente responde sobre el modelo ${mod.nombre} de la Gama ${cards.gama}.]`,
    author: 'Asesora',
    preview: `${mod.nombre} · Gama ${cards.gama}`,
    image: mod.imagen || undefined,
    targetId,
  }
}
// Cita de una burbuja de texto libre: preview sin tokens de markdown, recortada.
function stripMd(s: string): string {
  return s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim()
}
function replyToBubble(m: { id: string }, chunk: string) {
  const preview = (stripMd(chunk) || 'Cotización').slice(0, 80)
  replyTo.value = {
    label: preview,
    context: `[El cliente responde a este mensaje de la asesora: "${preview}"]`,
    author: 'Asesora',
    preview,
    targetId: m.id,
  }
}
// Tocar una cita salta al mensaje original y lo destella (no-op si el mensaje ya
// no existe o el transcript es viejo y no trae targetId).
function scrollToQuoted(r: { targetId?: string } | null) {
  const target = r?.targetId
  if (!target || !scrollEl.value) return
  const el = scrollEl.value.querySelector(`[data-mid="${CSS.escape(target)}"]`) as HTMLElement | null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('cc-flash')
  void el.offsetWidth
  el.classList.add('cc-flash')
  window.setTimeout(() => el.classList.remove('cc-flash'), 1300)
}

// Swipe-to-reply: sigue el dedo a la derecha y dispara al soltar pasado el umbral.
// Se cancela si el gesto es vertical (deja pasar el scroll de la lista).
let swipeX = 0
let swipeY = 0
let swiping = false
const SWIPE_TRIGGER = 48
function onSwipeStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  swipeX = t.clientX
  swipeY = t.clientY
  swiping = true
}
function onSwipeMove(e: TouchEvent) {
  if (!swiping) return
  const t = e.touches[0]
  if (!t) return
  const dx = t.clientX - swipeX
  const dy = t.clientY - swipeY
  if (Math.abs(dy) > Math.abs(dx)) {
    swiping = false
    return
  }
  const el = e.currentTarget as HTMLElement
  const px = Math.max(0, Math.min(dx, 72))
  el.style.transform = `translateX(${px}px)`
  // Alimenta el hint ↩ (opacidad/escala proporcionales al arrastre, tope en el umbral).
  el.style.setProperty('--cc-sdx', String(Math.min(px / SWIPE_TRIGGER, 1)))
}
function onSwipeEnd(e: TouchEvent, fire: () => void) {
  const el = e.currentTarget as HTMLElement
  const endX = e.changedTouches[0]?.clientX ?? swipeX
  el.style.transform = ''
  el.style.removeProperty('--cc-sdx')
  if (swiping && endX - swipeX >= SWIPE_TRIGGER) fire()
  swiping = false
}
const scrollEl = ref<HTMLElement | null>(null)
watch(
  () => [messages.value.length, messages.value.at(-1)?.text],
  () => nextTick(() => {
    const el = scrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  }),
)

// Reopen UX: the singleton keeps the transcript, so a reopened surface lands on
// old messages (the scroll watch above is not immediate). On mount, position at
// the "Mensajes nuevos" separator when there are unread replies, else at the
// bottom. Focus stays on the composer — never moved into the message list.
onMounted(() => {
  newSeparatorBeforeId.value = firstUnreadAssistantId.value
  onSurfaceMounted()
  nextTick(() => {
    const el = scrollEl.value
    if (el) {
      const sep = el.querySelector('.cc-new-sep') as HTMLElement | null
      if (sep) sep.scrollIntoView({ block: 'start' })
      else el.scrollTop = el.scrollHeight
    }
    inputEl.value?.focus()
  })
})
// NEVER abort the stream on unmount — the singleton keeps streaming into the
// same messages ref so a reopen sees the reply continue.
onUnmounted(() => onSurfaceUnmounted())
</script>

<style scoped>
a,
button { -webkit-tap-highlight-color: transparent; }

.cc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
  overflow: hidden;
}

/* --- Header --- */
.cc-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.cc-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  background: color-mix(in oklab, var(--ui-primary, #cc022b) 14%, white);
  color: var(--ui-primary, #cc022b);
}
.cc-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 9999px; }
.cc-avatar-dot {
  position: absolute;
  right: -1px;
  top: -1px;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 9999px;
  background: #22c55e;
  border: 2px solid #fff;
  animation: cc-chip-glow 1.6s ease-in-out infinite;
}
@keyframes cc-chip-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  50% { box-shadow: 0 0 7px 2px rgba(34, 197, 94, 0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .cc-avatar-dot { animation: none; box-shadow: 0 0 5px 1px rgba(34, 197, 94, 0.8); }
  .cc-flash { animation: none; }
}
.cc-titlewrap { flex: 1; min-width: 0; }
.cc-title { font-weight: 700; color: #111827; font-size: 0.95rem; line-height: 1.15; margin: 0; }
.cc-status { font-size: 0.8rem; color: #6b7280; margin: 0.125rem 0 0; }
.cc-dismiss {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; flex-shrink: 0; border-radius: 9999px; color: #6b7280;
}
.cc-dismiss:hover { background: #f3f4f6; color: #111827; }

/* --- Mensajes (gris ~10%: separa los globos con un fondo muy suave;
   min-height:0 = fix iOS) --- */
.cc-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #ece5dd;
}
.cc-empty { color: #6b7280; font-size: 0.875rem; text-align: center; margin: auto 0; padding: 1rem; }
.cc-msg {
  position: relative;
  max-width: 85%;
  padding: 0.5rem 0.75rem;
  border-radius: 7.5px;
  font-size: 1rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
}
.cc-msg.is-user {
  align-self: flex-end;
  background: #d9fdd3;
  color: #111b21;
}
.cc-msg.is-assistant {
  align-self: flex-start;
  background: #fff;
  color: #111827;
}
/* Piquito WhatsApp: solo en la primera burbuja de una racha del mismo
   remitente; sobresale 8px dentro del padding de 1rem de .cc-messages,
   así que no crea overflow-x. */
.cc-msg.is-user.is-group-start { border-top-right-radius: 0; }
.cc-msg.is-user.is-group-start::before {
  content: '';
  position: absolute;
  top: 0;
  right: -8px;
  width: 0;
  height: 0;
  border-top: 10px solid #d9fdd3;
  border-right: 8px solid transparent;
  filter: drop-shadow(0 1px 0.5px rgba(11, 20, 26, 0.13));
}
.cc-msg.is-assistant.is-group-start { border-top-left-radius: 0; }
.cc-msg.is-assistant.is-group-start::before {
  content: '';
  position: absolute;
  top: 0;
  left: -8px;
  width: 0;
  height: 0;
  border-top: 10px solid #fff;
  border-left: 8px solid transparent;
  filter: drop-shadow(0 1px 0.5px rgba(11, 20, 26, 0.13));
}
.cc-text, .cc-actions { display: block; }
/* Hora dentro de la burbuja, pegada a la esquina inferior derecha (WhatsApp):
   posición absoluta + espaciador ::after que reserva su ancho al final de la
   última línea de texto, para que nunca queden superpuestos. */
.cc-time {
  position: absolute;
  right: 0.5rem;
  bottom: 0.3125rem;
  font-size: 0.6875rem;
  line-height: 1;
  color: rgba(17, 27, 33, 0.5);
  white-space: nowrap;
  pointer-events: none;
}
.cc-msg.is-user.has-time::after,
.cc-msg.is-assistant.has-time .cc-text::after {
  content: '';
  display: inline-block;
  width: 4.5em; /* reserva ~72px ("10:45 p. m."); em resuelve sobre el 1rem heredado */
  height: 0;
}
/* Burbujas que terminan en partes estructuradas (tabla, tarjetas, CTAs):
   contenido de ancho completo hasta el borde inferior → hora en fila propia.
   OJO especificidad: debe empatar (0,4,1)/(0,4,0) con las reglas de arriba y
   ganar por orden — con menos clases el espaciador seguiría aplicando. */
.cc-msg.is-assistant.has-parts .cc-time { position: static; display: block; margin-top: 0.25rem; text-align: right; }
.cc-msg.is-assistant.has-parts .cc-text::after { content: none; }
/* Chunk que termina en un CTA de markdown (bloque cc-link-btn): el espaciador
   caería en línea propia bajo el botón → mismo trato que has-parts. Navegadores
   sin :has() solo conservan la franja vacía (degradación sin solape). */
.cc-msg.is-assistant.has-time .cc-text:has(> .cc-link-btn:last-child)::after { content: none; }
.cc-msg.is-assistant:has(.cc-text > .cc-link-btn:last-child) .cc-time {
  position: static;
  display: block;
  margin-top: 0.25rem;
  text-align: right;
}
.cc-link-btn {
  display: block;
  margin-top: 0.5rem;
  padding: 0.55rem 0.9rem;
  background: var(--ui-primary, #cc022b); /* web → color de marca (CTA "terminar reserva") */
  color: #fff !important;
  text-align: center;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}
/* WhatsApp CTA: institutional green + black text (WCAG AA; issue #284) */
.cc-link-btn-wa {
  background: var(--color-whatsapp, #25D366);
  color: #000 !important;
}
.cc-link-btn-share { background: #0d9488; } /* Compartir cotización → teal (paridad con /chat-test) */
.cc-link-btn:hover { opacity: 0.92; }

/* --- Tabla de cotización (data-quoteTable) --- */
.cc-quote { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem; }
.cc-quote-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
}
.cc-quote-title { font-size: 0.9rem; font-weight: 700; color: #111827; margin-bottom: 0.1rem; }
.cc-quote-gama { font-size: 0.9rem; color: #111827; }
.cc-quote-desc { color: #6b7280; }
.cc-quote-price { font-size: 0.95rem; color: #111827; white-space: nowrap; }
.cc-quote-note { font-size: 0.9rem; color: #111827; margin-top: 0.15rem; }

/* --- Tarjetas de modelos (data-gamaCards) --- */
.cc-cards { margin-top: 0.5rem; }
.cc-cards-title { display: block; font-size: 0.85rem; font-weight: 600; color: #111827; }
.cc-cards-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.cc-card {
  width: 7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
}
.cc-card-img { width: 100%; height: 5rem; object-fit: contain; }
.cc-card-noimg {
  width: 100%;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 0.75rem;
}
.cc-card-name { font-size: 0.75rem; text-align: center; line-height: 1.3; color: #111827; }
.cc-error { align-self: center; color: #b91c1c; font-size: 0.8rem; text-align: center; }
.cc-typing-text { font-style: italic; color: #6b7280; font-size: 0.875rem; }

/* --- Separador "Mensajes nuevos" (reapertura con no leídos) --- */
.cc-new-sep {
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
  color: var(--ui-primary, #cc022b);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cc-new-sep::before,
.cc-new-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: color-mix(in oklab, var(--ui-primary, #cc022b) 45%, transparent);
}

/* --- Afordancia de reintento (turno colgado) --- */
.cc-retry {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.cc-retry-text { font-size: 0.8rem; color: #6b7280; }
.cc-retry-btn {
  padding: 0.3rem 0.7rem;
  background: var(--ui-primary, #cc022b);
  color: #fff;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.cc-retry-btn:hover { opacity: 0.92; }

/* --- "Responder a" estilo WhatsApp --- */
.cc-replyable { position: relative; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; touch-action: pan-y; }
.cc-replyable:hover { background: rgba(0, 0, 0, 0.04); }
/* Las burbujas del bot también son deslizables (touch-action deja pasar el scroll). */
.cc-msg.is-assistant { touch-action: pan-y; }
/* Hint ↩ al deslizar: opacidad/escala siguen a --cc-sdx (0→1 hasta el umbral). */
.cc-swipe-hint {
  position: absolute;
  left: -2.5rem;
  top: 50%;
  width: 2rem;
  height: 2rem;
  margin-top: -1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(11, 20, 26, 0.18);
  color: #fff;
  opacity: var(--cc-sdx, 0);
  transform: scale(calc(0.6 + 0.4 * var(--cc-sdx, 0)));
  pointer-events: none;
}
/* Responder desde desktop: botón ↩ que aparece al pasar el mouse por la burbuja. */
.cc-bubble-reply-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #fff;
  color: #54656f;
  box-shadow: 0 1px 2px rgba(11, 20, 26, 0.2);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.cc-msg.is-assistant:hover .cc-bubble-reply-btn { opacity: 1; pointer-events: auto; }
@media (hover: none) { .cc-bubble-reply-btn { display: none; } }
/* Destello al saltar a la cita (WhatsApp): oscurece la burbuja un instante. */
@keyframes cc-flash {
  0%, 100% { filter: none; }
  30% { filter: brightness(0.82); }
}
.cc-flash { animation: cc-flash 1.2s ease; }
/* Cita dentro de la burbuja enviada: bloque entintado con barra y autor en color. */
.cc-reply-quote {
  display: block;
  width: 100%;
  border-left: 4px solid var(--ui-primary, #cc022b);
  background: rgba(11, 20, 26, 0.06);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  margin-bottom: 0.3rem;
  cursor: pointer;
  text-align: left;
  color: #111b21;
}
.cc-reply-author {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ui-primary, #cc022b);
}
.cc-reply-preview {
  display: block;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #667781;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
/* Tarjeta de respuesta sobre el input (composer), calcada de WhatsApp. */
.cc-reply-bar {
  padding: 0.5rem 0.75rem 0;
  background: #ece5dd;
  border-top: 1px solid #d8cfc4;
  flex-shrink: 0;
}
.cc-reply-card {
  display: flex;
  align-items: center;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border-left: 4px solid var(--ui-primary, #cc022b);
  box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
}
.cc-reply-card-body {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.6rem;
  text-align: left;
  cursor: pointer;
}
.cc-reply-card-body .cc-reply-author { font-size: 0.8rem; }
.cc-reply-card-body .cc-reply-preview {
  font-size: 0.8rem;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  -webkit-line-clamp: unset;
}
.cc-reply-thumb {
  width: 3.25rem;
  height: 3.25rem;
  object-fit: cover;
  flex-shrink: 0;
}
.cc-reply-bar-x {
  margin: 0 0.25rem;
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; flex-shrink: 0;
  border-radius: 9999px; color: #6b7280;
}
.cc-reply-bar-x:hover { background: rgba(0, 0, 0, 0.06); color: #111827; }

/* --- Input --- */
.cc-input { display: flex; gap: 0.5rem; padding: 0.375rem 0.75rem 0.75rem; flex-shrink: 0; background: #ece5dd; }
.cc-input input {
  flex: 1; min-width: 0;
  padding: 0.625rem 0.875rem;
  border: 2px solid #cbd0d6; border-radius: 9999px;
  font-size: 1rem; color: #111827; background: #fff; outline: none;
  transition: border-color 0.15s ease;
}
.cc-input input:focus { border-color: var(--ui-primary, #cc022b); }
/* Botón enviar: gris neutro en reposo; cambia al color de marca apenas el
   usuario enfoca el campo de texto (o hay texto). */
.cc-send {
  display: flex; align-items: center; justify-content: center;
  width: 2.5rem; height: 2.5rem; flex-shrink: 0; border-radius: 9999px;
  background: #9ca3af; color: #fff;
  transition: background-color 0.18s ease, opacity 0.15s ease;
}
.cc-send.cc-send-active { background: var(--ui-primary, #cc022b); }
.cc-send:disabled { cursor: not-allowed; }
</style>
