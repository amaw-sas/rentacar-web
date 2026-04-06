<template>
  <CityPage v-if="city" :city />
</template>

<script lang="ts" setup>
const { city } = useCityPageSEO()

// Lanzar error 404 si la ciudad no existe
if (!city) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Ciudad no encontrada'
  })
}
</script>
