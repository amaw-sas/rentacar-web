# Issue #112 — F0: Fundación de marca alquilame (Astro → Nuxt)

**Fecha:** 2026-06-10
**Issue:** #112 (reskin completo alquilame)
**Fase:** F0 de 4 (F0 fundación → F1 home → F2 landing+legales → F3 reskin funcional)
**Rama:** `feat/issue-112-f0-foundation`
**Estado:** diseño para revisión

---

## Contexto

`alquilame.co` es la única de las tres marcas aún en el sitio legacy. El equipo de diseño entregó la nueva identidad como build estático de Astro (`/tmp/alquilame.zip`). El issue #112 cubre portar ese diseño a `packages/ui-alquilame/` (Nuxt 4 + Vue 3 + @nuxt/ui v4 + Tailwind 4), traduciendo el markup a componentes Vue — el zip es referencia visual y de assets, no código a copiar.

El reskin completo se descompuso en 4 fases que aterrizan incrementalmente a `main` y se verifican en el alias Vercel `-git-main-` (no en el dominio público, que sigue sirviendo legacy). Este documento diseña **F0**, la fundación de la que dependen el resto.

### Decisión de descomposición (aprobada)

| Fase | Entrega | Depende de |
|---|---|---|
| **F0** | Tokens, fuentes, layout+footer, assets de marca | — |
| F1 | Home (11 secciones) | F0 |
| F2 | Landing ciudad + legales | F0 |
| F3 | Reskin funcional (resultados/reserva/blog) | F0 |

F0 va primero porque cambia color y fuentes **globalmente**; el resto del sitio adopta el rojo de inmediato (efecto deseado). Las páginas aún no reskinneadas (F1–F3) quedan en estado intermedio en el alias no-público — aceptable.

---

## Correcciones al enunciado del issue

El issue fue escrito 2026-06-05. Dos premisas cambiaron:

1. **#108 ya está CLOSED** (2026-06-09, PR #119). El `og:image` ya es correcto por marca (`/img/og-alquilame.jpg`). F0 **no cierra #108**; solo reemplaza el asset por el del diseño nuevo.
2. **Paleta actual es azul/navy** (`#000073`, `#0891b2`), no neutra. `base.css` tiene ~15 overrides con `!important` que pelearán con el rojo — F0 debe limpiarlos, no solo agregar `ui.colors`.

---

## Alcance F0

Solo `packages/ui-alquilame/**`. **No** toca `logic/` ni las otras dos marcas.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `app/app.config.ts` | `ui.colors.primary = 'brand'`; actualizar paths de logo/og |
| `app/assets/css/theme.css` (nuevo) | `@theme` con escala `brand` + tokens semánticos + fuentes |
| `app/assets/css/main.css` | importar `theme.css` |
| `app/assets/css/rentacar-main/base.css` | retirar/reemplazar overrides azules `!important` |
| `app/assets/css/rentacar-main/typography.css` | conectar fuentes custom |
| `nuxt.config.ts` | config `@nuxt/fonts` |
| `app/layouts/default.vue` | header rojo + footer gradiente rojo unificado |
| `app/components/Logo.vue` | nuevo logo SVG |
| `public/images/brand/*`, `public/favicon.svg`, `public/img/og-alquilame.jpg` | assets de marca |
| `scripts/optimize-images.mjs` (nuevo) | convención de optimización webp (sharp) |

### Consumidores / propagación

- `app.config.ts` `franchise`/`organization` lo consume `useBaseSEO` (logic) → cambiar paths de logo afecta JSON-LD y og tags. Verificar que resuelvan 200.
- `ui.colors.primary` afecta **todos** los componentes @nuxt/ui de alquilame (botones, links, badges) → cambio visual global inmediato.
- `default.vue` envuelve todas las páginas → el footer/header nuevo aparece en todo el sitio.

---

## Diseño

### 1. Tokens de color

