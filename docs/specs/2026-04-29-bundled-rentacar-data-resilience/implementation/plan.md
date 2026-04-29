# Implementation Plan — bundled fix #2 + #3 + #4

**Spec:** [`docs/specs/2026-04-29-bundled-rentacar-data-resilience-design.md`](../../2026-04-29-bundled-rentacar-data-resilience-design.md)
**Created:** 2026-04-29
**Status:** Ready for implementation
**Mode:** Interactive (user-facilitated execution via `/scenario-driven-development`)

Como las decisiones de diseño y los scenarios ya están aprobados (5 Q&A en brainstorming + 3 iteraciones de spec-document-reviewer), este plan se concentra en el **orden de cambios** y los **acceptance criteria por paso** — no re-litiga el diseño.

---

## File Structure Map

| Path | Acción | Responsabilidad única | Issue |
|---|---|---|---|
| `packages/logic/src/utils/types/data/ExtrasData.ts` | **NEW** | Definición canónica del tipo `ExtrasData`. Cada campo `number \| null`. Default export. | #4 |
| `packages/logic/src/utils/types/data/ReservasApiData.ts` | MODIFY | Importar `ExtrasData` desde 2.3.a. Re-exportar para preservar `@rentacar-main/logic/utils`. Relajar `extras: ExtrasData \| undefined`. | #3 + #4 |
| `packages/logic/server/utils/transformers.ts` | MODIFY | Importar `ExtrasData` (no duplicarlo). Signature de `transformExtras` acepta `number \| null` por campo; usa helper `num` para preservar `null`. | #4 |
| `packages/logic/src/composables/useFetchRentacarData.ts` | MODIFY | Sentinel `Object.freeze`-d + `console.warn` dev-only. Sin throw. | #3 |
| `packages/logic/plugins/rentacar-data.ts` | MODIFY | `try/catch` → `useAsyncData.error` ref + re-throw con `cause` chain. `console.error` previo al throw. | #2 |
| `packages/ui-alquilatucarro/app/components/ReservationResume.vue:97-98` | MODIFY | Agregar `data-testid="extra-driver-line"` y `data-testid="baby-seat-line"` para enable S4.4 e2e. Sin cambio de lógica. | #4 (test infra) |
| `packages/ui-alquilame/app/components/ReservationResume.vue` | MODIFY | Idem `data-testid` (líneas equivalentes). | #4 (test infra) |
| `packages/ui-alquicarros/app/components/ReservationResume.vue` | MODIFY | Idem `data-testid`. | #4 (test infra) |

**5 archivos en `packages/logic`** (1 nuevo + 4 modificados) + **3 archivos UI** (1 línea de `data-testid` por marca para enable e2e). Sin cambio de lógica en UI. Sin tocar `nuxt.config.ts`. Sin tocar server endpoint (`rentacar-data.get.ts:40` único caller, sin cambio). Cobertura test agregada en archivos Vitest existentes/nuevos bajo `__tests__/` adyacentes a cada productivo, más una nueva e2e Playwright.

**Desviación menor del spec §2.5:** spec decía "Sin tocar consumers UI". El plan agrega 2 líneas de `data-testid` en `ReservationResume.vue` × 3 marcas para que S4.4 sea automatizable. Es test infrastructure, no cambio de behavior.

### Test files añadidos

| Path | Cubre |
|---|---|
| `packages/logic/server/utils/__tests__/transformers.test.ts` | S4.1 (extender existente — verificado en Prerequisites) |
| `packages/logic/src/composables/__tests__/useCategory.test.ts` | S4.2, S4.3 |
| `packages/logic/src/composables/__tests__/useFetchRentacarData.test.ts` | S3.1, S3.4 |
| `packages/logic/src/stores/__tests__/useStoreAdminData.test.ts` | S3.2 |
| `packages/logic/src/composables/__tests__/useLocalBusiness.test.ts` | S3.3 (parte 1) |
| `packages/logic/src/composables/__tests__/useCityProductSchema.test.ts` | S3.3 (parte 2) |
| `packages/logic/plugins/__tests__/rentacar-data.test.ts` | S2.2 |
| `e2e/extras-fallback.spec.ts` | S4.4 |

---

## Prerequisites

