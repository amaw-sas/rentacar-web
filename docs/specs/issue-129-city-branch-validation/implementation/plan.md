# Implementation Plan — Issue #129 city↔branch validation

**Fecha:** 2026-06-22
**Design:** `../design.md` (aprobado: reviewer + usuario; helper-en-logic confirmado por usuario)
**Branch/worktree:** `fix/issue-129-city-branch-validation` @ `.worktrees/issue-129-city-branch`
**Modo:** SDD — cada paso define escenario → código → satisface → refactor.

> **Nota de proceso:** clarificación/research cubiertas por el spec aprobado. Se procede a file-map +
> plan. La lógica de decisión se extrae a un helper puro en `packages/logic` (decisión del usuario):
> arregla el gap de harness de tests (los `ui-*/tests/` son solo `readFileSync`+regex; el middleware
> tiene 14 auto-imports) y deduplica el bloque ×3.

## File Structure (Step 6.5)

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `packages/logic/src/utils/resolveCityBranchCorrection.ts` | **Decisión pura**: dado pickup/return/cityContext/cityBranch → params corregidos o `null`. Sin Nuxt globals. | Crear |
| `packages/logic/src/utils/__tests__/resolveCityBranchCorrection.test.ts` | Unit del helper: SCEN-1/2/3 + edge (cityBranch undefined, slug ausente, loop-safety) | Crear |
| `packages/logic/src/utils/index.ts` | Re-export `{ resolveCityBranchCorrection }` (patrón de `isCategoryVisibleInCity`) | Modificar |
| `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts` | **Efecto**: llamar helper con `searchBranchByCity(cityContext)`, aplicar `navigateTo`+`createMessage`. Tras `!pickupBranch\|\|!returnBranch`, antes de `isPickupSlug` (insertar ~:71, antes de :72) | Modificar |
| `packages/ui-alquilame/app/middleware/validateSearchParams.ts` | idem (antes de :72) | Modificar |
| `packages/ui-alquicarros/app/middleware/validateSearchParams.ts` | idem (antes de :70) | Modificar |
| `packages/ui-alquilatucarro/app/components/Searcher.vue` | Re-disparo en URL idéntica: hoist `doSearch` + `@click` handler | Modificar |
| `packages/ui-alquilame/app/components/Searcher.vue` | idem — destino vía `searchDestination` computed | Modificar |
| `packages/ui-alquicarros/app/components/Searcher.vue` | idem | Modificar |
| `e2e/city-branch-validation.spec.ts` | E2E multi-marca (BRAND): SCEN-1,2,3,4 + ciudad inválida (no crash/loop) | Crear |

**Decomposición:** `packages/logic` posee la lógica (única fuente de lógica, `architecture.md`); los 3
middleware son orquestadores delgados; los Searcher divergen levemente (alquilame usa
`searchDestination`). La unidad testeable aislada es el helper puro; el comportamiento integrado se
verifica en E2E donde el middleware realmente corre.

## Prerequisites
- Worktree con `pnpm install`; dev server :4000; `.env.local` copiado a la raíz del worktree (el plugin
  rentacar-data hace hard-throw sin él → 500). Ver `reference_worktree_dev_server_runtime_validation`.
- E2E de category cards reales necesita admin backend en :3000; si no, stub de availability vía
  Playwright `page.route` (NO agent-browser route). Ver `reference_local_results_validation`.
- Typecheck SIEMPRE por marca, nunca root (`feedback_typecheck_disk_spike`):
  `ionice -c3 nice -n19 pnpm --filter ui-<brand> typecheck`. Logic: `pnpm --filter @rentacar-main/logic test`.

## Steps (Step 7)

### Fase 1 — Helper puro (foundation, bug primario)

**Step 1 — Helper `resolveCityBranchCorrection` + unit tests** · Size: M · Dep: none
- Crear el helper puro (firma y cuerpo del design `§Solución 1`): `pickup.city === city → null`;
  `!cityBranch?.slug → null`; si no, `{ lugar_recogida: cityBranch.slug, lugar_devolucion?: ... }`
  (return alineado solo si era foráneo). Re-export en `utils/index.ts`.
- **Escenario / encoding ejecutable (mismo step):** test colocado en `__tests__/` con fixtures de
  branches multi-ciudad. Aserciones:
  - **SCEN-1:** pickup foráneo + return foráneo → `{ lugar_recogida: <city>-slug, lugar_devolucion: <city>-slug }`.
  - **SCEN-2:** pickup de la ciudad + return de otra → `null` (one-way intacto).
  - **SCEN-3:** ambos de la ciudad → `null`.
  - **Loop-safety:** dado el output de SCEN-1 como input (pickup ya = cityBranch), → `null` (no re-entra).
  - **Edge:** `cityBranch === undefined` → `null`; `cityBranch` sin `slug` → `null`.
- **Acceptance:** `pnpm --filter @rentacar-main/logic test` verde para el nuevo archivo; helper exportado y resoluble vía `@rentacar-main/logic/utils`.

### Fase 2 — Orquestación en middleware (bug primario)

**Step 2 — Cablear helper en alquilatucarro middleware** · Size: S · Dep: Step 1
- En `validateSearchParams.ts` de alquilatucarro: añadir `searchBranchByCity` al destructure de
  `useStoreAdminData()`; llamar `resolveCityBranchCorrection(pickupBranch, returnBranch, cityContext,
  searchBranchByCity(cityContext))`; si no-`null`, setear `to.params` + `createMessage` + `return navigateTo`.
  Ubicación: tras el reset `!pickupBranch||!returnBranch`, inmediatamente antes de `const isPickupSlug` (:72).
