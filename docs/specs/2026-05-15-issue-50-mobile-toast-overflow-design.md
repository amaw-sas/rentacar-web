# Issue #50 — Toast overflows mobile viewport in availability searcher

- **Issue:** https://github.com/amaw-sas/rentacar-web/issues/50
- **Date:** 2026-05-15
- **Branch:** `fix/issue-50-mobile-toast-overflow`
- **Type:** bug fix (UI / shared config)
- **Scope:** all 3 brands, single shared fix point (exact file contingent on
  root cause — see Remedy table)

## Problem

At viewport ≤480px, triggering the "está por fuera de la sede seleccionada"
validation toast in the availability searcher renders the toast clipped at the
top-left corner and partially off-screen. The title and most of the description
are unreadable; there is no lateral padding and the toast does not respect the
viewport width.

Reported on alquilatucarro at ~427px. Reproduction:

1. Open the alquilatucarro home at viewport ≤480px.
2. In *Consulta disponibilidad y precios*, pick `Lugar de recogida` and
   `Lugar de devolución` that trigger the sede validation.
3. Press **BUSCAR VEHÍCULOS**.
4. Observe the toast clipped in the top-left corner.

## Affected surface

- `packages/logic/src/composables/useMessages.ts` — `useToast().add(...)` with a
  per-call `ui.root` override (`bg-white text-gray-900`, plus icon/title/desc).
- `packages/ui-{brand}/app/app.vue:10` — identical in all 3 brands:
  `const toaster = { expand: true, position: "top-center", duration: 10000 }`.
- `packages/logic/src/config/ui.config.ts` — shared `uiConfig` (`as const`,
  slots/variants per @nuxt/ui component), consumed by every brand's
  `app.config.ts` as `ui: uiConfig`. **No `toast`/`toaster` override today.**

## Ground truth — @nuxt/ui 4.2.1 default `toaster` theme

Read from the installed package source:

```
viewport (base):       fixed flex flex-col w-[calc(100%-2rem)] sm:w-96 z-[100]
                        data-[expanded=true]:h-(--height) focus:outline-none
viewport (top-center): left-1/2 transform -translate-x-1/2
compound (top-*):      viewport += top-4 ; base += top-0
toast root slot:       relative group overflow-hidden bg-default shadow-lg
                        rounded-lg ring ring-default p-4 flex gap-2.5
                        focus:outline-none
toast base slot:       ... transform-(--transform) ...   (CSS vars set by JS / Reka UI)
```

Key facts the fix must respect:

- The default viewport already uses **`100%`** (not `vw`) for width and lateral
  inset — deliberately, because `100vw` includes the scrollbar gutter and itself
  causes horizontal overflow on a scrolling page. **Any fix MUST use `100%`,
  never `vw`.**
- Desktop width is `sm:w-96` = **24rem = 384px**, centered via
  `left-1/2 -translate-x-1/2`. This exact value is the desktop regression
  baseline.
- Width/inset live on the **viewport** slot; the **root** slot has no width
  constraint and `overflow-hidden` — intrinsic content width can still force the
  toast wider than the viewport if the viewport sizing is defeated.
- `@import "@nuxt/ui";` is present in every brand `main.css`, so Tailwind v4
  generates all these utilities. The default *should* render correctly →
  **something in this project defeats it**. The fix is derived from which.

## Root-cause investigation (gate — precedes any code change)

Per `/systematic-debugging`: no code is committed before runtime evidence.
Reproduce on alquilatucarro at the reported viewport via `/agent-browser`,
then inspect the live DOM to discriminate between candidate causes by reading
the **computed style and bounding rects** of:

- the toaster viewport element `[data-slot="viewport"]`
- the toast `[data-slot="root"]` element
- the per-call `ui.root` classes actually applied (resolved by tailwind-merge)

Discriminating observations → cause:

| Observation at repro viewport | Root cause | Remedy |
|---|---|---|
| Viewport element lacks `position:fixed`, `width`, or the `left-1/2 / translate` transform (default classes absent from computed style) | **C1** — default viewport theme not applied (override/specificity defeats it) | R1 |
| Viewport correctly sized & centered, but toast `root` `scrollWidth > clientWidth` (content forces intrinsic width past the viewport) | **C2** — root slot has no min-width:0 / wrapping; long unbroken text overflows | R2 |
| `ui.root` per-call override (from `useMessages.ts`) collides under tailwind-merge and strips/relocates a positioning or width class | **C3** — per-call override is the collision source | R3 |
| Viewport `transform` value is wrong because `--transform`/`-translate-x-1/2` interact (toast `base` transform vs viewport transform) or inline critical CSS conflicts | **C4** — transform conflict | R4 |

The investigation MUST conclude with exactly one identified cause (C1–C4)
recorded in the SDD evidence before implementation. If evidence is ambiguous
between two causes, apply both remedies (they are non-conflicting).

## Remedy table (fix is derived from the identified cause)

All remedies keep the single-shared-point principle where the cause allows.

- **R1 — re-assert viewport constraint in shared `uiConfig`.** Add a `toaster`
  key to `packages/logic/src/config/ui.config.ts` whose `slots.viewport`
  *replaces* the defeated classes with an equivalent, higher-specificity set:
  `fixed`, **`w-[calc(100%-2rem)]`** (100%, not vw), `sm:w-96`, plus the
  `top-center` placement (`left-1/2 -translate-x-1/2 top-4`). State explicitly
  which default classes are being overridden. Blast radius: `ui.config.ts` only.
