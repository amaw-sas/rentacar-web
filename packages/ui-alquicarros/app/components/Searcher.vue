<template>
    <u-form
        class="w-full mx-auto md:w-3/6 lg:w-4/6 grid grid-cols-2 auto-rows-min gap-2 light"
    >
        <!-- MÓVIL: Lugar de recogida → drawer full-screen con buscador -->
        <SearcherSelectDrawer
            v-model="lugarRecogida"
            class="col-span-2 sm:hidden"
            :items="sortedBranches"
            value-key="code"
            label-key="name"
            label="Lugar de recogida"
            title="Lugar de recogida"
            placeholder="Selecciona la sucursal"
            search-placeholder="Buscar sucursal"
            icon-type="location"
            testid="pickup-location-test"
        />

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Lugar de recogida" size="xl">
                <u-select-menu
                    v-model="lugarRecogida"
                    id="pickup-location"
                    label-key="name"
                    value-key="code"
                    class="w-full"
                    variant="ghost"
                    data-testid="pickup-location-desktop-test"
                    :items="sortedBranches"
                    :search-input="{
                        placeholder: 'Buscar sucursal',
                        autofocus: false,
                    }"
                    :ui="{
                        content: 'bg-white',
                        input: 'bg-white text-gray-900 placeholder:text-gray-500',
                        item: 'text-gray-900',
                        itemLeadingIcon: 'text-gray-500',
                    }"
                    :autofocus="false"
                />
            </u-form-field>
        </div>
        <!-- MÓVIL: Lugar de devolución → drawer full-screen con buscador -->
        <SearcherSelectDrawer
            v-model="lugarDevolucion"
            class="col-span-2 sm:hidden"
            :items="sortedBranches"
            value-key="code"
            label-key="name"
            label="Lugar de devolución"
            title="Lugar de devolución"
            placeholder="Selecciona la sucursal"
            search-placeholder="Buscar sucursal"
            icon-type="location"
            testid="return-location-test"
        />

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Lugar de devolución" size="xl">
                <u-select-menu
                    v-model="lugarDevolucion"
                    id="return-location"
                    data-testid="return-location-desktop-test"
                    label-key="name"
                    value-key="code"
                    variant="ghost"
                    class="w-full"
                    :items="sortedBranches"
                    :search-input="{
                        placeholder: 'Buscar sucursal',
                        autofocus: false,
                    }"
                    :ui="{
                        content: 'bg-white',
                        input: 'bg-white text-gray-900 placeholder:text-gray-500',
                        item: 'text-gray-900',
                        itemLeadingIcon: 'text-gray-500',
                    }"
                    :autofocus="false"
                />
            </u-form-field>
        </div>
        <!-- MÓVIL: Día de recogida → botón que abre u-slideover con u-calendar (patrón Kayak) -->
        <div class="bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <u-form-field label="Día de recogida" size="xl">
                <u-button
                    v-if="minPickupDate"
                    block
                    color="neutral"
                    variant="ghost"
                    class="justify-start text-gray-900 font-semibold px-0"
                    data-testid="pickup-date-mobile-trigger"
                    aria-label="Seleccionar día de recogida"
                    @click="pickupDateSlideoverOpen = true"
                >
                    <template #leading>
                        <IconsCalendarIcon cls="size-4 text-gray-500" />
                    </template>
                    {{ pickupDateLabel }}
                </u-button>
                <u-slideover
                    v-model:open="pickupDateSlideoverOpen"
                    side="bottom"
                    title="Día de recogida"
                    :ui="{ content: 'bg-white h-dvh max-h-dvh ring-0', body: 'flex flex-col justify-center items-center p-4 overflow-y-auto' }"
                >
                    <template #body>
                        <u-calendar
                            :model-value="selectedPickupDate"
                            size="xl"
                            class="w-full calendar-light scale-80 origin-top"
                            :min-value="minPickupDate"
                            :is-date-unavailable="isPickupDateUnavailable"
                            color="success"
                            :ui="mobileCalendarUIConfig"
                            :month-controls="true"
                            :year-controls="false"
                            :prev-month="{ color: 'gray', variant: 'soft' }"
                            :next-month="{ color: 'gray', variant: 'soft' }"
                            @update:model-value="(v) => onPickupDateSelect(v as DateObject | null)"
                        />
                    </template>
                </u-slideover>
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-input-date -->
        <div class="bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Día de recogida" size="xl">
                <u-input-date
                    v-if="minPickupDate"
                    id="pickup-date"
                    v-model="selectedPickupDate"
                    variant="ghost"
                    class="w-full"
                    :min-value="minPickupDate"
                    :is-date-unavailable="isPickupDateUnavailable"
                    @click="pickupDateCalendarOpen = true"
                >
                    <template #trailing>
                        <u-popover
                            v-model:open="pickupDateCalendarOpen"
                            :ui="{ content: 'bg-white' }"
                        >
                            <u-button
                                color="neutral"
                                variant="link"
                                size="sm"
                                aria-label="Seleccione una día de recogida"
                                class="px-0"
                            >
                                <template #leading>
                                    <IconsCalendarIcon cls="size-4" />
                                </template>
                            </u-button>
                            <template #content>
                                <u-calendar
                                    :model-value="selectedPickupDate"
                                    class="p-2 calendar-light"
                                    :min-value="minPickupDate"
                                    :is-date-unavailable="isPickupDateUnavailable"
                                    color="success"
                                    :ui="calendarUIConfig"
                                    :month-controls="true"
                                    :year-controls="false"
                                    :prev-month="{ color: 'gray', variant: 'soft' }"
                                    :next-month="{ color: 'gray', variant: 'soft' }"
                                    @update:model-value="(v) => onPickupDateSelect(v as DateObject | null)"
                                />
                            </template>
                        </u-popover>
                    </template>
                </u-input-date>
            </u-form-field>
        </div>
        <!-- MÓVIL: Día de devolución → botón que abre u-slideover con u-calendar -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <span
                v-if="rentalDays > 0"
                class="absolute -top-[3px] -right-[3px] z-10 bg-[#a3f78b] text-black text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ rentalDays }} {{ rentalDays === 1 ? 'día' : 'días' }}</span>
            <u-form-field label="Día de devolución" size="xl">
                <u-button
                    v-if="minReturnDate"
                    block
                    color="neutral"
                    variant="ghost"
                    class="justify-start text-gray-900 font-semibold px-0"
                    data-testid="return-date-mobile-trigger"
                    aria-label="Seleccionar día de devolución"
                    @click="returnDateSlideoverOpen = true"
                >
                    <template #leading>
                        <IconsCalendarIcon cls="size-4 text-gray-500" />
                    </template>
                    {{ returnDateLabel }}
                </u-button>
                <u-slideover
                    v-model:open="returnDateSlideoverOpen"
                    side="bottom"
                    title="Día de devolución"
                    :ui="{ content: 'bg-white h-dvh max-h-dvh ring-0', body: 'flex flex-col justify-center items-center p-4 overflow-y-auto' }"
                >
                    <template #body>
                        <u-calendar
                            :model-value="selectedReturnDate"
                            size="xl"
                            class="w-full calendar-light scale-80 origin-top"
                            :min-value="minReturnDate"
                            :max-value="maxReturnDate"
                            :is-date-unavailable="isReturnDateUnavailable"
                            color="success"
                            :ui="mobileCalendarUIConfig"
                            :month-controls="true"
                            :year-controls="false"
                            :prev-month="{ color: 'gray', variant: 'soft' }"
                            :next-month="{ color: 'gray', variant: 'soft' }"
                            @update:model-value="(v) => onReturnDateSelect(v as DateObject | null)"
                        />
                    </template>
                </u-slideover>
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-input-date -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <span
                v-if="rentalDays > 0"
                class="absolute -top-[3px] -right-[3px] z-10 bg-[#a3f78b] text-black text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ rentalDays }} {{ rentalDays === 1 ? 'día' : 'días' }}</span>
            <u-form-field label="Día de devolución" size="xl">
                <u-input-date
                    v-if="minReturnDate"
                    id="return-date"
                    v-model="selectedReturnDate"
                    variant="ghost"
                    class="w-full"
                    :min-value="minReturnDate"
                    :max-value="maxReturnDate"
                    :is-date-unavailable="isReturnDateUnavailable"
                    @click="returnDateCalendarOpen = true"
                >
                    <template #trailing>
                        <u-popover
                            v-model:open="returnDateCalendarOpen"
                            :ui="{ content: 'bg-white' }"
                        >
                            <u-button
                                color="neutral"
                                variant="link"
                                size="sm"
                                aria-label="Seleccione una día de devolución"
                                class="px-0"
                            >
                                <template #leading>
                                    <IconsCalendarIcon cls="size-4" />
                                </template>
                            </u-button>
                            <template #content>
                                <u-calendar
                                    :model-value="selectedReturnDate"
                                    class="p-2 calendar-light"
                                    :min-value="minReturnDate"
                                    :max-value="maxReturnDate"
                                    :is-date-unavailable="isReturnDateUnavailable"
                                    color="success"
                                    :ui="calendarUIConfig"
                                    :month-controls="true"
                                    :year-controls="false"
                                    :prev-month="{ color: 'gray', variant: 'soft' }"
                                    :next-month="{ color: 'gray', variant: 'soft' }"
                                    @update:model-value="(v) => onReturnDateSelect(v as DateObject | null)"
                                />
                            </template>
                        </u-popover>
                    </template>
                </u-input-date>
            </u-form-field>
        </div>
        <!-- MÓVIL: Hora de recogida → drawer full-screen con buscador -->
        <SearcherSelectDrawer
            v-model="horaRecogida"
            class="sm:hidden"
            :items="pickupHourOptions"
            value-key="value"
            label-key="label"
            label="Hora de recogida"
            title="Hora de recogida"
            placeholder="Selecciona la hora"
            search-placeholder="Buscar hora"
            icon-type="clock"
            testid="pickup-hour-test"
        />

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Hora de recogida" size="xl">
                <u-select-menu
                    v-model="horaRecogida"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                    variant="ghost"
                    data-testid="pickup-hour-desktop-test"
                    :autofocus="false"
                    :search-input="false"
                    :items="pickupHourOptions"
                    :ui="{
                        content: 'bg-white',
                        item: 'text-gray-900',
                    }"
                />
            </u-form-field>
        </div>
        <!-- MÓVIL: Hora de devolución → drawer full-screen con buscador -->
        <SearcherSelectDrawer
            v-model="horaDevolucion"
            class="sm:hidden"
            :items="returnHourOptions"
            value-key="value"
            label-key="label"
            label="Hora de devolución"
            title="Hora de devolución"
            placeholder="Selecciona la hora"
            search-placeholder="Buscar hora"
            icon-type="clock"
            :badge="extraHoursLabel"
            testid="return-hour-test"
        />

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <span
                v-if="extraHoursLabel"
                class="absolute -top-[3px] -right-[3px] z-10 bg-[#a3f78b] text-black text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ extraHoursLabel }}</span>
            <u-form-field label="Hora de devolución" size="xl">
                <u-select-menu
                    id="return-hour"
                    v-model="horaDevolucion"
                    value-key="value"
                    label-key="label"
                    variant="ghost"
                    class="w-full"
                    data-testid="return-hour-desktop-test"
                    :autofocus="false"
                    :search-input="false"
                    :items="returnHourOptions"
                    :ui="{
                        content: 'bg-white',
                        item: 'text-gray-900',
                    }"
                />
            </u-form-field>
        </div>
        <div class="col-span-2">
            <u-button
                :to="{name: searchLinkName, params: searchLinkParams}"
                @click="onSearchClick"
                :disabled="pendingSearching || !animateSearchButton || !isSelectionWithinSchedule"
                :loading="pendingSearching"
                :class="{'search-button': true, 'search-button-glow': animateSearchButton}"
                size="xl"
            >
                BUSCAR VEHÍCULOS
            </u-button>
        </div>
    </u-form>
