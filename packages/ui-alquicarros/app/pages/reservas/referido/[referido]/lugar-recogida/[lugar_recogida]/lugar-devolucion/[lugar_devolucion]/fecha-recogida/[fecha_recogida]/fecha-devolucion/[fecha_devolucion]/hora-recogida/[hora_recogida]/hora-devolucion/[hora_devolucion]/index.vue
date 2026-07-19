<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas por PATH con prefijo de afiliado referido (route.params.referido).
// Espeja la variante referido de buscar-vehiculos, movida bajo /reservas.
// validate-search-params (#322 SCEN-322-V01): corrige deep-links inválidos.
definePageMeta({ colorMode: 'light', middleware: ['rentacar-data', 'validate-search-params'] })
</script>
