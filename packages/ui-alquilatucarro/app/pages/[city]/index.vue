<template>
  <CityPage v-if="city" :city />
</template>

<script lang="ts" setup>
const { city } = useCityPageSEO()

// Lanzar error 404 si la ciudad no existe. `fatal: true` es necesario para que
// la página de error (error.vue) también se muestre en navegación client-side
// (p. ej. al llegar desde un NuxtLink). Sin fatal, en cliente el error no
// reemplaza la pantalla y queda la página anterior / el layout vacío.
if (!city) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Ciudad no encontrada',
    fatal: true,
  })
}
</script>
