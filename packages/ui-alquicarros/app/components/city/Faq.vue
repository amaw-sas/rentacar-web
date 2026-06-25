<template>
  <!--
    F2 city FAQ — restyle of the design's #faq IN-PLACE, keeping the
    CITY-SPECIFIC data. The accordion iterates `useCityFAQs(city.name)`
    (pico y placa, El Dorado, kilometraje por región, etc.) — NOT the
    brand-level FAQ list that HomeFaq renders. Reusing HomeFaq here
    would regress the city's indexable SEO content.

    The FAQ JSON-LD schema is NOT emitted here: it stays in
    useCityFAQSchema (inside useCityPageSEO, in [city]/index.vue) so it
    keeps reading the same city FAQ source — single source of truth, untouched.

    Gradient uses the v4 bg-linear-to-* utility (F0 lesson: the broken v3
    alias with custom @theme tokens renders background-image:none).
  -->
  <section
    id="faqs"
    class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-12 md:py-16"
  >
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10 md:mb-12">
        <div
          class="h-1 w-10 rounded-full bg-brand-600 mb-4 mx-auto"
          aria-hidden="true"
        />
        <h2 class="heading-section text-3xl md:text-4xl text-gray-900 leading-tight">
          Preguntas frecuentes sobre alquiler en {{ city?.name }}
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Resolvemos tus dudas más comunes sobre el alquiler de carros en
          {{ city?.name }}.
        </p>
      </div>

      <LazyUAccordion
        hydrate-on-interaction
        :items="cityFAQs"
        :ui="faqAccordionUIConfig"
        class="max-w-3xl mx-auto"
      >
        <template #default="{ item }">
          <span
            class="block text-base font-semibold text-gray-900 px-4"
            v-text="item.label"
          />
        </template>
        <template #content="{ item }">
          <span
            class="block text-base text-gray-600 leading-relaxed py-3 px-4"
            v-text="item.content"
          />
        </template>
      </LazyUAccordion>

      <div class="mt-10 text-center">
        <p class="text-gray-600">
          ¿Tienes otra pregunta?{{ ' ' }}
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand-600 font-semibold hover:text-brand-700 underline underline-offset-2"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** types */
import type { City } from "@rentacar-main/logic/utils";

/** props */
const props = defineProps<{
  city: City;
}>();

const { franchise } = useAppConfig();

// City-specific FAQs (pico y placa, El Dorado, etc.) — same source the legacy
// #faqs used and the one useCityFAQSchema reads. NEVER the brand-level list.
const cityFAQs = props.city?.name ? useCityFAQs(props.city.name) : [];

const faqAccordionUIConfig = {
  item: "bg-white rounded-lg mb-2 px-2 pb-2 shadow-sm !border-0 !border-b-0",
  body: "!border-none",
  trailingIcon: "mr-2 transition-transform duration-200",
};
</script>
