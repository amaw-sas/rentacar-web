<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas results by PATH params (routing independence — replaces the old
// /{city}/buscar-vehiculos/... surface in alquilame). ReservasResults drives the
// search from route.params and renders the category grid. validate-search-params
// normalizes branch slugs, 12h time format, past dates and the 30-day cap; it
// re-navigates via `to.name` so it targets these /reservas routes (no city).
definePageMeta({
  colorMode: 'light',
  middleware: ['rentacar-data', 'validate-search-params'],
})
</script>
