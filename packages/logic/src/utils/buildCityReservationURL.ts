// Builds the deep-link URL for a city footer button (the "Ciudades donde
// ofrecemos alquiler de carros" section in every brand layout).
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

export function buildCityReservationURL(
  city: City,
  branches: BranchData[],
  dates: CityReservationDates,
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

  const code = branch.code.toLowerCase();
  return `/${city.id}/buscar-vehiculos/lugar-recogida/${code}/lugar-devolucion/${code}/fecha-recogida/${dates.initDay}/fecha-devolucion/${dates.endDay}/hora-recogida/${dates.initHour}/hora-devolucion/${dates.endHour}`;
}
