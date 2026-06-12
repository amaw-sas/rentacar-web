# F4 Blog reskin — Implementation Plan

**Spec:** `docs/specs/2026-06-12-issue-112-f4-blog-design.md` (APPROVE-WITH-FIXES, gaps cerrados)
**Worktree:** `.worktrees/issue-112-f4-blog` · branch `feat/issue-112-f4-blog`

## File structure (dueños)

| Archivo | Dueño de | Step |
|---|---|---|
| `app/pages/blog/index.vue` | Listado completo (hero, featured, filtros, grid, empty, CTA footer) | 01 |
| `app/pages/blog/__tests__/index.test.ts` (NEW) | Guard de marca del listado (source-text asserts) | 01 |
| `app/pages/blog/[...slug].vue` | Detalle completo + `<style>` prose MDC | 02 |
| `app/assets/css/rentacar-main/blog.css` | Callouts/admonitions del MDC | 02 |
| `app/pages/blog/__tests__/slug.test.ts` (NEW) | Guard de marca del detalle (source-text asserts) | 02 |

Tests = **source-text assertions** (leer el `.vue`/`.css` como string y asercionar regex), patrón F0 `tests/f0-chrome.test.ts` — sin montar componentes, sin mockear `$fetch`/composables. Entorno node, solo vitest.

## Steps

1. **Step 01 — Reskin `blog/index.vue` + guard** | Size: M | Dependencies: none
   Establece el patrón de card de marca (reusado en relacionados del detalle). Hero contenido brand (font-heading+white), featured/grid cards a tokens brand, badges/filtro-activo/hovers `red-*`→`brand-*`, grounds `bg-gray-100`→`bg-surface-soft`, panel CTA footer `bg-gray-900`→`bg-brand-900`+`[--ctx-text-primary:#fff]`, CTA `:155` `to="/"`→`/reservas`. Preservar comportamiento de filtros, SEO, schema, textos/href. + `index.test.ts`.

2. **Step 02 — Reskin `blog/[...slug].vue` + `blog.css` + guard** | Size: M | Dependencies: Step 01 (reusa patrón de card)
   Hero overlay `bg-gradient-to-t`→`bg-linear-to-t` (`:19`), título `.heading-*`/white sobre imagen, meta intacta. Sidebar (TOC/tags/share/CTA): 3 paneles `bg-gray-50`→surface, share platform preservado + copy gris→brand, CTA `:143`→`/reservas`. Bio card `:158`→surface + CTA `:175`→`/reservas`. Relacionados (reusa card brand). Back button `:230`→surface+acento. 404 `:275`→brand. `<style>` prose `:526-670`: red-700 `rgb(185,28,28)`→brand #CC022B (links/blockquote/code). `blog.css`: acentos callout→brand. Preservar BlogPosting/BreadcrumbList/article-meta, TOC, reading-progress, MDC render. + `slug.test.ts`.

## Testing Strategy

- **Unit:** `pnpm --filter ui-alquilame exec vitest run app/pages/blog` (desde worktree) — guards de marca verdes.
- **Typecheck:** delta 0 vs baseline (`/tmp/f4-baseline-tc.log`).
- **Aislamiento:** `git diff main --stat` solo `packages/ui-alquilame` + docs.
- **Runtime (Vercel preview, agent-browser):** /blog + /blog/[slug] real — SCEN-F4-01..14.
- **E2E:** `BRAND=alquilame e2e/blog.spec.ts` vs preview, delta 0.

## Rollout

Push branch → Vercel preview auto → runtime verify → verification-before-completion → PR `Closes #112` (gh auth switch pabloandi).
