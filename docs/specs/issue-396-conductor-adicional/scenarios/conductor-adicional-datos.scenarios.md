---
name: conductor-adicional-datos
created_by: orchestrator
created_at: 2026-07-28T08:30:00Z
issue: rentacar-web#396
design: docs/specs/2026-07-27-issue396-conductor-adicional-datos-design.md
---

# Conductor adicional: nombre y cédula (#396)

Holdout de los 8 escenarios aprobados en el diseño. Contrato de campos:
`extra_driver_name` + `extra_driver_document`, ambos string, en el body que la web envía al
dashboard.

## SCEN-396-01: los campos aparecen al contratar el adicional

**Given**: una categoría cuya tarifa incluye conductor adicional (`selectedCategory.withExtraDriver === true`)
**When**: el usuario llega al paso de datos del formulario de reserva
**Then**: se renderizan dos campos etiquetados «Nombre del conductor adicional» y «Cédula o documento
del conductor adicional», más la nota de tratamiento de datos del tercero. Sin el flag, ninguno de los
tres elementos existe en el DOM
**Evidence**: DOM del componente montado — presencia/ausencia de `[data-testid="extra-driver-name"]`,
`[data-testid="extra-driver-document"]` y el texto de la nota

## SCEN-396-02: nombre vacío bloquea la confirmación

**Given**: el adicional contratado y el campo de nombre vacío (o solo espacios), con el resto del
formulario correcto
**When**: el usuario intenta confirmar la reserva
**Then**: la validación falla con un issue cuyo `path` apunta a `conductorAdicionalNombre`, el mensaje
se pinta al lado de ese campo y no sale ningún POST
**Evidence**: `safeParse(...).success === false` y `issues[].path[0].key === 'conductorAdicionalNombre'`;
en runtime, cero peticiones a `/api/reservations/record` en el panel de red

## SCEN-396-03: la cédula centinela se rechaza

**Given**: el adicional contratado y el documento `123456`
**When**: el usuario intenta confirmar
**Then**: la validación falla con el mensaje de identificación real (el mismo criterio que
`SENTINEL_BLOCKLIST` aplica al titular), apuntando a `conductorAdicionalIdentificacion`
**Evidence**: `safeParse(...).success === false`; el `issues[].message` contiene el texto de centinela,
no el de formato

## SCEN-396-04: el pasaporte se acepta

**Given**: el adicional contratado, nombre `Ana Pérez` y documento `AB123456`
**When**: el usuario confirma
**Then**: la validación pasa — el campo acepta alfanumérico de 6 a 15 caracteres, no solo dígitos.
`12345` (corto) y `ABCDEFGHIJKLMNOP` (largo) sí fallan, con el mensaje de formato
**Evidence**: `safeParse(...).success === true` para `AB123456`; `false` con mensaje de formato para
los dos casos de borde

## SCEN-396-05: el body lleva los datos, sin espacios sobrantes

**Given**: el adicional contratado, nombre `"  Ana Pérez  "` y documento `"  1020304050  "`
**When**: el usuario confirma
**Then**: el body del POST incluye `extra_driver_name: "Ana Pérez"` y
`extra_driver_document: "1020304050"`
**Evidence**: objeto pasado a `$fetch`/`useFetch` en `useRecordReservationForm`; en runtime, el
request payload de `POST /api/reservations/record`

## SCEN-396-06: desmarcar el adicional borra las claves del body

**Given**: el usuario marcó el adicional, llenó ambos campos, y luego volvió atrás y lo desmarcó
**When**: confirma la reserva
**Then**: el body no contiene `extra_driver_name` ni `extra_driver_document` — las claves no existen,
no van vacías
**Evidence**: `'extra_driver_name' in body === false` y `'extra_driver_document' in body === false`

## SCEN-396-07: sin adicional, nada cambia (regresión de la trampa `null`)

**Given**: un usuario que nunca marca el adicional, con los refs del store en su valor inicial `null`
**When**: confirma la reserva
**Then**: el formulario valida y envía. El body tiene exactamente el mismo conjunto de claves que
antes de este cambio
**Evidence**: `safeParse` del formulario completo devuelve `success: true` con los tres campos nuevos
en `null`; `Object.keys(body)` idéntico al conjunto previo

## SCEN-396-08: los siete anteriores valen en las tres marcas

**Given**: `ui-alquilatucarro`, `ui-alquilame` y `ui-alquicarros`
**When**: se recorre cualquiera de los escenarios anteriores en cualquiera de las tres
**Then**: el comportamiento es el mismo. En particular, el espejo del flag existe en el `baseForm` de
las tres: si falta en una, esa marca aceptaría un conductor adicional sin datos y el fallo sería mudo
**Evidence**: test de contrato de fuente por marca sobre `ReservationForm.vue` — el espejo
`conductorAdicional` está en `baseForm` y los campos viven bajo el `v-if`
