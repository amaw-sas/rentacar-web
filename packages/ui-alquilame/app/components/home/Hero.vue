<template>
  <!--
    Hero — golden parity (astro-alquilame #hero). Red gradient bg via the v4
    bg-linear-to-* utility.

    Perf (issue 322 SCEN-322-P01): first paint is the poster image only (NuxtImg).
    Multi-MB video is NOT autoplay on the critical path — it activates after the
    hero is visible + browser idle (skipped when prefers-reduced-motion).
  -->
  <section
    id="hero"
    class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <div class="text-center lg:text-left">
          <h1
            class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold font-heading text-white leading-[1.1]"
          >
            Alquiler de Carros en Colombia al Mejor Precio
          </h1>
          <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
            Sin anticipos, sin fila. Flota con menos de 2 años y mantenimiento incluido.
            Reserva por WhatsApp en {{ cityCount }} ciudades.
          </p>

          <div class="mt-6 flex flex-row items-stretch gap-3 justify-center lg:justify-start">
            <a
              href="#fleet"
              class="inline-flex items-center justify-center px-6 sm:px-7 py-3.5 text-base font-semibold rounded-full bg-white text-red-700 hover:bg-gray-100 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
            >
              Ver Precios
            </a>
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contáctanos por WhatsApp"
              class="inline-flex lg:hidden items-center justify-center gap-2 px-6 sm:px-7 py-3.5 text-base font-semibold rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>

        <div class="flex items-center justify-center">
          <div
            ref="visualBox"
            class="relative w-full max-w-lg aspect-[16/9] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-white/10"
            style="aspect-ratio: 16 / 9"
          >
            <!-- Default paint: poster only (no multi-MB video on critical path).
                 Stays as the first frame under reduced-motion / data-saver too. -->
            <NuxtImg
              v-if="!videoActive && !audioActive"
              src="/videos/hero-poster.jpg"
              alt="Flota Alquilame Colombia"
              width="960"
              height="540"
              format="webp"
              loading="eager"
              fetchpriority="high"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <!-- Muted preview loop (no audio track). Prefer mp4 (audit: webm was
                 heavier). Activated post-idle when visible; hidden once sound is on. -->
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
            <!-- Full video WITH audio: preload="none" → nothing downloads until
                 the user clicks the sound button. That click is the user gesture
                 browsers require to play media with audio. -->
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
            <!-- Sound affordance: full-cover play button over the poster/preview.
                 Over the poster (reduced-motion / data-saver) it reads "Reproducir
                 con sonido"; over the running preview, "Activar sonido". -->
            <button
              v-if="!audioActive"
              type="button"
              class="group absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors duration-200"
              :aria-label="videoActive ? 'Activar sonido del video' : 'Reproducir video con sonido'"
              @click="enableSound"
            >
              <span
                class="inline-flex items-center gap-2 rounded-full bg-black/55 group-hover:bg-black/70 text-white text-sm font-semibold px-4 py-2.5 shadow-lg backdrop-blur-sm transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {{ videoActive ? 'Activar sonido' : 'Reproducir con sonido' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const { franchise } = useAppConfig()
const cityCount = useCityCount()

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
  // stay on the poster + "Reproducir con sonido" button (no background download).
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
