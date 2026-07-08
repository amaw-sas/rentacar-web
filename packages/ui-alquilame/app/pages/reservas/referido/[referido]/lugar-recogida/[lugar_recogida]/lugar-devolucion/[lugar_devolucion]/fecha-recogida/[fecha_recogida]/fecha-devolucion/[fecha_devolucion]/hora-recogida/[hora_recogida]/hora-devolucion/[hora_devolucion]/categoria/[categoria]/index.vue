<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas results with affiliate referido + preselected gama. Operator link
// with attribution: preselect the card (seguro/adicionales visibles), slideover
// closed. Mirrors the buscar-vehiculos referido+categoria variant under /reservas.
definePageMeta({
  colorMode: 'light',
  middleware: ['validate-search-params'],
})
</script>
