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
  'santa-marta': 'Santa Marta',
  popayan: 'Popayán',
  pasto: 'Pasto',
  valledupar: 'Valledupar',
  sincelejo: 'Sincelejo',
  tunja: 'Tunja',
  yopal: 'Yopal',
  rionegro: 'Rionegro',
};

function formatCity(raw: string): string {
  // Trim first: a whitespace-only city ('   ') must read as empty, otherwise
  // locationLabel renders a malformed '   · Sucursal' with an orphan
  // separator. The trimmed, lowercased key also drives the map lookup and the
  // fallback, so surrounding whitespace never leaks into the output.
  const key = raw?.trim().toLowerCase() ?? '';
  if (!key) return '';
  if (CITY_DISPLAY_MAP[key]) return CITY_DISPLAY_MAP[key];
  // Hyphenated slugs not in the map ('el-poblado') are multi-word cities:
  // title-case each segment so they read 'El Poblado', not 'El-poblado'.
  return key
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
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
  // True when both date range and location are populated, i.e. the banner
  // shows the specific reason rather than the generic fallback. Templates
  // gate the second banner line on this flag so the literal "No disponible
  // para tu búsqueda" never has to be duplicated outside this composable.
  isSpecific: ComputedRef<boolean>;
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
      if (pickup.day === ret.day) {
        // Same day (pickup === return): "12 mayo", not the ambiguous "12-12".
        return `${pickup.day} ${longMonth(pickup)}`;
      }
      // Same month: "12-15 mayo"
      return `${pickup.day}-${ret.day} ${longMonth(pickup)}`;
    }

    // Different month, same year: "30 abr - 2 may"
    return `${pickup.day} ${shortMonth(pickup)} - ${ret.day} ${shortMonth(ret)}`;
  });

  const locationLabel = computed<string>(() => {
    const branch = selectedPickupLocation.value;
    if (!branch) return '';
    // BranchData.city is `string` (required, non-null per type). Trust the
    // type — if admin payload ever drops it, the type contract should be
    // fixed at the source, not patched defensively here.
    const city = formatCity(branch.city);
    if (!city) return branch.name;
    return `${city} · ${branch.name}`;
  });

  const isSpecific = computed<boolean>(() =>
    Boolean(dateRangeLabel.value && locationLabel.value),
  );

  const bannerText = computed<string>(() => {
    if (isSpecific.value) {
      return `No disponible para el ${dateRangeLabel.value} en ${locationLabel.value}`;
    }
    return 'No disponible para tu búsqueda';
  });

  return {
    bannerText,
    dateRangeLabel,
    locationLabel,
    isSpecific,
  };
}
