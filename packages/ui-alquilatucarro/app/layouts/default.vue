<template>
  <div class="min-h-screen bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900 font-sans text-gray-800">
    <!-- Header -->
    <div>
      <UHeader
        v-model:open="mobileMenuOpen"
        class="bg-[#000073] z-40 py-4 md:py-6 px-4 lg:px-6 border-none relative"
        mode="slideover"
        :toggle="false"
        :ui="{
          root: 'gap-4',
          container: 'w-full max-w-(--ui-container) mx-auto sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full',
          content: 'bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900',
          header: 'hidden',
          body: 'p-0!'
        }"
      >
        <template #right>
          <!-- Menú desktop -->
          <div class="hidden lg:block">
            <UNavigationMenu color="neutral" :items="items" />
          </div>
          <!-- Toggle móvil dentro del slot para alineación natural por flex -->
          <button
            type="button"
            class="lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Abrir menú de navegación"
            @click="mobileMenuOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </template>
      <template #left>
        <!-- Móvil: logo centrado. Va en #left (que sí renderiza en móvil; el slot
             default de UHeader queda envuelto en `hidden lg:flex` y nunca se ve).
             El wrapper se estira a todo el ancho de la barra (`absolute inset-x-0`
             sobre el header `relative`) y centra el logo con `flex justify-center`
             — sin números mágicos, robusto a cambios de tamaño del logo.
             `pointer-events-none` en el wrapper + `pointer-events-auto` en el link:
             solo el logo es clickable, la hamburguesa sigue recibiendo el tap.
             Centro exacto verificado en 360/390/414px. -->
        <div class="md:hidden absolute inset-x-0 flex justify-center pointer-events-none">
          <NuxtLink to="/" aria-label="alquilatucarro" class="pointer-events-auto">
            <Logo cls="h-8 w-auto" />
          </NuxtLink>
        </div>
        <!-- Desktop: Bandera + Logo juntos como unidad (oculto en móvil) -->
        <NuxtLink to="/" aria-label="alquilatucarro" class="hidden md:flex items-center gap-3">
          <IconsColombiaFlag cls="h-6 w-auto" />
          <Logo cls="h-10 w-auto" />
        </NuxtLink>
      </template>
      <template #body>
        <div class="flex flex-col min-h-full bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900">
          <!-- Botón cerrar (círculo azul oscuro) -->
          <button
            type="button"
            class="absolute top-3.5 right-3.5 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-[#00004d] text-white ring-1 ring-white/25 hover:bg-[#000073] transition-colors"
            aria-label="Cerrar menú"
            @click="mobileMenuOpen = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- Logo sobre el fondo azul (el SVG es blanco, se ve directo) -->
          <NuxtLink
            to="/"
            aria-label="alquilatucarro"
            class="flex items-center justify-center pt-8 pb-6 px-5"
            @click="mobileMenuOpen = false"
          >
            <Logo cls="h-9 w-auto" />
          </NuxtLink>

          <!-- Botones apilados y centrados (estilo /tiktok) -->
          <div class="flex-1 flex flex-col gap-2.5 w-full max-w-[21rem] mx-auto pb-8">
            <!-- Navegación como botones blancos -->
            <NuxtLink
              v-for="item in mobileItems"
              :key="item.label"
              :to="item.to"
              class="flex items-center gap-3 w-full bg-white rounded-xl px-4 py-3.5 shadow-sm text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              @click="(e: MouseEvent) => onMobileNavClick(item, e)"
            >
              <UIcon :name="(item.icon as string)" class="size-5 text-[#000073] shrink-0" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <UIcon name="lucide:chevron-right" class="size-4 text-gray-400 shrink-0" />
            </NuxtLink>

            <!-- Contacto: WhatsApp (verde) y Llamar (celeste), cada uno en su línea -->
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 bg-whatsapp text-black font-semibold shadow-sm hover:bg-whatsapp-hover transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm5.8 14.16c-.25.7-1.44 1.33-1.99 1.37-.53.05-1.02.24-3.45-.72-2.9-1.14-4.74-4.13-4.88-4.32-.14-.19-1.17-1.55-1.17-2.96s.74-2.1 1-2.39c.25-.29.55-.36.74-.36.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.18-.29.37-.24.61-.14.25.09 1.57.74 1.84.88.27.14.45.21.51.32.07.12.07.66-.18 1.36z" />
              </svg>
              WhatsApp
            </a>
            <a
              :href="telHref"
              class="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 bg-[#0ea5e9] text-white font-semibold shadow-sm hover:brightness-110 transition"
            >
              <UIcon name="lucide:phone" class="size-5" />
              Llamar
            </a>
          </div>
        </div>
      </template>
    </UHeader>
    </div>

    <main>
      <slot></slot>
    </main>

    <!-- Enlaces ciudades -->
    <section id="sedes" class="bg-blue-700 text-white text-center py-12 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 space-y-6">
        <div>
          <NuxtLink to="/" aria-label="alquilatucarro">
            <Logo cls="h-10 w-auto mx-auto" />
          </NuxtLink>
        </div>
        <div class="text-2xl font-bold">Ciudades donde ofrecemos alquiler de carros</div>
        <div >
          Estamos presentes en {{ cityCount }} ciudades de Colombia como Bogotá, Medellín, Cali y Cartagena. Explora cada destino y reserva en la sede que más te convenga.
        </div>
        <div class="flex flex-col md:flex-row md:flex-wrap justify-center gap-1 md:gap-3">
          <UButton
            v-for="city in cities"
            :key="city.id"
            :to="getCityReservationURL(city)"
            class="text-white justify-center bg-blue-600 hover:bg-blue-800 rounded-lg py-3 w-full md:w-fit font-normal transition-colors"
          >
            Alquiler de carros en <span class="font-bold">{{ city.name }}</span>
          </UButton>
        </div>
      </div>
    </section>

    <!-- Enlaces -->
    <section class="bg-[#000073] text-white py-8 lg:py-6">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
          <template v-for="(footerLink, index) in franchise.footerLinks" :key="`footer-${index}`">
            <NuxtLink
              :to="footerLink.link"
              class="underline hover:no-underline"
            >
              {{ footerLink.label }}
            </NuxtLink>
            <span class="hidden md:block" v-if="index != franchise.footerLinks.length - 1">|</span>
          </template>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <UFooter class="bg-black text-white text-center">
      <p class="text-white">
        copyright 2025 © Alquilatucarro renta car Colombia
      </p>
    </UFooter>

    <!-- Widget chat (lazy loaded) -->
    <LazyChatWidget />
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { buildCityReservationURL } from '@rentacar-main/logic/utils'
import type { City as CityData } from '@rentacar-main/logic/utils'
import { today } from '@internationalized/date'
import { storeToRefs } from 'pinia'

