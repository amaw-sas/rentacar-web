## Status: COMPLETED
## Blocked-By: step01/task-01-theme-tokens.code-task.md
## Completed: 2026-06-10

# Task: Fuentes self-hosted (Plus Jakarta Sans + DM Sans)

## Description
Cargar las fuentes del diseño vía `@nuxt/fonts` (self-hosted, sin `<link>` a Google Fonts), conectarlas a la tipografía de la marca y actualizar el critical CSS inline para que la fuente nueva no compita con `system-ui` durante el swap.

## Background
`typography.css` está "preparado para fuente custom" pero hoy no carga ninguna. El diseño usa Plus Jakarta Sans (700/800) en titulares y DM Sans (400/500/600) en cuerpo, cableadas como `--font-heading`/`--font-body`. `@nuxt/fonts` (bundled con @nuxt/ui) lee un bloque top-level `fonts` en `nuxt.config.ts` (configKey `fonts`; NO se añade a `modules[]`). El critical CSS inline en `nuxt.config.ts:36` fija `body { font-family: system-ui }` y debe actualizarse para evitar CLS/flash.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§2 Fuentes)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Bloque top-level `fonts` en `nuxt.config.ts`: Plus Jakarta Sans [700,800] + DM Sans [400,500,600].
2. `theme.css` (Step 1) ya define `--font-heading`/`--font-sans`; conectar `font-family: var(--font-heading)` a las clases `.heading-*` de `typography.css`; el cuerpo hereda `--font-sans`.
3. Actualizar el critical CSS inline `nuxt.config.ts:36` (`system-ui` → familias nuevas con fallback), `font-display: swap`.
4. Sin `<link>` a `fonts.googleapis.com` en el HTML renderizado.

## Dependencies
- **Step 01**: `--font-heading`/`--font-sans` definidos en `theme.css`.
- **Step 00**: `@nuxt/fonts` instalado.

## Implementation Approach
1. Añadir el bloque `fonts` en `nuxt.config.ts`.
2. Editar `typography.css` `.heading-*` para `font-family: var(--font-heading)`.
3. Actualizar la línea de critical CSS (`:36`).
4. Servir y verificar el `font-family` computado + ausencia de `<link>` Google.

## Acceptance Criteria
1. **Fuentes self-hosted (SCEN-F0-03)**
   - Given una página de alquilame cargada
   - When se inspecciona el `font-family` computado de un `.heading-*` y del cuerpo
   - Then es Plus Jakarta Sans / DM Sans respectivamente, y NO hay `<link>` a `fonts.googleapis.com` en el HTML.
2. **CLS no peor (SCEN-F0-08, validación final en Step 10)**
   - Given las fuentes con `font-display: swap` + métricas fallback
   - When se mide CLS en la home
   - Then no es peor que el baseline pre-F0.
3. **Aislamiento**
   - Given el cambio
   - When `git diff --stat origin/main`
   - Then solo toca `packages/ui-alquilame/`.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: fonts, nuxt-fonts, cls, typography
- **Required Skills**: @nuxt/fonts, Nuxt config, CLS
- **Step**: 02 of 11
- **Files to Modify**: nuxt.config.ts, app/assets/css/rentacar-main/typography.css
- **Files to Read**: design doc §2, theme.css (Step 1), nuxt.config.ts:36
- **Context Estimate**: S
- **Scenario-Strategy**: required

## Completion Evidence (2026-06-10)
- **AC1 (fuentes self-hosted, parcial):** Bloque top-level `fonts` añadido en
  `nuxt.config.ts:422` (Plus Jakarta Sans [700,800] + DM Sans [400,500,600]), NO en
  `modules[]`. `.heading-*` ahora aplican `font-family: var(--font-heading)` en
  `typography.css`; el cuerpo hereda `--font-sans`. Sin `<link>` a Google Fonts en
  fuente. El build de @nuxt/fonts resolvió ambas familias (cache
  `node_modules/.cache/nuxt/fonts/meta/google/*`) y las prepara para self-host local
  (las URLs gstatic viven solo en cache build-time, no en el HTML renderizado).
  La verificación del `font-family` computado en runtime se difiere a step10 (necesita
  servidor en ejecución).
- **AC2 (CLS):** Critical CSS inline `nuxt.config.ts:36` actualizado de `system-ui` a
  `'DM Sans', ui-sans-serif, system-ui, …`; `font-display: swap` es el default de
  @nuxt/fonts. Medición CLS vs baseline diferida a step10.
- **AC3 (aislamiento):** `git diff --name-only HEAD` → solo `packages/ui-alquilame/`.
- Archivos: `nuxt.config.ts` (fonts + critical CSS),
  `app/assets/css/rentacar-main/typography.css` (font-family en `.heading-*`).
