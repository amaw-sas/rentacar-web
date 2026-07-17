<template>
    <div class="relative bg-white rounded-xl px-2 py-2 max-sm:py-0.5! shadow-sm">
        <span
            v-if="badge"
            class="absolute -top-[3px] -right-[3px] z-10 bg-brand-600 text-gray-900 text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
        >{{ badge }}</span>
        <u-form-field :label="label" size="xl">
            <u-button
                block
                color="neutral"
                variant="ghost"
                class="justify-start text-gray-900 font-semibold px-0"
                :data-testid="testid"
                :aria-label="`Seleccionar ${label}`"
                @click="open = true"
            >
                <template #leading>
                    <IconsLocationIcon v-if="iconType === 'location'" cls="size-4 text-gray-500" />
                    <IconsClockIcon v-else cls="size-4 text-gray-500" />
                </template>
                <span :class="{ 'text-gray-400 font-normal': !selectedLabel }">
                    {{ selectedLabel || placeholder }}
                </span>
            </u-button>
        </u-form-field>

        <!-- Drawer a pantalla completa (patrón nativo, widget @nuxt/ui).
             side="bottom" + h-dvh: ocupa toda la altura del viewport móvil. -->
        <u-slideover
            v-model:open="open"
            side="bottom"
            :title="title"
            :ui="{
                content: '[color-scheme:light] bg-white h-dvh max-h-dvh ring-0',
                body: 'p-0 flex flex-col min-h-0',
            }"
            @update:open="onOpenChange"
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
                <div class="flex-1 overflow-y-auto min-h-0">
                    <!-- Texto centrado (directiva 2026-06-23): las opciones de hora
                         son cortas y alineadas a la izquierda dejaban mucho blanco a
                         la derecha. El check del seleccionado va absoluto a la derecha
                         para no descentrar la etiqueta. text-lg = paridad de tamaño
                         con el calendario (cellTrigger text-lg). -->
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
                        <UIcon
                            v-if="item[valueKey] === modelValue"
                            name="i-lucide-check"
                            class="absolute right-4 top-1/2 -translate-y-1/2 size-6 text-green-600"
                        />
                    </button>
                    <p
                        v-if="!filteredItems.length"
                        class="px-4 py-8 text-center text-lg text-gray-500"
                    >Sin resultados</p>
                </div>
            </template>
        </u-slideover>
    </div>
</template>

<script setup lang="ts">
// Mobile-only field: a full-screen drawer (u-slideover side=bottom + h-dvh)
// with a non-autofocusing search box and a scrollable option list. Replaces the
// half-height popover/dropdown so the panel uses the WHOLE mobile viewport
// (directiva 2026-06-23, visibility). Search has NO autofocus → the keyboard
// only appears if the user taps the field (reconciles the earlier hour-select
// fix that dropped search entirely to avoid the involuntary keyboard).
const props = defineProps<{
    modelValue: string | null;
    items: any[];
    valueKey: string;
    labelKey: string;
    label: string;
    title: string;
    placeholder: string;
    searchPlaceholder: string;
    iconType: 'location' | 'clock';
    badge?: string | null;
    testid?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();

const open = ref<boolean>(false);
const query = ref<string>('');

const selectedLabel = computed<string>(() => {
    const match = props.items.find((i) => i[props.valueKey] === props.modelValue);
    return match ? String(match[props.labelKey]) : '';
});

const filteredItems = computed<any[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return props.items;
    return props.items.filter((i) => String(i[props.labelKey]).toLowerCase().includes(q));
});

const select = (item: any) => {
    emit('update:modelValue', item[props.valueKey]);
    query.value = '';
    open.value = false;
};

// Reset the filter when the drawer is dismissed (X / overlay / escape) so the
// next open starts clean. Selecting clears it directly in select() because a
// programmatic close doesn't re-emit update:open.
const onOpenChange = (value: boolean) => {
    if (!value) query.value = '';
};
</script>
