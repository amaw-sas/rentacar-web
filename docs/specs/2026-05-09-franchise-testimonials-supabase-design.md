# Migrar `franchise.testimonials` a Supabase (Phase 4 — Ola siguiente a #6)

**Fecha**: 2026-05-09
**Issue**: [#11](https://github.com/amaw-sas/rentacar-web/issues/11)
**Origen del plan mayor**: `docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md` (Phase 4)
**Dependencia resuelta**: [#6](https://github.com/amaw-sas/rentacar-web/issues/6) — CLOSED, mergeada en main 2026-05-04. Estableció el patrón `testimonials jsonb` + Valibot validation + `defineCachedEventHandler` + transformer puro que esta ola reutiliza al 100%.

## Motivación

Cada `packages/ui-{brand}/app/app.config.ts` declara inline un array `franchise.testimonials` de 6 testimonios (líneas 80-153 en los tres paquetes). Verificado con `diff`: byte-identical entre `ui-alquicarros`, `ui-alquilame`, `ui-alquilatucarro`. Hoy editar copy o agregar un testimonio implica PR + redeploy en los tres paquetes.

La directiva del usuario es la misma que llevó a #6: **evitar islas de información**. Y ya hay precedente directo — la tabla `cities` ganó la columna `testimonials jsonb` en #6 con su transformer y validación. Esta ola repite el patrón sobre `franchises`.

**Objetivo del PR**: agregar columna `testimonials jsonb` a `franchises`, backfill desde los 3 `app.config.ts`, exponerla vía el endpoint existente `/api/rentacar-data`, consumirla en cada `pages/index.vue`, y borrar la fuente local.

## Alcance

PR único — equivalente a la "Ola 1" de #6, pero más pequeño porque:
- Solo una fuente (un único array por marca, no Records keyed por ciudad).
- Schema reutiliza el `testimonialSchema` Valibot ya definido en `transformers.ts:159-169`.
- `franchises` ya existe (3 filas: alquicarros, alquilame, alquilatucarro) y ya tiene policy `"Anon can read franchises" USING (true)`.

**Fuera de alcance**: el resto de campos `franchise.*` en `app.config.ts` (title, description, ogImage, phone, etc.) — algunos viven en `franchises` table ya (display_name, website, phone, whatsapp, logo_url) pero su migración a runtime es trabajo separado. Este PR solo mueve `franchise.testimonials`.

## Decisiones acordadas

| Decisión | Resultado | Razón |
|---|---|---|
| Schema | Columna `testimonials jsonb NOT NULL DEFAULT '[]'` en `franchises` | Idéntico a `cities.testimonials` (precedente #6). Testimonios "viejos, rara vez se actualizan, futuro Google Maps" — invertir en tabla satélite es over-design. |
| Fila por marca vs payload compartido | 3 filas (una por code) con array de 6 testimonios | `franchises` ya tiene una fila por marca. Permite divergencia futura sin coste extra. Hoy las 3 filas tienen el mismo array. |
| Validación de shape | Reutilizar `testimonialSchema` y `parseTestimonials` ya en `transformers.ts` | Defense at boundary; cap de array (slice 12) y de longitudes — exactamente igual que cities. Cero duplicación. |
| Endpoint | Extender `/api/rentacar-data.get.ts` (no endpoint nuevo) | Mismo SSR/cache, una sola fetch, plugin existente. |
| Tipo | Agregar `franchiseTestimonials: Record<string, Testimonial[]>` a `ReservasApiData` | Lookup O(1) por `useRuntimeConfig().public.rentacarFranchise`. |
| Cleanup | Borrar `franchise.testimonials` de los 3 `app.config.ts` | Fuente única de verdad. Type sigue exportado desde `packages/logic/src/utils/types/type/Testimonial.ts`. |
| Migración remota | Aplicada vía MCP `apply_migration` antes de mergear el código | Aditiva (`ADD COLUMN ... DEFAULT '[]'`) → cero downtime, cero rotura para el dashboard que ya consulta `franchises.*`. Backfill ejecutado y verificado: 3 filas × 6 testimonios. |

## Arquitectura objetivo

```
Build / ISR regen
  rentacar-data.get.ts (extendido)
    └── 5 queries paralelos a Supabase
        ├── vehicle_categories      (existente)
        ├── locations               (existente)
        ├── rental_companies        (existente)
        ├── cities                  (existente — agregado en #6)
        └── franchises              (NUEVO — code, testimonials WHERE status='active')
    └── transformers
        └── transformFranchiseTestimonials()   (NUEVO — DB rows → Record<code, Testimonial[]>)
            └── reutiliza parseTestimonials() existente
    └── ReservasApiData con field franchiseTestimonials   (NUEVO)
        ↓
      plugin rentacar-data.ts → useState('rentacar-data')   (sin cambios)
        ↓
      useFetchRentacarData() → returns ReservasApiData      (sentinel actualizado)
        ↓
      pages/index.vue (3 paquetes)
        const brandCode = useRuntimeConfig().public.rentacarFranchise
        const { franchiseTestimonials } = useFetchRentacarData()
        const testimonios = franchiseTestimonials[brandCode] ?? []
        ↓
      <UPageSection id="testimonios"> (sin cambios de markup)
```

## Cambios concretos

### 1. Migración SQL (ya aplicada en remote `ilhdholjrnbycyvejsub`)

```sql
ALTER TABLE public.franchises
  ADD COLUMN testimonials jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.franchises.testimonials IS
  'Brand testimonials shown on each franchise homepage. Shape: [{ user: { name, description, avatar: { src, alt } }, quote }]. Migrated from packages/ui-{brand}/app/app.config.ts in issue #11. Temporary — to be replaced by Google Maps Reviews integration.';
```

Backfill: `UPDATE public.franchises SET testimonials = $1::jsonb WHERE code IN ('alquicarros','alquilame','alquilatucarro')` con el array idéntico copiado de `packages/ui-alquicarros/app/app.config.ts:80-153`. Resultado verificado: 3 filas × 6 testimonios.

### 2. `packages/logic/server/api/rentacar-data.get.ts`

- Agregar 5° query a `Promise.all`: `supabase.from('franchises').select('code, testimonials').eq('status','active')`.
- Manejo de error simétrico al de cities/categories.
- Devolver `franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data)`.

### 3. `packages/logic/server/utils/transformers.ts`

```ts
interface SupabaseFranchise {
  code: string
  testimonials: unknown
}

export function transformFranchiseTestimonials(
  rows: SupabaseFranchise[],
): Record<string, Testimonial[]> {
  const result: Record<string, Testimonial[]> = {}
  for (const row of rows) {
    result[row.code] = parseTestimonials(row.testimonials)
  }
  return result
}
```

`parseTestimonials` ya existe (línea 171) y se reutiliza tal cual — mismo cap de 12, mismas longitudes máximas, mismo Valibot schema.

### 4. `packages/logic/src/utils/types/data/ReservasApiData.ts`

Agregar campo:
```ts
import type Testimonial from '../type/Testimonial';
// ...
export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;
  vehicleCategories: VehicleCategoryData;
  cities: City[];
  franchiseTestimonials: Record<string, Testimonial[]>;   // NUEVO
}
```

### 5. `packages/logic/src/composables/useFetchRentacarData.ts`

Actualizar `EMPTY_SENTINEL` para incluir `franchiseTestimonials: Object.freeze({})`.

### 6. `packages/ui-{alquicarros,alquilame,alquilatucarro}/app/pages/index.vue`

Reemplazar la línea con `const testimonios: Testimonial[] = franchise.testimonials;` (320 en alquicarros/alquilame, 323 en alquilatucarro — verificado con grep) por un lookup reactivo:
```diff
- const testimonios: Testimonial[] = franchise.testimonials;
+ const brandCode = useRuntimeConfig().public.rentacarFranchise as string;
+ const { franchiseTestimonials } = useFetchRentacarData();
+ const testimonios = computed<Testimonial[]>(() => franchiseTestimonials[brandCode] ?? []);
```

`computed` (no `const` plano) — defensa frente a transiciones sentinel→populated durante HMR de dev y cualquier Suspense boundary futuro. Costo nulo y alinea con el patrón reactivo del resto de consumidores del bundle.

### 7. `packages/ui-{alquicarros,alquilame,alquilatucarro}/app/app.config.ts`

Borrar líneas 80-153 (el array `testimonials`). El resto de `franchise.*` queda intacto.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Endpoint falla en runtime y deja la home sin testimonios | `parseTestimonials` ya devuelve `[]` ante input no-array; `useFetchRentacarData` ya retorna sentinel vacío. La sección `#testimonios` renderizará vacía sin crash. |
| Stuffing de JSONB (operador pega un array gigante) | Caps reutilizados de `testimonialSchema`: array slice 12, longitudes 25-1000 chars. |
| El dashboard rompe por la columna nueva | Aditiva con DEFAULT — el dashboard sigue funcionando idéntico. Verificación post-aplicación: dashboard SELECT * sigue funcionando. |
| Caché ISR de 1h sirve testimonios viejos tras edit | Mismo riesgo aceptado en #6. Resolverá con tag-based invalidation cuando llegue (TODO ya documentado en `rentacar-data.get.ts:54-58`). |
| Marca sin fila en `franchises` (futuro) | `franchiseTestimonials[brandCode] ?? []` — fallback explícito a vacío. |

## Anexo: dependencias de tipos

- `Testimonial` ya está extraído a `packages/logic/src/utils/types/type/Testimonial.ts` (vía #6).
- `City` (post-#6) usa el mismo tipo. Cero re-export ni alias necesarios.
