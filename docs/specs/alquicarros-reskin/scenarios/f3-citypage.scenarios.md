---
name: f3-citypage
created_by: pablo
created_at: 2026-06-25T00:00:00Z
---

# F3 — CityPage mode-aware + flujo de reserva + blog (alquicarros, identidad naranja)

Holdout observable para la fase F3 (cierra el épico #210). Migra `ui-alquicarros`
del CityPage monolítico viejo (rojo inline) al modelo orquestador de alquilame:
`CityPage` delega en `app/components/city/*` y reusa `home/*` (F1). El motor de
disponibilidad NO cambia de comportamiento para los flujos existentes (home y
ciudad siguen navegando a `/[city]/buscar-vehiculos/...`). Lo nuevo: una página
`/reservas` centralizada y un hero mode-aware. Todo branded con los tokens F0
(`brand-*`, `hero-from/to`), sin rojo ni azul residual de alquilame. Solo se
modifica `packages/ui-alquicarros/`.

Lección de contraste F0/F1 (regla transversal): texto BLANCO sobre el naranja de
marca (`#ef9600`/`brand-600`) **falla** WCAG AA (2.32:1). Todo control relleno en
naranja usa texto OSCURO (`text-gray-900`). El rojo de alquilame sí pasa con
blanco; al portar, blanco-sobre-rojo → oscuro-sobre-naranja.

---

## SCEN-F3-01: la ciudad en modo landing oculta el motor y enruta a /reservas
**Given**: un visitante anónimo abre la landing de una ciudad (`/bogota`)
**When**: la página termina de cargar
**Then**: el hero de ciudad NO monta el `Searcher` (no hay inputs de búsqueda en
el hero); en su lugar muestra un CTA "Reservar ahora" que enlaza a `/reservas`; el
marketing genérico F1 (Fleet, HowItWorks, Requirements) SÍ es visible
**Evidence**: DOM — ausencia de los `data-testid="pickup-location-test"` en el hero
de `/bogota`, presencia de un enlace `to="/reservas"`, presencia de los bloques
Fleet/HowItWorks/Requirements

## SCEN-F3-02: la ruta de resultados monta el motor inline y oculta marketing genérico
**Given**: un visitante abre una URL de resultados
(`/bogota/buscar-vehiculos/lugar-recogida/.../hora-devolucion/...`)
**When**: la búsqueda de disponibilidad está activa (pending, con categorías, o con
error)
**Then**: el hero de ciudad monta el `Searcher` inline (con sus `data-testid`
estables); se renderiza el bloque de resultados `#seleccion-categorias`; el
marketing genérico F1 (Fleet/HowItWorks/Requirements) queda OCULTO — y oculto ya en
SSR (gate por el prop `mode`, no por estado onMounted), sin flash ni CLS
**Evidence**: DOM — presencia del Searcher + `#seleccion-categorias`; ausencia de
los bloques Fleet/HowItWorks/Requirements en el HTML server-rendered de la ruta de
resultados

## SCEN-F3-03: las secciones de ciudad renderizan con identidad naranja, sin rojo residual
**Given**: una landing de ciudad renderizada (`/bogota`)
**When**: se inspeccionan las secciones city (Intro, SeoContent, DeliveryPoints,
Testimonios, Faq) y su source
**Then**: los acentos (headings, iconos, divisores, hovers) usan tokens `brand-*`
de F0 (naranja); ningún componente de `app/components/city/` shippeado contiene
literales rojos hardcoded (`red-50`, `red-100`, `red-600`, `red-700`, `red-800`)
ni los hex rojos de alquilame (`#cc022b`, `#cb032c`, `#a00425`, `#93070b`)
**Evidence**: computed style en browser (acentos naranja) + grep sin `red-` ni hex
rojo sobre `app/components/city/`

## SCEN-F3-04: el pin secreto WhatsApp (#41) sigue inerte e invisible al cliente, ya reubicado
**Given**: el hero de ciudad del nuevo modelo (`app/components/city/Hero.vue`)
**When**: se inspecciona el `<h1>` city-targeted y su árbol de accesibilidad
**Then**: el pin copy-to-WhatsApp es un `<span aria-hidden="true">` inerte y
no-focusable (nunca un `<button>`, sin `aria-label`/`title` que filtre el secreto),
fuera del accessible name del `<h1>` (WCAG 2.5.3); el handler `copySearchToWhatsapp`
sigue cableado vía `useShareSearchParams`
**Evidence**: source de `city/Hero.vue` — span aria-hidden con `@click`, sin
`<button aria-label="Copiar…">` ni `title="Copiar…"`; accessible name del `<h1>` =
solo "Alquiler de carros en {ciudad}"

## SCEN-F3-05: /reservas limpia es una página de búsqueda indexable que NO dispara búsqueda
**Given**: un visitante abre `/reservas` sin query
**When**: la página carga
**Then**: monta el `Searcher` (con sus `data-testid`), muestra las secciones de
confianza F1 (HowItWorks/Requirements/Stats + Contact), NO ejecuta ninguna consulta
de disponibilidad, y es indexable (sin `robots: noindex`)
**Evidence**: DOM (Searcher + secciones de confianza presentes), 0 requests al
endpoint de disponibilidad en la carga, `<head>` sin meta robots noindex

## SCEN-F3-06: /reservas con query de resultados renderiza disponibilidad in-place y se marca noindex,follow
**Given**: un visitante abre `/reservas?lugar_recogida=<slug>&lugar_devolucion=<slug>&fecha_recogida=<f>&fecha_devolucion=<f>&hora_recogida=<h>&hora_devolucion=<h>`
**When**: la página carga
**Then**: se ejecuta la búsqueda desde el query string y el grid real de categorías
(`#seleccion-categorias`) se renderiza in-place bajo el hero; las secciones de
confianza genéricas quedan ocultas (gate SSR-estable por `route.query.lugar_recogida`);
el `<head>` emite `robots: noindex, follow`
**Evidence**: request al endpoint de disponibilidad con los slugs del query +
`#seleccion-categorias` en el DOM + meta `robots="noindex, follow"` en el HTML SSR

## SCEN-F3-07: el submit del Searcher es context-aware (ciudad → deep-link; /reservas → query string)
**Given**: el `Searcher` con una selección válida (sucursal de recogida + fechas)
**When**: el usuario dispara la búsqueda
**Then**: si está en una página de ciudad (`route.params.city` presente) navega al
deep-link nombrado `/[city]/buscar-vehiculos/lugar-recogida/.../hora-devolucion/...`
(comportamiento F1 INTACTO, SEO programático preservado); si está en `/reservas`
(sin `:city`) permanece en `/reservas` con los parámetros en el QUERY STRING
(compartible/bookmarkable), sin link roto por `city` indefinido
**Evidence**: en ciudad → navegación a la ruta `buscar-vehiculos`; en /reservas →
URL `/reservas?lugar_recogida=...` (no un named-route con city vacío)

## SCEN-F3-08: elegir una sucursal de otra ciudad deriva esa ciudad (followup #129 preservado)
**Given**: el `Searcher` en una página de ciudad
**When**: el usuario selecciona como recogida una sucursal que pertenece a OTRA
ciudad y dispara la búsqueda
**Then**: la navegación usa la ciudad de la sucursal de recogida elegida (no rebota
a la ciudad por defecto de la página actual con "La sede de recogida no corresponde
a la ciudad"); cuando no hay sucursal resuelta aún, cae a la ciudad de la ruta
**Evidence**: deep-link de resultados cuyo segmento `[city]` = ciudad de la sucursal
de recogida seleccionada

## SCEN-F3-09: los badges del Searcher son naranja de marca, sin lime ni rojo
**Given**: el `Searcher` con una selección que dispara los badges (días de alquiler /
horas extra) en los botones de fecha-retorno y horas
**When**: se inspeccionan los chips/badges
**Then**: su fondo es el naranja de marca (`brand-*`) con texto oscuro
(AA-contrast); NO usan el lime residual de alquicarros (`#a3f78b`) ni el rojo de
alquilame (`bg-red-600 text-white`)
**Evidence**: source de `Searcher.vue`/`SearcherSelectDrawer.vue` sin `#a3f78b` ni
`bg-red-600 text-white` en los badges + computed style naranja en browser

## SCEN-F3-10: las páginas de estado de reserva usan el design-system nuevo, naranja, sin azul residual
**Given**: un visitante llega a `/pendiente`, `/sindisponibilidad` y
`/reservado/<codigo>`
**When**: cada página renderiza
**Then**: usan las clases del design-system (`heading-page`/`heading-sub`/
`heading-hero`, `[--ctx-text-primary:#fff]`) con acentos naranja (`brand-*`), sin
literales rojos de alquilame ni el azul residual `text-blue-900`/`blue-700`; el CTA
"volver a buscar" de `/sindisponibilidad` es un control relleno en naranja con texto
OSCURO (AA-contrast), no `bg-white text-blue-900`
**Evidence**: source de las tres páginas — presencia de `heading-*` y `brand-*`,
ausencia de `blue-900`/`blue-700`/`red-`; computed contrast del CTA ≥ 4.5:1

## SCEN-F3-11: el blog renderiza posts reales con identidad naranja, sin rojo ni otra marca
**Given**: un visitante abre `/blog` y un post `/blog/<slug>`
**When**: las páginas cargan
**Then**: renderizan los posts reales (data-driven, sin placeholders fabricados);
los acentos usan tokens `brand-*` (naranja); no hay literales `red-*` hardcoded ni
el azul residual de enlaces (`blue-600`/`blue-700`); no aparece la palabra
"Alquilame" ni datos de otra marca
**Evidence**: DOM (cards/post reales) + grep sin `red-`/`blue-6`/`blue-7`/"Alquilame"
sobre `app/pages/blog/`

## SCEN-F3-12: cero data de otra marca; copy config-driven
**Given**: todas las superficies F3 renderizadas (landing, resultados, /reservas,
estados, blog)
**When**: se lee el texto visible y el source
**Then**: el nombre de marca proviene de `franchise.*` (Alquicarros); no hay literal
"Alquilame" ni hex/asset de otra marca en los archivos F3 nuevos o portados
**Evidence**: texto renderizado + grep sin "Alquilame" sobre los archivos F3 de
`ui-alquicarros`

## SCEN-F3-13: runtime limpio en todas las superficies F3
**Given**: un dev server de alquicarros (worktree)
**When**: se navega landing de ciudad → /reservas → ruta de resultados → blog →
una página de estado
**Then**: cero errores de consola y cero requests de red fallidos en cada vista
**Evidence**: consola del browser (agent-browser) + lista de network requests por vista

## SCEN-F3-14: el holdout E2E del Searcher unificado sigue verde para alquicarros
**Given**: el spec `e2e/searcher-unified-widget.spec.ts` con `BRAND=alquicarros`
**When**: corre la suite SCEN-001..016 (drawers móviles, popover desktop, sin ghost
calendar, params de submit, paridad multimarca)
**Then**: pasa igual que antes de F3 — la lógica de submit añadida (searchDestination
context-aware) NO rompe el comportamiento del widget unificado
**Evidence**: salida de Playwright `BRAND=alquicarros` con la suite del searcher en verde

## SCEN-F3-15: integridad de tipos/build tras retirar el monolito
**Given**: el paquete `ui-alquicarros` tras la migración (CityPage orquestador +
city/* + /reservas + composable portado)
**When**: corre `typecheck` (build-mode) y la suite Vitest del paquete
**Then**: no hay imports rotos del CityPage monolítico retirado ni símbolos sin uso;
los tests existentes que codifican invariantes preservados (pin #41, results-gating,
ReservationForm/Resume) siguen verdes o se reapuntan al nuevo source sin debilitar su
aserción
**Evidence**: salida de typecheck 1-marca + `vitest run` del paquete en verde
