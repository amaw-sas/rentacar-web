## Status: COMPLETED
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md, step02/task-02-city-hero.code-task.md, step03/task-03-city-seo-content.code-task.md, step04/task-04-city-delivery-points.code-task.md, step05/task-05-city-faq-testimonios.code-task.md, step06/task-06-mount-f1-marketing.code-task.md, step07/task-07-legal-restyle.code-task.md
## Completed: 2026-06-11

# Task: F2 Step 8 — Integración + verificación runtime del holdout (preview)

## Description
Verificar el holdout SCEN-F2-01..12 (+07b) en el preview Vercel del branch (lección F0/F1: el runtime caza lo que los tests estáticos no ven — contraste, CLS, assets). Incluir la ruta `buscar-vehiculos` con params (resultados). Cierre con `/verification-before-completion`.

## Background
F1 demostró que tests estáticos verdes NO garantizan render correcto (contraste oscuro-sobre-rojo, CLS). Este paso es la satisfacción observable del holdout en el navegador real, en la city landing (sin y con params de búsqueda) y en las legales.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (holdout SCEN-F2-01..12 +07b; plan de verificación)
**Additional:**
- `[[reference_tailwind4_gradient_bg_linear]]`, `[[reference_local_results_validation]]`
- `playwright.config.ts` (`PLAYWRIGHT_BASE_URL` → E2E vs preview)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Push del branch → build de preview Vercel (alias `-git-feat-…`).
2. `agent-browser` en `/{city}` (p.ej. `/bogota`): hero+searcher (testids, navega), secciones SEO presentes con texto, puntos-entrega, marketing F1, faqs city + testimonios city, gradientes renderizan (`bg-linear`) y headings legibles (blancos sobre rojo vía `--ctx-text-primary`), consola limpia, CLS ≤ baseline.
3. `agent-browser` en `/{city}/buscar-vehiculos/...` (con params): `#seleccion-categorias`/`CategorySelectionSection` muestra resultados (engine intacto).
4. `agent-browser` en `/terminos-condiciones` y `/politica-privacidad`: estilo del diseño + disclaimer de intermediación presente; enlaces footer 200.
5. JSON-LD: `useCityProductSchema` (#68 precio real), `FAQPage` city, breadcrumb, canonical, og preservados.
6. Aislamiento: `git diff main --stat` solo `ui-alquilame`+`docs/specs`; grep `bg-gradient-to-` (archivos home/city/legales tocados) = 0.
7. E2E `BRAND=alquilame` (city + legales) contra el preview, sin regresión vs baseline; `data-testid` intactos.
8. Cierre con `/verification-before-completion` (evidencia fresca).

## Dependencies
- **Steps 1-7** completos. **Preview Vercel** (push-gated).

## Implementation Approach
1. Verificación estática local (unit/typecheck/grep aislamiento + bg-gradient acotado).
2. Push → build READY → `agent-browser` + `vitals` por escenario (landing, ruta con params, legales).
3. E2E city+legales contra el preview.
4. `/verification-before-completion` y reporte.

## Acceptance Criteria
1. **Holdout satisfecho en runtime**
   - Given el preview del branch
   - When se ejecutan las comprobaciones por escenario (landing, buscar-vehiculos con params, legales)
   - Then SCEN-F2-01..12 (+07b) pasan con evidencia fresca (hero+searcher, SEO content, puntos-entrega, marketing, faqs/testimonios city, resultados con params, gradientes+contraste, JSON-LD #68/FAQPage, legales intermediación, CLS ≤ baseline).
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
- **Labels**: alquilame, f2, verification, runtime, agent-browser, e2e
- **Required Skills**: agent-browser, Playwright, Vercel preview, SDD verification
- **Related Tasks**: Blocked-By steps 1-7
- **Step**: 08 of 08
- **Files to Modify**: (ninguno de producción — verificación; fixes puntuales si un escenario falla)
- **Files to Read**: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md`, `playwright.config.ts`
- **Context Estimate**: M
- **Scenario-Strategy**: required
