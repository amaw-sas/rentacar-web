---
name: unable-cards-on-empty-inventory
created_by: pablo+claude
created_at: 2026-05-05T16:30:00Z
updated_at: 2026-05-08T13:00:00Z
update_reason: Customer-feedback-driven redesign of UnableCategoryCard. SCEN-U3 fully rewritten; SCEN-U1/U2 DOM evidence selectors updated to match new card structure; Non-goals section updated. SCEN-U4 unchanged. Original 2026-05-05 contract preserved in git history at 43aef47. User-authorized bypass of write-once via --no-verify (per pre-conversation brief).
---

# Unable Cards on Empty Inventory (LLNRAG009)

When Localiza responds with `no_available_categories_error` (LLNRAG009) for a search,
the result section displays the inline "¡Oops! Nos quedamos sin carritos" message
**plus** the full grid of admin categories rendered as `UnableCategoryCard`. The card
shows a top red banner with the unavailability reason (date range + branch), the model
image dimmed in grayscale, and two actionable CTAs ("Probar otras fechas" / "Cambiar
sucursal") that scroll the user back to the searcher to retry. The 2026-05-05 commit
restored the missing gray-card *grid*; the 2026-05-08 amendment redesigned each card's
content based on customer feedback that "no disponible" was not visually clear.

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
- DOM: `[data-testid="oops-empty-inventory"]` visible AND `locator('.categoria-no-disponible').count() === N`
- DOM: each `.categoria-no-disponible` contains a banner with `bg-red-50` class and the text "No disponible"
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
- DOM: same selectors as SCEN-U1 (updated) with `count === N`
- Store: `useStoreSearchData().categories.length === N` after monthly `search()` resolves with LLNRAG009 — this is the assertion that fails in the current code (returns 0)
- Playwright run on issue #10's exact URL with stubbed LLNRAG009 response

---

## SCEN-U3: Unable card visual + actionable CTAs (post-2026-05-08 redesign)

**Given**: An `UnableCategoryCard` is rendered (any of N from SCEN-U1 or SCEN-U2).
The user has an active search context with `selectedPickupDate`, `selectedReturnDate`,
and `selectedPickupLocation` populated in `useStoreReservationForm`.

**When**: The user inspects the card and interacts with the CTAs.

**Then (visual)**:
- The card has the `categoria-no-disponible` CSS class which applies:
  `bg-white`, `rounded-lg`, `overflow-hidden`; `img { opacity: 0.5; filter: grayscale }`;
  `.contenedor-descripcion-carro { opacity: 0.9 }`.
- A top banner is the first child of the card root:
  `<div class="bg-red-50 border-l-4 border-red-500 ...">` containing
  `<UIcon name="i-lucide-alert-triangle" />`, the title `"No disponible"`,
  and (when search context is present) a second line with `bannerText` from
  `useUnavailabilityContext()` — format `"No disponible para el {dateRange} en {city} · {branch}"`.
- When search context is missing, the banner shows only `"No disponible"`. The
  template gates the second line on the composable's `isSpecific` flag (true
  when both `dateRangeLabel` and `locationLabel` are populated). The literal
  `"No disponible para tu búsqueda"` lives only inside the composable; the
  template never compares against it directly.
- The image carousel still responds to navigation: clicking the right chevron advances
  to the next image; dots indicator updates.
- Below the carousel: `Grupo {code}` (text-gray-600) and `descripcion_corta` (h3).
- Two CTA buttons appear, stacked, below the title:
  primary `<UButton>` "Probar otras fechas" (`bg-gray-900 hover:bg-black text-white`),
  outline `<UButton>` "Cambiar sucursal" (`ring-1 ring-gray-300`).
- No price text appears anywhere on the card.
- No "Solicitar reserva" / "Reservar" / "Cotizar" button appears.
- The legacy badge `<span class="bg-red-100 text-red-600">no disponible</span>` is GONE.
- The legacy `<UCollapsible>` for `descripcion_larga` is GONE.

**Then (interactivity)**:
- Clicking either CTA invokes `document.getElementById('searcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- The `<div id="searcher" />` anchor is rendered by `CityPage.vue` immediately before
  the `<UPageHero>` that wraps the searcher form (covers both desktop and mobile renders).
- The handler is SSR-safe (`typeof document === 'undefined'` guard).

**Evidence**:
- DOM: card root has classes `categoria` and `categoria-no-disponible`.
- DOM: card descendant selector `.bg-red-50.border-l-4.border-red-500` exists and contains text "No disponible".
- DOM: card contains `[name="i-lucide-alert-triangle"]` (UIcon).
- DOM: card contains text "Probar otras fechas" AND "Cambiar sucursal".
- DOM: card does NOT contain `bg-red-100` (legacy badge gone).
- DOM: card does NOT contain text matching `descripcion_larga` (collapsible gone).
- DOM: card does NOT contain any of `:text("Solicitar")`, `:text("Reservar")`, `:text("$")`, `[data-testid*="precio"]`.
- DOM: card does NOT contain `button[aria-expanded]` (legacy accordion gone).
- Computed CSS: `img { opacity: 0.5; filter: grayscale }`.
- Behavior: clicking either CTA → `window.scrollY` decreases until the searcher anchor is in view; recorded measurement: 1050 → 0 with `block: 'start'` and `scroll-mt-20` offset.

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
- The 2026-05-05 minimum-intervention scope explicitly deferred visual restyling.
  The 2026-05-08 amendment supersedes that constraint. The current scope INCLUDES the
  visual restyling described in SCEN-U3.
