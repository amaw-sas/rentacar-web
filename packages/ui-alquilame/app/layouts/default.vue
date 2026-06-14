<template>
  <!-- Root keeps a DARK backdrop (de-blued to brand red) so pages that render
       text-white over it (hero, /pendiente, /sindisponibilidad) stay legible.
       The design's light body lands in F1, when each page gets its own section
       background (e.g. the red hero). Flipping to a light surface here would make
       that white text invisible. -->
  <div class="min-h-screen bg-linear-to-b from-brand-900 to-brand-950 font-sans text-gray-800">
    <!-- Header -->
    <UHeader
      v-model:open="mobileMenuOpen"
      class="bg-linear-to-r from-hero-from to-hero-to z-50 py-4 md:py-6 px-6 border-none sticky top-0"
      mode="slideover"
      :toggle="{
        color: 'white',
        size: 'xl',
        class: 'absolute right-4 top-4',
        'aria-label': 'Abrir menú de navegación'
      }"
      :ui="{
        root: 'gap-4',
        content: 'bg-white',
        header: 'bg-white relative',
        body: 'bg-white'
      }"
     >
      <template #left>
        <!-- Móvil: Bandera diagonal en esquina + Logo centrado -->
        <div class="md:hidden">
          <IconsColombiaFlagCorner cls="absolute top-0 left-0 w-32 h-32 -translate-x-[10%] -translate-y-[10%]" />
          <NuxtLink to="/" :aria-label="franchise.name" class="absolute left-1/2 -translate-x-1/2">
            <Logo cls="h-8 w-auto" variant="white" />
          </NuxtLink>
        </div>
        <!-- Desktop: Bandera + Logo juntos como unidad -->
        <NuxtLink to="/" :aria-label="franchise.name" class="hidden md:flex items-center gap-3">
          <IconsColombiaFlag cls="h-6 w-auto" />
          <Logo cls="h-10 w-auto" variant="white" />
        </NuxtLink>
      </template>
      <template #body>
        <!-- Botón cerrar manual (UHeader slideover no incluye uno nativo) -->
        <UButton
          icon="lucide:x"
          color="neutral"
          variant="solid"
          size="sm"
          class="absolute top-4 right-4 bg-black text-white rounded-full hover:bg-gray-800"
          aria-label="Cerrar menú"
          @click="mobileMenuOpen = false"
        />
        <UNavigationMenu
          orientation="vertical"
          :items="mobileItems"
          :ui="{
            link: 'text-lg py-3 font-medium',
            linkLabel: 'text-lg'
          }"
        />
        <!-- CTA global de reserva (menú móvil) -->
        <NuxtLink
          to="/reservas"
          class="mt-4 flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-lg font-bold text-white hover:bg-brand-700 transition-colors"
          @click="mobileMenuOpen = false"
        >
          Reservar
        </NuxtLink>
      </template>
      <template #right>
        <div class="hidden lg:flex items-center gap-4">
          <UNavigationMenu color="neutral" :items="items" />
          <!-- CTA global de reserva (nav desktop) -->
          <NuxtLink
            to="/reservas"
            class="rounded-lg bg-white px-5 py-2 font-bold text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Reservar
          </NuxtLink>
        </div>
      </template>
    </UHeader>

    <main>
      <slot></slot>
    </main>

    <!-- Footer unificado (gradiente rojo de marca) -->
    <footer class="bg-linear-to-b from-footer-from to-footer-to text-white font-heading">
      <!-- Enlaces de ciudades (#sedes) -->
      <section id="sedes" class="text-center py-12 lg:py-20">
        <div class="max-w-7xl mx-auto px-4 space-y-6">
          <div>
            <NuxtLink to="/" :aria-label="franchise.name">
              <Logo cls="h-10 w-auto mx-auto" variant="white" />
            </NuxtLink>
          </div>
          <div class="text-2xl font-bold">Ciudades donde ofrecemos alquiler de carros</div>
          <div class="font-sans">
            Estamos presentes en más de 19 ciudades de Colombia como Bogotá, Medellín, Cali y Cartagena. Explora cada destino y reserva en la sede que más te convenga.
          </div>
          <div class="flex flex-col md:flex-row md:flex-wrap justify-center gap-1 md:gap-3">
            <UButton
              v-for="city in cities"
              :key="city.id"
              :to="getCityReservationURL(city)"
              :external="true"
              target="_blank"
              class="text-white justify-center bg-white/10 hover:bg-white/20 ring-1 ring-white/25 rounded-lg py-3 w-full md:w-fit font-normal transition-colors"
            >
              Alquiler de carros en <span class="font-bold">{{ city.name }}</span>
            </UButton>
          </div>
        </div>
      </section>

      <!-- Enlaces legales -->
      <section class="border-t border-white/15 py-8 lg:py-6">
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

      <!-- Copyright -->
      <div class="border-t border-white/15 text-center py-6">
        <p class="text-white font-sans">
          copyright 2025 © {{ franchise.name }} renta car Colombia
        </p>
      </div>
    </footer>

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
// texto a gris oscuro cuando el item está activo.
const linkClass = (active: boolean) =>
  active
    ? "text-gray-900 hover:text-gray-900"
    : "text-white hover:text-white hover:bg-white/10";

const items = computed<NavigationMenuItem[]>(() => {
  const requisitosActive = route.hash === '#requisitos';
  const sedesActive = route.hash === '#sedes';
  const blogActive = route.path.startsWith('/blog');
  const faqsActive = route.hash === '#faqs';
  return [
    { label: 'Requisitos', to: requisitosTo.value, active: requisitosActive, class: linkClass(requisitosActive) },
    { label: 'Sedes', to: '#sedes', active: sedesActive, class: linkClass(sedesActive) },
    { label: 'Blog', to: '/blog', active: blogActive, class: linkClass(blogActive) },
    { label: 'Preguntas frecuentes', to: faqsTo.value, active: faqsActive, class: linkClass(faqsActive) },
  ];
})

// Items para menú móvil (texto oscuro sobre fondo blanco)
const mobileItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Requisitos',
    to: requisitosTo.value,
    active: route.hash === '#requisitos',
  },
  {
    label: 'Sedes',
    to: '#sedes',
    active: route.hash === '#sedes',
  },
  {
    label: 'Blog',
    to: '/blog',
    active: route.path.startsWith('/blog'),
  },
  {
    label: 'Preguntas frecuentes',
    to: faqsTo.value,
    active: route.hash === '#faqs',
  },
])

const { cities } = useData();
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