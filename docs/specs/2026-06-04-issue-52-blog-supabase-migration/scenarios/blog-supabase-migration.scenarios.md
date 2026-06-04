---
name: blog-supabase-migration
created_by: brainstorming
created_at: 2026-06-04T00:00:00Z
---

# Scenarios — Blog Supabase Migration (Issue #52)

**Holdout set** para `/scenario-driven-development`. Fuente: `docs/specs/2026-06-04-issue-52-blog-supabase-migration-design.md` §Escenarios observables.

"Done" = todos PASSED en las 3 marcas (`alquilatucarro`, `alquilame`, `alquicarros`), no "tests verdes". Dev por marca: `pnpm dev:{brand}`.

---

## SCEN-001: Grid con contenido real en las 3 marcas
**Given**: `/blog` en cada marca, en un dev/preview server
**When**: la página carga
**Then**: el grid muestra ≥1 post real con imagen — no el empty state "Próximamente"
**Evidence**: DOM snapshot de `/blog` con tarjetas de post (no el empty state) en las 3 marcas vía `/agent-browser`

## SCEN-002: Detalle responde 200, inexistente 404
**Given**: un slug listado en el sitemap
**When**: se navega a `/blog/<slug>` y a `/blog/no-existe`
**Then**: el slug real responde 200 con el cuerpo renderizado (MDC); el inexistente responde 404
**Evidence**: HTTP status codes — `curl -s -o /dev/null -w "%{http_code}"` (200 real, 404 inexistente)

## SCEN-003: Cero Firebase en código de producción
**Given**: el árbol del repo
**When**: `grep -rn firebasestorage` sobre `content/ app/ server/` excluyendo `__tests__`, más `.env.example`
**Then**: 0 resultados en código de producción de las 3 marcas; el sample de `.env.example` queda scrubeado
**Evidence**: salida vacía de `grep -rn firebasestorage packages/ui-*/{app,server,content} packages/ui-*/.env.example` filtrando `__tests__`

## SCEN-004: Relacionados + prev/next desde Supabase
**Given**: un detalle de post
**When**: se renderizan los relacionados y la navegación prev/next
**Then**: provienen de Supabase vía `/api/blog/posts`; `queryCollection` no aparece en el código
**Evidence**: salida vacía de `grep -rn queryCollection packages/ui-*/app`; en runtime los enlaces relacionados resuelven a `/blog/<slug>` válidos (200)

## SCEN-005: RSS dinámico por marca
**Given**: `/rss.xml` en cada marca
**When**: se solicita
**Then**: responde 200 con XML válido y los posts reales de esa marca (no el estático)
**Evidence**: `curl -s /rss.xml | xmllint --noout -` sin error; nº de `<item>` == filas `blog_posts` de la marca

## SCEN-006: Sitemap derivado de la tabla
**Given**: `sitemap.xml`
**When**: se inspecciona
**Then**: las URLs de blog coinciden 1:1 con las filas `blog_posts` de esa marca — sin slugs hardcodeados, sin URLs muertas
**Evidence**: set de `/blog/*` del sitemap == `SELECT slug FROM blog_posts WHERE brand=$franchise` (verificado en preview `-git-main-`)

## SCEN-007: Las 3 marcas resuelven posts
**Given**: las 3 marcas
**When**: se verifica cada `/blog` y un detalle
**Then**: las 3 resuelven posts (ninguna en empty state)
**Evidence**: `SELECT brand, count(*) FROM blog_posts GROUP BY brand` → 16/16/16; runtime confirma grid + detalle por marca

## SCEN-008: QA runtime limpio
**Given**: QA exploratorio (`/agent-browser` + `/dogfood`) en las 3 marcas
**When**: se recorre `/blog` y un detalle
**Then**: cero errores de consola y cero requests fallidos
**Evidence**: console messages sin errores; network log sin 4xx/5xx en el flujo de blog

## SCEN-009: Transformer flat→nested preserva la forma de BlogPost
**Given**: una fila `blog_posts` flat snake_case (`author_name`, `author_avatar`, `reading_time`, `faq_items`)
**When**: `transformBlogPost` la procesa
**Then**: produce un `BlogPost` con `author: { name, avatar }` anidado y `readingTime`/`faqItems` camelCase; una fila malformada falla-loud vía el guard Valibot
**Evidence**: assertions de `blogTransformers.test.ts` — `result.author.name`, `result.author.avatar`, `result.readingTime` definidos; caso malformado lanza