- Branch: `fix/rentacar-data-resilience-bundled` desde `main`.
- `pnpm install` limpio.
- `pnpm typecheck` y `pnpm lint` verdes en `main` antes de empezar (verificar baseline).
- Vitest configurado en `packages/logic` (ya existe — `vitest.config.ts`).
- Playwright configurado para `BRAND` env (ya existe — ver `e2e/`).
- Agregar `@pinia/testing` como devDep en `packages/logic/package.json` (verificado: NO está instalado actualmente). Necesario para `createTestingPinia` en Step 4. Comando: `pnpm --filter @rentacar-main/logic add -D @pinia/testing`.

**Estado verificado en repo (no asumir):**
- `packages/logic/server/utils/__tests__/transformers.test.ts` **existe** — Step 3 lo extiende, no lo crea.
- `ReservationResume.vue:97-98` renderiza las líneas user-facing: `Conductor: $ {{ currencyExtraDriverPrice }}` y `Silla bebé: $ {{ currencyBabySeatPrice }}`. Step 6 agrega `data-testid` ahí.
- `CategoryCard.vue` contiene solo texto descriptivo de "conductor adicional" — no renderiza líneas de precio.

**No requiere:**
- Migración SQL — out of scope, va a `rentacar-dashboard`.
- Cambios en `nuxt.config.ts` de las marcas.
- Cambio de dependencias productivas en `package.json` (solo devDep `@pinia/testing`).

---

## Steps

### Step 1 — Crear tipo canónico `ExtrasData`

**Description:** Crear nuevo archivo de tipo con campos nullables. Es la fundación para que el null pricing sea expresable en el sistema de tipos. Sin este paso, los pasos 2 y 3 no compilan.

**Size:** S
**Dependencies:** none
**Files:**
- `packages/logic/src/utils/types/data/ExtrasData.ts` (NEW)

**Implementación:**
```ts
export default interface ExtrasData {
  extraDriverDayPrice: number | null
  babySeatDayPrice: number | null
  washPrice: number | null
  washOnsitePrice: number | null
  washDeepPrice: number | null
  washDeepUpholsteryPrice: number | null
}
```

**Acceptance criteria:**
- [ ] Archivo existe con la interfaz exportada por default.
- [ ] `pnpm typecheck` verde en `packages/logic` (el tipo está sin uso aún — additive).
- [ ] `pnpm lint` verde.

**Scenarios cubiertos:** ninguno aún (foundation).

---

### Step 2 — Consolidar tipo en `ReservasApiData.ts`

**Description:** Reemplazar la definición duplicada local de `ExtrasData` por el import del archivo canónico. Relajar `extras` a `ExtrasData | undefined` para que el sentinel del paso 4 sea type-valid. Mantener re-export para preservar el path `@rentacar-main/logic/utils` que consumers ya usan.

**Size:** S
**Dependencies:** Step 1
**Files:**
- `packages/logic/src/utils/types/data/ReservasApiData.ts` (MODIFY)

**Implementación:**
```ts
import type CategoryData from './CategoryData';
import type BranchData from './BranchData';
import type VehicleCategoryData from './VehicleCategoryData';
import type ExtrasData from './ExtrasData';

export type { ExtrasData };

export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;
  vehicleCategories: VehicleCategoryData;
}
```

**Acceptance criteria:**
- [ ] La definición local de `ExtrasData` (líneas 5–12 originales) ya no existe.
- [ ] `extras` ahora es `ExtrasData | undefined`.
- [ ] `pnpm typecheck` verde — `transformers.ts` sigue exportando su `ExtrasData` local con tipos no-nullables (pre-Step 3); ambos tipos coexisten temporalmente, asignación `OldExtrasData → NewExtrasData` es legal porque `number` ⊆ `number | null`.
- [ ] `pnpm lint` verde.
- [ ] Importadores de `ExtrasData` desde `@rentacar-main/logic/utils` siguen compilando.

**Scenarios cubiertos:** ninguno (typecheck-only refactor).

---

### Step 3 — Refactor `transformExtras` para propagar `null` + tests de pricing

**Description:** Reemplazar la definición local de `ExtrasData` en `transformers.ts` por import del canónico. Cambiar signature de `transformExtras` para aceptar `number | null` por campo. Usar helper `num` para preservar `null` en lugar de coercer a `0`. Esto desbloquea que `useCategory.ts:32` reciba `null` y dispare `?? 12000`. Tests cubren el comportamiento end-to-end de pricing.

