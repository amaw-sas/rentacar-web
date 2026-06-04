# Planning Summary — Blog Supabase Migration (Issue #52)

**Date**: 2026-06-04
**Goal**: Cerrar la migración del blog Firebase→Supabase — una sola fuente, cero Firebase, las 3 marcas con contenido, y las brechas de SEO/perf de #52 resueltas.

## Artifacts Created
- `2026-06-04-issue-52-blog-supabase-migration-design.md` — diseño aprobado + spec-reviewed (2 bloqueantes resueltos).
- `scenarios/blog-supabase-migration.scenarios.md` — 8 SCEN observables (holdout para SDD).
- `implementation/plan.md` — 14 steps (13 + 4b) en 7 fases, plan-reviewed (Approved).

> Discovery/research/design se completaron vía `/brainstorming`; sop-planning aportó File Structure + plan + loop de revisión.

## Key Decisions
1. **Backend Supabase** (`blog_posts`, `brand NOT NULL`, aislado por-marca) — alinea con Fase 3 + edición sin deploy.
2. **Seed 16 × 3 = 48 filas** + copia de 26 imágenes a las 2 marcas vacías → "las 3 con contenido".
3. **Avatares → asset local nuevo** (`author-avatar.webp` exportado del SVG `Logo.vue`) — el logo NO existía como archivo. Mata la última dependencia Firebase.
4. **Eliminar `@nuxt/content` + stack Blob** (×3) tras migrar consumidores — `@nuxtjs/mdc` (dep explícita) conserva el render.
5. **SEO/perf en el mismo cierre** — sitemap + RSS dinámicos desde la tabla, ISR para `/blog/**`.

## Complexity Estimate
- **Overall**: L (14 steps, ×3 marcas, schema + data + read + write + cleanup + SEO).
- **Duration**: ~2-3 días de implementación enfocada.
- **Risk Level**: Medium — riesgos acotados: mapeo flat↔nested del transformer (silent-break), export del avatar, resolución de la source async del sitemap en prerender. Singleton Supabase heredado de `rentacar-data` (no nuevo).

## Recommended Next Steps
1. Implementar con `/scenario-driven-development` arrancando por Step 1 (foundation Supabase).
2. Acceso MCP Supabase listo (`apply_migration`/`execute_sql`/Storage) + `NUXT_SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.
3. Validar en preview `-git-main-` por marca (alquicarros/alquilame no sirven en dominio público).
4. `/verification-before-completion` + `/agent-browser` + `/dogfood` antes del PR que cierra #52.

## Open Questions
- ¿El branding por marca del seed (author_name, ajustes de copy) requiere revisión de marketing, o copia mecánica del de alquilatucarro? — asumido copia mecánica; divergen editando después.
- Borrado físico de los buckets Blob viejos: fuera de alcance (se deprecan por desuso).
