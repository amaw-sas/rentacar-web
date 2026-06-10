## Status: PENDING
## Blocked-By: step01/task-01-theme-tokens.code-task.md, step02/task-02-fonts.code-task.md, step03/task-03-primary-color.code-task.md, step04/task-04-optimize-images-script.code-task.md, step05/task-05-brand-assets.code-task.md, step06/task-06-logo-inline.code-task.md, step07/task-07-header-red.code-task.md, step08a/task-08a-footer-structure.code-task.md, step08b/task-08b-city-links-hydration.code-task.md, step09/task-09-deblue-error-links.code-task.md
## Completed:

# Task: Verificación del holdout F0 (SCEN-F0-01..08)

## Description
Verificar, con evidencia fresca y observable, que F0 satisface los 8 escenarios del holdout antes de declarar la fase completa. Invoca `/verification-before-completion`. No escribe código de producción nuevo — es la puerta de verificación SDD.

## Background
F0 define el holdout SCEN-F0-01..08 en el design doc. Esta tarea recolecta evidencia para cada uno y confirma el aislamiento de marca. Memoria de proyecto: NUNCA correr el typecheck raíz (congela el disco WSL2); usar un solo brand con `ionice -c3 nice -n19`. Verificar en el alias Vercel `-git-main-`, NO en el dominio público (alquilame.co sigue legacy).

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (Escenarios observables + Plan de verificación)
- Plan: `../plan.md` (Step 10)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `pnpm --filter ui-alquilame typecheck` vía `ionice -c3 nice -n19` (SCEN-F0-07).
2. E2E `pnpm test:e2e:alquilame` (`BRAND=alquilame`) — testids preservados (SCEN-F0-07).
3. `git diff --stat origin/main` → cambios SOLO en `packages/ui-alquilame/` (SCEN-F0-02).
4. Build de las otras 2 marcas → árbol git sin cambios (aislamiento).
5. `/agent-browser` + `/dogfood` en el alias `-git-main-`: cero errores de consola, cero requests fallidos; inspección de color/fuentes/footer/assets-200 (SCEN-F0-01,03,04,05,06).
6. Lighthouse/CLS vs baseline (SCEN-F0-08).

## Dependencies
- **Steps 01–09**: toda la implementación de F0 completa.

## Implementation Approach
1. Invocar `/verification-before-completion`.
2. Ejecutar cada gate y capturar evidencia fresca (no de memoria).
3. Mapear cada evidencia a su SCEN-F0; ningún escenario debilitado.

## Acceptance Criteria
1. **Gates verdes (SCEN-F0-07)**
   - Given el branch F0 completo
   - When se corre typecheck + E2E `BRAND=alquilame`
   - Then ambos pasan y los `data-testid` se preservan.
2. **Aislamiento (SCEN-F0-02)**
   - Given el branch
   - When `git diff --stat origin/main` + build de las otras marcas
   - Then los cambios son solo en `ui-alquilame/`; el árbol de `logic/` y las otras 2 marcas no cambia.
3. **Runtime limpio (SCEN-F0-01,03,04,05,06,08)**
   - Given el alias `-git-main-`
   - When `/agent-browser` + `/dogfood` inspeccionan la home y el error boundary
   - Then color rojo aplicado, fuentes correctas, footer rojo con 19 enlaces internos, assets 200, sin azul de chrome, cero errores de consola/requests, CLS no peor que baseline.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: verification, holdout, sdd, qa
- **Required Skills**: verification-before-completion, agent-browser, dogfood, Playwright
- **Step**: 10 of 11
- **Files to Modify**: (ninguno — verificación)
- **Files to Read**: design doc (escenarios), plan.md
- **Context Estimate**: M
- **Scenario-Strategy**: not-applicable
