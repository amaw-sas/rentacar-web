<template>
  <div class="chat-page">
    <div class="chat-column">
      <ClientOnly>
        <ChatConversation variant="page" @dismiss="dismiss" />
        <template #fallback>
          <div class="chat-loading">Cargando chat…</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de chat a pantalla completa (móvil). Sin layout de sitio: es una
// pantalla enfocada de conversación, con su propia cabecera (volver + contacto)
// dentro de ChatConversation. El FAB no aparece aquí (layout:false).
definePageMeta({ layout: false })
useSeoMeta({ title: 'Chat', robots: 'noindex, nofollow' })
// Android: el teclado encoge la página en vez de taparla, así la cabecera y los
// mensajes siguen a la vista sobre el teclado (Safari iOS ignora esta clave).
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, interactive-widget=resizes-content' }],
})

// Visibilidad por marca: el switch del dashboard manda (mismo origen que el FAB,
// useChatStatus). Guard SSR+cliente, fail-closed → si la marca está apagada (o el
// backend no responde), /chat no expone la conversación y vuelve al home.
const { franchise } = useAppConfig()
const { rentacarPublicApiBase } = useRuntimeConfig().public
if (!(await fetchChatEnabled(rentacarPublicApiBase as string, franchise.shortname as string))) {
  await navigateTo('/')
}

const router = useRouter()
function dismiss() {
  // Volver dentro del sitio solo si la pagina previa es de la app (Vue Router
  // llena history.state.back); si /chat se abrio directo o desde fuera, ir al
  // home — nunca salir al escritorio del movil.
  if (import.meta.client && window.history.state?.back) router.back()
  else navigateTo('/')
}
</script>

<style scoped>
/* 100dvh: en móvil descuenta las barras del navegador y evita que el input
   quede tapado. ChatConversation rellena la columna (height:100%).
   --ui-primary: el servidor quita entry.css fuera de la home y /chat (sin layout)
   nunca la recupera; sin ella Nuxt UI deja el token vacío y la cabecera, el botón
   de enviar y las opciones salen transparentes al entrar directo. Valor = brand-600 de theme.css. */
.chat-page {
  position: fixed;
  inset: 0;
  height: 100dvh;
  background: #fff;
  z-index: 50;
  --ui-primary: #cc022b;
}
.chat-column { height: 100%; }
/* Escritorio: columna centrada en vez de estirar la conversación a todo el ancho. */
@media (min-width: 768px) {
  .chat-page { background: #eef0f2; }
  .chat-column {
    max-width: 720px;
    margin: 0 auto;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}
.chat-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-family: sans-serif;
  font-size: 0.9rem;
}
</style>

<style>
/* Mismo motivo que --ui-primary: el preflight de Tailwind vive en entry.css, así que
   al entrar directo la X de cerrar salía con el fondo gris del navegador y los
   controles en Arial. :where() deja la especificidad en 0 → cualquier regla del
   chat (fondo del botón enviar, radios) sigue ganando, igual que en el panel. */
:where(.chat-page) *,
:where(.chat-page) ::before,
:where(.chat-page) ::after { box-sizing: border-box; }
:where(.chat-page) :where(p) { margin: 0; }
:where(.chat-page) :where(button, input, textarea) {
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background-color: transparent;
  border-radius: 0;
  border: 0 solid;
  margin: 0;
  padding: 0;
}
</style>