@nuxt/ui v4 (Tailwind 4) no acepta un hex arbitrario como `primary`: requiere un color con escala 50–950. Enfoque en `app/assets/css/theme.css`:

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
  --color-surface-soft:   #edf0f5;
  --color-surface-softer: #f4f5f9;
  --color-surface-softest: #f8f9fc;
}
```

`app/app.config.ts`:

```ts
ui: {
  ...uiConfig,          // compartido de logic, NO se modifica
  colors: { primary: 'brand', neutral: 'zinc' },
}
```

Así el markup usa utilidades (`from-hero-from`, `bg-surface-soft`, `text-primary`) en vez de hex inline, y los botones @nuxt/ui adoptan el rojo. La escala se valida contra el CSS Astro durante implementación; @nuxt/ui usa el shade 500/600 para el primario según modo — se ajusta el shade default si el botón no queda exactamente `#CC022B`.

**Limpieza de `base.css`:** retirar los overrides `!important` de `#000073`/`#0891b2`/gradiente bandera que fijaban el azul. Reemplazar por los nuevos tokens donde el override siga siendo necesario (p.ej. `--ui-text-highlighted`). Riesgo: residuos visuales en páginas viejas → se inspeccionan en el alias.

### 2. Fuentes

`nuxt.config.ts` vía `@nuxt/fonts` (bundled con @nuxt/ui, self-hosted, sin `<link>` a Google):

```ts
fonts: {
  families: [
    { name: 'Plus Jakarta Sans', weights: [700, 800] },
    { name: 'DM Sans', weights: [400, 500, 600] },
  ],
}
```

En `theme.css`:

```css
@theme {
  --font-heading: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-sans:    'DM Sans', ui-sans-serif, system-ui, sans-serif;
}
```

`typography.css` (hoy "preparado para fuente custom") conecta `--font-heading` en titulares. `font-display: swap` + métricas fallback de @nuxt/fonts para no regresar CLS.

### 3. Layout + footer (`default.vue`)

- **Root/header:** fondo gradiente azul → header rojo de marca, sticky (`sticky top-0`) como el diseño. Logo nuevo. Retirar/ajustar los iconos `ColombiaFlag*` según el diseño (el diseño conserva motivo Colombia pero reestilizado).
- **Nav:** mantener funcional apuntando a anchors **existentes seguros**. Los anchors del diseño (`#fleet`, `#requirements`, `#cities`) se alinean en **F1** cuando esas secciones existan — F0 no introduce anchors rotos.
- **Footer:** fusionar las 3 secciones actuales (`#sedes` azul + enlaces legales + `UFooter` copyright) en **un footer con gradiente rojo** (`from-footer-from to-footer-to`) y la tipografía del diseño (`font-heading`).
- **Enlaces de ciudad (decisión aprobada):** mantener `getCityReservationURL(city)` → rutas **internas** `/[city]`, solo restyle a rojo. Preserva los 19 enlaces internos para el SEO de las landing de ciudad (F2). El diseño usa WhatsApp para 18 ciudades, pero eso es artefacto del build estático (que solo generó la landing de Bogotá), no intención de marketing — seguirlo sería regresión SEO que el issue prohíbe.

### 4. Assets de marca (decisión aprobada: solo marca en F0)

Copiar del zip:

| Origen (zip) | Destino |
|---|---|
| `dist/logo.svg` | `public/images/brand/logo.svg` |
| `dist/logo-white.svg` | `public/images/brand/logo-white.svg` |
| `dist/favicon.svg` | `public/favicon.svg` |
| `dist/og-image.jpg` (67 KB) | `public/img/og-alquilame.jpg` (reemplaza) |

Establecer la **convención de optimización webp** (`scripts/optimize-images.mjs` con `sharp@0.32.6`): umbral <500 KB en critical-path, preferir variantes `*-foto.webp`/`*.webp` ya optimizadas del zip. Los assets pesados de secciones (ventajas ~1.6 MB, cta ~2.5 MB, hero video, cities, vehicles) entran **con su fase consumidora** (F1/F2), no en F0.

