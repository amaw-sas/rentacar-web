<template>
    <CityPage v-if="city" :city="city" mode="results" />
</template>

<script setup lang="ts">

definePageMeta({
  middleware: ['validate-search-params', 'validate-city-params']
});

const { city } = useSearchPageSEO();

useSearchByRouteParams()
</script>