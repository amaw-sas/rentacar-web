# Frente 1 — schema y sitemap del blog

**Fecha:** 2026-07-30  
**Rama:** `diego-alex-melo/f1-schema-blog`  
**Base verificada:** `origin/main` recién traído, `ca42a1e153ecc082fe8d75ac651f99068683c5b7`; antes del primer cambio `HEAD...origin/main` dio `0 0`.  
**Publicación:** no se hizo `git push`.

## Fuentes leídas antes de modificar código

- `docs/specs/2026-07-29-parrilla-blog-design.md`, completa, incluida la sección “Doctrina de Google aplicable”. El archivo no estaba en Git; el dueño lo copió después al worktree junto con el grafo HTML y pidió versionar ambos.
- Issues `#439`, `#440` (incluido su comentario) y `#444` mediante `gh issue view`.
- Código de las tres páginas de detalle, guardias de paridad, fuentes dinámicas del sitemap, configuración de sitemap y procedencia de `blog_posts.updated`.

## Commits locales

```text
a564ebc fix(sitemap): remove ignored metadata
fa7aa0d fix(blog): publish honest author identities
7cbab7a fix(blog): remove retired FAQPage schema
2947437 docs: add blog content strategy design
```

El presente reporte se añade en un quinto commit documental después de estas verificaciones.

## Cambios archivo por archivo

### Documentos base recibidos

- `docs/specs/2026-07-29-parrilla-blog-design.md`: se versionó sin editar el diseño entregado por el dueño.
- `docs/specs/assets/2026-07-29-silos-blog.html`: se versionó el grafo interactivo al que apunta el diseño.

### Issue #439 — retirar `FAQPage`

- `packages/ui-alquilame/app/pages/blog/[...slug].vue`: se eliminó el `useSchemaOrg` de `FAQPage` y el import de `defineQuestion`. Se conservó el markup visible condicionado por `post.faqItems`, sus preguntas, sus respuestas, `BlogPosting` y `BreadcrumbList`.
- `packages/ui-alquilatucarro/app/pages/blog/[...slug].vue`: se eliminó el nodo `FAQPage` incluido dentro del grafo y su tipo importado. `BlogPosting` y `BreadcrumbList` siguen presentes.
- `packages/ui-alquicarros/app/pages/blog/[...slug].vue`: ya no tenía `FAQPage` en `origin/main`; no se inventó un cambio. Quedó cubierto por la guardia de ausencia entre marcas.
- `packages/ui-alquilame/app/pages/blog/__tests__/blog-faq-section.test.ts`: ahora lee las tres páginas, exige ausencia de `FAQPage` en todas, exige que sobrevivan `BlogPosting`/`BreadcrumbList` y comprueba que la sección visible de Alquilame siga usando `post.faqItems`, `faq.question` y `faq.answer`.

No se tocó la columna ni el pipeline `faq_items`.

### Issue #440 — autoría honesta

- `packages/ui-alquilame/app/pages/blog/[...slug].vue`: la firma visible y `articleAuthor` pasan a Diego Melo. El autor de `BlogPosting` queda como `Person`, `name: 'Diego Melo'`, `jobTitle: 'Director General'` y URL absoluta al perfil. La tarjeta visible usa la biografía aprobada y enlaza al perfil. La foto es opcional y solo se incluye en HTML/schema cuando existe un archivo local detectado.
- `packages/ui-alquilame/app/pages/blog/autores/diego-melo.vue`: nueva página canónica `/blog/autores/diego-melo`, con los tres fragmentos biográficos aprobados y listado de los artículos de la marca obtenido del API existente.
- `packages/ui-alquilame/app/pages/blog/autores/images/.gitkeep`: documenta el hueco preparado. Añadir un único archivo `diego-melo.avif`, `.webp`, `.jpg`, `.jpeg` o `.png` hace que artículo y perfil lo detecten; hoy no se solicita ni renderiza una URL inexistente.
- `packages/ui-alquilame/app/pages/blog/__tests__/blog-author-schema.test.ts`: guardia entre marcas. Un `Person` debe tener nombre humano literal y falla si coincide con una franquicia; además fija los campos de Diego y exige `Organization` en las otras dos marcas. También protege biografía, listado y ausencia de placeholders.
- `packages/ui-alquilame/app/pages/blog/__tests__/slug.test.ts`: actualiza la antigua expectativa que exigía el nombre/avatar de Supabase y ahora exige Diego Melo, cargo separado, URL y foto condicional.
- `packages/ui-alquilatucarro/app/pages/blog/[...slug].vue`: el autor de `BlogPosting` pasa a `Organization` con `franchise.shortname`; no se inventó persona ni avatar humano.
- `packages/ui-alquicarros/app/pages/blog/[...slug].vue`: el autor de `BlogPosting` pasa a `Organization` con `franchise.shortname`; no se inventó persona ni avatar humano.