</template>

<script setup lang="ts">
// Note: stores and components are auto-imported by Nuxt; utils are not.
import { formatHumanDate } from '@rentacar-main/logic/utils';
import type { DateObject } from '@rentacar-main/logic/utils';

/** Local refs - initialized lazily to avoid SSR Pinia errors */
const lugarRecogida = ref<string | null>(null);
const lugarDevolucion = ref<string | null>(null);
const horaRecogida = ref<string | null>(null);
const horaDevolucion = ref<string | null>(null);
const referido = ref<string | null>(null);
const minPickupDate = ref<any>(null);
const maxReturnDate = ref<any>(null);
const selectedPickupDate = ref<any>(null);
const selectedReturnDate = ref<any>(null);
const rentalDays = ref<number>(0);
const extraHoursLabel = ref<string | null>(null);
const minReturnDate = computed<any>(() => selectedPickupDate.value ?? minPickupDate.value);

// Mobile y desktop comparten el mismo widget @nuxt/ui (u-calendar sobre
// @internationalized/date). En móvil el calendario vive en un u-slideover
// (bottom sheet, patrón Kayak); en desktop en un u-popover. Ya no hay
// input de fecha nativo, así que desaparecen el clamp anti-globo de
// Android, el bridge string↔CalendarDate y el binding one-way.
const pickupDateLabel = computed<string>(() =>
    selectedPickupDate.value ? formatHumanDate(selectedPickupDate.value) : 'Selecciona la fecha',
);
const returnDateLabel = computed<string>(() =>
    selectedReturnDate.value ? formatHumanDate(selectedReturnDate.value) : 'Selecciona la fecha',
);

