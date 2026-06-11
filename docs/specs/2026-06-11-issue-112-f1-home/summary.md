# Planning Summary: F1 — Reskin del home alquilame

**Date:** 2026-06-11
**Goal:** Portar el home del diseño nuevo de alquilame (Astro → Nuxt) a `packages/ui-alquilame/`, sobre la fundación F0, preservando engine/SEO/data-testid.

## Artefactos
- `docs/specs/2026-06-11-issue-112-f1-home-design.md` — detailed design (spec, aprobada; holdout SCEN-F1-01..13).
- `docs/specs/2026-06-11-issue-112-f1-home/implementation/plan.md` — file map + 10 pasos SDD (steps 7→7a/7b).
- `docs/specs/2026-06-11-issue-112-f1-home/summary.md` — este archivo.

## Decisiones clave
1. **Híbrido + datos reales**: secciones presentacionales como componentes Vue nuevos (`app/components/home/*`); engine (hero `SelectBranch`, fleet) preservado y restilizado; datos reales de la app, no copy de marketing del mockup.
2. **Fleet con precio real sin ciudad**: `pickRepresentativeDailyPrice` sobre `categories` (global por código, no por-ciudad) → "Desde $X/día" funciona en el home; 4 categorías representativas con nombres curados; fail-soft sin $0. Toggle Diario/Mensual y 6-cards del mockup → fuera de F1.
3. **Limpieza honesta de schema**: eliminar sección video/60% + `usePromoVideoSchema` + `useEarlyBookingPromotion` (el diseño no surface el 60%). `useHomeAggregateRating` roto = deuda pre-existente, no se toca (no-regresión).
4. **Marquee "Empresas Aliadas" es texto** (no logos — no hay assets en el dist). FAB de contacto = restyle in-place del `ChatWidget` ya montado en el layout (no duplicar).
5. **Cities reales internas** `/[city]` (Supabase, no config; no wa.me). Headline value-props desde `organization.brand`. Headings adoptan `.heading-*` → Plus Jakarta (cierra deuda F0-03).

## Revisiones (gate)
- Spec-review: 2 iteraciones → **Approved** (corrigió cities/FAQs=Supabase, rating roto, precio sin-ciudad, schemas promo, secciones faltantes, whatsapp URL).
- Plan-review: 2 iteraciones → assets de aliados son texto no logos (corregido); fleet curated names, organization.brand, FAB in-place, grep acotado — todos resueltos.

## Complejidad
- **Overall:** M-L · **Pasos:** 10 (≤ M c/u) · **Riesgo:** Bajo-Medio (engine preservado; mayor riesgo = fidelidad visual y fleet-precio sin ciudad, ya resuelto técnicamente).

## Próximos pasos
1. `sop-task-generator` → `.code-task.md` por paso.
2. Implementar (worktree `issue-112-f1-home`), runtime en preview Vercel, PR `Refs #112` (NO Closes — F3 cierra #112).

## Open questions / deuda declarada
- Duplicación local de la lista de categorías representativas (aislamiento F1; extraer a logic = fase posterior).
- `useHomeAggregateRating` roto (rating hardcoded, schema posiblemente ausente) — deuda pre-existente, fuera de F1.
- Toggle Diario/Mensual del fleet — F1 lo omite.
