<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas con gama preseleccionada (route.params.categoria). Link del operador:
// deriveStepFromRoute arranca en Paso 3 (Seguro) con la gama del path ya elegida →
// el cliente hace Seguro → Adicionales → Datos.
definePageMeta({ colorMode: 'light' })
</script>