### Issue #444 — sitemap

- `packages/ui-alquilame/nuxt.config.ts`
- `packages/ui-alquilatucarro/nuxt.config.ts`
- `packages/ui-alquicarros/nuxt.config.ts`

  En las tres configuraciones, todas las entradas estáticas quedan como `{ loc }`; se retiraron `priority` y `changefreq` de home, ciudades, blog y páginas de Gana.

- `packages/ui-alquilame/server/api/__sitemap__/blog.get.ts`
- `packages/ui-alquilatucarro/server/api/__sitemap__/blog.get.ts`
- `packages/ui-alquicarros/server/api/__sitemap__/blog.get.ts`

  Las tres fuentes dinámicas consultan solo `slug` y devuelven solo `loc`. Se retiraron `priority`, `changefreq` y `lastmod`. El comentario explica por qué `blog_posts.updated` no soporta una señal verificable.

- `packages/logic/tests/seo-index-signals.test.ts`: mantiene las guardias de indexación/Gana, actualizadas a `{ loc }`, y añade una auditoría de las tres marcas que falla si configuración o fuente dinámica vuelven a emitir `priority`, `changefreq` o `lastmod`.

El hallazgo de `lastmod` quedó además publicado en `#444`: https://github.com/amaw-sas/rentacar-web/issues/444#issuecomment-5127056220

## Decisiones conservadoras en puntos ambiguos

1. El issue describía `FAQPage` en las tres marcas, pero en la base fresca solo existía en Alquilame y Alquila tu Carro. Se retiró de esas dos y se convirtió el test en guardia de las tres; no se modificó Alquicarros solo para fabricar simetría.
2. La sección visible de FAQ solo existe en Alquilame en esta base. Se conservó su markup y contenido; no se añadieron secciones nuevas a las otras marcas porque el brief prohibía tocar esa superficie.
3. Se eligió `/blog/autores/diego-melo` para dejar una colección escalable de autores dentro del territorio autorizado del blog. Las rutas estáticas de Nuxt tienen precedencia sobre `[...slug]`.
4. La decisión de firma humana se aplicó a todos los artículos de Alquilame en render/schema, aunque `blog_posts.author_name` siga guardando la marca. No se cambió Supabase ni el modelo, porque estaba fuera de alcance y la vista necesita ser correcta ya.
5. No se usó `public/img/blog/author-avatar.png`: no es la foto aprobada de Diego. La autodetección permite que la página se vea completa sin imagen y que la incorporación posterior sea añadir un solo archivo.
6. `lastmod` se omitió. La auditoría mostró que `updated` se hereda de `WordPress.modified`, mientras que existen actualizaciones directas del cuerpo —por ejemplo `scripts/fix-blog-cross-brand-mentions.ts` escribe `{ body }`— que no mueven esa columna. No es una fecha técnica consistentemente exacta para cambios de contenido o enlaces.
7. No se rediseñó la separación entre fecha técnica y editorial, no se tocó Supabase y no se ejecutaron escrituras de datos.

## Verificación — salida literal