**Size:** M
**Dependencies:** Step 2
**Files:**
- `packages/logic/server/utils/transformers.ts` (MODIFY)
- `packages/logic/server/utils/__tests__/transformers.test.ts` (MODIFY o NEW)
- `packages/logic/src/composables/__tests__/useCategory.test.ts` (NEW)

**Implementación productiva:**
```ts
// transformers.ts (extracto)
import type ExtrasData from '../../src/utils/types/data/ExtrasData'
export type { ExtrasData };

export function transformExtras(rentalCompany: {
  extra_driver_day_price: number | null
  baby_seat_day_price: number | null
  wash_price: number | null
  wash_onsite_price: number | null
  wash_deep_price: number | null
  wash_deep_upholstery_price: number | null
}): ExtrasData {
  const num = (v: number | null) => (v == null ? null : Number(v))
  return {
    extraDriverDayPrice: num(rentalCompany.extra_driver_day_price),
    babySeatDayPrice: num(rentalCompany.baby_seat_day_price),
    washPrice: num(rentalCompany.wash_price),
    washOnsitePrice: num(rentalCompany.wash_onsite_price),
    washDeepPrice: num(rentalCompany.wash_deep_price),
    washDeepUpholsteryPrice: num(rentalCompany.wash_deep_upholstery_price),
  }
}
```

**Tests:**
- `transformers.test.ts`: dado row con `extra_driver_day_price: null`, `transformExtras` retorna `{ extraDriverDayPrice: null, ... }` — **S4.1**.
- `useCategory.test.ts`: `useCategory()` con `extras.extraDriverDayPrice = null` → `EXTRA_DRIVER_DAY_PRICE === 12000` — **S4.2**. Con `extras.extraDriverDayPrice = 15000` → `EXTRA_DRIVER_DAY_PRICE === 15000` — **S4.3**.

**Acceptance criteria:**
- [ ] `transformers.ts` ya no define `ExtrasData` localmente; importa del canónico.
- [ ] `transformExtras` acepta `null` y propaga; nunca retorna `0` por coercion.
- [ ] **Single-callsite invariant verificado:** `grep -rn "transformExtras" packages/` retorna solo `server/api/rentacar-data.get.ts:40` y `server/utils/transformers.ts` (declaración) — sin nuevos callsites accidentales.
- [ ] S4.1 pasa en Vitest.
- [ ] S4.2 + S4.3 pasan en Vitest.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm lint` verde.

**Scenarios cubiertos:** S4.1, S4.2, S4.3.

---

### Step 4 — Sentinel inmutable en `useFetchRentacarData`

**Description:** Reemplazar el `throw` síncrono por retorno de sentinel `Object.freeze`-d cuando `useState('rentacar-data')` es null. Esto cierra el bug de Pinia factory de #3 y los 5 consumers directos (`useCategory`, `useLocalBusiness`, `useCityProductSchema`, `ReservationResume.vue`, `CategorySelectionSection.vue`). Warn dev-only para no ensuciar producción. Tests confirman que cada consumer renderiza graceful con sentinel.

**Size:** M
**Dependencies:** Step 2 (necesita `extras: ExtrasData | undefined` para que el cast sea válido)
**Files:**
- `packages/logic/src/composables/useFetchRentacarData.ts` (MODIFY)
- `packages/logic/src/composables/__tests__/useFetchRentacarData.test.ts` (NEW)
- `packages/logic/src/stores/__tests__/useStoreAdminData.test.ts` (NEW)
- `packages/logic/src/composables/__tests__/useLocalBusiness.test.ts` (NEW)
- `packages/logic/src/composables/__tests__/useCityProductSchema.test.ts` (NEW)

**Implementación productiva:**
```ts
import type { ReservasApiData } from '@rentacar-main/logic/utils';

const EMPTY_SENTINEL: ReservasApiData = Object.freeze({
  categories: [],
  branches: [],
  extras: undefined,
  vehicleCategories: {},
}) as ReservasApiData;

