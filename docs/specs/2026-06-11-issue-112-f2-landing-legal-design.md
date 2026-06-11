# Issue #112 — F2: City landing + legales (Astro → Nuxt)

**Issue:** #112 (reskin completo alquilame) · fase **3 de 4**
**Rama:** `feat/issue-112-f2-landing-legal` (worktree `.worktrees/issue-112-f2`, desde `main` con F0+F1)
**Estado:** diseño para revisión
**Depende de:** F0 (fundación) + F1 (home + componentes `home/*`) — ya en `main`.

## Contexto

F0 dejó el chrome de marca; F1 reskó el home con 12 componentes en `app/components/home/*`. F2 porta la **city landing** (`/{city}`, render por `CityPage.vue`) y las **2 páginas legales** (`terminos-condiciones.vue`, `politica-privacidad.vue`) al diseño entregado (`/tmp/alqui_f1_design/dist/{alquiler-de-carros-bogota,terminos,privacidad}/index.html`).

`alquilame.co` público sigue legacy; verificación en el alias Vercel `-git-feat-…` de la rama.

## Decisiones (brainstorming)

1. **City landing = reskin marketing, engine/rutas INTACTOS.** El searcher (`Searcher`/`SelectBranch`) sigue navegando a `/{city}/buscar-vehiculos/...` como hoy; **F3** lo reapunta a `/reservas`. El bloque de resultados live (`#seleccion-categorias` → `CategorySelectionSection`) es **condicional** (solo con params de búsqueda) y se **preserva intacto** — la landing sin params ya es "marketing".
2. **Preservar TODO el contenido SEO** de la city landing (restilizado), no dropear secciones. AGREGAR las secciones de marketing del diseño reusando componentes `home/*` de F1.
3. **Legales = copy legal del diseño** (secciones numeradas, escrito para alquilame) + estilo del diseño. Reemplaza el contenido actual.

## Parte A — City landing (`CityPage.vue`)

