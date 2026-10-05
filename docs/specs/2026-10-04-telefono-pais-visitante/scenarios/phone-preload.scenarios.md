# Phone field: preload while results are on screen — observable scenarios

Source: ../../2026-10-04-telefono-pais-visitante-design.md §2 «Descarga adelantada». Owner decision 2026-10-05: after the pre-PR performance review, the phone-field downloads (vue-tel-input, full metadata, visitor country) start while the customer is looking at vehicle results, so the field is ready when the form opens.

**Supersedes** one clause of SCEN-013 in phone-country.scenarios.md: «`max` loads only when the reservation form opens». The rest of SCEN-013 stands unchanged (no metadata statically reachable from the entry or the `/bogota` page chunk; `/bogota` initial JS below baseline). The holdout file is not edited; this file records the owner's later decision.

### SCEN-019: Downloads start with results on screen, never on a plain page load
Given a visitor on `/bogota` who has not searched
When the page finishes loading and stays idle for 5 s
Then no phone metadata chunk, no vue-tel-input chunk and no `/api/visitor-country` request has been made.
And given a visitor whose search shows vehicle results
When the page stays idle for ~6 s without opening the form (downloads start 2 s after results appear, then at the next idle moment, at most 3 s later)
Then the metadata chunk, the vue-tel-input chunk and one `/api/visitor-country` request have been made; opening the form afterwards makes no new request for any of them.
Evidence: browser network capture on all 3 brands (count of `/api/visitor-country` = 1 per page; chunk requests timestamped before the form opens); production build check that none of those chunks is statically reachable from the entry or the `/bogota` page chunk.
