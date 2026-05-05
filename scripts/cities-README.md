# Cities backfill — Phase 4 / Ola 1 (issue #6)

Toolkit one-shot para migrar el contenido de `cities.config.ts` (description + testimonios) a la tabla `cities` de Supabase.

Vive en `scripts/` con prefijo `cities-` por convención del repo (`scripts/*/` está gitignored, ver `.gitignore:51`).

## Archivos

| Archivo | Rol |
|---|---|
| `cities-snapshot.ts` | Genera `cities-data.json` desde `packages/logic/src/config/cities.config.ts`. Step 1 del plan. |
| `cities-data.json` | Snapshot — 19 ciudades con `id`, `description`, `testimonials`. Sobrevive al delete de `cities.config.ts` (Step 9). |
| `cities-backfill.ts` | Lee `cities-data.json` y aplica UPDATEs a `cities` en Supabase. Step 6 del plan. |
| `cities-README.md` | Este archivo. |

## Prerequisitos

1. Schema `description` + `testimonials` debe existir en la tabla `cities` de Supabase. SQL a aplicar en `rentacar-dashboard`:

   ```sql
   ALTER TABLE cities
     ADD COLUMN description text NULL,
     ADD COLUMN testimonials jsonb NOT NULL DEFAULT '[]'::jsonb;
   ```

2. `.env.local` en la raíz del repo con:

   ```
   NUXT_SUPABASE_URL=https://<project-ref>.supabase.co
   NUXT_SUPABASE_SERVICE_ROLE_KEY=<service_role key — NO commitear>
   ```

   El service role key es necesario porque bypasea RLS para escribir.

3. Las 19 filas con sus `slug` ya deben existir en la tabla `cities` (rentacar-dashboard las gestiona). El backfill solo actualiza columnas; no inserta filas.

## Uso

```bash
# 1) Verificar el snapshot — debe tener 19 entries con description y testimonials
node --input-type=module -e "
  import { readFileSync } from 'node:fs'
  const d = JSON.parse(readFileSync('scripts/cities-data.json', 'utf8'))
  console.log('count:', d.length)
  console.log('with description:', d.filter(c => c.description).length)
  console.log('with testimonios:', d.filter(c => c.testimonials.length > 0).length)
"

# 2) Dry-run — imprime los UPDATEs que se ejecutarían, sin tocar la DB
npx tsx scripts/cities-backfill.ts --dry-run

# 3) Real — aplica UPDATEs uno por uno; falla duro si un slug del JSON
#    no existe en la DB (señal de desincronización).
npx tsx scripts/cities-backfill.ts

# 4) Verificación post-run — query directa a Supabase
#    Esperar 19 filas con desc_len > 0 y testim_count >= 1
psql <connection-string> -c "
  SELECT slug, length(description) AS desc_len, jsonb_array_length(testimonials) AS testim_count
  FROM cities
  ORDER BY slug;
"
```

## Comportamiento ante fallos

- **Slug no existe en DB**: el script aborta con mensaje específico. NO hace UPSERT — preserva el principio de "rentacar-dashboard gestiona filas, rentacar-web gestiona contenido".
- **RLS bloquea UPDATE**: si la service role key es incorrecta, el UPDATE falla con error de permisos. Verificar que `NUXT_SUPABASE_SERVICE_ROLE_KEY` sea el service role (no el anon).
- **Backfill parcial**: si falla a mitad de las 19 ciudades, las anteriores ya están aplicadas. El script es idempotente — re-ejecutarlo aplica las restantes sin duplicar.

## Lifecycle

Este toolkit es **single-use**. Después del backfill exitoso:

1. La tabla `cities` queda con todo el contenido.
2. El plan continúa con Steps 8-11 (cleanup de consumers + cities.config.ts delete + verificación).
3. Post-PR mergeado: el directorio `scripts/cities-*` puede archivarse o borrarse en un PR posterior. Mientras tanto, sirve de referencia y permite re-correr contra staging si hace falta.

`cities-snapshot.ts` específicamente deja de compilar después de Step 9 (`cities.config.ts` borrado). No hay re-ejecución posible. Ese es el diseño: snapshot one-shot.
