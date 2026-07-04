import { describe, it, expect } from "vitest";

import { SERVICE_CITIES } from "../serviceCities";
import type City from "../types/type/City";

// Ground truth: Supabase `cities` where status='active' (project
// ilhdholjrnbycyvejsub), snapshotted 2026-07-04, ordered by name — the exact
// order the live footer/home rendered before this list became deterministic
// (the cities query is `.order('name')`). This is ALSO the set enumerated as
// `isr: 3600` routes in every brand's nuxt.config routeRules. The three must
// stay in lockstep; see serviceCities.ts.
const EXPECTED: ReadonlyArray<Pick<City, "id" | "name">> = [
  { id: "armenia", name: "Armenia" },
  { id: "barranquilla", name: "Barranquilla" },
  { id: "bogota", name: "Bogotá" },
  { id: "bucaramanga", name: "Bucaramanga" },
  { id: "cali", name: "Cali" },
  { id: "cartagena", name: "Cartagena" },
  { id: "cucuta", name: "Cúcuta" },
  { id: "floridablanca", name: "Floridablanca" },
  { id: "ibague", name: "Ibagué" },
  { id: "manizales", name: "Manizales" },
  { id: "medellin", name: "Medellín" },
  { id: "monteria", name: "Montería" },
  { id: "neiva", name: "Neiva" },
  { id: "palmira", name: "Palmira" },
  { id: "pereira", name: "Pereira" },
  { id: "santa-marta", name: "Santa Marta" },
  { id: "soledad", name: "Soledad" },
  { id: "valledupar", name: "Valledupar" },
  { id: "villavicencio", name: "Villavicencio" },
];

describe("SERVICE_CITIES", () => {
  it("matches the 19 active service cities in Supabase order", () => {
    expect(SERVICE_CITIES).toEqual(EXPECTED);
  });

  it("has exactly 19 cities (FALLBACK_CITY_COUNT invariant)", () => {
    expect(SERVICE_CITIES).toHaveLength(19);
  });

  it("uses slug-form ids (City.id == DB slug), unique, url-safe", () => {
    const ids = SERVICE_CITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z-]*[a-z]$/);
    }
  });

  it("has a non-empty display name per city", () => {
    for (const c of SERVICE_CITIES) {
      expect(c.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("is a stable snapshot: alphabetical by name", () => {
    const names = SERVICE_CITIES.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "es"));
    expect(names).toEqual(sorted);
  });
});
