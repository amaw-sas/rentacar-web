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
      <template v-for="m in messages" :key="m.id">
        <!-- Usuario: siempre una sola burbuja -->
        <div v-if="m.role === 'user'" class="cc-msg is-user">
          <span v-if="m.replyTo" class="cc-reply-quote">{{ m.replyTo.label }}</span>
          {{ m.text }}
          <span v-if="m.createdAt" class="cc-time">{{ fmtTime(m.createdAt) }}</span>
        </div>

        <!-- Asistente "escribiendo": texto estático mientras llega la respuesta -->
        <div v-else-if="!m.text && isStreaming" class="cc-msg is-assistant">
          <span class="cc-typing-text" aria-live="polite">escribiendo…</span>
        </div>

        <!-- Asistente: una burbuja por tema (separador ---) -->
        <template v-else>
          <div
            v-for="(chunk, i) in bubblesFor(m)"
            :key="`${m.id}-${i}`"
            class="cc-msg is-assistant"
          >
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
                  @click="replyToGama(f)"
                  @keydown.enter="replyToGama(f)"
                  @touchstart.passive="onSwipeStart"
                  @touchmove.passive="onSwipeMove"
                  @touchend="onSwipeEnd($event, () => replyToGama(f))"
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
                    @click="replyToModelo(mod, m.gamaCards)"
                    @keydown.enter="replyToModelo(mod, m.gamaCards)"
                    @touchstart.passive="onSwipeStart"
                    @touchmove.passive="onSwipeMove"
                    @touchend="onSwipeEnd($event, () => replyToModelo(mod, m.gamaCards))"
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
    </div>

    <div v-if="replyTo" class="cc-reply-bar">
      <span class="cc-reply-bar-label">Respondiendo a: {{ replyTo.label }}</span>
      <button type="button" class="cc-reply-bar-x" aria-label="Quitar referencia" @click="replyTo = null">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <form class="cc-input" @submit.prevent="submit">
      <input
        v-model="input"
        type="text"
        autocomplete="off"
        enterkeyhint="send"
        placeholder="Escribe tu mensaje…"
        aria-label="Escribe tu mensaje"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
      >
      <button
        type="submit"
        class="cc-send"
        :class="{ 'cc-send-active': inputFocused || input.trim() }"
        :disabled="isStreaming || !input.trim()"
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
import { nextTick, ref, watch } from 'vue'
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

const { messages, input, replyTo, isStreaming, error, errorAction, submit } = useChatConversation()

const inputFocused = ref(false)

// --- "Responder a" estilo WhatsApp: tocar/clic o deslizar a la derecha una gama
// (fila de cotización) o un modelo lo cita arriba del área de escritura; el bot
// recibe el contexto sin que el cliente lo escriba (ver useChatConversation). ---
function replyToGama(f: { categoria: string; descripcion: string; precioTotal: number }) {
  replyTo.value = {
    label: `Gama ${f.categoria} · ${f.descripcion}`,
    context: `[El cliente responde sobre la Gama ${f.categoria} (${f.descripcion}), total cotizado $${f.precioTotal}.]`,
  }
}
function replyToModelo(mod: { nombre: string }, cards: { gama: string; descripcion?: string }) {
  replyTo.value = {
    label: `${mod.nombre} · Gama ${cards.gama}`,
    context: `[El cliente responde sobre el modelo ${mod.nombre} de la Gama ${cards.gama}.]`,
  }
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
  el.style.transform = `translateX(${Math.max(0, Math.min(dx, 72))}px)`
}
function onSwipeEnd(e: TouchEvent, fire: () => void) {
  const el = e.currentTarget as HTMLElement
  const endX = e.changedTouches[0]?.clientX ?? swipeX
  el.style.transform = ''
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
  max-width: 85%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.875rem;
  font-size: 1rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.cc-msg.is-user {
  align-self: flex-end;
  background: #d9fdd3;
  color: #111b21;
  border-bottom-right-radius: 0.25rem;
}
.cc-msg.is-assistant {
  align-self: flex-start;
  background: #fff;
  color: #111827;
  border-bottom-left-radius: 0.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.cc-text, .cc-actions { display: block; }
.cc-time { display: block; font-size: 0.65rem; line-height: 1; opacity: 0.55; text-align: right; margin-top: 0.25rem; }
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
.cc-link-btn-wa { background: #16a34a; } /* WhatsApp → verde */
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

/* --- "Responder a" estilo WhatsApp --- */
.cc-replyable { cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; touch-action: pan-y; }
.cc-replyable:hover { background: rgba(0, 0, 0, 0.04); }
.cc-reply-quote {
  display: block;
  border-left: 3px solid rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  padding: 0.2rem 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: #111b21;
  opacity: 0.85;
}
.cc-reply-bar {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #ece5dd;
  border-top: 1px solid #d8cfc4;
  flex-shrink: 0;
}
.cc-reply-bar-label {
  flex: 1; min-width: 0;
  border-left: 3px solid var(--ui-primary, #cc022b);
  padding-left: 0.5rem;
  font-size: 0.8rem; color: #111827;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cc-reply-bar-x {
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
