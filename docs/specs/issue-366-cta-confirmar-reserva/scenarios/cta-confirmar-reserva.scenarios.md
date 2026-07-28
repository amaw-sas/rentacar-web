---
name: cta-confirmar-reserva
created_by: orchestrator
created_at: 2026-07-23T00:00:00Z
---

# CTA "Confirmar reserva" — deja de nacer deshabilitado (issue #366)

Epic #372. El CTA que cierra el embudo del wizard de alquicarros
(`packages/ui-alquicarros/app/components/wizard/WizardSummary.vue:174`) se apaga por tres
razones que en pantalla se ven igual —un botón gris— y ninguna se explica:

1. `!canAdvance` en el paso 5, que es solo la casilla de consentimiento
   (`ReservationWizard.vue:362`), al final de un formulario largo.
2. `isSubmittingForm`, durante el round-trip de registro, sin ninguna señal de progreso.
3. `formSubmitLocked`, que ante un estado desconocido del servidor
   (`useStoreReservationForm.ts:349-357`) deja el botón muerto con un toast de 25 s como
   única explicación.

La marca hermana ya resolvió el primero: `ui-alquilatucarro/CategorySelectionSection.vue:240`
gatea solo por `isSubmittingForm || formSubmitLocked`, y sin consentimiento valibot marca la
casilla y no sale ningún POST (SCEN-311-02). El wizard divergió apilando `!canAdvance`
encima de esa validación.

Diseño: `docs/specs/2026-07-23-issue-366-cta-confirmar-reserva-design.md` (commit 11a5198).

Estos escenarios viven en `e2e/alquicarros-reservation-wizard.spec.ts`: es el único spec del
wizard que el CI de esta marca ejecuta (`ci.yml:206-207`). Un spec nuevo no se ejecutaría.

---

## SCEN-366-01: el CTA nace pulsable

**Given**: el paso 5 ("Tus datos para reservar") recién cargado, con la casilla de
consentimiento sin marcar (default de #311, Ley 1581).

**When**: el usuario mira el CTA "Confirmar reserva" del resumen.

**Then**: el botón **no** tiene el atributo `disabled`.

**Evidence**: `toBeEnabled()` sobre `[data-testid="wizard-continue-desktop-test"]` en el
primer render del paso 5. No se asserta `aria-disabled`: `UButton` solo lo emite en su rama
link, y aquí renderiza un `<button>` real.

---

## SCEN-366-02: pulsar sin consentimiento explica, enfoca y no registra

**Given**: el paso 5 con nombres, apellidos, identificación, correo y teléfono válidos, y la
casilla de consentimiento sin marcar.

**When**: el usuario pulsa "Confirmar reserva".

**Then**: aparece el mensaje "Debe aceptar las políticas de privacidad" junto a la casilla,
la casilla queda dentro del viewport y con el foco, la URL no cambia, y **no se emite ningún
request** a `/api/reservations/record`.

**Evidence**: texto del error en el DOM; `boundingBox` de la casilla contra el viewport;
`toBeFocused()` sobre `[data-testid="privacy-consent-checkbox-test"]` (ese testid aterriza
en el `<button role="checkbox">` que recibe el foco); contador de requests al endpoint de
registro en 0, con el patrón de `e2e/reservation-privacy-consent.spec.ts:116-120`.

---

## SCEN-366-03: con consentimiento la reserva procede

**Given**: el estado de SCEN-366-02 con la casilla ya marcada.

**When**: el usuario pulsa "Confirmar reserva".

**Then**: la reserva se registra y navega a `/reservado/[code]`.

**Evidence**: URL final tras el submit. Regresión de SCEN-311-04, que sigue siendo cierto
y no se modifica.

---

## SCEN-366-04: el envío en vuelo se anuncia y no se duplica

**Given**: un submit válido en curso, con el stub de `/api/reservations/record` demorado
(patrón `setTimeout(700)` ya usado en este spec).

**When**: el usuario mira el CTA y lo pulsa una segunda vez.

**Then**: el botón muestra estado de carga con el label "Confirmando…", y el endpoint de
registro recibe **exactamente un** request.

**Evidence**: `toHaveText(/Confirmando/)`; presencia de
`[data-testid="wizard-continue-desktop-test"] [data-slot="leadingIcon"]` (el spinner de
`UButton`; no existe ningún `data-loading` en el DOM); `toBeDisabled()`; contador de requests
en 1. El segundo click necesita `force: true` — el botón está deshabilitado y el
actionability check de Playwright colgaría 20 s.

---

## SCEN-366-05: el estado desconocido queda explicado en pantalla

**Given**: `/api/reservations/record` stubeado con
`{"reservationStatus": "desconocido", "reserveCode": "E2ECODE"}` (200, JSON) — la forma
exacta que lleva a `routeForReservationStatus → null` y levanta `formSubmitLocked`.

**When**: el submit termina y el usuario sigue en el paso 5.

**Then**: hay un bloque `role="alert"` visible que advierte de no reenviar el formulario,
muestra el código `E2ECODE` y ofrece contacto por WhatsApp; el CTA sigue deshabilitado. El
bloque sigue visible tras volver al paso 2 sin re-buscar, y desaparece al lanzar una
búsqueda nueva (que es donde `useStoreSearchData.ts:81` limpia el lock).

**Evidence**: presencia y contenido del bloque, independiente del toast (no se esperan sus
25 s de vida); atributo `disabled` del botón; visibilidad del bloque antes y después de una
búsqueda nueva.

---

## SCEN-366-06: el contacto del wizard sigue siendo el de alquicarros

**Given**: los pasos "Vehículo" y "Datos" tras mover el contacto de WhatsApp a
`app.config`.

**When**: se inspecciona el enlace de WhatsApp de cada uno.

**Then**: apunta a `franchise.whatsapp` (que resuelve `https://wa.me/573187703670`, destino
idéntico al literal que sustituye) y ningún componente del wizard contiene un literal
`wa.me/<dígitos>`.

**Evidence**: test de nivel-fuente en `packages/ui-alquicarros/tests/contact-number.test.ts`,
misma forma que el aserto que ese archivo ya aplica a `app/error.vue`.
