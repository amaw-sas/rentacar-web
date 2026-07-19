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
  branch({ id: 1, code: "OFBO", name: "Oficina Centro", city: "bogota", slug: "bogota-centro" }),
  branch({ id: 2, code: "AABO", name: "Aeropuerto El Dorado", city: "bogota", slug: "bogota-aeropuerto" }),
  branch({ id: 3, code: "AAMD", name: "Aeropuerto Medellín", city: "medellin", slug: "medellin-aeropuerto" }),
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
  // the airport branch's public slug and final 12-hour route representation.
  it("uses the airport branch public slug and normalized hours after mount", () => {
    expect(buildCityReservationURL(bogota, branches, DATES)).toBe(
      "/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-06-06/fecha-devolucion/2026-06-13/hora-recogida/12:00pm/hora-devolucion/12:00pm",
    );
  });

  it("emits the final /reservas surface for Alquilame and Alquicarros", () => {
    expect(buildCityReservationURL(bogota, branches, DATES, "reservas")).toBe(
      "/reservas/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-06-06/fecha-devolucion/2026-06-13/hora-recogida/12:00pm/hora-devolucion/12:00pm",
    );
  });

  it("keeps already-normalized route hours unchanged", () => {
    expect(
      buildCityReservationURL(bogota, branches, {
        ...DATES,
        initHour: "01:30pm",
        endHour: "12:15am",
      }),
    ).toContain("/hora-recogida/01:30pm/hora-devolucion/12:15am");
  });

  // SCEN-3 (regresión): no airport → first branch in the city.
  it("falls back to any city branch when there is no airport branch", () => {
    const noAirport = [branch({ id: 1, code: "OFCL", city: "cali", slug: "cali-centro" })];
    const cali: City = { ...bogota, id: "cali", name: "Cali" };
    expect(buildCityReservationURL(cali, noAirport, DATES)).toBe(
      "/cali/buscar-vehiculos/lugar-recogida/cali-centro/lugar-devolucion/cali-centro/fecha-recogida/2026-06-06/fecha-devolucion/2026-06-13/hora-recogida/12:00pm/hora-devolucion/12:00pm",
    );
  });

  it("falls back to the legacy code only when a branch has no public slug", () => {
    const noSlug = [branch({ id: 1, code: "AABO", city: "bogota" })];
    expect(buildCityReservationURL(bogota, noSlug, DATES)).toContain(
      "/lugar-recogida/aabo/lugar-devolucion/aabo/",
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
