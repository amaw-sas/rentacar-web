---
name: availability-error-feedback
created_by: scenario-driven-development
created_at: 2026-05-04T00:00:00Z
issues: ["#10"]
---

Holdout scenarios para la regresión silent-failure de issue #10: cuando el endpoint
`/api/reservations/availability` responde con un error estructurado de Localiza, el
usuario no recibe feedback visible (ni toast, ni bloque inline). Causa raíz dual:
(A) `CityPage.vue:105` condiciona el mount de `CategorySelectionSection` a
`pendingSearch || filteredCategories.length > 0`, ignorando el estado de error;
(B) `useStoreSearchData.ts:25` destructura `categoriesAdminData` de la store admin
de forma no-reactiva, fijando el valor (potencialmente el sentinel vacío) en init.

Cada scenario describe lo que el usuario ve en pantalla, no la mecánica interna.

## SCEN-001: usuario sin inventario ve bloque inline "¡Oops!"

**Given**: usuario en `/{city}/buscar-vehiculos/.../monteria-aeropuerto/...` (cualquier marca); el proxy `/api/reservations/availability` está stubbeado para responder HTTP 500 con body `{"error":"no_available_categories_error","message":"Lo sentimos, No se encontraron vehículos disponibles, inténta cambiando el día o la sede de recogida","shortText":"LLNRAG009"}`; `categoriesAdminData` poblado normalmente por el plugin `rentacar-data`.
**When**: la página termina de cargar (search se ejecuta automáticamente desde route params) y el response del proxy llega.
**Then**: visible en el DOM un bloque que contiene el texto `¡Oops!` y la frase `Nos quedamos sin carritos en {nombre de ciudad pickup} para el {fecha pickup formateada}`; el bloque queda entre el formulario de búsqueda y la sección de descripción de la ciudad; ningún toast con color `error` aparece; ningún elemento muestra el texto `Servicio temporalmente no disponible`.
**Evidence**: snapshot Playwright del DOM post-search; `expect(page.getByText('¡Oops!')).toBeVisible()`; `expect(page.getByText(/Nos quedamos sin carritos en .+ para el .+/)).toBeVisible()`; `expect(page.locator('[role="status"]').filter({ hasText: 'Lo sentimos, No se encontraron' })).toHaveCount(0)`.

## SCEN-002: usuario con error genérico Localiza ve toast

**Given**: usuario en cualquier ruta `/{city}/buscar-vehiculos/...`; el proxy stubbeado responde HTTP 500 con body `{"error":"out_of_schedule_pickup_date_error","message":"La fecha de recogida está fuera del horario de operación de la sede","shortText":"LLNRRE010"}`; `categoriesAdminData` poblado normalmente.
**When**: search se ejecuta y el response llega.
**Then**: visible un toast con título `Error` y descripción `La fecha de recogida está fuera del horario de operación de la sede`; el toast tiene apariencia de error (color rojo / icono de error); el bloque inline `¡Oops!` NO aparece; el bloque `Servicio temporalmente no disponible` NO aparece.
**Evidence**: `expect(page.locator('[role="status"]').filter({ hasText: 'La fecha de recogida está fuera del horario' })).toBeVisible()`; `expect(page.getByText('¡Oops!')).toHaveCount(0)`.

## SCEN-003: usuario con server_error ve bloque WhatsApp fallback

**Given**: usuario en cualquier ruta `/{city}/buscar-vehiculos/...`; el proxy stubbeado responde HTTP 500 sin body estructurado (o body con `{"error":"server_error","message":"..."}`).
**When**: search se ejecuta.
**Then**: visible el bloque que contiene el texto `Servicio temporalmente no disponible` y el botón/link de WhatsApp con el número de la marca correspondiente (alquilatucarro: 301 672 9250 | alquilame: 300 243 6677 | alquicarros: 318 770 3670); el bloque inline `¡Oops!` NO aparece; ningún toast aparece con ese mensaje.
**Evidence**: `expect(page.getByText('Servicio temporalmente no disponible')).toBeVisible()`; `expect(page.getByRole('link', { name: /WhatsApp/ })).toBeVisible()`.

## SCEN-004: store refleja admin data reactivamente tras init

