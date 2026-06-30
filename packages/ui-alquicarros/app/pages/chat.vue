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
