<template>
  <!--
    F1 announcement bar — new dismissible top strip ported from the design's
    #announcement-bar. Marketing copy from the design.

    CLS (step10 runtime lesson): the bar is rendered in SSR by default so it
    occupies its space from the first paint. A previous version gated it behind a
    mount flag inside a client-only wrapper, so the bar only appeared after hydration and
    pushed the hero down → a ~0.26 layout shift. Rendering it server-side removes
    that shift.

    Hydration safety (#109): `dismissed` starts false — the SSR-safe default — so
    SSR and the first client render BOTH show the bar (no mismatch). Only the
    per-session dismissed flag is client-side: it is restored from sessionStorage
    in onMounted (post-hydration, so the server never observes it) and set on
    dismiss. A returning user who dismissed it sees the bar collapse just after
    mount; everyone else sees no shift.
  -->
  <div
    v-if="!dismissed"
    class="bg-gray-900 text-white text-sm text-center py-2 px-4 relative z-50"
  >
    <div class="relative max-w-7xl mx-auto flex items-center justify-center gap-2">
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
</template>

<script setup lang="ts">
const STORAGE_KEY = 'announcement-dismissed'

// SSR-safe default: the bar shows. SSR and the first client render agree, so
// there is no hydration mismatch (#109). Only the per-session dismissed flag is
// client-side — restored in onMounted, set on dismiss.
const dismissed = ref(false)

onMounted(() => {
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') dismissed.value = true
})

function dismiss(): void {
  dismissed.value = true
  sessionStorage.setItem(STORAGE_KEY, 'true')
}
</script>
