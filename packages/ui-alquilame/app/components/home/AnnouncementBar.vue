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

    Stacking: claim NO z-index. The bar renders BEFORE the header in the layout,
    so document order alone keeps the sticky header on top. The explicit z it
    used to carry (needed back when the bar sat inside <main>, AFTER the header)
    is not merely redundant now — it broke the mobile menu: the slideover paints
    at z-index:auto, so a z-30 bar beat it and the bar's close button showed
    through the open menu as a second X. `relative` stays, because the close
    button is positioned against this box.
  -->
  <div
    v-if="!dismissed"
    class="bg-gray-900 text-white text-sm text-center py-2 px-4 relative transition-all duration-300"
    :class="leaving ? '-translate-y-full opacity-0' : ''"
  >
    <!-- px-10 reserves room for the absolute close button on both sides so the
         (centered) copy never runs under the X when it wraps on mobile. -->
    <div class="relative max-w-7xl mx-auto flex items-center justify-center gap-2 px-10">
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

// Exit animation (ported from the design): flipping `dismissed` straight to
// true unmounts the node in a single frame, so no transition can play and the
// page snaps upward. `leaving` applies the exit classes while the node is still
// mounted; `dismissed` flips only once the 300ms slide has finished.
const leaving = ref(false)
const EXIT_MS = 300

onMounted(() => {
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') dismissed.value = true
})

function dismiss(): void {
  // Reduced-motion users get the instant removal — an unrequested slide is the
  // exact kind of movement the preference asks us to drop.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    remove()
    return
  }
  leaving.value = true
  setTimeout(remove, EXIT_MS)
}

function remove(): void {
  dismissed.value = true
  sessionStorage.setItem(STORAGE_KEY, 'true')
}
</script>
