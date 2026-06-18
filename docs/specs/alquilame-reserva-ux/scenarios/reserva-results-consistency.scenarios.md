---
name: reserva-results-consistency
created_by: pablo+claude
created_at: 2026-06-18T00:00:00Z
---

# alquilame — consistencia UX de reserva / resultados

Tres ajustes de funcionalidad sobre el flujo de búsqueda/resultados de alquilame.
Marca aislada: `packages/ui-alquilame`; `packages/logic` y otras marcas NO se tocan.

---

## SCEN-001: la flota de marketing NO aparece en la página de resultados

**Given**: un usuario en una página de resultados de alquilame — ya sea
`/[ciudad]/buscar-vehiculos/...` o `/reservas` — con una búsqueda ACTIVA que
devolvió categorías (o está cargando, o devolvió error de disponibilidad).
**When**: la página renderiza con resultados activos.
**Then**: NO se renderiza la sección de marketing del home "Nuestra Flota"
(`HomeFleet`, `<section id="fleet">`) ni las demás secciones de marketing
genérico del home (HowItWorks, Requirements, ValueProps/Stats). El bloque de
resultados (`#seleccion-categorias`) sí aparece. En una página de ciudad, sus
secciones SEO propias (Intro, SeoContent, DeliveryPoints, Testimonios, FAQ) se
conservan.
**And (modo landing intacto)**: en `/[ciudad]` (landing, sin búsqueda activa) la
sección "Nuestra Flota" SÍ aparece — el gate solo aplica con resultados activos.
**Evidence**: DOM de la página renderizada — ausencia de `#fleet` / "Nuestra
Flota" cuando hay resultados; presencia de `#seleccion-categorias`; presencia de
`#fleet` en landing. Verificable por test de componente (CityPage con/ sin
búsqueda) + runtime (querySelector).

---

## SCEN-002: el formulario de búsqueda es legible en desktop

**Given**: un usuario en `/reservas` (o en el hero de resultados de ciudad) con
viewport de escritorio (ancho ≥ 1024px).
**When**: el formulario de búsqueda (`Searcher`) renderiza con los campos de
fecha de recogida y devolución.
**Then**: cada campo de fecha tiene ancho suficiente y el valor de la fecha NO
se superpone visualmente con el icono de calendario (el icono `#trailing` queda
separado del texto, sin solaparse). El formulario ocupa un ancho cómodo en
desktop (no comprimido a ~1/2 de un contenedor estrecho).
**And (móvil y CLS intactos)**: en viewport móvil el formulario se ve igual que
hoy (rama nativa `<input type=date>`); los wrappers de altura fija que reservan
el footprint (`h-[410px]` desktop / `h-[360px]` móvil, guard de CLS #109) se
conservan sin cambios.
**Evidence**: estilo computado en navegador real a 1440px — el bounding box del
texto de la fecha no intersecta el del icono de calendario; ancho del formulario
> ancho comprimido actual. Tests de altura CLS siguen verdes.

---

## SCEN-003: buscar desde /reservas se queda en /reservas con los parámetros

**Given**: un usuario en `/reservas` (sin `:city` en la ruta).
**When**: completa el buscador (sucursal de recogida/devolución, fechas, horas)
y ejecuta la búsqueda.
**Then**: la URL permanece en `/reservas` y los parámetros de búsqueda quedan en
el query string (`/reservas?lugar_recogida=...&lugar_devolucion=...&fecha_recogida=...&fecha_devolucion=...&hora_recogida=...&hora_devolucion=...`),
de modo que la búsqueda es compartible/bookmarkeable; los resultados de
disponibilidad se muestran in-place en `/reservas` (`#seleccion-categorias` con
las categorías reales). NO se navega a `/[ciudad]/buscar-vehiculos/...`.
**And (estado de resultados no indexable)**: cuando `/reservas` tiene query de
resultados, la página emite `robots: noindex, follow` (provisional, pendiente de
directiva); `/reservas` limpio (sin query) permanece indexable.
**And (ciudad intacta)**: buscar desde una página de ciudad conserva el
comportamiento F3 — navega a la URL profunda `/[ciudad]/buscar-vehiculos/...`
de esa ciudad (no se rompe el SEO programático ni otras marcas).
**Evidence**: en navegador real, tras ejecutar la búsqueda en `/reservas`, la URL
es `/reservas?...` (no `/[ciudad]/...`) y el grid de categorías renderiza;
`<meta name="robots">` = `noindex, follow` con query presente y ausente/ index
sin query. Test de componente del Searcher: en contexto `/reservas` el submit
apunta a `/reservas` con query; en contexto ciudad mantiene el named-route F3.
