# Issue #112 — F1: Reskin del home alquilame (Astro → Nuxt)

**Issue:** #112 (reskin completo alquilame) · fase **1 de 4**
**Rama:** `feat/issue-112-f1-home` (worktree `.worktrees/issue-112-f1-home`, desde `main` con F0 mergeado)
**Estado:** diseño para revisión (v2, post spec-review)
**Depende de:** F0 (fundación: tokens rojo, fuentes, chrome) — ya en `main` (PR #125).

## Contexto

F0 dejó el **chrome** de marca (header/footer rojo, colores, fuentes, assets) pero el **cuerpo del home sigue siendo el legacy** (`packages/ui-alquilame/app/pages/index.vue`): chrome rojo nuevo envolviendo contenido viejo. F1 porta el **home** del diseño entregado (build Astro, `/tmp/alqui_f1_design/dist/index.html`) a componentes Vue, traduciendo markup — el diseño es referencia visual, no código a copiar.

`alquilame.co` sigue en el sitio legacy (sin tráfico público); el intermedio vive solo en el preview Vercel. Verificación en el alias `-git-feat-…` de la rama.

## Approach (decidido en brainstorming)

- **Híbrido**: rebuild de secciones presentacionales como componentes Vue fieles al markup del diseño; **preservar + restilizar** las conectadas al engine (hero+selector ciudad, fleet+precio/disponibilidad) sin tocar comportamiento.
- **Datos reales + estilo del diseño**: estructura/estilo del mockup, datos reales de la app. **Excepción explícita**: la banda de stats (#5) no tiene fuente de datos → usa copy del diseño (ver decisión). Todo el resto sale de datos reales.

### Aclaración de fuentes de datos (verificado contra el código)
- **Cities**: NO son config — son **Supabase dinámico** vía `rentacar-data` (`cities` activas; `City.id` = `slug`; ruta `/[city]`). El conteo (~19) lo controla la DB, no el código.
- **FAQs**: NO son config — **Supabase dinámico** vía `useData()`/`useFetchRentacarData()` (`faqs`, compartidas entre marcas).
- **Categorías + precio**: `useFetchRentacarData().categories` (**global por código de categoría**, no por-ciudad), cada una con `month_prices`. El precio "desde" sale de `pickRepresentativeDailyPrice(category.month_prices).one_day_price` — date-free, determinista, nunca $0/fabricado (omite fail-soft si no hay fila activa). Es **el mismo mecanismo que usa la landing de ciudad** (`useCityProductSchema`, #68); la landing solo añade el nombre de ciudad al texto, el precio es global → **funciona en el home sin ciudad**.
- **Categorías representativas**: reusar la lista curada `representativeCategories` de `useCityProductSchema.ts` (C=Compacto, FX=Sedán, GC=Camioneta, LE=Camioneta Premium) con sus `name`/`description`.
- **Testimonios**: `franchiseTestimonials[brandCode]` (Supabase). **OJO**: `useHomeAggregateRating` está roto/hardcodeado hoy (rating `4.9` fijo; lee `useAppConfig().testimonials` que NO existe → probablemente no emite schema). Ver decisión de reviews.
- **Contacto**: `franchise.whatsapp` ya es **URL completa** (`https://wa.me/57314…`, no re-envolver) y `franchise.phone` (`+57 301…`) es **distinto** del número de WhatsApp. Usar config, no el número hardcoded del mockup.

## El home del diseño — secciones (enumeración completa)

Barra de anuncio (descartable, arriba) · `#hero` · `#fleet` · `#how-it-works` · value props · banda de stats · `#cities` · `#google-reviews` · banda "Empresas Aliadas" (marquee) · `#requirements` · `#faq` · `#contact` · FAB de contacto flotante · franja roja final (**= footer F0**).

## Mapeo sección por sección

| Diseño | Acción | Datos / engine |
|---|---|---|
| Barra de anuncio (descartable) | **Nueva** (incluida) | copy del diseño; estado de cierre client-only (no hornear bajo ISR) |
| `#hero` | **Restyle** al hero del diseño (gradiente, headline, layout) | **Preservar `SelectBranch`** + HeroHeadline/Title/Description, ImagesFamily |
| `#fleet` | **Rebuild** al grid del diseño; **precio "Desde $X/día" real** | 4 categorías representativas (C/FX/GC/LE); precio vía `pickRepresentativeDailyPrice` (fail-soft, nunca $0); modal→`SelectBranch`→"Ver disponibilidad" (verde, ya existe). **Toggle Diario/Mensual del mockup → fuera de F1** (el "desde" ya es la tarifa diaria de la mensualidad). El split manual/automática del mockup se simplifica a las 4 representativas con precio real. |
| `#how-it-works` | **Nueva** (3 pasos) | copy del diseño |
| Value props | **Nueva** (4) | copy del diseño; el headline ("¿Por qué elegir …?") toma el nombre de marca de `organization.brand` ("Alquilame", capitalizado — `franchise.shortname` es minúscula), NO hardcodear |
| Banda de stats | **Nueva** | copy del diseño tal cual (incl. "desde 2015") — **excepción a "datos reales"**, no hay fuente |
| `#cities` | **Nueva** en el home | **todas las ciudades activas** del data source, links internos `/{city.id}` (NO wa.me) |
| `#google-reviews` | **Restyle** del `#testimonios` al estilo review | `franchiseTestimonials` reales; **sin** rating hardcoded del mockup ("43"/"5,0") |
| "Empresas Aliadas" (marquee) | **Nueva** (incluida) | logos aliados/proveedores (Localiza/Avis/Alquicarros/Alquilatucarro); assets de marca |
| `#requirements` | **Restyle** del `#requisitos` | 4 requisitos reales (ya existen) |
| `#faq` | **Restyle** del acordeón | `faqs` del data source + `FAQPage` schema |
| `#contact` | **Nueva** CTA contacto | `franchise.whatsapp` (URL) + `franchise.phone`, NO el número del mockup |
| FAB de contacto flotante | **Nueva** (incluida) | reusar/restilizar el `ChatWidget` existente |
| franja roja | **Ya hecho (F0)** | footer |

### Decisiones de alcance (confirmadas)
- **Sección "Video 60% descuento" (`#video`) → ELIMINAR** (no está en el diseño). **Quitar AMBOS schemas**: `usePromoVideoSchema` (no hay video) **y** `useEarlyBookingPromotion` (el diseño no surface el 60% en copy → schema sin contenido visible = SEO deshonesto). Cubierto por SCEN-F1-07.
- **Reviews**: F1 **solo restila** la sección visible con `franchiseTestimonials` reales. **NO** se arregla `useHomeAggregateRating` (roto/hardcodeado) — es **deuda pre-existente declarada**, fuera de F1; el `AggregateRating` schema queda **sin regresión vs baseline** (lo que emita hoy, sigue igual). No se introduce ni "43" ni "4.9" nuevos en el render visible.
- **Banda de stats** → copy del diseño tal cual (excepción nombrada arriba).
- **#cities / #contact / marquee** → datos reales/config, nunca el wa.me o números hardcoded del mockup.

## Cross-cutting (preservar siempre)

- **Engine**: `SelectBranch`, flujo modal→"Ver disponibilidad", navegación a resultados — comportamiento intacto.
- **SEO/schema**: `useBaseSEO`, `useHomeBreadcrumb`, og meta, `FAQPage`, canonical — preservar. `AggregateRating` sin regresión. Promo+video schema **retirados** (decisión).
- **`data-testid`**: preservar los de `SelectBranch`/`Searcher`/cards.
- **Gradientes**: `bg-linear-to-*` (lección F0 — `bg-gradient-to-*` con tokens `@theme` custom renderiza transparente). Ver [[reference_tailwind4_gradient_bg_linear]].
- **`.heading-*`**: los headings de página adoptan la utility → Plus Jakarta (cierra deuda F0-03).
- **CLS**: mantener `aspect-ratio` reservado en imágenes.
- **Hidratación**: sin `Date`/`today()` en setup que hornee atributos bajo ISR; estado de barra de anuncio/FAB client-only (lección #109).
- **Aislamiento**: solo `packages/ui-alquilame/**` (+ `docs/specs`); `logic/` y otras 2 marcas intactas.

## Fuera de F1
- City landing (`alquiler-de-carros-bogota`) + legales (`terminos`/`privacidad`) → **F2**.
- Resultados / reserva / blog → **F3** (cierra #112 con `Closes`).
- Toggle Diario/Mensual del fleet; arreglo de `useHomeAggregateRating` → deuda declarada.

## Holdout — escenarios observables (Given/When/Then)

- **SCEN-F1-01 (hero):** Given el home en el alias, when se ve el hero, then tiene el layout del diseño (gradiente rojo `#CC022B→#94001E`, headline, selector de ciudad) y al elegir ciudad el `SelectBranch` se comporta igual que antes.
- **SCEN-F1-02 (fleet + precio real):** Given la sección fleet, when renderiza, then muestra las 4 categorías representativas (C/FX/GC/LE, incl. Premium) y cada una con precio "Desde $X/día" de `pickRepresentativeDailyPrice` (omitido fail-soft si no hay fila activa; **nunca $0 ni inventado**), y "Ver disponibilidad" abre el modal con `SelectBranch` y navega como antes.
- **SCEN-F1-03 (secciones nuevas presentes):** Given el home, when se recorre, then existen barra de anuncio, how-it-works (3 pasos), value props (4), banda de stats, marquee "Empresas Aliadas", contact y FAB flotante — con el estilo del diseño.
- **SCEN-F1-04 (cities internas):** Given la sección cities del home, when se inspeccionan los enlaces, then son **todas las ciudades activas del data source** con `href="/{city.id}"` interno (cero `wa.me`).
- **SCEN-F1-05 (reviews reales):** Given la sección reviews, when renderiza, then usa `franchiseTestimonials` reales y **no** contiene los números de marketing hardcodeados del mockup ("43 reseñas", "5,0").
- **SCEN-F1-06 (faq + requirements):** Given el home, when se ven faq y requirements, then usan `faqs`/requisitos reales con el estilo del diseño, y persiste el `FAQPage` schema.
- **SCEN-F1-07 (promo+video schema retirados):** Given el home renderizado, when se busca la sección "60% descuento/video" y el JSON-LD, then no existe la sección, y **no hay** `VideoObject` **ni** `Offer/Promotion` (EarlyBooking) schema huérfano.
- **SCEN-F1-08 (headings Plus Jakarta):** Given los headings de página del home, when se inspecciona el `font-family` computado, then es Plus Jakarta Sans (adoptan `.heading-*`) — cierra deuda F0-03.
- **SCEN-F1-09 (engine + data-testid):** Given el flujo de entrada de reserva, when se ejercita, then `SelectBranch`/búsqueda se comportan igual, los `data-testid` siguen presentes y el E2E no regresiona vs baseline.
- **SCEN-F1-10 (gradientes renderizan):** Given las secciones con gradiente, when se mide `background-image` computado, then renderizan (usan `bg-linear-to-*`, no `none`); grep de `bg-gradient-to-` en el chrome/home = 0.
- **SCEN-F1-11 (SEO sin regresión):** Given el HTML renderizado, when se inspecciona, then og meta, `FAQPage`, breadcrumb y canonical siguen presentes y correctos, y `AggregateRating` no regresiona respecto al baseline pre-F1.
- **SCEN-F1-12 (CLS no peor):** Given el home en el alias, when se mide CLS, then no es peor que el baseline pre-F1.
- **SCEN-F1-13 (aislamiento):** Given el branch F1, when `git diff main --stat`, then solo cambia `packages/ui-alquilame/**` (+ `docs/specs`).

## Plan de verificación
Estática (unit/typecheck/grep de aislamiento + `bg-gradient-to` cero) + **runtime en el preview Vercel** (`agent-browser`: layout por sección, precio real en fleet, font-family de headings, enlaces de cities, marquee/FAB/anuncio presentes, gradientes renderizan, consola limpia, CLS; JSON-LD sin VideoObject/Promotion; E2E `BRAND=alquilame` contra el preview, subconjunto home). Cierre con `/verification-before-completion`.
