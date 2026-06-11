# Issue #112 — F0: Fundación de marca alquilame (Astro → Nuxt)

**Fecha:** 2026-06-10
**Issue:** #112 (reskin completo alquilame)
**Fase:** F0 de 4 (F0 fundación → F1 home → F2 landing+legales → F3 reskin funcional)
**Rama:** `feat/issue-112-f0-foundation`
**Estado:** diseño para revisión (v2, post spec-review)

---

## Contexto

`alquilame.co` es la única de las tres marcas aún en el sitio legacy. El equipo de diseño entregó la nueva identidad como build estático de Astro (`/tmp/alquilame.zip`, descomprimido en `/tmp/alquilame_design/dist/`). El issue #112 cubre portar ese diseño a `packages/ui-alquilame/` (Nuxt 4 + Vue 3 + @nuxt/ui v4 + Tailwind 4), traduciendo el markup a componentes Vue — el zip es referencia visual y de assets, no código a copiar.

El reskin completo se descompuso en 4 fases que aterrizan incrementalmente a `main` y se verifican en el alias Vercel `-git-main-` (no en el dominio público, que sigue sirviendo legacy). Este documento diseña **F0**, la fundación de la que dependen el resto.

### Decisión de descomposición (aprobada)

| Fase | Entrega | Depende de |
|---|---|---|
| **F0** | Tokens, fuentes, layout+footer, assets de marca | — |
| F1 | Home (11 secciones) | F0 |
| F2 | Landing ciudad + legales | F0 |
| F3 | Reskin funcional (resultados/reserva/blog) | F0 |

F0 va primero porque establece tokens y fuentes **globalmente**. Precisión importante: el flip `ui.colors.primary='brand'` recolorea **solo los componentes @nuxt/ui** (botones, links, badges) de inmediato; **no** afecta clases Tailwind con azul hardcodeado (`bg-[#000073]`, `bg-blue-700`, etc.), que hay que reescribir archivo por archivo. Por eso F0 des-azula el **chrome global** (`default.vue` + `error.vue`), y los cuerpos de página azules quedan como **deuda declarada** asignada a su fase (ver §"Deuda declarada"). Las páginas aún no reskinneadas (F1–F3) quedan en estado intermedio en el alias no-público — aceptable.

---

## Estado actual verificado (corrige premisas del issue)

El issue fue escrito 2026-06-05. Verificación contra el código real del worktree:

1. **#108 ya está CLOSED** (2026-06-09, PR #119). El `og:image` ya es correcto por marca (`/img/og-alquilame.jpg`). F0 **no cierra #108**; solo reemplaza el asset por el del diseño nuevo.

2. **El azul de marca está hardcodeado en `default.vue`, NO en overrides de `base.css`.** Verificado:
   - `default.vue:2` root gradient `from-[#000073] via-blue-800 to-blue-900`
   - `default.vue:6` header `bg-[#000073]`
   - `default.vue:67` sección `#sedes` `bg-blue-700`
   - `default.vue:85` botones de ciudad `bg-blue-600 hover:bg-blue-800`
   - `default.vue:94` barra legal `bg-[#000073]`
   - `typography.css:174` `.link-light` `text-blue-600` / `:180` `.link-dark` `text-blue-300`
   - `base.css:173-204` keyframe decorativo `.bg-animated-gradient` (azul→cyan) — uso sin confirmar; verificar si surface alguna página antes de tocarlo.
   Los 137 `!important` de `base.css` son fixes de @nuxt/ui (calendar, dialog, slideover, carousel), **ninguno fija el primario azul**. La limpieza apunta a `default.vue` + `typography.css`, **no** a `base.css`.

3. **`Logo.vue` ya es un SVG inline** (`components/Logo.vue`, `viewBox="0 0 577.03 167.13"`, `fill="#fff"`), no un placeholder. Es la fuente de verdad visual, consumido 3 veces en `default.vue` con prop `cls`.

4. **`public/images/brand/` NO existe.** Pero `app.config.ts` ya referencia archivos ahí (404 latentes hoy):
   - `app.config.ts:23,41,43` `logo`/`svglogo` → `/images/brand/logo.svg` (MISS)
   - `app.config.ts:42` `oglogo` → `/images/brand/og-logo.png` (MISS)
   - `app.config.ts:44` `ogImage` → `/img/og-alquilame.jpg` (existe)
   Estos paths los consume `useBaseSEO` (logic) para JSON-LD/og. F0 debe **crear** los archivos, no "actualizar paths".

