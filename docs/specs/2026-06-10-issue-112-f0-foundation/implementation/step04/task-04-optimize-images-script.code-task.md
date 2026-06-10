## Status: COMPLETED
## Blocked-By: step00/task-00-pnpm-install.code-task.md
## Completed: 2026-06-10

> Evidence: created `packages/ui-alquilame/scripts/optimize-images.mjs` (sharp@^0.34.5,
> header doc + CLI). Verified on fixtures: `webp test.png → test.webp (518 B)` reported
> weight; `svg2png logo.svg → logo-raster.png` produced `PNG 256×70 8-bit RGBA`. 500 KB
> critical-path warning threshold exported. 15 new assertions in `tests/f0-assets.test.ts`
> (incl. live webp+PNG generation) green.

# Task: Script de optimización de imágenes (webp)

## Description
Crear la convención de optimización de assets de F0 (reutilizable por F1/F2): un script Node con `sharp` que convierte PNG→webp, reporta peso, y rasteriza SVG→PNG (capacidad que necesita el Step 5 para `og-logo.png`).

## Background
El zip del diseño trae PNG muy pesados (ventajas ~1.6 MB, cta ~2.5 MB) que entrarán en F1/F2; F0 solo establece la herramienta. El umbral es <500 KB en critical-path. `sharp` ya está en `packages/ui-alquilame/package.json:24` (`^0.34.5`); también lo usa `@nuxt/image`.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§4 — convención de optimización webp)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Crear `packages/ui-alquilame/scripts/optimize-images.mjs` usando `sharp@^0.34.5` (la versión del repo — NO `sharp@^4`).
2. Funciones: PNG→webp con reporte de peso; helper SVG→PNG (`sharp(svg).resize(...).png().toFile(...)`).
3. Documentar uso en un comentario de cabecera (cómo invocarlo en F1/F2).

## Dependencies
- **Step 00**: `sharp` instalado.

## Implementation Approach
1. Escribir el script con `sharp`.
2. Probarlo sobre una imagen de prueba (no integrar ningún asset pesado en F0).

## Acceptance Criteria
1. **Conversión webp**
   - Given el script y una imagen PNG de prueba
   - When se corre el script
   - Then emite un `.webp` y reporta el peso resultante en consola.
2. **Rasterización SVG→PNG disponible**
   - Given un SVG de prueba
   - When se invoca el helper SVG→PNG
   - Then produce un PNG válido (capacidad que consume Step 5).
3. **Aislamiento**
   - Given el script nuevo
   - When `git diff --stat origin/main`
   - Then solo añade `packages/ui-alquilame/scripts/optimize-images.mjs`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: assets, sharp, webp, tooling
- **Required Skills**: Node, sharp
- **Step**: 04 of 11
- **Files to Modify**: scripts/optimize-images.mjs (nuevo)
- **Files to Read**: design doc §4, package.json:24
- **Context Estimate**: S
- **Scenario-Strategy**: required
