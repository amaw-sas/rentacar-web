<template>
  <!--
    F1 step04 — Cities (issue #112). Port of the design's #cities section to Vue.

    Fidelity principle (F1, same decision as F0/Hero): the design links every city
    to a chat-app contact deep link (an Astro artifact). We REPLACE those with
    INTERNAL links to the city landing route `/{city.id}` (City.id === slug === the
    /[city] route param). No external contact deep links exist in this section.

    Data: ALL active cities from useData().cities (Supabase-dynamic via
    rentacar-data). The count is DB-controlled — never hardcoded or sliced.

    Visual (golden parity): a horizontal MARQUEE of "featured" photo cards over a
    pill/chip grid of every active city. Featured cards carry a real city photo
    (public/images/cities/*) under a dark gradient overlay with the name. A city
    only becomes a featured card when it is BOTH an active city in the data source
    AND one we ship a photo for (mapped by city.id) — every other active city still
    appears in the pill grid. No placeholder cities are ever invented.

    Gradient guard (F0 lesson): use the v4 `bg-linear-to-*` utility, never the
    broken v3 gradient alias (which renders background-image:none with custom
    @theme tokens). Headings use `font-heading` (Plus Jakarta) plus explicit
    typography utilities.
  -->
  <section id="cities" class="bg-gray-100 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
          Alquila tu carro en las principales ciudades de Colombia
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Operamos en más de {{ cities.length }} ciudades de Colombia. Estas son las más solicitadas.
        </p>
      </div>

      <!-- Featured cities — static 4-up grid of tall photo cards that reveal on
           scroll. Each carries the REAL number of branches in that city. -->
      <div
        v-if="featuredCities.length"
        class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10"
      >
        <NuxtLink
          v-for="(city, i) in featuredCities"
          :key="city.id"
          :to="`/${city.id}`"
          :aria-label="`Alquiler de carros en ${city.name}`"
          class="city-reveal group relative block aspect-[4/5] overflow-hidden rounded-[22px] border-[7px] border-white shadow-[0_8px_22px_rgba(17,17,34,0.10)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,34,0.18)] [--ctx-text-primary:#fff]"
          :style="`--reveal-delay:${i * 90}ms`"
        >
          <NuxtImg
            :src="city.image"
            :alt="`Vista de ${city.name}, Colombia`"
            loading="lazy"
            width="640"
            height="800"
            sizes="50vw lg:25vw"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <!-- Dark gradient overlay for text legibility -->
          <span class="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/25 to-transparent"></span>

          <!-- Hover affordance: a chevron that slides in from the left -->
          <span
            class="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-600 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>

          <div class="absolute inset-x-0 bottom-0 p-4">
            <h3 class="font-heading text-lg sm:text-xl font-bold text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
              {{ city.name }}
            </h3>
            <span
              v-if="city.branchLabel"
              class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {{ city.branchLabel }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- All cities — pill / chip grid (every active city, internal link) -->
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          v-for="city in cities"
          :key="city.id"
          :to="`/${city.id}`"
          :aria-label="`Alquiler de carros en ${city.name}`"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20 hover:shadow-md"
        >
          {{ city.name }}
        </NuxtLink>
      </div>

      <!-- Trust row (confianza) — ported from the reference's PuntosEntrega
           footer: three reassurance items under a divider. -->
      <div class="grid grid-cols-1 sm:grid-cols-3 mt-12 pt-8 border-t border-gray-900/[0.08]">
        <div
          v-for="(item, i) in confianza"
          :key="item.title"
          :class="[
            'flex flex-row items-start gap-3.5 sm:flex-col sm:gap-2',
            i === 0 ? 'sm:pr-6' : 'sm:px-6 sm:border-l sm:border-gray-900/[0.08]',
            i > 0 ? 'pt-5 mt-5 border-t border-gray-900/[0.08] sm:pt-0 sm:mt-0 sm:border-t-0' : '',
          ]"
        >
          <span class="shrink-0 text-brand-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="item.icon"
            />
          </span>
          <div class="sm:contents">
            <p class="font-bold font-heading text-sm text-gray-900">{{ item.title }}</p>
            <p class="text-[13px] text-gray-500 leading-snug">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Types
import type { City } from '@rentacar-main/logic/utils'

// useData is auto-imported from the logic layer; cities are Supabase-dynamic.
const { cities } = useData()

// Photos we actually ship, keyed by City.id (=== slug). A city only becomes a
// featured photo card when both (a) it is an active city in the data source AND
// (b) we have a real photo for it — no placeholder cities are ever invented.
// The array order defines the marquee order (golden: Bogotá, Medellín, Cali,
// Cartagena).
const FEATURED: ReadonlyArray<{ id: string; image: string }> = [
  { id: 'bogota', image: '/images/cities/bogota.jpg' },
  { id: 'medellin', image: '/images/cities/medellin.jpg' },
  { id: 'cali', image: '/images/cities/cali.jpg' },
  { id: 'cartagena', image: '/images/cities/cartagena.jpg' },
]

type FeaturedCity = City & { image: string; branchLabel: string | undefined }

// Branch counts come from the SAME shared `rentacar-data` state the city list
// already reads, so the badge costs no extra payload. The reference hardcodes
// "4 puntos de entrega" for Bogotá; our data says 5 — deriving beats copying.
// `branch.city` holds the city slug, which is City.id.
const storeAdminData = useStoreAdminData()

function branchLabelFor(cityId: string): string | undefined {
  const branches = storeAdminData.branches ?? []
  const n = branches.filter((b: { city?: string }) => b.city === cityId).length
  // No badge at all when the count is zero — a zero badge reads as "closed".
  if (n < 1) return undefined
  return `${n} ${n === 1 ? 'sede' : 'sedes'}`
}

// Featured set: the ordered intersection of FEATURED photos with real active
// cities. flatMap drops any photo whose city is not currently active.
const featuredCities = computed<FeaturedCity[]>(() =>
  FEATURED.flatMap(({ id, image }) => {
    const city = cities.value.find((c: City) => c.id === id)
    return city ? [{ ...city, image, branchLabel: branchLabelFor(id) }] : []
  })
)

// Reveal-on-scroll for the featured cards, staggered by --reveal-delay. Cards
// start visible in the markup and are only hidden once JS confirms it can
// animate them, so a no-JS or failed-hydration render never leaves a blank grid.
onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const cards = document.querySelectorAll<HTMLElement>('.city-reveal')
  if (!cards.length) return
  cards.forEach((c) => c.classList.add('is-hidden'))
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.remove('is-hidden')
        io.unobserve(entry.target)
      })
    },
    { threshold: 0.2 },
  )
  cards.forEach((c) => io.observe(c))
})

// Trust row copy + icons ported verbatim from the reference's PuntosEntrega
// "confianza" block.
const confianza: ReadonlyArray<{ title: string; description: string; icon: string }> = [
  {
    title: 'Seguridad y confianza',
    description: 'Protocolos de bioseguridad en todos nuestros puntos.',
    icon: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  },
  {
    title: 'Entregas rápidas',
    description: 'Proceso ágil para que empieces tu viaje.',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  },
  {
    title: 'Soporte 24/7',
    description: 'Estamos contigo en cada paso del alquiler.',
    icon: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  },
]
</script>

<style scoped>
/*
  Reveal-on-scroll. The cards render VISIBLE by default and `is-hidden` is added
  by script only when the animation can actually run — so if JS never executes,
  the grid is still there instead of being permanently transparent.
*/
.city-reveal {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease,
    box-shadow 0.3s ease;
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform;
}

.city-reveal.is-hidden {
  opacity: 0;
  transform: translateY(26px);
}

@media (prefers-reduced-motion: reduce) {
  .city-reveal,
  .city-reveal.is-hidden {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
