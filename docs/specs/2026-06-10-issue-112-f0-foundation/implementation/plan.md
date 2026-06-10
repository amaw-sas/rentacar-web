# Plan de implementación — F0 Fundación de marca alquilame (issue #112)

**Fecha:** 2026-06-10
**Diseño aprobado:** `../../2026-06-10-issue-112-f0-foundation-design.md`
**Rama / worktree:** `feat/issue-112-f0-foundation` en `.worktrees/issue-112-f0`
**Holdout:** SCEN-F0-01..08 (sección "Escenarios observables" del design doc)

> Los pasos 1–6 de sop-planning (clarificación, research, diseño detallado) están satisfechos por el design doc aprobado. Este documento cubre el file map (6.5) y el plan ordenado (7), validados por review loop (7.5).

---

## File structure map

Cada archivo, una responsabilidad. Aislado a `packages/ui-alquilame/`.

| Archivo | Acción | Responsabilidad única |
|---|---|---|
| `app/assets/css/theme.css` | **crear** | Única fuente de tokens de marca: `@theme` con escala `brand` 50–950, tokens semánticos (hero/footer/surface), vars de fuente |
| `app/assets/css/main.css` | editar | Añadir `@import './theme.css'` (1 línea) |
| `app/app.config.ts` | editar | `ui.colors.primary='brand'` (override de marca; sin tocar `uiConfig` compartido) |
| `nuxt.config.ts` | editar | Bloque top-level `fonts`; `<link rel=icon svg>` en `app.head.link`; actualizar `font-family` del critical CSS inline (`:36`) |
| `app/assets/css/rentacar-main/typography.css` | editar | Conectar `font-family: var(--font-heading)` a `.heading-*`; `.link-*` azul → tokens de marca |
| `app/components/Logo.vue` | editar | SVG inline del logo nuevo + variante claro/oscuro (prop) |
| `app/layouts/default.vue` | editar | Header rojo sticky + footer gradiente rojo unificado; des-azular 5 sitios; preservar guard #109 + 19 enlaces internos |
| `app/error.vue` | editar | Des-azular chrome del boundary global (`:2`) |
| `scripts/optimize-images.mjs` | **crear** | Convención de optimización webp (sharp `^0.34.5`), reutilizable por F1/F2 |
| `public/images/brand/logo.svg`, `logo-white.svg` | **crear** | Satisfacen refs de archivo de `app.config` (hoy 404) |
| `public/images/brand/og-logo.png` | **crear** | Ref `oglogo` (higiene; sin consumidor hoy) |
| `public/favicon.svg` | **crear** | Favicon SVG (`.ico` se mantiene como fallback) |
| `public/img/og-alquilame.jpg` | reemplazar | og:image del diseño (67 KB) |

**No se editan** `app.config.ts` paths de logo (ya apuntan a `/images/brand/*`), `logic/`, ni las otras dos marcas.

---

## Prerequisites

- **Paso 0:** `pnpm install` desde la raíz del repo (materializa `@nuxt/fonts@0.12.1` del lockfile, hoy ausente de `node_modules`). Sin esto el primer `dev/build` falla.
- Diseño descomprimido disponible en `/tmp/alquilame_design/dist/` (assets origen).

---

## Implementation Steps

Orden SDD: cada paso define su escenario → implementa → satisface → refactor. Todos ≤ M, ≤ 2h, sin dependencias hacia adelante.

### Fase 1 — Tokens y fuentes (fundación)

**Step 1 — Capa de tokens `theme.css`** · Size: S · Dep: ninguna
Crear `app/assets/css/theme.css` con el `@theme` del design doc §1 (escala `brand` 50–950 anclada en `#CC022B`=600 + tokens semánticos hero/footer/surface + `--font-heading`/`--font-sans`). Importar en `main.css`.
- **Escenario (parcial SCEN-F0-01):** Given `theme.css` importado, when se compila el CSS de alquilame, then las utilidades `bg-brand-600`, `from-hero-from`, `bg-surface-soft` existen y resuelven a los hex del diseño.
- **Aceptación:** build CSS sin error; clases `brand-*` disponibles; `git diff --stat` solo toca `ui-alquilame`.

