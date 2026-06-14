<template>
    <!-- Móvil: select nativo (mejor UX táctil) -->
    <div class="relative w-full sm:hidden">
      <LocationIcon cls="absolute left-3 inset-y-0 m-auto text-red-600 size-5 pointer-events-none" />
      <select
        id="select-branch-mobile"
        v-model="selectedBranch"
        aria-label="Selecciona ciudad de recogida"
        :class="[
          'select-branch-critical w-full rounded-xl text-black py-6 pl-10 pr-12 border border-gray-400 appearance-none',
          variant === 'gray' ? 'bg-gray-200' : 'bg-white'
        ]"
        @change="handleMobileChange"
      >
        <option value="null">Elige una ciudad</option>
        <option
          v-for="branch in branches"
          :key="branch.code"
          :value="branch.code"
          v-text="branch.name"
        ></option>
      </select>
      <ChevronDownIcon cls="absolute right-4 inset-y-0 m-auto size-6 pointer-events-none text-gray-600" />
    </div>
    <!-- Desktop: USelectMenu con búsqueda -->
    <USelectMenu
      :search-input="{
        placeholder: 'Buscar...',
      }"
      size="xl"
      placeholder="Elige una ciudad"
      aria-label="Selecciona ciudad de recogida"
      :items
      :class="[
        'select-branch-critical hidden sm:flex w-full rounded-xl text-black border border-gray-400',
        variant === 'gray' ? 'bg-gray-200' : 'bg-white'
      ]"
      :ui="{ leadingIcon: 'text-red-600', base: ['py-6'], placeholder: 'text-black' }"
    >
      <template #leading>
        <LocationIcon cls="text-red-600 size-5" />
      </template>
      <template #trailing>
        <ChevronDownIcon cls="size-6 text-gray-600" />
      </template>
    </USelectMenu>
</template>

<script setup lang="ts">
/** types */
import type { SelectMenuItem } from "@nuxt/ui";

/** imports */
import { today } from "@internationalized/date";
import { storeToRefs } from "pinia";
import { computed } from "vue";

/** components */
import {
  IconsLocationIcon as LocationIcon,
  IconsChevronDownIcon as ChevronDownIcon,
} from "#components";

/** props */
const props = withDefaults(defineProps<{
  variant?: 'white' | 'gray'
  rentalDays?: number
}>(), {
  variant: 'white',
  rentalDays: 7,
});

/** consts */
const { reservation, defaultTimezone } = useAppConfig();
const { sortedBranches: branches } = storeToRefs(useStoreAdminData());

const reservationInitDay: string = today(defaultTimezone)
  .add({ days: 1 })
  .toString();
const reservationEndDay: string = today(defaultTimezone)
  .add({ days: 1 + props.rentalDays })
  .toString();
const reservationInitHour: string = "12:00";
const reservationEndHour: string = "12:00";

const items = computed<SelectMenuItem[]>(() =>
  (branches.value || []).map((branch: BranchData) => ({
    label: branch.name,
    value: branch.code,
    onSelect: () => goToReservationPage(branch),
  }))
);

/** refs */
const selectedBranch = ref<BranchData['code'] | null>(null)

/** bfcache restoration: after browser back, the persisted v-model value
 * prevents @change / onSelect from firing again for the same option.
 * Reset to placeholder on restoration so any re-selection navigates. */
const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) selectedBranch.value = null
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('pageshow', handlePageShow)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('pageshow', handlePageShow)
  }
})

/** functions */
const handleMobileChange = () => {
  if (selectedBranch.value && selectedBranch.value !== 'null') {
    const branch = (branches.value || []).find((b: BranchData) => b.code === selectedBranch.value);
    if (branch) {
      goToReservationPage(branch);
    }
  }
};

const goToReservationPage = async (branch: BranchData) =>
  await navigateTo(createReservationURL(branch));

const createReservationURL = (branch: BranchData) =>
  `/${branch.city}/buscar-vehiculos/lugar-recogida/${branch.slug}/lugar-devolucion/${branch.slug}/fecha-recogida/${reservationInitDay}/fecha-devolucion/${reservationEndDay}/hora-recogida/${reservationInitHour}/hora-devolucion/${reservationEndHour}`;

  // https://alquilatucarro.com/cali/buscar-vehiculos/lugar-recogida/aakal/lugar-devolucion/aakal/fecha-recogida/2026-01-10/fecha-devolucion/2026-01-17/hora-recogida/12:00/hora-devolucion/12:00

</script>
