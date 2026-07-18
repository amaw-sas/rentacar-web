---
name: alquilame-dogfood-minors
created_by: pabloandi
created_at: 2026-06-19T00:00:00Z
---

# Alquilame — dogfood minor findings

Lower-severity findings from the dogfood pass that are genuine code fixes.

- **ISSUE-003** — when the availability lookup fails with an infrastructure
  error (backend unreachable / 500), the toast leaked the raw technical string
  to the user: `Error · [POST] "http://localhost:3000/api/reservations/availability": <no response> fetch failed`.
  Root cause: the Nitro 500 envelope is `{ error: true, message: "[POST]…fetch failed", … }`.
  `useFetchCategoriesAvailabilityData` treats any object with an `error` key as a
  structured Localiza error (`'error' in data`), so the boolean-`error` envelope
  is forwarded as if it were a Localiza code; `createErrorMessage` then matches no
  known code and falls through to its raw-message default.
- **ISSUE-006** — in the mobile menu the "Reserva Ahora" CTA sits flush against
  the last nav link "Contacto" (measured gap = 0px), so the red button + its glow
  crowd the link.

Out of scope (escalated, NOT code fixes — see delivery notes):
- ISSUE-004 legacy USD-based SEO/marketing claim vs `$220.000 COP/día` daily minimum —
  a copy/SEO decision owned by the directiva, not changed unilaterally.
- ISSUE-005 hero video with burned-in subtitles + watermark — needs a re-encoded
  video asset, not a code change.

---

## SCEN-001: availability backend unreachable shows a friendly toast, never raw tech text
**Given**: a vehicle search whose availability call returns a 500 infrastructure
error whose body is the Nitro envelope `{ error: true, message: "[POST] \"…\": <no response> fetch failed" }`
**When**: the search runs and the error is surfaced to the user
**Then**: the toast shows the friendly server-error copy ("No pudimos completar la
búsqueda" / "Ocurrió un problema al consultar la disponibilidad. Por favor intenta
de nuevo en unos minutos.") and NEVER a raw URL, `[POST]`, or `fetch failed`
**Evidence**: rendered toast description text contains the friendly copy and does
NOT contain `fetch failed`, `http://`, or `[POST]`

## SCEN-002: error mapping forwards real Localiza codes, downgrades everything else to server_error
**Given**: the helper that maps a caught availability fetch error to a LocalizaErrorResponse
**When**: it receives (a) a FetchError whose `data.error` is a non-empty string
code like `no_available_categories_error`, (b) the Nitro envelope `{ error: true, message: "…fetch failed" }`,
(c) an error with no `data` at all
**Then**: case (a) is forwarded verbatim (`error` stays `no_available_categories_error`);
cases (b) and (c) become `{ error: 'server_error', message: <friendly Spanish copy> }`
**Evidence**: unit test on the mapping helper passes for all three cases; the
`server_error` message contains no `fetch failed` / URL / `[POST]`

## SCEN-003: mobile menu CTA is visibly separated from the last nav link
**Given**: the home page on a mobile viewport with the menu open
**When**: the menu renders its nav links and the "Reserva Ahora" / WhatsApp CTAs
**Then**: there is a visible vertical gap between the bottom of the last nav link
("Contacto") and the top of the "Reserva Ahora" button (≥ 16px), instead of the
0px flush spacing that let the button's glow crowd the link
**Evidence**: runtime geometry — `ReservaAhora.top − Contacto.bottom ≥ 16`
