# Issue #112 — F1: Reskin del home alquilame (Astro → Nuxt)

**Issue:** #112 (reskin completo alquilame) · fase **1 de 4**
**Rama:** `feat/issue-112-f1-home` (worktree `.worktrees/issue-112-f1-home`, desde `main` con F0 mergeado)
**Estado:** diseño para revisión
**Depende de:** F0 (fundación: tokens rojo, fuentes, chrome) — ya en `main` (PR #125).

## Contexto

F0 dejó el **chrome** de marca (header/footer rojo, colores, fuentes, assets) pero el **cuerpo del home sigue siendo el legacy** (`packages/ui-alquilame/app/pages/index.vue`): chrome rojo nuevo envolviendo contenido viejo. F1 porta el **home** del diseño entregado (build Astro, `/tmp/alqui_f1_design/dist/index.html`) a componentes Vue, traduciendo markup — el diseño es referencia visual, no código a copiar.

`alquilame.co` sigue en el sitio legacy (sin tráfico público); el intermedio vive solo en el preview Vercel. Verificación en el alias `-git-feat-…` de la rama.

## Approach (decidido en brainstorming)

- **Híbrido**: rebuild de secciones presentacionales como componentes Vue fieles al markup del diseño; **preservar + restilizar** las conectadas al engine (hero+selector ciudad, fleet+disponibilidad) sin tocar comportamiento.
- **Datos reales + estilo del diseño**: estructura/estilo del mockup, pero datos reales de la app (19 ciudades de config, FAQs de config, categorías reales con precio, testimonios reales). Nada de contenido de marketing hardcodeado.

## El home del diseño tiene 11 secciones

1. `#hero` — gradiente rojo, headline, selector de ciudad
2. `#fleet` — Compacto / Sedán / Camioneta / Camioneta Premium, con "Desde $X/día" + "Ver disponibilidad"
3. `#how-it-works` — 3 pasos: Elige tu Ciudad y Vehículo · Reserva con anticipación · Recoge y Disfruta
4. Value props — Sin Anticipos · Flota Nueva · Asistencia 24/7 · Cobertura Nacional
5. Banda de stats — Vehículos disponibles · Ciudades en Colombia · Años de experiencia (desde 2015)
6. `#cities` — grid de ciudades ("19 ciudades")
7. `#google-reviews` — "X reseñas verificadas en Google" + cards
8. `#requirements` — requisitos del alquiler
9. `#faq` — acordeón
10. `#contact` — CTA de contacto
11. franja roja final — **= footer, ya hecho en F0**

## Mapeo sección por sección

| # | Diseño | Acción | Datos / engine | Origen actual |
|---|---|---|---|---|
| 1 | `#hero` | **Restyle** al hero del diseño (gradiente, headline, layout) | **Preservar `SelectBranch`** + HeroHeadline/Title/Description, ImagesFamily | `UPageHero` (index.vue) |
| 2 | `#fleet` | **Rebuild** al grid del diseño; **añadir precio "desde" real** por categoría | Categorías reales C/FX/GC/**LE=Premium**; precio vía `pickRepresentativeDailyPrice` (date-free, nunca $0); modal→`SelectBranch`→"Ver disponibilidad" (verde, ya existe) | `#categorias` (3 cards estáticas, sin precio) |
| 3 | `#how-it-works` | **Nueva** sección presentacional (3 pasos) | copy del diseño | — |
| 4 | Value props | **Nueva** (4 props) | copy del diseño | — |
| 5 | Banda de stats | **Nueva** | copy del diseño (incluye "desde 2015") | — |
| 6 | `#cities` | **Nueva** en el home; grid estilo diseño | **19 ciudades reales de config, links internos `/[city]`** (NO wa.me) | solo existían en footer |
| 7 | `#google-reviews` | **Restyle** al estilo review del diseño | `franchiseTestimonials[brandCode]` real + `useHomeAggregateRating`; **rating/conteo reales, no "43" hardcoded** | `#testimonios` |
| 8 | `#requirements` | **Restyle** al diseño | 4 requisitos reales (ya existen) | `#requisitos` |
| 9 | `#faq` | **Restyle** del acordeón | `faqs` de config + `FAQPage` schema | `#faqs` |
| 10 | `#contact` | **Nueva** CTA contacto | **WhatsApp/teléfono de `franchise` config** (NO el wa.me hardcoded del mockup) | — |
| 11 | franja roja | **Ya hecho (F0)** | — | footer |

### Decisiones de alcance (confirmadas)
- **Sección "Video 60% descuento" (`#video`) actual → ELIMINAR** (no está en el diseño). Quitar `usePromoVideoSchema` (no hay video). `useEarlyBookingPromotion` (Promotion 60%): retener **solo si** el 60% sigue siendo oferta real surfaced en copy (p.ej. hero/how-it-works "reserva con anticipación"); si no, eliminar para no dejar schema huérfano. → punto explícito en la spec, no drop silencioso de SEO.
- **#contact** → fuente `franchise` config (multimarca), no número hardcoded.
- **Banda de stats** → copy del diseño tal cual (incl. "desde 2015").
- **#cities** → 19 ciudades reales, links internos `/[city]` — consistente con la decisión F0 (el wa.me del mockup es artefacto Astro).

## Cross-cutting (preservar siempre)

- **Engine**: `SelectBranch`, flujo modal→"Ver disponibilidad", navegación a resultados — comportamiento intacto.
- **SEO/schema**: `useBaseSEO`, `useHomeBreadcrumb`, og meta, `FAQPage`, `AggregateRating`, canonical. Reubicar/retirar promo+video schema según decisión #video.
- **`data-testid`**: preservar los de `SelectBranch`/`Searcher`/cards.
- **Gradientes**: `bg-linear-to-*` (lección F0 — `bg-gradient-to-*` con tokens `@theme` custom renderiza transparente). Ver [[reference_tailwind4_gradient_bg_linear]].
- **`.heading-*`**: los headings de página adoptan la utility → Plus Jakarta (cierra la deuda F0-03, donde los headings Nuxt UI seguían en DM Sans).
- **CLS**: mantener `aspect-ratio` reservado en imágenes (práctica ya presente).
- **Hidratación**: sin `Date`/`today()` en setup que hornee atributos bajo ISR (lección #109).
- **Aislamiento**: solo `packages/ui-alquilame/**`; `logic/` y otras 2 marcas intactas.

## Fuera de F1
- City landing (`alquiler-de-carros-bogota`) + legales (`terminos`/`privacidad`) → **F2**.
- Resultados / reserva / blog → **F3** (cierra #112 con `Closes`).

## Holdout — escenarios observables (Given/When/Then)

- **SCEN-F1-01 (hero):** Given el home en el alias, when se ve el hero, then tiene el layout del diseño (gradiente rojo `#CC022B→#94001E`, headline, selector de ciudad) y al elegir ciudad el `SelectBranch` se comporta igual que antes (mismo destino/flujo).
- **SCEN-F1-02 (fleet + precio real):** Given la sección fleet, when renderiza, then muestra las categorías reales (incl. Premium=LE) con un precio "Desde $X/día" **real** (de `pickRepresentativeDailyPrice`, nunca $0 ni fabricado) y el botón "Ver disponibilidad" abre el modal con `SelectBranch` y navega como antes.
- **SCEN-F1-03 (secciones nuevas presentes):** Given el home, when se recorre, then existen how-it-works (3 pasos), value props (4), banda de stats, y contact — con el estilo del diseño.
- **SCEN-F1-04 (cities internas):** Given la sección cities del home, when se inspeccionan los enlaces, then son **19 ciudades reales** con `href="/{city.id}"` interno (cero `wa.me`).
- **SCEN-F1-05 (reviews reales):** Given la sección reviews, when renderiza, then usa `franchiseTestimonials` reales y rating/conteo de `useHomeAggregateRating` (no "43" hardcoded).
- **SCEN-F1-06 (faq + requirements):** Given el home, when se ven faq y requirements, then usan `faqs`/requisitos reales con el estilo del diseño, y persiste el `FAQPage` schema.
- **SCEN-F1-07 (video eliminado):** Given el home renderizado, when se busca la sección "60% descuento/video", then no existe, y no hay `VideoObject` schema huérfano.
- **SCEN-F1-08 (headings Plus Jakarta):** Given los headings de página del home, when se inspecciona el `font-family` computado, then es Plus Jakarta Sans (adoptan `.heading-*`) — cierra deuda F0-03.
- **SCEN-F1-09 (engine + data-testid):** Given el flujo de entrada de reserva, when se ejercita, then `SelectBranch`/búsqueda se comportan igual, los `data-testid` siguen presentes y el E2E no regresiona vs baseline.
- **SCEN-F1-10 (gradientes renderizan):** Given las secciones con gradiente, when se mide `background-image` computado, then renderizan (usan `bg-linear-to-*`, no `none`).
- **SCEN-F1-11 (SEO intacto):** Given el HTML renderizado, when se inspecciona, then og meta, `FAQPage`, `AggregateRating`, breadcrumb y canonical siguen presentes y correctos.
- **SCEN-F1-12 (CLS no peor):** Given el home en el alias, when se mide CLS, then no es peor que el baseline pre-F1.
- **SCEN-F1-13 (aislamiento):** Given el branch F1, when `git diff main --stat`, then solo cambia `packages/ui-alquilame/**` (+ `docs/specs`).

## Plan de verificación
Estática (unit/typecheck/grep de aislamiento + `bg-gradient-to` cero) + **runtime en el preview Vercel** (`agent-browser`: layout por sección, precio real en fleet, font-family de headings, enlaces de cities, gradientes renderizan, consola limpia, CLS; E2E `BRAND=alquilame` contra el preview por el subconjunto de home). Cierre con `/verification-before-completion`.
