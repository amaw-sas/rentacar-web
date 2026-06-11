## Status: COMPLETED
## Blocked-By: step04/task-04-optimize-images-script.code-task.md
## Completed: 2026-06-10

> Evidence: `public/images/brand/{logo.svg,logo-white.svg,og-logo.png}`, `public/favicon.svg`
> created; `og-logo.png` rasterized via step04 helper (`svg2png … 512` → 9.4 KB PNG).
> `public/img/og-alquilame.jpg` replaced 109412 B → 67439 B. `nuxt.config.ts` `app.head.link`
> now declares the SVG favicon `<link>` + `.ico` fallback. app.config paths untouched.
> HTTP-200 runtime check (SCEN-F0-05) deferred to step10 per design.

# Task: Assets de identidad de marca + favicon

## Description
Crear los archivos de marca que `app.config` ya referencia (hoy 404 latentes): logos en `public/images/brand/`, `og-logo.png` rasterizado, favicon SVG declarado, y reemplazar el og-image por el del diseño.

## Background
`app.config.ts` ya apunta `logo`/`svglogo` a `/images/brand/logo.svg` (`:23,41,43`), `oglogo` a `/images/brand/og-logo.png` (`:42`), `ogImage` a `/img/og-alquilame.jpg` (`:44`), pero `public/images/brand/` NO existe. El favicon hoy es `public/favicon.ico` y `nuxt.config.ts:413` tiene `app.head.link: []` vacío → Nitro solo auto-sirve `/favicon.ico`. El diseño NO trae `og-logo.png` (solo `logo.svg`, `logo-white.svg`, `og-image.jpg`, `favicon.svg`).

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§4 Assets de marca — tabla origen→destino)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Crear `public/images/brand/` con `logo.svg` y `logo-white.svg` copiados de `/tmp/alquilame_design/dist/`.
2. Generar `public/images/brand/og-logo.png` rasterizando: `sharp('/tmp/alquilame_design/dist/logo.svg').resize({ width: 512 }).png().toFile(...)` (helper del Step 4).
3. Copiar `dist/favicon.svg` → `public/favicon.svg` y declarar `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` en `nuxt.config.ts` `app.head.link` (mantener `.ico` como fallback).
4. Reemplazar `public/img/og-alquilame.jpg` (109 KB) por `dist/og-image.jpg` (67 KB).
5. NO editar los paths de `app.config` (ya correctos).

## Dependencies
- **Step 04**: helper de rasterización SVG→PNG.

## Implementation Approach
1. Copiar SVGs y og-image.
2. Generar og-logo.png con sharp.
3. Añadir el `<link>` favicon en nuxt.config.
4. Servir y verificar HTTP 200 de cada path.

## Acceptance Criteria
1. **Assets resuelven 200 (SCEN-F0-05)**
   - Given el HTML renderizado
   - When se hace HTTP GET a los paths de marca de `app.config` (`logo`, `svglogo`, `oglogo`, `ogImage`) + favicon
   - Then todos responden 200 (incl. `og-logo.png` generado).
2. **Favicon SVG servido**
   - Given el `<link rel=icon svg>` en `app.head.link`
   - When se carga la página
   - Then el HTML incluye el link al `/favicon.svg` y el `.ico` permanece como fallback.
3. **Aislamiento**
   - Given los assets nuevos
   - When `git diff --stat origin/main`
   - Then solo toca `packages/ui-alquilame/` (public + nuxt.config).

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: assets, branding, favicon, og-image, seo
- **Required Skills**: sharp, Nuxt head config
- **Step**: 05 of 11
- **Files to Modify**: public/images/brand/* (nuevos), public/favicon.svg (nuevo), public/img/og-alquilame.jpg, nuxt.config.ts
- **Files to Read**: design doc §4, app.config.ts:23-44, /tmp/alquilame_design/dist/
- **Context Estimate**: S
- **Scenario-Strategy**: required