// Handler único para recogida/devolución (desktop popover + móvil slideover):
// escribe el CalendarDate, re-habilita el botón BUSCAR y cierra el overlay.
const onPickupDateSelect = (v: DateObject | null) => {
    if (!v) return;
    selectedPickupDate.value = v;
    animateSearchButton.value = true;
    pickupDateCalendarOpen.value = false;
    pickupDateSlideoverOpen.value = false;
};
const onReturnDateSelect = (v: DateObject | null) => {
    if (!v) return;
    selectedReturnDate.value = v;
    animateSearchButton.value = true;
    returnDateCalendarOpen.value = false;
    returnDateSlideoverOpen.value = false;
};
const pendingSearching = ref<boolean>(false);
const sortedBranches = ref<any[]>([]);
const pickupHourOptions = ref<any[]>([]);
const returnHourOptions = ref<any[]>([]);
const searchLinkName = ref<string>('');
const searchLinkParams = ref<any>({});
const animateSearchButton = ref<boolean>(true);

// Issue #129: the search button is a NuxtLink (:to). When the resolved target URL
// equals the current one (e.g. retrying after an error without changing any field),
// NuxtLink does not navigate, so useSearchByRouteParams never re-mounts and the
// search is never re-fired. Re-trigger doSearch directly in that case. doSearch is
// captured in onMounted, where useSearch is instantiated.
const route = useRoute();
const router = useRouter();
const doSearchFn = ref<(() => void) | null>(null);
const onSearchClick = (e: MouseEvent) => {
  // Resolve BOTH sides through the router so the comparison is query-order- and
  // encoding-insensitive (a reordered bookmarked link would otherwise false-negative).
  // Only preventDefault when doSearch is ready (captured in onMounted): before mount,
  // let NuxtLink's harmless same-URL no-op run instead of swallowing the tap.
  const target = router.resolve({ name: searchLinkName.value, params: searchLinkParams.value });
  const current = router.resolve(route.fullPath);
  if (target.href === current.href && doSearchFn.value) {
    e.preventDefault();
    doSearchFn.value();
  }
};

