# Implementation plan — botón «Copiar cotización»

Created: 2026-10-18 · Spec: `docs/specs/copiar-cotizacion/design.md` · Scenarios:
`docs/specs/copiar-cotizacion/scenarios/copiar-cotizacion.scenarios.md` (SCEN-001…011, holdout —
never edited during implementation).

## Chunk 1: File map and steps

### File map

| File | New/Mod | Single responsibility |
|---|---|---|
| `packages/logic/src/utils/monthlyPlans.ts` | New (moved) | `sellablePlans`, `canQuoteTotalCoverageFor` — pure monthly-plan predicates |
| `packages/logic/src/utils/__tests__/monthlyPlans.test.ts` | New (moved) | unit tests moved from `ui-alquicarros/app/composables/__tests__/useMonthlyPlans.test.ts` |
| `packages/ui-alquicarros/app/composables/useMonthlyPlans.ts` | Mod | re-export only |
| `packages/ui-alquicarros/tests/wizard-monthly-mileage.test.ts` | Mod | source guard re-pointed at `monthlyPlans.ts` |
| `packages/logic/src/utils/useDateFunctions.ts` | Mod | add `formatQuoteDateTime(fecha, hora)` |
| `packages/logic/src/utils/helpers/buildQuoteText.ts` (+ `.test.ts`) | New | pure: plain input → WhatsApp text |
| `packages/logic/src/utils/index.ts` | Mod | add `export * from './monthlyPlans'` and `export * from './helpers/buildQuoteText'` (`formatQuoteDateTime` already flows via `export * from './useDateFunctions'`) |
| `e2e/copiar-cotizacion.spec.ts` | New | Playwright, alquilame, mocked availability with one sold-out gama (pattern: `e2e/unable-cards-on-empty-inventory.spec.ts`) |
| `packages/logic/src/composables/useAdvisorMode.ts` (+ test) | New | `?asesor` + localStorage → `isAdvisor` (client only) |
| `packages/logic/src/composables/useCopyQuote.ts` (+ test) | New | rows + store → priced rows via fresh `useCategory` → `buildQuoteText` → clipboard + toast; exposes `canCopy` |
| `packages/ui-alquilame/app/components/CopyQuotePanel.vue` | New | button + 2 checkboxes, alquilame style |
| `packages/ui-alquilatucarro/app/components/CopyQuotePanel.vue` | New | same, alquilatucarro style |
| `packages/ui-alquicarros/app/components/wizard/CopyQuotePanel.vue` | New | same, alquicarros style |
| `packages/ui-alquilame/app/components/CategorySelectionSection.vue` | Mod | mount panel in «¡Vehículos Disponibles!» header, pass rows |
| `packages/ui-alquilatucarro/app/components/CategorySelectionSection.vue` | Mod | same |
| `packages/ui-alquicarros/app/components/wizard/steps/StepVehicle.vue` | Mod | mount panel in `<header>`, pass all-segment rows in segment order |

### Steps

- [ ] 1. **Move monthly predicates to logic** | S | deps: none
   Behaviour: alquicarros wizard prices monthly exactly as before.
   Notes: inside `monthlyPlans.ts` import `pickPriceForDate` and types RELATIVELY (not from
   `@rentacar-main/logic/utils`, which would make the barrel import itself). Moved test imports
   `../monthlyPlans`.
   AC: `sellablePlans`, `canQuoteTotalCoverageFor`, `SellablePlan`, `TotalCoverageQuotable` live
   in `logic/utils/monthlyPlans.ts`; `useMonthlyPlans.ts` re-exports all four (values + types —
   `useSelectionCarryOver.test.ts:28` imports the type); source guard
   `wizard-monthly-mileage.test.ts` reads the new file; `pnpm --filter logic test`,
   `pnpm --filter ui-alquicarros test` and `pnpm --filter ui-alquicarros typecheck` green.

