<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// Wizard de /reservas por PATH params (independencia — reemplaza el viejo
// /{city}/buscar-vehiculos/... en alquicarros). ReservasResults hidrata la búsqueda
// desde route.params y monta el wizard; deriveStepFromRoute arranca en Paso 2.
// validate-search-params (#322 SCEN-322-V01) corrige slugs/códigos legacy, formato
// 12h, fechas pasadas y el tope de 30 días; re-navega vía `to.name` a estas rutas.
definePageMeta({ colorMode: 'light', middleware: ['validate-search-params'] })
</script>
