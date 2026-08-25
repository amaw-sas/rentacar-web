---
name: reset-post-reserva
created_by: pabloandi
created_at: 2026-08-25T00:00:00Z
---

# El Atrás desde la página de gracias deja el formulario con el cliente anterior

Issue: https://github.com/amaw-sas/rentacar-web/issues/472

El operador envía una reserva, cae en `/reservado/<código>` o `/pendiente`, y pulsa Atrás
para atender al siguiente cliente. Se encuentra los datos del anterior en el formulario y
el botón de envío girando en «Confirmando…» para siempre.

## Lo medido

Recorrido real en alquicarros el 2026-08-25, con la reserva interceptada en el navegador
para no escribir en producción. Estado del store justo después del Atrás:

```json
{ "nombre": "ClienteA", "ident": "1020304050", "tel": "+57 300 1234567",
  "email": "clientea@example.com", "consent": true, "isSubmitting": true }
```

Y el CTA, ya en el Paso 2:

```json
{ "paso": "Elige tu vehículo", "cta": "Confirmando…", "disabled": true, "spinner": true }
```

Volver a elegir vehículo no lo revive. Recargar sí. Es estado en memoria de Pinia.

## Lo que NO es: la máquina de pasos del wizard

La primera lectura fue que el wizard de alquicarros se quedaba atascado en un paso.
No es eso. `useReservationWizard.ts:293-300` crea la máquina en cada setup derivando el
paso del route, así que al volver nace limpia. El stepper lo confirmaba y no lo leí bien:
marcaba `maxReached = 2`. El Paso 2 es el estado correcto — la URL sigue siendo la de la
búsqueda. Lo único sucio es el store.

## Lo que sí es

`useStoreReservationForm.submitForm` pone `releaseSubmit = false` antes de navegar, para
que un segundo clic no dispare otro POST. El `finally` solo libera la bandera dentro de
`if (releaseSubmit)`. Nadie la vuelve a bajar, y Atrás no reconstruye Pinia.

Los campos personales no se limpian en ningún punto del ciclo.

## SCEN-001: el siguiente cliente empieza con el formulario vacío
**Given**: un operador que acaba de reservar para un cliente y está en `/reservado/<código>`
**When**: pulsa Atrás del navegador y llega al Paso 5 del wizard
**Then**: nombre, apellidos, tipo y número de documento, teléfono y correo están vacíos
**Evidence**: `useNuxtApp().$pinia.state.value.reservationForm` con `nombreCompleto`,
`apellidos`, `tipoIdentificacion`, `identificacion`, `telefono` y `email` en `null`; los
inputs del Paso 5 con `value === ''`

## SCEN-002: el consentimiento de habeas data no se hereda
**Given**: el cliente anterior aceptó el tratamiento de datos
**When**: el operador vuelve con Atrás para atender al siguiente
**Then**: la casilla aparece SIN marcar, y el envío queda bloqueado hasta que el nuevo
cliente la marque
**Evidence**: `politicaPrivacidad === false` en el store y
`[data-testid="privacy-consent-checkbox-test"]` con `aria-checked="false"`

## SCEN-003: el botón de envío responde
**Given**: el operador vuelve con Atrás tras una reserva confirmada
**When**: mira el CTA del resumen
**Then**: dice «Continuar» (o «Confirmar reserva» en el Paso 5), sin spinner, y responde
al clic
**Evidence**: `[data-testid="wizard-continue-desktop-test"]` con `disabled === false`, sin
descendiente `animate-spin`, y texto distinto de «Confirmando…»

## SCEN-004: la búsqueda sobrevive
**Given**: el operador buscó Bogotá Aeropuerto, del 26 de agosto al 2 de septiembre
**When**: vuelve con Atrás tras reservar
**Then**: sigue viendo esa misma búsqueda — sedes, fechas y horas intactas. No re-teclea
lo que no cambió
**Evidence**: `lugarRecogida`, `lugarDevolucion`, `fechaRecogida`, `fechaDevolucion`,
`horaRecogida` y `horaDevolucion` sin cambios respecto al momento del envío

## SCEN-005: la confirmación sigue mostrando lo que se reservó
**Given**: un operador que acaba de reservar la Gama C con Seguro Total
**When**: la página de confirmación termina de montar
**Then**: el recap sigue en pantalla con la gama, el total y las fechas de ESA reserva
**Evidence**: `lastReservationSummary` intacto tras el reset, y el bloque de recap visible
en `/reservado/<código>` con el nombre de la gama y el total

## SCEN-006: el seguro del cliente anterior no le cambia el precio al siguiente
**Given**: el cliente anterior contrató Seguro Total
**When**: el operador empieza la reserva del siguiente
**Then**: el nuevo arranca sin Seguro Total preseleccionado, y el resumen no le cobra esa
cobertura hasta que la elija
**Evidence**: `haveTotalInsurance === false` en el store, y el Paso 3 sin la opción de
cobertura total marcada

## SCEN-007: sin disponibilidad no le borra los datos al mismo cliente
**Given**: un cliente cuyo vehículo salió agotado y cayó en `/sindisponibilidad`
**When**: vuelve al buscador para probar otras fechas
**Then**: el CTA de reserva responde, y sus datos personales siguen puestos — es el mismo
cliente, no debería re-teclearlos
**Evidence**: `isSubmittingForm === false` y `formSubmitLocked === false`, con
`nombreCompleto`, `identificacion`, `telefono` y `email` conservados

## SCEN-008: hay una salida visible desde la página de gracias
**Given**: un operador en `/reservado/<código>` o en `/pendiente`
**When**: busca cómo empezar la siguiente reserva
**Then**: encuentra un enlace «Hacer otra reserva» que lo lleva al buscador de SU marca —
`/reservas` en alquicarros y alquilame, `/` en alquilatucarro, que no tiene `/reservas` —
y el formulario que se encuentra allí está limpio
**Evidence**: el enlace presente en las seis páginas terminales con el `to` correcto por
marca; tras seguirlo, el store sin datos de identidad
