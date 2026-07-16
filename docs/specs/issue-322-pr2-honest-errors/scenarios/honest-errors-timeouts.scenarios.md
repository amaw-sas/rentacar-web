---
name: honest-errors-timeouts
created_by: agent
created_at: 2026-07-16T13:50:00Z
issue: 322
pr_package: 2
---

# Issue 322 · PR2 — Errores honestos, timeouts y anti-doble-envío

Holdout para el submit de reserva y las peticiones de disponibilidad/record.
Base: hallazgos bloque B del issue madre #322.

## Contexto

Hoy **cualquier** fallo en `submitForm` (5xx, timeout, red, 429) hace
`navigateTo('/sindisponibilidad')` tras limpiar la URL. El cliente cree que no
hay stock aunque la reserva **pudo crearse** o el fallo fue técnico.

Si el admin responde 200 con un `reservationStatus` desconocido, `routeForReservationStatus`
devuelve `null` y el formulario se queda quieto: el usuario reenvía → posible
doble reserva.

Las peticiones de disponibilidad y record no tienen `timeout` ni AbortController
(salvo rutas que no mueven dinero).

---

## SCEN-322-E01 — Fallo técnico al grabar NO va a /sindisponibilidad

**Given** el usuario completa el formulario y pulsa enviar
**When** el `POST /api/reservations/record` falla con 500 / 504 / 429 / red / timeout
**Then** permanece en el formulario (no navega a `/sindisponibilidad`)
**And** ve un toast reintentable del tipo «No pudimos confirmar tu reserva…»
**And** el estado del formulario (datos, categoría, cobertura) se conserva
**And** puede reintentar (el botón de envío se re-habilita)

**Evidence**: no hay navegación a `/sindisponibilidad`; toast; `isSubmittingForm === false`.

## SCEN-322-E02 — Solo sin disponibilidad de negocio va a /sindisponibilidad

**Given** el usuario envía el formulario
**When** el backend indica sin stock de negocio (`reservationStatus` /
cuerpo `sin_disponibilidad` / 409–410 de negocio)
**Then** navega a `/sindisponibilidad`
**And** limpia la URL de `/categoria` y `?reservar` antes de navegar

**Evidence**: `navigateTo({ path: '/sindisponibilidad' })` solo en esa rama.

## SCEN-322-E03 — Estado desconocido con posible código bloquea reenvío

**Given** el `POST /record` responde 200 con un `reservationStatus` que no mapea
a ruta (o sin estado)
**When** `routeForReservationStatus` devuelve `null`
**Then** se muestra un toast explícito (incluye `reserveCode` si vino)
**And** NO se navega
**And** un nuevo submit queda bloqueado (formulario consumido) para no duplicar

**Evidence**: toast + flag de lock; segundo submit no-op.

## SCEN-322-E04 — Timeout en disponibilidad se mapea a connection_timeout

**Given** la búsqueda de disponibilidad
**When** el `$fetch` supera el timeout (p. ej. 15 s) o se aborta
**Then** el error expuesto es `connection_timeout` (o `server_error` amigable)
**And** el toast usa la copia de infraestructura, no un string técnico crudo

**Evidence**: `mapAvailabilityFetchError` + toast; `timeout` en el `$fetch` cliente y proxy.

## SCEN-322-E05 — Timeout en record no se trata como sin stock

**Given** el envío de la reserva
**When** el `$fetch` de record hace timeout
**Then** se comporta como SCEN-322-E01 (toast técnico, se queda en el form)
**And** el proxy de record también tiene timeout explícito

**Evidence**: timeout en cliente + `record.post.ts` de las 3 marcas.

## SCEN-322-E06 — search() descarta respuestas fuera de secuencia

**Given** el usuario dispara dos búsquedas seguidas (cambia fechas rápido)
**When** la respuesta de la primera llega después de la segunda
**Then** no se escribe `categoriesAvailabilityData` / `error` / `pending` de la primera
**And** `pending` refleja la búsqueda vigente

**Evidence**: contador de generación en `useStoreSearchData.search`.
