# Implementation Plan — Issue #129 city↔branch validation

**Fecha:** 2026-06-22
**Design:** `../design.md` (aprobado: reviewer + usuario)
**Branch/worktree:** `fix/issue-129-city-branch-validation` @ `.worktrees/issue-129-city-branch`
**Modo:** SDD — cada paso define escenario → código → satisface → refactor.

> **Nota de proceso:** las fases de clarificación/research de sop-planning están cubiertas por el
> spec ya aprobado (problema, causa raíz, invariante, 5 escenarios, riesgos). Se omiten por diseño y
> se procede a file-map + plan.

## File Structure (Step 6.5)

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts` | Validación ciudad↔branch de recogida (bloque nuevo, tras `!pickupBranch\|\|!returnBranch` ~:71, antes de `isPickupSlug` :72) | Modificar |
| `packages/ui-alquilame/app/middleware/validateSearchParams.ts` | idem (insertion :72) | Modificar |
| `packages/ui-alquicarros/app/middleware/validateSearchParams.ts` | idem (insertion :70) | Modificar |
| `packages/ui-alquilatucarro/app/components/Searcher.vue` | Re-disparo de búsqueda en URL idéntica (hoist `doSearch` + `@click` handler) | Modificar |
| `packages/ui-alquilame/app/components/Searcher.vue` | idem — variante `searchDestination` computed | Modificar |
| `packages/ui-alquicarros/app/components/Searcher.vue` | idem | Modificar |
| `e2e/city-branch-validation.spec.ts` | E2E multi-marca (BRAND) — SCEN-1,2,3,4 observables | Crear |
| `packages/ui-alquilame/tests/validate-search-params-city.test.ts` | Unit del middleware donde hay harness Vitest — SCEN-1,2,3,5a,5b | Crear |

**Decomposición:** los 3 middleware son funcionalmente idénticos → mismo bloque; los Searcher divergen
levemente (alquilame usa `searchDestination`). Tests: e2e cubre los 5 escenarios cross-brand a nivel
runtime; unit en alquilame (único con `tests/`) ancla la lógica del middleware de forma aislada.

## Prerequisites
- Worktree con `pnpm install` hecho; dev server en puerto 4000; `.env.local` copiado a la raíz del
  worktree (el plugin rentacar-data hace hard-throw sin él → 500 en toda página). Ver
  `reference_worktree_dev_server_runtime_validation`.
- E2E real de category cards necesita admin backend en :3000; si no, stub de availability vía
  Playwright `page.route` (NO agent-browser network route). Ver `reference_local_results_validation`.

## Steps (Step 7)

### Fase 1 — Validación middleware (bug primario)

**Step 1 — SCEN-1/2/3: bloque city↔branch en alquilatucarro** · Size: M · Dep: none
- Insertar el bloque del design (`§Solución 1`) en `validateSearchParams.ts` de alquilatucarro, tras
  el reset `!pickupBranch||!returnBranch`, antes de `isPickupSlug`. Solo tier de ciudad
  (`searchBranchByCity(cityContext)`), guard `?.slug`, reset de ambos extremos si return también foráneo.
- **Escenario (unit, donde haya harness — ver Step 3):** dado pickup de ciudad ajena bajo otra ciudad,
  el middleware retorna `navigateTo` con `lugar_recogida` = slug del default de la ciudad de la página.
- **Acceptance:**
  - SCEN-1: pickup foráneo (`barranquilla` + `armenia-aeropuerto`) → redirect a `barranquilla-*`.
  - SCEN-2: pickup de la ciudad + return de otra (`barranquilla-aeropuerto` + `medellin-aeropuerto`) → **sin** redirect.
  - SCEN-3: ambos de la ciudad → sin redirect.
  - Loop-safety: el branch redirigido cumple `.city === cityContext` (no re-entra).
  - `ionice -c3 nice -n19 pnpm --filter ui-alquilatucarro typecheck` verde para el archivo.

**Step 2 — Propagar bloque a alquilame + alquicarros** · Size: S · Dep: Step 1
- Mismo bloque, ajustando insertion line (alquilame :72, alquicarros :70). Verificar que el diff es
  idéntico salvo whitespace/imports preexistentes.
- **Acceptance:** los 3 archivos contienen el bloque; `pnpm --filter ui-<brand> typecheck` por marca
  (uno a la vez, nunca root — `feedback_typecheck_disk_spike`).

### Fase 2 — Re-disparo del botón (bug secundario)

**Step 3 — Unit test del middleware (alquilame harness)** · Size: M · Dep: Step 2
- Crear `packages/ui-alquilame/tests/validate-search-params-city.test.ts` cubriendo SCEN-1,2,3 +
  regresión SCEN-5a (slug inexistente → default existente) y SCEN-5b (legacy code → slug). Mock de
  `useStoreAdminData`/`searchBranchByCity` con fixtures de branches multi-ciudad.
- **Acceptance:** `pnpm --filter ui-alquilame test` verde; los 5 casos aserción explícita sobre el
  destino de `navigateTo` (o ausencia de redirect).
- *(Va aquí, no antes, porque ancla el comportamiento ya propagado a las 3; no es un step "solo tests"
  — define los escenarios SCEN-5a/5b que ningún otro step cubre.)*

**Step 4 — SCEN-4: re-disparo en alquilatucarro Searcher** · Size: M · Dep: none (paralelo a Fase 1)
- Hoist `doSearchFn = ref<(()=>void)|null>(null)` a top-level de `<script setup>`; setear
  `doSearchFn.value = searchComposable.doSearch` dentro de `onMounted` (:505). Añadir top-level
  `onSearchClick(e)` que resuelve el destino (`router.resolve`) y, si `target.href === route.fullPath`,
  `e.preventDefault()` + `doSearchFn.value?.()`. Bind `@click="onSearchClick"` en el `<u-button>` (:334).
- **Escenario:** en la página base de resultados, sin cambiar params, click en BUSCAR → nueva POST a
  `/api/reservations/availability` + `useStoreSearchData.pending` → `true`.
- **Acceptance:** typecheck verde; en `/categoria/...` el botón navega normal (no entra al branch de
  re-disparo) — sin regresión del filtro de categoría.

**Step 5 — Propagar re-disparo a alquilame + alquicarros** · Size: M · Dep: Step 4
- alquicarros: idéntico a alquilatucarro. alquilame: resolver el destino vía su `searchDestination`
  computed (no objeto inline).
- **Acceptance:** typecheck por marca; los 3 Searcher tienen el handler.

### Fase 3 — Validación runtime + E2E

**Step 6 — E2E multi-marca** · Size: M · Dep: Steps 2,5
- Crear `e2e/city-branch-validation.spec.ts` parametrizado por `BRAND`. SCEN-1 (redirect URL +
  banner/selector de la ciudad correcta), SCEN-2 (one-way preservado sin redirect), SCEN-3 (control),
  SCEN-4 (re-disparo: spy/stub de la POST availability vía `page.route`).
- **Acceptance:** `pnpm test:e2e` + `:alquilame` + `:alquicarros` verdes para el nuevo spec.

**Step 7 — QA runtime (agent-browser + dogfood) + Riesgo #2** · Size: M · Dep: Step 6
- Dev server en :4000. Reproducir SCEN-1 en vivo (la URL exacta del reporte) y confirmar banner
  "En Barranquilla" + selector Barranquilla. Cero errores de consola, cero requests fallidos.
- **Riesgo #2:** enumerar `cities` sin `branches` en data real (query a rentacar-data). Si existen,
  documentar en el PR y escalar upstream (no listar la ciudad) — fuera de alcance de este PR.
- **Acceptance:** evidencia (screenshots/HAR) de SCEN-1 corregido; lista de cities-sin-branches (vacía
  o escalada).

## Testing Strategy
- **Unit:** Vitest en `ui-alquilame/tests/` — lógica aislada del middleware (SCEN-1,2,3,5a,5b).
- **E2E:** Playwright multi-marca — observables runtime (SCEN-1..4).
- **Manual/QA:** agent-browser + /dogfood en dev :4000; verificación de la URL del reporte.

## Rollout Plan
- **Deploy:** preview de Vercel por marca; alquilatucarro.com es la única en prod con la app nueva
  (`project_brand_domains_and_cutover`) — verificar alquicarros/alquilame vía alias `-git-main-`.
- **Monitoreo:** confirmar que no se introducen redirect loops (Network: máx 1 redirect por corrección).
- **Rollback:** revert del PR; los cambios son aditivos (un bloque de middleware + un handler), sin
  migraciones ni cambios en `packages/logic`.

## Riesgos abiertos (del design)
- Ciudades sin sucursales → bug persiste para esa ciudad (degradado, sin crash/loop). QA en Step 7.
- alquilame Searcher diverge en `:to` → handler debe resolver destino por marca (Step 5).
