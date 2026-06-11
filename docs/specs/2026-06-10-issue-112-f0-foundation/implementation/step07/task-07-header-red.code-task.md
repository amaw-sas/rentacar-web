## Status: COMPLETED
## Blocked-By: step03/task-03-primary-color.code-task.md, step06/task-06-logo-inline.code-task.md
## Completed: 2026-06-10

> Evidence: `default.vue:2` root → `bg-surface-softest` (light surface per design);
> header `:6` → `bg-gradient-to-r from-hero-from to-hero-to ... sticky top-0` (red,
> sticky). Logo keeps `variant="white"` (3 consumers, self-closing). Nav items
> unchanged (already point to safe anchors `/#requisitos`,`/#sedes`,`/blog`,`/#faqs`
> — no `#fleet`/`#requirements`). Slideover/`ColombiaFlag*`/close button preserved.
> grep `#000073|#0891b2|blue-[0-9]` over default.vue → 0. Tests: f0-chrome step07 PASS
> (14 files / 93 tests green). Typecheck delta vs baseline 185 = 0 (the `color:'white'`
> toggle TS2322 pre-exists on origin/main, untouched). E2E deferred (no Supabase creds
> locally → /api/rentacar-data 500 → webServer timeout); runtime check → step10.

# Task: Header rojo sticky (default.vue)

## Description
Reskinnear el header del layout principal: pasar el fondo azul al rojo de marca, hacerlo sticky como el diseño, y montar el `<Logo>` nuevo. Eliminar el azul hardcodeado del root y header.

## Background
`default.vue:2` tiene el root gradient `from-[#000073] via-blue-800 to-blue-900` y `:6` el header `bg-[#000073]`. El diseño usa un header `sticky top-0` rojo. El header conserva el `<Logo>` (Step 6) y los iconos `ColombiaFlag*` (ajustar según diseño). La nav (Requisitos/Sedes/Blog/FAQ) sigue apuntando a anchors existentes seguros; los anchors del diseño (`#fleet`, `#requirements`) se alinean en F1.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§3 Layout + footer — header)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Reemplazar `default.vue:2` (root gradient azul) y `:6` (`bg-[#000073]`) por fondo/gradiente de marca (tokens de Step 1).
2. Header `sticky top-0` como el diseño.
3. Montar `<Logo>` con variante adecuada al fondo rojo.
4. Mantener la nav funcional sin anchors rotos (apuntar a targets existentes).
5. Preservar los `data-testid` y la estructura del slideover móvil.

## Dependencies
- **Step 01**: tokens de marca.
- **Step 03**: `ui.colors.primary='brand'`.
- **Step 06**: `<Logo>` nuevo.

## Implementation Approach
1. Editar el `<template>` del header (root div + UHeader).
2. Sustituir clases azules por tokens rojos.
3. Añadir sticky; verificar que el slideover móvil sigue operativo.

## Acceptance Criteria
1. **Header sin azul (parcial SCEN-F0-06)**
   - Given `default.vue` tras el cambio
   - When se hace grep de `#000073`/`blue-[0-9]` en el header (`:1-60`)
   - Then 0 coincidencias; header rojo sticky.
2. **Logo legible**
   - Given el header rojo
   - When se renderiza
   - Then `<Logo>` se ve con contraste suficiente.
3. **Nav sin anchors rotos**
   - Given los items de nav
   - When se navega
   - Then apuntan a targets existentes (no anchors inexistentes); E2E `BRAND=alquilame` verde para header.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: layout, header, reskin, chrome
- **Required Skills**: @nuxt/ui Header, Vue SFC, Tailwind
- **Step**: 07 of 11
- **Files to Modify**: app/layouts/default.vue (sección header)
- **Files to Read**: design doc §3, /tmp/alquilame_design/dist/index.html (header), theme.css
- **Context Estimate**: M
- **Scenario-Strategy**: required