5. **Favicon actual es `public/favicon.ico`** (no `.svg`); `nuxt.config.ts:413` `app.head.link: []` (vacío) → el favicon se sirve por convención Nitro `/favicon.ico`. Cambiar a `.svg` requiere decidir reconciliación (ver Diseño §4).

6. **`@nuxt/fonts` viene bundled con @nuxt/ui** (`node_modules/@nuxt/ui` declara `@nuxt/fonts@^0.12.1`; `module.mjs` lo auto-registra si `ui.fonts` ≠ false, configKey top-level `fonts`). Pero **no está materializado en `node_modules`** (solo en lockfile) → requiere `pnpm install` antes del primer build.

---

## Alcance F0

Solo `packages/ui-alquilame/**`. **No** toca `logic/` ni las otras dos marcas.

### Archivos afectados

| Archivo | Cambio | Nota |
|---|---|---|
| `app/assets/css/theme.css` (nuevo) | `@theme` con escala `brand` 50–950 + tokens semánticos + fuentes | Capa de tokens |
| `app/assets/css/main.css` | `@import './theme.css'` | |
| `app/app.config.ts` | añadir `ui.colors.primary='brand'` (hoy `ui: uiConfig` sin colors) | Riesgo TS — ver §1 |
| `nuxt.config.ts` | bloque top-level `fonts`; actualizar critical CSS `font-family` (`:36`) | |
| `app/layouts/default.vue` | header rojo + footer gradiente rojo unificado; retirar 5 sitios de azul | Chrome principal |
| `app/error.vue` | des-azular chrome del boundary global (`:2` `from-blue-900 to-blue-950`) | Visible en cualquier 404/500 |
| `app/assets/css/rentacar-main/typography.css` | conectar `font-family` a `.heading-*`; `.link-*` azul → primario | |
| `app/components/Logo.vue` | actualizar SVG inline al logo del diseño + variante claro/oscuro | Ver §4 |
| `public/images/brand/logo.svg`, `logo-white.svg` (nuevos) | desde `dist/logo.svg`, `dist/logo-white.svg` — satisface refs SEO de app.config | Crea dir faltante |
| `public/images/brand/og-logo.png` (nuevo) | logo raster para JSON-LD org (hoy 404) | Ver §4 |
| `public/favicon.svg` (nuevo) + reconciliación `.ico` | desde `dist/favicon.svg` | Ver §4 |
| `public/img/og-alquilame.jpg` | reemplazar por `dist/og-image.jpg` (67 KB) | |
| `scripts/optimize-images.mjs` (nuevo) | convención webp (sharp `^0.34.5` del repo) | |

### Consumidores / propagación (verificado por grep)

- `franchise.logo`/`organization.logo` → `useBaseSEO.ts:37,51,60` (JSON-LD org/website) **y** `pages/index.vue`. `ogImage` → `pages/index.vue:279,282,291` (`useSeoMeta`), **no** `useBaseSEO`. `svglogo` y `oglogo` → **cero consumidores** en logic/UI (campos de app.config sin lector hoy). Crear sus archivos es higiene (evita 404 si algún día se consumen), no cierra un 404 SEO activo. El único path de marca emitido en SEO real hoy es `logo`.
- `ui.colors.primary` → **componentes @nuxt/ui** de alquilame (botones, links, badges) cambian a rojo de inmediato. Las clases Tailwind azules hardcodeadas NO cambian con esto.
- `default.vue` envuelve todas las páginas → header/footer nuevo en todo el sitio.

---

## Diseño

### 1. Tokens de color

@nuxt/ui v4 (Tailwind 4) no acepta un hex arbitrario como `primary`: requiere un color con escala 50–950. En `app/assets/css/theme.css`:

```css
@theme {
  /* Escala brand anclada en #CC022B. Valores finales se afinan
     visualmente contra el CSS del diseño durante implementación. */
  --color-brand-50:  #fef2f4;
  --color-brand-100: #fce4e8;
  --color-brand-200: #f9c5cd;
  --color-brand-300: #f498a6;
  --color-brand-400: #ea5067;
  --color-brand-500: #e50a35;
  --color-brand-600: #cc022b; /* ancla — primario de marca */
  --color-brand-700: #a8001f;
  --color-brand-800: #94001e; /* hero gradient end */
  --color-brand-900: #6b0617;
  --color-brand-950: #3f040d;

  /* Tokens semánticos (gradientes y neutros del diseño) */
  --color-hero-from:   #cc022b;
  --color-hero-to:     #94001e;
  --color-footer-from: #cb032c;
  --color-footer-to:   #a00425;
  --color-surface-soft:    #edf0f5;
  --color-surface-softer:  #f4f5f9;
  --color-surface-softest: #f8f9fc;
}
```

