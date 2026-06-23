<template>
  <div class="chat-page">
    <ClientOnly>
      <ChatConversation variant="page" @dismiss="dismiss" />
      <template #fallback>
        <div class="chat-loading">Cargando chat…</div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Vista de chat a pantalla completa (móvil). Sin layout de sitio: es una
// pantalla enfocada de conversación, con su propia cabecera (volver + contacto)
// dentro de ChatConversation. El FAB no aparece aquí (layout:false).
definePageMeta({ layout: false })
useSeoMeta({ title: 'Chat', robots: 'noindex, nofollow' })

// Feature flag (Escudo): si el chat está apagado para la marca, /chat no debe
// exponer la conversación. Corre en SSR y cliente.
const { franchise } = useAppConfig()
if (franchise.chatEnabled !== true) {
  await navigateTo('/')
}

const router = useRouter()
function dismiss() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo('/')
}
</script>

<style scoped>
/* 100dvh: en móvil descuenta las barras del navegador y evita que el input
   quede tapado. ChatConversation rellena este contenedor (height:100%). */
.chat-page {
  position: fixed;
  inset: 0;
  height: 100dvh;
  background: #fff;
  z-index: 50;
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