**Step 2 — Fuentes self-hosted** · Size: M · Dep: Step 1
Añadir bloque top-level `fonts` en `nuxt.config.ts` (Plus Jakarta Sans 700/800 + DM Sans 400/500/600). Conectar `font-family: var(--font-heading)` a `.heading-*` en `typography.css`; el cuerpo hereda `--font-sans`. Actualizar el critical CSS inline `nuxt.config.ts:36` (`system-ui` → familias nuevas con fallback).
- **Escenario (SCEN-F0-03):** Given una página de alquilame cargada, when se inspecciona el `font-family` computado de un `.heading-*` y del cuerpo, then es Plus Jakarta Sans / DM Sans respectivamente, sin `<link>` a `fonts.googleapis.com` en el HTML (self-hosted).
- **Aceptación:** fuentes self-hosted servidas localmente; `font-display: swap`; CLS no peor que baseline (validar en Step 10).

**Step 3 — Primario de marca en app.config** · Size: S · Dep: Step 1
Añadir `ui.colors.primary='brand'` (y `neutral`) al `ui` de `app.config.ts` vía `{ ...uiConfig, colors: {...} }`. Vigilar el riesgo TS del spread sobre `as const satisfies` (design doc §1); si typecheck falla, aplicar `as const`/`satisfies` local o ajustar `--ui-primary` por shade.
- **Escenario (SCEN-F0-01):** Given la home renderizada, when se inspecciona un botón/elemento primario @nuxt/ui, then usa el rojo de marca (`#CC022B`/`brand`), no el azul anterior.
- **Aceptación:** `pnpm --filter ui-alquilame typecheck` verde (gate del riesgo TS); botón primario rojo.

### Fase 2 — Assets de marca

**Step 4 — Script de optimización webp** · Size: S · Dep: ninguna
Crear `scripts/optimize-images.mjs` con `sharp@^0.34.5` (versión del repo, `package.json:24`): convierte PNG→webp, reporta peso, umbral <500 KB critical-path. `sharp` también rasteriza SVG→PNG (lo usa el Step 5 para `og-logo.png`). Documentar uso (reutilizable por F1/F2).
- **Escenario:** Given el script y una imagen PNG, when se corre, then emite un `.webp` y reporta el peso resultante.
- **Aceptación:** script ejecuta sobre una imagen de prueba; no se integra ningún asset pesado en F0 (solo establece la convención).

**Step 5 — Assets de identidad de marca** · Size: M · Dep: Step 4
Crear `public/images/brand/` con `logo.svg` + `logo-white.svg` (copiados de `dist/`). **`og-logo.png` no existe en `dist/`** → generarlo rasterizando con sharp: `sharp('dist/logo.svg').resize({ width: 512 }).png().toFile('public/images/brand/og-logo.png')` (usa la capacidad SVG→PNG del Step 4). Copiar `dist/favicon.svg` → `public/favicon.svg` y declarar `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` en `nuxt.config.ts` `app.head.link` (`:413`, hoy `[]`; mantener `.ico` fallback). Reemplazar `public/img/og-alquilame.jpg` (109 KB) por `dist/og-image.jpg` (67 KB).
- **Escenario (SCEN-F0-05):** Given el HTML renderizado, when se hace HTTP GET a `logo`, `svglogo`, `oglogo`, `ogImage` (de `app.config`) + favicon, then todos responden 200.
- **Aceptación:** los 4 paths de marca + favicon devuelven 200 (incl. `og-logo.png` generado); `app.config` no requiere cambio de paths (ya apuntan ahí).

