<template>
  <!--
    F2 city landing — orquestador. Las secciones city viven en app/components/city/*
    (hero/intro/seo/delivery/faq/testimonios, datos city-specific) y el marketing
    puro se reusa de F1 (home/*). El bloque de resultados (#seleccion-categorias)
    se preserva INTACTO: esta misma página la renderiza la ruta buscar-vehiculos,
    y muestra resultados cuando hay params de búsqueda. Engine (Searcher, #41, #109)
    y SEO (useCityProductSchema #68, useCityFAQSchema vía useCityPageSEO,
    useCityAggregateRating) sin cambios de comportamiento.
  -->
  <UPage>
    <!-- Hero (Searcher + pin #41 + #searcher target preservados) -->
    <CityHero :city="city" />

    <!-- Result Section — condicional, PRESERVADO intacto (engine) -->
    <UPageSection
      id="seleccion-categorias"
      v-if="pendingSearch || filteredCategories.length > 0 || searchError"
      :ui="{ container: 'pt-0' }"
    >
      <CategorySelectionSection />
    </UPageSection>

    <!-- Intro city (descripcion + introduccion) -->
    <CityIntro :city="city" :expanded-content="expandedContent" />

    <!-- Marketing F1 (nuevo): fleet -->
    <HomeFleet />

    <!-- Contenido SEO city (ventajas/destinos/consejos/temporada/ciudades-cercanas) -->
    <CitySeoContent
      :city="city"
      :expanded-content="expandedContent"
      :related-cities="relatedCities"
    />

    <!-- Puntos de entrega (branches reales) -->
    <CityDeliveryPoints :city-branches="cityBranches" :city="city" />

    <!-- Marketing F1 (nuevo): how-it-works + requirements -->
    <HomeHowItWorks />
    <HomeRequirements />

    <!-- Reseñas city (city.testimonials) -->
    <CityTestimonios :city="city" />

    <!-- FAQ city (useCityFAQs) -->
    <CityFaq :city="city" />

    <!-- Contacto F1 — "Reserva Ahora" ancla al hero city (#searcher), no al #hero del home -->
    <HomeContact reserve-anchor="#searcher" />
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

/** props */
const props = defineProps<{
  city: City;
}>();

const cityBranches = computed(() =>
  (branches.value || []).filter((branch: { city: string }) => branch.city === props.city?.id)
);

// Expanded content (major cities) + related cities — pasados a los componentes city/*.
const expandedContent = props.city?.name ? useCityExpandedContent(props.city.name) : null;
const relatedCities = props.city?.id ? useRelatedCities(props.city.id) : [];

// SEO schema (sin cambios): AggregateRating con los testimonios city + Product (#68).
const testimonios = props.city?.testimonials;
if (props.city?.name && testimonios) {
  useCityAggregateRating(props.city.name, testimonios);
}
if (props.city?.name && props.city?.id) {
  useCityProductSchema(props.city.name, props.city.id);
}
</script>
