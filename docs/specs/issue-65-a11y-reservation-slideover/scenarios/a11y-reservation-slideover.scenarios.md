---
name: a11y-reservation-slideover
created_by: claude
created_at: 2026-06-04T00:00:00Z
issue: 65
epic: 63
---

# A11y del flujo de reserva: un solo slideover modal + autocomplete

Flujo de reserva de las tres marcas (componentes byte-idénticos). Dos slideovers
secuenciales — "Resumen de la reserva" → "Datos para reservas" — deben respetar
la invariante **a lo sumo un diálogo modal abierto**. El formulario debe exponer
`autocomplete` estándar y nombre accesible.

Invariante central: en todo momento hay **0 o 1** `[role=dialog]` visible; si hay
uno, tiene `aria-modal="true"`.

Verificación: runtime con Playwright (`/agent-browser`) sobre preview de
alquilatucarro; los escenarios de URL inspeccionan `window.location`; el de
autocomplete inspecciona el DOM renderizado. SCEN-006 es regresión de #25.

## SCEN-001: apertura directa por deep-link expone un único modal
**Given**: la página de resultados abierta con `?reservar=ECAR` (categoría válida y disponible)
**When**: las categorías cargan y el slideover de datos se auto-abre
**Then**: existe exactamente un `[role=dialog][aria-modal="true"]` en el DOM y es el de "Datos para reservas" (no el de "Resumen")
**Evidence**: conteo de `[role=dialog]` visibles y su `aria-modal`/título en el snapshot de Playwright

## SCEN-001b: cold-load /categoria/X (sin reservar) abre solo el Resumen
**Given**: navegación en frío a `/.../categoria/ecar` sin `?reservar` (o `?resumen=ECAR`)
**When**: las categorías cargan y el slideover se auto-abre
**Then**: existe exactamente un `[role=dialog]` visible y es el de "Resumen" (no el de "Datos")
**Evidence**: conteo de `[role=dialog]` visibles + título en el snapshot (otra rama del watcher de auto-apertura)

## SCEN-002a: click en tarjeta abre solo el Resumen
**Given**: la página de resultados sin slideover abierto
**When**: el usuario hace click en una tarjeta de categoría (`setSelectedCategory`)
**Then**: aparece exactamente un `[role=dialog]` visible y es el de "Resumen de la reserva" (no el de "Datos")
**Evidence**: conteo de `[role=dialog]` visibles + título en el snapshot

## SCEN-002: Resumen → Datos cierra el Resumen
**Given**: el slideover "Resumen de la reserva" abierto (tras click en una tarjeta)
**When**: el usuario hace click en "Siguiente"
**Then**: "Resumen" se cierra y queda exactamente un `[role=dialog]` visible, el de "Datos"
**Evidence**: conteo de `[role=dialog]` visibles antes/después en el snapshot

## SCEN-003: Datos → Volver reabre el Resumen y restaura la URL
**Given**: el slideover "Datos" abierto, URL en `/.../categoria/ecar?reservar=ECAR`
**When**: el usuario hace click en "Volver" dentro de "Datos"
**Then**: reaparece "Resumen" como único `[role=dialog]` y la URL es `/.../categoria/ecar` (sin `?reservar`)
**Evidence**: título del dialog activo + `window.location.pathname`+`search`

## SCEN-004: la transición Resumen→Datos no borra el deep-link
**Given**: el slideover "Resumen" abierto en `/.../categoria/ecar`
**When**: el usuario hace click en "Siguiente" (abre "Datos")
**Then**: la URL pasa a `/.../categoria/ecar?reservar=ECAR` y permanece así (la apertura de Datos no la limpia)
**Evidence**: `window.location.search` tras la transición

## SCEN-005: "Volver" en Resumen cierra todo y limpia la URL
**Given**: el slideover "Resumen" abierto en `/.../categoria/ecar`
**When**: el usuario hace click en "Volver" dentro de "Resumen"
**Then**: no queda ningún `[role=dialog]` visible y la URL vuelve a la base (sin `/categoria/...` ni `?reservar`)
**Evidence**: conteo de `[role=dialog]` (= 0) + `window.location.pathname`

## SCEN-006: regresión #25 — Back no deja el Searcher bloqueado
**Given**: cualquier slideover abierto, luego navegación a otra ruta y regreso vía Back del navegador
**When**: el usuario interactúa con el Searcher
**Then**: el Searcher responde; el `<body>` no conserva `pointer-events:none` inline
**Evidence**: estilo inline de `<body>` + click efectivo en un control del Searcher

## SCEN-007: campos del formulario exponen autocomplete estándar
**Given**: el slideover "Datos" abierto con el formulario renderizado
**When**: se inspecciona el DOM de los inputs
**Then**: nombres → `autocomplete="given-name"`, apellidos → `family-name`, correo → `email`; y los campos de identificación (tipo y número) **no** exponen ningún atributo `autocomplete` (no se fabrica token; tampoco `"off"`)
**Evidence**: atributo `autocomplete` de cada `<input>` en el snapshot (presente en los 3, ausente en los 2 de identificación)

## SCEN-008: el teléfono expone autocomplete y su nombre accesible es "Teléfono"
**Given**: el formulario renderizado
**When**: se inspecciona el input de teléfono (`VueTelInput`)
**Then**: expone `autocomplete="tel"`; su nombre accesible computado es exactamente "Teléfono" (provisto por el `UFormField` vía `aria-labelledby`/`for`-`id`); y **no** conserva `aria-label="Número de teléfono"` (se eliminó para no violar Label in Name)
**Evidence**: atributos `autocomplete`, `aria-labelledby`/`id` y `aria-label` del input; nombre accesible computado (Accessibility tree / `accessibleName`)

## SCEN-009: paridad entre marcas
**Given**: los componentes de las tres marcas
**When**: se comparan tras el cambio
**Then**: `CategorySelectionSection.vue` y `ReservationForm.vue` siguen byte-idénticos entre alquilatucarro, alquilame y alquicarros
**Evidence**: md5 de los 6 archivos (3 + 3) coincide por componente
