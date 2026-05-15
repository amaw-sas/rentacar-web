# Issue #50 — Toast overflows mobile viewport in availability searcher

- **Issue:** https://github.com/amaw-sas/rentacar-web/issues/50
- **Date:** 2026-05-15
- **Branch:** `fix/issue-50-mobile-toast-overflow`
- **Type:** bug fix (UI / shared config)
- **Scope:** all 3 brands via shared `uiConfig` (single fix point)

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
  per-call `ui.root` override (`bg-white text-gray-900`).
- `packages/ui-{brand}/app/app.vue:10` — identical in all 3 brands:
  `const toaster = { expand: true, position: "top-center", duration: 10000 }`.
- `packages/logic/src/config/ui.config.ts` — shared `uiConfig`, consumed by every
  brand's `app.config.ts` as `ui: uiConfig`. **No `toast`/`toaster` override
  exists today.**

## Root cause (hypothesis — confirmed at runtime before fix is finalized)

@nuxt/ui 4.2.1's default `toaster` theme already constrains the viewport
correctly:

```
viewport (base):        fixed flex flex-col w-[calc(100%-2rem)] sm:w-96 z-[100] ...
viewport (top-center):  left-1/2 transform -translate-x-1/2
compound (top-*):       viewport: top-4
```

`@import "@nuxt/ui";` is present in every brand's `main.css`, so Tailwind v4
scans the package source and these utilities are generated. Therefore the
default *should* render correctly — which means **something in this project
defeats it**. Candidate causes, to be discriminated by runtime inspection:

- A CSS specificity / `transform` conflict (note the inline critical CSS in
  `app.vue` and `transform-(--transform)` on the toast `base` slot).
- A `tailwind-merge` collision introduced by the per-call `ui.root` override in
  `useMessages`.
- The `expand: true` interaction with viewport sizing.

**Gate:** the exact cause is pinned via `/agent-browser` reproduction at 427px,
inspecting the computed style of the `[data-slot="viewport"]` toaster element
and the toast `[data-slot="root"]`. No code change is committed before this
runtime evidence exists (per `/systematic-debugging`).

## Fix approach

Add a `toaster` entry to the shared `uiConfig` in
`packages/logic/src/config/ui.config.ts` that hard-constrains the viewport
independent of the default theme:

- Mobile (`<sm`): full available width minus lateral inset —
  `max-w-[calc(100vw-2rem)]`, never exceeding the viewport.
- Desktop (`≥sm`): preserve the default `~24rem` (`sm:w-96`) width and the
  `top-center` placement.

The override is **additive** — it only adds a `toaster` key to `uiConfig`; no
existing key is modified. The exact class string is finalized against the
runtime-inspected element so it composes correctly with the @nuxt/ui default
theme via `tailwind-merge` (verified, not assumed).

This is defensive by design: the constraint holds even if the default theme is
being overridden or defeated elsewhere, and it is the single point that
propagates to all 3 brands through `app.config.ts`.

## Blast radius

- **Modified:** `packages/logic/src/config/ui.config.ts` — one file, one new
  additive `toaster` key.
- **Consumers:** `app.config.ts` of alquilatucarro / alquilame / alquicarros
  (`ui: uiConfig`) → applies globally to the @nuxt/ui Toaster. No other
  `uiConfig` behavior changes.
- **Untouched:** `useMessages.ts`, server routes, per-brand `app.vue`, types,
  public API, docs.

## Out of scope

- No change to toast content, copy, duration, position semantics, or the
  `useMessages` API.
- No redesign of the availability searcher validation flow.
- No general refactor of `uiConfig` or unrelated @nuxt/ui slots.

## Observable scenarios (SDD holdout)

1. **Given** the alquilatucarro home at 414px width, **when** the "fuera de la
   sede seleccionada" validation toast fires, **then** the toast box is fully
   within the viewport (left edge ≥ 0, right edge ≤ viewport width) with ≥16px
   lateral inset and **no horizontal scrollbar** appears.
2. **Given** that toast is shown, **when** it renders, **then** both the title
   and the full description text are visible (not clipped on any edge).
3. **Given** a desktop viewport ≥640px, **when** a toast fires, **then** it
   keeps the ~24rem width centered at top — **no regression** vs. current
   desktop behaviour.
4. **Given** alquilame and alquicarros at 414px, **when** an equivalent
   validation toast fires, **then** scenarios 1–2 hold for those brands too
   (shared fix verified per brand, not assumed).

## Verification strategy

- **Runtime (primary):** `/agent-browser` on alquilatucarro at 414px — trigger
  the sede validation, assert toast bounding box within viewport, no horizontal
  overflow, title + description readable; zero console errors / failed requests.
  Repeat smoke for alquilame and alquicarros.
- **Regression:** desktop ≥640px screenshot/box check — width and centering
  unchanged.
- **Static:** `pnpm typecheck` delta vs. baseline (baseline is red ~1531 errors;
  acceptance = no *new* errors introduced by this change).
- **/dogfood** exploratory pass on the searcher after the fix.
