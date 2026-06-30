<template>
    <!-- Móvil: drawer a pantalla completa con buscador (directiva 2026-06-23),
         mismo patrón que el searcher. Reemplaza el dropdown nativo. El trigger
         conserva el look prominente del selector del home (icono rojo + chevron). -->
    <div class="w-full sm:hidden">
      <button
        id="select-branch-mobile"
        type="button"
        aria-label="Selecciona ciudad de recogida"
        :class="[
          'select-branch-critical relative flex items-center w-full rounded-xl text-black py-6 pl-10 pr-12 border border-gray-400 text-left',
          variant === 'gray' ? 'bg-gray-200' : 'bg-white'
        ]"
        @click="drawerOpen = true"
      >
        <LocationIcon cls="absolute left-3 inset-y-0 m-auto text-red-600 size-5 pointer-events-none" />
        <span :class="{ 'text-gray-500': !selectedLabel }">{{ selectedLabel || 'Elige una ciudad' }}</span>
        <ChevronDownIcon cls="absolute right-4 inset-y-0 m-auto size-6 pointer-events-none text-gray-600" />
      </button>
      <u-slideover
        v-model:open="drawerOpen"
        side="bottom"
        title="Elige una ciudad"
        :ui="{
          content: 'bg-gray-50 h-dvh max-h-dvh ring-0',
          header: 'relative justify-center py-4 border-b border-gray-200 bg-white',
          title: 'w-full text-center text-2xl font-extrabold text-[#0B1A2E]',
          close: 'absolute top-3 right-3 bg-black text-white rounded-full hover:bg-black/80',
          body: 'p-0 flex flex-col min-h-0',
        }"
        @update:open="onDrawerToggle"
      >
        <template #body>
          <div class="p-3 border-b border-gray-100">
            <u-input
              v-model="query"
              placeholder="Buscar ciudad"
              size="xl"
              class="w-full"
              :ui="{ base: 'text-lg' }"
              :autofocus="false"
            >
              <template #leading>
                <SearchIcon cls="size-5 text-gray-400" />
              </template>
            </u-input>
          </div>
          <div class="flex-1 overflow-y-auto min-h-0 px-3 pt-3 pb-4 space-y-2">
            <!-- Cada sucursal es un botón con borde (acento azul de marca al hover). -->
            <button
              v-for="branch in filteredBranches"
              :key="branch.code"
              type="button"
              class="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-center text-lg font-semibold text-gray-900 transition-colors hover:border-[#000073] hover:bg-blue-50 active:bg-blue-100"
              @click="selectBranch(branch)"
            >
              <span>{{ branch.name }}</span>
            </button>
            <p
              v-if="!filteredBranches.length"
              class="px-4 py-8 text-center text-lg text-gray-500"
            >Sin resultados</p>
          </div>
        </template>
      </u-slideover>
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
import type { BranchData } from "@rentacar-main/logic/utils";

/** imports */
import { today } from "@internationalized/date";
import { storeToRefs } from "pinia";
import { computed } from "vue";

/** components */
import {
  IconsLocationIcon as LocationIcon,
  IconsChevronDownIcon as ChevronDownIcon,
  IconsSearchIcon as SearchIcon,
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

/** mobile drawer state (directiva 2026-06-23): full-screen slideover with a
 * non-autofocusing search, mirroring the searcher select drawers. */
const drawerOpen = ref<boolean>(false)
const query = ref<string>('')

const filteredBranches = computed<BranchData[]>(() => {
  const list = branches.value || []
  const q = query.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((b: BranchData) => b.name.toLowerCase().includes(q))
})

const selectedLabel = computed<string>(() => {
  const match = (branches.value || []).find((b: BranchData) => b.code === selectedBranch.value)
  return match ? match.name : ''
})

/** bfcache restoration: after browser back, the persisted v-model value
 * prevents @change / onSelect from firing again for the same option.
 * Reset to placeholder on restoration so any re-selection navigates. */
const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) {
    selectedBranch.value = null
    drawerOpen.value = false
    query.value = ''
  }
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
const selectBranch = (branch: BranchData) => {
  selectedBranch.value = branch.code;
  query.value = '';
  drawerOpen.value = false;
  goToReservationPage(branch);
};

// Clear the filter when the drawer is dismissed (X / overlay / escape).
const onDrawerToggle = (value: boolean) => {
  if (!value) query.value = '';
};

const goToReservationPage = async (branch: BranchData) =>
  await navigateTo(createReservationURL(branch));

const createReservationURL = (branch: BranchData) =>
  `/${branch.city}/buscar-vehiculos/lugar-recogida/${branch.slug}/lugar-devolucion/${branch.slug}/fecha-recogida/${reservationInitDay}/fecha-devolucion/${reservationEndDay}/hora-recogida/${reservationInitHour}/hora-devolucion/${reservationEndHour}`;

  // https://alquilatucarro.com/cali/buscar-vehiculos/lugar-recogida/aakal/lugar-devolucion/aakal/fecha-recogida/2026-01-10/fecha-devolucion/2026-01-17/hora-recogida/12:00/hora-devolucion/12:00

</script>
