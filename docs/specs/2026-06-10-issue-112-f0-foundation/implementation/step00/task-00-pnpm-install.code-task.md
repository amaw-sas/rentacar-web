## Status: PENDING
## Blocked-By:
## Completed:

# Task: Prerequisito — pnpm install

## Description
Materializar las dependencias del lockfile en `node_modules`, en particular `@nuxt/fonts@0.12.1` (transitiva de `@nuxt/ui`, hoy ausente del árbol instalado). Sin esto el primer `dev`/`build` de F0 falla por módulo no resuelto.

## Background
F0 introduce fuentes self-hosted vía `@nuxt/fonts`, que viene bundled con `@nuxt/ui@4.2.1` pero no está físicamente en `node_modules` (solo declarado en `pnpm-lock.yaml`). El repo es un monorepo pnpm; el install se corre desde la raíz.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (sección "Estado actual verificado", punto 6)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `pnpm install` desde la raíz del repo deja `@nuxt/fonts` resoluble.
2. No modifica `pnpm-lock.yaml` (install determinista; si lo cambia, investigar drift antes de continuar).

## Dependencies
- **pnpm ≥ 9**: workspace manager del monorepo.

## Implementation Approach
1. Desde la raíz del repo (NO desde el worktree si comparten store): `pnpm install`.
2. Verificar que `node_modules/@nuxt/fonts` exista o sea resoluble.

## Acceptance Criteria
1. **Dependencias materializadas**
   - Given el lockfile del repo
   - When se corre `pnpm install`
   - Then `@nuxt/fonts` es resoluble y un `pnpm --filter ui-alquilame build` no falla por módulo ausente.
2. **Lockfile estable**
   - Given el install
   - When termina
   - Then `git status` no muestra cambios en `pnpm-lock.yaml` (o el drift se justifica).

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: prereq, env-setup
- **Required Skills**: pnpm
- **Step**: 00 of 11
- **Files to Modify**: (ninguno — comando de entorno)
- **Files to Read**: pnpm-lock.yaml
- **Context Estimate**: S
- **Scenario-Strategy**: not-applicable
