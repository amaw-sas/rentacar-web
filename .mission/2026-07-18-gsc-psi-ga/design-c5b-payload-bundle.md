# C5b design note — perf/payload-bundle (wave 3, high blast radius)

Orchestrator constraints for the implementing agent. Read findings-perf.md PERF-1, PERF-2, PERF-7 first.

## Why this needs a design note
PERF-1/2/7 touch the data-loading spine (global catalog payload, entry bundle, critical CSS). A naive fix breaks reservation flows or reintroduces CLS. Wave-1/2 branches touch neighboring files — C5b MUST start after C1/C2/C5a PRs exist, branching from main, and must not edit files those PRs changed without noting the overlap in the PR body.

## Scope decisions (already made — do not relitigate)
1. **PERF-1 (catalog payload on every route):** move catalog fetch from global to route-level (city/search/reservas pages need it; blog/legal/gana do not). Keep a shared composable with lazy: true + server-side caching; do NOT change the Supabase query shape (a dashboard shortage-RPC depends on catalog reads staying as-is).
2. **PERF-2 (initial JS):** target the 141-157KiB unused-JS finding via dynamic imports of below-the-fold/interaction-only components (chat widget internals, carousel, drawers). No router-level code-split experiments; Nuxt already splits per-page — the win is component-level defineAsyncComponent for interaction-gated UI.
3. **PERF-7 (22KB critical CSS repeated):** deduplicate into the layout once; verify no FOUC on ISR pages before/after with a preview-deploy screenshot pair.

## Non-goals
- No dependency upgrades. No Vite config gymnastics. No changes to analytics loading (PERF-3 verdict: stays eager — see fix list).

## Acceptance
- Vercel preview: city page + home render identically (screenshot pair), reservation flow completes (manual click-through on preview), and the entry JS for / and /bogota is measurably smaller (report before/after KiB from build output or network tab).
- INP/long-task relief is a bonus, not the gate; the gate is "no functional or visual regression + smaller shipped JS".
