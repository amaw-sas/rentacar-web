<template>
  <!--
    City pull-quote — a COMPACT white strip between sections. One short sentence
    of the city's description, centred, framed by small red quotation marks: an
    opening one on the LEFT and a closing one on the RIGHT. Deliberately slim:
    small, plain-weight text and light padding, so it reads as a thin breather
    (2–3 lines), not a full block. The marks are aria-hidden; the quoted element
    carries the real, indexable text. An optional lead (the city name) opens the
    quote in brand colour — no boldface.
  -->
  <section class="bg-white py-6 md:py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 md:gap-3">
      <span
        aria-hidden="true"
        class="self-start font-heading text-brand-600 text-3xl md:text-4xl leading-none select-none"
      >&ldquo;</span>
      <blockquote
        class="font-heading text-gray-700 font-normal text-base md:text-lg leading-snug text-center text-balance"
      >
        <span v-if="lead" class="text-brand-600">{{ lead }}</span>{{ lead ? ' ' : '' }}{{ quote }}
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
  /** Optional emphasized lead-in (the city name), rendered before the quote. */
  lead?: string
}>()
</script>
