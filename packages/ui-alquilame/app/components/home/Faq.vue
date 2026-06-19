<template>
  <!--
    F1 faq — restyle of the design's #faq. The accordion iterates the real `faqs`
    from useData() (Supabase, shared across brands) — NOT the mockup copy. The
    FAQ JSON-LD schema is NOT emitted here: it stays in index.vue so it keeps
    reading the same `faqs` source (single source of truth).

    Gradient uses the v4 bg-linear-to-* utility (F0 lesson).
  -->
  <section id="faqs" class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-12 md:py-16">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <div class="h-1 w-10 rounded-full bg-red-600 mb-4 mx-auto" aria-hidden="true" />
        <h2 class="font-heading text-3xl md:text-4xl text-gray-900">
          Preguntas Frecuentes
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Todo lo que necesitas saber sobre nuestro servicio de alquiler de carros.
        </p>
      </div>

      <!-- hydrate-on-visible (not -interaction): on touch the first tap would be
           swallowed by interaction-hydration. rootMargin pre-hydrates early. -->
      <LazyUAccordion
        :hydrate-on-visible="{ rootMargin: '200px' }"
        :items="faqs"
        :ui="faqAccordionUIConfig"
        class="max-w-3xl mx-auto"
      >
        <template #default="{ item }">
          <span class="block text-base font-semibold text-gray-900 px-4" v-text="item.label" />
        </template>
        <template #content="{ item }">
          <span class="block text-base text-gray-600 leading-relaxed py-3 px-4" v-text="item.content" />
        </template>
      </LazyUAccordion>

      <div class="mt-10 text-center">
        <p class="text-gray-600">
          ¿Tienes otra pregunta?{{ ' ' }}
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="text-red-600 font-semibold hover:text-red-700 underline underline-offset-2"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()
const { faqs } = useData()

const faqAccordionUIConfig = {
  item: "bg-white rounded-lg mb-2 px-2 pb-2 shadow-sm !border-0 !border-b-0",
  body: "!border-none",
  trailingIcon: "mr-2 transition-transform duration-200",
}
</script>