// Schedule restriction (#47 W4/W5): per-branch calendar predicates and the
// submit gate, mirrored from useSearch. Defaults are permissive so the form is
// never blocked before the composable initializes.
const isPickupDateUnavailable = ref<(date: DateObject) => boolean>(() => false);
const isReturnDateUnavailable = ref<(date: DateObject) => boolean>(() => false);
const isSelectionWithinSchedule = ref<boolean>(true);

// Desktop popover y móvil slideover usan refs SEPARADOS: comparten estado haría
// que abrir el slideover móvil también dispare el popover desktop, cuyo contenido
// se portalea al <body> e ignora el `hidden sm:block` del ancestro → calendario
// fantasma arriba-izquierda. El trigger desktop está display:none en móvil, así
// que su ref nunca se activa.
const pickupDateCalendarOpen = ref<boolean>(false);
const returnDateCalendarOpen = ref<boolean>(false);
const pickupDateSlideoverOpen = ref<boolean>(false);
const returnDateSlideoverOpen = ref<boolean>(false);

// Calendar UI configuration for better contrast
const calendarUIConfig = {
    heading: '!text-gray-900 !font-bold',
    gridRow: 'w-full',
    // Center each weekday letter within its column so it lines up vertically
    // with the day numbers. The default `gridRow` already has place-items-center
    // (numbers centered) but `gridWeekDaysRow` does not, so without this the
    // letters left-align inside their column and drift left of the numbers.
    gridWeekDaysRow: 'w-full place-items-center',
    cellTrigger: '!text-gray-900 !font-semibold data-[disabled]:!text-gray-400 data-[disabled]:!opacity-50 data-[unavailable]:!text-gray-400 data-[unavailable]:!opacity-50 data-[outside-view]:!text-gray-400 data-[outside-view]:!opacity-50'
};