`app/app.config.ts` — hoy es `ui: uiConfig` (sin `colors`). Añadir el override:

```ts
ui: {
  ...uiConfig,
  colors: { primary: 'brand', neutral: 'zinc' },
}
```

**Riesgo TS (heredado del cluster histórico, nota en `ui.config.ts:13-19`):** `uiConfig` es `as const satisfies AppConfigInput['ui']` (`ui.config.ts:55`). El spread `{ ...uiConfig, colors }` produce un objeto nuevo cuya asignabilidad a `AppConfigUI` hay que revalidar; `primary: 'brand'` (string custom fuera de la unión de colores de @nuxt/ui) **puede** disparar TS2322. Mitigación: si el typecheck falla, aplicar `colors: { primary: 'brand' } as const` o un `satisfies AppConfigInput['ui']` local. Gate: `pnpm --filter ui-alquilame typecheck` verde.

**Shade del primario:** @nuxt/ui usa el shade 500 (light) / 400 (dark) por defecto para `primary`. Si el botón no queda exactamente `#CC022B`, ajustar `--ui-primary` o el shade default vía `app.config` `ui.colors`. Se valida visualmente contra el botón del diseño.

**Limpieza del azul:** reescribir los 5 sitios de `default.vue` (§3) y `.link-*` de `typography.css` (§2) a tokens de marca. `base.css` no requiere cambios salvo confirmar que `.bg-animated-gradient` (keyframe azul) no esté surfaceando — si está en uso, recolorear; si no, dejar.

### 2. Fuentes

`nuxt.config.ts` — bloque **top-level** `fonts` (configKey de @nuxt/fonts; NO añadir a `modules[]`):

```ts
fonts: {
  families: [
    { name: 'Plus Jakarta Sans', weights: [700, 800] },
    { name: 'DM Sans', weights: [400, 500, 600] },
  ],
}
```

`theme.css`:

```css
@theme {
  --font-heading: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-sans:    'DM Sans', ui-sans-serif, system-ui, sans-serif;
}
```

Mecanismo concreto de aplicación (S2): las clases `.heading-*` de `typography.css` (que hoy hacen `@apply text-Nxl font-extrabold` sin `font-family`) reciben `font-family: var(--font-heading)`. El cuerpo hereda `--font-sans` global de Tailwind. **Actualizar también el critical CSS inline** de `nuxt.config.ts:36` (`body { font-family: system-ui }`) para no competir con la fuente nueva durante el swap.

CLS: `font-display: swap` + métricas fallback de @nuxt/fonts; medir vs baseline.

### 3. Layout + footer (`default.vue`)

