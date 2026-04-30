---
name: rentacar-data-resilience
created_by: brainstorming + sop-planning
created_at: 2026-04-30T00:00:00Z
spec: docs/specs/2026-04-29-bundled-rentacar-data-resilience-design.md
plan: docs/specs/2026-04-29-bundled-rentacar-data-resilience/implementation/plan.md
issues: ["#2", "#3", "#4"]
---

Holdout scenarios para el bundled fix de #2 (ISR cachea outage Supabase como HTML 500), #3 (useFetchRentacarData throw síncrono en Pinia factory + 5 consumers), #4 (transformExtras devuelve $0 silencioso para columnas NULL). Todos los scenarios son verificables desde fuera del sistema (ejecución, output observable, render visible).

## SCEN-001: Build aborta cuando Supabase falla durante prerender

**Given**: en CI, build de cualquier marca se ejecuta y `/api/rentacar-data` retorna 500 (Supabase inalcanzable).
**When**: corre `pnpm build:alquilatucarro` (o equivalente por marca).
**Then**: el proceso sale con exit status ≠ 0; stderr contiene la string `[rentacar-data] Failed to load reservation data`; el directorio `.output/` no se publica.
**Evidence**: exit code del proceso `pnpm build:alquilatucarro`; stdout/stderr capturado; presencia/ausencia de `packages/ui-alquilatucarro/.output/` post-build.

## SCEN-002: Plugin re-throws con cause chain preservada

**Given**: el plugin `packages/logic/plugins/rentacar-data.ts` se ejecuta y `useAsyncData` retorna `{ error: ref(originalError) }` donde `originalError` es un `Error` con mensaje `'Supabase down'`.
**When**: el plugin termina su lógica.
**Then**: el plugin lanza un `Error` cuyo `.message` empieza con `[rentacar-data] Failed to load`; `.cause` es la referencia exacta a `originalError`; `console.error` fue invocado exactamente una vez con el prefijo `[rentacar-data] fetch failed:` antes del throw.
**Evidence**: instancia `Error` capturada en test (`expect(error.cause).toBe(originalError)`); spy `console.error` invocations count + arguments.

## SCEN-003: useFetchRentacarData retorna sentinel cuando state es null

**Given**: `useState('rentacar-data')` retorna un ref con `value === null`.
**When**: un consumer invoca `useFetchRentacarData()`.
**Then**: el retorno es un objeto con shape `{ categories: [], branches: [], extras: undefined, vehicleCategories: {} }`; ningún throw ocurre; el objeto retornado es la misma referencia entre invocaciones (sentinel constante).
**Evidence**: valor de retorno del composable en test (`expect(result).toEqual({ categories: [], branches: [], extras: undefined, vehicleCategories: {} })`); identidad referencial verificada con `expect(useFetchRentacarData()).toBe(useFetchRentacarData())`.

## SCEN-004: useStoreAdminData factory no lanza con state vacío

**Given**: `useState('rentacar-data')` retorna un ref con `value === null`.
**When**: un componente invoca `useStoreAdminData()` por primera vez en la app instance.
**Then**: la store se crea sin throw; `sortedBranches.value` es `[]` (array vacío); `searchBranchByCode('XYZ')` retorna `undefined`; `searchBranchBySlugOrCode('bogota-aeropuerto')` retorna `undefined`; subsiguientes invocaciones de `useStoreAdminData()` retornan la misma instancia sin re-throw.
**Evidence**: store instance retornada por `useStoreAdminData()` en test con Pinia testing harness; valores de `sortedBranches.value`, `searchBranchByCode('XYZ')`, `searchBranchBySlugOrCode('bogota-aeropuerto')` aserteados.

## SCEN-005: Consumers directos renderizan graceful con sentinel

**Given**: `useState('rentacar-data')` retorna un ref con `value === null`.
**When**: se invocan `useLocalBusiness('bogota', 'Bogotá')` y `useCityProductSchema()` (ambos toman datos directos del composable).
**Then**: ningún throw ocurre; ambas funciones completan sin error; el resultado de `useLocalBusiness` itera `branches: []` sin `TypeError`; `useCityProductSchema` retorna un schema válido aún con `vehicleCategories: {}`.
**Evidence**: invocación directa de los composables en test; verificación de no-throw via `expect(() => useLocalBusiness(...)).not.toThrow()`; estructura mínima del schema verificada.

## SCEN-006: Sentinel es immutable (Object.freeze)

**Given**: el sentinel retornado por `useFetchRentacarData()` cuando state es null.
**When**: un consumer en strict mode intenta mutar el sentinel: `sentinel.branches.push({...})` o `sentinel.categories = []`.
**Then**: la mutación lanza `TypeError` (Vitest corre ESM strict por default).
**Evidence**: `expect(() => { sentinel.branches.push(...) }).toThrow(TypeError)` en test.

## SCEN-007: transformExtras propaga null sin coercion a 0

