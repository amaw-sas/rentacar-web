<template>
  <!-- Root keeps a DARK backdrop (de-blued to brand red) so pages that render
       text-white over it (hero, /pendiente, /sindisponibilidad) stay legible.
       The design's light body lands in F1, when each page gets its own section
       background (e.g. the red hero). Flipping to a light surface here would make
       that white text invisible. -->
  <div class="min-h-screen bg-linear-to-b from-brand-900 to-brand-950 font-sans text-gray-800">
    <!-- Announcement bar — top chrome, ABOVE the logo/menu row (design parity).
         It lives here rather than in index.vue because the layout is the only
         place that renders the header, and the bar must precede it. Gated to
         the home route: /reservas, city pages and /gana stay clean. Rendered in
         SSR (no client-only gate) so it occupies its space from first paint and
         does not shift the hero. -->
    <HomeAnnouncementBar v-if="isHome" />

    <!-- Header — golden parity: fondo BLANCO sticky, logo rojo, nav oscuro,
         CTA rojo "Reserva Ahora" + círculo WhatsApp (token bg-whatsapp / #25D366).
         Toggle icon color is owned by base.css (.iconify background-color, scoped
         to header.bg-white → dark) so it stays legible on the white header
         (ISSUE-001); the toggle `class` below is the dark fallback + hover state. -->
    <UHeader
      v-model:open="mobileMenuOpen"
      class="bg-white z-50 border-b border-gray-100 sticky top-0"
      mode="slideover"
      :toggle="{
        color: 'neutral',
        variant: 'ghost',
        size: 'xl',
        class: 'text-gray-800 hover:text-gray-900',
        'aria-label': 'Abrir menú de navegación'
      }"
      :ui="{
        root: 'h-16 lg:h-20',
        container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        content: 'bg-white',
        header: 'bg-white relative',
        body: 'bg-white'
      }"
     >
      <template #left>
        <NuxtLink to="/" :aria-label="franchise.name" class="flex-shrink-0">
          <Logo cls="h-7 lg:h-9 w-auto" variant="color" />
        </NuxtLink>
      </template>
      <!-- Nav desktop: links oscuros con hover rojo -->
      <UNavigationMenu
        :items="items"
        class="hidden lg:flex"
        :ui="{ link: 'text-sm font-medium' }"
      />
      <template #right>
        <div class="hidden lg:flex items-center gap-3">
          <!-- CTA principal de reserva -->
          <NuxtLink
            to="/reservas"
            class="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30 px-5 py-2 text-sm"
          >
            Reserva Ahora
          </NuxtLink>
        </div>
      </template>
      <!-- Menú móvil (slideover blanco) -->
      <template #body>
        <UButton
          icon="lucide:x"
          color="neutral"
          variant="ghost"
          size="lg"
          class="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Cerrar menú"
          @click="mobileMenuOpen = false"
        />
        <div class="flex flex-col items-center justify-center gap-6 flex-1 pt-12">
          <NuxtLink
            v-for="item in items"
            :key="`m-${item.label}`"
            :to="item.to"
            class="text-xl font-medium text-gray-800 hover:text-brand-600 transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <!-- CTAs móvil — mt-8 keeps the button block off the last nav link
             ("Contacto"), which otherwise sat flush (0px) under its glow (ISSUE-006). -->
        <div class="flex flex-col items-center gap-3 px-6 pb-8 mt-8">
          <NuxtLink
            to="/reservas"
            class="inline-flex w-full items-center justify-center text-center font-semibold rounded-full bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-600/25 px-8 py-3 text-base transition-all duration-200"
            @click="mobileMenuOpen = false"
          >
            Reserva Ahora
          </NuxtLink>
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-full items-center justify-center gap-2 font-semibold rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover px-8 py-3 text-base transition-all duration-200"
            @click="mobileMenuOpen = false"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
            WhatsApp
          </a>
        </div>
      </template>
    </UHeader>

    <main>
      <slot></slot>
    </main>

    <!-- Footer — golden parity: 4 columnas + barra negra. Conserva el wiring
         real: cities (v-for + deep-link), franchise.footerLinks,
         whatsapp/phone/email/socialmedia.

         Surface is #231015 (deep warm brown), the reference footer colour. The
         port had shipped #1A1A2E navy — the one thing that still differed from
         the reference below the partners band. The black bottom bar is
         unchanged. -->
    <footer class="bg-[#231015] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div class="grid grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
          <!-- Col 1: Logo + Quiénes somos + badge Google -->
          <div class="col-span-2 lg:col-span-3">
            <NuxtLink to="/" :aria-label="franchise.name" class="inline-block mb-4">
              <Logo cls="h-10 w-auto" variant="white" />
            </NuxtLink>
            <h3 class="text-white font-semibold font-heading text-sm uppercase tracking-wider mb-2">
              Quiénes somos
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed font-sans">
              Empresa colombiana de alquiler de carros con más de 10 años de experiencia y presencia en
              {{ cityCount }} ciudades. Flota nueva, sin anticipos y atención cercana para que viajes tranquilo.
            </p>
            <!-- Badge de confianza: rating de Google. Valores fijos 5,0 / 43 — reviewed 2026-06; sync con Reviews.vue -->
            <a
              href="https://www.google.com/maps?cid=11824841242913553901"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
              aria-label="Calificación 5,0 sobre 5, verificada en Google"
            >
              <svg class="w-7 h-7 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-white font-bold font-heading text-lg leading-none">5,0</span>
                  <div class="flex gap-0.5">
                    <svg v-for="n in 5" :key="`star-${n}`" class="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <p class="text-gray-400 text-xs mt-1">Verificadas en Google</p>
              </div>
            </a>
          </div>

          <!-- Col 2: Ciudades (data real, deep-link interno) -->
          <div class="col-span-2 lg:col-span-4">
            <h3 class="text-white font-semibold font-heading text-sm uppercase tracking-wider mb-4">
              Ciudades
            </h3>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <NuxtLink
                v-for="city in cities"
                :key="city.id"
                :to="`/${city.id}`"
                class="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {{ city.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- Col 3: Enlaces -->
          <div class="lg:col-span-2">
            <h3 class="text-white font-semibold font-heading text-sm uppercase tracking-wider mb-4">
              Enlaces
            </h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/#hero" class="text-gray-400 hover:text-white text-sm transition-colors">Inicio</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="fleetTo" class="text-gray-400 hover:text-white text-sm transition-colors">Flota</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="requisitosTo" class="text-gray-400 hover:text-white text-sm transition-colors">Requisitos</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="faqsTo" class="text-gray-400 hover:text-white text-sm transition-colors">FAQ</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="contactTo" class="text-gray-400 hover:text-white text-sm transition-colors">Contacto</NuxtLink>
              </li>
              <li v-for="(footerLink, index) in extraFooterLinks" :key="`fl-${index}`">
                <NuxtLink :to="footerLink.link" class="text-gray-400 hover:text-white text-sm transition-colors">{{ footerLink.label }}</NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Col 4: Contacto + Síguenos -->
          <div class="lg:col-span-3">
            <h3 class="text-white font-semibold font-heading text-sm uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul class="space-y-3">
              <li>
                <a :href="`tel:${franchise.phone.replace(/\s/g, '')}`" class="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                  <Icon name="lucide:phone" class="w-4 h-4 flex-shrink-0" />
                  {{ franchise.phone }}
                </a>
              </li>
              <li>
                <a :href="`mailto:${franchise.email}`" class="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                  <Icon name="lucide:mail" class="w-4 h-4 flex-shrink-0" />
                  {{ franchise.email }}
                </a>
              </li>
              <li>
                <a :href="franchise.whatsapp" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                  <Icon name="lucide:message-circle" class="w-4 h-4 flex-shrink-0" />
                  WhatsApp
                </a>
              </li>
              <li class="flex items-center gap-3 text-gray-400 text-sm">
                <Icon name="lucide:map-pin" class="w-4 h-4 flex-shrink-0" />
                Colombia
              </li>
            </ul>
            <!-- Redes sociales -->
            <p class="mt-5 mb-3 text-white font-semibold text-xs uppercase tracking-wider">Síguenos</p>
            <ul class="space-y-3">
              <li v-for="social in socialLinks" :key="social.label">
                <a
                  :href="social.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`Síguenos en ${social.label}`"
                  class="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <Icon :name="social.icon" class="w-4 h-4 flex-shrink-0" />
                  {{ social.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="bg-black">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <!-- Legales -->
          <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
            <li v-for="legal in legalLinks" :key="legal.link">
              <NuxtLink :to="legal.link" class="text-gray-400 hover:text-white text-sm transition-colors">{{ legal.label }}</NuxtLink>
            </li>
          </ul>
          <!-- Créditos -->
          <div class="text-center md:text-right">
            <p class="text-gray-400 text-sm">
              © 2026 {{ franchise.name }}. Todos los derechos reservados.
            </p>
            <p class="text-gray-500 text-sm mt-1">
              Elaborado por <span class="text-gray-300 font-medium">Estrategias</span>
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Widget chat (lazy loaded) -->
    <LazyChatWidget />
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
const route = useRoute();

// Estado del menú móvil slideover
const mobileMenuOpen = ref(false);

// La home (/) y todas las páginas de ciudad ([city] param) renderizan las
// secciones #requisitos y #faqs. En esas páginas enlazamos con ancla relativa
// para hacer scroll en sitio sin navegar (no se pierde la selección de ciudad);
// en el resto caemos a /#... (home). #sedes vive en el layout → siempre presente.
const hasInPageSections = computed(() => route.path === '/' || !!route.params.city);

// The announcement bar is home-only chrome (see the template comment above).
const isHome = computed(() => route.path === '/');

// Anclas en página: relativas en home/[city] (scroll sin perder ciudad),
// si no caen a /#... (home). Las secciones existen en el home Nuxt con estos ids.
const heroTo = computed(() => hasInPageSections.value ? '#hero' : '/#hero');
const fleetTo = computed(() => hasInPageSections.value ? '#fleet' : '/#fleet');
const citiesTo = computed(() => hasInPageSections.value ? '#cities' : '/#cities');
const requisitosTo = computed(() => hasInPageSections.value ? '#requisitos' : '/#requisitos');
const faqsTo = computed(() => hasInPageSections.value ? '#faqs' : '/#faqs');
const contactTo = computed(() => hasInPageSections.value ? '#contact' : '/#contact');

// Nav golden: links oscuros con hover rojo (header blanco). El item activo
// recibe el rojo de marca; estado por defecto gris oscuro.
const linkClass = (active: boolean) =>
  active
    ? "text-brand-600 hover:text-brand-600"
    : "text-gray-800 hover:text-brand-600";

// Items de navegación (orden y copy del golden Astro): Inicio · Flota ·
// Ciudades · Requisitos · FAQ · Contacto. Compartidos entre desktop y móvil.
const items = computed<NavigationMenuItem[]>(() => {
  const heroActive = route.path === '/' && (route.hash === '#hero' || route.hash === '');
  const fleetActive = route.hash === '#fleet';
  const citiesActive = route.hash === '#cities';
  const requisitosActive = route.hash === '#requisitos';
  const faqsActive = route.hash === '#faqs';
  const contactActive = route.hash === '#contact';
  return [
    { label: 'Inicio', to: heroTo.value, active: heroActive, class: linkClass(heroActive) },
    { label: 'Flota', to: fleetTo.value, active: fleetActive, class: linkClass(fleetActive) },
    { label: 'Ciudades', to: citiesTo.value, active: citiesActive, class: linkClass(citiesActive) },
    { label: 'Requisitos', to: requisitosTo.value, active: requisitosActive, class: linkClass(requisitosActive) },
    { label: 'FAQ', to: faqsTo.value, active: faqsActive, class: linkClass(faqsActive) },
    { label: 'Contacto', to: contactTo.value, active: contactActive, class: linkClass(contactActive) },
  ];
})

// Compact build-time navigation: static/content routes never hydrate the
// reservation catalog merely to render the footer.
const { cities, cityCount } = usePublicCities();
const { franchise } = useAppConfig();

// Footer (golden) — reparte franchise.footerLinks en dos zonas, conservando
// los enlaces reales:
//   - legalLinks  → barra negra inferior (términos / privacidad).
//   - extraFooterLinks → columna "Enlaces" (quejas, gana comisiones, blog…).
const LEGAL_PATHS = ['/terminos-condiciones', '/politica-privacidad'];
const legalLinks = computed(() =>
  franchise.footerLinks.filter((l) => LEGAL_PATHS.includes(l.link)),
);
const extraFooterLinks = computed(() =>
  franchise.footerLinks.filter((l) => !LEGAL_PATHS.includes(l.link)),
);

// Redes sociales (golden: ícono + nombre). Deriva de franchise.socialmedia,
// mapeando cada URL conocida a su ícono lucide. Sólo se muestran las presentes.
const SOCIAL_ICONS: { match: string; label: string; icon: string }[] = [
  { match: 'instagram', label: 'Instagram', icon: 'lucide:instagram' },
  { match: 'facebook', label: 'Facebook', icon: 'lucide:facebook' },
  { match: 'tiktok', label: 'TikTok', icon: 'lucide:music' },
  { match: 'youtube', label: 'YouTube', icon: 'lucide:youtube' },
];
const socialLinks = computed(() =>
  SOCIAL_ICONS.flatMap((s) => {
    const href = franchise.socialmedia.find((url: string) => url.includes(s.match));
    return href ? [{ label: s.label, icon: s.icon, href }] : [];
  }),
);

</script>
