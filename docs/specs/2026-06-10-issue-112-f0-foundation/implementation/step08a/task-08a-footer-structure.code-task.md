## Status: PENDING
## Blocked-By: step07/task-07-header-red.code-task.md
## Completed:

# Task: Footer rojo unificado — estructura (default.vue)

## Description
Fusionar las tres secciones inferiores actuales del layout (sección de ciudades `#sedes`, barra de enlaces legales, y `UFooter` copyright) en un único footer con gradiente rojo y tipografía del diseño. Solo markup/estilo contenedor — sin tocar la lógica de las ciudades (eso es Step 8b).

## Background
`default.vue` tiene hoy 3 bloques: `#sedes` (`:67` `bg-blue-700`, logo + 19 botones de ciudad), barra legal (`:94` `bg-[#000073]`, `franchise.footerLinks`), y `UFooter` copyright (`:111`, `bg-black`). El diseño los consolida en un footer con gradiente `#CB032C→#A00425` y `font-heading`. Esta tarea NO modifica el `v-for` de ciudades ni el cálculo de fechas onMounted — solo la estructura/estilo del contenedor.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§3 Layout + footer — footer)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Consolidar las 3 secciones en un footer con `from-footer-from to-footer-to` (tokens Step 1) + `font-heading`.
2. Des-azular `:67` (`bg-blue-700`), `:85` (botones `bg-blue-600`), `:94` (`bg-[#000073]`).
3. NO alterar: el `v-for` sobre `cities`, `getCityReservationURL`, el cálculo `reservationInitDay/EndDay` en `onMounted`, ni `:external target="_blank"`.
4. Preservar `data-testid` del footer y la sección `#sedes`.

## Dependencies
- **Step 07**: secuencial — mismo archivo `default.vue`.
- **Step 01/03**: tokens y primario.

## Implementation Approach
1. Reescribir el contenedor de las 3 secciones como un footer rojo.
2. Mover los enlaces legales y copyright dentro del nuevo footer.
3. Restyle de los botones de ciudad (el contenido/lógica lo verifica Step 8b).

## Acceptance Criteria
1. **Footer sin azul (SCEN-F0-06 footer)**
   - Given `default.vue` tras el cambio
   - When se hace grep de `#000073`/`blue-[0-9]` en las secciones de footer
   - Then 0 coincidencias; footer con gradiente rojo + `font-heading`.
2. **Estructura consolidada**
   - Given el footer nuevo
   - When se renderiza
   - Then las 3 secciones (ciudades, legales, copyright) aparecen dentro de un único footer rojo.
3. **Lógica de ciudades intacta**
   - Given el `v-for` y el cálculo de fechas
   - When se compara con el original
   - Then no se modificaron (Step 8b los verifica funcionalmente).

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: layout, footer, reskin, chrome
- **Required Skills**: Vue SFC, Tailwind, @nuxt/ui Footer
- **Step**: 08a of 11
- **Files to Modify**: app/layouts/default.vue (secciones footer)
- **Files to Read**: design doc §3, /tmp/alquilame_design/dist/index.html (footer), theme.css
- **Context Estimate**: M
- **Scenario-Strategy**: required
