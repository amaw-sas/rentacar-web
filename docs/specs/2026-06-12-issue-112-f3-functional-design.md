# Issue #112 — F3: Funcional — `/reservas` + reskin resultados/reserva/estados

**Issue:** #112 (reskin completo alquilame) · fase **4 de 4 (funcional)**
**Rama:** `feat/issue-112-f3-functional` (worktree `.worktrees/issue-112-f3`, desde `main` con F0+F1+F2)
**Estado:** diseño para revisión
**Depende de:** F0 (fundación) + F1 (home, `home/*`) + F2 (city landing + `city/*` + legales) — ya en `main` (merge `641ad89`).

## Contexto

F0 dejó el chrome de marca; F1 reskó el home (12 componentes `home/*`); F2 reskó la city landing (`CityPage.vue` orquestador + `city/*`) y los legales. El flujo funcional (búsqueda → resultados → reserva) sigue con el estilo heredado/parcial y la búsqueda vive **inline en los heroes**. F3 centraliza la búsqueda en una página nueva **`/reservas`**, saca el motor de los heroes (home + city landing → CTA "Reservar"), y reskinea la grilla de resultados + el slideover de reserva + las páginas de estado. **El blog se difiere a F4.**

`alquilame.co` público sigue legacy; verificación en el alias Vercel `-git-feat-issue-112-f3-functional-…` de la rama (ver [[project_brand_domains_and_cutover]]).

## Arquitectura del motor de búsqueda (hallazgo clave)

El botón de buscar es `<NuxtLink :to="{name: searchLinkName, params: searchLinkParams}">` (`Searcher.vue:309`). NO arma un path a mano: usa un **route name** (`city-buscar-vehiculos-lugar-recogida-…`) + params que Nuxt resuelve a la URL profunda. Los params salen de `useSearch()` (`packages/logic/src/composables/useSearch.ts:201-223`):

```
searchLinkParams = { city: route.params.city,  ← único acoplamiento a la URL
                     lugar_recogida: pickupBranch.slug, fecha_*, hora_* }
```

- `searchLinkParams.city` se toma de **`route.params.city`** (la ciudad de la URL actual). En `/reservas` no hay `:city` en la ruta → sería `undefined` → link roto.
- El dropdown de recogida/devolución usa **`sortedBranches`** (`Searcher.vue:16,39,65,88`) = `storeAdminData.sortedBranches` = **todas las sucursales de todas las ciudades** (verificado, no filtra por ciudad). Por lo tanto la selección de sucursal en `/reservas` no requiere cambio alguno.

**Conclusión:** el único toque del motor es derivar la ciudad de la sucursal de recogida elegida cuando no hay ciudad en la ruta. `Searcher.vue` es **por marca** (`packages/ui-alquilame/app/components/Searcher.vue`) → el fix se hace ahí, local a alquilame; **`packages/logic` no se toca** → cero impacto en alquilatucarro/alquicarros.

## Decisiones (brainstorming, aprobadas)

1. **`/reservas` es requisito exclusivo de alquilame; centraliza la búsqueda.** Es la **página de búsqueda** (searcher), NO la de resultados. Al hacer submit navega a las URLs profundas `buscar-vehiculos/...` existentes → **resultados y SEO programático intactos, sin redirects, sin colapsar URLs**.
2. **Searcher fuera de los heroes** (home + city landing) → CTA "Reservar ahora" → `/reservas`. La **página de resultados** (`buscar-vehiculos`) **conserva** el `Searcher` inline para refinar.
3. **Contenido de `/reservas` = evolución de patrones F1/F2** (hero rojo + Searcher prominente + secciones de confianza reusadas de `home/*`). Sin diseño de referencia nuevo.
4. **Blog → F4 aparte.** F3 = `/reservas` + reskin resultados/reserva/estados.
5. **Modo de hero por prop explícito** (no detección por router): cada page file pasa `mode`.

## Parte A — `/reservas` (página nueva)

**Nuevo**: `app/pages/reservas/index.vue` (aislado a alquilame; las otras marcas no tienen el archivo).