- **Escenario (integrado, verificado en E2E Step 5):** GET URL con pickup foráneo → 30x a la URL de la ciudad.
- **Acceptance:** `pnpm --filter ui-alquilatucarro typecheck` verde; el orden con los redirects existentes
  no introduce loop (helper devuelve `null` en la URL corregida).

**Step 3 — Propagar a alquilame + alquicarros** · Size: S · Dep: Step 2
- Mismo cableado, ajustando insertion line (alquilame :72, alquicarros :70). Diff idéntico salvo
  whitespace/imports preexistentes.
- **Acceptance:** los 3 middleware llaman al helper; typecheck por marca verde (uno a la vez).

### Fase 3 — Re-disparo del botón (bug secundario)

**Step 4 — SCEN-4: re-disparo en alquilatucarro Searcher** · Size: M · Dep: none (paralelo a Fase 1–2)
- Hoist `doSearchFn = ref<(()=>void)|null>(null)` a top-level de `<script setup>`; en `onMounted` (:505)
  `doSearchFn.value = searchComposable.doSearch`. Top-level `onSearchClick(e)`: `const t =
  router.resolve({ name: searchLinkName.value, params: searchLinkParams.value })`; si
  `t.href === route.fullPath` → `e.preventDefault(); doSearchFn.value?.()`. Bind `@click="onSearchClick"` en `:334`.
- **Escenario:** en la página base de resultados, sin cambiar params, click BUSCAR → nueva POST a
  `/api/reservations/availability` + `useStoreSearchData.pending` → `true`.
- **Acceptance:** typecheck verde; en `/categoria/...` el botón navega normal (no entra al re-disparo,
  porque `searchLinkParams` no lleva `categoria` → href ≠ fullPath) — filtro de categoría sin regresión.

**Step 5 — Propagar re-disparo a alquilame + alquicarros** · Size: M · Dep: Step 4
- alquicarros: idéntico a alquilatucarro. **alquilame:** el `:to` es el computed `searchDestination`
  (no objeto inline) → `onSearchClick` resuelve `router.resolve(searchDestination.value)` y compara su
  `href` con `route.fullPath`. Mismo `doSearchFn` re-disparo.
- **Acceptance:** los 3 Searcher tienen el handler; typecheck por marca; alquilame resuelve el destino
  vía `searchDestination`, no via objeto inline.

### Fase 4 — E2E + QA runtime

**Step 6 — E2E multi-marca** · Size: M · Dep: Steps 3,5
- Crear `e2e/city-branch-validation.spec.ts` parametrizado por `BRAND`:
  - **SCEN-1 (positivo):** URL pickup foráneo → assert URL final = ciudad correcta + banner "En <ciudad>"
    + selector de recogida = sede de la ciudad.
  - **SCEN-2 (negativo crítico):** one-way legítimo → assert **URL params sin cambios** y **ninguna
    navegación extra** (no redirect). Es el caso que protege one-way; aserción explícita de no-redirect.
  - **SCEN-3 (control negativo):** URL consistente → assert sin redirect, params intactos.
  - **SCEN-4:** página base de resultados, click sin cambios → spy/stub de la POST availability (`page.route`)
    registra una nueva request; pending togglea.
  - **Edge (Riesgo #2/#7):** segmento de ciudad inexistente/garbage → no crash, no redirect loop
    (assert ≤1 navegación, sin error de runtime).
- **Acceptance:** `pnpm test:e2e` + `:alquilame` + `:alquicarros` verdes para el nuevo spec, con las
  aserciones positivas Y negativas (no-redirect) explícitas.

**Step 7 — QA runtime (agent-browser + dogfood)** · Size: S · Dep: Step 6
- Dev server :4000. Reproducir SCEN-1 en vivo con la URL exacta del reporte; confirmar banner
  "En Barranquilla" + selector Barranquilla. Cero errores de consola, cero requests fallidos. /dogfood
  exploratorio del flujo de búsqueda.
- **Acceptance:** evidencia (screenshots/HAR) de SCEN-1 corregido; consola/network limpios.

**Step 8 — Auditoría de datos Riesgo #2 (paralelo, no gating)** · Size: S · Dep: none
- Query a rentacar-data: enumerar `cities` sin `branches` (la asunción "ciudad servida tiene ≥1 sede").
- **Acceptance:** lista (vacía → asunción válida; no-vacía → documentar en el PR y abrir issue upstream
  para no listar esas ciudades). **No bloquea** el merge del fix — es análisis de hardening.

## Testing Strategy
- **Unit (logic):** Vitest — `resolveCityBranchCorrection` aislado (SCEN-1,2,3 + edge/loop-safety).
- **E2E:** Playwright multi-marca — observables runtime, positivos y negativos (SCEN-1..4 + ciudad inválida).
- **Manual/QA:** agent-browser + /dogfood en :4000; URL del reporte.
- **Regresión:** SCEN-5a/5b (slug inexistente → default; legacy code → slug) son comportamiento
  pre-existente NO tocado por el helper; el E2E los ejercita incidentalmente. No se crea step solo-tests
  para ellos (evita el anti-patrón SDD).

## Rollout Plan
- **Deploy:** preview de Vercel por marca; alquilatucarro.com es la única en prod con la app nueva
  (`project_brand_domains_and_cutover`) — verificar alquicarros/alquilame vía alias `-git-main-`.
- **Monitoreo:** confirmar máx 1 redirect por corrección (sin loops) en Network.
- **Rollback:** revert del PR; cambios aditivos (1 helper + cableado + 1 handler), sin migraciones.

## Riesgos abiertos (del design)
- Ciudades sin sucursales → bug persiste para esa ciudad (degradado, sin crash/loop). Auditoría en Step 8.
- alquilame Searcher diverge en `:to` → resuelto en Step 5 (resolver `searchDestination`).