### Pruebas directamente afectadas, estado final

Comando:

```text
npx vitest run --root . packages/ui-alquilame/app/pages/blog/__tests__/blog-faq-section.test.ts packages/ui-alquilame/app/pages/blog/__tests__/blog-author-schema.test.ts packages/ui-alquilame/app/pages/blog/__tests__/slug.test.ts packages/logic/tests/seo-index-signals.test.ts
```

Salida completa:

```text
 RUN  v4.0.15 /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog

 ✓ |ui-alquilame| app/pages/blog/__tests__/blog-faq-section.test.ts (5 tests) 3ms
 ✓ |ui-alquilame| app/pages/blog/__tests__/blog-author-schema.test.ts (8 tests) 5ms
 ✓ |ui-alquilame| app/pages/blog/__tests__/slug.test.ts (17 tests) 6ms
 ✓ |@rentacar-main/logic| tests/seo-index-signals.test.ts (18 tests) 23ms

 Test Files  4 passed (4)
      Tests  48 passed (48)
   Start at  00:56:58
   Duration  285ms (transform 271ms, setup 0ms, import 344ms, tests 37ms, environment 2ms)

AFFECTED_TEST_EXIT 0
```

### Comando obligatorio de los cuatro paquetes

Comando exacto ejecutado:

```text
npx vitest run --root . packages/logic packages/ui-alquilame packages/ui-alquilatucarro packages/ui-alquicarros
```

El proceso avanzó por `logic` y parte de Alquicarros, después dejó de producir salida durante más de cuatro minutos con workers de tests de montaje dormidos. No produjo bloque final. Últimas líneas literales antes de la interrupción controlada:

```text
 ✓ |@rentacar-main/logic| tests/reservation-confirmation-http.test.ts (3 tests) 9024ms
 ✓ |ui-alquicarros| app/components/home/__tests__/presentational.test.ts (15 tests) 3ms
FULL_TEST_EXIT 130
```

Código `130`: interrupción manual después del cuelgue conocido de las suites que montan componentes; no apareció ningún bloque `FAIL` ni `Unhandled Errors` antes del cuelgue. Se verificó con `ps` que los procesos detenidos eran forks de Vitest, y después de `Ctrl-C` no quedó ningún proceso de este worktree.

### Gate local sin los 23 archivos que llaman `mount`/`mountSuspended`

Se repitieron los cuatro paquetes desde la raíz excluyendo únicamente esos archivos, como complemento local al gate de CI. Bloque final literal:

```text
⎯⎯⎯⎯⎯⎯ Failed Suites 5 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |@rentacar-main/logic| src/__tests__/blogEditorialFixes.test.ts [ packages/logic/src/__tests__/blogEditorialFixes.test.ts ]
 FAIL  |@rentacar-main/logic| src/utils/__tests__/brandContent.test.ts [ packages/logic/src/utils/__tests__/brandContent.test.ts ]
TSConfckParseError: parsing /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/.nuxt/tsconfig.app.json failed: Error: ENOENT: no such file or directory, open '/Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/.nuxt/tsconfig.app.json'

 FAIL  |ui-alquilame| tests/seo-index-signals.http.test.ts > alquilame Nitro reservation index signals
 FAIL  |ui-alquicarros| tests/seo-index-signals.http.test.ts > alquicarros Nitro reservation index signals
 FAIL  |ui-alquilatucarro| tests/seo-index-signals.http.test.ts > alquilatucarro Nitro index signals
TSConfckParseError: [vite:esbuild] parsing /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/.nuxt/tsconfig.app.json failed: Error: ENOENT: no such file or directory, open '/Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/.nuxt/tsconfig.app.json'

⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯

Vitest caught 1 unhandled error during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.

⎯⎯⎯⎯⎯⎯ Unhandled Error ⎯⎯⎯⎯⎯⎯⎯
Error: require() of ES Module /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/node_modules/.pnpm/@exodus+bytes@1.15.0/node_modules/@exodus/bytes/encoding-lite.js from /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/node_modules/.pnpm/html-encoding-sniffer@6.0.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js not supported.
Instead change the require of encoding-lite.js in /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog/node_modules/.pnpm/html-encoding-sniffer@6.0.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js to a dynamic import() which is available in all CommonJS modules.
Serialized Error: { code: 'ERR_REQUIRE_ESM' }

 Test Files  5 failed | 348 passed (353)
      Tests  3211 passed | 7 skipped (3218)
     Errors  1 error
   Start at  00:47:41
   Duration  206.29s (transform 47.89s, setup 0ms, import 171.56s, tests 469.66s, environment 1.08s)
```

