import type City from "./types/type/City";

/**
 * Deterministic, build-time list of the cities the brands actively serve.
 *
 * WHY THIS IS STATIC (issue #221). The footer (`layouts/default.vue`) and the
 * home "Ciudades" section render a `v-for` over this set and derive the "N
 * ciudades" copy from its length. Those surfaces are cached with `isr: 3600`.
 * When the list came from live Supabase data (`useData().cities`), the ISR HTML
 * and the `_payload.json` Nuxt hydrates from could hold different `cities`
 * snapshots (independent revalidation windows / an added-or-removed city), so
 * the client hydrated a different number of `<a>` nodes than the server had
 * rendered → intermittent "Hydration … mismatch" in production (never in dev,
 * where SSR is fresh per request). Reading a build-time constant makes the
 * server render and the client's first render byte-identical, which is the only
 * way to guarantee no mismatch while keeping the links crawlable in SSR (a
 * `<ClientOnly>` fallback would drop them from the HTML and lose the SEO).
 *
 * This reintroduces, deliberately and minimally, the static city list that
 * issue #6 removed in favour of live data. The "live count auto-tracks the
 * dashboard" benefit never fully held: adding a city already requires a code
 * change — a new `isr` route in every brand's `routeRules` — and the SEO copy
 * literals drifted anyway (14/16/20 for the same 19 cities). So the honest
 * model is: adding/removing a city is a coordinated edit of THREE places that
 * must stay in lockstep:
 *   1. this list,
 *   2. the `isr: 3600` routes in each brand's `nuxt.config.ts` routeRules,
 *   3. the SEO count literals (nuxt.config `description`, app.config, gana).
 *
 * SOURCE OF TRUTH: Supabase `cities` where status='active' (project
 * ilhdholjrnbycyvejsub), ordered by name — the exact order the live footer used
 * (the query is `.order('name')`), so switching to this constant does not
 * reorder anything. `City.id` is the DB slug (see transformers.ts:
 * `id: row.slug`), which is what the ISR routes and deep-links key on.
 *
 * Snapshotted 2026-07-04: 19 active cities (Chía, Pasto, Sabaneta and Yopal are
 * inactive and intentionally excluded). `serviceCities.test.ts` guards the set,
 * count and shape against this snapshot.
 */
export const SERVICE_CITIES: ReadonlyArray<Pick<City, "id" | "name">> = [
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