export default function useFetchRentacarData(): ReservasApiData {
  const data = useState<ReservasApiData | null>('rentacar-data');

  if (!data.value) {
    if (import.meta.dev) {
      console.warn('[useFetchRentacarData] state is null; returning empty sentinel.');
    }
    return EMPTY_SENTINEL;
  }

  return data.value;
}
```

**Tests:**
- `useFetchRentacarData.test.ts`: state null → sentinel — **S3.1**. Mutación con `Object.freeze` falla en strict mode — **S3.4**.
- `useStoreAdminData.test.ts`: factory con state null no lanza; `sortedBranches.value` es `[]`; `searchBranchByCode('XYZ')` undefined — **S3.2**.
- `useLocalBusiness.test.ts`: invocación con state null no lanza; itera `branches: []` sin error — **S3.3 parte 1**.
- `useCityProductSchema.test.ts`: invocación con state null retorna schema válido con `vehicleCategories: {}` sin lanzar — **S3.3 parte 2**.

**Acceptance criteria:**
- [ ] `useFetchRentacarData` ya no contiene `throw new Error(...)`.
- [ ] Sentinel construido con `Object.freeze`.
- [ ] Warn solo bajo `import.meta.dev`.
- [ ] S3.1, S3.2, S3.3 (parts 1+2), S3.4 pasan en Vitest.
- [ ] **Typecheck de consumers `.vue`:** `pnpm typecheck` verifica que `ReservationResume.vue:186` (`const { vehicleCategories } = useFetchRentacarData()`) y `CategorySelectionSection.vue:226` siguen compilando con el sentinel. Sin assertion runtime, el typecheck garantiza que `vehicleCategories: {}` matchea el tipo declarado para esos consumers — el segundo leg de S3.3 cubierto por TS.
- [ ] `pnpm typecheck` verde — el cast `as ReservasApiData` es válido porque `extras: undefined` matchea el tipo relajado del Step 2.
- [ ] `pnpm lint` verde.

**Scenarios cubiertos:** S3.1, S3.2, S3.3 (composable runtime + .vue typecheck), S3.4.

---

### Step 5 — Plugin `rentacar-data.ts` re-throws con `cause` chain

**Description:** Reemplazar `try/catch` que tragaba el error por uso del `error` ref de `useAsyncData` (idiomático Nuxt 4). Re-throw siempre — sin rama cliente vestigial — con `Error` envolviendo `cause` para preservar el error original Supabase a través de Vercel Function Logs. `console.error` previo al throw.

**Size:** M
**Dependencies:** none — Step 5 es independiente del refactor de tipos (1–4). Si Step 5 mergea solo, el comportamiento es estrictamente más correcto (silent → loud) y no regresa nada. Secuencial con 4 mantiene una sola rama limpia.
**Files:**
- `packages/logic/plugins/rentacar-data.ts` (MODIFY)
- `packages/logic/plugins/__tests__/rentacar-data.test.ts` (NEW)

**Implementación productiva:**
```ts
import type ReservasApiData from '../src/utils/types/data/ReservasApiData'

export default defineNuxtPlugin(async () => {
  const data = useState<ReservasApiData | null>('rentacar-data', () => null)

  if (data.value) return

  const { data: fetched, error } = await useAsyncData('rentacar-data', () =>
    $fetch<ReservasApiData>('/api/rentacar-data')
  )

  if (error.value) {
    console.error('[rentacar-data] fetch failed:', error.value)
    throw new Error('[rentacar-data] Failed to load reservation data', { cause: error.value })
  }

  if (fetched.value) data.value = fetched.value
})
```

**Tests:**
- `plugins/__tests__/rentacar-data.test.ts`: mockear `useAsyncData` para retornar `{ error: ref(new Error('supabase down')) }` → el plugin lanza `Error` con `.cause` igual al original; `console.error` se llama una vez — **S2.2**.

**Acceptance criteria:**
- [ ] No queda `try/catch` que silencie errores en el plugin.
- [ ] Re-throw incluye `cause: error.value`.
- [ ] `console.error` invocado exactamente una vez antes del throw.
- [ ] S2.2 pasa en Vitest.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm lint` verde.

**Scenarios cubiertos:** S2.2.

---

### Step 6 — E2E: cotización con NULL extras (multimarca)

**Description:** Playwright spec que mockea `/api/rentacar-data` con extras nulls y verifica end-to-end que la UI muestra precios `> 0` para "Conductor adicional" y "Silla bebé" (los defaults `?? 12000` disparan correctamente). Cubre las 3 marcas via `BRAND` env. Único scenario que valida el behavior user-facing.

**Size:** M
**Dependencies:** Step 3 (null propagation), Step 4 (sentinel para evitar throws en setup)
**Files:**
- `e2e/extras-fallback.spec.ts` (NEW)

**Implementación:**

