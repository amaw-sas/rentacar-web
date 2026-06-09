---
name: store-search-data-map-lookup
created_by: pablo
created_at: 2026-06-09T00:00:00Z
issue: 15
---

# Issue #15 — Map lookup replaces O(n·m) find in useStoreSearchData

Performance refactor with **zero observable behavior change**. The `categories`
computed and the monthly branch of `search()` merge admin rows with availability
rows. The merge currently does `Array.find()` inside `.map()` (O(n·m)); the
refactor swaps it for a `Map<categoryCode, row>` lookup (O(n+m)) and simplifies
the comparator. These scenarios are the holdout: the merged output and ordering
must be byte-for-byte identical before and after.

> Issue Finding 1 (collapse the multi-pass filter chain + hoist hardcoded
> allow-lists to Sets) is **obsolete**: issue #28 already replaced that chain
> with a single `isCategoryVisibleInCity(...)` pass driven by the dashboard.
> No scenario covers it because the code it describes no longer exists.

## SCEN-001: categories merges availability by code, unmatched become unable cards, sorted ascending
**Given**: admin data with categories `[B, C, D]` and a non-monthly availability
payload carrying rows for `C` (estimatedTotalAmount 80000) and `B`
(estimatedTotalAmount 120000), with no row for `D`
**When**: `store.categories` is read
**Then**: it returns 3 entries — `C` and `B` carry their availability amounts
plus admin metadata (`categoryModels`, `categoryMonthPrices`), `D` is an unable
card (estimatedTotalAmount 999999999) — ordered ascending by estimatedTotalAmount
as `[C(80000), B(120000), D(999999999)]`
**Evidence**: `store.categories.map(c => [c.categoryCode, c.estimatedTotalAmount])`
=== `[['C',80000],['B',120000],['D',999999999]]`

## SCEN-002: duplicate availability codes resolve to the FIRST occurrence (Array.find semantics)
**Given**: admin data with category `[C]` and an availability payload containing
two rows for code `C` — the first with estimatedTotalAmount 50000, the second
with 90000
**When**: `store.categories` is read
**Then**: the merged `C` entry uses the first row (50000), never the last — a
naive `new Map(entries)` would keep the last and silently regress
**Evidence**: `store.categories.find(c => c.categoryCode === 'C').estimatedTotalAmount`
=== `50000`

## SCEN-003: monthly branch copies returnFeeAmount from the matching availability row by code
**Given**: a monthly reservation, admin categories `C` and `LE` both offering
monthly pricing, and an availability dataArray with `returnFeeAmount` `{C: 30000, LE: 45000}`
**When**: `search()` completes
**Then**: each entry in `categoriesAvailabilityData` carries the `returnFeeAmount`
of its own code — `C → 30000`, `LE → 45000`
**Evidence**: `categoriesAvailabilityData` mapped to `[categoryCode, returnFeeAmount]`
includes `['C',30000]` and `['LE',45000]`

## SCEN-004: existing store suite stays green (no behavioural regression)
**Given**: the full `useStoreSearchData.*.test.ts` suite (admin reactivity,
monthly exclusion, LLNRAG009 unable cards, error toast, reset flag)
**When**: the refactor is applied
**Then**: every existing spec still passes — the merge/sort/monthly paths they
exercise are unchanged
**Evidence**: `pnpm --filter @rentacar-main/logic test` exit code 0, all
`useStoreSearchData` specs PASS