const route = useRoute();

// Estado del menú móvil slideover
const mobileMenuOpen = ref(false);

// La home (/) y todas las páginas de ciudad ([city] param) renderizan las
// secciones #requisitos y #faqs. En esas páginas enlazamos con ancla relativa
// para hacer scroll en sitio sin navegar (no se pierde la selección de ciudad);
// en el resto caemos a /#... (home). #sedes vive en el layout → siempre presente.
const hasInPageSections = computed(() => route.path === '/' || !!route.params.city);

const requisitosTo = computed(() => hasInPageSections.value ? '#requisitos' : '/#requisitos');
const faqsTo = computed(() => hasInPageSections.value ? '#faqs' : '/#faqs');

// Items para menú desktop (texto blanco sobre fondo azul).
// El item activo recibe un fondo claro del UNavigationMenu; sin un color de
// texto que contraste quedaba blanco-sobre-blanco e ilegible. linkClass pasa el
// texto a azul oscuro cuando el item está activo.
const linkClass = (active: boolean) =>
  active
    ? "text-blue-900 hover:text-blue-900"
    : "text-white hover:text-white hover:bg-white/10";

const items = computed<NavigationMenuItem[]>(() => {
  const requisitosActive = route.hash === '#requisitos';
  const sedesActive = route.hash === '#sedes';
  const mensualidadesActive = route.path.startsWith('/tarifas');
  const blogActive = route.path.startsWith('/blog');
  const faqsActive = route.hash === '#faqs';
  return [
    { label: 'Requisitos', to: requisitosTo.value, active: requisitosActive, class: linkClass(requisitosActive) },
    { label: 'Sedes', to: '#sedes', active: sedesActive, class: linkClass(sedesActive) },
    { label: 'Mensualidades', to: '/tarifas', active: mensualidadesActive, class: linkClass(mensualidadesActive) },
    { label: 'Blog', to: '/blog', active: blogActive, class: linkClass(blogActive) },
    { label: 'Preguntas frecuentes', to: faqsTo.value, active: faqsActive, class: linkClass(faqsActive) },
  ];
})

