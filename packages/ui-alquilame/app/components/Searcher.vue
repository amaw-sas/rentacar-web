<template>
    <u-form
        class="w-full mx-auto grid grid-cols-2 auto-rows-min gap-2 light"
    >
        <!-- MÓVIL: Form field con select nativo -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <u-form-field label="Lugar de recogida" size="xl">
                <select
                    v-if="lugarRecogida"
                    id="pickup-location-mobile"
                    v-model="lugarRecogida"
                    aria-label="Lugar de recogida"
                    class="w-full"
                >
                    <option
                        v-for="branch in sortedBranches"
                        :key="branch.code"
                        v-text="branch.name"
                        :value="branch.code"
                    ></option>
                </select>
                <select v-else disabled class="w-full text-gray-400" aria-label="Lugar de recogida">
                    <option>Cargando...</option>
                </select>
            </u-form-field>
        </div>

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
                    data-testid="pickup-location-test"
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
        <!-- MÓVIL: Form field con select nativo -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <u-form-field label="Lugar de devolución" size="xl">
                <select
                    v-if="lugarDevolucion"
                    id="return-location-mobile"
                    v-model="lugarDevolucion"
                    aria-label="Lugar de devolución"
                    class="w-full"
                >
                    <option
                        v-for="branch in sortedBranches"
                        :key="branch.code"
                        v-text="branch.name"
                        :value="branch.code"
                    ></option>
                </select>
                <select v-else disabled class="w-full text-gray-400" aria-label="Lugar de devolución">
                    <option>Cargando...</option>
                </select>
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Lugar de devolución" size="xl">
                <u-select-menu
                    v-model="lugarDevolucion"
                    id="return-location"
                    data-testid="return-location-test"
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
        <!-- MÓVIL: Form field con input date nativo -->
        <div class="bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <u-form-field label="Día de recogida" size="xl">
                <!-- No `min`/`max` here on purpose: a native `min` makes the field
                     `:invalid` for out-of-range dates, and Android Chrome then shows
                     an unstyleable dark validation balloon (unreadable under
                     force-dark). The @change handler clamps the value into range
                     instead, so the field is never `:invalid`. -->
                <input
                    v-if="minPickupDate"
                    type="date"
                    id="pickup-date-mobile"
                    name="pickup-date-mobile"
                    :value="selectedPickupDate ? selectedPickupDate.toString() : ''"
                    aria-label="Día de recogida"
                    class="w-full"
                    @change="onMobilePickupDateChange"
                >
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
                                    @update:model-value="(v) => { if (v) { selectedPickupDate = v; pickupDateCalendarOpen = false; } }"
                                />
                            </template>
                        </u-popover>
                    </template>
                </u-input-date>
            </u-form-field>
        </div>
        <!-- MÓVIL: Form field con input date nativo -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <span
                v-if="rentalDays > 0"
                class="absolute -top-[3px] -right-[3px] z-10 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ rentalDays }} {{ rentalDays === 1 ? 'día' : 'días' }}</span>
            <u-form-field label="Día de devolución" size="xl">
                <!-- No `min`/`max` here on purpose — see the pickup-date note above.
                     The @change handler clamps into [minReturnDate, maxReturnDate]. -->
                <input
                    v-if="minReturnDate"
                    type="date"
                    id="return-date-mobile"
                    name="return-date-mobile"
                    :value="selectedReturnDate ? selectedReturnDate.toString() : ''"
                    aria-label="Día de devolución"
                    class="w-full"
                    @change="onMobileReturnDateChange"
                >
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-input-date -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <span
                v-if="rentalDays > 0"
                class="absolute -top-[3px] -right-[3px] z-10 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
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
                                    @update:model-value="(v) => { if (v) { selectedReturnDate = v; returnDateCalendarOpen = false; } }"
                                />
                            </template>
                        </u-popover>
                    </template>
                </u-input-date>
            </u-form-field>
        </div>
        <!-- MÓVIL: Form field con select nativo -->
        <div class="bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <u-form-field label="Hora de recogida" size="xl">
                <select
                    id="pickup-hour-mobile"
                    v-model="horaRecogida"
                    aria-label="Hora de recogida"
                    class="w-full"
                >
                    <option
                        v-for="hour in pickupHourOptions"
                        :key="hour.value"
                        v-text="hour.label"
                        :value="hour.value"
                    ></option>
                </select>
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <u-form-field label="Hora de recogida" size="xl">
                <u-select-menu
                    v-model="horaRecogida"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                    variant="ghost"
                    :autofocus="false"
                    :items="pickupHourOptions"
                    :ui="{
                        content: 'bg-white',
                        item: 'text-gray-900',
                    }"
                />
            </u-form-field>
        </div>
        <!-- MÓVIL: Form field con select nativo -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm sm:hidden">
            <span
                v-if="extraHoursLabel"
                class="absolute -top-[3px] -right-[3px] z-10 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ extraHoursLabel }}</span>
            <u-form-field label="Hora de devolución" size="xl">
                <select
                    id="return-hour-mobile"
                    v-model="horaDevolucion"
                    aria-label="Hora de devolución"
                    class="w-full"
                >
                    <option
                        v-for="hour in returnHourOptions"
                        :key="hour.value"
                        v-text="hour.label"
                        :value="hour.value"
                    ></option>
                </select>
            </u-form-field>
        </div>

        <!-- DESKTOP: Form field con u-select-menu -->
        <div class="relative bg-white rounded-xl p-2 shadow-sm hidden sm:block">
            <span
                v-if="extraHoursLabel"
                class="absolute -top-[3px] -right-[3px] z-10 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
            >{{ extraHoursLabel }}</span>
            <u-form-field label="Hora de devolución" size="xl">
                <u-select-menu
                    id="return-hour"
                    v-model="horaDevolucion"
                    value-key="value"
                    label-key="label"
                    variant="ghost"
                    class="w-full"
                    :autofocus="false"
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
                :to="searchDestination"
                @click="onSearchClick"
                :disabled="pendingSearching || !animateSearchButton || !searchDisabledGuardSatisfied || !isSelectionWithinSchedule"
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
import { createDateFromString } from '@rentacar-main/logic/utils';
import type { DateObject } from '@rentacar-main/logic/utils';

