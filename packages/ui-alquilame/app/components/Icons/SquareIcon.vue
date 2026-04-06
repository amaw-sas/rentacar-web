<template>
  <svg xmlns="http://www.w3.org/2000/svg" :class="cls" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ cls?: string }>()
const cls = props.cls ?? ''
</script>

<style scoped></style>
