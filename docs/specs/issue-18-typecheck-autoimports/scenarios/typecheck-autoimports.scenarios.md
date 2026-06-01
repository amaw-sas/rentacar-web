---
name: typecheck-autoimports
created_by: claude
created_at: 2026-06-01T00:00:00Z
issue: 18
---

# Issue #18 — `pnpm typecheck` resuelve los auto-imports de Nuxt en las 3 marcas

## Contexto

El "usuario" es el desarrollador / CI que corre `pnpm typecheck`. Causa raíz: `nuxt typecheck`
(nuxi) corre `vue-tsc -b` (build-mode, con los tsconfig generados por Nuxt 4 que declaran los
globals de auto-import) **solo si el `tsconfig.json` del paquete tiene `references`**. Los
`tsconfig.json` de las 3 marcas no tienen `references` y extienden `tsconfig.base.json` (que
`exclude`ye `.nuxt`), así que nuxi cae a `vue-tsc --noEmit` plano contra un programa que no carga
`.nuxt/types/imports.d.ts` → **todo** auto-import reporta TS2304.

**Alcance (decidido con el usuario):** solo arreglar la rotura de config de auto-imports migrando
los tsconfig de marca a la forma canónica Nuxt 4 (references → build-mode). NO se persigue
`typecheck` exit 0. Ver Non-goals.

Línea base medida en `ui-alquilatucarro` (plain-mode, roto): 643 errores TS; 497 TS2304.

## SCEN-001: Las primitivas de reactividad Vue dejan de ser TS2304 en archivos de marca

**Given**: `ui-alquilatucarro` con el `tsconfig.json` migrado a forma de solución con `references`
a `./.nuxt/tsconfig.{app,server,shared,node}.json`, tras `nuxt prepare`.
**When**: se corre `pnpm --filter ui-alquilatucarro typecheck`.
**Then**: el conteo de `error TS2304: Cannot find name '<X>'` para `X ∈ {ref, computed, watch,
reactive, nextTick, onMounted}` pasa de **170** (línea base plain-mode) a **0**.
**Evidence**: stdout de typecheck — `grep -oE "Cannot find name '(ref|computed|watch|reactive|nextTick|onMounted)'" | wc -l` == 0.

## SCEN-002: Los auto-imports de servidor (Nitro/h3) resuelven en su contexto

**Given**: el mismo paquete migrado.
**When**: se corre el typecheck.
**Then**: (a) el conteo TS2304 para `X ∈ {defineEventHandler, sendRedirect, createError,
definePageMeta, navigateTo}` pasa de **72** a **0**; y (b) el error exacto citado en el issue
`../logic/server/utils/supabase.ts(...): error TS2304: Cannot find name 'useRuntimeConfig'`
ya **no aparece** (Nitro provee `useRuntimeConfig` en el proyecto server).
**Evidence**: stdout de typecheck — ambos greps == 0.

## SCEN-003: Las 3 marcas se comportan idénticamente

**Given**: los `tsconfig.json` de `ui-alquilatucarro`, `ui-alquilame` y `ui-alquicarros` migrados
(los tres eran byte-idénticos antes; deben seguir idénticos después).
**When**: se corre `pnpm typecheck` (las 3 marcas).
**Then**: ninguna de las 3 reporta la clase de TS2304 de SCEN-001/SCEN-002 (Vue + Nitro core
auto-imports == 0 en cada marca). El total de errores por marca baja respecto a su línea base
plain-mode.
**Evidence**: stdout por marca — greps de SCEN-001 y SCEN-002 == 0 en las tres.

## SCEN-004: No hay regresión en prepare/dev (cambio config-only)

**Given**: el `tsconfig.json` migrado y la eliminación del alias `@logic/*` (verificado sin uso en
`app/` ni `server/`).
**When**: se corre `nuxt prepare` (vía postinstall) y se arranca el dev server.
**Then**: ambos terminan sin error (prepare exit 0; dev imprime la URL local y responde 200 en `/`).
**Evidence**: exit code de prepare; log de dev + respuesta HTTP de la home.

## Non-goals (documentados, NO se arreglan en este issue)

- **Errores de tipo reales pre-existentes** (~449 en alquilatucarro: TS18046, TS2339, TS2345
  `SupabaseLocation`, `'cat' possibly undefined`, etc.) — baseline drift, issue separado.
- **Residual de build-mode multi-proyecto** (~134 TS2304 en `logic/src/composables/*` como
  `useAppConfig`/`useSchemaOrg`/`useRoute`): los proyectos server/shared/node arrastran composables
  app como dependencias transitivas y los typechequean sin los globals app. Es artefacto del
  build-mode con globs amplios del layer; fuera del alcance acordado. Se documenta en el PR.
- `pnpm typecheck` exit 0 — no alcanzable con solo config dado el baseline real.

## Anti-reward-hacking

Las aserciones miden la **eliminación** de la clase de auto-imports rota (Vue reactivity + Nitro
handlers + `useRuntimeConfig` citado), no un "menos errores que antes" genérico. El residual de capa
y los errores reales se declaran explícitamente como Non-goals, no se ocultan ni se debilita la
aserción para que el total dé verde.
