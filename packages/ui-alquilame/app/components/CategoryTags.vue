<template>
    <span class="space-x-1">
        <span v-if="isPicoyPlacaExempt()" class="etiqueta-carro">sin pico y placa</span>
        <span v-for="tag in categoryTags[categoryCode]" :key="tag" class="etiqueta-carro" v-text="tag"></span>
    </span>
</template>

<script setup lang="ts">


const props = defineProps<{
    category: ReturnType<typeof useCategory>;
}>();

const {
    categoryCode,
    isPicoyPlacaExempt
} = props.category;

type categoryTagsType = Partial<{
    [K in CategoryType]: string[];
}>

const categoryTags: categoryTagsType = {
    'C': ['mas rentado'],
}

</script>

