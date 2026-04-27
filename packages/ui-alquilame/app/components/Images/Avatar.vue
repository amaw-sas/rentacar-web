<template>
  <NuxtImg
    :src="avatarSrc"
    :alt="avatar.alt"
    width="27"
    height="27"
    loading="lazy"
    fetchpriority="low"
    class="size-7 rounded-full object-cover"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
    avatar: any
}>()

const avatarSrc = computed(() => {
  if (props.avatar.src.startsWith('http')) return props.avatar.src
  return `/images/avatares/${props.avatar.src}.webp`
})
</script>
