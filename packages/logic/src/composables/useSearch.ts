// External dependencies
import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { watchDebounced } from "@vueuse/core";

// Internal dependencies - stores
import useStoreAdminData from '../stores/useStoreAdminData';
import useStoreSearchData from '../stores/useStoreSearchData';
import useStoreReservationForm from '../stores/useStoreReservationForm';

// Internal dependencies - composables
import useMessages from './useMessages';

// Internal dependencies - utils
import {
  createTimeFromString,
  createDateFromString,
  createCurrentDateObject,
  createCurrentDateTimeObject,
  extraHourChipLabel,
  futurePickupHourOptions,
  sameDayReturnHourOptions,
  rolloverWhenSameDayExhausted,
  bookableSlotsForDate,
  isDayOpen,
  returnDateForPickupChange,
  latestOpenDayOnOrBefore,
  nearestSlotByTime,
  MAX_RENTAL_DAYS,
  toDatetime,
  formatHumanTime,
  formatTime,
  formatTime12h,
  isBlockingSearchError,
  pickupTimingIssue,
} from '@rentacar-main/logic/utils';

// Types
import type { BranchData, DateObject, LocationSchedule } from '@rentacar-main/logic/utils';

// Opciones de hora estáticas (se generan una sola vez al cargar el módulo)
// Evita regenerar 48 opciones en cada re-render
const generateHourOptions = () => {
  const options: Array<{ value: string; label: string }> = [];
  let slot = createTimeFromString('00:00');

  // 48 half-hour slots from 00:00 to 23:30 inclusive. A `while (slot < 23:30)`
  // loop drops the final 23:30 (the original off-by-one — last option was 23:00),
  // and switching to `<=` would wrap past midnight back to 00:00 and loop
  // forever, so count the 48 slots explicitly.
  for (let i = 0; i < 48; i++) {
    if (slot.toString() === "00:00:00") {
      options.push({ value: "00:00", label: "Medianoche" });
    } else if (slot.toString() === "12:00:00") {
      options.push({ value: "12:00", label: "Mediodía" });
    } else {
      const datetime = toDatetime(createCurrentDateObject(), slot);
      options.push({ value: formatTime(datetime), label: formatHumanTime(datetime) });
    }
    slot = slot.add({ minutes: 30 });
  }
  return options;
};

// Cache estático de opciones de hora (generado una vez)
let _cachedHourOptions: Array<{ value: string; label: string }> | null = null;
const getHourOptions = () => {
  if (!_cachedHourOptions) {
    _cachedHourOptions = generateHourOptions();
  }
  return _cachedHourOptions;
};

