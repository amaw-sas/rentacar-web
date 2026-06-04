# Scenarios — Blog Supabase Migration (Issue #52)

**Holdout set** para `/scenario-driven-development`. Fuente: `docs/specs/2026-06-04-issue-52-blog-supabase-migration-design.md` §Escenarios observables.

Cada escenario es observable y verificable con un comando o acción concreta. "Done" = todos PASSED en las 3 marcas, no "tests verdes".

Marcas: `alquilatucarro`, `alquilame`, `alquicarros`. Dev por marca: `pnpm dev:{brand}`.

---

## SCEN-001 — Grid con contenido real en las 3 marcas
**GIVEN** `/blog` en cada marca
**WHEN** la página carga
**THEN** el grid muestra ≥1 post real con imagen — no el empty state "Próximamente".
**Verificación**: `/agent-browser` navega `/blog` en las 3; snapshot contiene tarjetas de post, no el empty state.

## SCEN-002 — Detalle responde 200, inexistente 404
**GIVEN** un slug listado en el sitemap
**WHEN** se navega a `/blog/<slug>`
**THEN** responde 200 con el cuerpo renderizado (MDC), y un slug inexistente responde 404.
**Verificación**: `curl -s -o /dev/null -w "%{http_code}"` a un slug real (200) y a `/blog/no-existe` (404).

## SCEN-003 — Cero Firebase en código de producción
**GIVEN** el árbol del repo
**WHEN** `grep -rn firebasestorage` sobre `content/ app/ server/` excluyendo `__tests__`
**THEN** 0 resultados en las 3 marcas. El sample de `.env.example` queda scrubeado.
**Verificación**: `grep -rn firebasestorage packages/ui-*/{app,server,content} --include='*.ts' --include='*.vue' --include='*.md' | grep -v __tests__` → vacío; `grep -rn firebasestorage packages/ui-*/.env.example` → vacío.

## SCEN-004 — Relacionados + prev/next desde Supabase
**GIVEN** un detalle de post
**WHEN** se renderizan los relacionados y la navegación prev/next
**THEN** provienen de Supabase vía `/api/blog/posts`; `queryCollection` no aparece en el bundle.
**Verificación**: `grep -rn queryCollection packages/ui-*/app` → vacío; en runtime los enlaces relacionados resuelven a `/blog/<slug>` válidos.

## SCEN-005 — RSS dinámico por marca
**GIVEN** `/rss.xml` en cada marca
**WHEN** se solicita
**THEN** responde 200 con XML válido y los posts reales de esa marca (no el estático).
**Verificación**: `curl -s /rss.xml | xmllint --noout -` (válido); el número de `<item>` = filas `blog_posts` de la marca.

## SCEN-006 — Sitemap derivado de la tabla
**GIVEN** `sitemap.xml`
**WHEN** se inspecciona
**THEN** las URLs de blog coinciden 1:1 con las filas `blog_posts` de esa marca — sin slugs hardcodeados, sin URLs muertas.
**Verificación**: comparar el set de `/blog/*` del sitemap con `SELECT slug FROM blog_posts WHERE brand=$franchise`.

## SCEN-007 — Las 3 marcas resuelven posts
**GIVEN** las 3 marcas
**WHEN** se verifica cada `/blog` y un detalle
**THEN** las 3 resuelven posts (ninguna en empty state).
**Verificación**: `SELECT brand, count(*) FROM blog_posts GROUP BY brand` → 16/16/16; runtime confirma grid + detalle por marca.

## SCEN-008 — QA runtime limpio
**GIVEN** QA exploratorio (`/agent-browser` + `/dogfood`) en las 3 marcas
**WHEN** se recorre `/blog` y un detalle
**THEN** cero errores de consola y cero requests fallidos.
**Verificación**: console messages vacío de errores; network sin 4xx/5xx en el flujo de blog.