- **R2 — constrain the root/wrapper in shared `uiConfig`.** Add `toaster` (or
  `toast`) key with `slots.root`/`slots.wrapper` adding `min-w-0` and
  `break-words` so content cannot exceed the (correctly sized) viewport.
  Augments, does not fight, the default `w-` group. Blast radius: `ui.config.ts`
  only.
- **R3 — remove the colliding per-call override.** Move the styling currently
  passed per-call in `useMessages.ts` (`ui: { root: 'bg-white …' }`) into the
  shared `uiConfig` `toast` slots so tailwind-merge resolves once, globally,
  without per-call collision. **Blast radius extends to
  `packages/logic/src/composables/useMessages.ts`** — this spec is revised and
  re-reviewed before that broader change.
- **R4 — isolate the transform.** In shared `uiConfig`, set the `toaster`
  `slots.viewport` centering without relying on `transform` (e.g.
  `inset-x-0 mx-auto` + `max-w` instead of `left-1/2 -translate-x-1/2`), so the
  viewport transform cannot interact with the toast `base` `--transform`. Blast
  radius: `ui.config.ts` only.

`tailwind-merge` note: `max-w-*` and `w-*`/`sm:w-*` are **different property
groups** — a `max-w` addition does NOT override the default `w-96`. Therefore
R1/R4 must override the `w-*` classes directly (same group) to take effect; a
`max-w`-only patch would be silently inert on desktop and is rejected. The exact
final class string is validated against the runtime-inspected computed style
(verified, not assumed) and recorded in SDD evidence.

## Blast radius

- **Baseline (R1/R2/R4):** `packages/logic/src/config/ui.config.ts` — one file,
  one additive `toaster`/`toast` key; no existing key modified.
- **Conditional (R3 only):** also `packages/logic/src/composables/useMessages.ts`
  — spec revised + re-reviewed before applying.
- **Consumers:** `app.config.ts` of alquilatucarro / alquilame / alquicarros
  (`ui: uiConfig`) → applies globally to the @nuxt/ui Toaster. No other
  `uiConfig` behavior changes.
- **Untouched:** server routes, per-brand `app.vue`, types, public API, docs,
  toast copy/duration/position semantics.

## Out of scope

- No redesign of the availability searcher validation flow.
- No general refactor of `uiConfig` or unrelated @nuxt/ui slots.
- No change to toast copy, duration, or `position` semantics (placement stays
  top-center).

## Observable scenarios (SDD holdout)

Oracles are DOM-level and machine-assertable (bounding rects / `scrollWidth`),
not screenshot eyeballing.

1. **Given** alquilatucarro home at **414px** viewport width, **when** the
   "fuera de la sede seleccionada" validation toast fires, **then** the toast
   `[data-slot="root"]` `getBoundingClientRect()` satisfies `left >= 0` AND
   `right <= window.innerWidth`, AND `document.documentElement.scrollWidth <=
   window.innerWidth` (no horizontal scrollbar), AND the toast left/right insets
   are each ≥ 16px.
2. **Given** that toast is shown, **when** it renders, **then** the toast root
   has `scrollWidth <= clientWidth` (no clipped/overflowing content) AND the
   description element's bounding rect is fully contained within the toast root's
   bounding rect (title + full description not clipped on any edge).
3. **Boundary — Given** alquilatucarro home at **479px** and again at **481px**,
   **when** the toast fires, **then** scenario 1's assertions hold at both
   widths (discriminates a breakpoint bug from a content-overflow bug; both are
   below the `sm` 640px breakpoint, so mobile sizing must apply at both).
4. **Regression — Given** a desktop viewport at **1024px** (≥ sm 640px),
   **when** a toast fires, **then** the toast root width is **384px** (`w-96`,
   ±1px) AND it is horizontally centered (`|center − window.innerWidth/2| ≤
   1px`), matching the captured pre-fix desktop baseline.
5. **Cross-brand — Given** alquilame and alquicarros at **414px**, **when** an
   equivalent validation toast fires, **then** scenarios 1–2 hold for each brand
   (verified per brand via `/agent-browser`, not assumed from shared config).

## Verification strategy

- **Pre-fix baseline capture (required before any change):**
  - Desktop 1024px: record toast root width + center → expected `384px`,
    centered (feeds scenario 4).
  - alquilatucarro 414px: record the failing state + the discriminating DOM
    observations from the Root-cause table → identify C1–C4 in SDD evidence.
  - Console + network at repro: record baseline error/request set (project
    baseline is noisy/red) → console/network acceptance is **delta vs. this
    baseline**, not absolute zero (consistent with typecheck delta policy).
- **Runtime (primary):** `/agent-browser` re-run of scenarios 1–5 post-fix;
  all DOM oracles pass; **no new** console errors / failed requests vs. baseline.
- **Static:** `pnpm typecheck` — acceptance = no *new* errors vs. the known red
  baseline (~1531 errors); delta only.
- **/dogfood** exploratory pass on the searcher after the fix.
- **Gate:** `/verification-before-completion` with fresh evidence before any
  completion claim, commit of the fix, or PR.