**Step 6 — Logo inline nuevo** · Size: M · Dep: Step 5
Comparar `dist/logo.svg` (200×55) con el SVG inline actual de `Logo.vue` (577×167). Si difiere, reemplazar los paths inline por los del diseño y añadir prop de variante (blanco sobre fondo rojo / color sobre fondo claro), dado que el diseño trae `logo.svg` + `logo-white.svg`. Mantener la prop `cls` y los 3 puntos de consumo en `default.vue`.
- **Escenario:** Given el header rojo, when se renderiza `<Logo>`, then el logo es legible (contraste suficiente) sobre el fondo rojo y mantiene aspect-ratio sin CLS.
- **Aceptación:** `<Logo>` renderiza el logo del diseño; variante claro/oscuro funciona; sin request extra (sigue inline).

### Fase 3 — Reskin de chrome (des-azulado + rojo)

**Step 7 — Header rojo (`default.vue`)** · Size: M · Dep: Steps 1, 3, 6
Reescribir el header: root gradient `from-[#000073]...` y `bg-[#000073]` (`:2,:6`) → fondo/gradiente de marca; header `sticky top-0` como el diseño; nuevo `<Logo>`. Nav sigue apuntando a anchors existentes seguros (los del diseño se alinean en F1). Ajustar iconos `ColombiaFlag*` según diseño.
- **Escenario (parcial SCEN-F0-06):** Given `default.vue`, when se grep `#000073`/`blue-[0-9]` en el header, then 0 coincidencias; header rojo sticky.
- **Aceptación:** header rojo; sin azul en `:2,:6`; nav funcional sin anchors rotos.

**Step 8a — Fusión estructural del footer rojo (`default.vue`)** · Size: M · Dep: Steps 1, 3 (secuencial tras Step 7 — mismo archivo)
Fusionar las 3 secciones actuales (`#sedes` `bg-blue-700`, barra legal `bg-[#000073]`, `UFooter`) en un footer con gradiente rojo (`from-footer-from to-footer-to`) + `font-heading`. Des-azular los sitios `:67,:85,:94`. **No** alterar la lógica del `v-for` de ciudades ni el cálculo de fechas — solo el markup/estilo contenedor.
- **Escenario (SCEN-F0-06 footer):** Given el footer, when se grep `#000073`/`blue-[0-9]` en las secciones de footer de `default.vue`, then 0 coincidencias; footer con gradiente rojo + `font-heading`.
- **Aceptación:** footer rojo unificado; sin azul; estructura de las 3 secciones consolidada.

