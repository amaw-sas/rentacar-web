---
name: reservation-wizard
created_by: pablo
created_at: 2026-07-01T00:00:00Z
---

# Holdout — Wizard de reserva acompañada (alquicarros)

Holdout observable del wizard de 5 pasos. Copia fiel de los SCEN-W del diseño
(`docs/specs/2026-07-01-alquicarros-reservation-wizard-design.md`). Write-once:
tratar como contrato. Satisfacer los escenarios, nunca debilitarlos.

Fase 1 (config de segmentos + máquina de pasos) satisface la parte unit-observable
de SCEN-W-01, W-01b, W-02, W-03, W-04, W-05, W-07 y W-10 (derivación de paso desde
URL, taxonomía + fail-soft, `canAdvance`, back-preserva-estado). El resto de la
evidencia (DOM/SSR/E2E) se satisface en fases posteriores.

---

## SCEN-W-01: /reservas limpio arranca el wizard en Paso 1 sin disparar búsqueda
**Given**: un visitante abre `/reservas` sin query
**When**: la página carga
**Then**: el wizard monta el Paso 1 (Búsqueda) con el `Searcher` y sus `data-testid`; NO se ejecuta ninguna consulta de disponibilidad; el `<head>` NO lleva `noindex`
**Evidence**: DOM (Searcher presente, barra de pasos en "1 Búsqueda"), 0 requests al endpoint de disponibilidad, HTML SSR sin meta robots noindex. Unit (Fase 1): `deriveStepFromRoute` con un route sin `lugar_recogida` → paso `busqueda` (1).

## SCEN-W-01b: /reservas CON parámetros de búsqueda entra directo al Paso 2
**Given**: un visitante abre un `/reservas?lugar_recogida=<slug>&lugar_devolucion=<slug>&fecha_recogida=<f>&fecha_devolucion=<f>&hora_recogida=<h>&hora_devolucion=<h>` compartido/bookmarkeado (sin `paso` explícito)
**When**: la página carga
**Then**: la búsqueda se hidrata y ejecuta desde el query vía `useSearchByQueryParams` y el wizard monta directamente el Paso 2 (resultados/segmentos), SIN quedar en el Paso 1; el `<head>` emite `robots: noindex, follow`
**Evidence**: request de disponibilidad con los slugs del query en la carga, barra de pasos en "2 Vehículo" (no "1 Búsqueda"), meta robots noindex,follow en el HTML SSR. Unit (Fase 1): `deriveStepFromRoute` con `query.lugar_recogida` presente y sin `paso` → paso `vehiculo` (2).

## SCEN-W-02: completar la búsqueda avanza al Paso 2 y muestra segmentos
**Given**: el wizard en Paso 1 con una selección válida (recogida + fechas + horas)
**When**: el usuario dispara la búsqueda
**Then**: se ejecuta la consulta de disponibilidad y el wizard avanza al Paso 2 mostrando los tiles de segmento; el query de `/reservas` refleja los parámetros + `paso=vehiculo` y el `<head>` emite `robots: noindex, follow`
**Evidence**: request al endpoint con los slugs, barra de pasos en "2 Vehículo", URL `/reservas?lugar_recogida=…&paso=vehiculo`, meta robots noindex,follow. Unit (Fase 1): tras `next()` desde `busqueda` con búsqueda satisfecha, `currentStep` = `vehiculo`; `deriveStepFromRoute` con `paso=vehiculo` → 2.

## SCEN-W-03: los segmentos agrupan las gamas según la taxonomía y ocultan los vacíos
**Given**: disponibilidad devuelta con gamas de varios segmentos y un segmento sin stock
**When**: se renderiza el Paso 2 nivel 1
**Then**: cada tile agrupa las gamas correctas (C/CX→Económicos, F/FX/FL/FU/FY→Sedanes, G4/GC/GL/GY→Camionetas-SUV, LE/LP/LU/LY→Premium); el tile muestra el "desde $X" del más barato disponible; los segmentos sin vehículos disponibles NO se renderizan
**Evidence**: DOM de tiles vs `vehicleSegments.ts`; ausencia del tile del segmento vacío. Unit (Fase 1): `segmentForCode` mapea cada uno de los 15 códigos a su segmento nombrado; `groupBySegment` agrupa una lista de códigos en el orden de segmentos declarado.

## SCEN-W-04: una gama no mapeada cae en "Otros" y nunca se pierde
**Given**: disponibilidad que incluye un código no listado en ningún segmento (p.ej. `H`)
**When**: se renderiza el Paso 2 nivel 1
**Then**: el vehículo aparece bajo el segmento "Otros" (no desaparece de la vista)
**Evidence**: `segmentForCode('H') === 'otros'` (unit) + tile "Otros" con el vehículo (DOM). Unit (Fase 1): `segmentForCode` devuelve `'otros'` para todo código de `CategoryType` no mapeado (`H`, `G`, `GR`, `GX`, `V`, `VP`); ningún código queda sin segmento.

## SCEN-W-05: elegir segmento → vehículo fija la gama y actualiza el resumen
**Given**: el Paso 2 con el segmento "Económicos" abierto
**When**: el usuario selecciona la gama C
**Then**: `selectedCategory`/`vehiculo` = C; el sidebar muestra gama C, la ciudad, los días y el subtotal; el wizard habilita avanzar a Paso 3
**Evidence**: sidebar con "Gama C" + subtotal; `canAdvance` del Paso 2 = true. Unit (Fase 1): `canAdvance('vehiculo', state)` es false sin gama y true con `state.hasSelectedCategory`.

