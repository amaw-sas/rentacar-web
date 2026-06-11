## Status: COMPLETED
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md
## Completed: 2026-06-11

# Task: F2 Step 2 — City hero restyle (preservar Searcher/#41/#109)

## Description
Extraer y restilizar el hero de la city landing a `app/components/city/Hero.vue` con el estilo del diseño (rojo, h1 city-targeted), cableado en `CityPage.vue` como drop-in del hero inline actual. Preserva el motor de búsqueda (`Searcher`), el pin secreto #41 y el guard de hidratación #109.

## Background
El hero actual de `CityPage.vue` tiene `UPageHero` con `Searcher` (testids `pickup-location-test`/`return-location-test`), el pin inerte #41 (`<span aria-hidden>` copy-to-WhatsApp, NO `<button>`), e imágenes. F2 lo restila SIN tocar el comportamiento del searcher (sigue navegando a `/{city}/buscar-vehiculos/...`) ni reintroducir el `<button>` del #41. Lecciones F1: `bg-linear-to-*`, `[--ctx-text-primary:#fff]` (hero rojo → headings blancos), `.heading-*`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-01, F2-06; fila hero)
**Additional:**
- `app/components/CityPage.vue` (hero actual, líneas ~1-91)
- `app/components/Searcher.vue` (preservar testids)
- Diseño: `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html` (`<section id="hero">`)
- `[[reference_tailwind4_gradient_bg_linear]]`

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `city/Hero.vue` con estilo del diseño: gradiente rojo `bg-linear-to-*` + `[--ctx-text-primary:#fff]`, h1 city-targeted "Alquiler de carros en {city}".
2. **Preservar `Searcher`** (mismos testids, mismo destino `buscar-vehiculos`) y `#searcher` scroll target.
3. **Preservar el pin #41**: `<span aria-hidden>` inerte (NO `<button>`, fuera del accessible name del `<h1>`).
4. **#109**: sin `Date`/`today()` horneado en SSR/ISR.
5. Cableado en `CityPage.vue` reemplazando el hero inline; `aspect-ratio` en imágenes (CLS).

## Dependencies
- **Step 1** (no estricto, pero comparte la rama). **`Searcher.vue`**, **datos `city`** (props de CityPage).

## Implementation Approach
1. Crear `city/Hero.vue` recibiendo `city` (y lo que el hero necesite).
2. Portar `Searcher` + pin #41 + imágenes; aplicar estilo del diseño.
3. Reemplazar el bloque hero inline de `CityPage.vue` por `<CityHero :city="..." />`.
4. Test: Searcher presente con testids, pin `<span aria-hidden>`, bg-linear + ctx-text-primary, h1 city.

## Acceptance Criteria
1. **Hero city restilizado + Searcher (SCEN-F2-01)**
   - Given `/{city}`
   - When se ve el hero
   - Then tiene el estilo del diseño y el `Searcher` funciona igual (testids `pickup/return-location-test`, navega a `buscar-vehiculos`).
2. **Pin #41 + #109 (SCEN-F2-06)**
   - Given el hero
   - When se inspecciona
   - Then el pin es `<span aria-hidden>` inerte (no `<button>`) y no hay `Date`/`today()` horneado.
3. **Test de contrato**
   - Given el componente
   - When corre el unit test
   - Then valida Searcher+testids, pin span, `bg-linear`, `[--ctx-text-primary`, ausencia de `bg-gradient-to-`.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f2, city, hero, engine-preserve
- **Required Skills**: Vue 3, @nuxt/ui v4, Tailwind 4
- **Related Tasks**: Blocked-By step 1
- **Step**: 02 of 08
- **Files to Modify**: `app/components/city/Hero.vue` (nuevo), `app/components/CityPage.vue`, `app/components/city/__tests__/Hero.test.ts` (nuevo)
- **Files to Read**: `app/components/CityPage.vue`, `app/components/Searcher.vue`, `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
