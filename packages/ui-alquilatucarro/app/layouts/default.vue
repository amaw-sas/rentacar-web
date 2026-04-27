<template>
  <div class="min-h-screen bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900 font-sans text-gray-800">
    <!-- Header -->
    <div>
      <UHeader
        v-model:open="mobileMenuOpen"
        class="bg-[#000073] z-40 py-4 md:py-6 px-4 lg:px-6 border-none"
        mode="slideover"
        :toggle="false"
        :ui="{
          root: 'gap-4',
          container: 'w-full max-w-(--ui-container) mx-auto sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full',
          content: 'bg-white',
          header: 'bg-white relative',
          body: 'bg-white'
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
        <!-- Móvil: spacer invisible que iguala el ancho del hamburguesa (#right)
             para que el slot center quede ópticamente centrado -->
        <div class="md:hidden w-9 h-9" aria-hidden="true"></div>
        <!-- Desktop: Bandera + Logo juntos como unidad (oculto en móvil) -->
        <NuxtLink to="/" aria-label="alquilatucarro" class="hidden md:flex items-center gap-3">
          <IconsColombiaFlag cls="h-6 w-auto" />
          <Logo cls="h-10 w-auto" />
        </NuxtLink>
      </template>
      <!-- Slot default (center wrapper) — móvil únicamente, centrado por flex -->
      <NuxtLink to="/" aria-label="alquilatucarro" class="md:hidden flex">
        <Logo cls="h-8 w-auto" />
      </NuxtLink>
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
          Estamos presentes en más de 19 ciudades de Colombia como Bogotá, Medellín, Cali y Cartagena. Explora cada destino y reserva en la sede que más te convenga.
        </div>
        <div class="flex flex-col md:flex-row md:flex-wrap justify-center gap-1 md:gap-3">
          <UButton
            v-for="city in cities"
            :key="city.id"
            :to="getCityReservationURL(city)"
            :external="true"
            target="_blank"
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
import type { BranchData, City as CityData } from '@rentacar-main/logic/utils'
import { today } from '@internationalized/date'
import { storeToRefs } from 'pinia'

const route = useRoute();

// Estado del menú móvil slideover
const mobileMenuOpen = ref(false);

// Items para menú desktop (texto blanco sobre fondo azul)
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Requisitos',
    to: '/#requisitos',
    active: route.path.startsWith('#requisitos'),
    class: "text-white hover:text-white hover:bg-white/10",
  },
  {
    label: 'Sedes',
    to: '/#sedes',
    active: route.path.startsWith('#sedes'),
    class: "text-white hover:text-white hover:bg-white/10",
  },
  {
    label: 'Blog',
    to: '/blog',
    active: route.path.startsWith('/blog'),
    class: "text-white hover:text-white hover:bg-white/10",
  },
  {
    label: 'Preguntas frecuentes',
    to: '/#faqs',
    active: route.path.startsWith('#faqs'),
    class: "text-white hover:text-white hover:bg-white/10",
  },
])

// Items para menú móvil (texto oscuro sobre fondo blanco)
const mobileItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Requisitos',
    to: '/#requisitos',
    active: route.path.startsWith('#requisitos'),
  },
  {
    label: 'Sedes',
    to: '/#sedes',
    active: route.path.startsWith('#sedes'),
  },
  {
    label: 'Blog',
    to: '/blog',
    active: route.path.startsWith('/blog'),
  },
  {
    label: 'Preguntas frecuentes',
    to: '/#faqs',
    active: route.path.startsWith('#faqs'),
  },
])

const { cities } = useData();
const { franchise, reservation, defaultTimezone } = useAppConfig();
const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

// Genera URL de reserva dinámica para cada ciudad (como el selector del hero)
const reservationInitDay = today(defaultTimezone).add({ days: 1 }).toString();
const reservationEndDay = today(defaultTimezone).add({ days: 8 }).toString();
const reservationInitHour = "12:00";
const reservationEndHour = "12:00";

const getCityReservationURL = (city: CityData): string => {
  // Buscar la sucursal de aeropuerto para esta ciudad (código empieza con "AA")
  const airportBranch = (branches.value || []).find(
    (branch: BranchData) => branch.city === city.id && branch.code.startsWith('AA')
  );

  // Si no hay aeropuerto, buscar cualquier sucursal de esa ciudad
  const branch = airportBranch || (branches.value || []).find(
    (branch: BranchData) => branch.city === city.id
  );

  if (!branch) {
    // Fallback a la ruta simple si no hay sucursal
    return `/${city.id}`;
  }

  return `/${city.id}/buscar-vehiculos/lugar-recogida/${branch.code.toLowerCase()}/lugar-devolucion/${branch.code.toLowerCase()}/fecha-recogida/${reservationInitDay}/fecha-devolucion/${reservationEndDay}/hora-recogida/${reservationInitHour}/hora-devolucion/${reservationEndHour}`;
};

</script>