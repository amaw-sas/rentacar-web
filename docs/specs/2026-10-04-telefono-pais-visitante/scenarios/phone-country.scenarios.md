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
Then the field is valid and the saved phone is `+57 300…` (`+573001234567` after normalization).
Evidence: unit; browser network payload.

### SCEN-004: Typing the + switches the flag
Given the Colombian flag
When the customer types `+1 817 522 8026`
Then the flag switches to USA, the field is valid, and the saved phone is `+1 817 522 8026` (`+18175228026`).
Evidence: browser: flag shows US, network payload.

### SCEN-005: US visitor opens with the US flag
Given a visitor whose country resolves to `US`
When the reservation form opens
Then the phone field shows the US flag; typing `817 522 8026` saves `+1 817 522 8026`.
Evidence: endpoint unit test (`cf-ray` + `cf-ipcountry: US` → `{country:'US', source:'cloudflare'}`); browser on a deploy where the endpoint returns `US` (preview with `x-vercel-ip-country`, or a stubbed endpoint in local e2e); network payload.

### SCEN-006: Colombian or unknown visitor opens in Colombia
Given a visitor whose country is `CO`, missing, `XX`, `T1`, unknown to vue-tel-input, or the endpoint fails / exceeds 1,500 ms
When the form opens
Then the field opens with the Colombian flag, as today, with no console error.
Evidence: unit (resolver returns `'CO'` for each case, including rejected fetch and timeout); browser with the endpoint stubbed to each case.

### SCEN-007: Customer-chosen flag is respected
Given a US visitor (field opened with the US flag)
When the customer switches the flag to Colombia and types `300 1200 000`
Then the flag stays Colombia and the saved phone is `+57 300 1200000`.
Evidence: browser network payload; the flag is still CO after the endpoint promise has settled.

### SCEN-008: Flag never changes under the customer
Given any visitor
When the field is visible
Then the flag only changes because of the customer (choosing a flag or typing `+…`), never because the country lookup finished.
Evidence: the field is rendered only after the country is resolved (component test: loader awaits both promises); browser: no flag change after first paint with a slow (1,200 ms) stubbed endpoint.

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

### SCEN-013: Bundle weight measured
Given production builds before and after
When the chunks are compared
Then the report states the added kB gzip and whether it lands in the initial load of `/bogota`; if it does and is significant, a deferred-load proposal is presented to the owner and not applied.
Evidence: build output + HTML preload list, numbers in the PR body.
