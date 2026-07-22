<template>
  <!--
    Hero visual — the car cutout with the small corner video on top.

    Extracted from the home hero so the CITY hero renders the same thing instead
    of a second copy. Two near-identical copies of ~160 lines (three video
    states, autoplay gating, idle scheduling, teardown) is exactly the shape that
    drifts apart and produces "why does the city look different" later.

    Only the alt text varies per page — the home says "en Colombia", a city
    landing names the city — so that is the single prop.

    Autoplay policy, unchanged from the home:
      - default paint is the POSTER only, so reduced-motion and data-saver users
        never trigger a 4MB download;
      - the muted preview starts only once the block is on screen AND the
        browser is idle;
      - the audio track is a separate <video preload="none"> that downloads only
        when the user clicks "Activar sonido" — autoplay WITH audio is blocked by
        browsers anyway, so the click is what unlocks it.
  -->
  <div ref="visualBox" class="relative flex items-center justify-center min-h-[16rem]">
    <!-- Main visual: car cutout (webp, alpha). width/height reserve space → no CLS. -->
    <img
      src="/images/carro_hero.webp"
      :alt="carAlt"
      width="1199"
      height="678"
      class="w-full max-w-xl drop-shadow-2xl"
      loading="eager"
      fetchpriority="high"
    >

    <!-- Small corner video over the car: muted preview loops, click plays with
         audio. Desktop bottom-right; mobile right + vertically centered. -->
    <div
      class="absolute right-2 top-1/2 -translate-y-1/2 lg:top-auto lg:translate-y-0 lg:bottom-2 lg:right-2 w-[42vw] lg:w-80 aspect-[5/3] lg:aspect-[16/9] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/70 bg-black"
    >
      <!-- Default paint: poster only. Stays under reduced-motion / data-saver. -->
      <NuxtImg
        v-if="!videoActive && !audioActive"
        src="/videos/hero-poster.jpg"
        alt="Video promocional Alquilame"
        width="320"
        height="180"
        format="webp"
        loading="eager"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <!-- Muted preview loop (no audio track). Activated post-idle when visible. -->
      <video
        v-show="videoActive && !audioActive"
        ref="previewVideo"
        class="absolute inset-0 w-full h-full object-cover"
        poster="/videos/hero-poster.jpg"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-label="Video promocional de Alquilame Colombia (silenciado)"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
      <!-- Full video WITH audio: preload="none" → downloads only on click. -->
      <video
        v-show="audioActive"
        ref="audioVideo"
        class="absolute inset-0 w-full h-full object-cover bg-black"
        poster="/videos/hero-poster.jpg"
        controls
        playsinline
        preload="none"
        aria-label="Video promocional de Alquilame Colombia con audio"
      >
        <source src="/videos/hero-audio.mp4" type="video/mp4" />
      </video>
      <!-- "Activar sonido" pill at the bottom of the small video. -->
      <button
        v-if="!audioActive"
        type="button"
        class="group absolute inset-0 flex items-end justify-center pb-2 lg:pb-3 bg-black/10 hover:bg-black/25 transition-colors duration-200"
        aria-label="Activar sonido del video"
        @click="enableSound"
      >
        <span
          class="inline-flex items-center gap-1 lg:gap-2 rounded-full bg-black/65 group-hover:bg-black/80 text-white text-[11px] lg:text-sm font-semibold px-2 py-1 lg:px-4 lg:py-2 shadow backdrop-blur-sm transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="w-3 h-3 lg:w-4 lg:h-4">
            <path d="M8 5v14l11-7z" />
          </svg>
          Activar sonido
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

withDefaults(
  defineProps<{
    /** Accessible name for the car image — name the city on a city landing. */
    carAlt?: string
  }>(),
  { carAlt: 'SUV disponible para alquilar en Colombia con Alquilame' },
)

const visualBox = ref<HTMLElement | null>(null)
const previewVideo = ref<HTMLVideoElement | null>(null)
const audioVideo = ref<HTMLVideoElement | null>(null)
const videoActive = ref(false)
const audioActive = ref(false)
let idleId: number | undefined
let io: IntersectionObserver | undefined

/**
 * User clicked the sound affordance. This gesture is what lets the browser play
 * media WITH audio (autoplay-with-audio is blocked). Swap the muted preview for
 * the full audio video (preload="none" → it downloads only now), from the start.
 */
function enableSound() {
  audioActive.value = true
  previewVideo.value?.pause()
  const v = audioVideo.value
  if (!v) return
  try {
    v.muted = false
    v.currentTime = 0
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }
  catch {
    /* play() may reject on some browsers; native controls remain as fallback */
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Data-saver / very slow links: skip the muted preview autoplay entirely and
  // stay on the poster + "Activar sonido" button (no background download).
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return
  const el = visualBox.value
  if (!el) return

  const activate = () => {
    videoActive.value = true
  }

  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io?.disconnect()
      const ric = (window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }).requestIdleCallback
      if (ric) {
        idleId = ric(activate, { timeout: 2500 })
      } else {
        idleId = window.setTimeout(activate, 1200) as unknown as number
      }
    },
    { rootMargin: '80px' },
  )
  io.observe(el)
})

onBeforeUnmount(() => {
  io?.disconnect()
  if (idleId !== undefined) {
    const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
    if (cic) cic(idleId)
    else clearTimeout(idleId)
  }
})
</script>
