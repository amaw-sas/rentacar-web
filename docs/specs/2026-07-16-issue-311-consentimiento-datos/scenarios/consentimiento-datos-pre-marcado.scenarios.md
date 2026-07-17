---
name: consentimiento-datos-pre-marcado
created_by: claude
created_at: 2026-07-16T00:00:00Z
---

# Issue #311 — Casilla de tratamiento de datos pre-marcada (Ley 1581)

La casilla "He leído y estoy de acuerdo con los términos… y la política de
privacidad" viene marcada por defecto en las 3 marcas (consentimiento por
omisión). Ley 1581/2012 (habeas data, Colombia) exige consentimiento **previo,
expreso e informado**: el usuario debe realizar la acción afirmativa de marcar.

Fuente única del default: `packages/logic/src/stores/useStoreReservationForm.ts`
(`politicaPrivacidad`), compartida por las 3 marcas — el fix en el store cubre
alquilatucarro, alquicarros y alquilame simultáneamente. La validación valibot
(`userInformationForm.ts`) ya exige `v.value(true, "Debe aceptar las políticas
de privacidad")`, así que el submit sin marcar queda bloqueado con mensaje.

## SCEN-311-01: la casilla aparece SIN marcar al abrir el formulario

**Given**: un usuario nuevo llega al paso de datos de la reserva
(alquilatucarro: modal del grid vía deep-link `/categoria/C?reservar=C`;
alquicarros: Paso 5 "Tus datos para reservar" del wizard)
**When**: el formulario se renderiza por primera vez, sin interacción del usuario
**Then**: el checkbox de política de privacidad está desmarcado
(`aria-checked="false"` / estado unchecked)
**Evidence**: estado ARIA del checkbox en el DOM (Playwright `not.toBeChecked()`),
en ambas superficies. Cobertura alquilame: mismo store compartido — guarda
fuente-level en `packages/logic` (default `false` en el ref del store).

## SCEN-311-02: submit del grid sin consentimiento → bloqueado con mensaje

**Given**: formulario de alquilatucarro abierto con todos los campos personales
válidos (Pablo / Díaz / Cédula 1020304050 / +57 300 123 4567 /
pablo@example.com) y la casilla SIN marcar
**When**: el usuario pulsa "Solicitar reserva"
**Then**: aparece el mensaje "Debe aceptar las políticas de privacidad", NO se
navega a `/reservado/...` y NO se emite POST al endpoint de registro de reserva
**Evidence**: texto del error visible en el DOM; URL sin cambio; ausencia de
request de registro de reserva en la red durante el intento.

## SCEN-311-03: wizard alquicarros — CTA "Confirmar reserva" exige consentimiento

**Given**: usuario en el Paso 5 del wizard con el formulario completo y válido
pero la casilla SIN marcar
**When**: observa el CTA "Confirmar reserva" del resumen
**Then**: el CTA está deshabilitado; al marcar la casilla el CTA se habilita
**Evidence**: atributo `disabled` del botón del sidebar antes/después de marcar
(Playwright `toBeDisabled()` / `toBeEnabled()`).

## SCEN-311-04: consentimiento expreso → la reserva procede (regresión)

**Given**: Paso 5 del wizard completo y válido, el usuario marca la casilla
**When**: pulsa "Confirmar reserva"
**Then**: la reserva se registra y navega a `/reservado/E2ECODE`
**Evidence**: URL final del navegador en el spec e2e del wizard (los specs
existentes que dependían del pre-marcado ahora marcan la casilla explícitamente,
imitando al usuario real).