`CityPage.vue` (464 líneas) lo usa `[city]/index.vue` Y las rutas `buscar-vehiculos` (condicional por params). Secciones actuales: hero (searcher + pin #41), `#seleccion-categorias` (resultados condicionales), `#descripcion`, `#ventajas`, `#puntos-entrega` (branches), `#introduccion`, `#destinos`, `#consejos-conduccion`, `#mejor-temporada`, `#ciudades-cercanas`, `#faqs`, `#testimonios`.

Diseño city: hero, `#intro`, `#fleet`, `#puntos-entrega`, `#how-it-works`, `#requirements`, `#google-reviews`, `#faq`, `#contact`.

### Mapeo

| Bloque actual | Acción | Notas |
|---|---|---|
| Hero (searcher + pin #41) | **Restyle** al hero del diseño (rojo `bg-linear`) | **Preservar `Searcher`/`SelectBranch`** (mismo destino `buscar-vehiculos`, mismos `data-testid`), pin #41 inerte, guard #109 (sin `Date`/`today()` horneado) |
| `#seleccion-categorias` (`CategorySelectionSection`) | **Preservar intacto** | Condicional (`v-if` params). No tocar el engine de resultados |
| `#descripcion` / `#introduccion` | **Restyle** → `#intro` del diseño; **texto SEO preservado** | El `#intro` del diseño mapea aquí |
| `#ventajas` / `#destinos` / `#consejos-conduccion` / `#mejor-temporada` / `#ciudades-cercanas` | **Restyle**, **texto SEO preservado** (indexable) | Cero pérdida de contenido |
| `#puntos-entrega` (`cityBranches`) | **Restyle** al diseño | Datos branches preservados |
| `#faqs` | **Restyle** (reusar `HomeFaq` si el contenido es brand-level; si city-specific, restyle in-place) | `FAQPage` schema preservado |
| `#testimonios` | **Reusar `HomeReviews`** de F1 | `franchiseTestimonials` reales |
| Marketing del diseño (`#fleet`, `#how-it-works`, `#requirements`, `#contact`) | **Agregar reusando `home/*` de F1** (`HomeFleet`, `HomeHowItWorks`, `HomeRequirements`, `HomeContact`) | DRY; mismas decisiones F1 (precio real, etc.) |

### Cross-cutting (preservar + lecciones F1)
- **Engine**: `Searcher`/`SelectBranch`/`CategorySelectionSection` sin cambios de comportamiento; `data-testid` intactos; navegación a `buscar-vehiculos` igual.
- **#41 pin**: el `<span aria-hidden>` inerte de copy-to-WhatsApp se preserva (no reintroducir el `<button>`).
- **#109**: sin `Date`/`today()` horneado en SSR/ISR.
- **SEO/schema**: `useCityProductSchema` (#68, precio real por categoría), `FAQPage`, breadcrumb, canonical, og — preservados.
- **Estilo**: `bg-linear-to-*` (NO `bg-gradient-to-*`); `[--ctx-text-primary:#fff]` en secciones de fondo rojo/oscuro (lección F1 contraste); `.heading-*` → Plus Jakarta. Ver [[reference_tailwind4_gradient_bg_linear]].
- **CLS**: `aspect-ratio` en imágenes; estado client-only sin shift (lección F1 announcement).

## Parte B — Legales

`terminos-condiciones.vue` (186 líneas, 11 secciones actuales) y `politica-privacidad.vue` (140 líneas). Reemplazar el contenido por el **copy legal del diseño** (terminos: 11×h2 "Identificación del prestador / Aceptación / Requisitos / Reserva y pago / …"; privacidad: 10×h2 "Responsable / Marco legal / Datos / Finalidad / …") con el **estilo del diseño** (`font-heading` h2s, layout de documento legal limpio). Preservar `useSeoMeta`/`definePageMeta`/layout y los enlaces del footer (`politica-privacidad`, `terminos-condiciones`).

## Holdout — escenarios observables

- **SCEN-F2-01 (hero+searcher):** Given `/{city}` en el alias, when se ve el hero, then tiene el estilo del diseño (rojo, city name) y el `Searcher`/`SelectBranch` funciona igual (al buscar navega a `/{city}/buscar-vehiculos/...`, mismo `data-testid`).
- **SCEN-F2-02 (SEO content preservado):** Given la city landing, when se inspecciona el texto, then todas las secciones SEO actuales (descripcion/ventajas/destinos/consejos/temporada/ciudades-cercanas) siguen presentes con su contenido indexable (restilizado, no removido).
- **SCEN-F2-03 (marketing del diseño):** Given la city landing, when se recorre, then existen las secciones de marketing del diseño reusando componentes F1 (fleet, how-it-works, requirements, contact).
- **SCEN-F2-04 (puntos-entrega):** Given una ciudad con branches, when se ve `#puntos-entrega`, then lista los `cityBranches` reales con el estilo del diseño.
- **SCEN-F2-05 (resultados condicionales intactos):** Given una ruta `buscar-vehiculos` con params, when renderiza, then `#seleccion-categorias`/`CategorySelectionSection` muestra resultados como hoy (engine sin cambios).
- **SCEN-F2-06 (#41 + #109):** Given el hero, when se inspecciona, then el pin de copy-to-WhatsApp sigue inerte (`<span aria-hidden>`, fuera del accessible name del `<h1>`) y no hay `Date`/`today()` horneado bajo ISR.
- **SCEN-F2-07 (legales):** Given `/terminos-condiciones` y `/politica-privacidad`, when se ven, then usan el copy legal del diseño (secciones numeradas) con el estilo del diseño; los enlaces del footer resuelven 200.
- **SCEN-F2-08 (estilo):** Given las secciones de fondo rojo/oscuro, when se mide, then gradientes renderizan (`bg-linear`, no `none`), headings legibles (blancos vía `--ctx-text-primary`), `bg-gradient-to-` en source = 0.
- **SCEN-F2-09 (SEO/schema preservado):** Given el HTML renderizado de la city landing, when se inspecciona, then `useCityProductSchema` (#68, precio real), `FAQPage`, breadcrumb, canonical y og siguen presentes y correctos.
- **SCEN-F2-10 (CLS no peor):** Given `/{city}` en el alias, when se mide CLS, then no es peor que el baseline pre-F2.
- **SCEN-F2-11 (aislamiento):** Given el branch F2, when `git diff main --stat`, then solo cambia `packages/ui-alquilame/**` (+ `docs/specs`); engine/rutas/logic intactos.
- **SCEN-F2-12 (E2E sin regresión):** Given `BRAND=alquilame` contra el preview, when se corre el subconjunto de city/legales, then sin regresión vs baseline y `data-testid` intactos.

## Plan de verificación
Estática (unit/typecheck/grep aislamiento + `bg-gradient-to` cero) + **runtime en preview Vercel** (`agent-browser`: hero+searcher, secciones SEO presentes, puntos-entrega, legales copy, gradientes+contraste, JSON-LD #68/FAQPage, CLS; ruta `buscar-vehiculos` con params muestra resultados; E2E city+legales). Cierre con `/verification-before-completion`.

## Fuera de F2
`/reservas` + flujo resultados/reserva + blog → **F3** (cierra #112 con `Closes`). F3 reapunta el searcher de `buscar-vehiculos` a `/reservas` y decide redirects/SEO.
