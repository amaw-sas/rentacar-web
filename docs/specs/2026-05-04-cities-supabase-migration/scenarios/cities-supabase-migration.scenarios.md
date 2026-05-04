---
name: cities-supabase-migration
created_by: brainstorming → scenario-driven-development
created_at: 2026-05-04T00:00:00Z
issues: ["#6"]
related: ["#11", "#12"]
---

Holdout scenarios para la migración de `cities.config.ts` (1452 líneas) a Supabase como
Phase 4 / Ola 1 del plan firebase→vercel-supabase. El diseño aprobado vive en
`docs/specs/2026-05-04-cities-supabase-migration-design.md`.

Cada scenario describe lo que sucede observablemente (HTML servido, exit codes, output
de query a DB) — no estados internos de stores ni flags. Esto previene reward hacking
durante implementación: hacer pasar el test sin lograr el comportamiento usuario-visible
no es válido.

## SCEN-001: usuario en `/armenia` ve description y testimonio de Supabase

**Given**: tabla `cities` en Supabase tiene fila con `slug='armenia'`, `name='Armenia'`, `description` no-null que contiene el texto literal `Armenia es la puerta de entrada al Paisaje Cultural Cafetero`, y `testimonials` con al menos un objeto que tiene `quote` conteniendo `Llevamos a los niños al Parque del Café`; `cities.config.ts` está borrado del repo; el plugin `rentacar-data` puede alcanzar Supabase.
**When**: un cliente HTTP (curl, sin JS) hace `GET /armenia` contra el deploy de cualquier marca (alquilatucarro, alquilame, alquicarros).
**Then**: response HTTP 200; el body HTML contiene el texto `Armenia es la puerta de entrada al Paisaje Cultural Cafetero` (en la sección de description); el body HTML contiene el texto `Llevamos a los niños al Parque del Café` (en la sección de testimonios). Ambos textos aparecen en HTML server-rendered, no en bundle JS — verificable con `curl ... | grep` sin ejecutar JavaScript.
**Evidence**: `curl -s https://<deploy>/armenia | grep -c "Armenia es la puerta de entrada al Paisaje Cultural Cafetero"` → ≥ 1; `curl -s https://<deploy>/armenia | grep -c "Llevamos a los niños al Parque del Café"` → ≥ 1.

## SCEN-002: usuario navega a ciudad inexistente y recibe 404

**Given**: tabla `cities` en Supabase NO tiene fila con `slug='xanadu-test-city'`; las 19 ciudades reales están presentes.
**When**: cliente HTTP hace `GET /xanadu-test-city` contra el deploy.
**Then**: response HTTP 404; HTML contiene marcador de error 404 estándar de Nuxt; ninguna ciudad se renderiza con datos vacíos o placeholder.
**Evidence**: `curl -s -o /dev/null -w "%{http_code}" https://<deploy>/xanadu-test-city` → `404`.

## SCEN-003: build falla cuando Supabase está inalcanzable durante prerender

