# Implementation Plan — Issue #402: sede de devolución en la superficie query de `/reservas`

**Design:** `docs/specs/2026-07-23-reservas-query-return-branch-design.md` (commit `1d27a5f`)
**Issue:** [#402](https://github.com/amaw-sas/rentacar-web/issues/402)
**Escenarios:** SCEN-402-01 … SCEN-402-08 (definidos en el design, §Escenarios observables)
**Fecha:** 2026-07-23

Un enlace `/reservas?...` sin `lugar_devolucion` deja la devolución en `null` y la búsqueda muere en
`missing_parameters`. El arreglo distingue **ausente** (cae a la recogida en silencio) de **inválido**
(cae a la recogida y avisa), con la regla en un helper puro compartido.

## File Structure

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `packages/logic/src/utils/helpers/resolveReturnBranch.ts` | **Decisión pura**: `(slugDevolucion, returnCode, pickupCode)` → `{ code, corrected }`. Tres strings entran, un objeto sale. Sin Nuxt globals, sin store, sin Vue. | Crear |
| `packages/logic/src/utils/helpers/resolveReturnBranch.test.ts` | Unit del helper: las 4 filas de la tabla de verdad + slug vacío + `returnCode` vacío. Co-locado, sin subcarpeta `__tests__` (convención de esa carpeta). | Crear |
| `packages/logic/src/utils/index.ts` | Re-export `{ resolveReturnBranch }` **y** `export type { ReturnBranchResolution }` en el barril (`:90-101`), siguiendo al vecino `PickupTimingIssue` (`:101`). Así lo consumen las marcas vía `@rentacar-main/logic/utils`. | Modificar |
| `packages/logic/src/composables/useSearch.ts` | `doSearch` pasa a `(): boolean`: `false` en las dos salidas tempranas (`:145`, `:160`), `true` tras `search()` (`:213`). Control de flujo idéntico. | Modificar |
| `packages/logic/src/composables/__tests__/useSearch.doSearchReturn.test.ts` | Unit: `false` en fecha pasada y en rango invertido; `true` cuando alcanza `search()`. | Crear |
| `packages/ui-alquicarros/app/composables/useSearchByQueryParams.ts` | **Efecto**: resolver ANTES de la firma de reuse (`:122-137`); asignar `returnBranch.code`; emitir el aviso tras la decisión de buscar, condicionado a que se haya buscado. | Modificar |
| `packages/ui-alquicarros/app/composables/__tests__/useSearchByQueryParams.mount.test.ts` | Mount test: SCEN-402-01…05, 06, 07 + invariante de orden de emisión. | Crear |
| `packages/ui-alquilame/app/composables/useSearchByQueryParams.ts` | idem sin firma de reuse; asignaciones en `:77-81`, antes del parseo de horas. | Modificar |
| `packages/ui-alquilame/app/composables/__tests__/useSearchByQueryParams.mount.test.ts` | Mount test: SCEN-402-08 (los casos 01…05 y 07 en alquilame). | Crear |
| `packages/ui-alquicarros/app/composables/__tests__/useSearchByQueryParams.test.ts` | Test de source existente (regex sobre el archivo). Su `:41` fija `/doSearch\(\)/` y **sobrevive** al reescribir a ternario. Debe seguir verde; no se amplía — la invariante de orden vive en el mount test, que la comprueba por comportamiento en vez de por texto. El spec decía «se amplían»; corregido durante el planning (§Alcance) al ver que ampliar un test de regex cubriría el orden de emisión por texto, que es justo lo que el mount test hace mejor. | Sin cambios (regresión) |
| `packages/ui-alquilame/app/composables/__tests__/useSearchByQueryParams.test.ts` | idem para alquilame. | Sin cambios (regresión) |
| `docs/specs/issue-402-reservas-sin-lugar/scenarios/reservas-return-branch.scenarios.md` | Los 8 SCEN formalizados como contrato de aceptación para SDD. | Crear |

**Decomposición.** `packages/logic` posee la lógica: el helper decide, `doSearch` informa. Los dos
composables de marca son orquestadores delgados que llaman al helper, escriben el store y emiten el
aviso. La unidad testeable aislada es el helper puro; el comportamiento integrado se verifica con mount
tests por marca, y lo que ninguno de los dos alcanza —que el watcher `flush:'sync'` no reintroduzca el
`null`, y que el toast sobreviva al flush— se verifica en navegador.

Los dos composables siguen siendo archivos separados a propósito: ya divergieron (alquicarros tiene
firma de reuse, alquilame no) y forzarlos a converger ahora es un refactor que este issue no pidió.

## Prerequisites

- Worktree con `pnpm install`; dev server en :4000; `.env.local` copiado a la raíz del worktree (el
  plugin rentacar-data hace hard-throw sin él → 500). Ver `reference_worktree_dev_server_runtime_validation`.
- **Reiniciar el dev server tras editar `packages/logic`** — no recarga de forma fiable (`reference_logic_hmr_stale_dev_server`).
  Esto aplica a los Steps 1 y 2, que tocan logic.
- Typecheck SIEMPRE por marca, nunca en la raíz (`feedback_typecheck_disk_spike`):
  `ionice -c3 nice -n19 pnpm --filter ui-<brand> typecheck`.
- **Baselines, no "verde":** typecheck rojo conocido 268/201/201 por marca (`project_baseline_typecheck_lint_red`);
  suite de logic 140 files / 1057 tests con 3 flaky conocidos incluso en aislamiento
  (`reference_logic_suite_flaky_tests`). Comparar delta, y `git status` antes de culpar al cambio propio.
- **El guard de SDD bloquea `*.scenarios.md` nuevos en worktrees** (`reference_sdd_scenario_worktree_guard`).
  El fichero de escenarios del Step 0 va a chocar al commitear; aplicar la receta main-clone-side.
- `pnpm --filter exec` deja el cwd en el paquete, no en la raíz (`project_issue362_blog_cross_brand_neutral_copy`).

## Steps

### Fase 0 — Contrato de aceptación

**Step 0 — Formalizar los 8 escenarios** · Size: S · Dep: none

- Escribir `scenarios/reservas-return-branch.scenarios.md` con SCEN-402-01…08 en bloques Given/When/Then,
  copiados del design §Escenarios observables sin debilitarlos.
- Anotar en cada uno qué artefacto lo satisface (unit del helper, unit de `doSearch`, mount test, runtime).
- **Acceptance:** los 8 SCEN existen como bloques `SCEN-###`; cada fila de la tabla de verdad del design
  tiene al menos un escenario que la referencia; ninguno queda sin artefacto asignado.

### Fase 1 — Helper puro (foundation)

**Step 1 — `resolveReturnBranch` + unit + barril** · Size: S · Dep: Step 0

- Crear el helper con la firma del design. Predicados de **veracidad**, no comparaciones contra `undefined`:
  `if (!slugDevolucion) → { code: pickupCode, corrected: false }`;
  `if (returnCode) → { code: returnCode, corrected: false }`;
  `→ { code: pickupCode, corrected: pickupCode !== null }`.
- Re-export en `utils/index.ts` siguiendo el patrón de los helpers vecinos.
- **Escenario / encoding ejecutable (mismo step):** test co-locado. Aserciones:
  - **Fila 1:** slug ausente → `{ code: pickup, corrected: false }`; y con `pickupCode: null` → `{ code: null, corrected: false }`.
  - **Fila 1 (vacío):** `slugDevolucion: ''` se comporta como ausente.
  - **Fila 2:** slug + `returnCode` válidos → `{ code: returnCode, corrected: false }` (one-way intacto).
  - **Fila 2→3 (vacío):** `returnCode: ''` NO se escribe; cae a fila 3 y marca `corrected: true`.
  - **Fila 3:** slug presente, `returnCode` undefined, pickup no nulo → `{ code: pickup, corrected: true }`.
  - **Fila 4:** slug presente, `returnCode` undefined, `pickupCode: null` → `{ code: null, corrected: false }`.
- **Acceptance:** `pnpm --filter @rentacar-main/logic test -- resolveReturnBranch` verde, 0 skipped.
  El test debe incluir **una** aserción que importe desde el barril (`@rentacar-main/logic/utils`) además
  de las que importan por ruta relativa: los siete helpers vecinos importan solo en relativo, así que sin
  esa aserción el re-export no se ejercita aquí y su primer verificador real sería el typecheck del Step 3.

### Fase 2 — `doSearch` informa si buscó

**Step 2 — `doSearch(): boolean` + unit** · Size: S · Dep: Step 0 (paralelo al Step 1)

- `useSearch.ts:117` → `const doSearch = (): boolean => {`; `:145` y `:160` → `return false;`;
  añadir `return true;` tras `search()` (`:213`). **No** añadir ni mover ninguna otra salida.
- **Escenario / encoding ejecutable (mismo step):** test **de comportamiento**, no de source. Seis de los
  siete `useSearch.*.test.ts` existentes son regex sobre el texto del archivo y no pueden probar un
  retorno; el único precedente ejecutable es `useSearch.sharedInstance.test.ts:39-81`. Copiarlo entero,
  porque sus dos mitades hacen cosas distintas y ninguna sustituye a la otra: el `beforeEach` de `:39-50`
  monta el entorno (stubs de `useState`/`useToast`/`useRoute` y `setActivePinia(createPinia())`), y el
  cuerpo de `:54-66`/`:71-81` aporta la disciplina de `effectScope` que evita que la instancia compartida
  se filtre entre tests (cuarta trampa, abajo). Aserciones:
  - fecha de recogida en el pasado → `false`, y `search()` NO se llama.
  - devolución ≤ recogida (`selectedDays === 0`) → `false`, y `search()` NO se llama.
  - parámetros válidos → `true`, y `search()` SÍ se llama.
- **Cuatro trampas del harness**, ninguna evidente al leer el código:
  - `useSearch.ts:113` hace `const { search } = storeSearchData` **al crear la instancia**. Un
    `vi.spyOn(store, 'search')` instalado después de llamar `useSearch()` no se observa nunca: hay que
    stubear antes.
  - `search` es una acción async real que hace `$fetch` (`useStoreSearchData.ts:75`). Stub, no spy.
    Mecanismo concreto: `useStoreSearchData` es un setup store, así que sobrescribir `store.search` sobre
    la instancia **antes** de llamar `useSearch()` es lo que hace que el destructure de `:113` recoja el
    mock. Nada más hace falta para llegar a `search()` en la tercera aserción: `analyticsBrand()`
    (`useSearch.ts:582-588`) se traga el `useRuntimeConfig` ausente en su propio `try/catch`, y
    `trackAnalyticsEvent` devuelve `false` sin gtag en vez de lanzar (`analytics.ts`, guard `if (!gtag)`).
  - `selectedDays` es un `computed` de solo lectura (`useStoreReservationForm.ts:216`). «Sembrar el store»
    significa escribir `fechaRecogida`, `fechaDevolucion` y `horaRecogida`, no los refs derivados.
  - **La instancia es compartida y se filtra entre tests.** `useSearch` solo se exporta envuelto en
    `createSharedComposable` (`useSearch.ts:603-611`); `useSearchInstance` no es público, así que no hay
    forma de esquivarlo. `createSharedComposable` solo libera vía `tryOnScopeDispose`, que es un no-op sin
    scope activo: llamar `useSearch()` fuera de un `effectScope` cachea la instancia para toda la vida del
    módulo, sujetando refs de la **primera** Pinia. Con `setActivePinia(createPinia())` en `beforeEach`, las
    aserciones 2 y 3 sembrarían un store que la instancia cacheada nunca lee, y fallarían contra estado
    viejo con un mensaje que parece un bug del código. La disciplina correcta —`effectScope()`,
    `scope.run(() => useSearch())`, `scope.stop()`— vive en el **cuerpo** de los tests
    (`useSearch.sharedInstance.test.ts:54-66` y `:71-81`), no en el `beforeEach`: copiar solo `:39-50`
    deja el `setActivePinia` sin el scope que lo hace efectivo. Van juntos.
    (`import.meta.server` es falsy bajo vitest, así que el test recorre la rama compartida de `:609-610`
    y no el fallback por llamada: la disciplina de scope es obligatoria, no opcional.)
- **Acceptance:** `pnpm --filter @rentacar-main/logic test -- useSearch.doSearchReturn` verde con las tres
  aserciones ejecutadas (no source-regex); suite de logic sin regresión contra baseline (140 files /
  1057 tests, 3 flaky conocidos); typecheck de las **tres** marcas sin delta contra 268/201/201. Ningún
  `Searcher.vue` ni `useSearchByRouteParams.ts` modificado.
  (Los pins de source-regex sobre las marcas viven en los Steps 3 y 4, que son los que reescriben esos
  archivos. Aquí no pueden fallar, así que no se listan: un criterio que pasa haga lo que haga el paso
  no es un criterio.)

**Nota de recolección — aplica a los acceptance de los Steps 3 y 4.** El filtro de vitest tras `test --`
es una **subcadena sobre la ruta completa**, y falla ruidosamente si no casa con nada
(`vitest run "noExiste"` → `No test files found`, exit 1). El riesgo aquí no es que un filtro malo pase en
verde, sino que sea **demasiado ancho**: en cuanto exista el `*.mount.test.ts`, el filtro
`useSearchByQueryParams` recoge los dos archivos, y `reservas` arrastra además
`tests/reservas-path-routing.test.ts`. Por eso cada acceptance de abajo lleva su recuento esperado: el
número de tests ejecutados es lo que discrimina, no el color.

(El guard de `reference_playwright_file_filter_bypasses_collection` es específico de Playwright y **no**
aplica a vitest — comprobado en este repo.)

### Fase 3 — alquicarros

**Step 3 — Cablear helper y aviso en alquicarros** · Size: M · Dep: Steps 1, 2

- Introducir `const pickupCode = branchRecogida?.code ?? null;` y resolver **antes** de calcular la firma:
  `const returnBranch = resolveReturnBranch(slugDevolucion, branchDevolucion?.code, pickupCode)`.
- La firma de reuse (`:122-137`) consume `returnBranch.code`, no `branchDevolucion?.code`. Este es el punto
  que, si se hace tarde, rompe `canReuseExistingSearch` para siempre y borra la categoría del usuario.
  El campo `pickup:` puede quedarse como está o pasar a `pickupCode`: es indiferente, porque
  `reservationSearchSignature` mapea tanto `undefined` como `null` a `''`. Elegir uno y no mezclar.
- Asignar `lugarRecogida = pickupCode` y después `lugarDevolucion = returnBranch.code`.
- Cierre: `const searchDispatched = canReuseExistingSearch ? false : doSearch();` y a continuación
  `if (returnBranch.corrected && searchDispatched) createMessage({ … })` con la copia del design.
- **Escenario / encoding ejecutable (mismo step):** mount test nuevo. `// @vitest-environment jsdom` en
  la primera línea, `vi.mock('pinia', …)` con `storeToRefs` a identidad (obligatorio: el composable
  importa `storeToRefs` de verdad y los stubs son objetos planos de refs), `vi.stubGlobal` para
  `useRoute`, `useStoreReservationForm`, `useStoreAdminData`, `useStoreSearchData`, `useSearch` y
  `useMessages`; componente anfitrión mínimo que invoca el composable en su `setup`.
  **`vi.stubGlobal('useMessages', …)` no tiene precedente en el repo** — ningún archivo de capa app de
  las dos marcas llama hoy a `useMessages()`, aunque el auto-import existe. Si falta el stub, el fallo
  parecerá un bug del código y no lo será. Aserciones:
  - **SCEN-402-01:** sin `lugar_devolucion` → `lugarDevolucion` = código de recogida; `doSearch` llamada; 0 `createMessage`.
  - **SCEN-402-02:** slug inválido → `lugarDevolucion` = código de recogida; 1 `createMessage` con el título del design.
  - **SCEN-402-03:** slug válido distinto → `lugarDevolucion` = ese código; 0 `createMessage`.
  - **SCEN-402-04:** recogida irresoluble, sin devolución → 0 `createMessage` de corrección.
  - **SCEN-402-05:** recogida irresoluble + devolución inválida → 0 `createMessage` de corrección.
  - **SCEN-402-06:** búsqueda viva + categoría elegida, misma query → `doSearch` NO llamada y 0 `createMessage`.
  - **SCEN-402-07:** `doSearch` stub devuelve `false` → 0 `createMessage` de corrección.
  - **Invariante de orden:** con un registro compartido de llamadas, ningún `createMessage` precede a
    `doSearch`. Aserción sobre *todos*, no solo el de corrección, para que cubra avisos futuros.
- **Acceptance**, cada línea con su comando y su recuento (baselines medidos hoy, antes del cambio):
  - `pnpm --filter ui-alquicarros test -- useSearchByQueryParams.mount` → **1 file / 8 tests**, 0 skipped.
    Un `it()` por viñeta de arriba, para que el recuento de vitest sea comparable contra el criterio.
  - `pnpm --filter ui-alquicarros test -- useSearchByQueryParams` → baseline **1 file / 6 tests**; tras el
    Step 3 recoge también el mount test, así que el discriminador de que el test de source sobrevivió es
    que sus 6 sigan pasando dentro del total.
  - `pnpm --filter ui-alquicarros test -- f3-citypage` → **1 file / 71 tests**, sin delta.
  - `pnpm --filter ui-alquicarros test -- reservas` → **2 files / 51 tests**, sin delta.
  - `ionice -c3 nice -n19 pnpm --filter ui-alquicarros typecheck` → sin delta contra el baseline de 268.

### Fase 4 — alquilame

**Step 4 — Cablear helper y aviso en alquilame** · Size: M · Dep: Steps 1, 2

- Mismo helper y mismo punto de emisión, **distinto diff**: las asignaciones viven en `:77-81`, antes del
  parseo de horas (`:84-92`); no hay firma de reuse ni `useStoreSearchData`. Cierre:
  `const searchDispatched = doSearch();` seguido del mismo `if`.
- **Escenario / encoding ejecutable (mismo step):** mount test análogo al Step 3 —misma receta de harness—
  cubriendo **SCEN-402-08**: los casos 01…05 y 07 con el comportamiento observable de alquicarros.
  Sin caso de reuse: esa rama no existe en este archivo.
- **Acceptance**, cada línea con su comando y su recuento (baselines medidos hoy, antes del cambio):
  - `pnpm --filter ui-alquilame test -- useSearchByQueryParams.mount` → **1 file / 7 tests** (01…05, 07 +
    orden), 0 skipped. Un `it()` por caso, igual que en el Step 3.
  - `pnpm --filter ui-alquilame test -- useSearchByQueryParams` → baseline **1 file / 6 tests**; mismo
    discriminador que en el Step 3.
  - `pnpm --filter ui-alquilame test -- reservas` → **3 files / 61 tests**, sin delta.
  - `ionice -c3 nice -n19 pnpm --filter ui-alquilame typecheck` → sin delta contra el baseline de 201.

### Fase 5 — Runtime

**Step 5 — Validación en navegador + evidencia del follow-up** · Size: M · Dep: Steps 3, 4

- Dev server del worktree (reiniciado tras los cambios en logic). Con `/agent-browser`:
  - **SCEN-402-01 en runtime:** cargar `/reservas?lugar_recogida=<válido>&fecha_recogida=…&fecha_devolucion=…`;
    observar el POST a `/api/reservations/availability` con `returnLocation` = código de recogida;
    sin toast; sin el falso «Tarifa adicional por traslado».
  - **SCEN-402-02 en runtime:** con `lugar_devolucion=<inexistente>`; observar el mismo `returnLocation`
    y el toast **visible en el DOM después** de completarse la búsqueda (es lo que prueba que sobrevive al flush).
  - Cero errores de consola y cero peticiones fallidas en ambos.
- **Evidencia del follow-up del middleware PATH:** en la misma sesión, cargar una URL PATH con sede
  inválida y observar si el toast «Ubicación inválida» llega al DOM o lo borra `flushMessages`. Convierte
  la hipótesis del design en dato antes de abrir el issue.
- **Acceptance (bloqueante):** SCEN-402-01 y SCEN-402-02 satisfechos con evidencia observada —payload de
  la petición y nodo del toast en el DOM—, no inferida; cero errores de consola y cero peticiones fallidas.
- **Acceptance (NO bloqueante):** veredicto del middleware anotado como confirmado o refutado. Es
  investigación para un issue distinto; si la hipótesis se refuta, no debe frenar el PR de #402.

### Fase 6 — Gate

**Step 6 — Gate de calidad y verificación** · Size: M · Dep: Step 5

- Los cuatro agentes en paralelo: code-reviewer, security-reviewer, edge-case-detector, performance-engineer.
- Resolver o justificar cada hallazgo. En #367 este gate cazó 6 defectos que los tests propios no cubrían;
  tratar sus hallazgos como trabajo, no como opinión.
- `/verification-before-completion` con evidencia fresca: los 8 escenarios satisfechos por ejecución,
  sin escenarios debilitados ni expectativas reescritas para que pasen.
- **Acceptance:** `[8/8] scenarios satisfied`; delta de typecheck y de suites contra baseline documentado
  con la salida real de cada comando; reward-hacking check limpio, verificado con `git diff` sobre los
  ficheros de test para descartar expectativas reescritas después de escribir el código.

## Testing Strategy

| Nivel | Qué cubre | Por qué ahí |
|---|---|---|
| Unit del helper (logic) | Las 4 filas + los dos casos de cadena vacía | La regla es pura; no necesita ni Vue ni store |
| Unit de `doSearch` (logic) | `false` en los 2 guards, `true` al buscar | Sostiene SCEN-402-07 sin montar nada |
| Mount por marca | SCEN-402-01…07 (alquicarros), 08 (alquilame), orden de emisión | El composable corre en `onMounted`; necesita anfitrión |
| Runtime | SCEN-402-01 y 02 en navegador | Ningún unit prueba que el watcher `flush:'sync'` no reintroduzca `null` ni que el toast sobreviva |

El test de orden de emisión es el único que impide una regresión invisible: poner el aviso antes de
`doSearch()` compila, pasa el typecheck y se ve razonable en revisión, pero el toast muere en el flush.

## Rollout Plan

- Un solo PR con las dos marcas, `Closes #402`. Verificar el cierre con GraphQL (`feedback_pr_close_keyword_per_issue`).
- Crear el PR con la cuenta `pabloandi` y volver a `amaw-dev` después (`reference_gh_pr_account_switch`).
- **Push solo con autorización explícita del usuario.**
- Sin flag ni despliegue por fases: el cambio es correctivo y su peor caso es el comportamiento actual.
- Avisar del escalón en analítica antes del despliegue: `rental_search` empezará a emitir `return_branch`
  en enlaces donde hoy va vacío. No es anomalía de datos.

## Riesgos abiertos (del design)

- **`packages/logic` sirve a tres marcas.** El cambio de `doSearch` es aditivo y ningún call site lee el
  retorno, pero las tres entran en el radio de verificación. Mitigado por el acceptance del Step 2.
- **One-way legítimo convertido en round-trip.** Solo cae al fallback cuando el slug no resuelve. Fijado por SCEN-402-03.
- **Store de sedes vacío al montar.** Autoneutralizado por la fila 4: sin sedes, la recogida tampoco
  resuelve y `corrected` es `false`. Fijado por SCEN-402-05.
- **Divergencia futura entre marcas.** El helper reduce la superficie compartida, pero los composables
  siguen separados. Cada marca fija su contrato con su propio mount test.
