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

function longMonth(date: DateObject): string {
  return new DateFormatter(LOCALE, { month: 'long', timeZone: TIMEZONE })
    .format(date.toDate(TIMEZONE));
}

interface UnavailabilityContext {
  bannerText: ComputedRef<string>;
  pickupDateLabel: ComputedRef<string>;
  locationLabel: ComputedRef<string>;
  // True when both the pickup day and location are populated, i.e. the banner
  // shows the specific reason rather than the generic fallback. Templates
  // gate the second banner line on this flag so the literal "No disponible
  // para tu búsqueda" never has to be duplicated outside this composable.
  isSpecific: ComputedRef<boolean>;
}

export default function useUnavailabilityContext(): UnavailabilityContext {
  const formStore = useStoreReservationForm();
  const { selectedPickupLocation, selectedPickupDate } =
    storeToRefs(formStore);

  // Availability is decided by the pickup day alone — the return date never
  // changes whether a category is bookable — so the banner names only that
  // day: "13 de junio". (No range, no year: the searcher context supplies it.)
  const pickupDateLabel = computed<string>(() => {
    const pickup = selectedPickupDate.value;
    if (!pickup) return '';
    return `${pickup.day} de ${longMonth(pickup)}`;
  });

  const locationLabel = computed<string>(() => {
    const branch = selectedPickupLocation.value;
    if (!branch) return '';
    // BranchData.city is `string` (required, non-null per type). Trust the
    // type — if admin payload ever drops it, the type contract should be
    // fixed at the source, not patched defensively here.
    const city = formatCity(branch.city);
    if (!city) return branch.name;
    // Branch names already lead with the city in the admin data ("Bogotá
    // Aeropuerto", "Floridablanca"), so prefixing it again reads as the
    // redundant "Bogotá · Bogotá Aeropuerto". Only prepend the city when the
    // name does NOT already start with it, so suffix-only branches ("Sucursal
    // Norte") keep their city context.
    const nameStartsWithCity = branch.name
      .trim()
      .toLowerCase()
      .startsWith(city.toLowerCase());
    return nameStartsWithCity ? branch.name : `${city} · ${branch.name}`;
  });

  const isSpecific = computed<boolean>(() =>
    Boolean(pickupDateLabel.value && locationLabel.value),
  );

  const bannerText = computed<string>(() => {
    if (isSpecific.value) {
      return `No disponible para el ${pickupDateLabel.value} en ${locationLabel.value}`;
    }
    return 'No disponible para tu búsqueda';
  });

  return {
    bannerText,
    pickupDateLabel,
    locationLabel,
    isSpecific,
  };
}
