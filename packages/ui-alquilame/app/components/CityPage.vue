<template>
  <!--
    F2 city landing — orquestador. Las secciones city viven en app/components/city/*
    (hero/intro/seo/delivery/faq/testimonios, datos city-specific) y el marketing
    puro se reusa de F1 (home/*). El bloque de resultados (#seleccion-categorias)
    se preserva INTACTO: esta misma página la renderiza la ruta buscar-vehiculos,
    y muestra resultados cuando hay params de búsqueda. Engine (Searcher, #41, #109)
    y SEO (useCityProductSchema #68, useCityFAQSchema vía useCityPageSEO)
    sin cambios de comportamiento.
  -->
  <UPage>
    <!-- Hero — mode-aware (F3): landing = marketing-only CTA, results = Searcher engine -->
    <CityHero :city="city" :mode="mode" />

    <!-- Result Section — condicional, PRESERVADO intacto (engine) -->
    <UPageSection
      id="seleccion-categorias"
      v-if="resultsActive"
      :ui="{ container: 'pt-0' }"
    >
      <CategorySelectionSection />
    </UPageSection>

    <!-- Intro city (descripcion + introduccion) -->
    <CityIntro :city="city" :expanded-content="expandedContent" />

    <!--
      Marketing F1 genérico (fleet): SCEN-001 — oculto en una página de RESULTADOS
      (mode === 'results'). Gate por `mode` (prop conocido en SSR) y NO por el
      estado onMounted, para que el marketing NO se pinte en SSR y desaparezca al
      hidratar (evita flash/CLS). La ruta buscar-vehiculos siempre lleva búsqueda
      activa, así que mode === 'results' ⇔ resultados. Landing siempre lo muestra.
    -->
    <HomeFleet v-if="mode !== 'results'" />

    <!-- Contenido SEO city (ventajas/destinos/consejos/temporada/ciudades-cercanas) -->
    <CitySeoContent
      :city="city"
      :expanded-content="expandedContent"
      :related-cities="relatedCities"
    />

    <!-- Puntos de entrega (branches reales) -->
    <CityDeliveryPoints :city-branches="cityBranches" :city="city" />

    <!-- Marketing F1 genérico (how-it-works + requirements): mismo gate SSR-estable -->
    <HomeHowItWorks v-if="mode !== 'results'" />
    <HomeRequirements v-if="mode !== 'results'" />

    <!-- Reseñas city (city.testimonials) -->
    <CityTestimonios :city="city" />

    <!-- FAQ city (useCityFAQs) -->
    <CityFaq :city="city" />

    <!--
      Contacto F1 — "Reserva Ahora" destino mode-aware (F3):
        - results: ancla in-page al engine del hero city (#searcher), donde el
          form sí existe (los CTAs de UnableCategoryCard también anclan ahí).
        - landing: no hay form en #searcher → navega a la página /reservas.
    -->
    <HomeContact :reserve-anchor="mode === 'landing' ? '/reservas' : '#searcher'" />
  </UPage>
</template>

<script setup lang="ts">
/** types */
import type { City } from '@rentacar-main/logic/utils';

const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

/** Result-section gating — lazy store init to avoid SSR Pinia error.
    searchError keeps the result-section mounted when filteredCategories is empty
    (plugin-empty admin data) so error UX still surfaces — issue #10. */
const pendingSearch = ref(false);
const filteredCategories = ref<unknown[]>([]);
const searchError = ref<unknown>(null);

onMounted(() => {
  const storeSearch = useStoreSearchData();
  const refs = storeToRefs(storeSearch);
  watch(() => refs.pending.value, (val) => (pendingSearch.value = val), { immediate: true });
  watch(() => refs.filteredCategories.value, (val) => (filteredCategories.value = val), { immediate: true });
  watch(() => refs.error.value, (val) => (searchError.value = val), { immediate: true });
});

/** A search is "active" only on a RESULTS page (mode === 'results') AND when
    results are pending, present, or errored. The Pinia store is a SPA singleton,
    so WITHOUT the mode guard a store still populated from a prior search leaks the
    results block (#seleccion-categorias) onto a landing /[city] after client-side
    navigation. The gate is symmetric with the marketing v-if below (SCEN-001):
    landing never shows results; results mode never shows generic marketing. */
const resultsActive = computed(
  () =>
    props.mode === 'results' &&
    (pendingSearch.value || filteredCategories.value.length > 0 || !!searchError.value),
);

/** props */
const props = withDefaults(
  defineProps<{
    city: City;
    /**
     * Hero engine mode (F3 — issue #112). Forwarded to <CityHero :mode> and used
     * to pick the city HomeContact reserve target. Each page file passes it
     * explicitly: 'landing' for [city]/index.vue, 'results' for buscar-vehiculos.
     * Default 'results' keeps the engine present if a caller forgets (fail-safe).
     */
    mode?: 'landing' | 'results';
  }>(),
  { mode: 'results' },
);

const cityBranches = computed(() =>
  (branches.value || []).filter((branch: { city: string }) => branch.city === props.city?.id)
);

// Expanded content (major cities) + related cities — pasados a los componentes city/*.
const expandedContent = props.city?.name ? useCityExpandedContent(props.city.name) : null;
const relatedCities = props.city?.id ? useRelatedCities(props.city.id) : [];

// SEO schema: Product (#68). The fabricated AggregateRating (hardcoded 4.9★) was
// removed — the visible city testimonials (city.testimonials) stay untouched.
if (props.city?.name && props.city?.id) {
  useCityProductSchema(props.city.name, props.city.id);
}
</script>
