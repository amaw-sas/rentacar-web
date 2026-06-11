## Status: PENDING
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed:

# Task: F1 Step 3 — How-it-works + Value props + Stats (presentacionales nuevas)

## Description
Crear tres secciones presentacionales nuevas del diseño: `HowItWorks.vue` (3 pasos), `ValueProps.vue` (4 props) y `Stats.vue` (banda de stats), y montarlas en `index.vue`.

## Background
Secciones que no existen en el home actual. Son puramente presentacionales (copy del diseño). El headline de value-props toma el nombre de marca de `organization.brand` ("Alquilame", capitalizado) — NO `franchise.shortname` (minúscula "alquilame"). La banda de stats usa copy del diseño tal cual (incl. "desde 2015") — única excepción nombrada a "datos reales" (no tiene fuente de datos).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-03; filas how-it-works/value-props/stats; excepción de stats)
**Additional:**
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (`#how-it-works`, value props, banda de stats)
- `app/app.config.ts` (`organization.brand`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `HowItWorks.vue`: 3 pasos (Elige tu Ciudad y Vehículo · Reserva con anticipación · Recoge y Disfruta), estilo del diseño.
2. `ValueProps.vue`: 4 props (Sin Anticipos · Flota Nueva · Asistencia 24/7 · Cobertura Nacional); headline desde `organization.brand` (NO hardcodear, NO `shortname`).
3. `Stats.vue`: banda de stats con copy del diseño (Vehículos · Ciudades · Años desde 2015).
4. Gradientes/fondos con `bg-linear-*`; headings con `.heading-*`.
5. Montadas en `index.vue` en el orden del diseño.

## Dependencies
- **Step 1** (orquestación de `home/*` en `index.vue`).
- **`organization.brand`**: en `app.config.ts`.

## Implementation Approach
1. Crear los 3 componentes con el markup/copy del diseño.
2. En `ValueProps.vue`, derivar el nombre de marca de `useAppConfig().organization.brand`.
3. Montar `<HomeHowItWorks/>`, `<HomeValueProps/>`, `<HomeStats/>` en `index.vue`.
4. Test: presencia de las 3 secciones; headline deriva de config (no literal "Alquilame").

## Acceptance Criteria
1. **Tres secciones presentes (SCEN-F1-03 parcial)**
   - Given el home
   - When se recorre
   - Then existen how-it-works (3 pasos), value props (4) y banda de stats con el estilo del diseño.
2. **Headline desde config**
   - Given `ValueProps.vue`
   - When renderiza el headline
   - Then usa `organization.brand` ("Alquilame") — no hardcodea el string ni usa `shortname` minúscula.
3. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then valida presencia de las 3 secciones y que el headline deriva de config.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, presentational
- **Required Skills**: Vue 3, Tailwind 4
- **Related Tasks**: Blocked-By step 1
- **Step**: 03 of 11
- **Files to Modify**: `app/components/home/HowItWorks.vue` (nuevo), `app/components/home/ValueProps.vue` (nuevo), `app/components/home/Stats.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/presentational.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`, `app/app.config.ts`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