Estructura (reusa lenguaje visual aprobado):
- Hero rojo `bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]` con `<Searcher>` completo prominente. Headline + subcopy de búsqueda. Guard #109: `Searcher` en `ClientOnly` + fallback de altura fija (`PlaceholdersSearcher`) → cero CLS, sin `Date`/`today()` horneado en SSR/ISR.
- Secciones de confianza reusadas de F1: `HomeHowItWorks`, `HomeRequirements`, `HomeStats`, `HomeContact`. `HomeContact reserveAnchor` apunta al hero de `/reservas` (in-page) — el ancla existe en esta página.
- SEO: `useBaseSEO`/title/description propios de `/reservas`, canonical, og. **NO** emite Product/FAQPage de city (esos viven en las city pages). Breadcrumb simple (Inicio → Reservas).

**Toque del motor (local a `Searcher.vue` de alquilame):** la ciudad efectiva pasa a ser `route.params.city ?? pickupBranch.city`. Implementación: tras copiar `searchComposable.searchLinkParams` al ref local (`Searcher.vue:414`), sobrescribir `city` con el `.city` de la sucursal de recogida (`searchBranchByCode(lugarRecogida)`) cuando `route.params.city` es `undefined`. El route name (`searchLinkName`) no cambia. Submit deshabilitado/inerte hasta que haya sucursal de recogida válida (patrón actual del Searcher).

## Parte B — Modo de hero (landing vs resultados)

### Home Hero (`home/Hero.vue`) — solo en `/`
Quitar el bloque del motor: `<SelectBranch />` + el rótulo "¿En qué ciudad deseas recoger tu carro?". Reemplazar por CTA primario "Reservar ahora" → `/reservas` (botón blanco sobre rojo, mismo lenguaje que "Ver Precios"). **Conservar** "Ver Precios" (`#fleet`) + WhatsApp de contacto (es CTA de contacto, no de reserva) + `ImagesFamily` + h1/subcopy.

### City Hero (`city/Hero.vue`) — landing Y resultados (vía `CityPage`)
Añadir prop `mode: 'landing' | 'results'` (default `'results'` — fail-safe: si algo no pasa el prop, el engine sigue presente):
- `mode === 'landing'`: **sin** `<Searcher>`; en la columna del engine va el CTA "Reservar ahora" → `/reservas` (`<NuxtLink to="/reservas">` para navegación SPA, no `<a href>`). **Conserva** h1 city-SEO ("Alquiler de carros en {city}") + pin #41 (`<span aria-hidden>` inerte, copy-to-WhatsApp). **El `<div id="searcher" aria-hidden>` vacío SE MANTIENE** (decisión cerrada: es inofensivo, conserva el contrato del test `city/Hero.test.ts:64` que exige `id="searcher"`, y evita el edge-case de ancla muerta). En landing el `HomeContact` igual navega a `/reservas` (ver acoplamiento abajo), así que el `#searcher` vacío no recibe CTAs.
- `mode === 'results'`: **conserva** `<Searcher>` (refinar in-situ) + ancla `#searcher` + guard #109, **idéntico a F2** (cero cambio de comportamiento del engine).

### `CityPage.vue` + page files
`CityPage.vue` recibe `mode: 'landing' | 'results'` (default `'results'`) y lo reenvía a `<CityHero :city :mode>`. **El prop de cada page file es load-bearing**: si la landing olvidara pasar `mode="landing"`, degradaría en silencio a results-mode (no crashea — la ciudad está en la ruta de la landing — pero mostraría el Searcher en una landing que debe ser solo-marketing). Por eso el guard de aislamiento (SCEN-F3-03) verifica explícitamente la AUSENCIA de `Searcher`/`pickup-location-test` en la landing. `CityPage.vue:2` hoy monta `<CityHero :city="city" />` sin mode → hay que añadir el forward con default. Cada page file lo fija:
- `app/pages/[city]/index.vue` → `<CityPage :city mode="landing" />`
- las 4 rutas `…/buscar-vehiculos/…/index.vue` (con/sin `categoria` × con/sin `referido`) → `<CityPage :city mode="results" />` (todas pasan ya `:city="city"`; se les agrega `mode`).

