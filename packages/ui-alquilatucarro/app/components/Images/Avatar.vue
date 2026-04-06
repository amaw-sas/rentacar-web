<template>
    <picture>
        <source 
            type="image/avif"
            :srcset="`https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2F${avatar.src}.avif?alt=media`"
            :alt="avatar.alt"
            width="27"
            height="27"
            loading="lazy"
            fetchpriority="low"
        >
        <source 
            type="image/webp"
            :srcset="`https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2F${avatar.src}.webp?alt=media`"
            :alt="avatar.alt"
            width="27"
            height="27"
            loading="lazy"
            fetchpriority="low"
        >
        <source 
            type="image/png"
            :srcset="`https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2F${avatar.src}.png?alt=media`"
            :alt="avatar.alt"
            width="27"
            height="27"
            loading="lazy"
            fetchpriority="low"
        >
        <img 
            :src="`https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o/rentacar-main%2Falquilatucarro%2Fimg%2Favatares%2F${avatar.src}.png?alt=media`"
            :alt="avatar.alt"
            width="27"
            height="27"
            loading="lazy"
            fetchpriority="low"
            class="h-full w-full rounded-full object-cover"
        >
    </picture>
</template>

<script setup lang="ts">
const props = defineProps<{
    avatar: any
}>()
</script>

