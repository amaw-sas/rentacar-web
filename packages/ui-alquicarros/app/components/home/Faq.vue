<template>
  <!--
    F1 faq — editorial 2-column restyle of the design's #faq. Left rail (sticky
    on desktop): heading + subtitle + brand-gradient WhatsApp CTA card. Right:
    the accordion. Copy is UNCHANGED — only the layout/skin moves to the reskin
    language (brand orange, rounded-2xl cards, lucide icons, max-w-7xl scale).

    The accordion iterates the real `faqs` from useData() (Supabase, shared
    across brands) — NOT the mockup copy. The FAQ JSON-LD schema is NOT emitted
    here: it stays in index.vue so it keeps reading the same `faqs` source
    (single source of truth).

    Gradients use the v4 bg-linear-to-* utility (F0 lesson: the broken v3 alias
    with custom @theme tokens renders background-image:none).
  -->
  <section id="faqs" class="bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid gap-10 lg:grid-cols-5 lg:gap-12 lg:items-start">
        <!-- Left rail — intro + CTA (sticky on desktop) -->
        <div class="lg:col-span-2 lg:sticky lg:top-24">
          <div class="h-1 w-10 rounded-full bg-brand-600 mb-4" aria-hidden="true" />
          <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">
            Preguntas Frecuentes
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Todo lo que necesitas saber sobre nuestro servicio de alquiler de carros.
          </p>

          <!-- WhatsApp CTA card — brand gradient. Dark heading + WhatsApp-green
               pill: white text on this orange fails WCAG AA (theme.css caveat),
               so the heading is gray-900 (~7.8:1). Button uses token bg-whatsapp
               (#25D366) + text-black = 10.6:1 (issue #284). -->
          <div class="mt-8 rounded-2xl bg-linear-to-br from-hero-from to-hero-to p-6 shadow-md">
            <p class="flex items-center gap-2 text-lg font-bold text-gray-900">
              <UIcon name="i-lucide-help-circle" class="size-6 shrink-0" aria-hidden="true" />
              ¿Tienes otra pregunta?
            </p>
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-whatsapp-hover"
            >
              <UIcon name="i-lucide-message-circle" class="size-4" aria-hidden="true" />
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>

        <!-- Right — accordion -->
        <div class="lg:col-span-3">
          <!-- hydrate-on-visible (not -interaction): on touch the first tap would be
               swallowed by interaction-hydration. rootMargin pre-hydrates early. -->
          <LazyUAccordion
            :hydrate-on-visible="{ rootMargin: '200px' }"
            :items="faqs"
            :ui="faqAccordionUIConfig"
          >
            <template #default="{ item }">
              <span class="flex items-center gap-3 text-base font-semibold text-gray-900">
                <UIcon name="i-lucide-help-circle" class="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span v-text="item.label" />
              </span>
            </template>
            <template #content="{ item }">
              <span class="block text-base text-gray-600 leading-relaxed pb-4 pl-11 pr-4" v-text="item.content" />
            </template>
          </LazyUAccordion>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()
const { faqs } = useData()

const faqAccordionUIConfig = {
  root: "space-y-3",
  item: "bg-white rounded-2xl border border-gray-200 last:border-b shadow-sm transition-shadow duration-200 hover:shadow-md data-[state=open]:border-brand-200 data-[state=open]:shadow-md px-2",
  trigger: "px-3 py-4",
  trailingIcon: "text-gray-400 group-data-[state=open]:text-brand-600 me-1",
}
</script>
