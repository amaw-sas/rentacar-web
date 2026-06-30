---
name: one-way-distance-message
created_by: scenario-driven-development
created_at: 2026-06-30T00:00:00Z
issues: ["rentacar-dashboard#205"]
---

Holdout para el mapeo del one-way sin distancia registrada. Cuando Localiza no
tiene registrada la distancia entre las ciudades de recogida y devolución de un
alquiler one-way, responde `unknown_error` con `shortText: LLNRRE003` (OTA Code
303, "Distância entre cidades não cadastrada") y HTTP 500. La web debe traducir
ESE caso —y solo ese— a un mensaje accionable, sin secuestrar otros
`unknown_error`. Causa raíz río abajo: rentacar-dashboard#205.

Cada scenario describe comportamiento observable, no mecánica interna. La unidad
clasificadora (`classifyOneWayDistanceError`) es pura y se verifica directamente;
los scenarios de UI describen lo que ve el usuario.

## SCEN-OW-01: one-way sin distancia → toast claro

**Given**: usuario en una ruta de búsqueda one-way `/{city}/buscar-vehiculos/lugar-recogida/barranquilla-norte/lugar-devolucion/barranquilla-aeropuerto/...` (recogida ≠ devolución); el proxy `/api/reservations/availability` responde HTTP 500 con body `{"error":"unknown_error","message":"Ha ocurrido un error inesperado, por favor contacte a nuestros asesores","shortText":"LLNRRE003"}`.
**When**: la búsqueda se ejecuta automáticamente desde los route params y llega el response.
**Then**: aparece un toast de color `error` con título `Entrega en otra sede no disponible` y descripción `Por ahora no podemos cotizar la entrega en una sede distinta a la de recogida. Elige la misma sede para recoger y devolver, o escríbenos y te ayudamos.`; NO aparece el toast `No pudimos completar la búsqueda`; NO aparece el bloque `Servicio temporalmente no disponible`.
**Evidence**: `expect(toastQuery('Entrega en otra sede no disponible')).toBeVisible()`; `expect(page.getByText('No pudimos completar la búsqueda')).toHaveCount(0)`.

## SCEN-OW-02: mismo error en round-trip → toast genérico (no secuestrar)

**Given**: usuario en una ruta round-trip (recogida === devolución, p.ej. `.../lugar-recogida/barranquilla-norte/lugar-devolucion/barranquilla-norte/...`); el proxy responde HTTP 500 con body `{"error":"unknown_error","message":"...","shortText":"LLNRRE003"}`.
**When**: la búsqueda se ejecuta y llega el response.
**Then**: aparece el toast genérico con título `No pudimos completar la búsqueda`; NO aparece el toast `Entrega en otra sede no disponible`.
**Evidence**: `classifyOneWayDistanceError(err, 'ACBAN', 'ACBAN').error === 'unknown_error'` (sin cambio); a nivel UI, `expect(toastQuery('Entrega en otra sede no disponible')).toHaveCount(0)`.

## SCEN-OW-03: unknown_error de infra en one-way → toast genérico (sin falso positivo)

**Given**: usuario en una ruta one-way (recogida ≠ devolución); el proxy responde HTTP 500 con un `unknown_error` SIN `shortText` LLNRRE003 (p.ej. body `{"error":"unknown_error","message":"..."}` o `shortText` distinto).
**When**: la búsqueda se ejecuta y llega el response.
**Then**: aparece el toast genérico `No pudimos completar la búsqueda`; NO aparece `Entrega en otra sede no disponible`.
**Evidence**: `classifyOneWayDistanceError({error:'unknown_error', message:''}, 'ACBAN', 'AABAN').error === 'unknown_error'`.

## SCEN-OW-04: caso one-way no renderiza tarjetas

**Given**: el caso de SCEN-OW-01 (one-way + LLNRRE003).
**When**: la búsqueda termina.
**Then**: el área de resultados no muestra tarjetas de categoría (ni reales ni grises "unable") ni el banner `¡Vehículos Disponibles!`; el único feedback es el toast.
**Evidence**: `expect(page.locator('.categoria')).toHaveCount(0)` (`.categoria` es la clase raíz de cada `CategoryCard`); `expect(page.getByText('¡Vehículos Disponibles!')).toHaveCount(0)`.

## SCEN-OW-05: helper idempotente y robusto a bordes

**Given**: el helper `classifyOneWayDistanceError`.
**When**: se invoca con (a) un error ya clasificado `{error:'one_way_not_available', shortText:'LLNRRE003'}` + pickup≠return; (b) `shortText:'LLNRRE003'` con `returnLocation` null; (c) `shortText:'LLNRRE003'` con `pickupLocation` null.
**Then**: (a) retorna `error === 'one_way_not_available'` (estable, no rompe); (b) y (c) retornan el error sin cambio (no se clasifica sin ambos lugares).
**Evidence**: tres aserciones unit directas sobre el valor de retorno del helper.
