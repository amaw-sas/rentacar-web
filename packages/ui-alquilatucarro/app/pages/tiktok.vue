<template>
  <!--
    Landing tipo "linktree" para la bio de TikTok (alquilatucarro.com/tiktok).
    Botones que llevan DIRECTO a rentar en una ciudad (deep-link con fechas
    pre-cargadas) en vez de al index, donde el cliente tendría que elegir ciudad
    en el selector. Ocupa la pantalla EXACTA del móvil (100dvh, sin layout).

    Estructura: header fijo (logo) · lista scrolleable de ciudades · footer fijo
    (WhatsApp). El scroll vive DENTRO del contenedor 100dvh → la página nunca
    desborda. safe-area-inset para el notch de iOS.

    Patrón anti-hidratación #109: las fechas van null en SSR/primer render
    (buildCityReservationURL devuelve el href estable /{ciudad}) y se rellenan en
    onMounted con today+1 → today+4, momento en que el botón pasa al deep-link
    con fechas. Sin JS sigue funcionando (cae a /{ciudad}).
  -->
  <div class="tt-root">
    <header class="tt-header">
      <NuxtLink to="/" aria-label="alquilatucarro">
        <Logo cls="h-9 w-auto mx-auto" />
      </NuxtLink>
      <h1 class="tt-title">Alquila tu carro</h1>
      <p class="tt-sub">Elige tu ciudad y reserva en segundos</p>
    </header>

    <main class="tt-list">
      <div class="tt-list-inner">
        <NuxtLink
          v-for="city in tiktokCities"
          :key="city.id"
          :to="getCityReservationURL(city)"
          class="tt-city"
        >
          <span class="tt-city-emoji" aria-hidden="true">🚗</span>
          <span class="tt-city-name">{{ city.name }}</span>
          <svg class="tt-city-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </NuxtLink>
      </div>
    </main>

    <footer class="tt-footer">
      <a :href="franchise.whatsapp" target="_blank" rel="noopener noreferrer" class="tt-wa">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm5.8 14.16c-.25.7-1.44 1.33-1.99 1.37-.53.05-1.02.24-3.45-.72-2.9-1.14-4.74-4.13-4.88-4.32-.14-.19-1.17-1.55-1.17-2.96s.74-2.1 1-2.39c.25-.29.55-.36.74-.36.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.18-.29.37-.24.61-.14.25.09 1.57.74 1.84.88.27.14.45.21.51.32.07.12.07.66-.18 1.36z" />
        </svg>
        Hablar por WhatsApp
      </a>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { buildCityReservationURL } from '@rentacar-main/logic/utils'
import type { City as CityData } from '@rentacar-main/logic/utils'
import { today } from '@internationalized/date'
import { storeToRefs } from 'pinia'

// Página de campaña: full-screen sin header/footer del sitio y fuera del índice.
definePageMeta({ layout: false })
useSeoMeta({
  title: 'Alquila tu carro en tu ciudad | Alquilatucarro',
  description: 'Renta un carro en la ciudad que quieras, directo y en segundos.',
  robots: 'noindex, nofollow',
})

const { cities } = useData()
const { franchise, defaultTimezone } = useAppConfig()
const { sortedBranches: branches } = storeToRefs(useStoreAdminData())

// Ciudades del linktree: todas menos las 3 excluidas, en orden alfabético (es).
const EXCLUDED = new Set(['palmira', 'soledad', 'floridablanca'])
const tiktokCities = computed<CityData[]>(() =>
  (unref(cities) ?? [])
    .filter((c: CityData) => !EXCLUDED.has(c.id))
    .sort((a: CityData, b: CityData) => a.name.localeCompare(b.name, 'es')),
)

// Fechas del deep-link: null en SSR/primer render (Issue #109), today+1 → today+4
// (3 días de alquiler) tras montar. El cliente puede cambiarlas en la reserva.
const reservationInitDay = ref<string | null>(null)
const reservationEndDay = ref<string | null>(null)
onMounted(() => {
  reservationInitDay.value = today(defaultTimezone).add({ days: 1 }).toString()
  reservationEndDay.value = today(defaultTimezone).add({ days: 4 }).toString()
})

const getCityReservationURL = (city: CityData): string =>
  buildCityReservationURL(city, branches.value || [], {
    initDay: reservationInitDay.value,
    endDay: reservationEndDay.value,
    initHour: '12:00',
    endHour: '12:00',
  })
</script>

<style scoped>
/* 100dvh: ocupa la pantalla exacta descontando barras del navegador (iOS/Android).
   El scroll vive en .tt-list (min-height:0) para que el hijo flex pueda encoger
   y no colapse en iOS. */
.tt-root {
  position: fixed;
  inset: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #000073, #1e40af 55%, #1e3a8a);
  color: #fff;
  overflow: hidden;
}

.tt-header {
  flex-shrink: 0;
  text-align: center;
  padding: calc(env(safe-area-inset-top) + 1.5rem) 1.5rem 1rem;
}
.tt-title { margin: 1rem 0 0; font-size: 1.4rem; font-weight: 800; line-height: 1.1; }
.tt-sub { margin: 0.35rem 0 0; font-size: 0.9rem; color: #bfdbfe; }

.tt-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem 1.25rem 1rem;
}
.tt-list-inner {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 28rem;
  margin: 0 auto;
}

.tt-city {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border-radius: 0.875rem;
  padding: 0.85rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  text-decoration: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tt-city:active { transform: scale(0.98); }
.tt-city-emoji { font-size: 1.25rem; line-height: 1; }
.tt-city-name { flex: 1; font-weight: 700; font-size: 1rem; color: #1e3a8a; }
.tt-city-arrow { color: #93c5fd; flex-shrink: 0; }

.tt-footer {
  flex-shrink: 0;
  padding: 0.5rem 1.25rem calc(env(safe-area-inset-bottom) + 1rem);
}
.tt-wa {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  max-width: 28rem;
  margin: 0 auto;
  background: #22c55e;
  color: #fff;
  border-radius: 0.875rem;
  padding: 0.8rem 1rem;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
}
.tt-wa:active { transform: scale(0.98); }
</style>
