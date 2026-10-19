---
name: pagina-404
created_by: orchestrator
created_at: 2026-10-16T00:00:00Z
---

Context: on production (2026-10-16) a direct visit to a missing URL renders the
error page without the global stylesheet (entry.css is stripped off every
non-home route), so the logo and the heading are white on white. Separately,
`/blog/autores/elisa-arcos.author` on alquilatucarro is a 500 listed in the
sitemap. Brands checked: alquilame and alquilatucarro (production builds);
alquicarros gets SCEN-001 only.

## SCEN-001: direct visit to a missing top-level URL shows the styled 404
**Given**: a visitor with no prior page in the site
**When**: they open `/ciudad-que-no-existe` directly (full page load)
**Then**: HTTP status is 404; the page background is not white (dark blue gradient); the heading "¡Ups! Página no encontrada" has a text color different from the background behind it; "Ir al inicio" has an amber background; the brand logo renders with width and height > 0
**Evidence**: HTTP status from curl with `Accept: text/html`; `getComputedStyle` values read in the Orca browser (backgroundImage of the page root, h1 color, link backgroundColor, logo bounding box)

## SCEN-002: direct visit to a missing path under a city shows the same styled 404
**Given**: a visitor with no prior page in the site
**When**: they open `/medellin/xyz` directly
**Then**: same observable result as SCEN-001
**Evidence**: same as SCEN-001

## SCEN-003: the 404 offers a way into the business
**Given**: the 404 page from SCEN-001
**When**: the visitor looks for where to go next
**Then**: there are 19 links, one per city served, each pointing to `/<city>`; opening the Medellín link loads `/medellin` with status 200
**Evidence**: count of city anchors in the DOM; HTTP status of `/medellin`

## SCEN-004: "Volver atrás" goes back, not home
**Given**: a visitor on `/medellin` who then navigates inside the site to a missing URL
**When**: they press "Volver atrás"
**Then**: they land on `/medellin`
**And Given**: a visitor who opened the missing URL directly as the first page of the tab
**When**: they press "Volver atrás"
**Then**: they land on `/` (never an empty or broken state)
**Evidence**: `location.pathname` after the click in the Orca browser

## SCEN-005: client-side navigation to a 404 looks the same as a direct visit
**Given**: a visitor already on a normal page (global stylesheet loaded)
**When**: an in-site navigation ends in a 404
**Then**: the computed values from SCEN-001 match the direct-visit values
**Evidence**: `getComputedStyle` values compared between both paths

## SCEN-006: the author data file is no longer a public page
**Given**: alquilatucarro.com
**When**: a visitor or crawler requests `/blog/autores/elisa-arcos.author`
**Then**: response is 404 in under 3 s; `/sitemap.xml` no longer lists it; `/blog/autores/elisa-arcos` still returns 200 showing Elisa Arcos's bio; a blog article still shows her byline
**Evidence**: HTTP status and timing; sitemap content; DOM text of the author page and one article

## SCEN-007: normal pages keep their current CSS loading
**Given**: home and `/medellin` on alquilame and alquilatucarro
**When**: loaded before and after the change
**Then**: the list of `<link rel=stylesheet>` in the server HTML has the same shape (entry.css still absent off-home) and the total CSS rule count after load is within ±5% of before
**Evidence**: server HTML link list and `document.styleSheets` rule counts, before vs after

## SCEN-008: clean title and console
**Given**: the 404 page
**When**: it loads
**Then**: `<title>` names the brand exactly once; the console has zero errors; the only failed network request is the document's own 404
**Evidence**: `document.title`; Orca console and network capture
