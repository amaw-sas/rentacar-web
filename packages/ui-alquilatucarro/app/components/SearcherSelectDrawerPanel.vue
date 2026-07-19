<template>
    <u-slideover
        v-model:open="open"
        side="bottom"
        :title="title"
        :ui="{
            content: 'bg-gray-50 h-dvh max-h-dvh ring-0 [color-scheme:light]',
            header: 'relative justify-center py-4 border-b border-gray-200 bg-white',
            title: 'w-full text-center text-2xl font-extrabold text-[#0B1A2E]',
            close: 'absolute top-3 right-3 bg-black text-white rounded-full hover:bg-black/80',
            body: 'p-0 flex flex-col min-h-0',
        }"
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
                    <template #leading>
                        <IconsSearchIcon cls="size-5 text-gray-400" />
                    </template>
                </u-input>
            </div>
            <div class="flex-1 overflow-y-auto min-h-0 px-3 pt-3 pb-4 space-y-2">
                <button
                    v-for="item in filteredItems"
                    :key="String(item[valueKey])"
                    type="button"
                    :aria-pressed="item[valueKey] === modelValue"
                    class="relative flex w-full items-center justify-center rounded-xl border px-4 py-3.5 text-center text-lg font-semibold transition-colors hover:border-[#000073] hover:bg-blue-50 active:bg-blue-100"
                    :class="item[valueKey] === modelValue
                        ? 'border-[#000073] bg-blue-50 text-[#000073]'
                        : 'border-gray-200 bg-white text-gray-900'"
                    @click="select(item)"
                >
                    <span>{{ item[labelKey] }}</span>
                    <UIcon
                        v-if="item[valueKey] === modelValue"
                        name="i-lucide-check"
                        class="absolute right-4 top-1/2 -translate-y-1/2 size-6 text-[#000073]"
                    />
                </button>
                <p v-if="!filteredItems.length" class="px-4 py-8 text-center text-lg text-gray-500">
                    Sin resultados
                </p>
            </div>
        </template>
    </u-slideover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
    open: boolean;
    modelValue: string | null;
    items: any[];
    valueKey: string;
    labelKey: string;
    title: string;
    searchPlaceholder: string;
    testid?: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'update:modelValue': [value: string | null];
}>();

const query = ref('');
const open = computed({
    get: () => props.open,
    set: (value: boolean) => {
        if (!value) query.value = '';
        emit('update:open', value);
    },
});
const filteredItems = computed<any[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return props.items;
    return props.items.filter(item => String(item[props.labelKey]).toLowerCase().includes(q));
});

function select(item: any) {
    emit('update:modelValue', item[props.valueKey]);
    query.value = '';
    emit('update:open', false);
}
</script>
