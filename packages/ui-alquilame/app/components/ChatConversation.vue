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
      <span class="cc-avatar" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <span class="cc-avatar-dot" />
      </span>

      <div class="cc-titlewrap">
        <p class="cc-title">¿En qué te ayudamos?</p>
        <p class="cc-status">En línea · Disponible 24/7</p>
      </div>

      <button v-if="messages.length" type="button" class="cc-restart" aria-label="Reiniciar conversación" @click="clear()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
        </svg>
      </button>
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
          {{ m.text }}
          <span v-if="m.createdAt" class="cc-time">{{ fmtTime(m.createdAt) }}</span>
        </div>

        <!-- Asistente "escribiendo": 3 puntos mientras llega la respuesta -->
        <div v-else-if="!m.text && isStreaming" class="cc-msg is-assistant">
          <span class="cc-typing" aria-live="polite">
            <span class="cc-bdot" /><span class="cc-bdot" /><span class="cc-bdot" />
          </span>
        </div>

        <!-- Asistente: una burbuja por tema (separador ---) -->
        <template v-else>
          <div
            v-for="(chunk, i) in bubblesFor(m)"
            :key="`${m.id}-${i}`"
            class="cc-msg is-assistant"
          >
            <span v-if="chunk" class="cc-text" v-html="renderChatMarkdown(chunk)" />
            <span v-if="m.actions && i === bubblesFor(m).length - 1" class="cc-actions">
              <a v-if="m.actions.web" :href="m.actions.web" target="_blank" rel="noopener noreferrer" class="cc-link-btn">Terminar mi reserva en la web</a>
              <a v-if="m.actions.whatsapp" :href="m.actions.whatsapp" target="_blank" rel="noopener noreferrer" class="cc-link-btn">Escribir a un asesor</a>
            </span>
            <span v-if="m.createdAt" class="cc-time">{{ fmtTime(m.createdAt) }}</span>
          </div>
        </template>
      </template>
      <p v-if="error" class="cc-error" role="alert">
        {{ error.message }}
      </p>
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
// Una burbuja por tema (separador --- del bot). Si no hay texto pero sí botones
// de respaldo, deja una burbuja vacía para mostrarlos.
function bubblesFor(m: { text: string; actions?: unknown }): string[] {
  const chunks = splitBubbles(m.text)
  return chunks.length ? chunks : m.actions ? [''] : []
}

withDefaults(defineProps<{ variant?: 'panel' | 'page' }>(), { variant: 'panel' })
const emit = defineEmits<{ dismiss: [] }>()

const { messages, input, isStreaming, error, submit, clear } = useChatConversation()

const inputFocused = ref(false)
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
  background: color-mix(in oklab, var(--ui-primary, #cc022b) 14%, white);
  color: var(--ui-primary, #cc022b);
}
.cc-avatar-dot {
  position: absolute;
  right: -1px;
  top: -1px;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 9999px;
  background: #22c55e;
  border: 2px solid #fff;
}
.cc-titlewrap { flex: 1; min-width: 0; }
.cc-title { font-weight: 700; color: #111827; font-size: 0.95rem; line-height: 1.15; margin: 0; }
.cc-status { font-size: 0.8rem; color: #6b7280; margin: 0; }
.cc-dismiss {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; flex-shrink: 0; border-radius: 9999px; color: #6b7280;
}
.cc-dismiss:hover { background: #f3f4f6; color: #111827; }
.cc-restart {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; flex-shrink: 0; border-radius: 9999px; color: #6b7280;
}
.cc-restart:hover { background: #f3f4f6; color: #111827; }

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
  background: var(--ui-primary, #cc022b);
  color: #fff !important;
  text-align: center;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}
.cc-link-btn:hover { opacity: 0.92; }
.cc-error { align-self: center; color: #b91c1c; font-size: 0.8rem; text-align: center; }
.cc-typing { display: flex; gap: 0.25rem; align-items: center; }
.cc-bdot { width: 0.4rem; height: 0.4rem; border-radius: 9999px; background: #6b7280; animation: cc-bounce 1.2s infinite ease-in-out; }
.cc-bdot:nth-child(2) { animation-delay: 0.15s; }
.cc-bdot:nth-child(3) { animation-delay: 0.3s; }
@keyframes cc-bounce { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-0.25rem); opacity: 1; } }

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
