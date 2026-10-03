---
name: selector-licencia-conduccion
created_by: orchestrator
created_at: 2026-10-03T00:00:00Z
---

# Selector obligatorio de licencia de conducción + aviso de documento al recoger

Applies to the reservation form of all three brands (alquilame, alquilatucarro,
alquicarros). The license question is UI-only: it never reaches the reservation
payload. The registration document (Cédula/Pasaporte) stays decoupled from the
pickup document the notice announces.

## SCEN-LIC-01: question starts unanswered, no notice
**Given**: the reservation form is open and untouched
**When**: the user has not answered the license question
**Then**: neither "Colombiana" nor "Extranjera" is selected and no element with `data-testid="license-document-notice"` exists in the DOM
**Evidence**: DOM state (no checked radio in the group, zero notice elements)

## SCEN-LIC-02: foreign license shows the passport notice
**Given**: the reservation form is open
**When**: the user selects "Extranjera"
**Then**: a notice appears inside a `role="status"` region with the exact text "Al recoger el carro deberás presentar tu pasaporte o cédula de extranjería. No se acepta la cédula colombiana si presentas una licencia de conducción extranjera."
**Evidence**: DOM state (notice element text content + role attribute)

## SCEN-LIC-03: toggling replaces the notice, never duplicates it
**Given**: "Extranjera" is selected and its notice is visible
**When**: the user switches to "Colombiana"
**Then**: exactly one notice exists with the text "Al recoger el carro deberás presentar tu cédula colombiana. No se acepta pasaporte ni cédula de extranjería si presentas una licencia de conducción colombiana." (and vice versa when switching back)
**Evidence**: DOM state (count of `license-document-notice` elements = 1, text content)

## SCEN-LIC-04: submit is blocked while unanswered
**Given**: every other field is valid and the license question is unanswered
**When**: the user submits the reservation form
**Then**: no POST reaches the reservation record endpoint and the error "Selecciona el tipo de licencia de conducción" is visible next to the field; in alquicarros the page scrolls/focuses the field
**Evidence**: network log (zero POST to the record endpoint) + DOM state (error text)

## SCEN-LIC-05: the answer never enters the reservation payload
**Given**: the license question is answered and the form is valid
**When**: the reservation is submitted successfully
**Then**: the POST body to the record endpoint contains no license-related key (no `tipoLicencia`, no `license*`)
**Evidence**: captured request body of the POST to the record endpoint (e2e route interception or network capture)

## SCEN-LIC-06: registration document stays decoupled
**Given**: the document selector offers exactly "Cédula" and "Pasaporte" with its format validation intact
**When**: the user registers with "Pasaporte" and answers "Colombiana" (or any other combination)
**Then**: the schema validates both fields independently and accepts every one of the four combinations
**Evidence**: valibot safeParse output for the four combinations + unchanged identificationTypeOptions source

## SCEN-LIC-07: reset after a completed reservation
**Given**: a reservation was completed and `resetAfterReservation` ran
**When**: a new reservation form opens
**Then**: the license question is unanswered again and no notice is shown
**Evidence**: store state (`tipoLicencia === null`) after reset + DOM state

## SCEN-LIC-08: parity across the three brands
**Given**: the three brand forms (alquilame, alquilatucarro, alquicarros)
**When**: comparing the rendered field
**Then**: the question sits between the identification number and email in all three, with identical texts sourced from the shared `packages/logic` catalog and identical data-testids (`driver-license-type`, `license-document-notice`)
**Evidence**: per-brand source guard tests + live DOM of the three dev servers
