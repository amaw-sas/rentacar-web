// Builds the final deep-link URL for a city CTA (the "Ciudades donde ofrecemos
// alquiler de carros" section in every brand layout and the TikTok linktree).
// Alquilatucarro uses its city-search route; Alquilame and Alquicarros use their
// direct /reservas route. Legacy redirects remain only for historical links.
//
// Branch selection priority: airport branch (code starts with "AA") → any
// branch in the city → fallback to the plain city page `/${city.id}`.
//
// Hydration safety (Issue #109): the dated deep-link must NOT be baked into
// SSR/ISR-cached HTML, because `today()` recomputed at hydration time produces
// a different date once the cache crosses a day boundary — causing one
// "hydration attribute mismatch" per city link. The caller passes `initDay`/
// `endDay` as null on the server and during the first client render, and only
// fills them after `onMounted`. When either date is null this returns the
// stable, crawlable `/${city.id}` href — identical on server and first client
// render → no mismatch. After mount the fresh (today+1) deep-link is applied.

import type City from "./types/type/City";
import type BranchData from "./types/data/BranchData";

export interface CityReservationDates {
  initDay: string | null;
  endDay: string | null;
  initHour: string;
  endHour: string;
}

export type CityReservationSurface = "city-search" | "reservas";

function normalizeRouteHour(value: string): string {
  const hour = value.trim().toLowerCase();

  const twelveHour = hour.match(/^(0?[1-9]|1[0-2]):([0-5]\d)(am|pm)$/);
  if (twelveHour) {
    return `${twelveHour[1]!.padStart(2, "0")}:${twelveHour[2]!}${twelveHour[3]!}`;
  }

  const twentyFourHour = hour.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!twentyFourHour) return hour;

  const numericHour = Number(twentyFourHour[1]!);
  const period = numericHour >= 12 ? "pm" : "am";
  const routeHour = numericHour % 12 || 12;
  return `${routeHour.toString().padStart(2, "0")}:${twentyFourHour[2]!}${period}`;
}

export function buildCityReservationURL(
  city: City,
  branches: BranchData[],
  dates: CityReservationDates,
  surface: CityReservationSurface = "city-search",
): string {
  const list = branches ?? [];

  // Buscar la sucursal de aeropuerto para esta ciudad (código empieza con "AA")
  const airportBranch = list.find(
    (branch) => branch.city === city.id && branch.code.startsWith("AA"),
  );

  // Si no hay aeropuerto, buscar cualquier sucursal de esa ciudad
  const branch = airportBranch ?? list.find((branch) => branch.city === city.id);

  // Fallback (sin sucursal) o pre-montaje (fechas aún null): href estable y
  // crawleable, idéntico en servidor y primera hidratación → sin mismatch.
  if (!branch || !dates.initDay || !dates.endDay) {
    return `/${city.id}`;
  }

  const branchSlug = branch.slug || branch.code.toLowerCase();
  const routePrefix = surface === "reservas"
    ? "/reservas"
    : `/${city.id}/buscar-vehiculos`;
  const initHour = normalizeRouteHour(dates.initHour);
  const endHour = normalizeRouteHour(dates.endHour);

  return `${routePrefix}/lugar-recogida/${branchSlug}/lugar-devolucion/${branchSlug}/fecha-recogida/${dates.initDay}/fecha-devolucion/${dates.endDay}/hora-recogida/${initHour}/hora-devolucion/${endHour}`;
}
