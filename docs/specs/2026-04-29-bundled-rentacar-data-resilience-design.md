# Bundled fix: rentacar-data resilience (#2 + #3 + #4)

## Motivación

Tres issues abiertos comparten error path en el flujo `plugin rentacar-data → useFetchRentacarData → consumers`. El issue #3 documenta acoplamiento explícito con #2 ("Si se aplica la solución de re-throw en plugin… parte del riesgo se mitiga"). Abordarlos en un solo PR evita iteraciones que se sobre-escriben entre sí.

| Issue | Severidad | Síntoma |
|---|---|---|
| #2 | Critical | `plugins/rentacar-data.ts` traga errores con `console.error`. Si Supabase falla durante `nuxt build`, el HTML 500 se prerendea o se cachea por ISR/Vercel hasta el próximo deploy. |
| #3 | High | `useFetchRentacarData` lanza `throw` síncrono en seis consumers: `useStoreAdminData` (Pinia factory — el caso más severo, porque corrompe el registro de la store), `useCategory.ts:32`, `useLocalBusiness.ts:13`, `useCityProductSchema.ts:67`, `ReservationResume.vue:186`, `CategorySelectionSection.vue:226`. Cada llamada con state null produce error overlay genérico. |
| #4 | High | `Number(null) === 0`, por lo que `extras?.extraDriverDayPrice ?? 12000` nunca dispara. Si una columna de `rental_companies` queda NULL, el usuario es cotizado con $0 sin warning. |

## Decisiones

