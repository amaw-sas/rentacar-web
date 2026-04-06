<template>
    <CityPage v-if="city" :city="city" />
</template>

<script setup lang="ts">

definePageMeta({
  middleware: ['validate-search-params', 'validate-city-params']
});

const { city } = useSearchPageSEO();

useSearchByRouteParams()
</script>