**Given**: variables de entorno apuntan a `NUXT_SUPABASE_URL=https://invalid.example.invalid` (host no resuelve) o el host real responde 5xx; el sentinel pattern de #2/#3/#4 ya está mergeado en main; el código de mi PR está rebaseado sobre eso; las 19 ciudades están en `prerender.routes` de cada marca.
**When**: `pnpm --filter ui-alquilatucarro build` (o cualquier marca) corre.
**Then**: exit code != 0; el output de error menciona explícitamente que el query a `cities` falló (ej. `Cities query failed:` o equivalente del re-throw de #2/#3/#4); ningún HTML se publica en `.output/public/armenia/`, `bogota/`, etc.
**Evidence**: el build exit code != 0; `find .output/public -name "index.html" -path "*armenia*"` → vacío después del build fallido. Esto previene la falla silenciosa de issue #2 (HTML 500 cacheado por ISR).

## SCEN-004: typecheck falla si quedan consumers huérfanos de `citiesConfig`

**Given**: `cities.config.ts` borrado; re-export en `config/index.ts` quitado; `cities: citiesConfig` quitado de los 3 `app.config.ts`. Caso de regresión: introduzco un `import { citiesConfig } from '@rentacar-main/logic/src'` falso en cualquier archivo.
**When**: `pnpm --filter @rentacar-main/logic typecheck && pnpm --filter 'ui-*' typecheck`.
**Then**: exit code != 0 con error TS apuntando al import roto. Caso happy (sin import falso): exit code 0 en ambos.
**Evidence**: el comando completo de typecheck retorna 0; agregar artificialmente un import roto produce exit != 0 con mensaje del archivo y línea. Garantiza que no quedan referencias huérfanas que solo fallarían en runtime.

## SCEN-005: `transformCities` mapea shape correcta con datos válidos

**Given**: array de filas Supabase = `[{ slug: 'bogota', name: 'Bogotá', description: 'capital de Colombia...', testimonials: [{ user: { name: 'Ana', description: 'Colombia', avatar: { src: 'a.webp', alt: 'Ana' } }, quote: 'Excelente servicio' }] }]`.
**When**: `transformCities(rows)` se invoca.
**Then**: retorna array de 1 City con `id === 'bogota'`, `name === 'Bogotá'`, `description === 'capital de Colombia...'`, `testimonials.length === 1`, `testimonials[0].quote === 'Excelente servicio'`. **No** existe field `link` en el objeto retornado (regresión guard contra dead code re-introducido).
**Evidence**: test Vitest en `packages/logic/server/utils/__tests__/transformers.test.ts`; aserciones por field; `expect('link' in result[0]).toBe(false)`.

## SCEN-006: `transformCities` filtra testimonios malformados sin throw

**Given**: row con `testimonials = [{ user: { name: 'X' } }, { user: { name: 'OK', description: 'C', avatar: { src: 'a', alt: 'b' } }, quote: 'valid' }, null, 'string-no-objeto', { quote: 'sin user' }]` (5 entries: 1 válido, 4 malformados de distintas formas).
**When**: `transformCities([row])` se invoca.
**Then**: retorna 1 City con `testimonials.length === 1`; el único testimonio es el que tenía shape válida (`quote === 'valid'`). El transformer NO throws; los 4 malformados se descartan silenciosamente.
**Evidence**: test Vitest con la row exacta; `expect(result[0].testimonials).toHaveLength(1)`; `expect(result[0].testimonials[0].quote).toBe('valid')`; `expect(() => transformCities([row])).not.toThrow()`.

## SCEN-007: `transformCities` normaliza `description` null a string vacío

**Given**: row `{ slug: 'x', name: 'Y', description: null, testimonials: [] }`.
**When**: `transformCities([row])` se invoca.
**Then**: retorna `[{ id: 'x', name: 'Y', description: '', testimonials: [] }]`. El consumer (`useCityPageSEO`) ya hace fallback a `franchise.description` ante description falsy — el contrato '' permite ese fallback sin cambios.
**Evidence**: test Vitest; `expect(result[0].description).toBe('')` (no `null`, no `undefined`).

## SCEN-008: `transformCities` maneja `testimonials` no-array sin throw

**Given**: row `{ slug: 'x', name: 'Y', description: 'd', testimonials: { not: 'an array' } }` (objeto en lugar de array — DB corrupted o JSONB mal cargado).
**When**: `transformCities([row])` se invoca.
**Then**: retorna 1 City con `testimonials === []`. NO throws.
**Evidence**: test Vitest; `expect(result[0].testimonials).toEqual([])`; `expect(() => transformCities([row])).not.toThrow()`.

## SCEN-009: `getCityById` resuelve match exacto por slug

**Given**: `useData()` instanciado en harness Pinia/Nuxt con cities = `[{ id: 'armenia', name: 'Armenia', ... }, { id: 'bogota', name: 'Bogotá', ... }]`.
**When**: `getCityById('armenia')`.
**Then**: retorna el objeto City con `id === 'armenia'` y `name === 'Armenia'`.
**Evidence**: test Vitest en `packages/logic/src/composables/__tests__/useData.test.ts`; `expect(result?.name).toBe('Armenia')`.

## SCEN-010: `getCityById` retorna undefined ante mismatch case-sensitive

**Given**: `useData()` con cities = `[{ id: 'armenia', ... }]`.
**When**: `getCityById('Armenia')` (case mismatch — 'A' mayúscula).
**Then**: retorna `undefined`. Documenta la decisión: `===` es case-sensitive y los IDs son lowercase canónicos. La página `[city]/index.vue` lanza 404 ante undefined, comportamiento ya esperado.
**Evidence**: `expect(result).toBeUndefined()`. Distinto del comportamiento previo (`==`) que era loose pero igualmente case-sensitive: el cambio a `===` no altera semantics, solo elimina el lint noise.

## SCEN-011: HTML diff vs baseline pre-migración es vacío para top-3 ciudades

**Given**: deploy preview de la rama `feat/cities-supabase-migration` con todo aplicado (schema, backfill, código mergeado); deploy de `main` pre-migración accesible para baseline.
**When**: para cada slug en `[armenia, bogota, cali]`: capturar HTML de baseline y de preview, normalizar con prettier, hacer diff.
**Then**: el diff es vacío O contiene solo cambios en atributos volátiles (`data-v-xxxxxxxx`, hashes de assets, `nuxt-data` con timestamps). Ningún cambio en texto user-visible, jerarquía DOM, ni metadata SEO (title, meta description, canonicals, schema.org JSON-LD).
**Evidence**: script bash documentado en sección 6.3 del design; corre antes del merge; output revisado humanamente. Una regresión visual aquí bloquea el merge.

---

## Verificación cruzada — anti-reward-hacking

Estos scenarios resisten gaming porque:

- **SCEN-001** verifica texto literal en HTML server-rendered (sin JS). Setear flags internas o renderizar via CSR no satisface — `curl | grep` no ejecuta JavaScript.
- **SCEN-001** usa textos exactos del cities.config.ts actual (Armenia, Parque del Café). Después del backfill esos textos siguen siendo los esperados; cualquier corruption de datos en el path Supabase→transformer→consumer→HTML hace fallar el grep.
- **SCEN-003** valida AUSENCIA de archivos publicados (`find .output/public -name "index.html" -path "*armenia*"` vacío). No hay forma de "pasar" el test sin que el build realmente falle ante outage.
- **SCEN-004** introduce un import falso para verificar que typecheck DETECTA huérfanos. Si typecheck pasa con import roto, hay un escape hatch en la config — bloquea merge.
- **SCEN-005** verifica AUSENCIA del field `link`. Re-introducirlo en el transformer "para mantener API estable" sería reward hacking — el spec lo eliminó intencionalmente.
- **SCEN-006** lista 4 formas distintas de malformación (uno con shape parcial, null, string, objeto sin quote). Filtrar solo una forma no satisface — el guard debe ser robusto a múltiples corruptions.
- **SCEN-011** compara HTML pre/post bytes. Un cambio en copy o estructura DOM falla incluso si el contenido "se ve igual" — el grado de fidelidad es estructural, no semántico.

## Mapping a layer de test

| SCEN | Layer | Archivo sugerido |
|---|---|---|
| SCEN-001 | E2E Playwright (3 marcas) | `e2e/cities-content.spec.ts` |
| SCEN-002 | E2E Playwright | `e2e/cities-content.spec.ts` |
| SCEN-003 | Build script integration test | manual + CI gate (`scripts/cities-content/test-outage-build.sh`) |
| SCEN-004 | TypeScript typecheck | CI gate (`pnpm typecheck`) — guard implícito |
| SCEN-005 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` (extender) |
| SCEN-006 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` |
| SCEN-007 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` |
| SCEN-008 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` |
| SCEN-009 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useData.test.ts` (nuevo) |
| SCEN-010 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useData.test.ts` |
| SCEN-011 | Manual pre-merge | `scripts/cities-content/html-diff.sh` (recomendado por spec-reviewer, opcional) |

## Lo que NO está en holdout (deliberadamente)

- **Behavior bajo outage de Supabase a runtime** — cubierto por scenarios de #2/#3/#4. Mi PR hereda ese contrato, no lo re-prueba.
- **Performance del query a Supabase** — 19 filas trivial; no vale el costo de un budget test.
- **Admin editando description y viéndolo reflejado** — out-of-scope (rentacar-dashboard, fuera de este repo).
- **i18n del contenido** — fuera de alcance (sección "Fuera de alcance" del design).
- **Validación de RLS policy** — operacional (checklist humano pre-merge), no observable como behavior.
