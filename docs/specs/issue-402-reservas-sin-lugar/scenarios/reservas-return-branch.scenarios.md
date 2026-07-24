---
name: reservas-return-branch
created_by: orchestrator
created_at: 2026-07-24T00:00:00Z
---

# Sede de devolución en la superficie query de `/reservas` — Issue #402

Holdout de aceptación. Origen: `docs/specs/2026-07-23-reservas-query-return-branch-design.md`
(§Escenarios observables). Contrato write-once: ningún escenario se debilita para que el código pase.

**Regla que estos escenarios fijan.** Un enlace `/reservas?…` sin `lugar_devolucion` debe cotizar
igual, devolviendo el coche donde se recogió. Un `lugar_devolucion` que no resuelve contra las sedes
debe hacer lo mismo **y decírselo al usuario**. Ausente ≠ inválido: lo primero es un enlace legítimo
y corto, lo segundo es un enlace roto que el usuario merece ver.

**Sedes de referencia** (fixture, forma real de `useStoreAdminData().sortedBranches`):

| slug | code | ciudad |
|---|---|---|
| `bogota-aeropuerto` | `AABOT` | bogota |
| `medellin-centro` | `AAMDE` | medellin |
| `sede-que-no-existe` | — | no está en el store |

---

## SCEN-402-01: enlace sin sede de devolución cotiza igual

**Given**: el store de sedes tiene `bogota-aeropuerto` → `AABOT`.
**When**: el usuario abre `/reservas?lugar_recogida=bogota-aeropuerto&fecha_recogida=2026-09-15&fecha_devolucion=2026-09-18&hora_recogida=10:00&hora_devolucion=10:00`.
**Then**: sale una búsqueda con `returnLocation` = `AABOT`. La reserva no muere en
`missing_parameters`. El usuario no ve ningún aviso: el enlace era legítimo, no roto. Tampoco ve
«Tarifa adicional por traslado», que hoy aparece por comparar `null` contra `AABOT`.
**Evidence**: `lugarDevolucion` del store = `'AABOT'`; `doSearch` invocada 1 vez; 0 llamadas a
`createMessage`.
**Artefacto**: mount test de alquicarros (Step 3) + runtime en navegador (Step 5, payload del POST a
`/api/reservations/availability`).
**Fila de la tabla de verdad**: 1.

---

## SCEN-402-02: sede de devolución inventada cotiza y avisa

**Given**: el store tiene `bogota-aeropuerto` → `AABOT`; `sede-que-no-existe` no resuelve.
**When**: el usuario abre el mismo enlace con `&lugar_devolucion=sede-que-no-existe`.
**Then**: la búsqueda sale igual, con `returnLocation` = `AABOT` — el usuario cotiza en vez de
chocar contra un error. Y ve el aviso «Sede de devolución no reconocida / No encontramos esa sede de
devolución; ajustamos la entrega a la sede de recogida.», que **sigue en pantalla después** de que la
búsqueda arranque. Un aviso que se emite y desaparece en el mismo tick no informa a nadie.
**Evidence**: `lugarDevolucion` = `'AABOT'`; exactamente 1 `createMessage` con ese título; en
runtime, el nodo del toast presente en el DOM una vez completada la petición.
**Artefacto**: mount test de alquicarros (Step 3) + runtime en navegador (Step 5, nodo del toast).
**Fila de la tabla de verdad**: 3.

---

## SCEN-402-03: el one-way legítimo no se toca

**Given**: el store tiene `bogota-aeropuerto` → `AABOT` y `medellin-centro` → `AAMDE`.
**When**: el usuario abre el enlace con `&lugar_devolucion=medellin-centro`.
**Then**: `returnLocation` = `AAMDE`. Sin aviso: no hubo corrección. El usuario que planeó recoger en
Bogotá y entregar en Medellín obtiene exactamente eso, con su tarifa de traslado real.
**Evidence**: `lugarDevolucion` = `'AAMDE'`; 0 llamadas a `createMessage`.
**Artefacto**: mount test de alquicarros (Step 3).
**Fila de la tabla de verdad**: 2. *Este es el escenario que impide que el arreglo convierta
one-way en round-trip.*

---

## SCEN-402-04: recogida irresoluble, un solo mensaje

