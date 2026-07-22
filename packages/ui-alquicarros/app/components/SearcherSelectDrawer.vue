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
                @click="openDrawer"
            >
                <template #leading>
                    <IconsLocationIcon v-if="iconType === 'location'" cls="size-4 text-gray-500" />
                    <IconsClockIcon v-else cls="size-4 text-gray-500" />
                </template>
                <!-- #364: gray-400 daba 2.6:1 sobre el botón blanco. No es un
               placeholder nativo sino texto renderizado, así que WCAG 1.4.3
               aplica igual; gray-500 llega a 4.83:1 y sigue leyéndose como
               estado "sin elegir". Solo se veía en móvil: el desktop usa otro
               control. -->
          <span :class="{ 'text-gray-500 font-normal': !selectedLabel }">
                    {{ selectedLabel || placeholder }}
                </span>
            </u-button>
        </u-form-field>

        <SearcherSelectDrawerPanel
            v-if="drawerActivated"
            v-model:open="open"
            :model-value="modelValue"
            :items="items"
            :value-key="valueKey"
            :label-key="labelKey"
            :title="title"
            :search-placeholder="searchPlaceholder"
            :testid="testid"
            @update:model-value="value => emit('update:modelValue', value)"
        />
    </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const SearcherSelectDrawerPanel = defineAsyncComponent(
    () => import('./SearcherSelectDrawerPanel.vue'),
);

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
const drawerActivated = ref(false);

const selectedLabel = computed<string>(() => {
    const match = props.items.find((i) => i[props.valueKey] === props.modelValue);
    return match ? String(match[props.labelKey]) : '';
});

const openDrawer = () => {
    drawerActivated.value = true;
    open.value = true;
};
</script>
