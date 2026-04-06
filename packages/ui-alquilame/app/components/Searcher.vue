<template>
    <u-form
        class="w-full mx-auto md:w-3/6 lg:w-4/6 grid grid-cols-2 auto-rows-min gap-2 light"
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
        <!-- Date Range Picker - Unified for mobile and desktop -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Período de alquiler" size="xl">
                <u-popover v-model:open="dateRangePopoverOpen" :ui="{ content: 'bg-white' }">
                    <u-button
                        variant="ghost"
                        color="neutral"
                        class="w-full justify-start text-left font-normal"
                        aria-label="Seleccionar período de alquiler"
                    >
                        <template #leading>
                            <IconsCalendarIcon cls="size-4" />
                        </template>

                        <span v-if="dateRange.start && dateRange.end" class="text-gray-900">
                            {{ formatDateRange(dateRange) }}
                        </span>
                        <span v-else class="text-gray-400">
                            Selecciona fechas de recogida y devolución
                        </span>
                    </u-button>

                    <template #content>
                        <u-calendar
                            v-model="dateRange"
                            range
                            :number-of-months="numberOfMonths"
                            :min-value="minPickupDate"
                            :max-value="maxReturnDate"
                            color="success"
                            :ui="calendarUIConfig"
                            :prev-year="{ color: 'neutral', variant: 'solid' }"
                            :next-year="{ color: 'neutral', variant: 'solid' }"
                            :prev-month="{ color: 'neutral', variant: 'solid' }"
                            :next-month="{ color: 'neutral', variant: 'solid' }"
                            class="p-2 calendar-light"
                        />
                    </template>
                </u-popover>

                <p v-if="dateRangeError" class="text-sm text-error-500 mt-1">
                    {{ dateRangeError }}
                </p>
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
        <div class="bg-white rounded-xl p-2 shadow-sm sm:hidden">
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
        <div class="bg-white rounded-xl p-2 shadow-sm hidden sm:block">
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
                :to="{name: searchLinkName, params: searchLinkParams}"
                :disabled="!isDateRangeValid || pendingSearching || !animateSearchButton"
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
// Note: stores and components are auto-imported by Nuxt

import { CalendarDate, parseDate, getLocalTimeZone, DateFormatter } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

// Conversion helpers: String ISO ↔ CalendarDate
function stringToCalendarDate(dateString: string | null): CalendarDate | null {
  if (!dateString) return null
  try {
    return parseDate(dateString)
  } catch {
    return null
  }
}

function calendarDateToString(calendarDate: CalendarDate | null): string | null {
  if (!calendarDate) return null
  return calendarDate.toString()
}

// Constants
const MAX_RENTAL_DAYS = 30

/** Local refs - initialized lazily to avoid SSR Pinia errors */
const lugarRecogida = ref<string | null>(null);
const lugarDevolucion = ref<string | null>(null);
const horaRecogida = ref<string | null>(null);
const horaDevolucion = ref<string | null>(null);
const referido = ref<string | null>(null);
const minPickupDate = ref<any>(null);
const selectedPickupDate = ref<any>(null);
const selectedReturnDate = ref<any>(null);
const pendingSearching = ref<boolean>(false);
const sortedBranches = ref<any[]>([]);
const pickupHourOptions = ref<any[]>([]);
const returnHourOptions = ref<any[]>([]);
const searchLinkName = ref<string>('');
const searchLinkParams = ref<any>({});
const animateSearchButton = ref<boolean>(true);

const dateRangePopoverOpen = ref<boolean>(false);
const isDesktop = ref<boolean>(false);

/**
 * Date range state for the calendar picker
 *
 * ARCHITECTURAL DECISION: ref + watchers instead of computed (deviation from original plan)
 *
 * ORIGINAL PLAN: Use computed with getter/setter for bidirectional binding
 * ISSUE DISCOVERED: Computed getter was creating new CalendarDate objects on every access,
 *                   causing UCalendar to treat every render as a "new selection" and
 *                   requiring double-clicks to select dates (commit 54207fb).
 *
 * CURRENT SOLUTION: Direct ref with explicit watchers for bidirectional sync
 * - Pros: Stable object references, UCalendar works correctly
 * - Cons: More complex sync logic with `isUpdatingFromCalendar` flag to prevent loops
 *
 * SYNC ARCHITECTURE:
 * 1. Calendar changes → watch(dateRange) → updates store (selectedPickupDate/selectedReturnDate)
 * 2. Store changes → watchEffect() → updates dateRange (with loop prevention via flag)
 * 3. Store ↔ URL handled separately by formRefs store
 *
 * The complexity is necessary because UCalendar requires stable object references
 * for proper interaction behavior.
 */
const dateRange = ref<{ start: CalendarDate | null, end: CalendarDate | null }>({
  start: null,
  end: null
})

// Derived synchronously from dateRange.start so UCalendar always sees the correct
// max-value in the same reactive cycle — no async watcher lag.
const maxReturnDate = computed(() =>
  dateRange.value?.start
    ? dateRange.value.start.add({ days: MAX_RENTAL_DAYS })
    : null
)

// Responsive: 2 meses en desktop, 1 en móvil
const numberOfMonths = computed(() => isDesktop.value ? 2 : 1)

// Error message for invalid ranges
const dateRangeError = computed(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return null

  const start = dateRange.value.start
  const end = dateRange.value.end
  const daysDiff = end.compare(start)

  if (daysDiff === 0) {
    return 'La devolución debe ser al menos 1 día después'
  }
  if (daysDiff > MAX_RENTAL_DAYS) {
    return `Máximo ${MAX_RENTAL_DAYS} días de alquiler`
  }

  return null
})

// Validation state for search button
const isDateRangeValid = computed(() => {
  return dateRange.value?.start && dateRange.value?.end && !dateRangeError.value
})

