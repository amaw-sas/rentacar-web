// External dependencies
import { computed, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { DateFormatter } from '@internationalized/date';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';

// Types
import type { DateObject } from '@rentacar-main/logic/utils';

// Mirrors `defaultTimezone` in utils/useDateFunctions.ts (not exported there).
const TIMEZONE = 'America/Bogota';
const LOCALE = 'es-CO';

// Branch.city arrives lowercase ascii (e.g. 'bogota') but copy expects the
// proper Colombian spelling with diacritics ('Bogotá'). The slug-based admin
// data strips accents on ingest, so we restore them here for the common cities.
// Cities not in this map fall back to plain first-letter capitalization.
const CITY_DISPLAY_MAP: Record<string, string> = {
  bogota: 'Bogotá',
  medellin: 'Medellín',
  cali: 'Cali',
  cartagena: 'Cartagena',
  barranquilla: 'Barranquilla',
  bucaramanga: 'Bucaramanga',
  pereira: 'Pereira',
  manizales: 'Manizales',
  armenia: 'Armenia',
  ibague: 'Ibagué',
  neiva: 'Neiva',
  villavicencio: 'Villavicencio',
  cucuta: 'Cúcuta',
  monteria: 'Montería',
  santamarta: 'Santa Marta',
  popayan: 'Popayán',
  pasto: 'Pasto',
  valledupar: 'Valledupar',
  sincelejo: 'Sincelejo',
  tunja: 'Tunja',
  yopal: 'Yopal',
  rionegro: 'Rionegro',
};

function formatCity(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  if (CITY_DISPLAY_MAP[key]) return CITY_DISPLAY_MAP[key];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Compact month abbreviations. Built manually because DateFormatter('es-CO',
// { month: 'short' }) emits "de abr" / "30 de dic de 2026" — the connector "de"
// is grammatically correct Spanish but visually noisy for a banner label.
const SHORT_MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

function shortMonth(date: DateObject): string {
  return SHORT_MONTHS_ES[date.month - 1];
}

function longMonth(date: DateObject): string {
  return new DateFormatter(LOCALE, { month: 'long', timeZone: TIMEZONE })
    .format(date.toDate(TIMEZONE));
}

interface UnavailabilityContext {
  bannerText: ComputedRef<string>;
  dateRangeLabel: ComputedRef<string>;
  locationLabel: ComputedRef<string>;
}

export default function useUnavailabilityContext(): UnavailabilityContext {
  const formStore = useStoreReservationForm();
  const { selectedPickupLocation, selectedPickupDate, selectedReturnDate } =
    storeToRefs(formStore);

  const dateRangeLabel = computed<string>(() => {
    const pickup = selectedPickupDate.value;
    const ret = selectedReturnDate.value;
    if (!pickup || !ret) return '';

    if (pickup.year !== ret.year) {
      return `${pickup.day} ${shortMonth(pickup)} ${pickup.year} - ${ret.day} ${shortMonth(ret)} ${ret.year}`;
    }

    if (pickup.month === ret.month) {
      // Same month: "12-15 mayo"
      return `${pickup.day}-${ret.day} ${longMonth(pickup)}`;
    }

    // Different month, same year: "30 abr - 2 may"
    return `${pickup.day} ${shortMonth(pickup)} - ${ret.day} ${shortMonth(ret)}`;
  });

  const locationLabel = computed<string>(() => {
    const branch = selectedPickupLocation.value;
    if (!branch) return '';
    const city = formatCity(branch.city ?? '');
    if (!city) return branch.name;
    return `${city} · ${branch.name}`;
  });

  const bannerText = computed<string>(() => {
    const range = dateRangeLabel.value;
    const location = locationLabel.value;
    if (range && location) {
      return `No disponible para el ${range} en ${location}`;
    }
    return 'No disponible para tu búsqueda';
  });

  return {
    bannerText,
    dateRangeLabel,
    locationLabel,
  };
}
