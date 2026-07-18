<template>
    <CityPage v-if="city" :city="city" />
</template>

<script setup lang="ts">

definePageMeta({
  middleware: ['rentacar-data', 'validate-search-params', 'validate-city-params']
});

const { city } = useSearchPageSEO();

useSearchByRouteParams()
</script>