// Date formatter for display
const df = new DateFormatter('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

// Format date range for display
function formatDateRange(range: { start: CalendarDate | null, end: CalendarDate | null }) {
  if (!range.start || !range.end) return ''

  const start = df.format(range.start.toDate(getLocalTimeZone()))
  const end = df.format(range.end.toDate(getLocalTimeZone()))

  return `${start} - ${end}`
}

// Calendar UI configuration for better contrast and visibility
const calendarUIConfig = {
    root: 'bg-white',
    header: 'text-gray-900 flex items-center justify-center gap-2',  // Center buttons with gap
    body: 'bg-white flex flex-row gap-4 pt-4',  // Horizontal layout for multiple months
    heading: 'text-gray-900 font-bold',
    headCell: 'text-success-600 font-medium',  // Day names (L M X J V S D)
    cellTrigger: 'text-gray-900 font-semibold data-[disabled]:text-gray-300 data-[disabled]:opacity-40 data-[unavailable]:text-gray-300 data-[unavailable]:opacity-40 data-[outside-view]:text-gray-400 data-[outside-view]:opacity-50'
};

// Initialize stores only on client side after mount
onMounted(() => {
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
  watch(() => formRefs.selectedPickupDate.value, (val) => selectedPickupDate.value = val, { immediate: true });
  watch(() => formRefs.selectedReturnDate.value, (val) => selectedReturnDate.value = val, { immediate: true });
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
  watch(() => searchComposable.pickupHourOptions.value, (val) => pickupHourOptions.value = val, { immediate: true });
  watch(() => searchComposable.returnHourOptions.value, (val) => returnHourOptions.value = val, { immediate: true });
  watch(() => searchComposable.searchLinkName.value, (val) => searchLinkName.value = val, { immediate: true });
  watch(() => searchComposable.searchLinkParams.value, (val) => searchLinkParams.value = val, { immediate: true });
  watch(() => searchComposable.animateSearchButton.value, (val) => animateSearchButton.value = val, { immediate: true });

  // Setup responsive detection
  const updateIsDesktop = () => {
    isDesktop.value = window.matchMedia('(min-width: 640px)').matches
  }
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)

  onUnmounted(() => {
    window.removeEventListener('resize', updateIsDesktop)
  })

  /**
   * BIDIRECTIONAL SYNC IMPLEMENTATION
   *
   * This flag prevents infinite loops in the bidirectional sync between calendar and store:
   * - When user interacts with calendar → dateRange changes → updates store
   * - Store updates could trigger watchEffect → update dateRange → infinite loop
   * - Flag ensures we skip store→calendar sync when update originated from calendar
   *
   * Why this complexity is necessary:
   * - UCalendar v-model (dateRange) needs stable object references
   * - Store refs (selectedPickupDate/selectedReturnDate) are strings from URL params
   * - We need bidirectional sync: calendar ↔ store ↔ URL
   * - Without this flag, changes would ping-pong infinitely between watchers
   */
  let isUpdatingFromCalendar = false

  /**
   * Sync Direction 1: Calendar → Store
   * When user selects dates in the calendar, update store refs
   */
  watch(() => dateRange.value, (newRange) => {
    isUpdatingFromCalendar = true
    if (newRange?.start) {
      selectedPickupDate.value = calendarDateToString(newRange.start)
    }
    if (newRange?.end) {
      selectedReturnDate.value = calendarDateToString(newRange.end)
    }
    // Reset flag after DOM updates to allow store → calendar sync again
    nextTick(() => {
      isUpdatingFromCalendar = false
    })
  }, { deep: true })

  /**
   * Sync Direction 2: Store → Calendar
   * When store values change (from URL params or other components), update calendar
   *
   * Uses watchEffect with flush:'post' to run after all other watchers complete,
   * ensuring store values from URL params are fully loaded before we sync to calendar
   */
  watchEffect(() => {
    // Skip if update originated from calendar to prevent loops
    if (isUpdatingFromCalendar) return

    // selectedPickupDate/selectedReturnDate are DateObject from store, convert to string first
    const pickupString = selectedPickupDate.value?.toString() ?? null
    const returnString = selectedReturnDate.value?.toString() ?? null

    const newStart = stringToCalendarDate(pickupString)
    const newEnd = stringToCalendarDate(returnString)

    // Check if update is needed
    const needsUpdate =
      (newStart && !dateRange.value?.start) ||
      (newEnd && !dateRange.value?.end) ||
      (newStart && dateRange.value?.start && newStart.compare(dateRange.value.start) !== 0) ||
      (newEnd && dateRange.value?.end && newEnd.compare(dateRange.value.end) !== 0) ||
      (!newStart && dateRange.value?.start) ||
      (!newEnd && dateRange.value?.end)

    if (needsUpdate) {
      dateRange.value = {
        start: newStart,
        end: newEnd
      }
    }
  }, { flush: 'post' })

  /**
   * Auto-close popover when range selection is complete
   *
   * UX Flow: User opens picker → selects start date → selects end date → popover auto-closes.
   * Works regardless of whether the picker was opened empty or with existing dates.
   *
   * The 300ms delay is a UX heuristic (not tied to actual animation duration) that gives
   * visual feedback before closing (user sees their selection).
   * TODO: Replace with transitionend event when UPopover lifecycle API exposes it.
   */
  watch(() => dateRange.value?.end, (end, oldEnd) => {
    const endChanged = end && (!oldEnd || end.compare(oldEnd) !== 0)
    if (end && dateRange.value?.start && dateRangePopoverOpen.value && endChanged) {
      setTimeout(() => {
        dateRangePopoverOpen.value = false
      }, 300)
    }
  })
});

</script>


