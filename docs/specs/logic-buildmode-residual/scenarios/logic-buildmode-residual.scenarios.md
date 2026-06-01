---
name: logic-buildmode-residual
created_by: claude
created_at: 2026-06-01T00:00:00Z
follows: issue-18-typecheck-autoimports
---

# Residual de build-mode multi-proyecto en `logic/src/{composables,stores}`

## Contexto

Tras el fix de #18 (`vue-tsc -b` build-mode), quedaban ~140 TS2304 en
`logic/src/{composables,stores}` (`useAppConfig`/`useSchemaOrg`/`useRoute`/`navigateTo`/…).
Causa raíz (vía `vue-tsc --explainFiles`): los proyectos **server/node** del solution build
arrastran los composables/stores app — que usan auto-imports solo-app — y los typechequean en un
contexto sin esos globals. Dos puentes:

1. `app/app.config.ts` (las 3 marcas) importaba `{ defaultConfig, uiConfig, organizationConfig }`
   del **barrel completo** `@rentacar-main/logic/src` (que hace `export *` de todos los
   composables/stores). Nitro incluye `app.config` para sus tipos → el barrel entero entra al
   proyecto server. Los 3 símbolos viven en la entrada estrecha `@rentacar-main/logic/config`.
2. `utils/index.ts` re-exportaba `ReservationResumeProps`, cuyo tipo es
   `ReturnType<typeof useCategory>` (import de valor del composable `useCategory`). Server jala el
   barrel de utils → arrastra `useCategory` y su subgrafo. Solo `ReservationResume.vue` (app) usa
   ese tipo.

**Fix:** (1) `app.config.ts` importa desde `@rentacar-main/logic/config`; (2) sacar
`ReservationResumeProps` del barrel de utils y que los `.vue` lo importen por ruta estrecha.

Línea base (`ui-alquilatucarro`, post-#18): 613 errores TS; residual composables/stores = 140.

## SCEN-001: El residual de auto-imports en composables/stores de logic desaparece

**Given**: las 3 marcas con `app.config.ts` importando desde `@rentacar-main/logic/config` y
`utils/index.ts` sin re-exportar `ReservationResumeProps`, tras `nuxt prepare`.
**When**: se corre `pnpm --filter ui-<marca> typecheck` (build-mode) en cada marca.
**Then**: el conteo de `error TS2304` en archivos `logic/src/composables/*` y `logic/src/stores/*`
pasa de ~140 (alquilatucarro) a **0** en las **3 marcas**.
**Evidence**: stdout de typecheck — `grep 'error TS2304' | grep -E 'logic/src/(composables|stores)' | wc -l` == 0.

## SCEN-002: No se regresan los auto-imports ya arreglados en #18

**Given**: el mismo estado.
**When**: se corre el typecheck.
**Then**: la clase de auto-imports de #18 sigue en 0 — Vue reactivity
(`ref|computed|watch|reactive|nextTick|onMounted`) == 0 y handlers de servidor
(`defineEventHandler|sendRedirect|createError`) == 0 en las 3 marcas.
**Evidence**: stdout de typecheck — ambos greps == 0.

## SCEN-003: `app.config` no cambia de comportamiento

**Given**: `app.config.ts` ahora importa de `@rentacar-main/logic/config`, que exporta los mismos
`defaultConfig`, `uiConfig`, `organizationConfig` que antes venían vía el barrel.
**When**: se corre `nuxt prepare` en cada marca.
**Then**: prepare termina exit 0 y genera los tipos de app.config sin error; las 3 claves
(`defaultTimezone`, `ui`, `organization`) siguen resolviéndose (mismo origen `src/config/*`).
**Evidence**: exit code de prepare + `app.config.ts` typechea sin TS2307/TS2305 sobre esos símbolos.

## SCEN-004: `ReservationResume.vue` sigue tipando su prop

**Given**: las 3 `ReservationResume.vue` importan `ReservationResumeProps` por ruta estrecha
`@rentacar-main/logic/utils/types/props/ReservationResumeProps`.
**When**: se corre el typecheck.
**Then**: `defineProps<ReservationResumeProps>()` resuelve sin nuevos TS2304/TS2305/TS2307 en esos
componentes (el tipo sigue siendo `ReturnType<typeof useCategory>`, ahora en contexto app donde
useCategory resuelve).
**Evidence**: stdout de typecheck — 0 errores nuevos en `app/components/ReservationResume.vue`.

## SCEN-005: Sin regresión en la suite de logic

**Given**: el fix aplicado.
**When**: `pnpm --filter @rentacar-main/logic test run`.
**Then**: todos los archivos de test pasan (≥ 256 tests, los del baseline + el guard nuevo).
**Evidence**: stdout de vitest — `Test Files N passed`, `Tests M passed`, 0 failed.

## Non-goals

- Errores de tipo reales pre-existentes (baseline drift, ~449): `typecheck` sigue exit 1 por
  ellos. Fuera de alcance.
- Los `import type { BlogPost } from '@rentacar-main/logic/src'` en páginas blog: type-only, viven
  solo en el proyecto app (resuelven), no aportan al residual. Se dejan.

## Anti-reward-hacking

La aserción central (SCEN-001) mide **eliminación a 0** del residual de composables/stores, no
"menos errores". SCEN-002 garantiza que no se logra moviendo el problema (no se rompe #18). Los
errores reales del baseline se declaran Non-goal, no se ocultan.
