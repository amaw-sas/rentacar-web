<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="cls"
    viewBox="0 0 300 200"
    width="36"
    height="24"
    style="max-height: 3.5rem; max-width: 5.25rem;"
    aria-label="Bandera de Colombia"
    role="img"
  >
    <!-- Amarillo (65%) - más grande para verse prominente en diagonal -->
    <rect x="0" y="0" width="300" height="130" fill="#FCD116"/>
    <!-- Azul (17.5%) -->
    <rect x="0" y="130" width="300" height="35" fill="#003893"/>
    <!-- Rojo (17.5%) -->
    <rect x="0" y="165" width="300" height="35" fill="#CE1126"/>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ cls?: string }>()
const cls = props.cls ?? ''
</script>
