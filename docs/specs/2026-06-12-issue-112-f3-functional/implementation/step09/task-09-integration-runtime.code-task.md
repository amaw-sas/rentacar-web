## Status: PENDING
## Blocked-By: step01/task-01-searcher-city-derivation.code-task.md, step02/task-02-reservas-page.code-task.md, step03/task-03-home-hero-cta.code-task.md, step04/task-04-city-hero-mode.code-task.md, step05/task-05-header-reservar-cta.code-task.md, step06/task-06-reskin-results-grid.code-task.md, step07/task-07-reskin-reservation-slideover.code-task.md, step08/task-08-reskin-state-pages.code-task.md
## Completed:

# Task: Integración + verificación runtime (preview)

## Description
Cerrar F3 satisfaciendo el holdout SCEN-F3-01..12 en el alias Vercel del branch, con verificación runtime (no solo estática): `/reservas` funcional, motor fuera de heroes pero conservado en resultados, reskin del flujo, SEO intacto, aislamiento, E2E. Cierre con `/verification-before-completion`.

## Background
Los pasos 1–8 implementan piezas verificadas estáticamente (unit). Este paso valida el comportamiento integrado en runtime — el valor consistente de F0/F1/F2 fue que el runtime cazó bugs que los tests estáticos no veían (gradientes transparentes, contraste de headings, CLS). Se corre en el alias `-git-feat-issue-112-f3-functional-…` (alquilame.co público sigue legacy). E2E contra el preview con `PLAYWRIGHT_BASE_URL` (sin webServer local).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Holdout SCEN-F3 + Plan de verificación)

**Additional References:**
- Plan Step 9; [[reference_local_results_validation]], [[project_brand_domains_and_cutover]], [[feedback_typecheck_disk_spike]]

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Estática: `ionice -c3 nice -n19 pnpm --filter ui-alquilame typecheck` (NUNCA root); unit de marca verde; grep `bg-gradient-to-` en archivos tocados = 0; `git diff main --stat` solo `ui-alquilame/**`+`docs/specs` (logic + otras marcas vacío).
2. Runtime (`agent-browser` + `/dogfood` en el preview): `/reservas` arma la URL profunda correcta desde la sucursal; home + city landing sin engine inline + CTA → /reservas; results conserva engine + #searcher; reskin grilla/slideover/estados (gradientes renderizan computed `background-image ≠ none`, headings Jakarta blancos sobre rojo); header CTA; JSON-LD city (#68 Product/FAQPage/AggregateRating) intacto + URLs profundas 200 sin redirect; CLS ≤ baseline; cero errores de consola / requests fallidos.
3. E2E `BRAND=alquilame` contra el preview: flujo búsqueda→resultados→reserva vía `/reservas` y vía URL profunda directa; `data-testid` resuelven; sin regresión vs baseline.
4. Cierre con `/verification-before-completion` (evidencia fresca).

## Dependencies
- **steps 01–08**: todas implementadas + unit verde.
- **Preview Vercel**: requiere push (push-gated, autorización explícita del usuario).

## Implementation Approach
1. Correr la verificación estática local (typecheck una marca, unit, grep, diff aislamiento).
2. Tras push autorizado, validar runtime en el alias con `agent-browser` + `/dogfood` por cada SCEN.
3. Correr E2E `BRAND=alquilame` contra el preview.
4. `/verification-before-completion` antes de cualquier claim de "done".

**Note:** Suggested approach.

## Acceptance Criteria
1. **Holdout satisfecho**
   - Given el preview del branch
   - When se recorren SCEN-F3-01..12
   - Then todos PASAN (con evidencia runtime), incluyendo derivación de ciudad, ausencia/presencia de engine por ruta, reskin, JSON-LD, CLS, consola limpia
2. **Aislamiento + SEO**
   - Given el diff vs main
   - When `git diff main --stat` y curl/grep del HTML de las URLs profundas
   - Then solo `ui-alquilame/**`+`docs/specs`; `packages/logic` y otras marcas vacío; URLs profundas 200 sin redirect; JSON-LD city presente
3. **E2E + verification-before-completion**
   - Given `BRAND=alquilame` contra el preview
   - When corre la suite + `/verification-before-completion`
   - Then flujo completo verde (vía /reservas y URL directa), `data-testid` intactos, sin regresión vs baseline, evidencia fresca registrada

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: integration, runtime, e2e, verification, seo, isolation
- **Required Skills**: agent-browser, Playwright, Nuxt SSR/ISR, SEO audit
- **Related Tasks**: bloqueada por step01–08
- **Step**: 09 of 09
- **Files to Modify**: (verificación — sin código nuevo salvo fixes que surjan; documentar evidencia)
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`, `playwright.config.ts`, `e2e/*.spec.ts`
- **Context Estimate**: M
- **Scenario-Strategy**: required