- **Root/header:** `from-[#000073]...` → fondo de marca; header rojo sticky (`sticky top-0`) como el diseño. Retirar `bg-[#000073]` (`:6`). Logo nuevo (§4). Ajustar iconos `ColombiaFlag*` según el diseño.
- **Nav:** mantener funcional apuntando a anchors **existentes seguros**. Los anchors del diseño (`#fleet`, `#requirements`, `#cities`) se alinean en **F1** cuando esas secciones existan — F0 no introduce anchors rotos.
- **Footer:** fusionar las 3 secciones actuales (`#sedes` `bg-blue-700`, barra legal `bg-[#000073]`, `UFooter` copyright) en **un footer con gradiente rojo** (`from-footer-from to-footer-to`) y tipografía del diseño (`font-heading`).
- **PRESERVAR el guard de hidratación (issue #109)** al reescribir la sección de ciudades (`default.vue:78-89,192-201`): los 19 `UButton` usan `getCityReservationURL(city)` con `reservationInitDay/EndDay` calculados **solo en `onMounted`**. SSR/primera hidratación → `null` → href estable `/${city.id}`. La reescritura debe conservar: (a) ese cálculo onMounted, (b) `:external="true" target="_blank"`, (c) el `v-for` sobre `cities` de `useData()`. No mover el cálculo de fecha a SSR.
- **Enlaces de ciudad (decisión aprobada):** mantener `getCityReservationURL(city)` → rutas **internas** `/[city]`, solo restyle a rojo. Preserva los 19 enlaces internos para el SEO de las landing (F2). El WhatsApp del diseño (18 ciudades) es artefacto del build estático (que solo generó la landing de Bogotá), no intención de marketing.
- **`error.vue` (boundary global):** des-azular `:2` (`from-blue-900 to-blue-950`) a fondo de marca. Es visible en cualquier 404/500, por eso entra en F0 (no esperar a una fase de páginas).

### Deuda declarada (azul fuera del chrome F0)

`ui.colors.primary='brand'` no toca azul hardcodeado. Estos archivos conservan azul tras F0, asignados a su fase:

| Archivo(s) | Azul | Fase |
|---|---|---|
| `pages/sindisponibilidad.vue`, `components/CategorySelectionSection.vue`, `components/ReservationResume.vue` | cuerpo de página/funcional | F3 |
| `pages/blog/[...slug].vue` | cuerpo blog | F3 |
| `layouts/gana.vue`, `pages/gana/*` (index, terminos, politicas) | chrome + cuerpo del flujo referido `/gana` | **Fuera de #112** (no está en la lista de páginas del issue) — queda como costura visual conocida: el footer rojo enlaza a `/gana` (app.config:70) que sigue azul. Decisión de incluirlo = ampliar scope, a confirmar con el usuario. |
| `base.css:173-204` `.bg-animated-gradient` | keyframe decorativo | verificar uso; recolorear o dejar |

Esto se declara explícitamente para que SCEN-F0-06 no sobre-afirme cobertura.

### 4. Assets de marca

| Origen (zip) | Destino | Propósito |
|---|---|---|
| `dist/logo.svg` | `public/images/brand/logo.svg` | `logo`/`svglogo` de app.config (`logo` sí lo usa `useBaseSEO`) |
| `dist/logo-white.svg` | `public/images/brand/logo-white.svg` | variante claro/oscuro |
| `dist/og-image.jpg` | `public/img/og-alquilame.jpg` (reemplaza) | `ogImage` (usado en `index.vue`) |
| `dist/favicon.svg` | `public/favicon.svg` | favicon |
| (raster de logo) | `public/images/brand/og-logo.png` | `oglogo` de app.config (higiene; sin consumidor hoy) |

**Logo (resuelve ambigüedad B2):** la fuente de verdad **visual** sigue siendo el componente `<Logo>` inline (sin request extra, ideal para header/footer). Comparar `dist/logo.svg` contra el SVG inline actual de `Logo.vue`:
- Si el logo del diseño difiere → actualizar los paths inline de `Logo.vue` y añadir prop de variante (blanco sobre fondo rojo, rojo/oscuro sobre fondo claro), dado que el diseño trae `logo.svg` + `logo-white.svg`.
- Si es el mismo → solo asegurar contraste sobre el header rojo.
- En paralelo, copiar `dist/logo.svg`/`logo-white.svg` a `public/images/brand/` para satisfacer las refs **de archivo** de `app.config` (SEO/JSON-LD), que son independientes del render inline.

**`og-logo.png`:** `app.config` lo referencia para el logo de organización en JSON-LD (rich results prefieren raster). Generar un PNG del logo, o repuntar `oglogo` a un asset existente. Decisión de implementación; el escenario verifica HTTP 200 del path final.

**Favicon:** añadir `dist/favicon.svg` a `public/favicon.svg` **y** declarar `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` en `app.head.link` (`nuxt.config.ts`), manteniendo `favicon.ico` como fallback para navegadores viejos. Sin el `<link>` explícito, el `.svg` no se sirve (Nitro solo auto-sirve `/favicon.ico`).

**Convención de optimización webp:** `scripts/optimize-images.mjs` con `sharp@^0.34.5` (versión del repo): umbral <500 KB en critical-path, preferir variantes `*-foto.webp`/`*.webp` ya optimizadas del zip. Los assets pesados de secciones (ventajas ~1.6 MB, cta ~2.5 MB, hero video, cities, vehicles) entran **con su fase consumidora** (F1/F2), no en F0.

---

## Boundaries / blast radius

- **Solo** `packages/ui-alquilame/**` + sus `public/`. `logic/` y las otras dos marcas no se tocan → su árbol git no cambia (garantía de aislamiento real).
- Preservar todos los `data-testid="*-test"` que consumen los E2E (`BRAND=alquilame`).
- Preservar el SEO programático (`useBaseSEO`, schema.org, breadcrumbs, sitemap) y el guard de hidratación #109. El footer conserva los 19 enlaces internos de ciudad.
- Verificar contra el alias Vercel `-git-main-`, no el dominio público.

## Fuera de alcance (F0)

- Home, landing de ciudad, legales, páginas funcionales (F1–F3).
- Assets de secciones (ventajas, cta, hero video, cities, vehicles, requirements, howitworks) → entran en F1/F2.
- Cambios en motor de reservas / contratos de API.
- Cutover DNS de `alquilame.co`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Spread `{...uiConfig, colors}` rompe inferencia TS del app.config (cluster histórico) | `as const`/`satisfies` local; `typecheck` verde como gate |
| @nuxt/ui usa shade 500 ≠ 600 → botón no queda `#CC022B` | Ajustar shade/`--ui-primary`; validar visual vs diseño |
| Limpieza del azul deja fuga en `.link-*`/keyframe | Grep de `blue`/`#000073`/`#0891b2` en todo `ui-alquilame/app` post-cambio (SCEN-F0-06) |
| Fuentes nuevas regresan CLS (+ critical CSS `system-ui` compite) | `swap` + métricas fallback; actualizar critical CSS `:36`; medir CLS |
| Romper guard #109 al reescribir footer de ciudades | Conservar cálculo onMounted + href SSR estable; E2E `BRAND=alquilame` |
| `@nuxt/fonts` ausente de node_modules | `pnpm install` como paso 0 de verificación |

---

## Escenarios observables (Given/When/Then)

- **SCEN-F0-01 (color primario):** Given la home de alquilame en el alias, when se inspecciona un botón/elemento primario, then usa el rojo de marca (`#CC022B` / `brand-600`), no el azul anterior (`#000073`).
- **SCEN-F0-02 (otras marcas intactas):** Given el branch F0, when `git diff --stat origin/main` , then no hay cambios fuera de `packages/ui-alquilame/**` (ni `logic/` ni `ui-alquilatucarro`/`ui-alquicarros`).
- **SCEN-F0-03 (fuentes):** Given una página de alquilame cargada, when se inspecciona el `font-family` computado de un `.heading-*` y del cuerpo, then es Plus Jakarta Sans / DM Sans respectivamente, self-hosted (sin `<link>` a `fonts.googleapis.com` en el HTML).
- **SCEN-F0-04 (footer rojo + SEO):** Given cualquier página, when se ve el footer, then tiene gradiente rojo (`#CB032C→#A00425`) con `font-heading`, y cada uno de los 19 enlaces de ciudad tiene `href="/{city.id}"` (p.ej. `/bogota`) — ruta interna, no `wa.me` (se abren con `target="_blank"` por `:external`).
- **SCEN-F0-05 (assets de app.config 200):** Given el HTML renderizado, when se hace HTTP GET a cada path de marca referenciado en `app.config` (`logo`, `svglogo`, `oglogo`, `ogImage`) + favicon, then todos responden 200 (los archivos de `/images/brand/*` existen; independiente de quién los consuma).
- **SCEN-F0-06 (chrome sin azul):** Given las superficies de chrome de F0 (`default.vue`, `error.vue`, `typography.css`), when se hace grep de `#000073`/`#0891b2`/`blue-[0-9]`, then no hay coincidencias. (Los cuerpos de página azules de F1–F3 y `/gana` quedan como deuda declarada — fuera del alcance de este escenario.)
- **SCEN-F0-07 (gates verdes):** Given el branch F0, when se corre `pnpm --filter ui-alquilame typecheck` y E2E `BRAND=alquilame`, then ambos en verde y todos los `data-testid` preservados.
- **SCEN-F0-08 (CLS no peor):** Given la home en el alias, when se mide CLS/Lighthouse, then no es peor que el baseline pre-F0.

---

## Plan de verificación

0. `pnpm install` (materializa `@nuxt/fonts` del lockfile).
1. `pnpm --filter ui-alquilame typecheck` (vía `ionice -c3 nice -n19`, nunca el typecheck raíz).
2. E2E `BRAND=alquilame`.
3. `git diff --stat origin/main` → confirmar cambios solo en `ui-alquilame/**` (SCEN-F0-02).
4. `/agent-browser` + `/dogfood` en el alias `-git-main-`: cero errores de consola, cero requests fallidos; inspección de fuentes/colores/footer/assets 200.
5. Lighthouse/CLS vs baseline (SCEN-F0-08).
