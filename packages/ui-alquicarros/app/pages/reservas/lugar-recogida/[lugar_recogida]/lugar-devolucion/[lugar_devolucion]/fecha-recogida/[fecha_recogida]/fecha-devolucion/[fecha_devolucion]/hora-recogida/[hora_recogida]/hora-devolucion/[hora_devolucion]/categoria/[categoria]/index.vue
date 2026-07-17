<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas con gama preseleccionada (route.params.categoria). Link del operador:
// deriveStepFromRoute arranca en Paso 3 (Seguro) con la gama del path ya elegida →
// el cliente hace Seguro → Adicionales → Datos.
// validate-search-params (#322 SCEN-322-V01): corrige deep-links inválidos.
definePageMeta({ colorMode: 'light', middleware: ['validate-search-params'] })
</script>
