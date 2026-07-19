<template>
  <div class="min-h-screen bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900 font-sans text-gray-800">
    <!-- Header semántico: evita hidratar UHeader/UNavigationMenu/Slideover en
         cada ruta pública. El panel móvil solo existe después del clic. -->
    <header class="h-16 bg-[#000073] z-40 py-4 px-4 lg:px-6 relative">
      <div class="h-full w-full max-w-7xl mx-auto flex items-center justify-between gap-3 sm:px-6 lg:px-8">
        <div class="md:hidden absolute inset-x-0 flex justify-center pointer-events-none">
          <NuxtLink to="/" aria-label="alquilatucarro" class="pointer-events-auto">
            <Logo cls="h-8 w-auto" />
          </NuxtLink>
        </div>

        <NuxtLink to="/" aria-label="alquilatucarro" class="hidden md:flex items-center gap-3">
          <IconsColombiaFlag cls="h-6 w-auto" />
          <Logo cls="h-10 w-auto" />
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
          <NuxtLink
            v-for="item in items"
            :key="item.label"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm font-semibold transition-colors"
            :class="item.active ? 'bg-white text-blue-900' : 'text-white hover:bg-white/10'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <button
          type="button"
          class="ml-auto lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Abrir menú de navegación"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-navigation-panel"
          @click="openMobileMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>

    <Teleport to="body">
      <div
        v-if="mobileMenuOpen"
        id="mobile-navigation-panel"
        class="fixed inset-0 z-50 bg-gradient-to-b from-[#000073] via-blue-800 to-blue-900"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        @keydown.esc="closeMobileMenu"
      >
        <button
          ref="mobileCloseButton"
          type="button"
          class="absolute top-3.5 right-3.5 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-[#00004d] text-white ring-1 ring-white/25 hover:bg-[#000073] transition-colors"
          aria-label="Cerrar menú"
          @click="closeMobileMenu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div class="flex min-h-full flex-col overflow-y-auto px-5">
          <NuxtLink
            to="/"
            aria-label="alquilatucarro"
            class="flex items-center justify-center pt-8 pb-6"
            @click="closeMobileMenu"
          >
            <Logo cls="h-9 w-auto" />
          </NuxtLink>

          <div class="flex flex-col gap-2.5 w-full max-w-[21rem] mx-auto pb-8">
            <NuxtLink
              v-for="item in mobileItems"
              :key="item.label"
              :to="item.to"
              class="flex items-center gap-3 w-full bg-white rounded-xl px-4 py-3.5 shadow-sm text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              @click="(event: MouseEvent) => onMobileNavClick(item, event)"
            >
              <span class="flex-1 text-left">{{ item.label }}</span>
              <svg class="size-4 text-gray-400 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </NuxtLink>

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              Llamar
            </a>
          </div>
        </div>
      </div>
    </Teleport>

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
            :to="`/${city.id}`"
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
interface SiteNavigationItem {
  label: string
  to: string
  active: boolean
}

const route = useRoute();

// El menú móvil se crea únicamente tras interacción. Además de ahorrar el
// grafo UHeader/Slideover inicial, conserva bloqueo de scroll, Escape y foco.
const mobileMenuOpen = ref(false);
const mobileCloseButton = ref<HTMLButtonElement | null>(null)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

async function openMobileMenu() {
  mobileMenuOpen.value = true
  await nextTick()
  mobileCloseButton.value?.focus({ preventScroll: true })
}

watch(mobileMenuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

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
const items = computed<SiteNavigationItem[]>(() => {
  const requisitosActive = route.hash === '#requisitos';
  const sedesActive = route.hash === '#sedes';
  const mensualidadesActive = route.path.startsWith('/tarifas');
  const blogActive = route.path.startsWith('/blog');
  const faqsActive = route.hash === '#faqs';
  return [
    { label: 'Requisitos', to: requisitosTo.value, active: requisitosActive },
    { label: 'Sedes', to: '#sedes', active: sedesActive },
    { label: 'Mensualidades', to: '/tarifas', active: mensualidadesActive },
    { label: 'Blog', to: '/blog', active: blogActive },
    { label: 'Preguntas frecuentes', to: faqsTo.value, active: faqsActive },
  ];
})

// Items para menú móvil (texto oscuro sobre fondo blanco)
const mobileItems = computed<SiteNavigationItem[]>(() => [
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
    label: 'Mensualidades',
    to: '/tarifas',
    active: route.path.startsWith('/tarifas'),
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

// Menú móvil: tel: con el número de la marca.
const telHref = computed(() => `tel:${(franchise.phone ?? '').replace(/[^\d+]/g, '')}`)

// Click en un item del menú móvil. Para destinos de ancla en página (#seccion)
// el scroll inmediato se pierde: el slideover sigue abierto y bloquea el scroll
// del body (scroll-lock del overlay). Cerramos primero y diferimos el scroll
// hasta que termine la animación de cierre y se libere el lock. Rutas reales
// (/blog, /tarifas) y ancla-a-home (/#faqs fuera de home) navegan normal.
function onMobileNavClick(item: SiteNavigationItem, e: MouseEvent) {
  closeMobileMenu()
  const to = item.to
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

// Compact build-time navigation: static/content routes never hydrate the
// reservation catalog merely to render the footer.
const { cities, cityCount } = usePublicCities();
const { franchise } = useAppConfig();

</script>
