## Status: PENDING
## Blocked-By:
## Completed:

# Task: City hero `mode` (landing/results) + CityPage forward + page files + tests

## Description
El `city/Hero.vue` lo usan DOS rutas vía `CityPage`: la city landing (`[city]/index.vue`) y la página de resultados (`buscar-vehiculos/...`). Añadir un prop `mode` para que en `landing` el hero NO tenga `Searcher` (CTA "Reservar" → `/reservas`) y en `results` lo conserve (refinar in-situ). `CityPage` reenvía el modo y los 5 page files lo fijan. Tarea bundleada (hero + CityPage + page files + tests) para mantener la suite verde en un solo paso.

## Background
`city/Hero.vue` hoy monta `<Searcher>` incondicional + ancla `#searcher` + pin #41 + guard #109. `CityPage.vue:2` monta `<CityHero :city="city" />` sin modo. La landing y las 4 rutas `buscar-vehiculos` ya pasan `:city="city"`. El test `city/__tests__/Hero.test.ts:56-71,93-94` afirma el engine incondicional → debe volverse mode-aware (Parte D), sin debilitar. El `HomeContact` city usa `reserveAnchor`: en landing apunta a `/reservas` (el `#searcher` queda como `<div>` vacío), en results a `#searcher`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte B — City Hero, CityPage, page files, CTA acoplado + Parte D)

**Additional References:**
- Plan Step 4; `city/__tests__/Hero.test.ts`; `CityPage.vue`

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `city/Hero.vue`: prop `mode: 'landing' | 'results'` (default `'results'`, fail-safe).
   - `results`: idéntico a hoy (`<Searcher>` en `<ClientOnly>`+`<PlaceholdersSearcher>`+`h-[410px]`/`h-[360px]` #109, ancla `#searcher`, pin #41, h1 city).
   - `landing`: SIN `<Searcher>`; CTA "Reservar ahora" `<NuxtLink to="/reservas">`; conservar h1 city + pin #41 (`<span aria-hidden @click>`) + `<div id="searcher" aria-hidden>` vacío.
2. `CityPage.vue`: aceptar prop `mode` (default `'results'`), reenviar `<CityHero :city :mode>`; pasar `reserveAnchor` condicional al `HomeContact` city (`/reservas` en landing, `#searcher` en results).
3. Page files: `[city]/index.vue` → `mode="landing"`; las 4 rutas `buscar-vehiculos/.../index.vue` (con/sin `categoria` × con/sin `referido`) → `mode="results"`.
4. Reescribir `city/__tests__/Hero.test.ts` mode-aware: `results` preserva engine/import/#searcher/#109/`h-[410px]`/`h-[360px]`; `landing` afirma ausencia de `<Searcher>`/`pickup-location-test`, presencia CTA `to="/reservas"`, `id="searcher"` vacío + h1 + pin #41. Sin debilitar.
5. Confirmar `__tests__/CityPage.test.ts` + `home/__tests__/contact-announcement.test.ts` verdes (probablemente sin cambio; el binding reserveAnchor vive en `Contact.vue`, no se toca). Suite de marca verde.

## Dependencies
- **`/reservas`** (step02): destino de los CTAs landing.
- **`HomeContact reserveAnchor`** (prop ya existe desde F2): se reusa condicional.

## Implementation Approach
1. Añadir el prop `mode` + render condicional en `city/Hero.vue`.
2. Threadear `mode` + `reserveAnchor` en `CityPage.vue`.
3. Fijar `mode` en los 5 page files.
4. Reescribir el test mode-aware (ambas ramas); correr la suite de marca para confirmar verde global.

**Note:** Suggested approach.

## Acceptance Criteria
1. **Landing sin engine**
   - Given `/{city}` (landing, `mode="landing"`)
   - When se inspecciona el hero
   - Then NO hay `<Searcher>`/`pickup-location-test`; hay CTA `<NuxtLink to="/reservas">`; se conservan h1 city, pin #41 inerte y `<div id="searcher">` vacío
2. **Results conserva engine**
   - Given una ruta `buscar-vehiculos` (`mode="results"`)
   - When se inspecciona el hero
   - Then hay `<Searcher>` (con `pickup-location-test`/`return-location-test`), ancla `#searcher`, guard #109 (`<ClientOnly>`+`<PlaceholdersSearcher>`+`h-[410px]`/`h-[360px]`) — idéntico a F2
3. **Forward + tests verdes**
   - Given los 5 page files + CityPage
   - When `git grep mode=` en los page files y corre la suite de marca
   - Then `[city]/index.vue`=landing y las 4 `buscar-vehiculos`=results; `reserveAnchor` condicional; `city/Hero.test.ts` reescrito (ambas ramas) y CityPage/contact tests pasan sin debilitar

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: city, hero, mode, citypage, routing, tests
- **Required Skills**: Vue 3 props, Nuxt pages, Vitest
- **Related Tasks**: step02 (CTA destino)
- **Step**: 04 of 09
- **Files to Modify**: `packages/ui-alquilame/app/components/city/Hero.vue`, `packages/ui-alquilame/app/components/CityPage.vue`, `packages/ui-alquilame/app/pages/[city]/index.vue` (+ las 4 rutas buscar-vehiculos index.vue), `packages/ui-alquilame/app/components/city/__tests__/Hero.test.ts`
- **Files to Read**: `packages/ui-alquilame/app/components/__tests__/CityPage.test.ts`, `packages/ui-alquilame/app/components/home/__tests__/contact-announcement.test.ts`, `packages/ui-alquilame/app/components/home/Contact.vue`
- **Context Estimate**: M
- **Scenario-Strategy**: required