| Decisión | Resultado | Razón |
|---|---|---|
| Surface de fail-loud | Plugin re-throws siempre (build + SSR + cliente). Cliente no tiene rama soft. | El path de fetch en cliente es vestigial: con SSR habilitado, `useState('rentacar-data')` se hidrata con la payload prerendered y el `if (!data.value)` queda en false. |
| Surface de fail-soft | `useFetchRentacarData()` retorna sentinel vacío congelado cuando state es null. | Es el único punto donde el throw síncrono lastima en práctica (Pinia factory de #3). Los consumers ya manejan listas vacías con `?? []`. |
| Semántica de NULL en `rental_companies` | `NULL` = "dato faltante / usar default del código". `?? 12000` queda como guardrail real durante la transición; permanece como defense-in-depth post-migración. | El default hardcoded sugiere que el código histórico asumía precios siempre presentes. La columna NULL es estado anómalo, no producto sin cargo. Después de aplicar `SET NOT NULL` (§4) la fallback es decorativa pero **se conserva intencionalmente** — protege ante futura corrupción / bug de write-path en `rentacar-dashboard`. |
| Tipo `ExtrasData` duplicado | Consolidar en una sola definición, importada desde `server/utils/transformers.ts` por el cliente. | Hoy existen dos `ExtrasData` (server + cliente) con drift potencial. La fragilidad de tipos es root cause del bug #4. Resolverlo en este PR previene reincidencia. |
| ISR / SWR cache config | Sin cambio — verificar empíricamente comportamiento Vercel ante revalidación 5xx (ver §6). | Nuxt `routeRules.isr` solo acepta `number \| true \| false`. `staleMaxAge` aplica a Nitro `cache` (server-side), no al `isr` shortcut que mapea a Vercel CDN. La sintaxis "ISR + SWR" que parecía obvia no existe en Nuxt 4.1. |
| Migración SQL `rental_companies` | Documentada en este spec; ejecución va a issue separado en `rentacar-dashboard`. | El código de este repo no aplica DDL. Acoplar el merge del PR a una migración cross-repo introduce dependencia coordinada innecesaria. |
| Scope | Solo #2 + #3 + #4. #7 (hardening: timeout, field narrowing, cache invalidation) queda fuera. | #7 es deuda adyacente, no comparte error path. Bundle por root cause compartido, no por proximidad temática. |

## 1. Arquitectura — error boundaries por superficie

```
                           Supabase
                              ▼
          server/api/rentacar-data.get.ts (defineCachedEventHandler)
                              ▼
               throw createError(500) si query falla        ← ya existe
                              ▼
               plugins/rentacar-data.ts
                              ▼
           SIEMPRE: re-throw con cause chain                 ← FAIL LOUD (B / SSR / cliente)
                              ▼
           useState<ReservasApiData | null>('rentacar-data')
                              ▼
               useFetchRentacarData()
                              ▼
        if state null → return EMPTY_SENTINEL congelado     ← único FAIL SOFT
                              ▼
              consumers (?? [], extras?.x ?? default)
```

### Comportamiento por superficie

| Superficie | Resultado del throw | Lo que ve el usuario |
|---|---|---|
| `nuxt build` / prerender (CI) | Build aborta. Vercel no recibe artefacto. | **Nada.** Producción sigue sirviendo build anterior. |
| SSR runtime (ISR revalidation) | Función Vercel logea error con cause chain. Comportamiento de la cache CDN ante 5xx queda como verificación empírica (§6). | Cache previa o `error.vue` según comportamiento Vercel. |
| `useFetchRentacarData()` con state null (anómalo: HMR dev, hidratación corrupta) | Retorna sentinel inmutable. | UI vacía sin error overlay. Warn solo en dev. |

## 2. Cambios file-level

### 2.1 `packages/logic/plugins/rentacar-data.ts`

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

**Cambios:**
- Elimina `try/catch` que silenciaba el error.
- Usa `error` ref de `useAsyncData` (idiomático Nuxt 4) en lugar de `try/catch` ad hoc.
- Re-throw con `cause` chain → Vercel Function Logs preservan el error original Supabase.

### 2.2 `packages/logic/src/composables/useFetchRentacarData.ts`

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

**Cambios:**
- Elimina `throw new Error(...)`.
- Retorna sentinel `Object.freeze`-d para prevenir mutación accidental.
- `extras: undefined` requiere que `ReservasApiData.extras` se relaje a `ExtrasData | undefined` (ver §2.3).

### 2.3 Consolidación de tipo `ExtrasData` + null support

**Problema actual:** `ExtrasData` está duplicado en dos archivos con drift potencial:
- `packages/logic/server/utils/transformers.ts:115-122` (server, lo que produce el transformer)
- `packages/logic/src/utils/types/data/ReservasApiData.ts:5-12` (cliente, lo que consume `useCategory.ts`)

Y `useCategory.ts:32` usa `extras?.…` (optional chaining) contra un campo declarado como **non-optional** en `ReservasApiData.extras`. Latente: TS no fallaba porque `extras?.x` sobre `extras: ExtrasData` (no nullable) es legal pero redundante; con la sentinel `extras: undefined` el cast deja de ser válido.

**Solución:** mover la definición canónica a `src/utils/types/data/ExtrasData.ts` (ubicación natural según convención de tipos del layer); `transformers.ts` la importa desde ahí.

**Dirección decidida (no condicional):** la convención de Nuxt layer es que `src/utils/types/` es la canonical type location consumida vía `@rentacar-main/logic/utils`. Server importa de `src`, no al revés. Esto evita la dependencia inversa (server-as-source-of-truth-for-client-types).

#### 2.3.a Crear archivo de tipo canónico

```ts
// packages/logic/src/utils/types/data/ExtrasData.ts (NUEVO)
export default interface ExtrasData {
  extraDriverDayPrice: number | null
  babySeatDayPrice: number | null
  washPrice: number | null
  washOnsitePrice: number | null
  washDeepPrice: number | null
  washDeepUpholsteryPrice: number | null
}
```

#### 2.3.b Actualizar `ReservasApiData.ts` — eliminar duplicado, relajar `extras`

```ts
// packages/logic/src/utils/types/data/ReservasApiData.ts
import type CategoryData from './CategoryData';
import type BranchData from './BranchData';
import type VehicleCategoryData from './VehicleCategoryData';
import type ExtrasData from './ExtrasData';

export type { ExtrasData };

export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;  // antes: extras: ExtrasData
  vehicleCategories: VehicleCategoryData;
}
```

El re-export mantiene el path `@rentacar-main/logic/utils` intacto para consumers.

#### 2.3.c Actualizar `transformers.ts` — importar tipo, no duplicarlo

```ts
import type ExtrasData from '../../src/utils/types/data/ExtrasData'

export type { ExtrasData };  // re-export para preservar imports existentes

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

**Cambios:**
- `ExtrasData` ya no se define acá; se importa de `src/utils/types/data/ExtrasData.ts`.
- Re-export para que existentes `import { ExtrasData } from '../utils/transformers'` (si los hay) sigan compilando.
- Input type acepta `null`.

**Blast radius del cambio de signature:** `transformExtras` solo es llamado en `packages/logic/server/api/rentacar-data.get.ts:40` (verificado con grep). Cambio contenido: el callsite pasa el resultado directo de `companyResult.data` (Supabase), que ya es `number | null` en el row real — el tipo nuevo refleja la realidad.

### 2.4 `packages/logic/src/composables/useCategory.ts`

Sin cambios funcionales requeridos. `extras?.extraDriverDayPrice ?? 12000` ya hace lo correcto cuando el campo es `null` *o* cuando `extras` mismo es `undefined` (sentinel).

Verificar `pnpm typecheck` con el nuevo tipo `extras: ExtrasData | undefined`. Si TS strict marca el `?.` como necesario (era redundante antes), el código ya lo tiene — sin cambio.

### 2.5 Resumen archivos tocados

| Archivo | Tipo | Issue |
|---|---|---|
| `packages/logic/plugins/rentacar-data.ts` | reescribir try/catch + re-throw con cause | #2 |
| `packages/logic/src/composables/useFetchRentacarData.ts` | sentinel inmutable | #3 |
| `packages/logic/src/utils/types/data/ExtrasData.ts` | **nuevo** — definición canónica del tipo, campos `number \| null` | #3 + #4 |
| `packages/logic/src/utils/types/data/ReservasApiData.ts` | importar `ExtrasData` (sin duplicarlo); relajar `extras` a `ExtrasData \| undefined` | #3 + #4 |
| `packages/logic/server/utils/transformers.ts` | importar tipo de `src/`; signature de `transformExtras` acepta `null` | #4 |

Cinco archivos en `packages/logic` (1 nuevo + 4 modificados). Sin tocar `nuxt.config.ts` de las marcas. Sin tocar consumers UI (los `?.` ya estaban ahí). Único caller de `transformExtras` es `packages/logic/server/api/rentacar-data.get.ts:40` — sin cambios necesarios ahí porque el callsite pasa la row Supabase tal cual.

## 3. Logging contract

| Punto | Log | Nivel | Cuándo |
|---|---|---|---|
| `server/api/rentacar-data.get.ts` | `createError({ statusCode: 500, message })` con detalle de query | error | Existente, sin cambio |
| `plugins/rentacar-data.ts` | `console.error('[rentacar-data] fetch failed:', error.value)` previo al throw | error | Cuando `useAsyncData` retorna error |
| `useFetchRentacarData.ts` | `console.warn('[useFetchRentacarData] state is null; returning empty sentinel.')` | warn dev-only | Solo `import.meta.dev`. Producción silenciosa por diseño. |

`error.cause` chaining preserva el error original Supabase a través de Vercel Function Logs.

**No se agrega infra de alerting nueva.** El repo no tiene Sentry/Datadog. Issue #7 (hardening) puede tomar eso si lo amerita.

## 4. Migración SQL — referencia para `rentacar-dashboard`

**Esta migración no se ejecuta en este PR.** Va como issue separado en `rentacar-dashboard`, referenciado desde el commit message de este repo.

### Orden de operaciones (importante)

1. **Primero:** mergear y deployar el fix de código (este PR). Después de esto el código tolera `NULL` correctamente.
2. **Segundo:** ejecutar pre-flight query.
3. **Tercero:** poblar valores faltantes con los defaults del código.
4. **Cuarto:** aplicar `SET NOT NULL` + `CHECK`.

Aplicar en orden inverso rompe inserts/updates desde admin que hoy son válidos.

### Pre-flight

```sql
SELECT id, code,
       extra_driver_day_price, baby_seat_day_price,
       wash_price, wash_onsite_price,
       wash_deep_price, wash_deep_upholstery_price
FROM rental_companies
WHERE extra_driver_day_price IS NULL
   OR baby_seat_day_price IS NULL
   OR wash_price IS NULL
   OR wash_onsite_price IS NULL
   OR wash_deep_price IS NULL
   OR wash_deep_upholstery_price IS NULL;
```

### Backfill (si pre-flight retorna filas)

Defaults del código actual:

| Columna | Default |
|---|---|
| `extra_driver_day_price` | 12000 |
| `baby_seat_day_price` | 12000 |
| `wash_price` | 20000 |
| `wash_onsite_price` | 30000 |
| `wash_deep_price` | 150000 |
| `wash_deep_upholstery_price` | 225000 |

```sql
UPDATE rental_companies SET
  extra_driver_day_price = COALESCE(extra_driver_day_price, 12000),
  baby_seat_day_price = COALESCE(baby_seat_day_price, 12000),
  wash_price = COALESCE(wash_price, 20000),
  wash_onsite_price = COALESCE(wash_onsite_price, 30000),
  wash_deep_price = COALESCE(wash_deep_price, 150000),
  wash_deep_upholstery_price = COALESCE(wash_deep_upholstery_price, 225000)
WHERE TRUE;
```

### Constraint

```sql
ALTER TABLE rental_companies
  ALTER COLUMN extra_driver_day_price SET NOT NULL,
  ALTER COLUMN baby_seat_day_price SET NOT NULL,
  ALTER COLUMN wash_price SET NOT NULL,
  ALTER COLUMN wash_onsite_price SET NOT NULL,
  ALTER COLUMN wash_deep_price SET NOT NULL,
  ALTER COLUMN wash_deep_upholstery_price SET NOT NULL,
  ADD CONSTRAINT extras_prices_non_negative CHECK (
    extra_driver_day_price >= 0
    AND baby_seat_day_price >= 0
    AND wash_price >= 0
    AND wash_onsite_price >= 0
    AND wash_deep_price >= 0
    AND wash_deep_upholstery_price >= 0
  );
```

## 5. Observable scenarios

Cada uno es Given/When/Then verificable desde fuera del sistema. Estos scenarios viajan como holdout a `/scenario-driven-development`.

### Scope #2 — ISR / build resilience

**S2.1** Build aborta cuando Supabase falla durante prerender.
*Given* `/api/rentacar-data` retorna 500 durante `nuxt build`.
*When* CI ejecuta `pnpm build:alquilatucarro`.
*Then* el proceso sale con status ≠ 0; stderr contiene `[rentacar-data] Failed to load`; no se publica `.output/`.

**S2.2** Plugin re-throws con `cause` chain preservada.
*Given* `/api/rentacar-data` retorna 500.
*When* el plugin ejecuta `useAsyncData`.
*Then* lanza un `Error` cuyo `.cause` es el error original; `console.error` se llama una vez antes del throw.

### Scope #3 — Composable sentinel & Pinia factory

**S3.1** `useFetchRentacarData()` retorna sentinel cuando state es null.
*Given* `useState('rentacar-data')` es `null`.
*When* se invoca `useFetchRentacarData()`.
*Then* retorna `{ categories: [], branches: [], extras: undefined, vehicleCategories: {} }`; no lanza.

**S3.2** `useStoreAdminData` factory no lanza con state vacío.
*Given* `useState('rentacar-data')` es `null`.
*When* un componente invoca `useStoreAdminData()`.
*Then* el store se crea sin throw; `sortedBranches.value` es `[]`; `searchBranchByCode('XYZ')` retorna `undefined`.

**S3.3** Consumers directos (no Pinia-mediated) renderizan con sentinel.
*Given* `useState('rentacar-data')` es `null`.
*When* `ReservationResume.vue:186`, `CategorySelectionSection.vue:226` y `useCityProductSchema.ts:67` consumen `vehicleCategories`/`branches` directamente desde `useFetchRentacarData()`.
*Then* `vehicleCategories` es `{}`, `branches` es `[]`; el render no lanza; `useLocalBusiness('bogota', 'Bogotá')` y `useCityProductSchema()` no lanzan al iterar.

**S3.4** Sentinel es immutable.
*Given* el sentinel retornado por `useFetchRentacarData()`.
*When* un consumer intenta mutar `sentinel.branches.push(x)` en strict mode.
*Then* lanza `TypeError` (verificación de `Object.freeze`).

### Scope #4 — NULL pricing

**S4.1** `transformExtras` propaga `null`.
*Given* row con `extra_driver_day_price: null`.
*When* se invoca `transformExtras(row)`.
*Then* `result.extraDriverDayPrice === null` (no `0`); el tipo de retorno permite `null`.

**S4.2** `useCategory` usa default cuando extras es `null`.
*Given* `extras.extraDriverDayPrice === null`.
*When* `useCategory()` deriva `EXTRA_DRIVER_DAY_PRICE`.
*Then* el valor es `12000`.

**S4.3** `useCategory` usa Supabase value cuando no es `null`.
*Given* `extras.extraDriverDayPrice === 15000`.
*When* `useCategory()` deriva `EXTRA_DRIVER_DAY_PRICE`.
*Then* el valor es `15000` (sin override del fallback).

**S4.4** Cotización user-facing no muestra $0 silencioso.
*Given* Supabase retorna `NULL` para todos los campos de extras.
*When* el usuario abre una cotización con conductor adicional + silla bebé.
*Then* "Conductor adicional" muestra `$12.000 × días` (≠ $0); "Silla bebé" muestra `$12.000 × días` (≠ $0).

## 6. Verificación empírica post-deploy (no automatizada)

**V6.1** Comportamiento Vercel ISR ante revalidación 5xx.

Necesario porque la sintaxis SWR para `routeRules.isr` no existe en Nuxt 4 y la documentación Vercel surveyed no detalla explícitamente qué hace el CDN cuando una función ISR retorna 500.

Procedimiento:
1. Deploy de la rama a un preview Vercel.
2. Setear `NUXT_SUPABASE_URL` a un host inexistente (ej. `https://invalid.local.test`) en el preview environment. Esta env var es la que `server/utils/supabase.ts:13` consume — apuntarla mal hace que `/api/rentacar-data` retorne 500.
3. Forzar revalidación de `/bogota` (esperar `maxAge: 3600` del `defineCachedEventHandler` o invocar `?_revalidate` si existe; alternativamente forzar nuevo deploy).
4. Observar:
   - ¿El usuario que pide después de la revalidación ve el HTML cacheado previo o `error.vue` con statusCode 500?
   - ¿El cache CDN se actualiza con el 500 o se mantiene la versión previa?
5. Documentar resultado en el PR description.

**Outcomes posibles:**

| Resultado observado | Acción |
|---|---|
| Vercel mantiene cache previa, usuario ve HTML válido | OK. El throw + comportamiento default Vercel cubre runtime. Cierra V6.1. |
| Vercel cachea `error.vue` 500 | Abrir issue follow-up: investigar headers Cache-Control manuales o `cache: { swr, staleMaxAge }` directo en lugar de `isr`. No bloquea este PR si #2 build-time fix está aplicado, pero documenta el riesgo. |

## 7. Test layer mapping

| Scenario | Layer | Archivo |
|---|---|---|
| S2.1 | Manual / verification-before-completion | Comando documentado en §8 |
| S2.2 | Vitest unit (logic) | `packages/logic/plugins/__tests__/rentacar-data.test.ts` (mock `useAsyncData`) |
| S3.1, S3.4 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useFetchRentacarData.test.ts` |
| S3.2 | Vitest unit (logic) | `packages/logic/src/stores/__tests__/useStoreAdminData.test.ts` |
| S3.3 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useLocalBusiness.test.ts` (nuevo) + `useCityProductSchema.test.ts` (nuevo) + typecheck de `ReservationResume.vue`/`CategorySelectionSection.vue` |
| S4.1 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` (extender existente) |
| S4.2, S4.3 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useCategory.test.ts` (nuevo) |
| S4.4 | Playwright e2e | `/e2e/extras-fallback.spec.ts`, multimarca via `BRAND` (3× run). **Mecanismo de inyección de NULL**: Playwright `route()` mock sobre `**/api/rentacar-data` — devuelve payload con `extras: { extraDriverDayPrice: null, babySeatDayPrice: null, … }`. No requiere fixture en Supabase test backend. |
| V6.1 | Verificación manual post-deploy | Documentar en PR |

## 8. Satisfaction criteria

El bundled fix se considera completo cuando:

1. ✅ S2.1–S4.4 pasan según mapping (8 unit + 1 e2e + 1 manual).
2. ✅ V6.1 ejecutada y resultado documentado en PR description.
3. ✅ `pnpm typecheck` y `pnpm lint` verdes en los 4 paquetes.
4. ✅ `/agent-browser` smoke en las 3 marcas (alquilatucarro, alquilame, alquicarros): cero console errors, cero failed requests. Golden path explícito:
   - `GET /` → header carga; selector de sucursales muestra opciones; selector de fechas opera.
   - `GET /bogota` → ciudad page renderiza; CTA "Cotiza" lleva a flujo válido.
   - Búsqueda con sucursal Bogotá + fechas válidas → grid de categorías muestra precios `> 0` para "Conductor adicional" y "Silla bebé" (validación visual de S4.4).
5. ✅ Commit referencia los 3 issues con `Closes #2`, `Closes #3`, `Closes #4`.
6. ✅ Issue separado en `rentacar-dashboard` creado con la migración SQL (§4) y referencia cruzada a este PR.
7. ✅ Plan de rollback verificado: revert single PR + redeploy del build anterior. Sin migración SQL aplicada, no hay irreversibilidad.

### Verificación manual de S2.1

```bash
# Apuntar Supabase a un host inalcanzable y correr build
NUXT_SUPABASE_URL=https://invalid.local.test pnpm build:alquilatucarro
# Esperado: exit code ≠ 0, stack trace incluye plugin rentacar-data con cause Supabase, no se genera .output/
```

## 9. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| `EMPTY_SENTINEL` con `extras: undefined` rompe tipo en algún call site no detectado | Baja | TS strict + `pnpm typecheck` en CI. `extras` ya tiene `?` en `useCategory.ts:32`. |
| `Object.freeze` rompe consumers que mutan inadvertidamente | Muy baja | TS marcaría. Pinia composition stores no mutan refs externas. **Nota:** la mutación falla silenciosa en non-strict scope — los tests Vitest corren ESM strict por default así que S3.4 lo detecta; en producción runtime la mutación silenciosa es aceptable porque indica un bug en consumer code, no corrupción de datos. |
| Build empieza a fallar en CI cuando Supabase está down | Baja | Es el comportamiento *correcto*; comunicar en PR description. Si Supabase es flaky se investiga ahí, no se vuelve a tragar el error. |
| Vercel ISR cachea el `error.vue` 500 (no comportamiento default esperado) | Desconocida hasta V6.1 | Verificación empírica obligatoria post-deploy. Issue follow-up si aplica. |
| Migración SQL bloquea por NULLs existentes | Alta si saltan pre-flight | Pre-flight obligatorio en §4. Backfill antes del `SET NOT NULL`. |

## 10. Out of scope

- Issue #5 (tarifas hardcoded vencidas) — sin coupling de error path.
- Issue #6 (cities → Supabase, Phase 4) — migración independiente.
- Issue #7 (timeout, field narrowing, cache invalidation) — hardening adyacente; no comparte error path.
- Issue #8 (stale ref en docs) — doc-only.
- Alerting/Sentry — fuera del repo.
- Cambio de `maxAge` global del `defineCachedEventHandler` en `rentacar-data.get.ts`.
- Modificación de `routeRules.isr` (decisión §0; revisar tras V6.1 si aplica).

---

*Aprobado por el usuario en sesión de brainstorming 2026-04-29 tras decisiones (A)/(A)/(A)/(E)/(G).*
