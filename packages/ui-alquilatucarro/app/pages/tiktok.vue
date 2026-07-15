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
    <!-- Oscurece el fondo cuando el menú de contacto está abierto, para no tocar
         por accidente un botón de ciudad. Tocarlo cierra el menú. -->
    <transition name="tt-fade">
      <div v-if="contactOpen" class="tt-backdrop" @click="contactOpen = false" />
    </transition>

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
      <!-- Opciones de contacto: se despliegan HACIA ARRIBA sobre el botón -->
      <transition name="tt-rise">
        <div v-if="contactOpen" class="tt-contact-options">
          <NuxtLink v-if="chatEnabled" to="/chat" class="tt-opt tt-opt-chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
            Chat 24 horas
          </NuxtLink>
          <a :href="telHref" class="tt-opt tt-opt-call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Llamada
          </a>
          <a :href="waHref" target="_blank" rel="noopener noreferrer" class="tt-opt tt-opt-wa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm5.8 14.16c-.25.7-1.44 1.33-1.99 1.37-.53.05-1.02.24-3.45-.72-2.9-1.14-4.74-4.13-4.88-4.32-.14-.19-1.17-1.55-1.17-2.96s.74-2.1 1-2.39c.25-.29.55-.36.74-.36.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.18-.29.37-.24.61-.14.25.09 1.57.74 1.84.88.27.14.45.21.51.32.07.12.07.66-.18 1.36z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </transition>

      <button
        type="button"
        class="tt-contact-btn"
        :class="{ 'is-open': contactOpen }"
        :aria-expanded="contactOpen"
        @click="contactOpen = !contactOpen"
      >
        Contáctanos
        <svg class="tt-contact-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
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

// Menú "Contáctanos": Chat 24h (chatbot web), Llamada y WhatsApp.
const contactOpen = ref(false)

// El Chat 24h solo se muestra si el dashboard lo tiene encendido para la marca
// (mismo origen de verdad que el ChatWidget de los layouts; /tiktok no usa layout).
const { enabled: chatEnabled } = useChatStatus(franchise.shortname as string)

// tel: con el número de la marca, solo dígitos y el +.
const telHref = computed(() => `tel:${(franchise.phone ?? '').replace(/[^\d+]/g, '')}`)

// WhatsApp con mensaje pre-cargado que identifica el origen (TikTok) para el asesor.
const WA_MESSAGE = 'Hola, vi su página de alquiler de carros en TikTok y quiero saber los requisitos'
const waHref = computed(
  () => `${franchise.whatsapp}?text=${encodeURIComponent(WA_MESSAGE)}`,
)
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
  /* Más estrecho que el ancho de pantalla → deja ver el fondo a los lados
     (pensado para una imagen de fondo). */
  max-width: 21rem;
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

/* Capa que oscurece el resto al abrir el menú de contacto */
.tt-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 10;
}

.tt-footer {
  position: relative;
  z-index: 20; /* footer (botón + opciones) por encima del backdrop */
  flex-shrink: 0;
  padding: 0.5rem 1.25rem calc(env(safe-area-inset-bottom) + 1rem);
}

/* Botón principal "Contáctanos" — WhatsApp green token + black text (issue #284) */
.tt-contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  max-width: 21rem;
  margin: 0 auto;
  background: var(--color-whatsapp, #25D366);
  color: #000;
  border-radius: 0.875rem;
  padding: 0.85rem 1rem;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.tt-contact-btn:active { transform: scale(0.98); }
.tt-contact-caret { transition: transform 0.2s ease; }
.tt-contact-btn.is-open .tt-contact-caret { transform: rotate(180deg); }

/* Opciones desplegadas (flotan sobre el botón, no empujan la lista) */
.tt-contact-options {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: calc(100% - 0.25rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 21rem;
  margin: 0 auto 0.5rem;
}
.tt-opt {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
  border-radius: 0.875rem;
  padding: 0.8rem 1rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.tt-opt:active { transform: scale(0.98); }
.tt-opt-chat { background: #2563eb; }
.tt-opt-call { background: #0ea5e9; }
.tt-opt-wa {
  background: var(--color-whatsapp, #25D366);
  color: #000;
}

/* Animación: las opciones suben y aparecen */
.tt-rise-enter-active,
.tt-rise-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.tt-rise-enter-from,
.tt-rise-leave-to { opacity: 0; transform: translateY(0.5rem); }

/* Fade del backdrop */
.tt-fade-enter-active,
.tt-fade-leave-active { transition: opacity 0.18s ease; }
.tt-fade-enter-from,
.tt-fade-leave-to { opacity: 0; }
</style>
