## Status: PENDING
## Blocked-By: step01/task-01-theme-tokens.code-task.md
## Completed:

# Task: Des-azular error.vue + typography .link-*

## Description
Eliminar el azul de marca restante en las dos superficies de chrome que no son el layout principal: el boundary global `error.vue` y los enlaces tipográficos `.link-*`.

## Background
`error.vue:2` usa `from-blue-900 to-blue-950` (visible en cualquier 404/500). `typography.css:173-181` define `.link-light`/`.link-dark` con `text-blue-600`/`text-blue-300` y `focus:ring-blue-500`/`focus:ring-blue-300`. El flip `ui.colors.primary` NO los toca (son clases Tailwind hardcodeadas). Los cuerpos de página de F1–F3 y `/gana` quedan FUERA (deuda declarada).

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§3 error.vue + "Deuda declarada")

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `error.vue:2`: `from-blue-900 to-blue-950` → fondo de marca (tokens Step 1).
2. `typography.css:173-181`: `.link-light`/`.link-dark` (`text-blue-*` y `focus:ring-blue-*`) → tokens de marca.
3. NO tocar los cuerpos de página de F1–F3 ni `/gana` (deuda declarada).

## Dependencies
- **Step 01**: tokens de marca disponibles.

## Implementation Approach
1. Editar `error.vue:2`.
2. Editar el bloque `.link-*` de `typography.css`.
3. Grep de verificación sobre las 3 superficies de chrome.

## Acceptance Criteria
1. **Chrome sin azul (SCEN-F0-06 completo)**
   - Given `default.vue` + `error.vue` + `typography.css`
   - When se hace grep de `#000073`/`#0891b2`/`blue-[0-9]`
   - Then 0 coincidencias (los cuerpos F1–F3 y `/gana` quedan como deuda declarada, fuera de este escenario).
2. **Boundary de error en rojo**
   - Given una ruta inexistente (404)
   - When se renderiza `error.vue`
   - Then el fondo es de marca (rojo), no azul.
3. **Aislamiento**
   - Given los cambios
   - When `git diff --stat origin/main`
   - Then solo toca `packages/ui-alquilame/`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: chrome, deblue, error-boundary, typography
- **Required Skills**: Vue SFC, Tailwind
- **Step**: 09 of 11
- **Files to Modify**: app/error.vue, app/assets/css/rentacar-main/typography.css
- **Files to Read**: design doc §3, error.vue:2, typography.css:173-181
- **Context Estimate**: S
- **Scenario-Strategy**: required
