---
name: phone-field-revalidation
created_by: Pablo Diaz
created_at: 2026-07-01T00:00:00Z
issue: 276
---

# Telefono field stale validation error (issue #276)

`VueTelInput` is a third-party control that does not wire into `@nuxt/ui`'s
`UFormField` (no `useFormField`), so `UForm` never revalidates `telefono` on its
own events. Once the field-level error appears (only ever on full submit), it
goes stale: it stays even after the user corrects the number to a valid one, and
only clears on the next submit. The fix bridges revalidation via the
`usePhoneField` composable (Option A): revalidate on blur and, debounced, while
editing — so the error clears the moment the value becomes valid, exactly like a
native input.

## SCEN-276-01: corrected phone clears the error without re-submitting
**Given**: the customer-data form is open (`…/categoria/C?reservar=C`) and the
customer typed an incomplete phone (`300`) then pressed "Solicitar reserva", so
the `telefono` field shows its error (`Número de teléfono o WhatsApp no válido`).
**When**: the customer completes the phone to a valid number (`3001234567`, which
`VueTelInput` reformats to `+57 300 1234567`) and either blurs the field or stops
typing (debounce settles ~300ms).
**Then**: the `telefono` field error disappears — no second click on "Solicitar
reserva" is required.
**Evidence**: rendered DOM — the field's error text node under the `telefono`
`u-form-field` is removed / the red error state clears while still on the form
(no navigation, no re-submit).

## SCEN-276-02: a valid phone never shows the "no válido" error
**Given**: the customer-data form is open and the `telefono` field is empty (no
prior submit).
**When**: the customer types a valid number (`3001234567` → `+57 300 1234567`) and
blurs the field.
**Then**: no `telefono` error is shown at any point.
**Evidence**: rendered DOM — no error text node appears under the `telefono`
`u-form-field` after blur.

## SCEN-276-03: native fields still clear instantly (no regression)
**Given**: the customer-data form was submitted with an empty "Nombres" field, so
"Nombres" shows its required error.
**When**: the customer types a valid name and blurs.
**Then**: the "Nombres" error clears instantly — the phone fix did not alter
native `@nuxt/ui` field behavior.
**Evidence**: rendered DOM — the error node under the `nombreCompleto`
`u-form-field` is removed on blur (control/contrast case).

## SCEN-276-04: behavior is identical across the three brands
**Given**: SCEN-276-01 is satisfied on alquilatucarro.
**When**: the same reproduction runs on alquilame and alquicarros.
**Then**: the corrected phone clears the error without re-submitting on all three.
**Evidence**: the shared revalidation lives in `packages/logic` (`usePhoneField`);
each brand's `ReservationForm.vue` binds the same `@blur` handler — one logic
source, three identical bindings (verified by grep + one runtime pass per brand).

## SCEN-276-05: composable exposes the revalidation bridge (unit slice)
**Given**: `usePhoneField` is the single shared source of the phone field's
form-integration config.
**When**: a caller passes the form ref and a value getter.
**Then**: the composable returns a `validatePhoneField` handler (for `@blur`) and
sets up a debounced watch that calls `form.validate({ name: 'telefono' })` so a
corrected value revalidates without a submit.
**Evidence**: unit test (source-level, matching the existing
`usePhoneField.test.ts` convention) asserting the composable wires
`validate({ name: 'telefono' })` and `watchDebounced` over the phone value.
