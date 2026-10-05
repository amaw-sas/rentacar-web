# Phone field: visitor country — observable scenarios

Source: ../../2026-10-04-telefono-pais-visitante-design.md (approved 2026-10-04).
"Saved" = the `phone` value sent in the reservation POST (`useRecordReservationForm`), observed in the browser network payload.
Every browser scenario runs on all 3 brands (alquilame, alquilatucarro, alquicarros) unless stated.

### SCEN-001: US number typed under the Colombian flag is blocked
Given the phone field opens with the Colombian flag
When the customer types `1 817 522 8026` and tries to reserve
Then the reservation is not submitted and the field shows «Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.»
Evidence: unit (schema rejects `+57 1 817 5228026` with that exact message); browser: no reservation POST, message visible under the field.

### SCEN-002: US number without the 1 under the Colombian flag is blocked
Given the Colombian flag
When the customer types `609 666 9993` and tries to reserve
Then the reservation is not submitted.
Evidence: unit (schema rejects `+57 609 6669993`); browser: no reservation POST.

### SCEN-003: Colombian mobile still works
Given the Colombian flag
When the customer types `300 123 4567`
Then the field is valid and the saved phone is exactly `+57 300 1234567`.
Evidence: unit; browser network payload.

### SCEN-004: Typing the + switches the flag
Given the Colombian flag
When the customer types `+1 817 522 8026`
Then the flag switches to USA, the field is valid, and the saved phone is exactly `+1 817 522 8026`.
Evidence: browser: flag shows US, network payload.

### SCEN-005: US visitor opens with the US flag
Given a visitor whose country resolves to `US`
When the reservation form opens
Then the phone field shows the US flag; typing `817 522 8026` saves `+1 817 522 8026`.
Evidence: endpoint unit test (`cf-ray` + `cf-ipcountry: US` → `{country:'US', source:'cloudflare'}`); browser with `/api/visitor-country` stubbed to `US` (the tester is in Colombia, so an unstubbed preview returns CO); network payload. Post-deploy: `curl` confirms `source: cloudflare`.

### SCEN-006: Colombian or unknown visitor opens in Colombia
Given a visitor whose country is `CO`, missing, `XX`, `T1`, unknown to vue-tel-input, or the endpoint fails / exceeds 1,500 ms
When the form opens
Then the field opens with the Colombian flag, as today, with no console error.
Evidence: unit (resolver returns `'CO'` for each case, including rejected fetch and timeout); browser with the endpoint stubbed to each case.

### SCEN-007: Customer-chosen flag is respected
Given a US visitor (field opened with the US flag)
When the customer switches the flag to Colombia and types `300 1200 000`
Then the flag stays Colombia and the saved phone is `+57 300 1200000`.
And if they switch to Colombia, leave the step before typing a valid number, and come back to the form, the flag is still Colombia.
Evidence: browser network payload; flag still CO after the endpoint promise has settled and after leaving and re-entering the "datos" step; unit (country precedence: last flag shown in store → visitor → CO).

### SCEN-008: Flag never changes under the customer
Given any visitor
When the field is visible
Then the flag only changes because of the customer (choosing a flag or typing `+…`), never because the country lookup finished.
Evidence: the field is rendered only after all three loads settle (component import, visitor country, phone validator), with a same-height placeholder before; browser: no flag change and no layout jump after first paint with a slow (1,200 ms) stubbed endpoint.

### SCEN-009: Legacy Mexican mobile keeps working
Given the customer enters `+52 1 55 1234 5678`
When they reserve
Then it is valid and saved as `+525512345678`, as today.
Evidence: normalizePhoneNumber unit tests on `/max`; browser payload.

### SCEN-010: Non-Colombian invalid number gets the generic flag hint
Given the US flag
When the customer types `300 123 4567`
Then the field shows «Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.»
Evidence: unit (schema message for an invalid `+1…`); browser.

### SCEN-011: Endpoint is never cached and never trusts Vercel geo behind Cloudflare
Given a request through Cloudflare (`cf-ray` present) with `x-vercel-ip-country: US` and no `cf-ipcountry`
When `/api/visitor-country` is called
Then it returns `{country:null, source:'none'}` with `cache-control: private, no-store`.
Evidence: endpoint unit test; post-deploy `curl -i https://<brand>/api/visitor-country` → `source: cloudflare`, `no-store`.

### SCEN-012: No external IP lookups, clean runtime
Given any brand
When the form opens and a reservation is attempted
Then the only geo request is same-origin `/api/visitor-country`; no request to `ip2c.org` or any third-party IP service; zero console errors; zero failed requests.
Evidence: browser network capture + console on all 3 brands.

### SCEN-013: Phone metadata leaves the initial load
Given production builds of alquilatucarro before (baseline 2026-10-04: entry 203 kB gzip incl. `min` metadata 19.5 kB; `/bogota` static JS ~347 kB gzip) and after
When the chunks are compared
Then neither `min` nor `max` metadata is statically reachable from the entry or the `/bogota` page chunk, the `/bogota` initial JS is smaller than baseline, and `max` loads only when the reservation form opens.
Evidence: build manifest + static import closure; browser network capture: no metadata chunk on page load, metadata chunk requested on form open; numbers in the PR body.

### SCEN-014: Incomplete number gets its own message
Given the Colombian flag
When the customer types `300123` and tries to reserve
Then the reservation is not submitted and the field shows «Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.» (approved 2026-10-04), never the «no corresponde al país» one.
Evidence: unit (schema message for a value without `+`); e2e `reservation-phone-revalidation.spec.ts` updated to the new text.

### SCEN-015: Unloaded validator fails closed
Given the phone validator has not been loaded
When the schema validates `+57 300 1234567`
Then it is rejected with «Número de teléfono o WhatsApp no válido» (unreachable from the UI; guards against an unchecked number slipping through).
Evidence: unit test on a fresh module instance.
