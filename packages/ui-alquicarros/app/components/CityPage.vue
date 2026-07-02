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
    <!-- Hero — mode-aware (F3): landing = marketing-only CTA, results = Searcher engine -->
    <CityHero :city="city" :mode="mode" />

    <!--
      Result Section (F3 wizard, Paso 10): en mode="results" monta el wizard guiado
      arrancando en Paso 2 (external-search: el Searcher es el de CityHero, no un
      hero interno). Reemplaza el grid CategorySelectionSection. Gate por `mode`
      (prop SSR-estable) — NO aparece en landing y no se pinta/desaparece al hidratar.
      El SEO de la ruta buscar-vehiculos no cambia: lo fija useSearchPageSEO en la
      página (canonical a /[city], sin robots noindex).
    -->
    <UPageSection
      id="seleccion-categorias"
      v-if="mode === 'results'"
      :ui="{ container: 'pt-0' }"
    >
      <ReservationWizard external-search />
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
/** components */
import ReservationWizard from '~/components/wizard/ReservationWizard.vue';

/** types */
import type { City } from '@rentacar-main/logic/utils';

const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

// Nota (F3 Paso 10): el bloque de resultados ahora es el wizard, gateado por
// `mode === 'results'` (prop SSR-estable). Ya NO hace falta el gate reactivo
// resultsActive (pending/filteredCategories/error vía onMounted) que sostenía el
// grid CategorySelectionSection: el wizard maneja sus estados pending/vacío/error
// internamente (StepVehicle), y el gate por `mode` evita el leak del store
// singleton al landing igual que antes (landing = mode 'landing').

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

// SEO schema (sin cambios): AggregateRating con los testimonios city + Product (#68).
const testimonios = props.city?.testimonials;
if (props.city?.name && testimonios) {
  useCityAggregateRating(props.city.name, testimonios);
}
if (props.city?.name && props.city?.id) {
  useCityProductSchema(props.city.name, props.city.id);
}
</script>
