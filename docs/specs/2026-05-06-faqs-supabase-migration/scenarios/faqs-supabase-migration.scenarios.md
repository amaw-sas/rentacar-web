---
name: faqs-supabase-migration
created_by: brainstorming → scenario-driven-development
created_at: 2026-05-06T00:00:00Z
issues: ["#12"]
related: ["#6"]
---

Holdout scenarios para la migración de `packages/logic/src/config/faqs.config.ts` (10 FAQs genéricas, 70 líneas) a tabla `faqs` en Supabase. Phase 4 — revoca la decisión "Mantener faqs hardcoded" del plan firebase→vercel-supabase. Diseño aprobado en `docs/specs/2026-05-06-faqs-supabase-migration-design.md`.

Cada scenario describe lo que sucede observablemente (HTML servido, exit codes, query a DB) — no estados internos de stores ni flags. Esto previene reward hacking durante implementación: hacer pasar el test sin lograr el comportamiento usuario-visible no es válido.

**Patrón heredado**: `docs/specs/2026-05-04-cities-supabase-migration/scenarios/cities-supabase-migration.scenarios.md` (PR #19, mergeada). Scenarios paralelos con la diferencia de que cities usaba UPDATE sobre filas existentes mientras FAQs usa INSERT a tabla nueva — esto añade scenarios específicos de idempotencia (SCEN-005, SCEN-006).

## SCEN-001: usuario en `/` ve las 10 FAQs renderizadas en orden desde Supabase

**Given**: tabla `faqs` en Supabase tiene 10 filas activas (`status='active'`); las 3 primeras filas en `display_order` ascendente tienen `label` exacto `¿Cómo puedo hacer una reserva?`, `¿Se puede realizar un alquiler de carros sin tarjeta de crédito?`, `¿No tengo todo el cupo en la tarjeta, puedo hacer la reserva?`; el plugin `rentacar-data` puede alcanzar Supabase; `faqs.config.ts` está borrado del repo.
**When**: cliente HTTP (curl, sin JS) hace `GET /` contra el deploy de cualquier marca (alquilatucarro, alquilame, alquicarros).
**Then**: response HTTP 200; el body HTML contiene los 3 textos de label exactos en ese orden de aparición; el body HTML contiene la cadena `Para realizar un alquiler de carros debe generar una reserva` (fragmento del `content` de la FAQ #1, asegura que el body viaja, no solo el label); los 3 textos aparecen en HTML server-rendered, no en bundle JS.
**Evidence**: `curl -s https://<deploy>/ | grep -c "¿Cómo puedo hacer una reserva?"` → ≥ 1; `curl -s https://<deploy>/ | grep -c "Para realizar un alquiler de carros debe generar una reserva"` → ≥ 1; el offset de la primera ocurrencia de `¿Cómo puedo hacer` es menor que el de `¿Se puede realizar un alquiler de carros sin tarjeta de crédito?` (orden preservado).

## SCEN-002: una FAQ con `status='inactive'` no aparece en HTML

**Given**: tabla `faqs` tiene 11 filas: 10 activas + 1 fila con `status='inactive'` y `label='¿FAQ marcada como inactive — no debe aparecer?'`.
**When**: cliente HTTP hace `GET /` contra el deploy.
**Then**: response HTTP 200; HTML contiene los 10 labels activos; HTML NO contiene el string `¿FAQ marcada como inactive — no debe aparecer?`. Cero ocurrencias del label inactivo.
**Evidence**: `curl -s https://<deploy>/ | grep -c "¿FAQ marcada como inactive"` → exactamente `0`. La query `.eq('status', 'active')` filtra server-side antes del transformer.

## SCEN-003: build no falla cuando Supabase está inalcanzable durante prerender

**Given**: variable de entorno `NUXT_SUPABASE_URL=https://invalid.example.invalid` (host no resuelve); el sentinel pattern de `useFetchRentacarData.ts` extiende `EMPTY_SENTINEL` con `faqs: []`; `index.vue` × 3 no se rompe ante `faqs.length === 0`.
**When**: `pnpm --filter ui-alquilatucarro build` (o cualquier marca) corre.
**Then**: exit code = 0 (build pasa); el HTML resultante en `.output/public/index.html` contiene `id="faqs"` (sección presente, accordion vacío); el log del build no contiene errors de `useSchemaOrg` ni unhandled exceptions; el HTML NO contiene texto user-visible de error (e.g. "Error", "undefined", "[object Object]") dentro del bloque `<section id="faqs">`.
**Evidence**: build exit code 0; `grep -l 'id="faqs"' .output/public/**/index.html` retorna match; `grep -E '(useSchemaOrg|Cannot read|undefined.*FAQ)' build.log` retorna 0 matches; sección `#faqs` queda con accordion vacío sin error visible.

## SCEN-004: `transformFAQs` filtra filas con `label` o `content` vacíos sin throw

**Given**: array de filas Supabase = `[{ label: '', content: 'valid' }, { label: 'valid', content: '' }, { label: 'valid', content: 'valid' }, { label: null, content: 'x' }, { label: 'x', content: undefined }]` (5 entries: 1 válido, 4 malformados de distintas formas).
**When**: `transformFAQs(rows)` se invoca.
**Then**: retorna array de 1 FAQ con `{ label: 'valid', content: 'valid' }`; las 4 filas malformadas se descartan silenciosamente; `transformFAQs` NO throws; el orden de las filas válidas se preserva (no hay reordering implícito).
**Evidence**: test Vitest en `packages/logic/server/utils/__tests__/transformers.test.ts`; `expect(result).toHaveLength(1)`; `expect(result[0]).toEqual({ label: 'valid', content: 'valid' })`; `expect(() => transformFAQs(rows)).not.toThrow()`.

## SCEN-005: backfill ejecutado dos veces no duplica filas

**Given**: tabla `faqs` con `UNIQUE(label)` constraint aplicado; primera ejecución de `scripts/faqs-backfill.ts` insertó las 10 filas desde `faqs-data.json`; ninguna mutación manual en Supabase entre ejecuciones.
**When**: `npx tsx scripts/faqs-backfill.ts` corre por segunda vez.
**Then**: exit code = 0; el script reporta 10 INSERTs intentados, 10 conflictos (`ON CONFLICT (label) DO NOTHING` activado); query `SELECT count(*) FROM faqs` retorna exactamente 10; ninguna fila duplicada por `label`.
**Evidence**: `psql ... -c "SELECT count(*), count(DISTINCT label) FROM faqs;"` → ambos valores = 10. Re-corrida es idempotente sin esfuerzo manual del operador.

## SCEN-006: edición manual de `content` se preserva ante re-corrida del backfill

**Given**: backfill aplicado correctamente; operador edita manualmente vía editor Supabase la fila con `label='¿Cómo puedo hacer una reserva?'` cambiando `content` al texto literal `EDITADO_MANUALMENTE_2026_05_07`; el JSON en `scripts/faqs-data.json` permanece sin cambios (sigue con el content original).
**When**: alguien re-ejecuta `npx tsx scripts/faqs-backfill.ts`.
**Then**: exit code = 0; el script reporta 10 conflictos (DO NOTHING activado por UNIQUE label); el `content` editado manualmente NO se sobreescribe; query a `faqs` retorna la fila editada con `content = 'EDITADO_MANUALMENTE_2026_05_07'`.
**Evidence**: `psql ... -c "SELECT content FROM faqs WHERE label = '¿Cómo puedo hacer una reserva?';"` → `EDITADO_MANUALMENTE_2026_05_07`. Diferencia clave con cities (que usaba UPDATE forzado sobreescribiendo ediciones manuales).

## SCEN-007: typecheck pasa post-migración con cero referencias huérfanas

**Given**: `faqs.config.ts` borrado; re-export en `config/index.ts` quitado; `faqsConfig` import + `faqs: faqsConfig` field + comentario `// Shared FAQs ...` quitados de los 3 `app.config.ts`; `useData.ts` lee `faqs` de `useFetchRentacarData()`; `index.vue` × 3 lee `faqs` de `useData()`.
**When**: `pnpm --filter @rentacar-main/logic typecheck && pnpm --filter 'ui-*' typecheck`.
**Then**: exit code = 0 en ambos comandos. Caso de regresión: introducir artificialmente un `import { faqsConfig } from '@rentacar-main/logic/config'` en cualquier archivo produce exit != 0 con error TS apuntando al import roto.
**Evidence**: el comando completo de typecheck retorna 0; agregar import roto produce exit != 0 con mensaje del archivo y línea. Garantiza que no quedan referencias huérfanas que solo fallarían en runtime.

## SCEN-008: cero matches de `useAppConfig().faqs` en código post-migración

**Given**: PR mergeado con todas las ediciones aplicadas.
**When**: `git grep -nE "useAppConfig\(\)\.faqs|appConfig\.faqs" packages/`.
**Then**: cero matches. El acceso al field `faqs` desde `useAppConfig()` ha sido completamente migrado a `useData().faqs`.
**Evidence**: `git grep -nE "useAppConfig\(\)\.faqs|appConfig\.faqs" packages/ ; echo $?` → output vacío, exit code 1 (grep "no matches found"). Distinto de exit 0 con matches.

## SCEN-009: `useFetchRentacarData` sentinel devuelve `faqs: []` sin TypeError en consumer

**Given**: harness Vitest donde `useState('rentacar-data')` retorna `null` (estado inicial pre-fetch o outage); `useFetchRentacarData()` devuelve el `EMPTY_SENTINEL` con `faqs: Object.freeze([])`.
**When**: un componente lee `useData().faqs` y luego ejecuta `faqs.map((f) => f.label)`.
**Then**: el mapping retorna `[]`; no se lanza `TypeError: Cannot read property 'map' of undefined` ni similar; `faqs.length === 0`.
**Evidence**: test Vitest en `packages/logic/src/composables/__tests__/useData.test.ts`; mock `useFetchRentacarData` para retornar el sentinel; `expect(() => useData().faqs.map((f) => f.label)).not.toThrow()`; `expect(useData().faqs).toEqual([])`.

## SCEN-010: las 3 marcas sirven FAQs idénticas (sin brand-scoping)

**Given**: tabla `faqs` en Supabase con 10 filas activas; deploys de las 3 marcas (alquilatucarro, alquilame, alquicarros) consumen el mismo endpoint `/api/rentacar-data` que apunta a la misma instancia de Supabase.
**When**: capturar el HTML de `/` para las 3 marcas en orden — `curl -s https://<deploy-A>/`, `curl -s https://<deploy-B>/`, `curl -s https://<deploy-C>/`.
**Then**: la lista de labels extraídos del HTML es idéntica entre las 3 marcas (mismo set, mismo orden). Los `content` también son idénticos. Confirma decisión de NO añadir columna `brand` en el schema.
**Evidence**: extraer labels con `xmllint --html --xpath '//*[@id="faqs"]//text()'` (o equivalente) para cada marca; comparar arrays — `expect(labelsA).toEqual(labelsB)`, `expect(labelsB).toEqual(labelsC)`. Si el spec evoluciona a brand-scoping en el futuro, este scenario falla y se debe regenerar.

---

## Verificación cruzada — anti-reward-hacking

Estos scenarios resisten gaming porque:

- **SCEN-001** verifica texto literal en HTML server-rendered (sin JS). Setear flags internas o renderizar via CSR no satisface — `curl | grep` no ejecuta JavaScript. Los 3 labels exactos provienen de `faqs.config.ts` actual; cualquier corrupción en el path Supabase→transformer→consumer→HTML hace fallar el grep. El check de orden (offset de label[0] < offset de label[1]) garantiza que `display_order` se respeta.
- **SCEN-002** verifica AUSENCIA del label inactivo. La filtración debe ocurrir server-side (`.eq('status', 'active')` en la query SQL); colar la fila inactiva al payload y luego filtrar en el cliente sería un anti-pattern detectable porque el HTML server-rendered ya tendría el contenido inactivo.
- **SCEN-003** valida criterios concretos: exit code 0, presencia de `id="faqs"`, ausencia de patterns de error en log. No hay forma de "pasar" sin que el sentinel realmente funcione.
- **SCEN-004** lista 4 formas distintas de malformación (`label=''`, `content=''`, `label=null`, `content=undefined`). Filtrar solo una forma no satisface.
- **SCEN-005 + SCEN-006** verifican el contrato de idempotencia desde dos ángulos: (a) no duplica al re-correr; (b) no sobreescribe ediciones manuales. Un script naive que trunca antes de insertar pasaría SCEN-005 pero fallaría SCEN-006. Solo `ON CONFLICT (label) DO NOTHING` satisface ambos.
- **SCEN-007** introduce un import falso para verificar que typecheck DETECTA huérfanos. Si typecheck pasa con import roto, hay un escape hatch en la config — bloquea merge.
- **SCEN-008** usa `git grep` que opera sobre el código fuente real, no estado en memoria. Imposible "pasar" sin haber editado los archivos.
- **SCEN-010** compara HTML entre marcas. Si alguien añade una columna `brand` y filtra, este scenario empieza a fallar — guard contra el over-engineering.

## Mapping a layer de test

| SCEN | Layer | Archivo sugerido |
|---|---|---|
| SCEN-001 | E2E Playwright (3 marcas) | `e2e/faqs-content.spec.ts` |
| SCEN-002 | E2E Playwright (con seed temporal de fila inactive) | `e2e/faqs-content.spec.ts` |
| SCEN-003 | Build script integration test | manual + checklist (`scripts/faqs-README.md`) |
| SCEN-004 | Vitest unit (logic) | `packages/logic/server/utils/__tests__/transformers.test.ts` (extender) |
| SCEN-005 | Manual con psql post-backfill | checklist en `scripts/faqs-README.md` |
| SCEN-006 | Manual con psql + edit en Supabase | checklist en `scripts/faqs-README.md` |
| SCEN-007 | TypeScript typecheck | CI gate (`pnpm typecheck`) |
| SCEN-008 | grep guard | CI gate o pre-commit (`scripts/faqs-grep-guard.sh` opcional) |
| SCEN-009 | Vitest unit (logic) | `packages/logic/src/composables/__tests__/useData.test.ts` (extender) |
| SCEN-010 | Manual pre-merge | inspección del preview Vercel para las 3 marcas |

## Lo que NO está en holdout (deliberadamente)

- **FAQs por ciudad (`useCityFAQs.ts`)** — Ola 3 separada del Phase 4. Tiene su propio holdout futuro.
- **`tarifas.vue` y `gana/index.vue`** — definen FAQs locales propias en archivos UI; no consumen `faqs.config.ts`. Out of scope.
- **Admin UI para editar FAQs** — operador confirmó que las ediciones se hacen vía SQL/editor Supabase. No hay scenario que verifique flujo de admin.
- **Performance del query a Supabase** — 10 filas trivial; no vale el costo de un budget test.
- **i18n del contenido FAQ** — fuera de alcance, idéntico al spec de cities.
- **Validación de RLS policy** — operacional (checklist humano pre-merge), no observable como behavior runtime; cubierto al ejecutar el `CREATE POLICY` SQL.
- **Comportamiento de Google Search ante FAQPage con `mainEntity: []`** — fuera de alcance del repo. SCEN-003 cubre el invariante observable (build no rompe, HTML válido).