- [ ] 2. **`formatQuoteDateTime`** | S | deps: none
   Behaviour: `("2026-10-16","07:30")` → «viernes 16 oct. 7:30am»; `("…","12:00")` → «12:00pm»;
   `("…","00:15")` → «12:15am»; every month token from the fixed table; a date whose weekday
   would slip under a non-UTC TZ stays right — TZ is module-level (see `formatTime.tz.test.ts`),
   so one file per TZ: `formatQuoteDateTime.test.ts` (Bogotá) and
   `formatQuoteDateTime.tz-tokyo.test.ts` (`process.env.TZ='Asia/Tokyo'` before import).
   AC: both files green under `pnpm --filter logic test`.

- [ ] 3. **`buildQuoteText` (pure)** | M | deps: 2
   Behaviour: given plain input reproduces the owner's Cali sample byte-for-byte (fixture
   from the user's paste, with `*` bold); branches: different return branch, extra hours,
   monthly plan line (shared vs per-row), Seguro Total header + footer swap, per-row
   «(sin Seguro Total)», all-rows-without-Total → no header + «seguro básico», baby seat
   regular/monthly lines, singular «Total: 1 día» and «y 1 hora extra», exact 4-space column
   separator, description trimmed.
   AC: `pnpm --filter logic test` green with one case per branch; covers text side of
   SCEN-001/005/006/007/011.

- [ ] 4. **`useAdvisorMode`** | S | deps: none
   Behaviour: `?asesor=1` sets `rentacar:asesor` and `isAdvisor=true`; later visit without
   param stays true; `?asesor=0` clears; storage `null` or throwing → true only while URL has
   `?asesor=1`; server render → false (reads in `onMounted`).
   AC: `pnpm --filter logic test` green (SCEN-002/003 logic).

- [ ] 5. **`useCopyQuote`** | M | deps: 1, 3
   Behaviour: input `rows: Ref<CategoryAvailabilityData[]>`; on `copy({ totalCoverage, babySeat })`
   creates a fresh `useCategory` per row at click time, drops sold-out (999999999) and price ≤ 0,
   applies Seguro Total only when quotable (monthly: `canQuoteTotalCoverageFor` +
   `total_insurance_price > 0`), sets monthly `withMileage = sellablePlans(...)[0]` and skips
   rows with none, passes each row's `withMileage` as `plan` (so the per-row «(plan X km)» branch
   can fire), takes N/H from first row (monthly N=30), reads baby seat amount from the first
   row's `getBabySeatPrice` plus daily/monthly unit from `useFetchRentacarData().extras` (never
   added to row prices), reads branches/dates from the form store, writes clipboard,
   success/error toast. `canCopy` = `!pending && !searchOutdated && copyable rows > 0`.
   AC: `pnpm --filter logic test` green with unit tests (mocks per `useCategory.*.test.ts`):
   sold-out excluded (SCEN-004); Total fallback row (SCEN-006); 2k-only monthly row priced on 2k
   and monthly row with no month price + return fee > 0 skipped (SCEN-011); baby seat on → row
   prices identical to baby seat off, seat line = N × daily / monthly fixed (SCEN-007);
   clipboard rejection → error toast, no throw (SCEN-008); `canCopy` false when outdated
   (SCEN-010) or empty.

- [ ] 6. **alquilame panel + mount + e2e** | M | deps: 4, 5
   Behaviour: advisor sees «Copiar cotización» + «Con Seguro Total» + «Con silla de bebé»
   under «¡Vehículos Disponibles!»; visitor sees nothing; panel inside `<ClientOnly>`, `v-if`
   on `isAdvisor && canCopy`; rows = `renderableCategories`.
   Also: `e2e/copiar-cotizacion.spec.ts` — alquilame, `?asesor=1`, mocked availability with one
   sold-out gama → copied text lacks that code (SCEN-004); no `?asesor` → no button (SCEN-002).
   Read the copied text by stubbing `navigator.clipboard.writeText` with `page.addInitScript`
   (no clipboard permissions in the Playwright config). Flags go BEFORE the `--` filter.
   AC: component test (pattern of `ui-alquilame/app/components/__tests__/`) +
   `pnpm --filter ui-alquilame test` green; `pnpm test:e2e:chromium:alquilame -- copiar-cotizacion`
   green; `pnpm --filter ui-alquilame typecheck` with no errors beyond the 3 pre-existing
   `robots`/`NitroRouteConfig` ones.