## SCEN-W-06: el Paso 3 recalcula el total al elegir Seguro Total
**Given**: el Paso 3 con Básico preseleccionado y un subtotal visible en el sidebar
**When**: el usuario elige Seguro Total
**Then**: `haveTotalInsurance`/`withTotalCoverage` = true y el total renderizado en el sidebar aumenta (recálculo en vivo, sin recargar)
**Evidence**: total renderizado en el sidebar (DOM) antes < después; `withTotalCoverage` del `selectedCategory` = true (observable vía el total expuesto `getTotalPrice`, no un computed interno no exportado).

## SCEN-W-07: el Paso 4 es opcional y "Omitir" avanza sin adicionales
**Given**: el Paso 4 (Adicionales) sin ninguna opción marcada
**When**: el usuario pulsa "Omitir"
**Then**: el wizard avanza al Paso 5 con `withExtraDriver/withBabySeat/withWash = false`; el sidebar muestra "Adicionales —"
**Evidence**: barra de pasos en "5 Datos", flags de extras en false, sidebar sin línea de adicionales. Unit (Fase 1): `canAdvance('adicionales', state)` es siempre true (paso opcional); `next()` desde `adicionales` → `datos`.

## SCEN-W-08: el resumen es persistente y refleja cada cambio en todos los pasos
**Given**: el wizard en cualquier paso ≥ 2 con gama, seguro y/o adicionales elegidos
**When**: se inspecciona el resumen en desktop y en móvil
**Then**: en desktop es un `<aside>` sticky siempre visible; en móvil es una barra inferior fija expandible; en ambos refleja gama + seguro + adicionales + total corrientes
**Evidence**: computed style (aside sticky ≥ breakpoint; barra fija < breakpoint) + contenido del resumen = estado actual.

## SCEN-W-09: el deep-link de resultados entra al wizard en Paso 2 pre-cargado
**Given**: un visitante abre `/[city]/buscar-vehiculos/lugar-recogida/…/hora-devolucion/…`
**When**: la página carga
**Then**: la búsqueda se hidrata desde el path (branches, fechas, horas) y el wizard monta directamente el Paso 2 con disponibilidad ya cargada; el SEO de la ruta NO cambia respecto a hoy — el `<head>` canonicaliza a `/[city]` (vía `useSearchPageSEO`) y NO añade `robots` meta (el `noindex,follow` es de `/reservas?query`, no de esta ruta)
**Evidence**: request de disponibilidad con los slugs del path, barra de pasos en "2 Vehículo", `<link rel="canonical">` a `/[city]` y ausencia de meta robots noindex en el HTML SSR (idéntico al comportamiento pre-wizard).

## SCEN-W-10: back preserva el estado ya elegido
**Given**: el wizard en Paso 4 con gama C y Seguro Total elegidos
**When**: el usuario hace clic en el paso "2 Vehículo" de la barra
**Then**: vuelve al Paso 2 con la gama C aún seleccionada y el sidebar intacto (seguro Total conservado); avanzar de nuevo no re-pregunta lo ya resuelto
**Evidence**: Paso 2 con C marcada + sidebar con Seguro Total; sin reset de selecciones. Unit (Fase 1): `goTo(2)` desde el paso 4 fija `currentStep` = 2 y conserva `maxReachedStep` = 4; la máquina no resetea estado al retroceder.

## SCEN-W-11: submit desde el Paso 5 enruta igual que hoy (sin regresión)
**Given**: el Paso 5 con datos válidos y una selección completa
**When**: el usuario confirma
**Then**: `submitForm()` se ejecuta y navega según `routeForReservationStatus` (`/reservado/[code]` | `/pendiente` | `/sindisponibilidad`), idéntico al flujo actual
**Evidence**: navegación a la ruta correcta por estado de la reserva.

## SCEN-W-12: sin disponibilidad en Paso 2 no rompe el wizard
**Given**: una búsqueda válida que devuelve cero categorías disponibles
**When**: el wizard llega al Paso 2
**Then**: muestra un estado vacío inline con CTA "ajustar búsqueda" que vuelve al Paso 1; no hay error de consola ni navegación dura
**Evidence**: DOM del estado vacío + CTA a Paso 1; consola limpia.

## SCEN-W-13: aislamiento — las hermanas y logic no cambian de salida
**Given**: el paquete tras implementar el wizard
**When**: se corre typecheck 1-marca + Vitest de `ui-alquicarros` y se compara la salida de alquilatucarro/alquilame
**Then**: `logic/`, `ui-alquilatucarro` y `ui-alquilame` sin cambios; typecheck 1-marca y Vitest de alquicarros en verde
**Evidence**: diff git vacío en `packages/logic`, `packages/ui-alquilatucarro` y `packages/ui-alquilame`; typecheck/Vitest de alquicarros verde.

## SCEN-W-14: el deep-link con gama entra al wizard en Paso 3 con el vehículo preseleccionado
**Given**: un visitante abre `/[city]/buscar-vehiculos/…/categoria/[gama]` (p.ej. `…/categoria/C`)
**When**: la página carga
**Then**: la búsqueda se hidrata desde el path y, además, se lee `route.params.categoria` para fijar `selectedCategory` = esa gama; el wizard monta directamente el Paso 3 (Seguro) con el vehículo ya elegido reflejado en el sidebar; si la gama del path no está en la disponibilidad devuelta, cae al Paso 2 (no rompe)
**Evidence**: barra de pasos en "3 Seguro", sidebar con la gama del path, comparador Básico/Total visible; caso sin match → barra en "2 Vehículo" sin error de consola. Unit (Fase 1): `deriveStepFromRoute` con segmento de path `categoria` presente → paso `seguro` (3).
