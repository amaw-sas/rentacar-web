# Planning Summary — Issue #129 city↔branch validation

**Date:** 2026-06-22
**Goal:** La búsqueda valida que la sucursal de recogida pertenezca a la ciudad de la página; el botón BUSCAR re-dispara la búsqueda aunque la URL no cambie.

## Artifacts Created
- `design.md` — diseño aprobado (reviewer + usuario). Invariante, helper puro, 6 escenarios, riesgos.
- `implementation/plan.md` — plan SDD de 8 steps (file-map + fases). APPROVED por plan-reviewer.
- `summary.md` — este documento.

## Key Decisions
1. **Fix en middleware existente, no nuevo:** `validateSearchParams.ts` ya resuelve branches/cityContext y redirige.
2. **Decisión extraída a helper puro en `packages/logic`** (`resolveCityBranchCorrection.ts`): testeable con el harness Vitest existente + deduplica el bloque ×3 (decisión del usuario, idiomática con `architecture.md`).
3. **Invariante:** solo la **recogida** debe ser de la ciudad; la **devolución** puede diferir (one-way válido). Reset de ambos solo cuando el pickup es foráneo.
4. **Solo el tier de ciudad** (no fallback a `bogota`) → loop-safe por construcción.
5. **Botón:** `@click` que re-dispara `doSearch()` cuando el destino == ruta actual (solo página base de resultados; `/categoria/...` siempre navega).

## Complexity Estimate
- **Overall:** S–M
- **Duration:** ~1 jornada (8 steps, ninguno > M)
- **Risk Level:** Low — cambios aditivos, sin migraciones, sin tocar stores/composables existentes.

## Recommended Next Steps
1. Implementar bajo `/scenario-driven-development` con los 6 escenarios como holdout.
2. Orden: Step 1 (helper+test) → Steps 2–3 (middleware) → Steps 4–5 (Searcher) → Step 6 (E2E) → Steps 7–8 (QA + audit).
3. Verificación runtime obligatoria (agent-browser + dogfood en :4000) antes de PR.
4. PR con `Closes #129`; cambiar a cuenta `pabloandi` para crear (`reference_gh_pr_account_switch`).

## Open Questions / Deferred
- **Ciudades sin sucursales** (Riesgo #2): el fix degrada (deja pasar) en ese caso; auditoría en Step 8, escalado upstream si aplica — NO gating del merge.
