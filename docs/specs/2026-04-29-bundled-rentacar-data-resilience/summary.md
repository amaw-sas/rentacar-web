# Planning Summary — Bundled fix #2 + #3 + #4

**Date:** 2026-04-29
**Goal:** Resolver 3 issues acoplados por error path compartido (`plugin rentacar-data → useFetchRentacarData → consumers`) en un solo PR con typecheck-green entre pasos.

## Artifacts Created

- **Spec aprobado:** `docs/specs/2026-04-29-bundled-rentacar-data-resilience-design.md`
  - Producto de `/brainstorming` con 5 Q&A lockeadas (A/A/A/E/G)
  - 3 iteraciones de spec-document-reviewer hasta APPROVED
  - 9 observable scenarios + 1 verificación empírica V6.1
- **Implementation plan:** `docs/specs/2026-04-29-bundled-rentacar-data-resilience/implementation/plan.md`
  - 6 steps ordenados, S/M complexity
  - 2 iteraciones de plan-document-reviewer hasta APPROVED
  - File structure map con responsabilidad única por archivo
  - Acceptance criteria por step incluyendo typecheck-green entre pasos
  - Test mapping completo: 7 unit Vitest + 1 e2e Playwright + 1 manual

## Key Decisions

1. **Scope mínimo (#2 + #3 + #4)** — #7 hardening queda fuera; bundle por root cause compartido, no proximidad temática.
2. **Fail loud build/SSR + fail soft cliente con sentinel inmutable** — la rama del plugin cliente es vestigial con SSR habilitado; el sentinel solo importa en `useFetchRentacarData()` para resolver la corrupción de Pinia factory.
3. **NULL = dato faltante, `?? 12000` queda como guardrail** — semántica explícita; defaults se conservan post-migración como defense-in-depth.
4. **Sin cambio routeRules ISR** — Nuxt 4 no expone `staleMaxAge` para `isr`; comportamiento Vercel ante 5xx queda como verificación empírica V6.1 post-deploy.
5. **Tipo `ExtrasData` consolidado en `src/utils/types/data/ExtrasData.ts`** — elimina duplicación server/cliente; `transformers.ts` importa el tipo en lugar de definirlo.
6. **Migración SQL out-of-scope** — va a issue separado en `rentacar-dashboard`; orden: código primero (tolera NULL), después backfill, después `SET NOT NULL`.

## Complexity Estimate

- **Overall:** M
- **Per step:** 2 × S, 4 × M = 6 steps
- **Duration:** 6–10 horas focales
- **Risk Level:** Low — cambios contenidos, typecheck-green entre pasos garantizado por análisis pre-implementación, rollback trivial (single-revert)

## Recommended Next Steps

1. **`/scenario-driven-development`** con el plan como input. SDD ejecuta los 6 steps secuencialmente, escribiendo el scenario antes del código en cada step (Iron Law).
2. Post-implementación: `/verification-before-completion` antes de PR.
3. Post-merge: V6.1 manual en preview Vercel; abrir issue `rentacar-dashboard` con migración SQL.

## Open Questions / Deferred

- **V6.1 outcome (post-deploy):** ¿Vercel mantiene cache previa ante 5xx revalidation o cachea `error.vue`? Si lo último → issue follow-up para investigar headers Cache-Control manuales o `cache: { swr, staleMaxAge }` directo. **No bloquea merge.**
- **Migración SQL en `rentacar-dashboard`:** owned por DBA; este repo solo deja documentación (spec §4) + referencia cruzada en commit message.

## Workflow Position

```
✅ /brainstorming           — design + 5 decisiones lockeadas
✅ Spec aprobado            — 3 iteraciones spec-reviewer
✅ /sop-planning            — plan aprobado en 2 iteraciones plan-reviewer
⏳ /scenario-driven-development — siguiente
⏳ /verification-before-completion — pre-PR
⏳ /pull-request            — quality gate (code-reviewer + security + edge + perf)
```
