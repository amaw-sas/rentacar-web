---
name: identification-validation
created_by: pablo
created_at: 2026-06-09T00:00:00Z
issue: 44
---

# Issue #44 — Identification field rejects sentinel values and enforces format by type

The reservation form accepted trivial sentinels (`123456`, `000000`, …) and
arbitrary strings as `identificacion`. Combined with a backend `findOrCreateCustomer`
bug (mutates the customer record on CC collision), one user typing `123456` could
hijack any active customer sharing that CC. This is the **frontend defense-in-depth**:
strengthen `identificacion` based on the sibling `tipoIdentificacion`.

The UI offers only two document types — **Cédula de Ciudadanía** (`"Cedula Ciudadania"`)
and **Pasaporte** (`"Pasaporte"`). Cédula de Extranjería is no longer offered.

The logic lives in a single pure function `identificationError(tipo, id)` reused by
the four composed schemas (`UserInformationForm`, `UserInformationWithFlightForm`,
`ReservationForm`, `ReservationWithFlightForm`). The cross-field rule is wired as a
forwarded `partialCheck` so the inline error lands on the `identificacion` field.

## SCEN-001: valid CC passes
**Given**: `tipoIdentificacion = "Cedula Ciudadania"`, `identificacion = "1020304050"`
(10 digits)
**When**: the form is validated
**Then**: validation succeeds, no issue on `identificacion`
**Evidence**: `identificationError("Cedula Ciudadania", "1020304050") === null`

## SCEN-002: valid passport passes (including real lowercase passports)
**Given**: `tipoIdentificacion = "Pasaporte"`, `identificacion` ∈ `{"AB123456", "a13676498"}`
(the incident's real passport was `a13676498`)
**When**: the form is validated
**Then**: validation succeeds
**Evidence**: `identificationError("Pasaporte", "AB123456") === null` and
`identificationError("Pasaporte", "a13676498") === null`

## SCEN-003: sentinel `123456` for CC is blocked with an inline error
**Given**: `tipoIdentificacion = "Cedula Ciudadania"`, `identificacion = "123456"`
**When**: the form is validated
**Then**: validation fails; the issue path is `["identificacion"]`; submit is blocked
**Evidence**: `safeParse(...).success === false` and the issue path key is
`identificacion`

## SCEN-004: every blocklisted sentinel is rejected, for any offered type
**Given**: each value in the blocklist `{123456, 1234567, 12345678, 123456789,
1234567890, 000000, 0000000, 00000000, 111111, 999999, 9999999, 99999999,
999999999, 9999999999}` under both `"Cedula Ciudadania"` and `"Pasaporte"`
**When**: validated
**Then**: every one fails
**Evidence**: `identificationError(type, value) !== null` for all (type, value) pairs

## SCEN-005: CC format rejects non-digits and out-of-range lengths
**Given**: `tipoIdentificacion = "Cedula Ciudadania"` with
`identificacion` ∈ `{"12ab567" (letters), "123456" (6 digits, too short),
"1234567890123" (13 digits, too long)}`
**When**: validated
**Then**: each fails with the CC message
**Evidence**: `identificationError("Cedula Ciudadania", v) === "La cédula debe tener solo números (7 a 12 dígitos)"`
(except `"123456"`, which is also blocklisted and may fail on the blocklist message)

## SCEN-006: passport format rejects symbols and out-of-range lengths
**Given**: `tipoIdentificacion = "Pasaporte"` with `identificacion` ∈
`{"AB12" (4 chars, too short), "AB-1234" (symbol), "ABCDEFGHIJ1234567" (17 chars, too long)}`
**When**: validated
**Then**: each fails with the passport message
**Evidence**: `identificationError("Pasaporte", v) === "El pasaporte debe tener entre 6 y 15 caracteres (letras y números)"`

## SCEN-007: same behavior across all three franchise apps
**Given**: the three brand `ReservationForm.vue` components bind `:schema` to
`ReservationFormValidationSchema` / `ReservationWithFlightFormValidationSchema`
imported from `@rentacar-main/logic`
**When**: the shared schema is hardened
**Then**: alquilame, alquilatucarro and alquicarros all enforce the rules with no
per-brand code change
**Evidence**: `grep` shows all three import the same schemas; no brand overrides
`identificacion` validation

## SCEN-008: leading/trailing whitespace is tolerated, not a bypass
**Given**: `tipoIdentificacion = "Cedula Ciudadania"`, `identificacion = "  1020304050  "`
**When**: validated
**Then**: passes (trimmed before format check); but `"  123456  "` still fails
(trimmed value is blocklisted)
**Evidence**: `identificationError("Cedula Ciudadania", "  1020304050  ") === null`
and `identificationError("Cedula Ciudadania", "  123456  ") !== null`