**Given**: en un harness de Pinia (`@pinia/testing`), `useState('rentacar-data')` arranca con `value === null` (`useFetchRentacarData` retorna sentinel vacío); `useStoreSearchData` se instancia ANTES de que el plugin populé el state; luego `useState('rentacar-data').value` se asigna a un payload real con N≥3 categorías admin.
**When**: tras la asignación, se simula una respuesta de `/availability` que setea `error.value = { error: 'no_available_categories_error', ... }` y `categoriesAvailabilityData.value = []`.
**Then**: el computed `categories` de la store retorna un array de N elementos (uno por categoría admin) marcados como unable (`estimatedTotalAmount === 999999999`); `filteredCategories.length > 0` después de aplicar los filtros de location estándar para una ciudad de Bogotá. La store NO queda atrapada con la referencia al sentinel inicial.
**Evidence**: test Vitest con Pinia testing harness; `expect(store.categories.length).toBe(N)`; `expect(store.filteredCategories.length).toBeGreaterThan(0)`; `expect(store.categories.every(c => c.estimatedTotalAmount === 999999999)).toBe(true)`.

## SCEN-005: feedback visible aún cuando admin data queda vacío

**Given**: `useState('rentacar-data')` permanece con value que produce `categoriesAdminData = []` (sentinel persiste — caso degradado donde el plugin falló silenciosamente o la store capturó el sentinel); search retorna `error: 'no_available_categories_error'`.
**When**: la página termina de cargar y procesa el error.
**Then**: el usuario ve algún feedback visible (no silent failure). Aceptable: el bloque `¡Oops!` con el texto fallback "Nos quedamos sin carritos para esta búsqueda" (sin nombre de ciudad si no está disponible) O el bloque `Servicio temporalmente no disponible`. NO aceptable: ausencia total de feedback (la pantalla pasa directo del formulario a la sección de descripción de la ciudad).
**Evidence**: snapshot Playwright; `expect(page.getByText('¡Oops!').or(page.getByText('Servicio temporalmente no disponible'))).toBeVisible()`; el área entre el formulario y la sección de descripción contiene al menos un nodo de texto con feedback de error.

## SCEN-006: regresión guard — issue #10 reproduction case

**Given**: deploy actual de cualquier marca; usuario navega directamente a `/armenia/buscar-vehiculos/lugar-recogida/monteria-aeropuerto/lugar-devolucion/monteria-aeropuerto/fecha-recogida/2026-10-04/fecha-devolucion/2026-11-03/hora-recogida/08:00am/hora-devolucion/08:00am`; el proxy responde con `LLNRAG009` (verificable porque `AAMTR` no tiene inventario en ese rango — comportamiento real de Localiza, no stub).
**When**: la página termina de hidratar y la request a `/availability` se completa.
**Then**: visible el bloque `¡Oops! Nos quedamos sin carritos en Montería para el {fecha pickup formateada}`; el response del network panel muestra body `{"error":"no_available_categories_error","shortText":"LLNRAG009",...}` (proxy correcto); no aparece toast con el mismo mensaje (evita duplicación).
**Evidence**: e2e Playwright apuntando a deploy preview o local con stub de Localiza; `expect(page.getByText('¡Oops!')).toBeVisible({ timeout: 10000 })`; `expect(page.getByText(/Nos quedamos sin carritos en Montería/)).toBeVisible()`.

---

## Verificación cruzada — anti-reward-hacking

Estos scenarios resisten gaming porque:

- SCEN-001..003 verifican texto user-visible en DOM, no flags internas. Setear `noAvailableCategories.value = true` sin renderizar UI falla.
- SCEN-001 explícitamente verifica AUSENCIA de toast — previene el "fix" de agregar un toast adicional sin arreglar el bloque inline.
- SCEN-004 verifica el computed reactivo, no el momento de destructuring — previene el "fix" de reordenar el init sin arreglar la cadena reactiva.
- SCEN-005 acepta cualquier feedback visible — previene over-engineering del happy path mientras el caso degradado sigue silencioso.
- SCEN-006 usa la URL exacta del issue como regression guard permanente.

## Mapping a layer de test

| SCEN | Layer | Archivo sugerido |
|---|---|---|
| SCEN-001 | E2E Playwright (3 marcas) | `e2e/availability-error-feedback.spec.ts` |
| SCEN-002 | E2E Playwright | `e2e/availability-error-feedback.spec.ts` |
| SCEN-003 | E2E Playwright | `e2e/availability-error-feedback.spec.ts` |
| SCEN-004 | Vitest unit (logic) | `packages/logic/src/stores/__tests__/useStoreSearchData.adminDataReactivity.test.ts` |
| SCEN-005 | E2E Playwright | `e2e/availability-error-feedback.spec.ts` |
| SCEN-006 | E2E Playwright (regression guard) | `e2e/availability-error-feedback.spec.ts` |