export default function useSearch() {

  /** routes */
  const route = useRoute();
  const city = route.params.city as string;
  
  // stores
  const storeForm = useStoreReservationForm();
  const storeSearchData = useStoreSearchData();
  const storeAdminData = useStoreAdminData();
  
  // refs

  const {
    lugarRecogida,
    lugarDevolucion,
    fechaRecogida,
    fechaDevolucion,
    horaRecogida,
    horaDevolucion,
    referido,
    haveMonthlyReservation,
    selectedDays,
    selectedPickupDate,
    selectedReturnDate,
    selectedPickupHour
  } = storeToRefs(storeForm);

  const { error: errorSearchResponse, categoriesAvailabilityData } = storeToRefs(storeSearchData);
  
  const firstSearch = ref<boolean>(true);
  const stopWatching = ref<boolean>(false);
  const animateSearchButton = ref<boolean>(true);
  // noAvailableCategories.value = false;
  
  // functions
  const { search } = storeSearchData;
  const { createMessage, flushMessages } = useMessages();
  const { searchBranchByCity, searchBranchByCode } = storeAdminData;
  
  const doSearch = () => {
    flushMessages();

    // Block a pickup that is already in the past before hitting the backend.
    // The calendar/mobile clamp normally prevents past dates, but a deep-link or
    // stale URL can still seed one — so distinguish a past DATE from today with a
    // passed HOUR and point the message at the right field. Show a friendly
    // notice instead of the backend's harsh "Error" toast, and skip the search.
    if (selectedPickupDate.value && horaRecogida.value) {
      const issue = pickupTimingIssue(
        selectedPickupDate.value,
        createTimeFromString(horaRecogida.value),
        createCurrentDateTimeObject(),
      );
      if (issue) {
        createMessage(
          issue === "past_date"
            ? {
                type: "info",
                title: "Revisa la fecha de recogida",
                message: "Por favor escoge una fecha de recogida igual o posterior a hoy.",
              }
            : {
                type: "info",
                title: "Revisa la hora de recogida",
                message: "Por favor escoge una hora de recogida posterior a la hora actual.",
              },
        );
        return;
      }
    }

    // Block an inverted/zero-length range (return at or before pickup) before
    // hitting the backend. Reachable via a deep-link/stale URL that seeds the
    // return before the pickup, bypassing the UI's auto-bump. selectedDays
    // (rentalDayCount) is 0 exactly when the return is not strictly after the
    // pickup. Show a clear message instead of the backend's generic error. #3.
    if (selectedPickupDate.value && selectedReturnDate.value && selectedDays.value === 0) {
      createMessage({
        type: "info",
        title: "Revisa las fechas",
        message: "La fecha de devolución debe ser posterior a la fecha de recogida.",
      });
      return;
    }

    // Warn about extra-hour charges under the exact same condition that renders
    // the return-hour chip — extraHourChipLabel returns non-null. So the toast
    // and the chip always agree: nothing for a return <= 1 h after pickup (grace)
    // or same/earlier; shown from 1 h 30 on.
    const extraHoursNotice = extraHourChipLabel(
      horaRecogida.value ? createTimeFromString(horaRecogida.value) : null,
      horaDevolucion.value ? createTimeFromString(horaDevolucion.value) : null,
    );
    if (extraHoursNotice) {
      createMessage({
        type: "info",
        title: "Tarifa adicional por horas extras",
        message:
          "las horas extras de uso pueden incrementar el precio total del alquiler.",
      });
    }

    if (lugarRecogida.value != lugarDevolucion.value) {
      createMessage({
        type: "info",
        title: "Tarifa adicional por traslado",
        message:
          "Devolverlo en otra sede o ciudad puede incrementar el precio de alquiler",
      });
    }

    haveMonthlyReservation.value = selectedDays.value == 30;
    // No resetear haveTotalInsurance aquí: lo deriva el watcher de
    // selectedCategory (grid/wizard). Un write a false con instancia viva
    // dejaba total_insurance=false y precio con Total (issue 322 PR1).

    firstSearch.value = false;
    stopWatching.value = true;
    // noAvailableCategories.value = false;
    errorSearchResponse.value = null;


    search();
  }

  const changePickupLocation = function (branch_code: string) {
    lugarRecogida.value = branch_code;
    // selectedReturnLocation.value = selectedPickupLocation.value;
  };
  
  const removePickupLocation = function () {
    lugarRecogida.value = null;
    // selectedPickupLocation.value = undefined;
    // selectedReturnLocation.value = undefined;
  };
  
  /** watchers */

  // Watchers de sincronización pickup → return (flush: 'sync' evita cascada)
  // Se ejecutan sincrónicamente antes del siguiente tick de Vue
  watch(
    lugarRecogida,
    (newPickupLocation) => (lugarDevolucion.value = newPickupLocation),
    { flush: 'sync' }
  );

  // Move the return date WITH the pickup, preserving the duration already on
  // screen (#322 PR7): pickup D → D+2 shifts a D+5 return to D+7, instead of
  // collapsing every pickup change to the +1 default (which destroyed the
  // return the user had chosen). Unknown/invalid previous range falls back to
  // the 1-day minimum, and the result snaps to an open day of the return
  // branch with a floor of pickup + 1 (#47 W6) — the old floor was the pickup
  // itself, so the "default" could land the return ON the pickup day. The
  // MAX_RENTAL_DAYS clamp watcher below still caps an over-shifted return.
  watch(fechaRecogida, (_newPickup, previousPickup): void => {
    if (!selectedPickupDate.value) return;
    // Parse defensively: a deep-link can seed unparseable strings, and the
    // selectedReturnDate getter throws on them (cf. returnDateObject).
    let previous: DateObject | null = null;
    let currentReturn: DateObject | null = null;
    try {
      previous = previousPickup ? createDateFromString(previousPickup) : null;
    } catch { /* corrupt previous pickup → duration falls back to 1 */ }
    try {
      currentReturn = selectedReturnDate.value;
    } catch { /* corrupt return → duration falls back to 1 */ }
    fechaDevolucion.value = returnDateForPickupChange(
      returnBranchSchedule.value,
      selectedPickupDate.value,
      previous,
      currentReturn,
    ).toString();
  }, { flush: 'sync' });

  // When the form lands the pickup on today but no same-day hour is still valid
  // (too late for the 1h lead, e.g. 11 p.m.), today is no longer bookable. Roll
  // the pickup to tomorrow at the first slot (00:00) so the searcher never emits
  // a past-time URL that the results page rejects with "Revisa la hora". Not
  // immediate on purpose: it must react to a form/clamp date change, never
  // reinterpret the fixed params on the results page (useSearchByRouteParams
  // sets the date before instantiating useSearch and never changes it after).
  watch(selectedPickupDate, (pickupDate) => {
    if (!pickupDate) return;
    const rollover = rolloverWhenSameDayExhausted(
      pickupDate,
      createCurrentDateTimeObject(),
      getHourOptions(),
    );
    if (rollover) {
      fechaRecogida.value = rollover.date;
      horaRecogida.value = rollover.hour;
    }
  }, { flush: 'sync' });

  watch(
    horaRecogida,
    (newPickupHour) => (horaDevolucion.value = newPickupHour),
    { flush: 'sync' }
  );

  // Watcher debounced para resetear disponibilidad
  // Agrupa múltiples cambios rápidos en una sola ejecución (50ms)
  watchDebounced(
    [lugarRecogida, lugarDevolucion, fechaRecogida, fechaDevolucion, horaRecogida, horaDevolucion],
    () => {
      categoriesAvailabilityData.value = null;
      animateSearchButton.value = true;
    },
    { debounce: 50 }
  );

  // Desactivar animación cuando los vehículos están desplegados.
  // NO apagar el botón cuando la búsqueda terminó en error bloqueante: el store
  // deja categoriesAvailabilityData en [] (no-null) igual que un resultado real,
  // pero el usuario debe poder reintentar la consulta idéntica (onSearchClick
  // #129 re-dispara doSearch). Un resultado real o inventario vacío
  // (no_available_categories_error) sí lo deshabilita (dedup). Dogfood #1.
  watch(categoriesAvailabilityData, (newValue) => {
    if (newValue !== null && !isBlockingSearchError(errorSearchResponse.value)) {
      animateSearchButton.value = false;
    }
  });

  const defaultLugarRecogida: BranchData | undefined = searchBranchByCity(city) ?? searchBranchByCode(lugarRecogida.value ?? '') ?? searchBranchByCity('bogota');
  const defaultLugarDevolucion: BranchData | undefined = searchBranchByCity(city) ?? searchBranchByCode(lugarDevolucion.value ?? '') ?? searchBranchByCity('bogota');

  // const selectedPickupLocation = ref<BranchData | undefined>(
  //   defaultLugarRecogida
  // );
  // const selectedReturnLocation = ref<BranchData | undefined>(
  //   defaultLugarDevolucion
  // );

  lugarRecogida.value = lugarRecogida.value ?? defaultLugarRecogida?.code ?? null;
  lugarDevolucion.value = lugarDevolucion.value ?? defaultLugarDevolucion?.code ?? null;


  /** computed */
  const searchLinkName = computed(() => {
    return referido.value
      ? "city-buscar-vehiculos-referido-referido-lugar-recogida-lugar_recogida-lugar-devolucion-lugar_devolucion-fecha-recogida-fecha_recogida-fecha-devolucion-fecha_devolucion-hora-recogida-hora_recogida-hora-devolucion-hora_devolucion"
      : "city-buscar-vehiculos-lugar-recogida-lugar_recogida-lugar-devolucion-lugar_devolucion-fecha-recogida-fecha_recogida-fecha-devolucion-fecha_devolucion-hora-recogida-hora_recogida-hora-devolucion-hora_devolucion";
  });
  
  const searchLinkParams = computed(() => {
    const pickupBranch = searchBranchByCode(lugarRecogida.value ?? '');
    const returnBranch = searchBranchByCode(lugarDevolucion.value ?? '');

    // Convert stored 24h format to 12h for URLs
    const pickupTime = horaRecogida.value
      ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaRecogida.value)))
      : null;
    const returnTime = horaDevolucion.value
      ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaDevolucion.value)))
      : null;

    return {
      // Derive the URL city from the SELECTED pickup branch, not the current page
      // (issue #129 followup). Selecting another city's branch in the searcher must
      // navigate to that city; keeping route.params.city produced an inconsistent
      // `/cityA/.../cityB-branch/` URL that the #129 middleware then bounced back to
      // cityA's default branch — the "La sede de recogida no corresponde a la ciudad"
      // reset. Fallback to the route city when no pickup branch is resolved yet, so
      // the named-route link never loses its required `city` param.
      city: pickupBranch?.city ?? route.params.city,
      referido: referido.value,
      lugar_recogida: pickupBranch?.slug,
      lugar_devolucion: returnBranch?.slug,
      fecha_recogida: fechaRecogida.value,
      fecha_devolucion: fechaDevolucion.value,
      hora_recogida: pickupTime,
      hora_devolucion: returnTime,
    };
  });

  // Schedule (issue #47) of the branch chosen at each end, looked up by code.
  // undefined when the branch has no configured schedule → the rules treat it as
  // permissive (no restriction), so this is safe to feed directly.
  const pickupBranchSchedule = computed(
    () => searchBranchByCode(lugarRecogida.value ?? '')?.schedule,
  );
  const returnBranchSchedule = computed(
    () => searchBranchByCode(lugarDevolucion.value ?? '')?.schedule,
  );

  // The return date as a DateObject for the schedule rules. Derived from the
  // stored fechaDevolucion string; null when unset or unparseable.
  const returnDateObject = computed<DateObject | null>(() => {
    if (!fechaDevolucion.value) return null;
    try {
      return createDateFromString(fechaDevolucion.value);
    } catch {
      return null;
    }
  });

  // When the pickup date is today, only offer hours strictly after the current
  // time (a customer can't pick a slot that already passed → no backend "past
  // date" error). Any future date offers the full static list. Late-night
  // fallback: if nothing is left today, keep all options so the select isn't
  // empty — the doSearch guard still blocks an actually-past pickup.
  const pickupHourOptions = computed(() => {
    const allOptions = getHourOptions();
    const pickupDate = selectedPickupDate.value;
    if (!pickupDate) return allOptions;
    const future = futurePickupHourOptions(allOptions, pickupDate, createCurrentDateTimeObject());
    const base = future.length ? future : allOptions;
    // Restrict to the pickup branch's open hours for that date (#47 W4). A closed
    // day yields an empty list on purpose — the calendar disables it on desktop
    // and the search button is blocked (W5) on mobile. Unconfigured → permissive.
    return bookableSlotsForDate(pickupBranchSchedule.value, pickupDate, base);
  });

  // Keep the selected pickup hour valid: when the date moves to today and the
  // chosen hour is now in the past, snap to the earliest still-available slot.
  // horaDevolucion follows via the horaRecogida → horaDevolucion sync watcher.
  watch(pickupHourOptions, (options) => {
    if (!horaRecogida.value || !options.length) return;
    if (!options.some((o) => o.value === horaRecogida.value)) {
      horaRecogida.value = options[0]!.value;
    }
  });

  // Hard MAX_RENTAL_DAYS cap. The calendar's :max-value only guards the widget: a
  // hydrated route writes the raw dates straight into the store, so clamp the return
  // end here — the one place every entry path funnels through.
  //
  // immediate covers useSearchByRouteParams, which sets the refs BEFORE instantiating
  // useSearch (a lazy watcher would never see that write). The brand-local
  // useSearchByQueryParams instantiates first and writes after, so there the plain
  // reactive trigger does the work. Both paths land on the same clamp.
  //
  // Pinning the return hour to the pickup hour makes the window exactly
  // MAX_RENTAL_DAYS × 24 h: a monthly rental carries no extra hours, per the
  // operator's rule. Midnight is the fallback — the same default selectedDays uses —
  // because a URL with no pickup hour would otherwise leave the cap unenforced: the
  // date already sits at the ceiling, so the watcher never fires again to fix it.
  watch(selectedDays, () => {
    if (!selectedPickupDate.value || selectedDays.value <= MAX_RENTAL_DAYS) return;

    const ceiling = selectedPickupDate.value.copy().add({ days: MAX_RENTAL_DAYS });
    // Backward-only: nearestOpenDay prefers moving forward, which would push the
    // return past the ceiling and re-break the cap. The floor is pickup + 1 day, so a
    // branch closed across the whole window yields null (→ the raw ceiling, which the
    // server validates) instead of collapsing the return onto the pickup day and
    // billing zero days.
    const open = latestOpenDayOnOrBefore(
      returnBranchSchedule.value,
      ceiling,
      selectedPickupDate.value.copy().add({ days: 1 }),
    );
    fechaDevolucion.value = (open ?? ceiling).toString();
    horaDevolucion.value = horaRecogida.value ?? '00:00';
  }, { immediate: true, flush: 'sync' });

  // Filtra desde cache cuando hay restricción mensual
  const returnHourOptions = computed(() => {
    const allOptions = getHourOptions();
    let base: Array<{ value: string; label: string }>;

    // Reservas mensuales (30 días): filtra opciones hasta la hora de recogida.
    // `>=` y no `===`: subir la hora de devolución sube selectedDays, así que con
    // `===` la restricción se apagaba justo cuando empezaba a hacer falta (una hora
    // posterior volvía el rango de 31 días y reabría la lista). Con `>=` la condición
    // es monótona y el watcher de snap de abajo devuelve la hora al rango legal.
    if (selectedDays.value >= MAX_RENTAL_DAYS && selectedPickupHour.value) {
      const cutoffIndex = allOptions.findIndex(opt => {
        const optTime = createTimeFromString(opt.value);
        return optTime.compare(selectedPickupHour.value!) > 0;
      });
      base = cutoffIndex === -1 ? allOptions : allOptions.slice(0, cutoffIndex);
    } else {
      // Same-day return: must be at least 1 h after pickup so the rental never has
      // zero/negative duration (the backend's same_hour_error). A later return day
      // keeps the full list. Fallback to all if the pickup is so late nothing is
      // left, so the select is never empty — the friendly same_hour_error toast
      // still guards that residual case.
      const sameDay =
        !!fechaRecogida.value && fechaRecogida.value === fechaDevolucion.value;
      const filtered = sameDayReturnHourOptions(
        allOptions,
        selectedPickupHour.value,
        sameDay,
      );
      base = filtered.length ? filtered : allOptions;
    }

    // Restrict to the return branch's open hours for the return date (#47 W4),
    // independent of the pickup end. Unconfigured branch → permissive.
    const returnDate = returnDateObject.value;
    if (!returnDate) return base;
    return bookableSlotsForDate(returnBranchSchedule.value, returnDate, base);
  });

  // Calendar predicates (#47 W4): a date is unavailable when the branch at that
  // end is closed that day. Bound to each calendar's `is-date-unavailable`,
  // independent for pickup vs return. Exposed as a computed RETURNING a function
  // so a branch change yields a new function identity → the calendar re-renders
  // its grid against the new schedule (a bare function wouldn't re-evaluate).
  const isPickupDateUnavailable = computed(() => {
    const schedule = pickupBranchSchedule.value;
    return (date: DateObject) => !isDayOpen(schedule, date);
  });
  const isReturnDateUnavailable = computed(() => {
    const schedule = returnBranchSchedule.value;
    return (date: DateObject) => !isDayOpen(schedule, date);
  });

  // Whether a chosen hour falls inside the branch's open hours for that date.
  // Reuses the slot rule with a single-element list so it can't drift from the
  // selector. Nothing chosen yet → not blocking.
  const isHourWithinSchedule = (
    schedule: LocationSchedule | undefined,
    date: DateObject | null,
    hour: string | null,
  ): boolean => {
    if (!date || !hour) return true;
    return bookableSlotsForDate(schedule, date, [{ value: hour }]).length > 0;
  };

  // Gate for the search button (#47 W5). The selection is within schedule when
  // BOTH ends have an open day AND an hour inside that day's ranges. The closed
  // branch (Localiza would reject the reservation anyway) is blocked before
  // submit; the calendar disables closed days on desktop and this blocks mobile,
  // where the native date input can't grey out single days.
  const isSelectionWithinSchedule = computed(() => {
    const pickupOk =
      !selectedPickupDate.value ||
      (isDayOpen(pickupBranchSchedule.value, selectedPickupDate.value) &&
        isHourWithinSchedule(pickupBranchSchedule.value, selectedPickupDate.value, horaRecogida.value));
    const returnOk =
      !returnDateObject.value ||
      (isDayOpen(returnBranchSchedule.value, returnDateObject.value) &&
        isHourWithinSchedule(returnBranchSchedule.value, returnDateObject.value, horaDevolucion.value));
    return pickupOk && returnOk;
  });

  // Notify once when a previously valid selection falls out of schedule (e.g. the
  // branch changed under an already-chosen date/hour, SCEN-11). The existing
  // hour-snap watchers auto-fix what they can; this covers the residual cases
  // that leave the button blocked so the user knows why.
  watch(isSelectionWithinSchedule, (ok, was) => {
    if (!ok && was) {
      createMessage({
        type: 'info',
        title: 'Revisa el horario de la sucursal',
        message:
          'La fecha u hora elegida está fuera del horario de atención de la sucursal. Ajústala para continuar.',
      });
    }
  });

  // Keep the return hour valid: when same-day rules shrink the options (the
  // pickup hour moved later, or the return date collapsed onto the pickup day),
  // snap to the earliest allowed slot. This is what turns the raw horaRecogida →
  // horaDevolucion copy into the "≥ 1 h after pickup" default on a same-day rental.
  // immediate: a results page loaded straight from a URL whose return hour is
  // already invalid (e.g. an old same-day link with return ≤ pickup) sets the
  // store params before this watcher is registered, so it would never see the
  // "change" — snap on registration too, otherwise the select renders blank.
  watch(returnHourOptions, (options) => {
    if (!horaDevolucion.value || !options.length) return;
    if (!options.some((o) => o.value === horaDevolucion.value)) {
      // Snap to the nearest open slot, not the earliest (#47 W6): a copied pickup
      // hour past the return branch's close (e.g. 15:00 vs a 14:00 Saturday close)
      // lands on 14:00, not 08:00. For same-day rentals the nearest valid slot to
      // the copied pickup hour is still the earliest (≥ pickup + 1 h), unchanged.
      horaDevolucion.value = nearestSlotByTime(options, horaDevolucion.value)!.value;
    }
  }, { immediate: true });
  
  return { 
    doSearch,
    changePickupLocation,
    removePickupLocation,
    firstSearch, 
    stopWatching, 
    animateSearchButton,
    // noAvailableCategories, 
    searchLinkName,
    searchLinkParams,
    pickupHourOptions,
    returnHourOptions,
    isPickupDateUnavailable,
    isReturnDateUnavailable,
    isSelectionWithinSchedule,
    // selectedPickupLocation,
    // selectedReturnLocation,
  };
}