**Fixture inline minimal:** embed dentro del spec (no archivo separado). Solo los campos que el flujo de cotización lee. Patrón: copiar respuesta real de `/api/rentacar-data` en dev (capturar con DevTools network), reducir a 1 categoría + 1 branch (Bogotá) + extras nulls + `vehicleCategories` con la categoría incluida. Fixture queda como constante exportable `EXTRAS_NULL_FIXTURE` arriba del file para re-uso si se agregan más casos.

**Productive change requerida:** `data-testid` en `packages/ui-{brand}/app/components/ReservationResume.vue:97-98` (las 3 marcas). Agregar:
```vue
<div v-if="withExtraDriver" data-testid="extra-driver-line">Conductor: $ {{ currencyExtraDriverPrice }}</div>
<div v-if="withBabySeat" data-testid="baby-seat-line">Silla bebé: $ {{ currencyBabySeatPrice }}</div>
```
Verificado en repo: el renderer es `ReservationResume.vue` (NO `CategoryCard.vue` — éste solo tiene texto descriptivo en líneas 453-460).

**Spec Playwright:**
```ts
// e2e/extras-fallback.spec.ts
import { test, expect } from '@playwright/test'

const EXTRAS_NULL_FIXTURE = {
  categories: [
    {
      id: 'B',
      identification: 'B',
      name: 'Gama B',
      category: 'Económico',
      description: 'Vehículo compacto',
      image: '',
      ad: '',
      models: [],
      month_prices: [],
      total_coverage_unit_charge: 0,
    },
  ],
  branches: [
    { id: 1, code: 'BOG-01', name: 'Bogotá Aeropuerto', city: 'bogota', slug: 'bogota-aeropuerto', schedule: '' },
  ],
  extras: {
    extraDriverDayPrice: null,
    babySeatDayPrice: null,
    washPrice: null,
    washOnsitePrice: null,
    washDeepPrice: null,
    washDeepUpholsteryPrice: null,
  },
  vehicleCategories: {
    B: { grupo: 'Económico', descripcion_corta: '', descripcion_larga: '', tags: [], modelos: [] },
  },
}

test('cotización con NULL extras muestra defaults > 0', async ({ page }) => {
  await page.route('**/api/rentacar-data', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXTRAS_NULL_FIXTURE) })
  )

  await page.goto('/bogota')
  // navegar al flujo de cotización: seleccionar sucursal Bogotá, fechas válidas,
  // agregar "conductor adicional" + "silla bebé", llegar a ReservationResume
  // ... pasos según flujo actual de cotización ...
  await expect(page.getByTestId('extra-driver-line')).toBeVisible()
  await expect(page.getByTestId('extra-driver-line')).not.toContainText('$0')
  await expect(page.getByTestId('extra-driver-line')).toContainText('12.000')
  await expect(page.getByTestId('baby-seat-line')).toContainText('12.000')
})
```

**Tests:**
- `extras-fallback.spec.ts` con `BRAND=alquilatucarro`, `BRAND=alquilame`, `BRAND=alquicarros` — **S4.4 × 3**.

**Acceptance criteria:**
- [ ] `data-testid="extra-driver-line"` y `data-testid="baby-seat-line"` agregados en `ReservationResume.vue:97-98` de las 3 marcas (`alquilatucarro`, `alquilame`, `alquicarros`).
- [ ] `EXTRAS_NULL_FIXTURE` definido en el spec con shape válido para `ReservasApiData`.
- [ ] `pnpm test:e2e` pasa para alquilatucarro.
- [ ] `pnpm test:e2e:alquilame` pasa.
- [ ] `pnpm test:e2e:alquicarros` pasa.

**Scenarios cubiertos:** S4.4.

---

## Testing Strategy

### Unit (Vitest, environment: 'node' en logic)

| Test file | Scenarios | Step |
|---|---|---|
| `transformers.test.ts` | S4.1 | 3 |
| `useCategory.test.ts` | S4.2, S4.3 | 3 |
| `useFetchRentacarData.test.ts` | S3.1, S3.4 | 4 |
| `useStoreAdminData.test.ts` | S3.2 | 4 |
| `useLocalBusiness.test.ts` | S3.3 part 1 | 4 |
| `useCityProductSchema.test.ts` | S3.3 part 2 | 4 |
| `plugins/rentacar-data.test.ts` | S2.2 | 5 |

Comando único: `pnpm --filter @rentacar-main/logic test`. Coverage opcional: `pnpm --filter @rentacar-main/logic test:coverage`.

### E2E (Playwright multimarca)

