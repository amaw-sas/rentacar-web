<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas por PATH con afiliado referido + gama preseleccionada. Link del operador
// con atribución: arranca en Paso 3 (Seguro) con la gama del path. Espeja la variante
// referido+categoria de buscar-vehiculos, bajo /reservas.
// validate-search-params (#322 SCEN-322-V01): corrige deep-links inválidos.
definePageMeta({ colorMode: 'light', middleware: ['validate-search-params'] })
</script>
