---
name: unable-cards-on-empty-inventory
created_by: pablo+claude
created_at: 2026-05-05T16:30:00Z
---

# Unable Cards on Empty Inventory (LLNRAG009)

Restores legacy behavior: when Localiza responds with `no_available_categories_error`
(LLNRAG009) for a search, the result section displays the inline "¡Oops! Nos quedamos
sin carritos" message **plus** the full grid of admin categories rendered as
`UnableCategoryCard` (gray opacity, red "no disponible" badge, no price, no
"Solicitar reserva" button). This is a regression-fix follow-up to PR #13 / issue #10
that closed only the toast/inline-message portion of the LLNRAG009 UX.

The fix MUST work identically for non-monthly (1–29 day) and monthly (30 day) searches.

---

## SCEN-U1: Non-monthly LLNRAG009 — "¡Oops!" + N unable cards

**Given**:
- A non-monthly search (1–29 days) is initiated, e.g. `/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto-eldorado/.../2026-10-04T10:00:00/lugar-devolucion/.../2026-10-07T10:00:00`
- The Localiza availability endpoint responds with HTTP 4xx and structured body `{"error":"no_available_categories_error","message":"…","localiza_code":"LLNRAG009"}`
- Admin data has loaded successfully (≥1 category in `useStoreAdminData.categories`)

**When**: The search store completes the request and the result section renders.

**Then**:
- Inline block "¡Oops! Nos quedamos sin carritos en {city} para el {date}" is visible
- The category grid renders **exactly N** `UnableCategoryCard` components, where N = number of admin categories with a matching entry in `vehicleCategories[code]`
- Zero `CategoryCard` (available variant) renders
- No toast notification appears (LLNRAG009 is the canonical inventory-empty signal, not a transport error)
- The `useStoreSearchData.categories` ref returns an array of length N where every element has `estimatedTotalAmount === 999999999`

**Evidence**:
- DOM: `[data-testid="oops-empty-inventory"]` visible AND `getByRole('heading', { level: 3 }).filter({ hasText: 'no disponible' })` count === N
- Store: `useStoreSearchData().categories.length === N` and `categories.every(c => c.estimatedTotalAmount === 999999999)` after `search()` resolves
- Network: stubbed Localiza response payload captured by Playwright `page.route`
- Console: zero error-level messages from the search store

---

## SCEN-U2: Monthly LLNRAG009 — "¡Oops!" + N unable cards (issue #10 reproduction URL)

**Given**:
- A monthly search (exactly 30 days) is initiated using the issue #10 reproduction URL
  `/armenia/buscar-vehiculos/lugar-recogida/monteria-aeropuerto/2026-10-04T10:00:00/lugar-devolucion/monteria-aeropuerto/2026-11-03T10:00:00`
- `haveMonthlyReservation === true` (verified: `selectedDays === 30`)
- The Localiza availability endpoint responds with `{"error":"no_available_categories_error","localiza_code":"LLNRAG009"}` (the monthly reservation, by design, sends the full 30-day range to Localiza)
- Admin data has loaded successfully

**When**: The search store completes the request and the result section renders.

**Then**:
- Inline block "¡Oops! Nos quedamos sin carritos…" is visible (already passes in the current code)
- The category grid renders **exactly N** `UnableCategoryCard` components — same N as SCEN-U1 (the monthly path does NOT filter the unable list; FU/FL/GL filter applies only to the available-with-prices path)
- Zero `CategoryCard` (available variant) renders
- The behavior is observationally identical to SCEN-U1 — the user cannot distinguish monthly LLNRAG009 from non-monthly LLNRAG009 by looking at the result section

**Evidence**:
- DOM: same selectors as SCEN-U1 with `count === N`
- Store: `useStoreSearchData().categories.length === N` after monthly `search()` resolves with LLNRAG009 — this is the assertion that fails in the current code (returns 0)
- Playwright run on issue #10's exact URL with stubbed LLNRAG009 response

---

## SCEN-U3: Unable card interactivity — only carousel + accordion respond

**Given**: An `UnableCategoryCard` is rendered (any of N from SCEN-U1 or SCEN-U2).

**When**: The user inspects and interacts with the card.

**Then**:
- The image carousel responds to navigation: clicking the right chevron advances to the next image, dots indicator updates
- The accordion toggle (chevron next to the category title) collapses/expands the description + tags block
- No price text appears anywhere on the card
- No "Solicitar reserva" / "Reservar" / "Cotizar" CTA button appears
- The card has the `categoria-no-disponible` CSS class which applies: image opacity 40%, text opacity 70%, white background, gray-600 text
- The badge `<span class="… bg-red-100 text-red-600 …">no disponible</span>` appears next to "Grupo {code}"
- Clicking anywhere on the card (outside carousel arrows / accordion chevron) does NOT open the reservation slideover

**Evidence**:
- DOM: card root has both `categoria` and `categoria-no-disponible` classes
- DOM: zero descendants matching `:text("Solicitar")`, `:text("Reservar")`, `:text("$")`, or any element with `[data-testid*="precio"]`
- Computed CSS: `img { opacity: 0.4 }`, `.contenedor-descripcion-carro { opacity: 0.7 }`
- Behavior: clicking carousel chevron → image src changes; clicking accordion chevron → `.contenedor-descripcion-carro [data-state]` toggles open/closed; clicking title body → no slideover opens

---

## SCEN-U4: Mix-mode (non-monthly success with partial Localiza coverage)

**Given**:
- A non-monthly search succeeds: Localiza returns HTTP 200 with an array containing `M` categories (M < N where N = admin categories total)
- The remaining `N - M` admin categories are absent from the Localiza response
- No error condition

**When**: The result section renders.

**Then**:
- The category grid renders exactly N cards: M `CategoryCard` (available, with prices and CTA) for codes returned by Localiza, plus `N - M` `UnableCategoryCard` for admin codes that Localiza did NOT return
- The "¡Oops!" inline block is NOT visible (`hasAvailableCategories === true` because at least one card is available)
- Cards render in price-ascending order (sentinel 999999999 floats unable cards to the end of the grid by the existing sort)

**Evidence**:
- Store: `categories.filter(c => c.estimatedTotalAmount !== 999999999).length === M`
- Store: `categories.filter(c => c.estimatedTotalAmount === 999999999).length === N - M`
- DOM: `[data-testid="oops-empty-inventory"]` not present
- Playwright stub returns array with subset of admin codes

**Out of scope for monthly**: SCEN-U4 does NOT apply to monthly searches by design. The monthly success path (`haveMonthlyReservation === true` + HTTP 200) shows ALL admin categories as available with admin's monthly fixed prices regardless of which codes Localiza returned — Localiza's role in monthly is range validation, not curation. The only path where monthly renders unable cards is LLNRAG009 (covered by SCEN-U2).

---

## Non-goals (explicit)

- The known broken `noMonthlyCategories` filter (`'FU' in ['FU','FL','GL']` always false due to `in`-on-array semantics) is **not** in scope. Even if it worked, FU/FL/GL would only matter on the monthly success path, and SCEN-U2 maps **all** admin categories on LLNRAG009 (not the success path).
- Refactoring the `search()` function flow control is **not** required. The minimum-intervention fix is in the `categories` computed.
- Visual restyling of `UnableCategoryCard` beyond what `category.css :155 .categoria-no-disponible` already provides is **not** in scope — the existing styles match the legacy screenshot.
