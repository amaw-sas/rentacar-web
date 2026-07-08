<template>
  <ReservasResults />
</template>

<script setup lang="ts">
// /reservas results with a preselected gama (route.params.categoria). The
// operator-shareable link: CategorySelectionSection preselects + scrolls to that
// card WITHOUT opening the slideover, so the customer chooses seguro + adicionales
// on the card, then "Solicitar" → resumen → datos.
definePageMeta({
  colorMode: 'light',
  middleware: ['validate-search-params'],
})
</script>