El `ERR_REQUIRE_ESM` es el problema de jsdom advertido en el brief. El proceso volvió a quedar abierto después del resumen y se interrumpió; código final del proceso `130`.

La causa reparable de las cinco suites fue el artefacto raíz ausente. Se ejecutó:

```text
npx nuxt prepare
│
◆  Types generated in .nuxt.
ROOT_PREPARE_EXIT 0
```

Se repitieron literalmente las cinco suites que habían fallado por ese artefacto:

```text
npx vitest run --root . packages/logic/src/__tests__/blogEditorialFixes.test.ts packages/logic/src/utils/__tests__/brandContent.test.ts packages/ui-alquilame/tests/seo-index-signals.http.test.ts packages/ui-alquilatucarro/tests/seo-index-signals.http.test.ts packages/ui-alquicarros/tests/seo-index-signals.http.test.ts

 RUN  v4.0.15 /Users/diegomelo/orca/workspaces/rentacar-web/f1-schema-blog

 ✓ |@rentacar-main/logic| src/__tests__/blogEditorialFixes.test.ts (15 tests) 10ms
 ✓ |@rentacar-main/logic| src/utils/__tests__/brandContent.test.ts (49 tests) 12ms
 ✓ |ui-alquicarros| tests/seo-index-signals.http.test.ts (2 tests) 165162ms
 ✓ |ui-alquilatucarro| tests/seo-index-signals.http.test.ts (2 tests) 172481ms
 ✓ |ui-alquilame| tests/seo-index-signals.http.test.ts (3 tests) 172913ms

 Test Files  5 passed (5)
      Tests  71 passed (71)
   Start at  00:53:29
   Duration  173.39s (transform 609ms, setup 0ms, import 1.06s, tests 510.58s, environment 3ms)

RETRY_EXIT 0
```

Los tests HTTP emitieron durante el build reintentos de Google Fonts, avisos de Browserslist y 404 esperados al prerenderizar ciudades sin datos; aun así las cinco suites cerraron en verde y con código `0`.

### Comprobaciones adicionales de entorno

- `git diff --check`: código `0` antes de cada commit.
- Búsqueda de `changefreq|priority|lastmod` como propiedades en las seis superficies de sitemap: sin coincidencias, `rg` código `1` (resultado esperado para ausencia).
- `pnpm --filter ui-alquilame typecheck`: código `1` por errores preexistentes en `logic`, componentes, `app.vue` y `nuxt.config.ts`. No reportó errores en la página nueva ni en los archivos de este frente.
- `pnpm exec eslint ...`: no ejecutó porque `eslint` no está instalado/resoluble en este checkout (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, código `254`).

## Pendientes

1. El dueño debe añadir la foto real de Diego como un único archivo en `packages/ui-alquilame/app/pages/blog/autores/images/`; no hace falta cambiar Vue.
2. Diseñar en otro issue una fecha técnica confiable para `lastmod`, separada de `updated`/`dateModified` editorial, y mantenerla en todos los caminos de escritura. Hasta entonces el sitemap omite la señal.
3. CI debe ejecutar las suites de montaje afectadas por el problema local de jsdom; este checkout no puede dar ese gate.
4. La deuda de typecheck y la instalación/configuración de ESLint son ajenas a estos tres issues.
5. No se hizo push. Queda pendiente autorización humana para publicar la rama.
