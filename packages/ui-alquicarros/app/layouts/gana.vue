<template>
  <div class="min-h-screen bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900 font-sans text-gray-800">
    <!-- Header -->
    <UHeader
      v-model:open="mobileMenuOpen"
      class="bg-[#000073] z-50 py-4 md:py-6 px-6 border-none relative"
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
            <Logo cls="h-8 w-auto" />
          </NuxtLink>
        </div>
        <!-- Desktop: Bandera + Logo juntos como unidad -->
        <NuxtLink to="/" :aria-label="franchise.name" class="hidden md:flex items-center gap-3">
          <IconsColombiaFlag cls="h-6 w-auto" />
          <Logo cls="h-10 w-auto" />
        </NuxtLink>
      </template>
      <template #body>
        <!-- Botón cerrar manual -->
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
      <template #right>
        <div class="hidden lg:block">
          <UNavigationMenu color="neutral" :items="items" />
        </div>
      </template>
    </UHeader>

    <main>
      <slot></slot>
    </main>

    <!-- Widget chat (lazy loaded) -->
    <LazyChatWidget />
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const { franchise } = useAppConfig();

const route = useRoute();

// Estado del menú móvil slideover
const mobileMenuOpen = ref(false);

// Items para menú desktop
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    to: '/',
    class: "text-white hover:text-white hover:bg-white/10",
  },
  {
    label: 'Programa Referidos',
    to: '/gana',
    active: route.path.startsWith('/gana'),
    class: "text-white hover:text-white hover:bg-white/10",
  },
  {
    label: 'Preguntas frecuentes',
    to: '/gana#preguntas',
    class: "text-white hover:text-white hover:bg-white/10",
  },
])

// Items para menú móvil
const mobileItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    to: '/',
  },
  {
    label: 'Programa Referidos',
    to: '/gana',
    active: route.path.startsWith('/gana'),
  },
  {
    label: 'Preguntas frecuentes',
    to: '/gana#preguntas',
  },
])

</script>
