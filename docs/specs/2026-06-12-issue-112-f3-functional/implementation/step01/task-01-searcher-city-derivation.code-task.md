## Status: PENDING
## Blocked-By:
## Completed:

# Task: Searcher — derivar ciudad de la sucursal de recogida

## Description
El `Searcher` arma la URL de resultados con un route name + params donde `city` sale de `route.params.city`. En la página nueva `/reservas` no hay `:city` en la ruta, así que el link saldría roto. Esta tarea hace que, cuando no hay ciudad en la ruta, la ciudad se derive de la sucursal de recogida elegida. Es el ÚNICO toque al motor de F3 y queda local a la marca alquilame (cero cambios en `packages/logic`).

## Background
`Searcher.vue` copia `searchComposable.searchLinkParams` a un ref local (~`:414`) y lo usa en `<NuxtLink :to="{name: searchLinkName, params: searchLinkParams}">` (`:309`). `searchLinkParams.city` viene de `useSearch()` (`packages/logic/src/composables/useSearch.ts:214`, `city: route.params.city`). El dropdown de recogida usa `sortedBranches` (`storeAdminData.sortedBranches`, global — todas las ciudades), así que la sucursal elegida pertenece a cualquier ciudad. Cada `BranchData` trae `.city` (mismo formato de slug que `route.params.city`). `Searcher.vue` HOY no importa `useRoute` ni resuelve branches por code; `storeAdminData` ya está instanciado en `:381` y expone el método `searchBranchByCode` (`useStoreAdminData.ts:34`).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (sección "Arquitectura del motor de búsqueda" + Parte A)

**Additional References:**
- Plan: `docs/specs/2026-06-12-issue-112-f3-functional/implementation/plan.md` (Step 1)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. En `Searcher.vue` (solo alquilame), tras copiar `searchLinkParams` al ref local, sobrescribir `city` con la ciudad de la sucursal de recogida cuando `route.params.city` es `undefined`/falsy: `city: route.params.city ?? storeAdminData.searchBranchByCode(lugarRecogida.value ?? '')?.city`.
2. Añadir `const route = useRoute()` (no existe hoy en el componente) y resolver la sucursal vía el método `storeAdminData.searchBranchByCode` (NO una función auto-importada).
3. En city pages (con `route.params.city`) el valor y el comportamiento son idénticos a hoy — sin regresión.
4. `searchLinkName` sin cambio. `data-testid` `pickup-location-test` / `return-location-test` intactos.
5. CERO cambios en `packages/logic` (`git diff packages/logic` vacío).

## Dependencies
- **`storeAdminData.searchBranchByCode`**: método del store admin (verificar que existe y devuelve un objeto con `.city`).
- **`sortedBranches` global**: ya provee todas las sucursales (no requiere cambio).

## Implementation Approach
1. Importar/instanciar `useRoute()` en el `<script setup>` del Searcher.
2. Donde se copia `searchComposable.searchLinkParams` al ref local, derivar la ciudad efectiva y mergearla en el params local sin mutar el del composable.
3. Asegurar reactividad: cuando cambia `lugarRecogida`, el `city` derivado se recomputa.
4. Añadir un test de guard del comportamiento de derivación.

**Note:** Suggested approach. Alternativas válidas si cumplen los AC.

## Acceptance Criteria
1. **Derivación sin ciudad en ruta**
   - Given `/reservas` (sin `:city`) y una sucursal de recogida elegida cuya ciudad es `bogota`
   - When se calcula el `:to` del botón de búsqueda
   - Then `params.city === 'bogota'` (derivado de la sucursal), y el link resuelve a `/bogota/buscar-vehiculos/...`
2. **Sin regresión en city pages**
   - Given una city page con `route.params.city = 'medellin'`
   - When se calcula el `:to`
   - Then `params.city === 'medellin'` (igual que hoy), sin cambio de comportamiento
3. **Aislamiento + testids**
   - Given el diff de la tarea
   - When `git diff packages/logic --stat` y se inspecciona el Searcher
   - Then `packages/logic` sin cambios; `pickup-location-test`/`return-location-test` presentes; existe un test que cubre los dos casos (con y sin city en ruta)

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: engine, routing, searcher, isolation
- **Required Skills**: Vue 3 Composition, Nuxt routing, Pinia
- **Related Tasks**: step02 (la usa)
- **Step**: 01 of 09
- **Files to Modify**: `packages/ui-alquilame/app/components/Searcher.vue`, `packages/ui-alquilame/app/components/__tests__/Searcher.test.ts`
- **Files to Read**: `packages/logic/src/composables/useSearch.ts`, `packages/logic/src/stores/useStoreAdminData.ts`, `packages/logic/src/utils/types/data/BranchData.ts`
- **Context Estimate**: S
- **Scenario-Strategy**: required
