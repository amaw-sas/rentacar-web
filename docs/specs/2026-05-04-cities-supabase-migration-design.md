# Migrar `cities.config.ts` a Supabase (Phase 4 — Ola 1)

**Fecha**: 2026-05-04
**Issue**: [#6](https://github.com/amaw-sas/rentacar-web/issues/6)
**Origen del plan mayor**: `docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md` (Phase 4)
**Issues derivados durante el diseño**: [#11](https://github.com/amaw-sas/rentacar-web/issues/11) (franchise.testimonials), [#12](https://github.com/amaw-sas/rentacar-web/issues/12) (faqs.config.ts)
**Dependencias resueltas**: [#2](https://github.com/amaw-sas/rentacar-web/issues/2), [#3](https://github.com/amaw-sas/rentacar-web/issues/3), [#4](https://github.com/amaw-sas/rentacar-web/issues/4), [#10](https://github.com/amaw-sas/rentacar-web/issues/10) — todas CLOSED y mergeadas en main vía PR #13 (2026-05-04)

## Motivación

`packages/logic/src/config/cities.config.ts` (1452 líneas) es contenido (name, description SEO, testimonios) incrustado en código. La directiva del usuario es **evitar islas de información**: cada vez que el equipo de marketing quiere ajustar copy de una ciudad o agregar un testimonio nuevo, hoy implica un PR + redeploy.

Y la fuente de verdad ya está partida: la tabla `cities` vive en Supabase con `name`, `slug` + columnas internas, y se consume vía `locations.cities(slug)` join en `/api/rentacar-data`. Tener parte del contenido en DB y parte en TS es la peor combinación: admin ambiguo, duplicación implícita del concepto "ciudad".

**Objetivo del PR**: que `description` y `testimonials` por ciudad vivan en Supabase y se sirvan vía el endpoint existente. `cities.config.ts` se borra.

## Alcance: Ola 1 de 5

`cities.config.ts` no es la única isla de city-content. El issue #6 originalmente la describía como "1452 líneas + testimonios", pero la auditoría descubrió 5 Records hardcoded keyed por ciudad (~3000 líneas totales):

| Archivo | Contenido | Ola |
|---|---|---|
| `config/cities.config.ts` | name/description/testimonials | **Ola 1 (este PR)** |
| `composables/useCityContent.ts` | intro/destinations/drivingTips/bestSeason | Ola 2 (futuro PR) |
| `composables/useCityFAQs.ts` | 6 FAQs específicas por ciudad | Ola 3 (futuro PR) |
| `composables/useCityRelations.ts` | ciudades cercanas para internal-linking | Ola 4 (futuro PR) |
| `composables/useCityProductSchema.ts` | precios base para schema.org Product | Ola 5 (futuro PR; probablemente derivable de `vehicle_categories`/`category_pricing`) |

**Decisión**: Plan B (un PR por ola) en lugar de Big Bang. Cada ola usa el patrón establecido por la Ola 1, permite review chico, rollback granular, y minimiza conflicto con ramas paralelas activas (#2/#3/#4 y #10).

## Decisiones acordadas

| Decisión | Resultado | Razón |
|---|---|---|
| Destino del contenido | Supabase (no nuxt-content híbrido) | Directiva del usuario: "evitar islas de información". Costo SEO = cero porque SSR+ISR+prerender ya populan HTML server-side. |
| Tamaño de ola | Ola 1 = solo `cities.config.ts`; olas 2-5 separadas | Reviews chicos, schema iterativo, menos conflicto con ramas paralelas. |
| Shape de testimonios | `cities.testimonials jsonb` (no tabla satélite) | "Rara vez se modifican". Simplicidad de schema gana sobre normalización. |
| Endpoint | Extender `/api/rentacar-data` (no endpoint nuevo) | Cities ya viajan al mismo HTML que las queries de reservas. Una sola fuente, un solo cache. |
| Coordinación con #2/#3/#4 | ~~Rebase obligatorio antes de merge~~ → **Ya mergeado** (PR #13, 2026-05-04). Mi worktree rebaseada limpia sobre origin/main. Bloqueo eliminado. | Evita ventana donde una outage de Supabase produce HTML 500 cacheado por ISR (issue #2 mismo). |

## Arquitectura objetivo

```
Build / ISR regen
  rentacar-data.get.ts (extendido)
    └── 4 queries paralelos a Supabase
        ├── vehicle_categories  (existente)
        ├── locations           (existente)
        ├── rental_companies    (existente)
        └── cities              (NUEVO — slug, name, description, testimonials)
    └── transformers
        └── transformCities()   (NUEVO — DB shape → app City)
    └── ReservasApiData con field cities: City[]   (NUEVO)
        ↓
      plugin rentacar-data.ts → useState('rentacar-data')
        ↓
      useFetchRentacarData() → returns ReservasApiData
        ↓
      useData() (refactor: cities ahora viene de aquí, no de useAppConfig)
        ↓
      useCityPageSEO() → getCityById(slug)
        ↓
      CityPage.vue → city.name / city.description / city.testimonials
```

Lo que se borra del flujo:
- `packages/logic/src/config/cities.config.ts`
- `cities: citiesConfig` field en los 3 `app.config.ts`
- import de `citiesConfig` y re-export en `config/index.ts`

## Diseño detallado

### 1. Schema en Supabase

Aplicar en `rentacar-dashboard` (NO en este repo, coordinación inter-repo):

```sql
ALTER TABLE cities
  ADD COLUMN description text NULL,
  ADD COLUMN testimonials jsonb NOT NULL DEFAULT '[]'::jsonb;

-- RLS: verificar que existe SELECT policy para anon. Si no:
CREATE POLICY "cities_select_anon" ON cities FOR SELECT TO anon USING (true);
```

**Decisiones del schema**:

- `description` nullable, sin DEFAULT. El consumer (`useCityPageSEO.ts:19-22`) ya hace fallback a `franchise.description` cuando `city?.description` es falsy. NULL = "ciudad creada en admin sin SEO copy" = comportamiento sano. Forzar `NOT NULL DEFAULT ''` confunde "vacío explícito" con "no editado".
- `testimonials NOT NULL DEFAULT '[]'`. Simplifica consumer: siempre array iterable, sin null-checks.
- Sin CHECK constraint de shape para JSONB. La validación vive en el transformer del endpoint, en el boundary de aplicación; más fácil de evolucionar cuando cambie la shape.
- Sin nuevos índices. `slug` ya es unique. 19 filas no requieren más.

### 2. Server: endpoint + transformer + tipos

**`packages/logic/server/api/rentacar-data.get.ts`** — agregar el cuarto query paralelo:

```ts
const [categoriesResult, locationsResult, companyResult, citiesResult] = await Promise.all([
  // ... 3 existing queries unchanged ...
  supabase
    .from('cities')
    .select('slug, name, description, testimonials')
    .order('name'),
])

if (citiesResult.error) {
  throw createError({ statusCode: 500, message: `Cities query failed: ${citiesResult.error.message}` })
}

return {
  categories: transformCategories(categoriesResult.data),
  branches: transformBranches(locationsResult.data),
  extras: transformExtras(companyResult.data),
  vehicleCategories: transformVehicleCategories(categoriesResult.data),
  cities: transformCities(citiesResult.data),    // ← NUEVO
}
```

**`packages/logic/server/utils/transformers.ts`** — nuevo `transformCities`:

```ts
interface SupabaseCity {
  slug: string
  name: string
  description: string | null
  testimonials: unknown
}

export function transformCities(rows: SupabaseCity[]): City[] {
  return rows.map((row) => ({
    id: row.slug,                                  // app id == DB slug
    name: row.name,
    description: row.description ?? '',
    testimonials: parseTestimonials(row.testimonials),
  }))
}

function parseTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is Testimonial => v.safeParse(testimonialSchema, t).success)
}

// Valibot schema (Valibot ya es dep del proyecto, ver stack.md)
const testimonialSchema = v.object({
  user: v.object({
    name: v.string(),
    description: v.string(),
    avatar: v.object({ src: v.string(), alt: v.string() }),
  }),
  quote: v.string(),
})
```

**Decisiones del transformer**:

- **`id ← slug`**. El código actual usa `city.id = 'armenia'` que coincide con `slug = 'armenia'`. El renombre vive en el transformer para mantener la API del consumer estable. Cero cambios en composables/components.
- **`link` field eliminado del tipo `City`**. Verificado con grep: ningún consumer lee `city.link`. Los matches en `layouts/default.vue` son `footerLink.link` de `franchise.footerLinks`, otro tipo. Dead code — se borra del type y del transformer en lugar de calcularse computed.
- **Validación con Valibot**. Postgres valida JSON pero no shape. Testimonios mal-formados se filtran silenciosamente del array; el resto se renderiza. Fail-loud (throw) convertiría un dato corrupto en HTML 500 cacheado por ISR. Peor que perder un testimonio.

**Tipos**:

```ts
// packages/logic/src/utils/types/data/ReservasApiData.ts
export default interface ReservasApiData {
  categories: CategoryData[]
  branches: BranchData[]
  extras: ExtrasData
  vehicleCategories: VehicleCategoryData
  cities: City[]                                   // ← NUEVO
}

// packages/logic/src/utils/types/type/Testimonial.ts (NUEVO archivo)
export default interface Testimonial {
  user: {
    name: string
    description: string
    avatar: { src: string; alt: string }
  }
  quote: string
}

// packages/logic/src/utils/types/type/City.ts (existente, ajustar)
import type Testimonial from './Testimonial'    // ← antes venía de '../../../config'

export default interface City {
  id: string                  // = DB slug
  name: string
  description: string         // '' si DB es null
  testimonials: Testimonial[]
  // link: string  ← REMOVIDO: dead code, ningún consumer lo leía
}
```

### 3. Consumer refactor + cleanup

**`packages/logic/src/composables/useData.ts`** — cambiar fuente:

```ts
import type { City } from '@rentacar-main/logic/utils';

export const useData = () => {
    const { cities } = useFetchRentacarData();   // ← antes: useAppConfig().cities
    const { faqs } = useAppConfig();             // faqs sigue hardcoded (ola 1 no toca #12)
    const getCityById = (id: string): City | undefined =>
        cities.find((city) => city.id === id);   // ← `==` arreglado a `===`
    return { cities, faqs, getCityById };
};
```

**Comportamiento bajo outage de Supabase** (heredado del sentinel pattern de #2/#3/#4):

- **Build prerender + Supabase down** → `useFetchRentacarData` re-throws → build falla. **No se publican `/armenia` con HTML vacío.** Fail-loud en build antes que silent corruption en producción.
- **Runtime ISR regen + Supabase down** → re-throw → no se cachea 500 → CDN sigue sirviendo HTML cacheado anterior.
- **CSR client-side** → sentinel devuelve `cities: []` → `getCityById('armenia')` returns undefined → `/[city]/index.vue` throw 404. Tolerable: solo afecta navegación cliente bajo outage tras hidratación con sentinel, y se recupera solo en el siguiente regen.

**Cleanup en cada `packages/ui-{brand}/app/app.config.ts`** (3 marcas, cambio idéntico):

```ts
// Quitar de imports:
//   citiesConfig
// Quitar del defineAppConfig:
//   cities: citiesConfig,
```

`franchise.testimonials` (testimonios de homepage por marca) **se mantiene**. Son distintos de los de ciudad; su migración es issue #11.

**Archivos a borrar**:
- `packages/logic/src/config/cities.config.ts`
- Re-export de cities en `packages/logic/src/config/index.ts`

### 4. Backfill: snapshot JSON + script idempotente

**Problema a evitar**: si el script lee directamente de `cities.config.ts`, después de borrar ese archivo (paso 5 del PR) el script ya no compila. Queda como artefacto roto en git history.

**Solución**: snapshot one-time del data a `scripts/cities-content/data.json`, el script lee de ahí. Después de la ejecución exitosa, ambos archivos se archivan o quedan como referencia histórica funcional.

```
scripts/cities-content/
├── data.json              # snapshot una sola vez de citiesConfig — sobrevive al delete
├── backfill.ts            # lee data.json, hace UPDATE a Supabase
└── README.md              # cómo correr, dry-run, verificación post-run
```

```ts
// scripts/cities-content/backfill.ts (esqueleto)
import data from './data.json' with { type: 'json' }
import { useSupabaseAdminClient } from '../../packages/logic/server/utils/supabase'

interface CitySnapshot { id: string; description: string; testimonials: unknown[] }

async function main() {
  const supabase = useSupabaseAdminClient()
  const dryRun = process.argv.includes('--dry-run')

  for (const city of data as CitySnapshot[]) {
    if (dryRun) {
      console.log(`UPDATE cities SET description=$1, testimonials=$2 WHERE slug='${city.id}';`)
      continue
    }
    const { error } = await supabase
      .from('cities')
      .update({ description: city.description, testimonials: city.testimonials })
      .eq('slug', city.id)
    if (error) throw new Error(`Failed for ${city.id}: ${error.message}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
```

**Cómo se genera `data.json`** (paso 0 del PR, antes de cualquier borrado):

```bash
# Genera el JSON desde cities.config.ts mientras todavía existe
pnpm tsx scripts/cities-content/snapshot.ts > scripts/cities-content/data.json
git add scripts/cities-content/data.json && git commit -m "chore(cities): snapshot data.json for one-time backfill"
```

**Decisiones**:
- `UPDATE` (no `UPSERT`) — la tabla cities ya tiene 19 filas. Si el script no encuentra una fila para un slug del config, debe fallar duro (mismatch entre rentacar-web y admin).
- Idempotente — correr 2 veces no duplica.
- Dry-run obligatorio antes de ejecución contra prod.
- Vive en repo, queda en git history. Sobrevive al borrado de `cities.config.ts` porque su único input es `data.json`.
- One-time use: post-backfill exitoso, el directorio puede borrarse en un PR posterior. Mientras tanto, sirve de referencia y permite re-ejecutar contra staging si hace falta.

### 5. Coordinación y orden de ejecución

**Estado de las ramas paralelas (actualizado 2026-05-04)**:

Issues #2, #3, #4, #10 — todas **CLOSED** y mergeadas en `main` (PR #13, commit `e358ce1`). Mi worktree rebaseada limpia sobre `origin/main`; los 3 commits doc-only sobreviven el rebase sin conflicto.

Verificado contra el código post-rebase:

- `useFetchRentacarData.ts` ahora exporta `EMPTY_SENTINEL = Object.freeze({ categories: [], branches: [], extras: undefined, vehicleCategories: {} })` y devuelve eso cuando el state es null. **Mi PR debe agregar `cities: Object.freeze([])` al sentinel** para mantener la garantía de array iterable post-#3.
- `rentacar-data.get.ts` mantiene 3 queries paralelas con `throw createError({...})` por error. Mi adición de cities sigue ese mismo patrón.
- `useStoreSearchData.ts` y `CityPage.vue` ya tienen las fixes de #10 mergeadas; mi PR no las toca.

**Matriz de archivos a tocar en este PR** (ya sin overlap con paralelas):

| Archivo | Cambio |
|---|---|
| `packages/logic/server/api/rentacar-data.get.ts` | agregar query cities + propagación al payload |
| `packages/logic/server/utils/transformers.ts` | agregar `transformCities` + `SupabaseCity` interface |
| `packages/logic/composables/useFetchRentacarData.ts` | extender `EMPTY_SENTINEL` con `cities: Object.freeze([])` |
| `packages/logic/src/utils/types/data/ReservasApiData.ts` | agregar field `cities: City[]` |
| `packages/logic/src/utils/types/type/City.ts` | quitar `link` field, ajustar import de `Testimonial` |
| `packages/logic/src/utils/types/type/Testimonial.ts` | crear (extraer de `cities.config.ts`) |
| `packages/logic/src/composables/useData.ts` | cambiar source a `useFetchRentacarData` |
| `packages/logic/src/index.ts` | actualizar re-exports |
| `packages/logic/src/config/index.ts` | quitar re-export de cities |
| `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/app.config.ts` | quitar import + field cities |
| `packages/logic/src/config/cities.config.ts` | **borrar** (último step) |
| `scripts/cities-content/data.json` | crear (snapshot pre-borrado) |
| `scripts/cities-content/backfill.ts` | crear |
| `scripts/cities-content/snapshot.ts` | crear |
| `packages/logic/server/utils/__tests__/transformers.test.ts` | extender con SCEN-005..008 |
| `packages/logic/src/composables/__tests__/useData.test.ts` | crear con SCEN-009..010 |
| `e2e/cities-content.spec.ts` | crear con SCEN-001/002 |

**Secuencia pre-merge** (simplificada — el rebase ya está hecho):

1. Generar `scripts/cities-content/data.json` desde `cities.config.ts` (con archivo aún presente). Commit aparte.
2. Implementar transformer + tipos + extensión de endpoint + sentinel update + tests unitarios. Commit.
3. Implementar refactor de `useData` + cleanup de los 3 `app.config.ts`. Commit.
4. Borrar `cities.config.ts` y re-export. `pnpm typecheck` debe pasar (SCEN-004).
5. Aplicar schema en rentacar-dashboard (`ALTER TABLE cities ...`).
6. Correr backfill (dry-run primero, luego real).
7. Verificar query directa: `SELECT slug, length(description), jsonb_array_length(testimonials) FROM cities` → 19 filas con datos.
8. Verificar HTML diff bytewise en preview deploy vs main pre-migración (SCEN-011).
9. Abrir PR y mergear.

**Sin bloqueos externos**: no hay parallel work pendiente que requiera espera. Implementation puede arrancar inmediatamente.

### 6. Tests y verificación

**Capas**:

| Capa | Archivo | Verifica |
|---|---|---|
| Unit (Vitest, node) | `packages/logic/server/utils/__tests__/transformers.test.ts` (extender) | `transformCities` mapea shape correctamente |
| Unit (Vitest, node) | `packages/logic/src/composables/__tests__/useData.test.ts` (nuevo) | `useData` usa nuevo source, `getCityById` resuelve |
| Integración endpoint | `packages/logic/server/api/__tests__/rentacar-data.test.ts` | endpoint devuelve key `cities` con shape correcto |
| E2E (Playwright) | `e2e/cities-content.spec.ts` (nuevo, smoke 1 marca) | `/armenia` renderiza description + ≥1 testimonio |

**Casos críticos a cubrir** (serán scenarios observables del próximo step SDD):

- Transformer happy path / null description / testimonios malformados / testimonios no-array.
- `getCityById` resuelve match exacto, devuelve undefined ante mismatch.
- `GET /armenia` HTML 200 con description en server-rendered HTML (no en bundle JS).
- `GET /no-existe` HTML 404.

**HTML diff anti-regresión** (verificación pre-merge no automatizada):

```bash
# Antes (main): curl https://alquilatucarro-pre.vercel.app/armenia > before.html
# Después (preview): curl https://preview-deploy.vercel.app/armenia > after.html
diff <(prettier --parser html before.html) <(prettier --parser html after.html)
# Esperar diff vacío o solo cambios cosméticos. Cualquier cambio de copy/estructura bloquea merge.
```

Repetir para `/bogota` y `/cali` (las ciudades con más tráfico orgánico).

**Lo que NO se testea en este PR**:
- Behavior bajo outage de Supabase — cubierto por #2/#3/#4.
- Performance de la query — 19 filas trivial.
- Admin editando contenido — out-of-scope (rentacar-dashboard).

### 7. Riesgos y open questions

**Riesgos**:

| Riesgo | Mitigación |
|---|---|
| Schema en rentacar-dashboard no aplicado antes del merge | Pre-merge checklist lo bloquea. Responsabilidad humana, no automatizable. |
| RLS no permite SELECT anon en cities | Verificación manual con `curl supabase-url/rest/v1/cities?select=slug --header "apikey: ANON_KEY"` antes del backfill. |
| Backfill con typos / slugs mal mapeados | Dry-run obligatorio + diff visual de `/armenia` post-deploy vs baseline. |
| ISR cache sirve HTML viejo post-deploy | Aceptable durante 1h. Purge manual en Vercel si urge. |
| `cities` table tiene columnas internas que rompen query | Query es explícita: `slug, name, description, testimonials`. Postgres ignora otras. Sin riesgo. |
| Admin edita description con HTML/markdown | `v-text` (escape automático). Sin XSS, sin breakage. |
| Consumer huérfano post-borrado de `cities.config.ts` | `pnpm typecheck` falla en build. Imposible mergear roto. |

**Open questions a resolver durante implementación**:

- ¿Existe RLS policy `SELECT anon` en `cities`? Verificación antes del backfill (curl directo con anon key).
- ¿Las 3 marcas siguen requiriendo el mismo contenido por ciudad? Asunción: sí (verificado en `app.config.ts`). Si en el futuro divergen, requiere tabla `cities × brand` (issue separado).

**Resueltas durante el spec review**:

- `City.link` — grep no encontró consumers. Se elimina del tipo en lugar de mantenerse computed.
- Validación de testimonios — se usa Valibot (ya es dep del proyecto, evita decisión en implementation).

**Orden de rollback (importante)**:

Si todo sale mal post-merge: **revertir código antes que schema**. Si revertís el schema primero, el código en producción tira 500 hasta que el revert del código se propague.

## Fuera de alcance

- Migración de `useCityContent` (ola 2), `useCityFAQs` (ola 3), `useCityRelations` (ola 4), `useCityProductSchema` (ola 5).
- Migración de `franchise.testimonials` (issue #11).
- Migración de `faqs.config.ts` (issue #12 — revoca decisión Phase 4 de mantener hardcoded).
- Admin UI para editar `description`/`testimonials` — vive en rentacar-dashboard.
- Internacionalización del contenido (i18n).
- Versioning / drafts / preview de contenido.

## Criterios de aceptación

Este PR está completo cuando:

1. Snapshot `scripts/cities-content/data.json` generado y commiteado antes de cualquier delete.
2. Schema aplicado en Supabase (`description text`, `testimonials jsonb` en tabla `cities`).
3. Backfill ejecutado: 19 filas con `description` y `testimonials` populadas.
4. `/api/rentacar-data` devuelve key `cities: City[]` con 19 items.
5. `useData()` lee de `useFetchRentacarData()` (no de `useAppConfig()`).
6. `City.link` field eliminado del tipo (dead code).
7. `cities.config.ts` borrado; re-export quitado de `config/index.ts`.
8. `cities: citiesConfig` quitado de los 3 `app.config.ts`.
9. `pnpm typecheck` y `pnpm test` pasan.
10. E2E smoke `/armenia` muestra description + ≥1 testimonio en HTML server-rendered.
11. HTML diff de `/armenia`, `/bogota`, `/cali` antes vs después: vacío o solo cambios cosméticos.
12. ~~Rebase sobre #2/#3/#4 limpio~~ → **hecho**: rama rebaseada sobre `origin/main` post-merge de PR #13 (2026-05-04). Mantenido como evidencia.
13. Scenarios observables (próximo step SDD) verifican comportamiento usuario-visible.