### CTA acoplado (`#searcher`)
En `mode="landing"` no hay form en `#searcher`. `HomeContact` en la city landing pasa hoy `reserveAnchor="#searcher"` (F2). En landing eso apuntaría a un ancla sin acción → **en landing el contact apunta a `/reservas`** (link de navegación, no scroll). En `mode="results"` `#searcher` sigue válido (form presente) y los CTAs de `UnableCategoryCard` ("Probar otras fechas"/"Cambiar sucursal") siguen anclando ahí sin cambio. Implementación: `CityPage` pasa `reserveAnchor` condicional al modo (`/reservas` en landing, `#searcher` en results).

## Parte C — Reskin del flujo funcional (pulir base F2)

Aplicar tokens de marca (rojo, Plus Jakarta en headings, gradientes `bg-linear-to-*`, contraste `[--ctx-text-primary:#fff]` en fondos rojos/oscuros) — **sin cambiar comportamiento ni `data-testid`**:
- **Grilla de resultados**: `CategorySelectionSection.vue`, `CategoryCard.vue` (carrusel de modelos + precios). Preservar `data-testid` `reservation-next-test`/`reservation-resume-back-test`/`reservation-form-back-test` y el patrón de slideover único (issue #65: un `u-slideover`, no swap de capas).
- **Slideover de reserva**: `ReservationResume.vue` (resumen + precios, `data-testid` `extra-driver-line`/`baby-seat-line`/`wash-line`) + `ReservationForm.vue` (datos cliente; inputs ya `bg-gray-100`/blancos).
- **Páginas de estado** (`text-white` sobre root oscuro): `pendiente.vue`, `sindisponibilidad.vue`, `reservado/[reserveCode]/index.vue` → headings Jakarta, acentos de marca, conservar íconos semánticos (reloj/X/check) y CTAs (modificar búsqueda, WhatsApp). `reservado` conserva el `js-confetti` lazy.
- **Header** (`layouts/default.vue`): CTA "Reservar" → `/reservas` (desktop nav + menú móvil).

## Parte D — Tests unitarios existentes a actualizar (no opcional)

El cambio de comportamiento contradice aserciones duras de la suite vitest de la marca (`pnpm --filter ui-alquilame test` la corre por default). Actualizarlas es **parte del trabajo de F3**, no un efecto colateral; dejarlas sin tocar haría que la verificación reporte verde sin haber corrido el contrato nuevo. Reescribir para reflejar el comportamiento nuevo (NO debilitar para "que pasen"):

- **`home/__tests__/Hero.test.ts`**: `:42` `toMatch(/<SelectBranch\b/)` y `:46` `toMatch(/ciudad/i)` rompen (se quita `SelectBranch` + rótulo). → Reescribir: el home hero **NO** monta `SelectBranch`, **SÍ** monta un CTA "Reservar ahora" con `to="/reservas"`; conserva `href="#fleet"`/"Ver Precios" (`:62-63`) y el WhatsApp de contacto (`:69-72`).
- **`city/__tests__/Hero.test.ts`**: `:56-57` `<Searcher>`, `:60` import de `../Searcher.vue`, `:64` `id="searcher"`, `:67-71` `<ClientOnly>`/`<PlaceholdersSearcher>`/`h-[\d+px]`, `:93-94` `h-[410px]`/`h-[360px]` — todas asumen el engine incondicional. → Volverlas **mode-aware**: con `mode="results"` se preservan tal cual (engine + #109); con `mode="landing"` se afirma AUSENCIA de `<Searcher>`/`pickup-location-test`, PRESENCIA del CTA `to="/reservas"`, y que `id="searcher"` (div vacío) + h1 city + pin #41 (`:78-87`) se conservan.
- **`__tests__/CityPage.test.ts`** y **`home/__tests__/contact-announcement.test.ts`**: **verificar, probablemente sin cambio**. `CityPage.test.ts` solo afirma presencia de `<CityHero>` (sin aserción de `reserveAnchor`/`#searcher`); `contact-announcement.test.ts:72-79` testea `home/Contact.vue` en sí (que F3 no modifica — cambia el *caller*, y el CTA de landing es un `NuxtLink` aparte en el city Hero, no `Contact.vue`). Si el `reserveAnchor` condicional se implementa en `CityPage` (no en `Contact.vue`), ninguno de estos dos rompe; confirmarlo, no debilitar.
- **Nuevos tests F3**: `app/pages/reservas/` (hero + `<Searcher>` + guard #109: `<ClientOnly>` + `<PlaceholdersSearcher>` + `h-[\d+px]`, espejo de `city/Hero.test.ts:67-71`) y el guard de derivación de ciudad en `Searcher.vue` (city = `pickupBranch.city` cuando no hay `route.params.city`).
- **Estados** (`pendiente`/`sindisponibilidad`/`reservado`): **no exponen `data-testid`** (grep = 0) → su reskin es solo-visual; no hay contrato de testid que preservar ahí.

## Cross-cutting (preservar + lecciones F0/F1/F2)
- **Motor**: `Searcher` (sus `data-testid` `pickup/return-location-test`) y `CategorySelectionSection`/`SelectBranch` sin cambio de comportamiento; navegación a `buscar-vehiculos` igual; el único delta es la derivación de ciudad en `/reservas`.
- **`SelectBranch` del Fleet modal se queda** (`home/Fleet.vue:83`, `<SelectBranch variant="gray">`, CTA "Ver disponibilidad"). "Searcher fuera de los heroes" aplica a los **heroes**, no al modal del Fleet (engine-en-modal, no es un hero) → **fuera de scope de F3, intencional**.
- **SEO**: URLs profundas `buscar-vehiculos` sin cambios, **sin redirects**; JSON-LD city (#68 Product, FAQPage, AggregateRating) intacto; `/reservas` no duplica esos schemas.
- **Estilo**: `bg-linear-to-*` (NUNCA `bg-gradient-to-*` — render `none` con tokens `@theme`, [[reference_tailwind4_gradient_bg_linear]]); `[--ctx-text-primary:#fff]` en fondos oscuros/rojos (`.heading-*` trae color oscuro que pisa `text-white`).
- **CLS**: `aspect-ratio`/altura fija reservada; #109 (sin `Date`/`today()` en SSR/ISR) preservado en el `/reservas` hero.
- **Aislamiento**: solo `packages/ui-alquilame/**` (+ `docs/specs`). `packages/logic` y las otras 2 marcas: cero diff.

## Holdout — escenarios observables (SCEN-F3)

- **SCEN-F3-01 (`/reservas` funciona):** Given `/reservas` en el alias, when se ve, then rinde hero rojo + `Searcher` prominente; al elegir sucursal de recogida, fechas y horas y enviar, navega a la URL profunda `/{ciudad-de-la-sucursal}/buscar-vehiculos/lugar-recogida/...` correcta (ciudad derivada de la sucursal, no de la ruta).
- **SCEN-F3-02 (home sin engine inline):** Given `/` en el alias, when se ve el hero, then NO contiene `SelectBranch`; contiene un CTA "Reservar ahora" cuyo `href`/`to` resuelve a `/reservas`; "Ver Precios" y WhatsApp se conservan.
- **SCEN-F3-03 (city landing sin engine inline):** Given `/{city}` (landing), when se ve el hero, then NO contiene `Searcher` (cero `pickup-location-test` en la landing); contiene CTA "Reservar ahora" → `/reservas`; el h1 city-SEO y el pin #41 (`<span aria-hidden>` inerte) se conservan.
- **SCEN-F3-04 (resultados conserva engine):** Given una ruta `buscar-vehiculos` con params, when renderiza, then el hero SÍ contiene `Searcher` (con `pickup-location-test`/`return-location-test`) + ancla `#searcher`, y la grilla de resultados se muestra como hoy (engine sin cambios).
- **SCEN-F3-05 (reskin resultados/slideover):** Given resultados con categorías, when se inspecciona, then la grilla y el slideover (resumen + datos) tienen estilo de marca (gradientes renderizan, no `none`; headings Jakarta legibles), y los `data-testid` del flujo (`reservation-next-test`, `reservation-resume-back-test`, `reservation-form-back-test`, `extra-driver-line`, `baby-seat-line`, `wash-line`) siguen presentes.
- **SCEN-F3-06 (reskin estados):** Given `/pendiente`, `/sindisponibilidad` y `/reservado/{code}`, when se ven, then tienen estilo de marca (headings Jakarta, acentos rojos), conservan sus íconos semánticos y CTAs (modificar búsqueda, WhatsApp, código de reserva).
- **SCEN-F3-07 (header CTA):** Given cualquier página, when se ve el header, then hay un CTA "Reservar" (desktop + menú móvil) cuyo destino resuelve a `/reservas`.
- **SCEN-F3-08 (SEO intacto, sin redirects):** Given las URLs profundas `buscar-vehiculos` y las city pages, when se inspecciona el HTML renderizado, then responden 200 sin redirect, el JSON-LD city (#68 Product, FAQPage, AggregateRating) sigue presente y correcto, y `/reservas` no inyecta esos schemas city.
- **SCEN-F3-09 (estilo/contraste):** Given las secciones de fondo rojo/oscuro (hero `/reservas`, heroes, estados), when se mide, then gradientes renderizan (`bg-linear`, computed `background-image ≠ none`), headings blancos legibles, `bg-gradient-to-` en source = 0.
- **SCEN-F3-10 (CLS no peor):** Given `/reservas`, `/` y `/{city}` en el alias, when se mide CLS, then no es peor que el baseline pre-F3.
- **SCEN-F3-11 (aislamiento):** Given el branch F3, when `git diff main --stat`, then solo cambia `packages/ui-alquilame/**` (+ `docs/specs`); `packages/logic` y las otras 2 marcas sin diff; `pickup-location-test`/`return-location-test` y demás `data-testid` intactos.
- **SCEN-F3-12 (E2E sin regresión):** Given `BRAND=alquilame` contra el preview, when se corre la suite, then el flujo de búsqueda→resultados→reserva pasa (vía `/reservas` y vía la ruta `buscar-vehiculos` directa) y los `data-testid` resuelven; sin regresión vs baseline.

## Plan de verificación
Estática (unit/typecheck una marca con `ionice -c3 nice -n19 pnpm --filter ui-alquilame typecheck` — ver [[feedback_typecheck_disk_spike]] / grep aislamiento + `bg-gradient-to` cero) + **runtime en preview Vercel** (`agent-browser` + `/dogfood`): `/reservas` arma la URL profunda correcta desde la sucursal; home/city landing sin engine inline + CTA; resultados conserva engine; reskin grilla/slideover/estados (gradientes + contraste + Jakarta); header CTA; JSON-LD city intacto; CLS; cero errores de consola / requests fallidos; E2E `BRAND=alquilame` contra el alias (`PLAYWRIGHT_BASE_URL`). Cierre con `/verification-before-completion`.

## Fuera de F3
- **Blog** (`blog/index.vue`, `blog/[...slug].vue`) → **F4** (reskin del listado + detalle a la marca).
- **Keyword de cierre de #112**: como el blog (superficie de marca) queda para F4, F3 abre PR con **`Refs #112`** y **F4 cierra `Closes #112`**. (Alternativa a confirmar al abrir el PR: si se prefiere cerrar #112 en F3, el blog pasa a issue nuevo.) Ver [[feedback_pr_close_keyword_per_issue]].
- **Deuda heredada**: `representativeCategories` duplicada local en `Fleet.vue` (privado en logic); costura footer-rojo → `/gana`-azul (flujo referido fuera de #112).
