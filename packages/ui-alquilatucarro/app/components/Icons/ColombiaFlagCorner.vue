<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="cls"
    width="66"
    height="66"
    style="max-width: 5rem; max-height: 5rem;"
    viewBox="0 0 2.051 2.051"
    aria-label="Bandera de Colombia"
    role="img"
  >
    <!-- Diagonal flag design - no CSS rotation needed -->
    <polygon fill="#003893" points="1.008,0 1.554,0 0,1.554 0,1.008" />
    <polygon fill="#FCD116" points="0,0 1.008,0 0,1.008" />
    <polygon fill="#CE1126" points="1.554,0 2.051,0 0,2.051 0,1.554" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ cls?: string }>()
const cls = props.cls ?? ''
</script>
