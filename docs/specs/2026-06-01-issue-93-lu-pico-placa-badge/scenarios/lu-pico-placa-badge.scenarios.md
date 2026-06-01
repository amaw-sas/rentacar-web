---
name: lu-pico-placa-badge
created_by: claude
created_at: 2026-06-01T00:00:00Z
issue: 93
---

# LU category shows the "sin pico y placa" badge (#93)

Holdout for the post-search category card badge. Root cause (code-verified):
the "sin pico y placa" badge in `CategoryTags.vue` (triplicated across the 3
brands) is gated on `hasPicoyPlaca()` from `useCategory.ts` (the single source
of truth in the `logic` layer). That function is

```ts
const hasPicoyPlaca = (): boolean =>
  (categoryCode.value) ? ["FU", "FL", "GL", "LY", "LP"].includes(categoryCode.value) : false;
```

`LU` belongs to the pico-y-placa-exempt "L" family (alongside `LP` and `LY`)
but was missing from the whitelist, so `hasPicoyPlaca()` returned `false` for
`LU` and its card never rendered the badge.

Fix: add `"LU"` to the whitelist. Since the body is
`categoryCode ? WHITELIST.includes(categoryCode) : false`, the array membership
set IS the observable behavior — pinning the literal pins the scenario. `LU` is
already a member of the `CategoryType` union, so the change is type-safe.
The guarantee holds in all 3 brands because they share the same `hasPicoyPlaca`.

## SCEN-LU-1: LU is exempt → badge renders
**Given**: a category whose `categoryCode` is `"LU"`
**When**: `hasPicoyPlaca()` is evaluated (CategoryTags.vue `v-if` gate)
**Then**: it returns `true` and the `<span>sin pico y placa</span>` renders
**Evidence**: `useCategory.hasPicoyPlaca.test.ts` — whitelist contains `"LU"` (RED before the fix, GREEN after)

## SCEN-LU-2: a non-exempt category does not get the badge
**Given**: a category whose `categoryCode` is `"C"` (most-rented economy, not exempt)
**When**: `hasPicoyPlaca()` is evaluated
**Then**: it returns `false` — no badge
**Evidence**: `useCategory.hasPicoyPlaca.test.ts` — whitelist does not contain `"C"`

## SCEN-LU-3: prior exempt categories stay exempt (no regression)
**Given**: categories `FU`, `FL`, `GL`, `LY`, `LP`
**When**: `hasPicoyPlaca()` is evaluated for each
**Then**: every one returns `true` — none dropped from the whitelist
**Evidence**: `useCategory.hasPicoyPlaca.test.ts` — whitelist still contains all five

## SCEN-LU-4: the badge gate is locked in source (all 3 brands)
**Given**: each brand's `app/components/CategoryTags.vue`
**When**: the badge `<span>` is inspected
**Then**: it is gated on `hasPicoyPlaca()` and reads `sin pico y placa`
**Evidence**: `grep` of `hasPicoyPlaca` in the three `CategoryTags.vue` — all gate identically on the shared single source
