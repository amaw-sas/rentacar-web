<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// Wizard de /reservas por PATH params (independencia — reemplaza el viejo
// /{city}/buscar-vehiculos/... en alquicarros). ReservasResults hidrata la búsqueda
// desde route.params y monta el wizard; deriveStepFromRoute arranca en Paso 2.
definePageMeta({ colorMode: 'light' })
</script>
