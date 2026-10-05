# Phone field: Colombian mobile under a foreign flag — observable scenarios

Source: ../../2026-10-04-telefono-pais-visitante-design.md. Decided by the owner on 2026-10-05 after the pre-PR edge-case review: 6 in 10 Colombian mobiles (315…, 312…, 310…, 305…) are also valid US/Canada numbers, so under the US flag `315 888 9999` was saved as `+1 315 888 9999` without any warning. Blocking would reject real US customers (305 Miami, 312 Chicago), so the owner chose a non-blocking hint.
Every browser scenario runs on all 3 brands.

### SCEN-016: Colombian mobile typed under the US flag gets a non-blocking hint
Given the phone field shows the US flag (US visitor)
When the customer types `315 888 9999`
Then the field shows «¿Es un celular de Colombia? Cambia la bandera a Colombia.» below it, no error, and the reservation can still be submitted (POST phone `+1 315 888 9999`).
Evidence: unit (hint rule: `+1 315 888 9999` with flag US → hint); browser: hint text visible, POST sent with that phone.

### SCEN-017: The hint disappears once the flag is Colombia
Given SCEN-016's hint is showing
When the customer switches the flag to Colombia
Then the hint is gone and the saved phone is `+57 315 8889999`.
Evidence: browser: hint absent after the switch; POST phone `+57 315 8889999`.

### SCEN-018: No hint for numbers that are not Colombian mobiles, nor under the Colombian flag
Given the US flag
When the customer types `817 522 8026`
Then no hint is shown. And with the Colombian flag and `315 888 9999`, no hint either.
Evidence: unit (`+1 817 522 8026`/US → no hint; `+57 315 8889999`/CO → no hint); browser spot-check.
