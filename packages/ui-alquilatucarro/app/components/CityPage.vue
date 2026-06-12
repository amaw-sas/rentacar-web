<template>
  <UPage>
    <!-- Hero Section -->
    <div class="hero-section">
      <!-- Scroll target for "Probar otras fechas" / "Probar otra sucursal cercana" CTAs en UnableCategoryCard -->
      <div id="searcher" aria-hidden="true" class="scroll-mt-20" />
      <UPageHero
        orientation="horizontal"
      >
      <template #title>
        <!-- UPageHero renderiza <h1> para slot #title — usar solo phrasing content (span, no div) -->
        <span class="block text-white text-center uppercase font-bold lg:leading-[1.2] lg:mt-20" style="letter-spacing: -0.025em;">
          <span class="block whitespace-nowrap text-xl md:text-2xl lg:text-[26px]/[1.17]!" style="letter-spacing: -0.025em;">
            ALQUILER DE CARROS EN
          </span>
          {{ ' ' }}
          <span class="flex flex-row justify-center items-baseline gap-2 text-3xl md:text-4xl lg:text-[46px]/[1.17]! lg:whitespace-nowrap" style="letter-spacing: -0.025em;">
            <span class="size-8 md:size-10 lg:size-9" aria-hidden="true"></span>
            {{ city?.name }}
            <!-- Pin inerte: acción copy-to-WhatsApp es secreta (operadores, no clientes).
                 <span> aria-hidden no-focusable → fuera del accessible name del <h1>
                 (WCAG 2.5.3) y sin filtrar el secreto vía aria-label/title. Issue #41. -->
            <span
              aria-hidden="true"
              @click="copySearchToWhatsapp"
            >
              <LocationIcon cls="text-red-600 size-8 md:size-10 lg:size-9 translate-y-1" />
            </span>
          </span>
          {{ ' ' }}
          <span class="block text-xl md:text-2xl lg:text-[26px]/[1.17]! text-white colombia-sweep" style="letter-spacing: 0.025em;">Colombia</span>
        </span>
      </template>
      <template #body>
        <!-- Solo visible en mobile -->
        <div class="text-center justify-items-center -mt-4 -mb-4 lg:hidden">
          <div class="mb-1 text-white text-xl">
            Consulta disponibilidad y precios
          </div>
          <p class="text-white text-sm">
            Elige ciudades, fechas y horarios y renta un vehículo por días, semanas o el tiempo que necesites
          </p>
        </div>
        <!-- Carro: columna izquierda bajo el titular, SOLO desktop (lg+). En móvil
             no se descarga ni renderiza — hero móvil intacto. -->
        <ImagesHeroCar class="lg:-mt-2" />
      </template>
      <template #default>
        <!-- Contenedor para texto + formulario alineados - solo desktop -->
        <div class="hidden lg:flex lg:flex-col lg:items-center w-full">
          <div class="w-4/6 text-center mb-2">
            <div class="mb-1 text-white text-xl">
              Consulta disponibilidad y precios
            </div>
            <p class="text-white text-sm">
              Elige ciudades, fechas y horarios y renta un vehículo por días, semanas o el tiempo que necesites
            </p>
          </div>
          <!-- Wrapper con altura fija para prevenir layout shift durante hidratación -->
          <div class="h-[410px] w-full">
            <ClientOnly>
              <Searcher />
              <template #fallback>
                <PlaceholdersSearcher />
              </template>
            </ClientOnly>
          </div>
        </div>
        <!-- Buscador solo en mobile/tablet -->
        <div class="lg:hidden">
          <!-- Wrapper con min-height ajustado al form compacto (~248px natural) -->
          <div class="min-h-[250px]">
            <ClientOnly>
              <Searcher />
              <template #fallback>
                <PlaceholdersSearcher />
              </template>
            </ClientOnly>
          </div>
        </div>
      </template>
    </UPageHero>
    </div>

    <!-- Result Section -->
    <UPageSection
      id="seleccion-categorias"
      v-if="pendingSearch || filteredCategories.length > 0 || searchError"
      :ui="{ container: 'pt-0' }"
    >
      <CategorySelectionSection />
    </UPageSection>

    <!-- Description Section -->
    <section id="descripcion" class="bg-white text-black py-4 md:py-12 px-4 md:px-8">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-8">
        <div class="md:self-start flex justify-center h-[300px] md:h-[400px]">
          <LazyImagesCiudadesChica :city-name="city?.name" />
        </div>
        <div class="flex flex-col gap-0 text-center font-extrabold">
          <div class="text-red-600 text-xl md:text-3xl">
            En {{ franchise.shortname }}
          </div>
          <div class="text-red-600 text-3xl md:text-5xl" v-text="city?.name"></div>
          <p class="text-black text-2xl md:text-4xl mb-0">
            la libertad <br />
            de moverte <br />
            a tu manera <br />
            es realidad
          </p>
          <div class="flex items-center w-full my-2 md:my-4">
            <div class="flex-grow border-t border-gray-300"></div>
            <div class="mx-4 w-3 h-3 bg-black rotate-45"></div>
            <div class="flex-grow border-t border-gray-300"></div>
          </div>
        </div>
        <div>
          <p
            class="text-black text-center font-semibold"
            v-text="city?.description"
          ></p>
        </div>
      </div>
    </section>

    <!-- Benefits Section (adds ~100 words for SEO) -->
    <section id="ventajas" class="bg-gray-50 text-black py-8 md:py-12 px-4 md:px-8">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
          <span class="text-red-700">Ventajas de alquilar carro</span>
          <span class="text-black"> en {{ city?.name }}</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm">
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1">Precios transparentes</h3>
              <p class="text-gray-600 text-sm">Sin cargos ocultos ni sorpresas. El precio que ves incluye seguro básico, impuestos y kilometraje ilimitado para recorrer {{ city?.name }} y sus alrededores.</p>
            </div>
          </div>
          <div class="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm">
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">🚗</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1">Flota variada</h3>
              <p class="text-gray-600 text-sm">Desde económicos hasta SUVs y camionetas. Encuentra el vehículo perfecto para tu viaje en {{ city?.name }}, ya sea por negocios, turismo o familia.</p>
            </div>
          </div>
          <div class="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm">
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">📍</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1">Entrega flexible</h3>
              <p class="text-gray-600 text-sm">Recoge y devuelve tu carro en diferentes puntos de {{ city?.name }}. Aeropuerto, centro de la ciudad o donde te resulte más cómodo.</p>
            </div>
          </div>
          <div class="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm">
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-2xl">⭐</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1">Atención personalizada</h3>
              <p class="text-gray-600 text-sm">Soporte en español las 24 horas. Te asesoramos sobre rutas, destinos y todo lo que necesites saber para moverte en {{ city?.name }}.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Monthly Rates Teaser -->
    <MonthlyRatesTeaser />

    <!-- Delivery Points Section -->
    <section v-if="cityBranches.length > 0" id="puntos-entrega" class="bg-gray-50 text-black py-8 md:py-12 px-4 md:px-8">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-6">
          <span class="text-red-700">Puntos de entrega</span> <span class="text-black">para alquiler de carros en {{ city?.name }}</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="branch in cityBranches"
            :key="branch.code"
            class="flex flex-col bg-white px-4 py-4 rounded-lg shadow-sm text-left"
          >
            <div class="flex items-center gap-2 mb-2">
              <LocationIcon cls="text-red-600 size-5 flex-shrink-0" />
              <span class="font-semibold text-gray-900">{{ branch.name }}</span>
            </div>
            <div v-if="branch.schedule" class="flex items-start gap-2 text-sm text-gray-600">
              <ClockIcon cls="text-gray-400 size-4 flex-shrink-0 mt-0.5" />
              <span>{{ branch.schedule }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Expanded Content Sections (only for cities with rich content) -->
    <template v-if="hasExpandedContent && expandedContent">
      <!-- Intro Section -->
      <section id="introduccion" class="bg-white text-black py-8 md:py-12 px-4 md:px-8">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-center mb-6">
            <span class="text-red-700">Explora {{ city?.name }}</span>
            <span class="text-black"> con tu carro de alquiler</span>
          </h2>
          <p class="text-gray-700 text-base md:text-lg leading-relaxed text-justify">
            {{ expandedContent.intro }}
          </p>
        </div>
      </section>

      <!-- Destinations Section -->
      <section id="destinos" class="bg-gray-50 text-black py-8 md:py-12 px-4 md:px-8">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
            <span class="text-red-700">Destinos para recorrer con carro rentado</span>
            <span class="text-black"> desde {{ city?.name }}</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="destination in expandedContent.destinations"
              :key="destination.name"
              class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-xl font-bold text-gray-900">{{ destination.name }}</h3>
                <span class="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                  {{ destination.time }}
                </span>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">{{ destination.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Driving Tips Section -->
      <section id="consejos-conduccion" class="bg-white text-black py-8 md:py-12 px-4 md:px-8">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
            <span class="text-red-700">Consejos</span>
            <span class="text-black"> para alquilar carro en {{ city?.name }}</span>
          </h2>
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span class="text-red-600 font-bold text-lg">🚗</span>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 mb-1">Pico y Placa</h3>
                <p class="text-gray-600 text-sm">{{ expandedContent.drivingTips.picoPlaca }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span class="text-red-600 font-bold text-lg">💰</span>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 mb-1">Peajes</h3>
                <p class="text-gray-600 text-sm">{{ expandedContent.drivingTips.tolls }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span class="text-red-600 font-bold text-lg">🅿️</span>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 mb-1">Parqueaderos</h3>
                <p class="text-gray-600 text-sm">{{ expandedContent.drivingTips.parking }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Best Season Section -->
      <section id="mejor-temporada" class="bg-gray-50 text-black py-8 md:py-12 px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-2xl md:text-3xl font-bold mb-6">
            <span class="text-red-700">Mejor época</span> <span class="text-black">para alquilar carro y viajar a {{ city?.name }}</span>
          </h2>
          <p class="text-gray-700 text-base md:text-lg leading-relaxed">
            {{ expandedContent.bestSeason }}
          </p>
        </div>
      </section>
    </template>

    <!-- Related Cities Section (Internal Linking) -->
    <section v-if="relatedCities.length > 0" id="ciudades-cercanas" class="bg-white text-black py-8 md:py-12 px-4 md:px-8">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-6">
          <span class="text-red-700">Alquiler de carros</span>
          <span class="text-black"> en ciudades cercanas</span>
        </h2>
        <p class="text-gray-600 text-center mb-8">
          ¿Planeas un viaje más largo? También ofrecemos alquiler de vehículos en estas ciudades cercanas a {{ city?.name }}.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            v-for="related in relatedCities"
            :key="related.id"
            :to="`/${related.id}`"
            class="group flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-red-50 hover:shadow-md transition-all duration-200"
          >
            <LocationIcon cls="text-red-600 size-8 mb-2 group-hover:scale-110 transition-transform" />
            <span class="font-semibold text-gray-900 group-hover:text-red-700">{{ related.name }}</span>
            <span class="text-sm text-gray-500">{{ related.distance }} en carro</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <UPageSection id="faqs" class="bg-gray-100 text-black">
      <div class="max-w-7xl mx-auto px-1 sm:px-2 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-6">
          <span class="text-red-700">Preguntas frecuentes</span>{{ ' ' }}<span class="text-black">sobre alquiler de carros en {{ city?.name }}</span>
        </h2>
        <p class="text-base text-center mb-4">
          Resolvemos tus dudas más comunes sobre el alquiler de carros en {{ city?.name }}.
        </p>
        <UAccordion :items="cityFAQs" :ui="faqAccordionUIConfig" class="max-w-4xl mx-auto">
          <template #default="{ item }">
            <span class="block text-base font-medium text-gray-800 px-4" v-text="item.label"></span>
          </template>
          <template #content="{ item }">
            <span class="block text-base text-gray-600 py-3 bg-gray-50 px-4 rounded-lg" v-text="item.content"></span>
          </template>
        </UAccordion>
      </div>
    </UPageSection>

    <!-- Testimonials Section -->
    <section id="testimonios" class="bg-white text-black py-12 md:py-20 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-4">
          <span class="text-red-700">Opiniones de clientes que rentaron carros</span> <span class="text-black">en {{ city?.name }}</span>
        </h2>
        <p class="text-black text-center mb-8">Descubre por qué somos la opción preferida para alquilar carros en {{ city?.name }}. Nuestros clientes destacan nuestra atención, precios competitivos y la facilidad para explorar.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="testimonio in testimonios"
            :key="testimonio.user.name"
            class="border border-gray-100 rounded-lg bg-gray-50 shadow-sm p-5 md:p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <UUser
              size="3xl"
              v-bind="testimonio.user"
              :ui="testimonioUserUIConfig"
              loading="lazy"
            >
              <template #avatar>
                <ImagesAvatar :avatar="testimonio.user.avatar" />
              </template>
            </UUser>
            <p class="mt-4 text-gray-700">{{ testimonio.quote }}</p>
            <div class="flex flex-row space-x-2 mt-4">
              <StarIcon v-for="i in [1,2,3,4,5]" :key="i" cls="text-yellow-500 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </UPage>
</template>

<script setup lang="ts">
/** types */
import type { City } from '@rentacar-main/logic/utils';

/** imports */
import { defineAsyncComponent } from "vue";
import {
  IconsStarIcon as StarIcon,
  IconsLocationIcon as LocationIcon,
  IconsClockIcon as ClockIcon,
} from "#components";

/** refs */
const { franchise } = useAppConfig();
const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

/** stores - lazy initialization to avoid SSR Pinia error */
const pendingSearch = ref(false);
const filteredCategories = ref<any[]>([]);
const searchError = ref<unknown>(null);

// Initialize store only on client side after mount
onMounted(() => {
  const storeSearch = useStoreSearchData();
  const refs = storeToRefs(storeSearch);

  // Sync refs. searchError keeps the result-section mounted when filteredCategories
  // is empty (e.g. plugin-empty admin data) so error UX still surfaces — issue #10.
  watch(() => refs.pending.value, (val) => pendingSearch.value = val, { immediate: true });
  watch(() => refs.filteredCategories.value, (val) => filteredCategories.value = val, { immediate: true });
  watch(() => refs.error.value, (val) => searchError.value = val, { immediate: true });
});

/** props */
const props = defineProps<{
  city: City;
}>();

const cityBranches = computed(() =>
  (branches.value || []).filter((branch: { city: string }) => branch.city === props.city?.id)
);

const testimonios: Testimonial[] | undefined = props.city?.testimonials;

// Get expanded content for major cities (Bogotá, Medellín)
const expandedContent = props.city?.name ? useCityExpandedContent(props.city.name) : null;
const hasExpandedContent = props.city?.name ? hasCityExpandedContent(props.city.name) : false;

// Get related cities for internal linking
const relatedCities = props.city?.id ? useRelatedCities(props.city.id) : [];

// Add AggregateRating schema for city-specific testimonials (shows stars in Google SERPs)
if (props.city?.name && testimonios) {
  useCityAggregateRating(props.city.name, testimonios)
}

// Add Product Schema for SEO (shows vehicle offers in Google SERPs)
if (props.city?.name && props.city?.id) {
  useCityProductSchema(props.city.name, props.city.id)
}

// Get city-specific FAQs for UI display
const cityFAQs = props.city?.name ? useCityFAQs(props.city.name) : []

const testimonioUserUIConfig = {
  name: "text-black",
  description: "text-gray-600",
};

const faqAccordionUIConfig = {
  item: "bg-white rounded-lg mb-2 px-2 pb-2 !border-0 !border-b-0",
  body: "!border-none",
  trailingIcon: "mr-2 transition-transform duration-200",
};

const { copyToWhatsapp: copySearchToWhatsapp } = useShareSearchParams();

const Searcher = defineAsyncComponent(() => import("./Searcher.vue"));
const PlaceholdersSearcher = defineAsyncComponent(
  () => import("./Placeholders/Searcher.vue")
);
const LazyImagesCiudadesChica = defineAsyncComponent(
  () => import("./Images/Ciudades/Chica.vue")
);

</script>

