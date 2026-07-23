<template>
  <!--
    F2 city landing — orquestador. Las secciones city viven en app/components/city/*
    (hero/intro/seo/delivery/faq/testimonios, datos city-specific) y el marketing
    puro se reusa de F1 (home/*). SEO (useCityProductSchema #68, useCityFAQSchema
    vía useCityPageSEO) sin cambios de comportamiento. El schema de
    aggregate-rating se eliminó (#312): calificaciones fabricadas + markup
    self-serving inelegible para Google.

    SCEN-322-X06: el bloque de resultados (la sección del grid de categorías)
    era código muerto — buscar-vehiculos ya no existe en alquilame (routing
    independence) y el único consumidor de CityPage es pages/[city]/index.vue
    con mode="landing". Eliminado para que las 19 landings de ciudad no
    descarguen el motor de reservas (el grid vive en /reservas). NO
    reintroducir imports estáticos del motor aquí.
  -->
  <UPage>
    <!-- Hero — mode-aware (F3): landing = marketing-only CTA, results = Searcher engine -->
    <CityHero :city="city" :mode="mode" />

    <!--
      Marketing F1 genérico (fleet): SCEN-001 — oculto en una página de RESULTADOS
      (mode === 'results'). Gate por `mode` (prop conocido en SSR) y NO por el
      estado onMounted, para que el marketing NO se pinte en SSR y desaparezca al
      hidratar (evita flash/CLS). La ruta buscar-vehiculos siempre lleva búsqueda
      activa, así que mode === 'results' ⇔ resultados. Landing siempre lo muestra.
    -->
    <HomeFleet v-if="mode !== 'results'" />

    <!-- Separator 1 — the city-identity sentence, between Flota and Cómo Funciona. -->
    <CityPullQuote v-if="pullQuotes[0]" :quote="pullQuotes[0]" />

    <!-- Marketing F1 genérico (how-it-works + requirements): mismo gate SSR-estable -->
    <HomeHowItWorks v-if="mode !== 'results'" />

    <!--
      Bloques de marketing que ya tenía el home y que el diseño de referencia
      también pone en sus páginas de ciudad. Mismo orden que el home
      (Cómo Funciona → Estadísticas → ¿Por qué?) y mismo gate SSR-estable: una
      página de RESULTADOS es una vista de búsqueda, no un folleto.
      A ValueProps se le pasa la ciudad para que el h2 la nombre.
    -->
    <HomeStats v-if="mode !== 'results'" />
    <HomeValueProps v-if="mode !== 'results'" :city="city" />

    <!-- Separator 2 — the pickup + places sentence, a breather before delivery. -->
    <CityPullQuote v-if="pullQuotes[1]" :quote="pullQuotes[1]" />

    <!-- Puntos de entrega (branches reales) -->
    <CityDeliveryPoints :city-branches="cityBranches" :city="city" />

    <HomeRequirements v-if="mode !== 'results'" />

    <!-- Reseñas city (useCityTestimonials, #322 PR10) -->
    <CityTestimonios :city="city" />

    <!-- Separator 3 — the closing line, between Opiniones (Google) and Ventajas.
         Led by the city name so the closer reads "Bogotá — <closing line>". -->
    <CityPullQuote v-if="pullQuotes[2]" :quote="pullQuotes[2]" :lead="city?.name" />

    <!-- Contenido SEO city (ventajas/destinos/consejos/temporada/ciudades-cercanas) -->
    <CitySeoContent
      :city="city"
      :expanded-content="expandedContent"
      :related-cities="relatedCities"
    />

    <!-- FAQ city (useCityFAQs) -->
    <CityFaq :city="city" />

    <!--
      Contacto F1 — "Reserva Ahora" destino mode-aware (F3):
        - results: ancla in-page al engine del hero city (#searcher), donde el
          form sí existe (los CTAs de UnableCategoryCard también anclan ahí).
        - landing: no hay form en #searcher → navega a la página /reservas.
    -->
    <HomeContact :reserve-anchor="mode === 'landing' ? '/reservas' : '#searcher'" />

    <!-- Empresas Aliadas cierra la página, igual que en el home. -->
    <HomePartners v-if="mode !== 'results'" />
  </UPage>
</template>

<script setup lang="ts">
/** types */
import type { City } from '@rentacar-main/logic/utils';
import { cityPullQuotes } from '@rentacar-main/logic/utils';

const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

// SCEN-322-X06: el gate reactivo de resultados y su cableado de store
// (pending / categorías filtradas / error) se eliminaron junto con el bloque de
// resultados — ningún caller pasa mode="results" (grep: solo
// pages/[city]/index.vue con mode="landing"). El prop `mode` se conserva porque
// CityHero y los gates de marketing/HomeContact lo consumen.

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

// Editorial pull-quote separators, derived from the city's own description
// (identity / pickup / closing sentences; the sales sentence is dropped). This
// replaces the removed #descripcion poster — the same indexable text, split
// into three white breathers between sections. See cityPullQuotes util.
const pullQuotes = computed(() => cityPullQuotes(props.city?.description));

// SEO schema: Product (#68). AggregateRating eliminado (#312 — datos fabricados).
if (props.city?.name && props.city?.id) {
  useCityProductSchema(props.city.name, props.city.id);
}
</script>