// Mobile calendar lives in a full-screen slideover (directiva 2026-06-23): the
// default md size (cellTrigger size-8/32px) looks lost in the full-dvh drawer.
// Scale cells up to size-12 (48px) with text-lg and add vertical row gaps so the
// month fills the panel with large tap targets. Capped at 48px because the 7
// grid tracks are ~51px wide at 390px (col-width = (390 - 32 padding) / 7) — any
// larger overflows the row. Desktop popover keeps the compact calendarUIConfig.
const mobileCalendarUIConfig = {
    heading: '!text-gray-900 !font-bold text-xl',
    grid: 'w-full space-y-2',
    gridRow: 'w-full',
    gridWeekDaysRow: 'w-full place-items-center mb-2',
    gridBody: 'gap-y-3',
    headCell: 'text-base',
    cellTrigger: '!text-gray-900 !font-semibold !size-12 !text-lg !m-0 data-[disabled]:!text-gray-400 data-[disabled]:!opacity-50 data-[unavailable]:!text-gray-400 data-[unavailable]:!opacity-50 data-[outside-view]:!text-gray-400 data-[outside-view]:!opacity-50',
};

// bfcache restoration: the Searcher has 15+ watchers binding local refs to
// Pinia stores. After browser back (e.g. from reservation/gracias page),
// bfcache preserves refs but reactivity no longer propagates — selects for
// pickup/return become unresponsive. Full reload rebuilds reactive state
// cleanly; URL params carry the search context so the user loses nothing.
const handleSearcherPageShow = (event: PageTransitionEvent) => {
  if (event.persisted) window.location.reload()
}