**Given**: una row de `rental_companies` con `{ extra_driver_day_price: null, baby_seat_day_price: null, wash_price: 20000, wash_onsite_price: null, wash_deep_price: null, wash_deep_upholstery_price: null }`.
**When**: se invoca `transformExtras(row)`.
**Then**: el retorno es `{ extraDriverDayPrice: null, babySeatDayPrice: null, washPrice: 20000, washOnsitePrice: null, washDeepPrice: null, washDeepUpholsteryPrice: null }`; los campos NULL nunca son `0` (no coercion silenciosa); el campo no-NULL preserva su valor numérico exacto.
**Evidence**: valor de retorno aserteado campo por campo en test; type assertion `null` (no `0` por equality).

## SCEN-008: useCategory dispara default 12000 cuando extras es null

**Given**: `useState('rentacar-data')` poblado con `{ ..., extras: { extraDriverDayPrice: null, babySeatDayPrice: null, ... } }`; un `CategoryAvailabilityData` válido para Bogotá / categoría B.
**When**: `useCategory(availData)` se inicializa.
**Then**: el binding interno (verificable via la API expuesta por la composable) refleja precios default: `12000` para conductor adicional y silla bebé. Por ejemplo, si la composable expone `getExtraDriverTotalAmount(numberDays=2)` → retorna `24000` (no `0`).
**Evidence**: salidas de la composable `useCategory()` que dependen de `EXTRA_DRIVER_DAY_PRICE` / `BABY_SEAT_DAY_PRICE`. Test invoca el getter público correspondiente y assert el valor calculado.

## SCEN-009: useCategory usa valor Supabase cuando extras NO es null

**Given**: `useState('rentacar-data')` poblado con `{ ..., extras: { extraDriverDayPrice: 15000, babySeatDayPrice: 10000, ... } }`; un `CategoryAvailabilityData` válido.
**When**: `useCategory(availData)` se inicializa.
**Then**: los precios reflejan los valores Supabase. Para `numberDays=2`, conductor adicional total = `30000` (= 15000 × 2), silla bebé total = `20000` (= 10000 × 2). El fallback `?? 12000` no dispara cuando hay valor real.
**Evidence**: outputs de la composable `useCategory()` aserteados contra valores derivados del extras Supabase, NO de los defaults del código.

## SCEN-010: Cotización user-facing no muestra $0 silencioso

**Given**: una cualquiera de las 3 marcas (alquilatucarro, alquilame, alquicarros) corriendo en Playwright; Supabase mockeado para `/api/rentacar-data` retorna payload con todos los campos de `extras` en `null` (per `EXTRAS_NULL_FIXTURE`); usuario navega a `/bogota`, selecciona sucursal Bogotá, fechas válidas, opta por agregar conductor adicional + silla bebé, llega a la pantalla de resumen.
**When**: el componente `ReservationResume.vue` renderiza las líneas user-facing.
**Then**: el elemento `[data-testid="extra-driver-line"]` está visible y contiene el texto `12.000` (no `$0`); el elemento `[data-testid="baby-seat-line"]` contiene `12.000`; ningún elemento de líneas de extras contiene la string `$0` o `$ 0`.
**Evidence**: DOM snapshot capturado por Playwright en cada marca; `expect(page.getByTestId('extra-driver-line')).toContainText('12.000')`; `expect(...).not.toContainText('$0')`.

---

## Verificación empírica V6.1 (post-deploy, no automatizable)

V6.1 evalúa el comportamiento de Vercel ISR ante revalidación 5xx. NO es un scenario automatizado — requiere deploy a preview Vercel + manipulación manual de env. Especificación completa en spec §6.

**Outcome esperado**: Vercel mantiene cache previa cuando la función ISR retorna 500 durante revalidación. Si NO lo hace → issue follow-up para investigar Cache-Control directo. **No bloquea merge** del bundled fix porque el throw build-time ya impide que un build malo se publique.

---

## Mapping a steps del plan

| SCEN | Step del plan que satisface | Test layer |
|---|---|---|
| SCEN-001 | Step 5 (verificación manual) | Manual `pnpm build` con `NUXT_SUPABASE_URL` inválido |
| SCEN-002 | Step 5 | Vitest unit `plugins/__tests__/rentacar-data.test.ts` |
| SCEN-003 | Step 4 | Vitest unit `useFetchRentacarData.test.ts` |
| SCEN-004 | Step 4 | Vitest unit `useStoreAdminData.test.ts` (con `@pinia/testing`) |
| SCEN-005 | Step 4 | Vitest unit `useLocalBusiness.test.ts` + `useCityProductSchema.test.ts` |
| SCEN-006 | Step 4 | Vitest unit `useFetchRentacarData.test.ts` |
| SCEN-007 | Step 3 | Vitest unit `transformers.test.ts` (extender existente) |
| SCEN-008 | Step 3 | Vitest unit `useCategory.test.ts` |
| SCEN-009 | Step 3 | Vitest unit `useCategory.test.ts` |
| SCEN-010 | Step 6 | Playwright e2e `extras-fallback.spec.ts` × 3 marcas |
