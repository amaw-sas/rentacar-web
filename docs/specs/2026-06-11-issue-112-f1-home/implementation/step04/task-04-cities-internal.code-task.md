## Status: PENDING
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed:

# Task: F1 Step 4 — Cities (todas activas, links internos)

# Description
Crear `app/components/home/Cities.vue`: grid de ciudades estilo diseño, con TODAS las ciudades activas del data source y enlaces INTERNOS `/{city.id}` (no wa.me).

## Background
El home actual no tiene sección de ciudades (solo el footer). El diseño usa `wa.me` por ciudad — artefacto Astro que NO se copia (decisión F0). Las cities son **Supabase dinámico** vía `useData().cities` (`City.id` = slug; ruta `/[city]`). El conteo lo controla la DB (no fijar literal).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-04; fila cities)
**Additional:**
- `packages/logic/src/composables/useData.ts` (`cities`)
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (`<section id="cities">`)
- Imágenes: `app/components/Images/Ciudades/`

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Cities.vue` itera `useData().cities` (todas las activas) y renderiza el grid con estilo del diseño.
2. Cada ciudad enlaza a `/{city.id}` (interno); CERO `wa.me`.
3. Gradientes/fondos `bg-linear-*`; headings `.heading-*`; imágenes con `aspect-ratio` (CLS).
4. Montada en `index.vue`.

## Dependencies
- **Step 1** (orquestación).
- **`useData().cities`**: lista de `City` (auto-import del layer).

## Implementation Approach
1. Crear `Cities.vue` con `useData().cities` → grid de cards/links.
2. `:to="`/${city.id}`"` interno; sin wa.me.
3. Montar `<HomeCities/>` en `index.vue`.
4. Test: enlaces `/{id}`, cero `wa.me`, cuenta = longitud del data source (no número fijo).

## Acceptance Criteria
1. **Todas las ciudades activas, internas (SCEN-F1-04)**
   - Given el data source de cities
   - When renderiza la sección
   - Then lista todas las ciudades activas con `href="/{city.id}"` interno.
2. **Cero WhatsApp**
   - Given la sección cities
   - When se inspeccionan los enlaces
   - Then no hay ningún `wa.me`.
3. **Test de contrato**
   - Given el componente
   - When corre el unit test (con cities de prueba)
   - Then valida enlaces internos `/{id}`, ausencia de `wa.me`, y cuenta = longitud del data source.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, cities, seo
- **Required Skills**: Vue 3, Nuxt routing
- **Related Tasks**: Blocked-By step 1
- **Step**: 04 of 11
- **Files to Modify**: `app/components/home/Cities.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/Cities.test.ts` (nuevo)
- **Files to Read**: `packages/logic/src/composables/useData.ts`, `app/pages/index.vue`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: S
- **Scenario-Strategy**: required