const route = useRoute();

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

// Mobile uses a native <input type="date">. On some Android date pickers an
// out-of-range value can still be committed, which makes the browser surface
// its native validation bubble ("El valor debe ser igual o posterior a …").
// That bubble is unstyleable and renders dark-on-dark under Android force-dark.
// We never want it: silently snap any out-of-range value back into range on
// change (the user can't rent in the past anyway). Native date inputs always
// emit ISO `YYYY-MM-DD`, so lexicographic comparison is chronological. Desktop
// uses <u-calendar>, which already disables out-of-range days.
const clampMobileDateInput = (event: Event, min?: string | null, max?: string | null, fallback?: string | null): string | null => {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    if (!value) {
        // Disallow clearing the date: the native clear affordance (Android picker /
        // desktop ✕) empties the field. Repaint the last valid value so the input
        // never goes blank, and report "no change" so the shared ref is left intact.
        target.value = fallback ?? '';
        return null;
    }
    if (min && value < min) value = min;
    if (max && value > max) value = max;
    if (value !== target.value) target.value = value;
    return value;
};

// The selectedPickupDate/selectedReturnDate refs are shared with the DESKTOP
// <u-input-date> (Reka UI), which requires a CalendarDate and crashes on a raw
// string. The native mobile input only ever yields a 'YYYY-MM-DD' string, so we
// parse it into a DateObject before writing — never let a string into the ref.
// (The mobile inputs bind :value one-way for the same reason; v-model would push
// the raw string straight into the shared ref on every keystroke.)
const onMobilePickupDateChange = (event: Event) => {
    // Re-enable the search button on any mobile date interaction, even when the
    // clamp leaves the value unchanged (e.g. re-picking a past date already at today),
    // so a second search is never blocked by a stale disabled state.
    animateSearchButton.value = true;
    const clamped = clampMobileDateInput(event, minPickupDate.value?.toString(), undefined, selectedPickupDate.value ? selectedPickupDate.value.toString() : '');
    if (clamped !== null) selectedPickupDate.value = createDateFromString(clamped);
};

const onMobileReturnDateChange = (event: Event) => {
    animateSearchButton.value = true;
    const clamped = clampMobileDateInput(
        event,
        minReturnDate.value?.toString(),
        maxReturnDate.value?.toString(),
        selectedReturnDate.value ? selectedReturnDate.value.toString() : '',
    );
    if (clamped !== null) selectedReturnDate.value = createDateFromString(clamped);
};
const pendingSearching = ref<boolean>(false);
const sortedBranches = ref<any[]>([]);
const pickupHourOptions = ref<any[]>([]);
const returnHourOptions = ref<any[]>([]);
const searchLinkName = ref<string>('');
const searchLinkParams = ref<any>({});
const animateSearchButton = ref<boolean>(true);

// Schedule restriction (#47 W4/W5): per-branch calendar predicates and the
// submit gate, mirrored from useSearch. Defaults are permissive so the form is
// never blocked before the composable initializes.
const isPickupDateUnavailable = ref<(date: DateObject) => boolean>(() => false);
const isReturnDateUnavailable = ref<(date: DateObject) => boolean>(() => false);
const isSelectionWithinSchedule = ref<boolean>(true);

