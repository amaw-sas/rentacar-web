---
name: mx-phone-legacy-prefix
created_by: pablo
created_at: 2026-07-06T00:00:00Z
---

# Mexican mobile legacy "1" prefix — accept & normalize

Context: WhatsApp shows Mexican mobiles with a legacy `1` after the country code
(`+52 1 …`). That `1` was the operator prefix required to reach MX mobiles before
Mexico abolished it nationally in 2019. E.164 (and `libphonenumber-js`) now treats
`+521XXXXXXXXXX` (11 digits) as INVALID — the canonical form is `+52XXXXXXXXXX`
(10 digits). Operators copy the number verbatim from the client's WhatsApp, so the
reservation form rejects a real, reachable number.

Root fix: a pure `normalizePhoneNumber()` helper strips the legacy MX `1` ONLY when
the resulting `+52` + 10-digit number is itself valid. Validation accepts the
normalized value; the reservation record persists the normalized value.

## SCEN-001: operator pastes the WhatsApp-copied MX mobile → form accepts it
**Given**: the reservation form, otherwise valid (name, CC, email, policy accepted)
**When**: the operator enters `+52 1 81 8169 5428` (copied verbatim from WhatsApp) as `telefono`
**Then**: `UserInformationFormValidationSchema` parse succeeds — no "Número de teléfono o WhatsApp no válido" error
**Evidence**: `v.safeParse(UserInformationFormValidationSchema, {…, telefono: '+52 1 81 8169 5428'}).success === true`

## SCEN-002: the persisted phone drops the legacy 1 → canonical E.164
**Given**: `telefono` holds `+52 1 81 8169 5428` (or the compact `+5218181695428`)
**When**: the reservation is recorded (the value that goes to `phone` in the admin payload)
**Then**: the number sent downstream is `+528181695428` — no legacy 1, valid E.164, so Localiza does not reject it later
**Evidence**: `normalizePhoneNumber('+52 1 81 8169 5428') === '+528181695428'` and `isValidPhoneNumber(result) === true`

## SCEN-003: a modern MX mobile (no legacy 1) stays valid and unchanged
**Given**: `telefono` holds `+52 81 8169 5428` (already E.164-correct)
**When**: it is validated and normalized
**Then**: validation passes and the value is not rewritten to something else
**Evidence**: `normalizePhoneNumber('+52 81 8169 5428')` yields a value where `isValidPhoneNumber` is `true` and digits equal `+528181695428`; `v.safeParse(schema, {…, telefono}).success === true`

## SCEN-004: a Colombian number (existing happy path) is untouched
**Given**: `telefono` holds `+573001234567` (the current working format)
**When**: it is validated and normalized
**Then**: validation still passes and the value is returned byte-for-byte unchanged (no MX rule fires)
**Evidence**: `normalizePhoneNumber('+573001234567') === '+573001234567'` and `v.safeParse(schema, {…, telefono: '+573001234567'}).success === true`

## SCEN-005: a bogus number that only looks like the legacy form stays rejected
**Given**: `telefono` holds `+52 1 55 5` — starts `+521` but is NOT a valid 10-digit MX mobile after stripping
**When**: it is validated
**Then**: validation still FAILS (the normalizer must not over-strip and turn junk into a false pass)
**Evidence**: `v.safeParse(UserInformationFormValidationSchema, {…, telefono: '+52 1 55 5'}).success === false`