**Given**: el store de sedes está vacío, o `lugar_recogida` no resuelve.
**When**: el usuario abre `/reservas?lugar_recogida=sede-que-no-existe&fecha_recogida=2026-09-15&fecha_devolucion=2026-09-18`, sin `lugar_devolucion`.
**Then**: el usuario ve **un** mensaje, el que ya existe hoy: «Enlace de búsqueda incompleto». No
aparece ningún aviso de corrección de devolución. Dos mensajes que dicen cosas distintas sobre el
mismo enlace roto confunden más que uno.
**Evidence**: 0 llamadas a `createMessage` con el título de corrección.
**Artefacto**: mount test de alquicarros (Step 3).
**Fila de la tabla de verdad**: 1 con `pickupCode` nulo.

---

## SCEN-402-05: recogida irresoluble y devolución inválida, sigue siendo un solo mensaje

**Given**: `sortedBranches` vacío — el caso real de un montaje antes de que carguen las sedes.
**When**: el usuario abre el enlace con `lugar_recogida=sede-que-no-existe&lugar_devolucion=tampoco-existe`.
**Then**: idéntico a SCEN-402-04: un solo mensaje, el de enlace incompleto. Sin sede de recogida a la
que caer, no hay corrección que anunciar, así que `corrected` es falso y no se emite aviso espurio.
**Evidence**: 0 llamadas a `createMessage` con el título de corrección.
**Artefacto**: mount test de alquicarros (Step 3).
**Fila de la tabla de verdad**: 4.

---

## SCEN-402-06: volver al buscador no borra la categoría elegida *(solo alquicarros)*

**Given**: hay una búsqueda viva en Pinia, originada por un enlace sin `lugar_devolucion`, y el
usuario ya eligió una categoría.
**When**: el shell remonta con la misma query — por ejemplo al volver de `/chat`.
**Then**: no se dispara búsqueda nueva y la categoría del usuario sobrevive. Tampoco se emite aviso:
no se corrigió nada en este montaje, y repetir un aviso al volver de otra pantalla es ruido.
**Evidence**: `canReuseExistingSearch` true; `doSearch` NO invocada; 0 `createMessage`.
**Artefacto**: mount test de alquicarros (Step 3).
**Nota**: alquilame no tiene esta rama; su composable no guarda firma de reuse.

---

## SCEN-402-07: si la búsqueda no arranca, el aviso de sede no aparece

**Given**: `lugar_devolucion` inválido **y** `fecha_recogida` en el pasado (`2026-01-10`).
**When**: el usuario abre ese enlace.
**Then**: `doSearch` sale por su guard de fecha sin buscar. El usuario ve «Revisa la fecha de
recogida» y **nada más**. El aviso de sede se calla: hablarle de la devolución cuando su fecha de
recogida ya pasó le da dos problemas donde tiene uno, y el segundo no lo puede accionar todavía.
**Evidence**: `doSearch` devuelve `false`; 0 `createMessage` con el título de corrección.
**Artefacto**: unit de `doSearch` (Step 2, el retorno `false`) + mount test de alquicarros (Step 3,
que el aviso dependa de ese retorno).

---

## SCEN-402-08: alquilame se comporta igual

**Given / When**: los enlaces de SCEN-402-01 a 402-05 y 402-07, sobre `/reservas` de alquilame.
**Then**: mismo comportamiento observable que en alquicarros, escenario por escenario. Las dos marcas
divergen en el archivo, no en lo que el usuario vive.
**Evidence**: mismas aserciones que sus escenarios espejo, ejecutadas contra el composable de
alquilame.
**Artefacto**: mount test de alquilame (Step 4). Sin caso de reuse: esa rama no existe ahí.

---

## Cobertura de la tabla de verdad del helper

| Fila | Condición | Escenario |
|---|---|---|
| 1 | slug ausente | SCEN-402-01; y con `pickupCode` nulo, SCEN-402-04 |
| 2 | slug presente y resuelve | SCEN-402-03 |
| 3 | slug presente, no resuelve, hay recogida | SCEN-402-02 |
| 4 | slug presente, no resuelve, sin recogida | SCEN-402-05 |

La cadena vacía en `returnCode` (fila 2 que cae a fila 3 por veracidad) se cubre en el unitario del
helper (Step 1). No tiene escenario de UI propio porque exige una fila de sede mal configurada en el
backend, que no es un estado que el usuario pueda provocar desde un enlace.

## Invariante transversal

**Ningún `createMessage` precede a `doSearch()`.** `doSearch` abre con `flushMessages()` →
`toast.clear()` (`useSearch.ts:117-118`): un aviso emitido antes muere microsegundos después. La
invariante se afirma sobre *todos* los mensajes, no solo el de corrección, para que cubra avisos
futuros que alguien añada a este composable.
**Evidence**: registro compartido de llamadas en el mount test; el índice del primer `createMessage`
es posterior al de `doSearch`.
