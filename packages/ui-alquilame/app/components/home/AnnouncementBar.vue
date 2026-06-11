<template>
  <!--
    F1 announcement bar — new dismissible top strip ported from the design's
    #announcement-bar. Marketing copy from the design.

    Hydration safety (#109 lesson): the dismissed state is CLIENT-ONLY. SSR/ISR
    must NEVER bake the closed bar into the prerendered HTML, otherwise the
    server markup (bar present) and the client (bar removed from sessionStorage)
    would diverge → hydration mismatch.

    How it stays client-only:
      - `mounted` starts false and is only flipped to true inside onMounted, so
        SSR always renders with `mounted === false`.
      - The whole bar is guarded by `v-if="mounted && !dismissed"`. During SSR
        `mounted` is false → the bar is NOT rendered server-side at all; the
        client mounts it after reading sessionStorage. The first client render
        therefore matches the (empty) server output, then reveals the bar — no
        attribute is baked from per-session state.
      - The dismissed flag is persisted to sessionStorage so it survives client
        navigation within the session without ever touching the server.
  -->
  <ClientOnly>
    <div
      v-if="mounted && !dismissed"
      class="bg-gray-900 text-white text-sm text-center py-2 px-4 relative z-50 transition-all duration-300"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <p class="text-sm font-medium">
          Reserva con anticipación — Precios sujetos a disponibilidad
        </p>
        <button
          type="button"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1"
          aria-label="Cerrar anuncio"
          @click="dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'announcement-dismissed'

// Both refs start in their SSR-safe default (false). They are only ever read
// from / written to sessionStorage on the client, so the server render is
// deterministic and free of per-session state (#109 hydration lesson).
const mounted = ref(false)
const dismissed = ref(false)

onMounted(() => {
  // Restore the per-session dismissed flag, then reveal the bar. Running this in
  // onMounted guarantees the server never observes the dismissed branch.
  dismissed.value = sessionStorage.getItem(STORAGE_KEY) === 'true'
  mounted.value = true
})

function dismiss(): void {
  dismissed.value = true
  sessionStorage.setItem(STORAGE_KEY, 'true')
}
</script>
