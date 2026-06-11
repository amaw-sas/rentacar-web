## Status: COMPLETED
## Blocked-By: step01/task-01-hero-restyle.code-task.md, step02/task-02-fleet-real-price.code-task.md, step03/task-03-howitworks-valueprops-stats.code-task.md, step04/task-04-cities-internal.code-task.md, step05/task-05-reviews-restyle.code-task.md, step06/task-06-requirements-faq.code-task.md, step07a/task-07a-contact-announcement-fab.code-task.md, step07b/task-07b-partners-marquee.code-task.md, step08/task-08-remove-video-promo-schemas.code-task.md, step09/task-09-headings-plus-jakarta.code-task.md
## Completed: 2026-06-11

# Task: F1 Step 10 — Integración + verificación runtime del holdout (preview)

## Description
Integrar el home completo y verificar el holdout SCEN-F1-01..13 en el preview Vercel del branch (lección F0: el runtime caza lo que los tests estáticos no ven). Cierre con `/verification-before-completion`.

## Background
F0 demostró que tests estáticos + typecheck verdes NO garantizan render correcto (gradientes transparentes). Este paso es la satisfacción observable del holdout en el navegador real, no un paso de "solo tests".

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (holdout SCEN-F1-01..13; plan de verificación)
**Additional:**
- `[[reference_tailwind4_gradient_bg_linear]]`, `[[reference_local_results_validation]]`
- `playwright.config.ts` (soporta `PLAYWRIGHT_BASE_URL` → E2E contra preview)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Push del branch → build de preview Vercel (alias `-git-feat-…`).
2. `agent-browser` confirma en el preview: layout por sección; precio real en fleet (no $0); font-family Plus Jakarta en headings (F1-08); cities internas `/{id}` cero wa.me (F1-04); gradientes renderizan `bg-linear` (F1-10); consola limpia; CLS ≤ baseline (F1-12); JSON-LD sin VideoObject/Promotion (F1-07).
3. Aislamiento: `git diff main --stat` solo `ui-alquilame`+`docs/specs` (F1-13); grep `bg-gradient-to-` **acotado a los archivos de home/chrome tocados por F1** = 0.
4. SEO no-regresión (F1-11): og/FAQPage/breadcrumb/canonical presentes; AggregateRating sin regresión vs baseline.
5. E2E `BRAND=alquilame` (subconjunto home) contra el preview, sin regresión vs baseline (los 3 fallos pre-existentes acoplados a alquilatucarro NO cuentan); `data-testid` intactos (F1-09).
6. Cierre con `/verification-before-completion` (evidencia fresca).

## Dependencies
- **Steps 1–9** completos.
- **Preview Vercel** (push-gated).

## Implementation Approach
1. Verificación estática local (unit/typecheck/grep aislamiento + bg-gradient acotado).
2. Push → esperar build READY → `agent-browser` + `vitals` por escenario.
3. E2E subconjunto home contra el preview.
4. `/verification-before-completion` y reporte.

## Acceptance Criteria
1. **Holdout satisfecho en runtime**
   - Given el preview del branch
   - When se ejecutan las comprobaciones por escenario
   - Then SCEN-F1-01..13 pasan con evidencia fresca (incl. precio real fleet, headings Plus Jakarta, cities internas, gradientes renderizan, JSON-LD limpio, CLS ≤ baseline).
2. **Aislamiento + sin regresión**
   - Given el diff y el E2E
   - When se comparan vs baseline
   - Then solo cambia `ui-alquilame`/`docs/specs`, E2E sin regresión nueva, `data-testid` intactos.
3. **Cierre verificado**
   - Given el cierre
   - When se invoca `/verification-before-completion`
   - Then hay evidencia fresca (no memoria) antes de cualquier claim de "done".

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, verification, runtime, agent-browser, e2e
- **Required Skills**: agent-browser, Playwright, Vercel preview, SDD verification
- **Related Tasks**: Blocked-By steps 1–9
- **Step**: 10 of 11
- **Files to Modify**: (ninguno de producción — verificación; posibles fixes puntuales si un escenario falla)
- **Files to Read**: `docs/specs/2026-06-11-issue-112-f1-home-design.md`, `playwright.config.ts`
- **Context Estimate**: M
- **Scenario-Strategy**: required
