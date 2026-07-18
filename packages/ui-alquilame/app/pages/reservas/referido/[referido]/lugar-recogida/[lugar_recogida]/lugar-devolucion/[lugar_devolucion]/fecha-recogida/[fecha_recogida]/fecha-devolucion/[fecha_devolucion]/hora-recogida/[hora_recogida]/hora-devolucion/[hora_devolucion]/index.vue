<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas results with an affiliate referido prefix (route.params.referido).
// Mirrors the buscar-vehiculos referido variant, moved under /reservas.
definePageMeta({
  colorMode: 'light',
  middleware: ['rentacar-data', 'validate-search-params'],
})
</script>