// Items para menú móvil (texto oscuro sobre fondo blanco)
const mobileItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Requisitos',
    icon: 'lucide:clipboard-check',
    to: requisitosTo.value,
    active: route.hash === '#requisitos',
  },
  {
    label: 'Sedes',
    icon: 'lucide:map-pin',
    to: '#sedes',
    active: route.hash === '#sedes',
  },
  {
    label: 'Mensualidades',
    icon: 'lucide:calendar-days',
    to: '/tarifas',
    active: route.path.startsWith('/tarifas'),
  },
  {
    label: 'Blog',
    icon: 'lucide:newspaper',
    to: '/blog',
    active: route.path.startsWith('/blog'),
  },
  {
    label: 'Preguntas frecuentes',
    icon: 'lucide:circle-help',
    to: faqsTo.value,
    active: route.hash === '#faqs',
  },
])

// Menú móvil: tel: con el número de la marca.
const telHref = computed(() => `tel:${(franchise.phone ?? '').replace(/[^\d+]/g, '')}`)

// Click en un item del menú móvil. Para destinos de ancla en página (#seccion)
// el scroll inmediato se pierde: el slideover sigue abierto y bloquea el scroll
// del body (scroll-lock del overlay). Cerramos primero y diferimos el scroll
// hasta que termine la animación de cierre y se libere el lock. Rutas reales
// (/blog, /tarifas) y ancla-a-home (/#faqs fuera de home) navegan normal.
function onMobileNavClick(item: NavigationMenuItem, e: MouseEvent) {
  mobileMenuOpen.value = false
  const to = typeof item.to === 'string' ? item.to : ''
  if (to.startsWith('#')) {
    e.preventDefault()
    const id = to.slice(1)
    nextTick(() => {
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 250)
    })
  }
}

const { cities } = useData();
// Live active-city count (Supabase) for the footer "presentes en N ciudades".
const cityCount = useCityCount();
const { franchise, reservation, defaultTimezone } = useAppConfig();
const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

// Fechas del deep-link: se calculan SOLO en cliente tras montar para evitar
// hydration attribute mismatch (Issue #109). En servidor y primera hidratación
// son null → buildCityReservationURL devuelve el href estable /${city.id},
// idéntico en ambos pases. Tras onMounted se aplica el deep-link con fecha
// fresca (today+1), nunca una fecha pasada de una página ISR cacheada.
const reservationInitDay = ref<string | null>(null);
const reservationEndDay = ref<string | null>(null);

onMounted(() => {
  reservationInitDay.value = today(defaultTimezone).add({ days: 1 }).toString();
  reservationEndDay.value = today(defaultTimezone).add({ days: 8 }).toString();
});

const getCityReservationURL = (city: CityData): string =>
  buildCityReservationURL(city, branches.value || [], {
    initDay: reservationInitDay.value,
    endDay: reservationEndDay.value,
    initHour: "12:00",
    endHour: "12:00",
  });

</script>