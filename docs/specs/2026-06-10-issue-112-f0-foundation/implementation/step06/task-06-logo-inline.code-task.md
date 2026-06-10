## Status: PENDING
## Blocked-By: step05/task-05-brand-assets.code-task.md
## Completed:

# Task: Logo inline nuevo (Logo.vue)

## Description
Actualizar el componente `Logo.vue` (SVG inline, fuente de verdad visual) al logo del diseño nuevo, con soporte de variante claro/oscuro para que sea legible sobre el header rojo y sobre fondos claros.

## Background
`Logo.vue` ya es un SVG inline (`viewBox="0 0 577.03 167.13"`, `fill="#fff"`), consumido 3 veces en `default.vue` con la prop `cls`. El diseño trae `logo.svg` (200×55) y `logo-white.svg` — difieren del inline actual, así que hay que reemplazar los paths. El render visual usa el componente inline (sin request); los archivos en `public/images/brand/` (Step 5) son para refs de SEO, independientes.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§4 — Logo, resuelve ambigüedad inline-vs-file)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Reemplazar los paths inline de `Logo.vue` por los del logo del diseño (`/tmp/alquilame_design/dist/logo.svg`).
2. Añadir prop de variante (p.ej. `variant: 'white' | 'color'`) para blanco sobre rojo / color sobre claro, dado que el diseño trae ambas variantes.
3. Mantener la prop `cls` y la compatibilidad con los 3 puntos de consumo en `default.vue`.
4. Preservar aspect-ratio para no introducir CLS.

## Dependencies
- **Step 05**: assets de marca disponibles como referencia (`logo.svg`/`logo-white.svg`).

## Implementation Approach
1. Comparar `dist/logo.svg` con el SVG inline actual.
2. Sustituir los paths/viewBox; añadir la prop de variante (clases de fill).
3. Verificar contraste sobre el header rojo (se valida junto con Step 7).

## Acceptance Criteria
1. **Logo del diseño renderiza**
   - Given el header (fondo rojo de Step 7)
   - When se renderiza `<Logo>`
   - Then muestra el logo del diseño, legible (contraste suficiente), sin request extra (sigue inline).
2. **Variante claro/oscuro**
   - Given la prop de variante
   - When se usa sobre fondo claro vs rojo
   - Then el fill cambia para mantener legibilidad.
3. **Sin CLS**
   - Given el aspect-ratio preservado
   - When carga la página
   - Then el logo no provoca layout shift.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: logo, svg, component, branding
- **Required Skills**: Vue SFC, SVG
- **Step**: 06 of 11
- **Files to Modify**: app/components/Logo.vue
- **Files to Read**: design doc §4, /tmp/alquilame_design/dist/logo.svg, /tmp/alquilame_design/dist/logo-white.svg, default.vue (consumo)
- **Context Estimate**: S
- **Scenario-Strategy**: required
