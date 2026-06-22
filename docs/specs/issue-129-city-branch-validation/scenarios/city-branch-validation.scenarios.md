---
name: city-branch-validation
created_by: sdd
created_at: 2026-06-22T00:00:00Z
---

# Issue #129 — city↔branch validation (holdout)

Invariante: el branch de **recogida** DEBE pertenecer a la ciudad de la página; el de **devolución**
puede diferir (one-way legítimo). El botón BUSCAR re-dispara la búsqueda aunque la URL no cambie.

## SCEN-001: pickup foráneo se corrige a la sede de la ciudad
**Given**: una URL de búsqueda de Barranquilla cuyo `lugar_recogida` y `lugar_devolucion` son sedes de Armenia (`armenia-aeropuerto`), ambas sedes ajenas a la ciudad de la página
**When**: el flujo de validación resuelve la corrección (helper `resolveCityBranchCorrection`) y el middleware aplica el redirect
**Then**: devuelve `{ lugar_recogida: <slug sede Barranquilla>, lugar_devolucion: <slug sede Barranquilla> }`; runtime → la URL final apunta a la sede de Barranquilla, el banner dice "En Barranquilla" y el selector de recogida muestra la sede de Barranquilla
**Evidence**: valor de retorno del helper (unit test); URL final + texto del banner + valor del selector en el navegador (E2E/QA)

## SCEN-002: one-way legítimo NO se redirige
**Given**: una URL de Barranquilla con `lugar_recogida` = sede de Barranquilla y `lugar_devolucion` = sede de Medellín (`medellin-aeropuerto`) — recogida válida en la ciudad, devolución en otra
**When**: el flujo de validación evalúa la URL
**Then**: el helper devuelve `null`; runtime → no hay redirect, los params de la URL quedan intactos (pickup Barranquilla, return Medellín)
**Evidence**: retorno `null` del helper (unit test); ausencia de navegación extra + params de URL sin cambios (E2E)

## SCEN-003: URL ya consistente no cambia
**Given**: una URL de Barranquilla con recogida y devolución ambas en sedes de Barranquilla
**When**: el flujo de validación evalúa la URL
**Then**: el helper devuelve `null`; runtime → sin redirect, params intactos
**Evidence**: retorno `null` del helper (unit test); sin navegación extra (E2E)

## SCEN-004: el botón BUSCAR re-dispara con params idénticos
**Given**: el usuario está en la página base de resultados (no `/categoria/...`) y no cambió ningún parámetro (p. ej. tras un error)
**When**: hace click en "BUSCAR VEHÍCULOS" y el destino del enlace es idéntico a la ruta actual
**Then**: se dispara una nueva búsqueda — una nueva petición POST a `/api/reservations/availability` y `useStoreSearchData.pending` pasa a `true` — aunque la URL no cambie
**Evidence**: petición POST registrada en la capa de red del navegador (Playwright `page.route` spy); estado `pending` observable

## SCEN-005a: slug de sucursal inexistente cae al default (regresión)
**Given**: una URL cuyo `lugar_recogida` no corresponde a ninguna sucursal conocida
**When**: el middleware corre
**Then**: cae al default de la ciudad vía el bloque pre-existente (`!pickupBranch||!returnBranch`) — comportamiento sin regresión por el cambio de #129
**Evidence**: redirect a la URL con sedes default (E2E / comportamiento del middleware existente)

## SCEN-005b: legacy branch code se redirige a slug (regresión)
**Given**: una URL que usa un branch *code* legacy en vez de slug
**When**: el middleware corre
**Then**: redirige a la URL slug-based vía el bloque pre-existente legacy→slug — sin regresión
**Evidence**: redirect a la URL slug-based (E2E / comportamiento del middleware existente)

## SCEN-006: ciudad sin sucursal no rompe ni hace loop (edge / Riesgo #2)
**Given**: una URL cuyo segmento de ciudad no tiene ninguna sucursal resoluble (o ciudad garbage), con pickup foráneo
**When**: el flujo de validación evalúa la URL
**Then**: el helper devuelve `null` (no hay sede de ciudad para corregir) → no crash, no redirect loop (≤1 navegación)
**Evidence**: retorno `null` del helper (unit test, `cityBranch === undefined`); ausencia de error de runtime y ≤1 navegación (E2E)