// Initialize stores only on client side after mount
onMounted(() => {
  if (import.meta.client) {
    // Issue #25 defense-in-depth: a previous reka-ui Dialog (e.g. reservation
    // slideover) may have left <body> inline-locked if its v-model:open did
    // not transition to false before the parent unmounted via route change.
    // Body is the shared SPA DOM node, so the lock leaks to this page until
    // an explicit reset. Loggea para trazabilidad cuando la sanitización actúa.
    if (document.body.style.pointerEvents === 'none') {
      console.warn('[Searcher] stale body pointer-events lock cleaned on mount (issue #25)')
      document.body.style.pointerEvents = ''
    }
    if (document.body.hasAttribute('data-scroll-locked')) {
      document.body.removeAttribute('data-scroll-locked')
    }

    window.addEventListener('pageshow', handleSearcherPageShow)
  }

  const storeReservationForm = useStoreReservationForm();
  const storeAdminData = useStoreAdminData();
  const storeSearchData = useStoreSearchData();

  const formRefs = storeToRefs(storeReservationForm);
  const searchRefs = storeToRefs(storeSearchData);
  const adminRefs = storeToRefs(storeAdminData);

  // Sync store refs to local refs
  watch(() => formRefs.lugarRecogida.value, (val) => lugarRecogida.value = val, { immediate: true });
  watch(() => formRefs.lugarDevolucion.value, (val) => lugarDevolucion.value = val, { immediate: true });
  watch(() => formRefs.horaRecogida.value, (val) => horaRecogida.value = val, { immediate: true });
  watch(() => formRefs.horaDevolucion.value, (val) => horaDevolucion.value = val, { immediate: true });
  watch(() => formRefs.referido.value, (val) => referido.value = val, { immediate: true });
  watch(() => formRefs.minPickupDate.value, (val) => minPickupDate.value = val, { immediate: true });
  watch(() => formRefs.maxReturnDate.value, (val) => maxReturnDate.value = val, { immediate: true });
  watch(() => formRefs.selectedPickupDate.value, (val) => selectedPickupDate.value = val, { immediate: true });
  watch(() => formRefs.selectedReturnDate.value, (val) => selectedReturnDate.value = val, { immediate: true });
  watch(() => formRefs.rentalDays.value, (val) => rentalDays.value = val, { immediate: true });
  watch(() => formRefs.extraHoursLabel.value, (val) => extraHoursLabel.value = val, { immediate: true });
  watch(() => searchRefs.pending.value, (val) => pendingSearching.value = val, { immediate: true });
  watch(() => adminRefs.sortedBranches.value, (val) => sortedBranches.value = val, { immediate: true });

  // Sync local refs back to store (bi-directional binding)
  watch(lugarRecogida, (val) => formRefs.lugarRecogida.value = val);
  watch(lugarDevolucion, (val) => formRefs.lugarDevolucion.value = val);
  watch(horaRecogida, (val) => formRefs.horaRecogida.value = val);
  watch(horaDevolucion, (val) => formRefs.horaDevolucion.value = val);
  watch(selectedPickupDate, (val) => formRefs.selectedPickupDate.value = val);
  watch(selectedReturnDate, (val) => formRefs.selectedReturnDate.value = val);

  // Initialize useSearch composable
  const searchComposable = useSearch();
  doSearchFn.value = searchComposable.doSearch; // #129: expose for same-URL re-fire
  watch(() => searchComposable.pickupHourOptions.value, (val) => pickupHourOptions.value = val, { immediate: true });
  watch(() => searchComposable.returnHourOptions.value, (val) => returnHourOptions.value = val, { immediate: true });
  watch(() => searchComposable.searchLinkName.value, (val) => searchLinkName.value = val, { immediate: true });
  watch(() => searchComposable.searchLinkParams.value, (val) => searchLinkParams.value = val, { immediate: true });
  watch(() => searchComposable.animateSearchButton.value, (val) => animateSearchButton.value = val, { immediate: true });
  watch(() => searchComposable.isPickupDateUnavailable.value, (val) => isPickupDateUnavailable.value = val, { immediate: true });
  watch(() => searchComposable.isReturnDateUnavailable.value, (val) => isReturnDateUnavailable.value = val, { immediate: true });
  watch(() => searchComposable.isSelectionWithinSchedule.value, (val) => isSelectionWithinSchedule.value = val, { immediate: true });
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('pageshow', handleSearcherPageShow)
  }
})

</script>


