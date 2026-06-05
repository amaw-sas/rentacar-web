import { describe, it, expect } from "vitest";

import { buildCityReservationURL } from "../buildCityReservationURL";
import type City from "../types/type/City";
import type BranchData from "../types/data/BranchData";

const bogota: City = {
  id: "bogota",
  name: "Bogotá",
  description: "",
  testimonials: [],
};

const branch = (over: Partial<BranchData>): BranchData => ({
  id: 1,
  code: "X",
  name: "Sucursal",
  city: "bogota",
  ...over,
});

const branches: BranchData[] = [
  branch({ id: 1, code: "OFBO", name: "Oficina Centro", city: "bogota" }),
  branch({ id: 2, code: "AABO", name: "Aeropuerto El Dorado", city: "bogota" }),
  branch({ id: 3, code: "AAMD", name: "Aeropuerto Medellín", city: "medellin" }),
];

const HOURS = { initHour: "12:00", endHour: "12:00" };
const DATES = { initDay: "2026-06-06", endDay: "2026-06-13", ...HOURS };
const NULL_DATES = { initDay: null, endDay: null, ...HOURS };

describe("buildCityReservationURL", () => {
  // SCEN-1 (hydration): server + first client render pass null dates → stable
  // href identical on both passes → zero hydration attribute mismatch.
  it("returns the stable /city href when dates are null (SSR + first hydration)", () => {
    const ssr = buildCityReservationURL(bogota, branches, NULL_DATES);
    const firstClientRender = buildCityReservationURL(bogota, branches, NULL_DATES);
    expect(ssr).toBe("/bogota");
    expect(firstClientRender).toBe(ssr); // byte-identical → no mismatch
  });

  it("returns the stable /city href when only one date is null", () => {
    expect(
      buildCityReservationURL(bogota, branches, { ...DATES, endDay: null }),
    ).toBe("/bogota");
  });

  // SCEN-2 (frescura) + SCEN-3 (regresión): after mount, dated deep-link using
  // the airport branch (code AA*) for the city.
  it("prefers the airport branch (AA*) and embeds the fresh dates after mount", () => {
    expect(buildCityReservationURL(bogota, branches, DATES)).toBe(
      "/bogota/buscar-vehiculos/lugar-recogida/aabo/lugar-devolucion/aabo/fecha-recogida/2026-06-06/fecha-devolucion/2026-06-13/hora-recogida/12:00/hora-devolucion/12:00",
    );
  });

  // SCEN-3 (regresión): no airport → first branch in the city.
  it("falls back to any city branch when there is no airport branch", () => {
    const noAirport = [branch({ id: 1, code: "OFCL", city: "cali" })];
    const cali: City = { ...bogota, id: "cali", name: "Cali" };
    expect(buildCityReservationURL(cali, noAirport, DATES)).toBe(
      "/cali/buscar-vehiculos/lugar-recogida/ofcl/lugar-devolucion/ofcl/fecha-recogida/2026-06-06/fecha-devolucion/2026-06-13/hora-recogida/12:00/hora-devolucion/12:00",
    );
  });

  // SCEN-3 (regresión): no branch for the city → plain city page fallback.
  it("falls back to /city when the city has no branch at all", () => {
    expect(buildCityReservationURL(bogota, [], DATES)).toBe("/bogota");
    const cucuta: City = { ...bogota, id: "cucuta", name: "Cúcuta" };
    expect(buildCityReservationURL(cucuta, branches, DATES)).toBe("/cucuta");
  });

  it("tolerates a null/undefined branch list", () => {
    expect(
      buildCityReservationURL(bogota, undefined as unknown as BranchData[], DATES),
    ).toBe("/bogota");
  });
});
