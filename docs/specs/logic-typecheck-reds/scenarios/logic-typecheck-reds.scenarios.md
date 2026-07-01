---
name: logic-typecheck-reds
created_by: pablo
created_at: 2026-06-30T00:00:00Z
---

# packages/logic — resolver rojos de type-check

`pnpm --filter ui-* typecheck` (comando oficial, NO corrido en CI — CI solo hace
`pnpm lint` + `pnpm --filter @rentacar-main/logic test`) estaba rojo con errores
atribuibles a `packages/logic`: 1 de producción en el server, ~14 de producción
en `logic/src`, y decenas en los archivos de test del layer barridos al
type-graph del consumidor. Alcance: dejar `packages/logic` type-clean sin cambiar
comportamiento runtime. Los errores app-level (Searcher, ReservationForm, etc.)
quedan fuera de alcance.

## SCEN-001: producción del server type-checkea
**Given**: el handler `server/api/rentacar-data.get.ts`
**When**: se corre el type-check de un consumidor
**Then**: `transformBranches(locationsResult.data)` no reporta TS2345 (el embed
to-one `cities(slug)` que Supabase infiere como array se afirma al shape real);
a runtime `branch.city` sigue resolviéndose desde `cities.slug`
**Evidence**: `pnpm --filter ui-* typecheck` sin error en rentacar-data.get.ts; logic vitest verde

## SCEN-002: producción de logic/src type-checkea (null-safety)
**Given**: composables/utils shipping (`useTariffs`, `useSearch`,
`useStoreSearchData`, `scheduleAvailability`, `pickPriceForDate`, `useDateFunctions`)
**When**: se corren bajo el `strict` + `noUncheckedIndexedAccess` del config generado de Nuxt
**Then**: no reportan `possibly undefined`/TS2345/TS2322; los accesos indexados
guardados por length-checks / regex-match / invariantes se afirman sin cambiar el
comportamiento para inputs válidos
**Evidence**: `pnpm --filter ui-* typecheck` con 0 errores en logic/src; logic vitest 533/533

## SCEN-003: tests del layer excluidos del type-check del build
**Given**: los tests colocados en `logic/**/__tests__/*.test.ts`, validados por vitest
**When**: un consumidor genera su `tsconfig.app.json` + `tsconfig.server.json`
**Then**: esos archivos de test NO entran al type-check del build (no son build
artifacts); siguen corriendo en vitest (CI intacto)
**Evidence**: `pnpm --filter ui-* typecheck` con 0 errores en logic tests; `pnpm --filter @rentacar-main/logic test` verde

## SCEN-004: paridad entre las 3 marcas
**Given**: el cambio vive en el layer `packages/logic`
**When**: se type-checkea cada marca (alquicarros, alquilame, alquilatucarro)
**Then**: las 3 reportan 0 errores atribuibles a `packages/logic`
**Evidence**: typecheck por marca → logic errors: 0/0/0
