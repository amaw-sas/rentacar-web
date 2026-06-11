## Status: COMPLETED
## Blocked-By: step00/task-00-pnpm-install.code-task.md
## Completed: 2026-06-10

# Task: Capa de tokens de marca (theme.css)

## Description
Crear la única fuente de tokens de marca de alquilame: un `@theme` (Tailwind 4) con la escala de color `brand` 50–950 anclada en `#CC022B`=600, tokens semánticos para los gradientes hero/footer y los neutros del diseño, y las variables de fuente. Importarlo en `main.css`. Esta capa habilita todo el reskin posterior.

## Background
Hoy `app.config.ts` hace `ui: uiConfig` sin override de `colors`; no existe un primario de marca definido. El diseño usa rojo `#CC022B` + gradientes (`#CC022B→#94001E` hero, `#CB032C→#A00425` footer) y neutros (`#EDF0F5`/`#F4F5F9`/`#F8F9FC`). @nuxt/ui v4 sobre Tailwind 4 requiere una escala 50–950 para usarse como `primary`; los hex sueltos se exponen como utilidades vía `@theme`.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§1 Tokens de color — bloque `@theme` completo)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Crear `packages/ui-alquilame/app/assets/css/theme.css` con un bloque `@theme` que defina `--color-brand-50..950` (600 = `#cc022b`, 800 = `#94001e`), tokens semánticos (`--color-hero-from/to`, `--color-footer-from/to`, `--color-surface-soft/softer/softest`) y `--font-heading`/`--font-sans`.
2. Añadir `@import './theme.css';` en `packages/ui-alquilame/app/assets/css/main.css`.
3. Valores anclados al CSS del diseño (`/tmp/alquilame_design/dist/_astro/*.css`); la escala intermedia se afina visualmente en Steps 3/7.

## Dependencies
- **Step 00**: dependencias instaladas para compilar el CSS.

## Implementation Approach
1. Copiar el bloque `@theme` del design doc §1 a `theme.css`.
2. Importarlo en `main.css` (tras `@import "@nuxt/ui"`).
3. Verificar que la compilación expone las utilidades `bg-brand-600`, `from-hero-from`, `bg-surface-soft`.

## Acceptance Criteria
1. **Tokens disponibles (parcial SCEN-F0-01)**
   - Given `theme.css` importado en `main.css`
   - When se compila el CSS de alquilame
   - Then las utilidades `bg-brand-600`, `from-hero-from`, `to-footer-to`, `bg-surface-soft` existen y resuelven a los hex del diseño.
2. **Aislamiento**
   - Given el cambio
   - When `git diff --stat origin/main`
   - Then solo toca `packages/ui-alquilame/`.
3. **Sin regresión de build**
   - Given el import nuevo
   - When `pnpm --filter ui-alquilame build`
   - Then compila sin error de CSS.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: tokens, css, tailwind4, foundation
- **Required Skills**: Tailwind 4 @theme, @nuxt/ui v4
- **Step**: 01 of 11
- **Files to Modify**: app/assets/css/theme.css (nuevo), app/assets/css/main.css
- **Files to Read**: design doc §1, /tmp/alquilame_design/dist/_astro/*.css
- **Context Estimate**: S
- **Scenario-Strategy**: required

## Completion Evidence (2026-06-10)
- **AC1 (tokens disponibles):** Compilado `theme.css` por el motor Tailwind 4 real
  (`@tailwindcss/node@4.1.18`, mismo engine que `@tailwindcss/vite`). Resuelven:
  `--color-brand-600: #cc022b`, `--color-hero-from: #cc022b`,
  `--color-surface-soft: #edf0f5`; utilidades `.bg-brand-600`, `.from-hero-from`,
  `.to-footer-to`, `.bg-surface-soft`, `.text-brand-800` generadas. PASS.
- **AC2 (aislamiento):** `git diff --name-only HEAD` → solo `packages/ui-alquilame/`.
- **AC3 (sin regresión de build):** `pnpm --filter ui-alquilame build` compiló todo el
  CSS sin error; el build solo falló en prerender de páginas de ciudad por falta de
  backend de datos offline (no relacionado con CSS — esperado en worktree aislado).
- Archivos: `app/assets/css/theme.css` (nuevo), `app/assets/css/main.css` (import).
- Escala brand final: 50 `#fef2f4`, 100 `#fce4e8`, 200 `#f9c5cd`, 300 `#f498a6`,
  400 `#ea5067`, 500 `#e50a35`, 600 `#cc022b`, 700 `#a8001f`, 800 `#94001e`,
  850 `#8b001c`, 900 `#7a001a`, 950 `#4a000b` (850/900/950 = tonos del diseño;
  700 = `#a8001f` para mantener rampa monótona por luminancia).
