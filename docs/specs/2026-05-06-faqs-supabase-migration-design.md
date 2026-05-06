# Migrar `faqs.config.ts` a Supabase (Phase 4 — revoca decisión previa)

**Fecha**: 2026-05-06
**Issue**: [#12](https://github.com/amaw-sas/rentacar-web/issues/12)
**Origen del plan mayor**: `docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md` (Phase 4)
**Patrón heredado**: `docs/specs/2026-05-04-cities-supabase-migration-design.md` (PR #19, mergeado 2026-05-05) — Ola 1 del mismo Phase 4
**Status**: Approved

## Motivación

`packages/logic/src/config/faqs.config.ts` (70 líneas, 10 entries) contiene FAQs genéricas de alquiler de carros, idénticas para las 3 marcas. Hoy se exponen vía `useAppConfig().faqs` y se renderizan en `index.vue` (`<UAccordion>` + `useSchemaOrg([{FAQPage}])`).

El spec de migración Phase 4 originalmente listó `faqs.config.ts` entre los configs **a mantener hardcoded**. Esa decisión queda revocada: la directiva del usuario es **evitar islas de información**, y mantener las FAQs en código mientras todo el resto del contenido viajó a Supabase fragmenta el dominio.

**Objetivo del PR**: que las FAQs vivan en Supabase y se sirvan vía el endpoint existente `/api/rentacar-data`. `faqs.config.ts` se borra. `index.vue` × 3 marcas + `useData.ts` consumen via `useData()`.

## Alcance

| En scope | Fuera de scope |
|---|---|
| `packages/logic/src/config/faqs.config.ts` (10 FAQs genéricas) | `packages/logic/src/composables/useCityFAQs.ts` (FAQs por ciudad — Ola 3 separada del Phase 4) |
| Refactor de los 2 sitios que leen `useAppConfig().faqs` (3 `index.vue` + 1 `useData.ts`) | Admin UI en `rentacar-dashboard` (decisión del operador: ediciones manuales por SQL/editor Supabase) |
| Schema + RLS + seed inicial aplicados desde este repo vía Supabase MCP | Refactor del consumer de FAQs en pages distintas a `index.vue` (e.g. `tarifas.vue` define FAQs locales propias) |

## Decisiones acordadas

| Decisión | Resultado | Razón |
|---|---|---|
| Source-of-truth de filas | Este repo aplica `CREATE TABLE` + seed via MCP; sin admin UI; ediciones futuras vía SQL/editor Supabase | Operador confirma que las FAQs son comunes entre las 3 marcas y se modifican raramente. No justifica trabajo coordinado en `rentacar-dashboard`. |
| Brand-scoping | Sin columna `brand` | FAQs idénticas para las 3 marcas hoy (un solo `faqs.config.ts` consumido por los 3 `app.config.ts`). YAGNI — si una marca diverge en el futuro, se añade `brand` cuando ocurra. |
| Schema fields | `id uuid PK`, `label text NOT NULL UNIQUE`, `content text NOT NULL`, `display_order int NOT NULL`, `status text NOT NULL DEFAULT 'active'`, `created_at`, `updated_at` | `status` mirror de `cities`/`locations`/`vehicle_categories` (filtrado por `eq('status', 'active')`). `UNIQUE(label)` habilita idempotencia del backfill (`ON CONFLICT (label) DO NOTHING`). `tags jsonb` y `is_visible boolean` descartados — YAGNI / sustituidos por `status`. |
| Endpoint shape | Extender `/api/rentacar-data` (no endpoint nuevo) | Las FAQs viven en home, página SSR/ISR que ya carga ese payload. Una sola fetch, un solo cache, un solo plugin. Mismo argumento que cities. |
| Client-facing FAQ shape | `{ label: string; content: string }` | Consumers actuales (`<UAccordion :items>` + `useSchemaOrg`) no usan más que esos dos campos. Añadir `id` para keying = YAGNI; UAccordion keya por índice. |
| Consumer routing | `useData()` expone `faqs`; `index.vue` × 3 cambian de `useAppConfig().faqs` a `useData().faqs` | Simétrico con cities (`useData().cities`). El campo `faqs` en `app.config.ts` se borra; mantenerlo apuntando a un import borrado no compila. |
| Outage / degraded state | `EMPTY_SENTINEL` extiende con `faqs: []`; sección renderiza vacía si Supabase outage | Coherencia con cities. Outage es escenario raro. Schema.org `FAQPage` con `mainEntity: []` sigue siendo válido. La sección vacía dura lo que tarde un revalidate exitoso. |
| Apply path del schema | Vía Supabase MCP `apply_migration` desde **este repo** (cambio de convención respecto a cities) | Cities aplicó schema en `rentacar-dashboard` porque ese repo gestiona la admin UI de cities. FAQs **no tendrá admin UI** (operador confirmó: ediciones manuales por SQL/editor Supabase). Mantener coordinación inter-repo para schema sin contraparte de admin añade fricción sin beneficio. Aplicar desde este repo da atomicidad PR + schema + seed. El SQL queda registrado en Supabase (vía MCP) y documentado en `scripts/faqs-README.md`; ningún archivo `.sql` se commitea al repo. |
| Idempotencia del backfill | `ON CONFLICT (label) DO NOTHING` | `UNIQUE(label)` permite re-ejecutar el script sin duplicar. Re-correr es seguro. |

## Arquitectura objetivo

```
Build / ISR regen
  rentacar-data.get.ts (extendido)
    └── 5 queries paralelos a Supabase
        ├── vehicle_categories  (existente)
        ├── locations           (existente)
        ├── rental_companies    (existente)
        ├── cities              (existente)
        └── faqs                (NUEVO — label, content; ORDER BY display_order; WHERE status='active')
    └── transformers
        └── transformFAQs()     (NUEVO — DB shape → app FAQ; Valibot guard, drop malformed rows)
    └── ReservasApiData con field faqs: FAQ[]   (NUEVO)
        ↓
      plugin rentacar-data.ts → useState('rentacar-data')
        ↓
      useFetchRentacarData() → returns ReservasApiData (sentinel { faqs: [] } en outage)
        ↓
      useData() → exposes faqs (refactor: fuente ahora useFetchRentacarData, no useAppConfig)
        ↓
      index.vue × 3 marcas → const { faqs } = useData()
      <UAccordion :items="faqs"> + useSchemaOrg([{FAQPage, mainEntity: faqs.map(...)}])
```

Lo que se borra del flujo:
- `packages/logic/src/config/faqs.config.ts`
- `import { faqsConfig }` y `faqs: faqsConfig` field en los 3 `app.config.ts`
- `export { faqsConfig, type FAQ }` en `packages/logic/src/config/index.ts`
- `useAppConfig().faqs` en `useData.ts:7` y los 3 `index.vue:268`

## Diseño detallado

### 1. Schema en Supabase

**Apply path**: vía Supabase MCP `apply_migration` desde este repo. Diverge de cities (que aplicó en `rentacar-dashboard`) — justificación en la tabla de decisiones. Documentar el SQL en `scripts/faqs-README.md` (paridad estructural con `cities-README.md`, no operativa).

```sql
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  content text NOT NULL,
  display_order integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX faqs_display_order_idx ON faqs (display_order) WHERE status = 'active';

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select_anon" ON faqs
  FOR SELECT TO anon
  USING (status = 'active');
```

**Decisiones del schema**:

- `label` con `UNIQUE` constraint. Habilita `ON CONFLICT (label) DO NOTHING` en el backfill, garantía de idempotencia. Semánticamente: una FAQ por pregunta exacta.
- `display_order integer NOT NULL`. El orden actual del array es semántico (las 10 FAQs siguen un flujo lógico: cómo reservar → métodos de pago → requisitos → uso del vehículo → coberturas). Sin esto se barajan en cada query.
- `status text` en lugar de `is_visible boolean`. Convención del repo (`cities`, `locations`, `vehicle_categories` usan el mismo patrón). Endpoint queda simétrico.
- Sin `tags jsonb`. El issue lo marcó "opcional para categorización futura" — especulación sin consumer hoy. Cuando aparezca el caso, se añade.
- Index parcial sobre `display_order WHERE status = 'active'`. La query siempre filtra por `status='active'` y ordena por `display_order`; el índice cubre exactamente ese plan. Tabla pequeña (10 filas) — el índice es nice-to-have, no crítico.
- Sin policies de `INSERT/UPDATE/DELETE` para `anon`. El backfill usa `service_role` key (bypass RLS); ediciones futuras también.

### 2. Server: endpoint + transformer + tipos

**`packages/logic/server/api/rentacar-data.get.ts`** — agregar el quinto query paralelo:

```ts
const [categoriesResult, locationsResult, companyResult, citiesResult, faqsResult] = await Promise.all([
  // ... 4 existing queries unchanged ...
  supabase
    .from('faqs')
    .select('label, content')
    .eq('status', 'active')
    .order('display_order'),
])

if (faqsResult.error) {
  throw createError({ statusCode: 500, message: `FAQs query failed: ${faqsResult.error.message}` })
}

return {
  categories: transformCategories(categoriesResult.data),
  branches: transformBranches(locationsResult.data),
  extras: transformExtras(companyResult.data),
  vehicleCategories: transformVehicleCategories(categoriesResult.data),
  cities: transformCities(citiesResult.data),
  faqs: transformFAQs(faqsResult.data),     // ← NUEVO
}
```

**`packages/logic/server/utils/transformers.ts`** — nuevo `transformFAQs`:

```ts
interface SupabaseFAQ {
  label: unknown
  content: unknown
}

const faqSchema = v.object({
  label: v.pipe(v.string(), v.minLength(1)),
  content: v.pipe(v.string(), v.minLength(1)),
})

export function transformFAQs(rows: SupabaseFAQ[]): FAQ[] {
  const result: FAQ[] = []
  for (const row of rows) {
    const parsed = v.safeParse(faqSchema, row)
    if (parsed.success) result.push(parsed.output)
  }
  return result
}
```

**Decisiones del transformer**:

- **Validación con Valibot**. Postgres garantiza `NOT NULL` pero no descarta filas con `label=''` o `content=''` si alguien las inserta manualmente. El transformer las filtra silenciosamente — fail-loud (throw) convertiría un dato corrupto en HTML 500 cacheado por ISR. Peor que perder una FAQ.
- **Loop explícito con `parsed.output`** (no `.filter().map()` ni type predicate sobre `unknown`). `v.safeParse(...).output` da el valor validado y narrowed sin casts. Más explícito que el `.filter((r): r is FAQ => ...)` de cities (que usa narrowing por predicate sobre tipo conocido); aquí el input tiene `unknown` fields, así que narrowing-via-output es más seguro estáticamente.
- **Orden preservado por la query**. El SQL ya hace `ORDER BY display_order`; el transformer no reordena. La fila `display_order` no viaja al cliente — es server-only metadata.
- **Cero cambios en consumers**. La shape `{ label, content }` es idéntica a la del `FAQ` que `faqs.config.ts` exporta hoy. `<UAccordion :items>` y `useSchemaOrg` consumen sin edición de templates.

**Tipos**:

```ts
// packages/logic/src/utils/types/type/FAQ.ts (NUEVO archivo)
export default interface FAQ {
  label: string
  content: string
}

// packages/logic/src/utils/types/data/ReservasApiData.ts (extendido)
export default interface ReservasApiData {
  categories: CategoryData[]
  branches: BranchData[]
  extras: ExtrasData
  vehicleCategories: VehicleCategoryData
  cities: City[]
  faqs: FAQ[]                                   // ← NUEVO
}
```

El tipo `FAQ` se relocaliza desde `config/faqs.config.ts` al directorio canónico `utils/types/type/`. Re-export desde `utils/index.ts` para consumo cross-package.

### 3. Composable + sentinel

**`packages/logic/src/composables/useFetchRentacarData.ts`** — extender `EMPTY_SENTINEL`:

```ts
const EMPTY_SENTINEL: ReservasApiData = Object.freeze({
  categories: Object.freeze([]),
  branches: Object.freeze([]),
  extras: undefined,
  vehicleCategories: Object.freeze({}),
  cities: Object.freeze([]),
  faqs: Object.freeze([]),                       // ← NUEVO
}) as unknown as ReservasApiData;
```

**`packages/logic/src/composables/useData.ts`** — sustituir `useAppConfig` por `useFetchRentacarData`:

```ts
import type { City, FAQ } from '@rentacar-main/logic/utils';

export const useData = () => {
    const { cities, faqs } = useFetchRentacarData();    // antes: useAppConfig().faqs

    const getCityById = (id: string): City | undefined => {
        return cities.find((city: City) => city.id === id);
    };

    return { cities, faqs, getCityById }
}
```

### 4. Consumers UI

**`packages/ui-{brand}/app/pages/index.vue`** × 3 — split de `useAppConfig`:

```diff
- const { faqs, franchise } = useAppConfig();
+ const { franchise } = useAppConfig();
+ const { faqs } = useData();
```

`franchise` sigue viviendo en `app.config.ts` (no es parte de esta migración). Solo `faqs` cambia de fuente.

**`packages/ui-{brand}/app/app.config.ts`** × 3 — eliminar import + field + comentario zombie:

```diff
  import {
-   faqsConfig,
    franchiseConfig,
    // ... otros configs no afectados
  } from '@rentacar-main/logic/config';

  export default defineAppConfig({
    franchise: franchiseConfig,
-   // Shared FAQs (generic car rental information)
-   faqs: faqsConfig,
    // ... otros campos no afectados
  });
```

El comentario `// Shared FAQs (generic car rental information)` (línea 155 en cada `app.config.ts`) se borra junto con el field — verificado vía grep en los 3 archivos.

**`packages/logic/src/config/index.ts`** — eliminar el re-export:

```diff
- export { faqsConfig, type FAQ } from './faqs.config';
```

**Verificado vía `git grep`**: cero consumers externos importan `type FAQ` del barrel de configs. Único match en el repo es esta misma línea de re-export, que se borra. El símbolo `FAQ` se relocaliza al directorio canónico de tipos (`utils/types/type/FAQ.ts`) y se re-exporta desde `utils/index.ts`. Los consumers que el día de mañana necesiten el tipo lo importan vía `@rentacar-main/logic/utils`.

**`packages/logic/src/config/faqs.config.ts`** — borrar archivo entero.

### 5. Backfill toolkit

Toolkit one-shot en `scripts/`, prefijo `faqs-` (paridad con `cities-`):

| Archivo | Rol |
|---|---|
| `scripts/faqs-snapshot.ts` | Lee `packages/logic/src/config/faqs.config.ts` → escribe `scripts/faqs-data.json` con `[{label, content, display_order}]`. Step 1 del plan. Deja de compilar tras Step 8 (delete del config) — diseño one-shot. |
| `scripts/faqs-data.json` | Snapshot — 10 entries con `label`, `content`, `display_order` (índice del array). Sobrevive al delete. Commiteado al repo. |
| `scripts/faqs-backfill.ts` | Lee `faqs-data.json` y aplica INSERTs a `faqs` en Supabase con `service_role` key. `--dry-run` flag imprime los INSERTs sin tocar DB. `ON CONFLICT (label) DO NOTHING` para idempotencia. |
| `scripts/faqs-README.md` | Documenta el SQL del schema + uso del toolkit. |

**Comportamiento del backfill**:

- **Tabla vacía (primer run)**: inserta las 10 filas.
- **Re-ejecución**: `ON CONFLICT (label) DO NOTHING` — cero duplicados, cero error.
- **Edición manual posterior** (operador edita `content` de una FAQ vía editor Supabase, luego alguien re-ejecuta el backfill por error): la edición manual se preserva — `ON CONFLICT DO NOTHING` no sobreescribe. Diferencia importante con cities (que usaba UPDATE forzado).

**Service role key**:

```bash
# .env.local en raíz del repo
NUXT_SUPABASE_URL=https://<project-ref>.supabase.co
NUXT_SUPABASE_SERVICE_ROLE_KEY=<service_role — NO commitear>
```

### 6. Migration spec update

`docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md`:

- **Línea 66** ("Fase 4: Dinamizar datos de configuración"): remover `faqs.config.ts` de la lista "Mantener hardcodeados". Anotar el cambio de criterio referenciando #12 y este spec.
- **Línea 94** ("Lo que NO cambia"): remover `faqs.config.ts` de la lista.
- **Línea 99** ("Mejoras futuras"): remover bullet "Dinamización de FAQs si directiva lo aprueba" (ahora aprobado y ejecutado).

## Verificación

1. `pnpm build` exitoso para las 3 marcas con Supabase OK.
2. `pnpm dev` carga `/` y la sección `#faqs` renderiza ≥1 `<UAccordionItem>` con label no vacío.
3. `pnpm typecheck` pasa.
4. `pnpm --filter @rentacar-main/logic test` — `transformFAQs` cubierto (happy path, malformed row dropped, empty input). `useData.test.ts` actualizado (mock de `useFetchRentacarData` ahora retorna `faqs`).
5. `pnpm test:e2e` — un smoke por marca: `/`, sección `#faqs`, ≥1 item visible.
6. **Outage build verification**: re-ejecutar `pnpm build` con `NUXT_SUPABASE_URL` apuntando a host inválido (e.g. `https://invalid.supabase.co`). El build no debe fallar; el HTML resultante debe contener `<section id="faqs">` con `<UAccordion :items="[]">` y schema.org `FAQPage` con `mainEntity: []`, sin error en `useSchemaOrg`. Verificación manual one-shot pre-merge — no se commitea script automatizado en este PR. (Nota: `scripts/cities-html-diff.sh` cubre regresión estructural HTML de cities, no outage; los dos chequeos están separados por convención.)
7. **HTML structural regression** (opcional): `scripts/faqs-html-diff.sh` mirror del cities equivalent — diff de bytes normalizados de `/` baseline (pre-migración) vs post-migración para las 3 marcas. Diff vacío esperado dado que la shape `{ label, content }` viaja idéntica al `<UAccordion>` y `useSchemaOrg`. Si decidimos saltarlo, riesgo residual = pequeño (mismo output esperado, validable visualmente en preview Vercel).
8. **Smoke manual post-backfill**: abrir `dashboard.supabase.com → faqs`, verificar 10 filas con `status='active'`, todas con `display_order` único en `[0, 9]`.

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **R1 — Supabase outage durante build congela HTML 500 en ISR** | Alta | `EMPTY_SENTINEL` con `faqs: []` + endpoint `throw` se captura en plugin sin abortar el build (mismo patrón validado en cities). HTML resultante tiene sección vacía pero válida. |
| **R2 — UAccordion con `:items=[]` rompe runtime o emite warning ruidoso** | Media | Verificable en dev: setear `faqs.config.ts` a `[]` antes de la migración y abrir `/`. Si UAccordion rompe, wrap en `v-if="faqs.length"`. Si solo emite warning, aceptable. Tarea de verificación pre-merge. |
| **R3 — Edición manual en editor Supabase desincroniza con `faqs-data.json`** | Baja | Toolkit one-shot por diseño (`faqs-snapshot.ts` deja de compilar tras Step 8). El JSON queda como snapshot histórico, no como source-of-truth. Documentado en `faqs-README.md`. |
| **R4 — Schema migration aplicado fuera de orden con el merge del PR** | Media | Aplicar `CREATE TABLE` + RLS + seed antes de mergear el PR. Preview deploy en Vercel valida end-to-end con la tabla ya poblada. Sin schema, el endpoint extendido falla con error de tabla inexistente. |
| **R5 — `index.vue` × 3 contiene `useSchemaOrg` que asume `faqs.length > 0`** | Baja | Verificado en spec: `useSchemaOrg([{FAQPage, mainEntity: faqs.map(...)}])`. `[].map()` retorna `[]`. Schema.org `FAQPage` con `mainEntity: []` es JSON válido (Google ignora el rich result, no rompe). |

## Out of scope

Explícitamente fuera de este PR:

- **`packages/logic/src/composables/useCityFAQs.ts`** (579 líneas, FAQs específicas por ciudad keyed por slug). Es la Ola 3 del Phase 4, plan B documentado en el spec de cities.
- **Admin UI en `rentacar-dashboard`** para editar FAQs. Decisión del operador: ediciones manuales por SQL o editor Supabase son suficientes dado el ritmo de cambio.
- **`packages/ui-alquilatucarro/app/pages/tarifas.vue`** define `faqs` locales propias (línea 157). No están en `faqs.config.ts`. Out of scope.
- **Refactor de `useSchemaOrg` para emitir `<noscript>` fallback de las FAQs**. Si en el futuro Google penaliza el rich result vacío en outage, se evalúa.

## Observable scenarios bridge

Las decisiones del diseño se traducen a scenarios observables (Given/When/Then) que viajan al holdout de `/scenario-driven-development`. Bosquejo inicial — el SDD los formalizará al entrar:

- **SCEN-001**: Given Supabase OK con 10 FAQs activas, when usuario carga `/` en cualquier marca, then la sección `#faqs` renderiza 10 `<UAccordionItem>` en el orden de `display_order`.
- **SCEN-002**: Given una FAQ con `status='inactive'` en Supabase, when usuario carga `/`, then esa FAQ no aparece en el accordion (filtrada por la query `.eq('status', 'active')`).
- **SCEN-003**: Given Supabase outage durante `pnpm build`, when build completa, then HTML resultante contiene `<section id="faqs">` con accordion vacío y schema.org `FAQPage` con `mainEntity: []`, sin error en build.
- **SCEN-004**: Given una fila en `faqs` con `label=''` o `content=''`, when endpoint responde, then `transformFAQs` filtra esa fila y el cliente nunca la ve.
- **SCEN-005**: Given backfill ejecutado dos veces consecutivas con la misma `faqs-data.json`, when query a Supabase, then siguen existiendo exactamente 10 filas (no duplicados — `ON CONFLICT (label) DO NOTHING`).
- **SCEN-006**: Given operador edita `content` de una FAQ via editor Supabase, when backfill se re-ejecuta, then la edición manual se preserva (no se sobreescribe).
- **SCEN-007**: Given el PR mergeado y `faqs.config.ts` borrado, when `pnpm typecheck` corre, then sin errores — todos los consumers leen `useData().faqs`.
- **SCEN-008**: Given el PR mergeado, when `git grep "useAppConfig().*faqs"` corre, then cero matches en `packages/`.
- **SCEN-009**: Given `useFetchRentacarData()` retorna el sentinel (estado inicial pre-fetch o outage), when un componente lee `useData().faqs`, then obtiene `[]` sin TypeError.
- **SCEN-010**: Given las 3 marcas comparten el endpoint, when cada marca carga `/`, then las 10 FAQs son idénticas (sin filtro por brand — confirma decisión de no añadir columna `brand`).

Estos scenarios se mueven a `docs/specs/2026-05-06-faqs-supabase-migration/scenarios/faqs-supabase-migration.scenarios.md` al entrar a SDD, donde se les añade satisfaction criteria y mapa a tests.

## Handoff a `sop-planning`

Insumos para el plan de implementación:

- **Spec aprobado**: este documento.
- **Patrón de referencia**: el plan de cities (PR #19) — orden de steps, granularidad de commits, roles de cada commit (snapshot → schema → endpoint → transformer → consumer refactor → cleanup → tests → outage validation).
- **Scenarios**: 10 scenarios bosquejados arriba; SDD los formaliza al entrar.
- **Dependencias**: ninguna externa. #6 (cities) ya mergeada. Schema lo aplica este PR vía MCP.

---
