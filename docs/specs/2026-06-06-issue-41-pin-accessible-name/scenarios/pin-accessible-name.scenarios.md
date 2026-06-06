---
name: pin-accessible-name
created_by: sdd
created_at: 2026-06-06T00:00:00Z
---

# Issue #41 — the hero `<h1>` accessible name must be the visible title only

Holdout contract. Write-once after first commit. The copy-to-WhatsApp action on
the pin is a **secret operator feature** — no customer-visible label, tooltip, or
button is allowed. Validated by source-shape Vitest tests (per package) plus
runtime DOM/a11y oracles via `/agent-browser`. Acceptance for console/network is
delta-vs-baseline (pre-existing `@nuxt/image` screen-size warnings allowed); the
project typecheck baseline is independently red and is not gated here.

## SCEN-001: hero `<h1>` accessible name is the visible title only (alquicarros @ /bogota)
**Given**: alquicarros dev server, page `/bogota` loaded
**When**: the accessibility tree is computed for the hero `<h1>` (`[data-slot="title"]`)
**Then**: the heading's accessible name is exactly the visible title text
  `"ALQUILER DE CARROS EN BOGOTÁ COLOMBIA"` (whitespace-normalized) — it does
  **not** contain the substring `"Copiar datos de búsqueda para WhatsApp"`
**Evidence**: `/agent-browser` accessibility snapshot of the `level=1` heading
  node + `browser_evaluate` JSON of the computed accessible name string

## SCEN-002: the pin still triggers the copy action (alquicarros @ /bogota)
**Given**: `/bogota` loaded, reservation/search state hydrated, clipboard stubbed
**When**: a mouse click fires on the pin element (the `<span>` wrapping `LocationIcon`
  in the hero title)
**Then**: `copySearchToWhatsapp` runs — `navigator.clipboard.writeText` is called
  once with a non-empty WhatsApp message (contains `"Consulta de alquiler"` and a
  `📍 Lugar:` line) AND the "Datos copiados" toast appears
**Evidence**: `/agent-browser` `browser_evaluate` capturing the stubbed
  `writeText` argument + screenshot of the toast

## SCEN-003: no axe violations of nested-interactive or heading-order in the hero (alquicarros @ /bogota)
**Given**: `/bogota` loaded, axe-core injected from CDN
**When**: axe runs scoped to the hero section (`[data-slot="root"]` of `UPageHero`)
**Then**: zero violations with id `nested-interactive` AND zero with id
  `heading-order` AND zero with id `aria-hidden-focus` are reported
**Evidence**: `/agent-browser` `browser_evaluate` JSON of `axe.run(...)` results
  filtered to those three rule ids (empty arrays)

## SCEN-004: the pin is inert — not focusable, not announced, no tooltip (alquicarros @ /bogota)
**Given**: `/bogota` loaded
**When**: the pin element is inspected and the page is keyboard-traversed (Tab)
**Then**: the pin element is a `<span aria-hidden="true">` (not a `<button>`); it
  carries no `aria-label` and no `title` attribute; it is **not** reachable by Tab
  (no element with the copy handler ever receives focus); and it exposes no
  accessible role/name in the accessibility tree
**Evidence**: `/agent-browser` `browser_evaluate` JSON of
  `{ tagName, ariaHidden, hasAriaLabel, hasTitle, tabbable }` for the pin +
  accessibility snapshot showing no button node in the heading subtree

## SCEN-005: the fix holds for all three brands (alquilame, alquilatucarro)
**Given**: alquilame and alquilatucarro dev servers, a representative city page on each
**When**: SCEN-001, SCEN-003 and SCEN-004 oracles are evaluated per brand
**Then**: each brand's hero `<h1>` accessible name is its visible title only (no
  copy-action substring); axe reports zero `nested-interactive`/`heading-order`/
  `aria-hidden-focus` violations in the hero; and the pin is an inert
  `aria-hidden` `<span>` with no label/title on each brand (verified per brand,
  not assumed from shared source)
**Evidence**: `/agent-browser` accessibility snapshot + `browser_evaluate` JSON
  per brand (two brands, two captures)

## SCEN-006: source shape locks the inert-span contract (all three packages, Vitest)
**Given**: each package's `app/components/CityPage.vue` source
**When**: `CityPage.test.ts` reads the source and asserts the `#title` shape
**Then**: the source does **not** contain a `<button>` carrying
  `aria-label="Copiar datos de búsqueda para WhatsApp"`; does **not** contain a
  `title="Copiar datos de búsqueda para WhatsApp"` (secret never leaks); the pin
  is a `<span … aria-hidden="true" … @click="copySearchToWhatsapp">` wrapping
  `<LocationIcon … />`; the legacy clipboard `UButton`
  (`i-heroicons-clipboard-document`) is still absent; and the
  `useShareSearchParams` binding (`copyToWhatsapp: copySearchToWhatsapp`) remains
**Evidence**: `pnpm --filter ui-alquicarros --filter ui-alquilame --filter
  ui-alquilatucarro test` output — CityPage suites green across all three packages