// SCEN-003 — context-aware submit destination.
//   - On a CITY page (route.params.city present) the submit keeps the EXACT F3
//     behavior: the named-route deep link → /[city]/buscar-vehiculos/... (preserves
//     programmatic SEO + cross-brand isolation). searchLinkParams already carries
//     the derived/real city (see syncSearchLinkParams below).
//   - On /reservas (no :city in the route) the submit STAYS on /reservas with the
//     search params in the QUERY STRING (shareable/bookmarkable); the page then
//     renders availability in-place via useSearchByQueryParams. We do NOT redirect
//     to /[branchCity]/... here — the city-derivation stays for the city-link path
//     only. The query mirrors searchLinkParams: pickup/return SLUGS + dates + the
//     12h-formatted times (the same values that build the deep route).
const searchDestination = computed(() => {
  const params = searchLinkParams.value ?? {};
  if (route.params.city) {
    return { name: searchLinkName.value, params: searchLinkParams.value };
  }
  return {
    path: '/reservas',
    query: {
      lugar_recogida: params.lugar_recogida,
      lugar_devolucion: params.lugar_devolucion,
      fecha_recogida: params.fecha_recogida,
      fecha_devolucion: params.fecha_devolucion,
      hora_recogida: params.hora_recogida,
      hora_devolucion: params.hora_devolucion,
      // Preserve referral attribution on the /reservas round-trip (mirrors the
      // city-page branch, which carries referido via searchLinkParams).
      ...(params.referido ? { referido: params.referido } : {}),
    },
  };
});

// Issue #129: the search button is a NuxtLink (:to). When the resolved target URL
// equals the current one (e.g. retrying after an error without changing any field),
// NuxtLink does not navigate, so useSearchByRouteParams never re-mounts and the
// search is never re-fired. Re-trigger doSearch directly in that case. doSearch is
// captured in onMounted, where useSearch is instantiated.
const router = useRouter();
const doSearchFn = ref<(() => void) | null>(null);
const onSearchClick = (e: MouseEvent) => {
  // Resolve BOTH sides through the router so the comparison is query-order- and
  // encoding-insensitive — critical on /reservas, whose :to is a query object whose
  // key order need not match a bookmarked link's. Only preventDefault when doSearch is
  // ready (captured in onMounted): before mount, let NuxtLink's same-URL no-op run.
  const target = router.resolve(searchDestination.value);
  const current = router.resolve(route.fullPath);
  if (target.href === current.href && doSearchFn.value) {
    e.preventDefault();
    doSearchFn.value();
  }
};

// The disabled guard stays meaningful in BOTH contexts: block until a valid pickup
// branch + dates exist. On a city page this is still effectively `city` (the deep
// link is broken without it); on /reservas there is no `city`, so we require a
// resolved pickup-branch slug + both dates instead (otherwise the query would be
// half-empty and the search guard would no-op).
const searchDisabledGuardSatisfied = computed(() => {
  const params = searchLinkParams.value ?? {};
  if (route.params.city) {
    return Boolean(params.city);
  }
  return Boolean(params.lugar_recogida && params.fecha_recogida && params.fecha_devolucion);
});

const pickupDateCalendarOpen = ref<boolean>(false);
const returnDateCalendarOpen = ref<boolean>(false);

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
  // F3 (issue #112): on /reservas there is no route.params.city, so the
  // composable's searchLinkParams.city is undefined and the results link would
  // be broken. Derive the effective city from the chosen pickup branch.
  // Issue #129 followup: PREFER the chosen pickup branch's city over the route
  // city, so selecting another city's branch navigates to that city instead of
  // being bounced back to the current page's default branch ("La sede de recogida
  // no corresponde a la ciudad" reset). Fallback to the route city when no pickup
  // branch is resolved yet. Merge into the local copy — never mutate the composable
  // params. Stays local to alquilame (zero changes to packages/logic).
  const syncSearchLinkParams = (params: any) => {
    const effectiveCity =
      storeAdminData.searchBranchByCode(lugarRecogida.value ?? '')?.city ?? route.params.city;
    searchLinkParams.value = { ...params, city: effectiveCity };
  };
  watch(() => searchComposable.searchLinkParams.value, (val) => syncSearchLinkParams(val), { immediate: true });
  // lugarRecogida feeds the composable's searchLinkParams (via the store sync
  // above), so the watch normally re-fires; this guarantees recomputation of the
  // derived city even if the composable params object is referentially stable.
  watch(lugarRecogida, () => syncSearchLinkParams(searchComposable.searchLinkParams.value));
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