- [ ] 7. **alquilatucarro panel + mount** | S | deps: 4, 5
   Behaviour: advisor sees «Copiar cotización» + «Con Seguro Total» + «Con silla de bebé» in
   the «¡Vehículos Disponibles!» block of `ui-alquilatucarro/.../CategorySelectionSection.vue`
   (~:84), styled with that brand's tokens/components; visitor sees nothing; `<ClientOnly>`,
   `v-if="isAdvisor && canCopy"`; rows = that file's `renderableCategories`.
   AC: component test following `ui-alquilatucarro/app/components/__tests__/` patterns +
   `pnpm --filter ui-alquilatucarro test` green; `pnpm --filter ui-alquilatucarro typecheck` with
   no new errors.

- [ ] 8. **alquicarros panel + mount** | M | deps: 4, 5
   Behaviour: `<WizardCopyQuotePanel>` (file `components/wizard/CopyQuotePanel.vue`, auto-named
   with the folder prefix) in StepVehicle `<header>`; rows built as
   `groups.flatMap(g => g.codes.map(c => rowByCode.get(c)))` over ALL segments, so order = segment
   order and each code appears once.
   AC: unit test: order = segment order incl. collapsed segments, no repeated code;
   `pnpm --filter ui-alquicarros test` green; `pnpm --filter ui-alquicarros typecheck` no new
   errors.

- [ ] 9. **Runtime verification, 3 brands** | M | deps: 6–8
   Dev server per brand; Orca embedded browser (load `orca-cli` skill). For each brand run
   SCEN-001…003, 005…007, 009…011 live (SCEN-004 already covered by the e2e of step 6 plus
   unit; a real sold-out gama is checked live if one appears); compare copied prices against the per-brand IVA total evidence from the
   scenarios file; read clipboard via `navigator.clipboard.readText()` in page JS (grant
   permission) or intercept `writeText`. Zero console errors / failed requests / hydration
   warnings. Exploratory pass (`agent-browser skills get dogfood`).
   AC: evidence table — live scenarios (001–003, 005–007, 009–011) × 3 brands all satisfied;
   unit/e2e-only scenarios (004, 008) listed once with their test run output; total 11/11.

- [ ] 10. **Quality gate + commit** | S | deps: 9
    code-reviewer, edge-case-detector, performance-engineer, code-simplifier agents on the
    diff; fix findings; full `pnpm test` + lint (no new `as any`, warning cap) + build of the
    3 brands; `/verification-before-completion`; commit (no push without authorization).

### Prerequisites
- `.env.local` for dev servers and for Playwright's `webServer` (needed from step 6): worktree has none — fetch keys via Supabase MCP per memory
  `entorno-worktree-env-vercel-preview`.
- Never `pnpm dev -- --port` (ROOTDIR trap); use the per-brand script and check the port is
  this worktree's.
- Chat untouched → no rate-limit risk.

### Testing strategy
Pure units first (2, 3), composables with mocks (4, 5), components (6–8), live browser per
brand (9). Vitest per package with `pnpm --filter <pkg> test` (this worktree has its own
`node_modules` with plugin-vue in every ui package); if a ~5 s timeout appears, rerun with
`--maxWorkers=2` before calling it red.

### Rollout
Ship behind the advisor flag — zero visitor-visible change. Rollback = revert the merge. After
deploy: open each brand with `?asesor=1`, copy one real quote, compare with the cards.
