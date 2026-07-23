<template>
  <!--
    City pull-quote — a COMPACT white strip between sections. One short sentence
    of the city's description, centred, with a small red closing quotation mark
    to the RIGHT. Deliberately slim: small text, light padding, so it reads as a
    thin breather (2–3 lines), not a full block. The glyph is aria-hidden; the
    <blockquote> carries the real, indexable text.
  -->
  <section class="bg-white py-6 md:py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
      <blockquote
        class="font-heading text-gray-700 font-medium text-base md:text-lg leading-snug text-center text-balance"
      >
        {{ quote }}
      </blockquote>
      <span
        aria-hidden="true"
        class="self-start font-heading text-brand-600 text-3xl md:text-4xl leading-none select-none"
      >&rdquo;</span>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  /** One sentence of the city description (see cityPullQuotes util). */
  quote: string
}>()
</script>
