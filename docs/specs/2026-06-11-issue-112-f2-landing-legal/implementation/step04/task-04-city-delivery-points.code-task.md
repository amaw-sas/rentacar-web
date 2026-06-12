## Status: COMPLETED
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md
## Completed: 2026-06-11

# Task: F2 Step 4 — Puntos-entrega restyle (branches reales)

## Description
Extraer y restilizar `#puntos-entrega` a `app/components/city/DeliveryPoints.vue`, cableado en `CityPage.vue` como drop-in. Lista los `cityBranches` reales con el estilo del diseño.

## Background
`CityPage.vue` (`#puntos-entrega`, ~182-208) lista los branches de la ciudad (`cityBranches`, derivado de los datos de sucursales). Solo se renderiza si `cityBranches.length > 0`. F2 lo restila preservando los datos.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-04; fila puntos-entrega)
**Additional:**
- `app/components/CityPage.vue` (`#puntos-entrega`, `cityBranches` computed ~416)
- Diseño: `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html` (`#puntos-entrega`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `city/DeliveryPoints.vue` itera `cityBranches` (pasados como prop) con el estilo del diseño.
2. Solo renderiza si hay branches (`v-if="cityBranches.length > 0"`).
3. `bg-linear-to-*`, `.heading-*`; CLS-safe.

## Dependencies
- **Step 1** (rama). `cityBranches` (computed en CityPage).

## Implementation Approach
1. Crear `city/DeliveryPoints.vue` recibiendo `cityBranches` (+ `city` si hace falta para textos).
2. Portar el markup de branches + estilo del diseño.
3. Cablear en `CityPage.vue` (drop-in, mantener el `v-if`).
4. Test: v-for branches, condicional por longitud.

## Acceptance Criteria
1. **Puntos-entrega restilizado (SCEN-F2-04)**
   - Given una ciudad con branches
   - When se ve `#puntos-entrega`
   - Then lista los `cityBranches` reales con el estilo del diseño.
2. **Condicional**
   - Given una ciudad sin branches
   - When renderiza
   - Then la sección no aparece.
3. **Test de contrato**
   - Given el componente
   - When corre el unit test
   - Then valida v-for sobre branches + el guard de longitud + `.heading-*`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f2, city, branches
- **Required Skills**: Vue 3
- **Related Tasks**: Blocked-By step 1
- **Step**: 04 of 08
- **Files to Modify**: `app/components/city/DeliveryPoints.vue` (nuevo), `app/components/CityPage.vue`, `app/components/city/__tests__/DeliveryPoints.test.ts` (nuevo)
- **Files to Read**: `app/components/CityPage.vue`, `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html`
- **Context Estimate**: S
- **Scenario-Strategy**: required
