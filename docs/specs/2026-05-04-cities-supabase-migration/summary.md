# Planning Summary — Cities Supabase Migration (Issue #6, Ola 1)

**Date**: 2026-05-04 → 2026-05-05
**Goal**: Migrar `cities.config.ts` (1452 líneas) a Supabase como Phase 4 / Ola 1 de 5 del plan firebase→vercel-supabase.

## Artifacts Created

| Path | Propósito |
|---|---|
| `docs/specs/2026-05-04-cities-supabase-migration-design.md` | Design doc aprobado (7 secciones), spec-reviewer status: Approved. |
| `docs/specs/2026-05-04-cities-supabase-migration/scenarios/cities-supabase-migration.scenarios.md` | Holdout: 11 SCEN observables (Given/When/Then + evidence + mapping a layer + anti-reward-hacking). |
| `docs/specs/2026-05-04-cities-supabase-migration/implementation/plan.md` | Plan ordenado de 11 steps, plan-reviewer status: Approved. |
| `docs/specs/2026-05-04-cities-supabase-migration/summary.md` | Este archivo. |

**Skipped phases del skill** (innecesarias):
- `rough-idea.md` — issue #6 cumple esa función.
- `idea-honing.md` — Q&A capturado en transcript de brainstorming.
- `research/` — repo exploration ya hizo el trabajo (cities.config.ts shape, consumers, sentinel pattern, ISR/prerender behavior).

## Key Decisions

1. **Supabase, no nuxt-content híbrido**. Goal explícito del usuario: "evitar islas de información". Costo SEO = cero porque SSR+ISR+prerender ya populan HTML server-side.
2. **Plan B (un PR por archivo) sobre Big Bang**. Reviews chicos, schema iterativo, menos conflicto con ramas paralelas (#2/#3/#4/#10).
3. **Testimonios como JSONB en `cities`** (no tabla satélite). Rara vez se modifican; simplicidad gana.
4. **Extender `/api/rentacar-data`** (no endpoint nuevo). Cities viajan al mismo HTML que las queries de reservas.
5. **`City.link` field eliminado** (dead code, grep confirmó zero consumers).
6. **Validación con Valibot** (ya dep del proyecto). Filter silencioso de testimonios malformados.
7. **Backfill via JSON snapshot + script idempotente**. Sobrevive al delete eventual de `cities.config.ts`.
8. **Issues derivados durante el diseño**: #11 (franchise.testimonials), #12 (faqs.config.ts — revoca decisión Phase 4 de mantener hardcoded).

## Complexity Estimate

- **Overall**: Medium.
- **Duration**: 6-10 horas de trabajo neto (excluyendo el gate humano de Step 7 que requiere coordinación inter-repo).
- **Risk Level**: Medium. El gate humano (apply schema en rentacar-dashboard + backfill) es el punto donde una mala configuración de RLS o env vars puede bloquear el avance.

## Recommended Next Steps

1. **Confirmar acceso a rentacar-dashboard** y a Supabase service role antes de arrancar. El Step 7 del plan requiere ambos.
2. **Iniciar implementación con `/scenario-driven-development`** comenzando por el Step 1 del plan (snapshot data.json) — es el primer paso sin bloqueos externos.
3. **Mantener la worktree aislada** en `.worktrees/cities-migration` durante la implementación; solo abrir PR cuando los Steps 1-11 estén verificados localmente.
4. **Después del merge de este PR**: programar olas 2-5 (useCityContent, useCityFAQs, useCityRelations, useCityProductSchema) usando el patrón de schema/transformer/endpoint establecido en esta ola.

## Open Questions / Risks Carried Forward

- **¿Existe RLS policy `SELECT anon` en `cities`?** Pendiente verificación con `curl supabase-url/rest/v1/cities?select=slug --header "apikey: ANON_KEY"` antes del Step 7. Si no existe, agregar la policy.
- **¿Las 3 marcas siguen requiriendo el mismo contenido por ciudad?** Asunción mantenida (verificado en `app.config.ts`); divergencia futura requiere refactor a tabla `cities × brand` (issue separado).
- **Step 7 partial failure**: si backfill falla en algunas filas y no en otras, el script es idempotente — re-correr arregla. Si después de 2-3 intentos falla, abrir issue con output completo.

## Pipeline downstream

- `/scenario-driven-development` recibe el holdout de 11 scenarios + el plan de 11 steps. SDD anchora el primer scenario al primer step funcional, implementa, satisface, refactor, repite.
- `/verification-before-completion` corre antes de cada commit y antes del PR final.
- `/pull-request` corre los 4 agents de quality gate (code-reviewer, security-reviewer, edge-case-detector, performance-engineer) cuando el PR esté listo.

## Suggested next skill

**`/scenario-driven-development`** — para arrancar implementación tomando los 11 SCEN como holdout y los 11 steps como secuencia.
