<template>
  <svg xmlns="http://www.w3.org/2000/svg" :class="cls" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.1.42 2.19.88 3.25a2 2 0 0 1-.45 2.11L8.91 11.09a16 16 0 0 0 6 6l1.01-1.01a2 2 0 0 1 2.11-.45c1.06.46 2.15.76 3.25.88A2 2 0 0 1 22 16.92z"></path>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ cls?: string }>()
const cls = props.cls ?? ''
</script>

<style scoped></style>