**Step 8b — Enlaces de ciudad + guard #109 (`default.vue`)** · Size: M · Dep: Step 8a
Verificar/preservar el guard de hidratación **#109** (money-landmine) en la sección de ciudades: `reservationInitDay/EndDay` calculados solo en `onMounted` (`:195-201`), `getCityReservationURL(city)` → `/${city.id}` en SSR cuando las fechas son null (`buildCityReservationURL.ts:43-44`), `:external target="_blank"`, `v-for` sobre `cities` de `useData()`. Restyle de los 19 `UButton` a rojo sin tocar esa lógica.
- **Escenario (SCEN-F0-04):** Given cualquier página, when se ve el footer, then cada uno de los 19 enlaces de ciudad tiene `href="/{city.id}"` (interno, p.ej. `/bogota`, no `wa.me`); SSR y primera hidratación producen el mismo href estable (sin hydration mismatch).
- **Aceptación:** 19 enlaces internos rojos; SSR sin hydration warning (#109 intacto); E2E `BRAND=alquilame` verde para selectores de footer/ciudad.

**Step 9 — Des-azular `error.vue` + `.link-*`** · Size: S · Dep: Step 1
`error.vue:2` (`from-blue-900 to-blue-950`) → fondo de marca. `typography.css:173-181` bloque `.link-light`/`.link-dark` (`text-blue-*` **y** `focus:ring-blue-*` en `:175,:181`) → tokens de marca.
- **Escenario (SCEN-F0-06 completo):** Given `default.vue` + `error.vue` + `typography.css`, when se grep `#000073`/`#0891b2`/`blue-[0-9]`, then 0 coincidencias (los cuerpos F1–F3 y `/gana` quedan como deuda declarada, fuera de este escenario).
- **Aceptación:** grep de chrome limpio; boundary de error en rojo.

### Fase 4 — Integración y verificación

**Step 10 — Verificación del holdout** · Size: M · Dep: Steps 1–9 (incl. 8a, 8b)
Ejecutar `/verification-before-completion` con evidencia fresca contra los 8 escenarios:
- `pnpm install` (ya hecho en paso 0); `pnpm --filter ui-alquilame typecheck` vía `ionice -c3 nice -n19` (SCEN-F0-07).
- E2E `BRAND=alquilame` (SCEN-F0-07, testids preservados).
- `git diff --stat origin/main` → cambios solo en `ui-alquilame/**` (SCEN-F0-02).
- Build de las otras 2 marcas → árbol git sin cambios (aislamiento).
- `/agent-browser` + `/dogfood` en el alias `-git-main-`: cero errores de consola, cero requests fallidos; inspección de color/fuentes/footer/assets-200 (SCEN-F0-01,03,04,05).
- Lighthouse/CLS vs baseline (SCEN-F0-08).
- **Aceptación:** los 8 SCEN-F0 satisfechos con evidencia observable; ningún escenario debilitado.

---

## Dependencias (grafo)

```
0 (install) → todo
1 (theme.css) → 2, 3, 7, 8a, 9
4 (script) → 5 → 6 → 7
3 → 7, 8a
7 → 8a (mismo archivo, secuencial) → 8b
1..9 → 10 (verificación)
```

## Testing / SDD Strategy

- Cada paso embebe su escenario (sin pasos "solo tests").
- Holdout = SCEN-F0-01..08 del design doc; define "done", no se debilita para pasar.
- Unit: **ningún test lee `default.vue`/`layouts/`/`Logo.vue` como source** (verificado por grep) → el riesgo de Steps 7/8a/8b sobre la suite unit es nulo. `SelectBranch.test.ts` lee `SelectBranch.vue`, no el layout. El único gate relevante para el chrome es **E2E**.
- E2E: `pnpm test:e2e:alquilame` (`BRAND=alquilame`) — cubre footer/ciudad/#109.

## Rollout Plan

- **Deploy:** push del branch → Vercel genera preview/alias `-git-main-` (alquilame.co sigue legacy, sin impacto público).
- **Verificación post-deploy:** inspección en el alias (no dominio público).
- **Merge:** PR a `main` con `Closes #112` **NO** (F0 es parcial; usar referencia `Refs #112`, cerrar solo al completar F3). Una línea de cierre por fase no aplica hasta F3.
- **Rollback:** revert del PR; al ser aislado a `ui-alquilame` y no-público, riesgo mínimo.

## Riesgos abiertos (del design doc)

| Riesgo | Paso | Mitigación |
|---|---|---|
| Spread `{...uiConfig, colors}` rompe TS | 3 | `as const`/`satisfies`; typecheck gate |
| @nuxt/ui shade 500≠600 → botón ≠ #CC022B | 3 | Ajustar `--ui-primary`/shade; validar visual |
| Romper guard #109 al fusionar footer | 8 | Conservar cálculo onMounted + href SSR; E2E |
| CLS por fuentes + critical CSS compite | 2 | `swap` + métricas fallback; actualizar `:36`; medir |

## Open questions

- `/gana` queda **fuera de #112** (deuda declarada, decisión del usuario) → su chrome sigue azul; costura footer-rojo→/gana-azul documentada.
- Shade exacto del primario y valores finos de la escala `brand` → se afinan visualmente contra el CSS del diseño en Steps 3/7.
