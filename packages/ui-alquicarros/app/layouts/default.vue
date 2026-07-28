<template>
  <!-- Root keeps a DARK backdrop (brand amber) so pages that render text-white
       over it (hero, /pendiente, /sindisponibilidad) stay legible. The design's
       light body lands per page (e.g. the orange hero). Flipping to a light
       surface here would make that white text invisible. -->
  <div class="min-h-screen bg-linear-to-b from-brand-900 to-brand-950 font-sans text-gray-800">
    <!-- Header — fondo BLANCO sticky, logo color, nav oscuro, CTA naranja
         "Reserva Ahora" + círculo WhatsApp (token bg-whatsapp / #25D366). -->
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
      <!-- Nav desktop: links oscuros con hover naranja -->
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
            class="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-brand-600 text-gray-900 hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30 px-5 py-2 text-sm"
          >
            Reserva Ahora
          </NuxtLink>
          <!-- WhatsApp — token bg-whatsapp (#25D366) + text-black (WCAG AA) -->
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-whatsapp text-black hover:bg-whatsapp-hover transition-all duration-200"
          >
            <Icon name="lucide:message-circle" class="w-5 h-5" />
          </a>
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
            class="text-xl font-medium text-gray-800 hover:text-brand-800 transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <!-- CTAs móvil — mt-8 keeps the button block off the last nav link
             ("Contacto"), which otherwise sat flush (0px) under its glow. -->
        <div class="flex flex-col items-center gap-3 px-6 pb-8 mt-8">
          <NuxtLink
            to="/reservas"
            class="inline-flex w-full items-center justify-center text-center font-semibold rounded-full bg-brand-600 text-gray-900 hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-600/25 px-8 py-3 text-base transition-all duration-200"
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

    <!-- Footer — fondo navy #1A1A2E, 4 columnas + barra negra.
         Conserva el wiring real: cities (v-for + deep-link), franchise.footerLinks,
         whatsapp/phone/email/socialmedia. El badge de rating de Google se OMITE:
         no hay data de reseñas sancionada para alquicarros (no fabricar). -->
    <footer class="bg-[#1A1A2E] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div class="grid grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
          <!-- Col 1: Logo + Quiénes somos -->
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
            <!-- #364: este párrafo era text-gray-500 y daba 4.34:1 sobre el
                 footer negro. En superficie oscura la regla se invierte —hay que
                 ACLARAR, no oscurecer—; gray-400 llega a 8.07:1. Medido con la
                 sonda de estilos computados, no deducido de la clase. -->
            <p class="text-gray-400 text-sm mt-1">
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

// Anclas en página: relativas en home/[city] (scroll sin perder ciudad),
// si no caen a /#... (home). Las secciones existen en el home Nuxt con estos ids.
const heroTo = computed(() => hasInPageSections.value ? '#hero' : '/#hero');
const fleetTo = computed(() => hasInPageSections.value ? '#fleet' : '/#fleet');
const citiesTo = computed(() => hasInPageSections.value ? '#cities' : '/#cities');
const requisitosTo = computed(() => hasInPageSections.value ? '#requisitos' : '/#requisitos');
const faqsTo = computed(() => hasInPageSections.value ? '#faqs' : '/#faqs');
const contactTo = computed(() => hasInPageSections.value ? '#contact' : '/#contact');

// Nav: links oscuros con hover naranja (header blanco). El item activo recibe el
// naranja de marca; estado por defecto gris oscuro.
const linkClass = (active: boolean) =>
  active
    ? "text-brand-800 hover:text-brand-800"
    : "text-gray-800 hover:text-brand-800";

// Items de navegación (orden y copy del diseño): Inicio · Flota · Ciudades ·
// Requisitos · FAQ · Contacto. Compartidos entre desktop y móvil.
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

// Footer — reparte franchise.footerLinks en dos zonas, conservando los enlaces
// reales:
//   - legalLinks  → barra negra inferior (términos / privacidad).
//   - extraFooterLinks → columna "Enlaces" (quejas, gana comisiones, blog…).
const LEGAL_PATHS = ['/terminos-condiciones', '/politica-privacidad'];
const legalLinks = computed(() =>
  franchise.footerLinks.filter((l) => LEGAL_PATHS.includes(l.link)),
);
const extraFooterLinks = computed(() =>
  franchise.footerLinks.filter((l) => !LEGAL_PATHS.includes(l.link)),
);

// Redes sociales (ícono + nombre). Deriva de franchise.socialmedia, mapeando
// cada URL conocida a su ícono lucide. Sólo se muestran las presentes.
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
