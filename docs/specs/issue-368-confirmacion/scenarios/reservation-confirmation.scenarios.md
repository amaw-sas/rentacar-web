---
name: reservation-confirmation
created_by: pabloandi
created_at: 2026-07-27T00:00:00Z
---

# Confirmación de reserva (issue #368, hallazgo #1)

Diseño: `docs/specs/2026-07-27-issue-368-confirmacion-design.md` (aprobado, 4 rondas).
Plan: `docs/specs/2026-07-27-issue-368-confirmacion-plan.md` (aprobado).

El recap se congela en el submit (`lastReservationSummary`) y la confirmación lo lee
gateado por `code === URL` más completitud de nombre y total. Todo lo demás (checklist,
enlaces, copiar, retry) no depende de datos.

## SCEN-368A-01: el cliente ve exactamente lo que reservó
**Given**: `lastReservationSummary` en el store con `code` igual al `reserveCode` de la URL, y `categoryName`, `total`, fechas+horas, sedes (name/city), días, seguro y km poblados
**When**: se monta `/reservado/{code}` en estado `found`
**Then**: el recap aparece mostrando el nombre del vehículo, las fechas y horas de recogida y devolución, las sedes, los días, la etiqueta de seguro y el total — todos los valores exactos del snapshot, sin `undefined`
**Evidence**: DOM del bloque recap (`data-testid` o el contenedor `bg-white/10`) con los textos esperados

## SCEN-368A-02: sin snapshot no hay recap, pero la página sirve
**Given**: `lastReservationSummary` es `null` (refresh, cold-load o entrada directa a la URL)
**When**: se monta `/reservado/{code}` en estado `found`
**Then**: el bloque recap NO aparece (ningún `undefined` en el DOM); el código, el botón copiar, el checklist "qué llevar" y los enlaces de contacto sí aparecen
**Evidence**: DOM sin el contenedor del recap y con el checklist + enlaces presentes

## SCEN-368A-03: un código que no coincide no pinta datos ajenos
**Given**: `lastReservationSummary` presente con `code` = "AAA111" y la URL es `/reservado/BBB222` (segundo envío que sobrescribió el snapshot, o link compartido de otra reserva)
**When**: se monta la confirmación
**Then**: el recap NO aparece; no se pinta el nombre ni el total del snapshot ajeno
**Evidence**: DOM sin el contenedor del recap

## SCEN-368A-04: un snapshot a medias se oculta en vez de mostrar undefined
**Given**: `lastReservationSummary` con `code` coincidente con la URL pero `categoryName` o `total` ausentes (p.ej. `selectedCategory` era null al capturar)
**When**: se monta la confirmación
**Then**: el recap NO aparece (regla de completitud del gate); nunca hay `undefined` en el DOM; checklist y enlaces presentes
**Evidence**: DOM sin recap y sin la cadena "undefined"

## SCEN-368A-05: los enlaces de contacto son reales
**Given**: la franquicia alquicarros con `whatsapp`, `email` y `phone` en `app.config`
**When**: se monta la variante `confirmed`
**Then**: el bloque de contacto muestra un enlace de WhatsApp con `href = franchise.whatsapp`, un enlace de correo con `href = mailto:{franchise.email}` y un enlace de teléfono con `href = tel:{...}`
**Evidence**: atributos `href` de los tres anclas en el DOM

## SCEN-368A-06: copiar el código funciona y lo dice
**Given**: la variante `confirmed` con un `reserveCode` y `navigator.clipboard.writeText` disponible (mockeado)
**When**: el usuario pulsa el botón de copiar
**Then**: se escribe el código en el portapapeles y aparece un anuncio accesible "Código copiado"
**Evidence**: la llamada a `writeText` con el código + el texto de anuncio en el DOM (`aria-live`/`role="status"`)

## SCEN-368A-07: sin clipboard el botón no rompe
**Given**: la variante `confirmed` donde `navigator.clipboard` no existe o `writeText` rechaza
**When**: el usuario pulsa el botón de copiar
**Then**: no se lanza ninguna excepción; el código sigue visible y seleccionable
**Evidence**: ausencia de excepción no capturada + el código presente en el DOM

## SCEN-368A-08: el estado "verificando" ofrece una salida
**Given**: la confirmación en estado `unavailable`
**When**: se monta la página
**Then**: además del mensaje, aparecen un botón/acción de reintento y los enlaces de contacto; el contenedor conserva `role="status"`
**Evidence**: DOM con la acción de reintento, los enlaces de contacto y `role="status"`

## SCEN-368A-09: los textos nuevos cumplen contraste AA
**Given**: la variante `confirmed` renderizada sobre el fondo oscuro de marca
**When**: se miden los colores efectivos de los textos nuevos (recap, checklist, enlaces)
**Then**: cada uno tiene contraste ≥ 4.5:1 contra su fondo
**Evidence**: ratio de contraste calculado en canvas (Tailwind 4 emite oklch)

## SCEN-368A-10: el submit congela el snapshot correcto (end-to-end obligatorio)
**Given**: los stores reales con `useStoreSearchData().selectedCategory` poblado con una instancia real de `useCategory` (no sembrada ni stubeada) y el form completo
**When**: se maneja el `submitForm` REAL y la respuesta enruta a `/reservado/{reserveCode}`
**Then**: `lastReservationSummary.code === dataRecord.reserveCode`, `categoryName === selectedCategory.categoryDescription` y `total === selectedCategory.currencyTotalToPayWithAdditionals` (ambos leídos SIN `.value`), y el snapshot se congeló antes del `navigateTo`
**Evidence**: el objeto `lastReservationSummary` tras el submit; el test falla si se añade `.value` a los campos cross-store (oracle independiente)