`app.config.ts`: actualizar `logo`/`svglogo`/`oglogo` a `/images/brand/*`. `ogImage` se mantiene en `/img/og-alquilame.jpg` (ahora con el asset del diseño).

---

## Boundaries / blast radius

- **Solo** `packages/ui-alquilame/**` + sus `public/`. `logic/` y las otras dos marcas no se tocan → su salida de build no cambia (verificable).
- Preservar todos los `data-testid="*-test"` que consumen los E2E (`BRAND=alquilame`).
- Preservar el SEO programático (`useBaseSEO`, schema.org, breadcrumbs, sitemap). El footer conserva los 19 enlaces internos de ciudad.
- Verificar contra el alias Vercel `-git-main-`, no el dominio público.

## Fuera de alcance (F0)

- Home, landing de ciudad, legales, páginas funcionales (F1–F3).
- Assets de secciones (ventajas, cta, hero video, cities, vehicles, requirements, howitworks) → entran en F1/F2.
- Cambios en motor de reservas / contratos de API.
- Cutover DNS de `alquilame.co`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `base.css` cleanup deja residuos azules en páginas viejas | Inspección visual en alias; documentar estado intermedio |
| `primary` rojo afecta todo el sitio de inmediato | Es el efecto deseado; verificar contraste/accesibilidad de botones |
| Fuentes nuevas regresan CLS | `font-display: swap` + métricas fallback @nuxt/fonts; medir CLS vs baseline |
| Override de `ui.colors` rompe inferencia TS del app.config (histórico cluster) | `pnpm --filter ui-alquilame typecheck` verde como gate |

---

## Escenarios observables (Given/When/Then)

- **SCEN-F0-01 (color primario):** Given la home de alquilame renderizada en el alias, when se inspecciona un botón/elemento primario, then usa el rojo de marca (`#CC022B` / `brand-600`), no el azul anterior (`#000073`).
- **SCEN-F0-02 (otras marcas intactas):** Given build de `ui-alquilatucarro` y `ui-alquicarros`, when se compara su HTML/CSS de salida vs antes de F0, then no cambia (aislamiento de marca).
- **SCEN-F0-03 (fuentes):** Given una página de alquilame cargada, when se inspecciona el `font-family` computado de titulares y cuerpo, then es Plus Jakarta Sans / DM Sans respectivamente, self-hosted (sin `<link>` a fonts.googleapis.com en el HTML).
- **SCEN-F0-04 (footer rojo + SEO):** Given cualquier página, when se ve el footer, then tiene gradiente rojo (`#CB032C→#A00425`) con tipografía del diseño, y los 19 enlaces de ciudad apuntan a rutas internas `/[city]` (no a wa.me).
- **SCEN-F0-05 (assets de marca):** Given una página renderizada, when se inspeccionan `og:image`, favicon y logo, then resuelven a los assets del diseño nuevo (`og-alquilame.jpg`, `favicon.svg`, `logo.svg`) y responden HTTP 200.
- **SCEN-F0-06 (sin azul residual):** Given las páginas de alquilame, when se buscan colores de marca, then no hay fugas del azul anterior (`#000073`/`#0891b2`) en header/footer/botones.
- **SCEN-F0-07 (gates verdes):** Given el branch F0, when se corre `pnpm --filter ui-alquilame typecheck` y E2E `BRAND=alquilame`, then ambos en verde y todos los `data-testid` preservados.
- **SCEN-F0-08 (CLS no peor):** Given la home en el alias, when se mide CLS/Lighthouse, then no es peor que el baseline pre-F0.

---

## Plan de verificación

- `pnpm --filter ui-alquilame typecheck` (vía `ionice -c3 nice -n19`, nunca el typecheck raíz).
- E2E `BRAND=alquilame`.
- Build de las otras dos marcas para confirmar salida sin cambios (diff de `.output`).
- `/agent-browser` + `/dogfood` en el alias `-git-main-`: cero errores de consola, cero requests fallidos, inspección de fuentes/colores/footer.
- Lighthouse/CLS vs baseline.