`extras-fallback.spec.ts` cubre S4.4 × 3 brands. Comando: `pnpm test:e2e[:alquilame|:alquicarros]`.

### Manual (verificación-before-completion)

**S2.1** — build aborta con Supabase down:
```bash
NUXT_SUPABASE_URL=https://invalid.local.test pnpm build:alquilatucarro
# Esperado: exit ≠ 0, stack incluye plugin, no .output/
```

### Browser smoke (`/agent-browser`)

Golden path por marca (per spec §8):
- `GET /` → header carga; selector sucursales muestra opciones.
- `GET /bogota` → city page renderiza; CTA cotiza válido.
- Búsqueda Bogotá + fechas → grid de categorías; precios "Conductor adicional" y "Silla bebé" `> 0`.

Cero console errors, cero failed requests por marca.

---

## Rollout Plan

### Pre-merge (en branch)

1. Steps 1–6 ejecutados; `pnpm typecheck` + `pnpm lint` + `pnpm --filter @rentacar-main/logic test` + `pnpm test:e2e` × 3 marcas, todo verde.
2. Verificación manual de S2.1.
3. `/agent-browser` smoke en las 3 marcas.
4. Commit final con `Closes #2`, `Closes #3`, `Closes #4` referenciados.
5. PR descripción incluye: scenarios cubiertos, comando de S2.1, plan de V6.1 post-deploy.

### Merge

- Squash merge a `main` con commit message conventional: `fix(logic): bundled rentacar-data resilience for #2 #3 #4`.

### Post-merge

1. Issue paralelo en `rentacar-dashboard` creado con la migración SQL del spec §4. Referencia cruzada al PR de este repo.
2. Deploy a preview Vercel.
3. **V6.1 — verificación empírica ISR ante 5xx:**
   - Setear `NUXT_SUPABASE_URL=https://invalid.local.test` en preview environment.
   - Forzar revalidación de `/bogota` (esperar 3600s o trigger manual).
   - Observar:
     - ¿Usuario ve cache previo o `error.vue` 500?
     - ¿Vercel cachea el 500 o mantiene la versión previa?
   - Documentar resultado en el PR description (o issue de seguimiento).
4. Si V6.1 muestra que Vercel cachea 500: abrir issue follow-up para investigar `cache: { swr, staleMaxAge }` directo. **No bloquea merge** — el fix build-time ya impide que un build malo se publique.

### Rollback procedure

- Single-revert PR + redeploy del build anterior. Sin migración SQL aplicada, no hay irreversibilidad.

---

## Risks & Mitigations

| Riesgo | Probabilidad | Mitigación | Step |
|---|---|---|---|
| `data-testid` requeridos para S4.4 no existen | Media | Agregar en Step 6 como sub-task (ajuste mínimo de templates Vue) | 6 |
| `useStoreAdminData` test requiere mock complejo de Pinia + Nuxt useState | Media | Usar `@pinia/testing` con `createTestingPinia`; mockear `useState` global con `vi.stubGlobal` | 4 |
| Tests de plugin requieren mock de `useAsyncData` sin Nuxt runtime completo | Media | `@nuxt/test-utils` ofrece `mockNuxtImport`; alternativa: extraer la lógica del plugin a una función pura testeable | 5 |
| `Object.freeze` no detecta mutaciones en non-strict scope | Muy baja | Documentado en spec §9; tests Vitest corren ESM strict por default | 4 |
| `pnpm typecheck` falla intermedio entre Step 2 y Step 3 | Baja | Análisis pre-implementación: `OldExtrasData` (no-null) ⊆ `NewExtrasData` (con-null). Verificar tras Step 2 antes de avanzar a 3 | 2 |

---

## Complexity & Duration

- **Overall:** M
- **Per step:** S × 2, M × 4 = 6 steps total
- **Estimated duration:** 6–10 horas de trabajo focal (incluye tests + V6.1 manual post-deploy)
- **Risk level:** Low — cambios contenidos en 5 archivos con typecheck-green entre pasos garantizado por orden

---

## Recommended Next Step

Invocar `/scenario-driven-development` con este plan como input. SDD ejecuta los Steps 1–6 secuencialmente, escribiendo el test/scenario antes del código productivo en cada step (Iron Law: no production code without scenario first). Convergencia hacia los 9 scenarios + 1 verificación manual.

Comando esperado:
```
/scenario-driven-development docs/specs/2026-04-29-bundled-rentacar-data-resilience/implementation/plan.md
```
