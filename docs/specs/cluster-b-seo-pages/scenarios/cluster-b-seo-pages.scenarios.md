---
name: cluster-b-seo-pages
created_by: claude
created_at: 2026-06-01T00:00:00Z
follows: cluster-a-appconfig-typing
---

# Cluster B — páginas SEO dashboard (TS2339 por data sin tipar)

## Contexto

Segundo cluster del baseline. Las páginas internas `app/pages/seo/*` (dashboards de Moz/GSC/
PageSpeed/backlinks/competidores) **existen solo en `ui-alquilatucarro`** (alquilame/alquicarros
siguen en sitios legacy). Cada página hace `useFetch('/api/seo/X')` contra rutas que devuelven JSON
(`server/data/*.json`). El patrón `fetch.value?.key || {}` (o `|| { nested: {} }`) **unía el tipo
inferido con `{}`**, rompiendo el acceso a propiedades (`X.plan`, `X.score`, …) → ~78 TS2339.

Causa raíz por página:
- **herramientas/rendimiento/backlinks**: `data.value?.key || {}` → unión con `{}`.
- **herramientas (extra)**: el `default` de `useFetch('/api/auth/gsc/status')` devolvía `{connected}`
  parcial → unión con la respuesta completa → `.expiresAt` fallaba.
- **index**: `split('T')[0]` es `string | undefined`.
- **competidores**: `competitors` es una unión heterogénea (algunos sin `notes`).

**Fix:** reemplazar `|| {}` por `(expr ?? {}) as NonNullable<typeof data.value>['key']` (conserva el
tipo inferido por useFetch, runtime idéntico); igualar el `default` de gsc/status al shape de la
respuesta; `?? ''` en split; cast `notes?` opcional. Todos los cambios son **runtime-neutral**
(aserciones de tipo que igualan el dato real).

Línea base (`ui-alquilatucarro`): 346 errores TS; ~78 en `app/pages/seo/*`.

## SCEN-001: las 5 páginas SEO arregladas quedan sin errores de tipo

**Given**: `herramientas/rendimiento/backlinks/index/competidores.vue` con los fixes, tras
`nuxt prepare`.
**When**: `pnpm --filter ui-alquilatucarro typecheck`.
**Then**: 0 errores TS en cada una de esas 5 páginas (era 45/27/4/1/1 respectivamente).
**Evidence**: stdout typecheck — `grep "seo/<page>.vue" | grep "error TS" | wc -l` == 0 por página.

## SCEN-002: baja el total, sin regresión

**Given**: el fix.
**When**: typecheck en las 3 marcas.
**Then**: alquilatucarro total 346 → ~268 (−~78); NO aparecen errores nuevos en las 5 páginas;
las clases ya arregladas siguen en 0 (auto-imports Vue/servidor, residual de capa, app.config
unknown); alquilame/alquicarros se mantienen en 201 (no tienen páginas SEO, el cambio es
alquilatucarro-app-only).
**Evidence**: stdout typecheck por marca; delta vs baseline.

## SCEN-003: cambios runtime-neutral, sin regresión funcional/tests

**Given**: los fixes son aserciones de tipo (`as`), `?? ''` (sobre un split que siempre tiene `[0]`),
y `Number()` (sobre un valor numérico ya guardado por `v-if`).
**When**: `pnpm --filter @rentacar-main/logic test run`.
**Then**: la suite de logic pasa (≥ 260). El output renderizado de las páginas no cambia (los casts
no alteran valores en runtime).
**Evidence**: stdout vitest; argumento de neutralidad runtime documentado por fix.

## Non-goals

- **`app/pages/seo/tareas.vue`** (2 errores): su data placeholder usa arrays vacíos (`[]` → `never[]`)
  y un objeto que mezcla claves de mes con `activityLogTemplate`. Tiparlo bien requiere tipos
  explícitos para entradas de log/tareas especulativas — sub-esfuerzo distinto, diferido dentro de
  Cluster B.
- Clusters C (fixtures de tests) y D (blog). `typecheck` sigue exit 1 por ellos + tareas.

## Anti-reward-hacking

SCEN-001 mide eliminación a 0 por página. SCEN-002 verifica que no se mueve el problema (sin
errores nuevos, sin regresión de clusters previos). El cast `(expr ?? {}) as Inferred` NO es
`as any`: conserva el tipo real inferido de la respuesta, solo elimina el `{}` espurio del fallback.
