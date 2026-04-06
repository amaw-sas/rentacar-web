<template>
  <svg xmlns="http://www.w3.org/2000/svg" :class="cls" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.06 1c0 1-1 2-2 2" />
    <line x1="12" y1="17" x2="12" y2="17.01" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ cls?: string }>()
const cls = props.cls ?? ''
</script>

<style scoped></style>
