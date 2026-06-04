# Cerrar la migración del blog: Firebase → Supabase (issue #52)

**Fecha**: 2026-06-04
**Issue**: [#52](https://github.com/amaw-sas/rentacar-web/issues/52)
**Status**: Approved
**Origen del plan mayor**: `docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md` (Fase 3 — blog)
**Specs hermanos del mismo patrón**: `2026-05-04-cities-supabase-migration-design.md` (#6), `2026-05-06-faqs-supabase-migration-design.md` (#12), `2026-05-09-franchise-testimonials-supabase-design.md` (#11)

## Motivación

La Fase 3 documentó "blog: Firebase → Supabase". La realidad es otra: el código salió de Firebase, pero no llegó a Supabase. El contenido quedó partido en tres fuentes que conviven en la misma página. Se ve en producción: un `/blog` que a veces sale con el grid vacío, dos marcas sin un solo post, y un avatar que cada artículo todavía baja de Firebase.

El blog es la única isla de la migración que sigue abierta. Este spec la cierra: una sola fuente (Supabase), cero Firebase, las tres marcas con contenido, y las brechas de SEO/performance que el render "funcionando" ocultaba.

## Estado verificado (con evidencia)

El contenido del blog se sirve hoy desde **tres** fuentes distintas a la vez. El stack está **duplicado en las 3 marcas** (`packages/ui-{brand}/`) — los números de línea son de `alquilatucarro` y pueden haber drifteado, pero la sustancia se repite en `ui-alquilame` y `ui-alquicarros`:

| Pieza | Fuente actual | Evidencia (× 3 marcas) |
|---|---|---|
| Listado (`/blog`) | Vercel Blob | `app/pages/blog/index.vue` → `/api/blog/posts` → `loadDynamicPosts()` lee `blob-posts/{franchise}/` |
| Cuerpo del detalle | Vercel Blob | `app/pages/blog/[...slug].vue` → `/api/blog/post/[slug]` → `loadDynamicPosts()` |
| Relacionados + prev/next | `@nuxt/content` | `app/pages/blog/[...slug].vue` → `queryCollection<BlogPost>('blog')` filtrando por `.path` |
| Escritura de posts | Vercel Blob | `server/api/blog/wordpress-sync.post.ts` → `uploadToStorage()` (`@vercel/blob` `put`) |
| Imágenes subidas | Vercel Blob | `server/api/blog/upload-image.post.ts` → `blob-images/{type}/` |

`@nuxt/content` está en los `modules` de las 3 marcas (`nuxt.config.ts:426` en alquilatucarro, `:417` en las otras dos). Pero **solo `alquilatucarro` tiene `content.config.ts` y `content/blog/*.md`**: en `alquilame`/`alquicarros` el `queryCollection('blog')` de la página de detalle corre contra una colección vacía/inexistente. Es decir, el split-brain en las 2 marcas vacías ya está roto hoy, no solo a futuro.

Problemas que esto produce:

1. **Datos incompletos.** 16 `.md` versionados en `content/blog/`, **solo** para `alquilatucarro`. `alquilame` y `alquicarros` tienen 0 — su `/blog` cae al empty state "Próximamente".
2. **Split-brain en la misma página.** El detalle saca el cuerpo de Blob y los relacionados de `@nuxt/content`. Si una fuente tiene el post y la otra no, la página se contradice a sí misma.
3. **Dependencia Firebase viva.** Los 16 posts referencian el avatar de autor (logo de marca) desde `firebasestorage.googleapis.com` en el frontmatter (`avatar:`). 16/16. Si el bucket Firebase se da de baja, los avatares rompen. El host ni siquiera está en la whitelist de `@nuxt/image` (`nuxt.config.ts:435`), así que tampoco se optimizan.
4. **SEO hardcodeado.** El sitemap lista ~17 slugs estáticos (`nuxt.config.ts:654-670`): un post nuevo no entra, un slug borrado anuncia un 404 a Google. El `<link rel="alternate" rss>` apunta a `public/rss.xml` **estático** (fecha fija, items a mano) — no refleja los posts reales.
5. **Sin ISR.** `/blog` y `/blog/[...slug]` no tienen `routeRules` (las city pages sí: `isr: 3600`). Cada request es SSR + lectura de fuente; la caché del loader es in-memory de 5 min, no sobrevive cold starts ni se comparte entre instancias.

Las imágenes de cuerpo y cover ya son locales (`/img/blog/*`, 26 archivos en `alquilatucarro/public/`); no son el problema. El problema de imágenes es solo el avatar.

## Decisiones

| Decisión | Resultado | Razón |
|---|---|---|
| Backend de posts | Supabase, tabla `blog_posts` | Alinea con la intención documentada de la Fase 3 y consolida con `faqs`/`cities`/`franchise_testimonials`/`gsc_tokens` ya en Supabase. Edición sin deploy vía dashboard, que es la directiva de "evitar islas de información". |
| Aislamiento multi-marca | `brand NOT NULL`, queries filtran por franchise | Preserva el modelo per-franchise del loader de Blob actual (`blog-posts/{franchise}/`). Cada marca controla su contenido. |
| Seed inicial de las 2 marcas vacías | Insertar los 16 posts × 3 marcas = 48 filas, brand-tagged | El objetivo es "las 3 marcas con contenido". Sembrar copias garantiza que ninguna caiga al empty state; luego divergen editando. |
| Avatares | **Crear** un asset de avatar local por marca y apuntar `author_avatar` ahí | El avatar es el logo de marca, pero **no existe como archivo en `public/`**: el header lo renderiza como SVG inline (`Logo.vue`), y aunque `app.config.ts` referencia `/images/brand/logo.svg` y `/images/brand/og-logo.png`, ese directorio no existe en disco en ninguna marca. La migración debe **añadir** un asset concreto (p.ej. `public/img/blog/author-avatar.webp` por marca, exportado del SVG o del og-logo) y usar esa ruta. No asumir que ya existe. Mata la última dependencia Firebase, sin storage externo para algo estático. |
| Imágenes subidas dinámicamente | Supabase Storage `blog-images/{brand}/` | Coherente con backend Supabase: una sola fuente de datos del blog. Deprecar el bucket `blog-images` de Vercel Blob. |
| Cover + imágenes de cuerpo | Quedan locales en `public/img/blog/` | Ya están migradas a assets locales. Máximo SEO/perf/costo cero. Copiar los 26 assets a las 2 marcas faltantes para el seed. |
| Eliminar `@nuxt/content` | Quitar el módulo de los 3 `nuxt.config.ts`, borrar `content.config.ts` + `content/blog/*.md` (alquilatucarro) y la dependencia de package.json × 3 | Solo el blog usaba la colección (`queryCollection` aparece únicamente en `[...slug].vue`, en las 3 marcas). Sin blog en `@nuxt/content`, el módulo es peso muerto. |
| Render del markdown | `@nuxtjs/mdc` `parseMarkdown` desde el body en Supabase | Ya es lo que usa `post/[slug].get.ts` para el cuerpo. **`@nuxtjs/mdc` es dependencia explícita** (`package.json: "@nuxtjs/mdc": "^0.20.1"`), no transitiva de `@nuxt/content` → sobrevive a la remoción del módulo. Se conserva el renderer, cambia la fuente del texto. |
| Navegación del detalle (`.path` → `slug`) | Reescribir relacionados + prev/next para usar `slug` y rutas `/blog/${slug}` | `[...slug].vue` hoy usa `post.path`/`related.path`/`surroundings[].path` (campos internos de `@nuxt/content`) para el `:to` y el filtro `.where('path','!=',...)`. El `BlogPost` de Supabase no trae `.path`. Sin esta reescritura, la navegación del detalle rompe en las 3 marcas. |
| SEO/perf en el mismo cierre | Sitemap + RSS dinámicos desde `blog_posts`, ISR para `/blog/**` | Con la fuente única en Supabase, derivar sitemap/RSS de la tabla es natural; dejarlos hardcodeados sería re-abrir #52 después. |

## Arquitectura objetivo — fuente única

Las tres fuentes colapsan a una. Todos los endpoints y páginas de abajo viven duplicados en `packages/ui-{brand}/` y se tocan en las 3 marcas. Acceso vía el patrón ya establecido en `logic/server/`:

- Lectura: `useSupabaseClient()` (anon) + `defineCachedEventHandler` con cache key scoped a `app.buildId` (el fix de #62, ya en repo, evita servir respuestas de un deploy previo).
- Escritura: `useSupabaseAdminClient()` (service_role) detrás del middleware `blog-api-auth` (API key) ya existente.

| Pieza | Después |
|---|---|
| `/api/blog/posts` | Query `blog_posts WHERE brand=$franchise` ORDER BY `date` DESC, solo frontmatter. Reemplaza `loadDynamicPosts`. |
| `/api/blog/post/[slug]` | Query fila única `(brand, slug)`, render del `body` vía MDC. Post inexistente → 404. |
| Relacionados + prev/next | Consumen `/api/blog/posts` (Supabase). Se elimina `queryCollection`. |
| `/api/blog/wordpress-sync` | Upsert en `blog_posts` (admin client). Reemplaza `uploadToStorage`. |
| `/api/blog/upload-image` | `put` en Supabase Storage `blog-images/{brand}/`. |
| `/api/blog/post/[slug].delete` | Borra la fila + sus imágenes en Supabase Storage. |
| `/api/blog/debug` | Reporta conteo de filas por marca en vez de listado de Blob. |

**Se elimina entero (× 3 marcas salvo donde se indique)**: módulo `@nuxt/content` de los 3 `nuxt.config.ts` + su entrada en los 3 `package.json`; `server/plugins/content-dynamic-loader.ts`; `server/utils/blob-storage.ts` (lo consume solo el blog); `server/api/blog/posts-dynamic.get.ts`. Solo en alquilatucarro: `content.config.ts` y `content/blog/*.md` (las otras 2 marcas no los tienen). Los buckets Blob `blog-posts/` y `blog-images/` quedan deprecados (no se borran en este PR; se vacían por desuso).

**Tests a migrar/eliminar (× 3 marcas)**: `useBlogUtils.test.ts`, `wordpress-to-nuxt.test.ts`, `vercel-blob-storage.test.ts`, `upload-image.post.test.ts`, `[slug].delete.test.ts`, `wordpress-sync.post.test.ts`. Algunos referencian `firebasestorage`/`@vercel/blob`; o se actualizan al nuevo backend o se borran junto con el código que prueban.

**Contrato `BlogPost`** (`packages/logic/src/utils/types/type/BlogPost.ts`): se le quitan los campos internos de `@nuxt/content` (`_path`, `_dir`, `_file`, `_extension`, …) y se añade `slug`. Consumidores del cambio: las 3 páginas `[...slug].vue` y `index.vue` (listado).

## Esquema

```sql
create table blog_posts (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,                       -- alquilatucarro | alquilame | alquicarros
  slug          text not null,
  title         text not null,
  description   text not null,
  body          text not null,                       -- markdown crudo, render vía @nuxtjs/mdc
  image         text not null,                       -- cover, ruta local /img/blog/*
  alt           text not null,
  author_name   text not null,
  author_avatar text not null,                       -- logo local por marca, NUNCA Firebase
  date          date not null,
  updated       date,
  category      text not null check (category in ('guias','destinos','tips','rutas')),
  tags          text[] not null default '{}',
  reading_time  int  not null,
  featured      boolean not null default false,
  faq_items     jsonb,                               -- [{question, answer}]
  meta_title    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (brand, slug)
);

create index blog_posts_brand_date_idx on blog_posts (brand, date desc);

alter table blog_posts enable row level security;
-- Lectura pública (anon SELECT).
create policy blog_posts_public_read on blog_posts for select to anon using (true);
-- Escritura solo service_role (sin policy para anon → denegado por defecto).
```

El esquema replica el frontmatter de la colección `@nuxt/content` (`content.config.ts`) campo por campo, de modo que `BlogPost` (`packages/logic/src/utils/types/type/BlogPost.ts`) sirve de contrato; se le quitan los campos internos `_path`/`_dir`/etc. de `@nuxt/content`.

## Imágenes

- **Avatares (16/16 en Firebase)**: hoy `author.avatar` apunta a `https://firebasestorage.googleapis.com/.../{brand}/img/logo.png`. No hay un equivalente local listo (el logo del header es SVG inline en `Logo.vue`; `/images/brand/*` no está en disco). Paso de migración: **crear** un asset por marca — `public/img/blog/author-avatar.webp` — exportado del logo, y guardar esa ruta en `author_avatar`.
- **Cover + cuerpo**: ya locales en `alquilatucarro/public/img/blog/` (26 archivos). `alquilame` y `alquicarros` tienen 7 cada una hoy → para el seed de las 48 filas, copiar el set completo de 26 a esas dos marcas (añadir las que falten; verificar que las 7 existentes no diverjan de las de alquilatucarro).
- **Subidas dinámicas**: bucket Supabase Storage `blog-images/{brand}/`; reescribir `upload-image` y la limpieza en `[slug].delete.ts` (× 3 marcas).

## SEO / performance

- **Sitemap**: eliminar la lista hardcodeada (`nuxt.config.ts:654-670`); fuente dinámica por marca desde `blog_posts` (source async del módulo `@nuxtjs/sitemap`).
- **RSS**: borrar `public/rss.xml` estático; ruta servidor `/rss.xml` que genera el feed desde `blog_posts` de la marca activa.
- **ISR**: `routeRules` para `'/blog'` y `'/blog/**'` con `isr: 3600`, espejo de las city pages.

## Migración de datos

Mismo enfoque que faqs (#12): MCP `apply_migration` para el DDL, `execute_sql` para el seed (no script `*-backfill.ts`).

1. Crear el asset `public/img/blog/author-avatar.webp` por marca (ver Imágenes).
2. Parsear los 16 `.md` de `alquilatucarro/content/blog/` (frontmatter + body).
3. Reescribir `author.avatar` Firebase → `/img/blog/author-avatar.webp`.
4. Insertar 16 × 3 = 48 filas, brand-tagged; ajustar `author_name`/branding por marca.
5. Copiar el set de 26 imágenes a las 2 marcas faltantes (alquilame/alquicarros).

## Manejo de errores

- Server: `createError({ statusCode })`. Error de query en listado/detalle → 500 (igual que `faqs` en `rentacar-data`). Post inexistente → 404.
- RLS: anon read-only; escrituras vía admin client + middleware `blog-api-auth` (API key) existente.

## Riesgo conocido

`logic/server/utils/supabase.ts` advierte que el singleton de Supabase puede correr init duplicado bajo cold starts concurrentes en Vercel Functions. `rentacar-data` ya vive con ese patrón en producción; el blog lo hereda. Mismo riesgo, no nuevo — no se mitiga en este PR.

## Escenarios observables (holdout para `/scenario-driven-development`)

1. **GIVEN** `/blog` en cada marca **WHEN** carga **THEN** el grid muestra ≥1 post real con imagen, no el empty state.
2. **GIVEN** un slug del sitemap **WHEN** se navega a `/blog/<slug>` **THEN** 200 con cuerpo renderizado (no 404).
3. **GIVEN** `grep -rn firebasestorage` sobre `content/`, `app/`, `server/` excluyendo `__tests__` (o incluyéndolos si los tests ya se migraron) **THEN** 0 resultados en código de producción de las 3 marcas.
4. **GIVEN** un detalle de post **WHEN** se ven los relacionados y prev/next **THEN** provienen de Supabase (sin `queryCollection` en el bundle).
5. **GIVEN** `/rss.xml` por marca **WHEN** se solicita **THEN** 200 con XML válido y los posts reales de esa marca.
6. **GIVEN** `sitemap.xml` **WHEN** se inspecciona **THEN** las URLs de blog = filas `blog_posts` de esa marca (sin hardcode, sin URLs muertas).
7. **GIVEN** las 3 marcas **WHEN** se verifica cada `/blog` **THEN** las 3 resuelven posts.
8. **GIVEN** QA runtime (`/agent-browser` + `/dogfood`) en las 3 marcas **THEN** cero errores de consola y cero requests fallidos.

## Fuera de alcance

- Borrar físicamente los buckets Blob `blog-posts/`/`blog-images/` (se deprecan por desuso).
- Cualquier rediseño visual del blog (`/frontend-design` no aplica: el markup existe y funciona).
- Editor/panel de administración de posts en el dashboard (cross-repo, fuera de este repo).
