<template>
    <u-slideover
        v-model:open="open"
        side="bottom"
        :title="title"
        :ui="{ content: '[color-scheme:light] bg-white h-dvh max-h-dvh ring-0', body: 'p-0 flex flex-col min-h-0' }"
    >
        <template #body>
            <div class="p-3 border-b border-gray-100">
                <u-input
                    v-model="query"
                    :placeholder="searchPlaceholder"
                    size="xl"
                    class="w-full"
                    :ui="{ base: 'text-lg bg-white text-gray-900 placeholder:text-gray-400' }"
                    :autofocus="false"
                    :data-testid="testid ? `${testid}-search` : undefined"
                >
                    <template #leading><IconsSearchIcon cls="size-5 text-gray-400" /></template>
                </u-input>
            </div>
            <div class="flex-1 overflow-y-auto min-h-0">
                <button
                    v-for="item in filteredItems"
                    :key="String(item[valueKey])"
                    type="button"
                    :aria-pressed="item[valueKey] === modelValue"
                    class="relative flex w-full items-center justify-center px-12 py-4 text-center text-lg text-gray-900 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50"
                    :class="{ 'bg-green-50 font-semibold': item[valueKey] === modelValue }"
                    @click="select(item)"
                >
                    <span>{{ item[labelKey] }}</span>
                    <UIcon v-if="item[valueKey] === modelValue" name="i-lucide-check" class="absolute right-4 top-1/2 -translate-y-1/2 size-6 text-green-600" />
                </button>
                <p v-if="!filteredItems.length" class="px-4 py-8 text-center text-lg text-gray-500">Sin resultados</p>
            </div>
        </template>
    </u-slideover>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; modelValue: string | null; items: any[]; valueKey: string; labelKey: string; title: string; searchPlaceholder: string; testid?: string }>();
const emit = defineEmits<{ 'update:open': [value: boolean]; 'update:modelValue': [value: string | null] }>();
const query = ref('');
const open = computed({
    get: () => props.open,
    set: (value: boolean) => { if (!value) query.value = ''; emit('update:open', value); },
});
const filteredItems = computed<any[]>(() => {
    const q = query.value.trim().toLowerCase();
    return q ? props.items.filter(item => String(item[props.labelKey]).toLowerCase().includes(q)) : props.items;
});
function select(item: any) {
    emit('update:modelValue', item[props.valueKey]);
    query.value = '';
    emit('update:open', false);
}
</script>
