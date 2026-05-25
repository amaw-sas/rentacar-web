---
name: rentacar-data-transient-retry
created_by: brainstorming
created_at: 2026-05-25T00:00:00Z
issues: ["#7", "#16"]
scope: "Finding 2 de #16 (resiliencia ante fallo transitorio en build-time) + concern de hardening de #7. NO incluye swr/shared-storage cache."
status: draft
---

# Retry acotado de `rentacar-data` ante fallo transitorio en build-time

## Causa raíz (verificada)

Los deploys de preview/producción fallan de forma intermitente. El build llega al **prerender de Nitro**, que renderiza `/` + 23 rutas de ciudad listadas en `prerender.routes` de cada marca. Cada página corre el plugin `rentacar-data`, que hace `$fetch('/api/rentacar-data')` → 6 queries paralelas a Supabase.

Evidencia del log de build (deploy `dpl_CsKHk…`, commit `037c189`):

```
[nitro] Prerendering 25 routes
  ├─ / (1745ms)
  │ └── [500] Server Error      ← única ruta con 500
  ├─ /armenia (1495ms)          ← 200
  ├─ /barranquilla (1484ms)     ← 200
  ... (23 rutas más, todas 200)
```

**Solo falla `/`** — la primera ruta, que dispara la primera llamada en frío a `/api/rentacar-data`. Las otras 24, con el mismo plugin y el mismo Supabase, renderizan bien. Un blip de red aleatorio pegaría en una ruta cualquiera; pegar siempre en la primera apunta a un fallo de arranque en frío (warmup de conexión/DNS/TLS, o pool frío de Supabase).

Como el plugin `rentacar-data.ts` es **fail-loud** (re-lanza ante cualquier error de fetch, por diseño de #2) y `/` es una ruta explícita de `prerender.routes`, Nitro trata ese 500 como fatal → "Exiting due to prerender errors" → deployment ERROR.

Hechos que confirman que es transitorio y estructural, no un bug de un PR:
- No-determinista: el mismo commit `c617e4b` quedó ERROR y un redeploy quedó READY.
- Afecta a `main` en producción (`59866e1` = ERROR), no solo a ramas de feature.
- El PR #60 amplió la ventana de retry del prerender (3→5, 500ms→3000ms) y **igual** quedó ERROR.

El `error.value` subyacente no quedó capturado: el prerenderer se tragó el `console.error` del plugin. Tenemos el qué y el dónde con certeza; el porqué exacto de la primera llamada no.

## Cómo se manifiesta un fallo de red (verificado en el código de la dependencia)

Decisión de diseño clave, verificada contra `@supabase/postgrest-js@2.101.1` (`src/PostgrestBuilder.ts`), no contra memoria:

- Nuestras queries NO usan `.throwOnError()`, así que `shouldThrowOnError === false`. En ese modo, el bloque `res.catch((fetchError) => …)` **convierte cualquier fallo de fetch (red, DNS, ECONNREFUSED) Y `AbortError`** en un resultado RESUELTO (no lanzado):
  ```
  { error: { message: 'FetchError: …', details, hint, code: '' }, data: null, count: null, status: 0, statusText: '' }
  ```
- O sea: **un blip de red vuelve como `result.error` con `code: ''` y `result.status: 0`** — NO como excepción. Un retry que solo capture throws se lo perdería. Por eso el retry vive donde ve los resultados completos.
- `PostgrestError` expone `message`, `details`, `hint`, `code` — **no tiene `status`**. El `status` HTTP vive en el wrapper del resultado (`{ error, data, count, status, statusText }`). Cualquier clasificación por status debe leer `result.status`, no `result.error.status`.
- Una fila ausente vía `.single()` vuelve como `{ error: { code: 'PGRST116', … }, status: 406 }`.
- El timeout (cuando dispara nuestro `AbortController`) lo detecta el chequeo `if (signal.aborted)` y se traduce a `RentacarDataTimeoutError` lanzado — ese SÍ es el path de throw.

## Objetivo

Que un fallo transitorio de una sola llamada en frío durante el build **se recupere solo**, en lugar de abortar el deploy de las 3 marcas.

## No-objetivos (fuera de alcance, a propósito)

- **Caché swr / shared-storage** (el otro ángulo de #16 Finding 2). Reduciría el número de llamadas en frío, pero el retry recupera el blip directamente y es suficiente. Queda como follow-up.
- **`failOnError: false` en prerender.** Violaría SCEN-001 (que exige abortar el build ante outage real).
- Cambios en `prerender.routes`, el plugin fail-loud, o el handler.
- Cualquier cambio de comportamiento en runtime más allá del efecto colateral benigno del retry (ver Riesgos).

## Enfoque elegido

**Retry acotado dentro de `fetchRentacarData`** (la util en `packages/logic`, que se propaga a las 3 marcas vía el layer).

Descartado: retry en `$fetch` del plugin (`retryStatusCodes` de ofetch). Más simple pero (a) no distingue PGRST116 de un 5xx transitorio con la misma finura, (b) afecta runtime de forma menos controlada, (c) es más difícil escribir un test propio que reproduzca "falla-y-recupera" — el seam de test ya existe en `fetchRentacarData`.

## Diseño

### Único archivo de producción

`packages/logic/server/utils/rentacarDataFetch.ts`:

1. **Extraer** el cuerpo actual (`Promise.all` + `AbortController` + el chequeo `signal.aborted` → `RentacarDataTimeoutError`) a un `runBatch(supabase, timeoutMs)` interno. Contrato sin cambio: retorna la tupla de 6 resultados (cada uno `{ data, error, status, … }`) en orden fijo; lanza `RentacarDataTimeoutError` ante abort/timeout.

2. **Envolver** `runBatch` en un loop de retry acotado. Firma nueva con options object:

   ```ts
   const DEFAULT_TIMEOUT_MS = 8000
   const DEFAULT_RETRIES = 2
   const DEFAULT_RETRY_DELAY_MS = 300

   interface FetchOptions {
     timeoutMs?: number
     retries?: number
     retryDelayMs?: number
   }

   export async function fetchRentacarData(
     supabase: SupabaseClient,
     { timeoutMs = DEFAULT_TIMEOUT_MS,
       retries = DEFAULT_RETRIES,
       retryDelayMs = DEFAULT_RETRY_DELAY_MS }: FetchOptions = {},
   )
   ```

   Lógica (pseudocódigo) — refinada tras Quality Integration (ver §Refinamiento):

   ```
   lastResults = undefined
   for attempt in 0..retries:                       # retries=2 → attempts 0,1,2
     results = await runBatch(supabase, timeoutMs)  # un timeout LANZA aquí, sin reintentar → 504
     errored = results.filter(r => r.error)
     shouldRetry = errored.length > 0 AND errored.every(isRetryableResult)
     if not shouldRetry OR attempt == retries: return results
     lastResults = results
     logRetry(attempt, retries, errored[0].error)
     await sleep(retryDelayMs * 2**attempt)         # backoff 300ms, 600ms
   return lastResults                                # inalcanzable salvo retries<0; el `as` satisface TS
   ```

   Trazas (verificadas por SCEN-R1..R7):
   - **éxito en intento 0** → `return results`.
   - **transitorio que recupera** (intento 0 `.error`, intento 1 ok) → reintenta, luego `return results`. (R1)
   - **transitorio que agota** (3× `.error`) → en el último intento `attempt == retries` → `return results` (con `.error`) → handler 500. (R2)
   - **`.error` NO-recuperable solo** (PGRST116) → `shouldRetry` false → `return results` en 1 corrida. (R3)
   - **timeout** → `runBatch` lanza `RentacarDataTimeoutError` → propaga inmediato, 1 corrida → handler 504. (R4)
   - **permanente + transitorio mezclados** → `every(isRetryableResult)` false → `return results` en 1 corrida → handler 500. (R7)

3. **Clasificador** `isRetryableResult(result)` (exportado para test unitario). Recibe el resultado COMPLETO (no solo `.error`), porque el `status` vive en el wrapper:

   ```ts
   export function isRetryableResult(result: { error: unknown; status?: number }): boolean {
     if (!result?.error) return false
     const code = (result.error as { code?: unknown }).code
     // NO-recuperable: errores PostgREST de datos/schema/auth (PGRST*) → reintentar no los arregla.
     if (typeof code === 'string' && code.startsWith('PGRST')) return false
     // NO-recuperable: HTTP 4xx (status en el wrapper, no en .error).
     if (typeof result.status === 'number' && result.status >= 400 && result.status < 500) return false
     // Recuperable: red (status 0, code ''), 5xx, códigos PG transitorios (53300/57P03/08006…), y lo desconocido.
     return true
   }
   ```

   Grounded en `@supabase/postgrest-js@2.101.1`:
   - Red/conexión/abort → `code: ''`, `status: 0` → recuperable. ✓ (es el blip que buscamos)
   - PGRST116 (fila ausente, lo cubre #59) y PGRST1xx/3xx (parse/schema/JWT) → `code` PGRST* → NO-recuperable. ✓
   - 5xx de PostgREST y códigos PG de conexión (no-PGRST) → recuperable. ✓
   - 4xx con código no-PGRST (raro en este path de solo-lectura con anon key) → `status` 4xx → NO-recuperable. ✓
   - **Default ante lo desconocido = recuperable.** Si es persistente, igual falla al agotar (SCEN-001 se preserva, solo se retrasa); si es el blip, lo atrapa. Costo del falso positivo: ~1s de backoff en un error que de todos modos iba a fallar.

4. **Helpers inline** en el mismo archivo: `sleep(ms)` (Promise + setTimeout) y `logRetry(attempt, retries, err)` → `console.warn('[rentacar-data] transient fetch failure (attempt N/M), retrying…', err)`. El `console.warn` ataca el punto ciego actual (el error subyacente se perdió en el log del prerender). Best-effort: si el prerender lo traga, no empeora nada; en runtime sí queda registro.

### Cotas y presupuesto de tiempo

- `retries = 2` (3 intentos), backoff exponencial `300ms, 600ms`.
- Blip que recupera en el intento 2: +~300ms al build. Despreciable.
- Outage real:
  - si falla rápido (`.error` de red, el caso del bug): 3 intentos + ~0.9s de backoff → falla fuerte.
  - si es por **timeout**: NO se reintenta → falla en ~8s (1 intento), preservando el bound de #7 (ver §Refinamiento).
- Parámetros configurables vía `FetchOptions` para tests deterministas (`retryDelayMs: 0`, `retries: 0`).

### Migración de los tests existentes (REQUERIDA, no opcional)

El test actual llama `fetchRentacarData(supabase, 8000)` con `timeoutMs` **posicional** en 3 sitios (SCEN-1/2/3). La firma nueva hace que el arg 2 sea un objeto; `8000` posicional ya no significa nada. Además, con `DEFAULT_RETRIES = 2`, SCEN-2 (timeout) y SCEN-3 (`.error` transitorio sin `code`) **se romperían/colgarían** bajo fake timers porque introducirían reintentos + `sleep` no avanzados.

Migración explícita:
- Reescribir los 3 sitios a `fetchRentacarData(supabase, { timeoutMs: 8000, retries: 0 })`.
- `retries: 0` preserva la semántica original de esos tests (una sola corrida de `runBatch`): SCEN-1 happy path, SCEN-2 timeout→throw en 1 intento, SCEN-3 `.error` passthrough en 1 corrida. Quedan como tests del comportamiento de `runBatch`, sin reintento.
- El comportamiento de retry se cubre en escenarios nuevos (SCEN-R1..R4), no tocando los viejos.

### Propagación

El cambio vive solo en `packages/logic/server/utils/`. Las 3 marcas lo heredan vía `extends: ['@rentacar-main/logic']`. Cero cambios por marca.

## Preservación del contrato existente

| Contrato | Cómo se preserva |
|---|---|
| **SCEN-001** (build aborta ante outage real) | Outage → los 3 intentos fallan → handler lanza 5xx (500 vía `.error`, o 504 vía timeout) → plugin re-throw → exit≠0 con `[rentacar-data] Failed to load`. Solo se retrasa ~unos segundos. |
| **SCEN-002** (plugin re-throw + cause chain) | El plugin y el handler no se tocan. |
| **#59 / PGRST116** (fila localiza ausente) | `code: 'PGRST116'` → NO-recuperable → 1 corrida, sin reintento ni enmascaramiento; handler/#59 lo manejan como hoy. |
| **#7 / #53** (timeout → 504) | `RentacarDataTimeoutError` sigue propagándose tras agotar intentos → handler 504. |

## Blast radius y regresiones (verificado)

Superficie total de `rentacarDataFetch.ts` en todo el repo (sin `node_modules`/`.nuxt`):

| Consumidor | Uso | Impacto del cambio |
|---|---|---|
| `server/api/rentacar-data.get.ts` (único de producción) | `fetchRentacarData(supabase)` sin 2º arg + `instanceof RentacarDataTimeoutError` | **Seguro.** La firma nueva es backward-compatible (opciones con default). El `.catch` sigue funcionando: el retry solo lanza `RentacarDataTimeoutError` (timeout agotado) o retorna la tupla (con `.error` → el handler hace 500). No introduce tipos de throw nuevos. |
| `__tests__/rentacarDataFetch.test.ts` | 3× `fetchRentacarData(supabase, 8000)` posicional | **Rompe — esperado.** Es la migración requerida (a `{ timeoutMs: 8000, retries: 0 }`); SCEN-R6 lo blinda. |
| e2e, otras marcas, otros paquetes | ninguna referencia | Sin impacto. |

Issues que implementaron este archivo y cómo se preservan:

| Issue | Qué aportó | Preservación |
|---|---|---|
| **#7 / #53** (`dde5f51`) | creó `fetchRentacarData` + `RentacarDataTimeoutError` + timeout 8s/AbortController | `runBatch` conserva el timeout; `RentacarDataTimeoutError` sigue propagándose → 504 (SCEN-R4). |
| **#12** (`6dd6808`) | agregó la query `faqs` (6ª query) | Las 6 queries quedan intactas dentro de `runBatch`, mismo orden y tupla. |
| **#2 / #3 / #4** (bundled resilience) | plugin fail-loud, sentinel, `transformExtras` | Plugin/handler/transformers no se tocan; SCEN-001/002/007 intactos. |

Interacción con PRs abiertos/cerrados:

- **PR #59** (#16-F1, OPEN): NO toca este archivo — modifica el handler y su test **mockea el módulo entero** (`vi.mock('../../utils/rentacarDataFetch')`). Cero overlap de archivos → cero conflicto de merge; su test no ejercita mi retry, mi cambio no rompe su test. **Sinergia:** PGRST116 (fila ausente) → mi clasificador lo marca no-recuperable → 1 corrida → el handler de #59 degrada a `extras: undefined` sin que el retry agregue latencia.
- **PR #60** (`fix/prerender-retry-resilience`, CLOSED, no mergeado): solo tocó los 3 `nuxt.config.ts` + un test de config. No toca este archivo ni se mergeó. Sin interacción.

## Escenarios observables (puente a SDD)

Todos a nivel **unit sobre la util** (`fetchRentacarData` / `isRetryableResult`); la traducción a 5xx ocurre en el handler y se asume por contrato (sin cambio). El mock de supabase cuenta cuántas veces corre el batch.

- **SCEN-R1** (unit) — *reproduce el bug del deploy*
  **Given** un `supabase` cuyo batch devuelve un `result.error` con `code: ''`, `status: 0` (forma de error de red) en el intento 1, y resultados ok en el intento 2.
  **When** `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
  **Then** retorna la tupla exitosa, sin throw; el batch corrió exactamente 2 veces.
  **Evidence**: valor de retorno; contador de invocaciones del mock = 2.

- **SCEN-R2** (unit) — *fail-loud preservado, sin throw*
  **Given** un `supabase` cuyo batch devuelve `result.error` con `code: ''`, `status: 0` en TODOS los intentos.
  **When** `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
  **Then** NO lanza; retorna resultados con `.error` poblado tras exactamente 3 corridas (el handler los traducirá a 500).
  **Evidence**: contador = 3; el retorno tiene `results[i].error` no-nulo; `await expect(...).resolves` (no rejects).

- **SCEN-R3** (unit) — *no reintentar errores de datos*
  **Given** un `supabase` cuyo batch devuelve `result.error` con `code: 'PGRST116'`, `status: 406`.
  **When** `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
  **Then** NO reintenta: el batch corre exactamente 1 vez; retorna inmediato con el `.error` intacto.
  **Evidence**: contador = 1; `isRetryableResult({ error: { code: 'PGRST116' }, status: 406 })` === `false`.

- **SCEN-R4** (unit) — *timeout lanza inmediato, NO reintentado → 504* (refinado tras Quality Integration)
  **Given** un `supabase` cuyo batch excede `timeoutMs` (abort).
  **When** `fetchRentacarData(supabase, { timeoutMs: 5, retries: 2, retryDelayMs: 0 })`.
  **Then** lanza `RentacarDataTimeoutError` en el primer intento, sin reintentar; 1 corrida; el handler lo mapea a 504.
  **Evidence**: `await expect(...).rejects.toBeInstanceOf(RentacarDataTimeoutError)`; contador = 1.

- **SCEN-R7** (unit) — *permanente mezclado con transitorio NO se reintenta* (añadido tras Quality Integration)
  **Given** un batch con un `.error` permanente (`code: 'PGRST205'`, `status: 404`) en una tabla y uno transitorio (`code: ''`, `status: 0`) en otra.
  **When** `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
  **Then** NO reintenta (reintentar no arregla el permanente); 1 corrida; retorna con `.error` → handler 500.
  **Evidence**: contador = 1; `results.some(r => r.error)` === true.

- **SCEN-R5** (clasificador, tabla) — *fixtures con el shape real del resultado* `{ error, status }`, NO con `code`/`status` top-level (si no hay `.error`, el early-return lo daría `false` por el motivo equivocado y no ejercitaría la rama PGRST/4xx).
  **Given/When/Then** `isRetryableResult` retorna:
  - `false` para: `{ error: null }`; `{ error: { code: 'PGRST116' }, status: 406 }`; `{ error: { code: 'PGRST301' }, status: 401 }`; `{ error: { message: 'forbidden' }, status: 401 }`; `{ error: { message: 'not found' }, status: 404 }`.
  - `true` para: `{ error: { code: '' }, status: 0 }` (red); `{ error: { message: 'unavailable' }, status: 503 }`; `{ error: { code: '57P03' }, status: 503 }` (PG conexión); `{ error: { message: 'x' } }` (desconocido, sin status).
  **Evidence**: tabla `it.each` aserteada.

- **SCEN-R6** (regresión) — *tests existentes migrados siguen verdes*
  **Given** SCEN-1/2/3 de `rentacarDataFetch.test.ts` reescritos a `{ …, retries: 0 }`.
  **When** corre la suite.
  **Then** verde, con la misma semántica de 1-corrida que antes.
  **Evidence**: `pnpm --filter @rentacar-main/logic exec vitest run rentacarDataFetch` verde.

**Honestidad de cobertura:** SCEN-R1 reproduce el mecanismo (transitorio→recupera) a nivel unit, no el prerender real de Vercel — mismo caveat que el e2e de #59. Es el gate autoritativo del fix. La validación end-to-end real es observar un deploy de preview que pase tras el merge.

## Plan de test

| Escenario | Layer | Archivo | Comando de evidencia |
|---|---|---|---|
| SCEN-R1..R7 | Vitest unit | `packages/logic/server/utils/__tests__/rentacarDataFetch.test.ts` (extender) | `pnpm --filter @rentacar-main/logic exec vitest run rentacarDataFetch` (resuelve `packages/logic/vitest.config.ts`; mismo patrón que el PR #59) |
| SCEN-001 (manual) | build | — | `pnpm build:alquilatucarro` con `NUXT_SUPABASE_URL` inválido → exit≠0 (sin cambio respecto a hoy) |

## Refinamiento post Quality Integration

Tras los agentes de calidad (code-reviewer aprobó sin Critical/Important), se adoptaron 2 mejoras MEDIUM, ambas alineadas con "retry solo transitorio":

1. **Timeouts NO se reintentan.** El bug real falla rápido (`/` cayó a 1745ms, muy por debajo de los 8s), así que se manifiesta como `.error` de red, no como timeout. Reintentar un timeout no aporta y multiplicaría la cola a ~27s en runtime, erosionando el bound de 8s que añadió #7. Ahora `RentacarDataTimeoutError` propaga inmediato → 504. (amend de SCEN-R4)
2. **Bail ante error permanente mezclado.** Solo se reintenta si TODO error en el batch es transitorio (`errored.every(isRetryableResult)`); si hay un permanente (PGRST*/4xx) junto a un transitorio, retornar de inmediato — reintentar no lo arregla y solo demora el fallo fuerte. (nuevo SCEN-R7)

Además se colapsó la duplicación de `sleep`/`logRetry` en un único sitio (sugerencia del code-simplifier).

## Riesgos

- **Falso positivo del clasificador** (reintentar un error persistente desconocido `code:''`+`status:0`-like): cuesta ~0.9s de backoff y luego falla igual. No enmascara — SCEN-001 intacto. Acotado por el bail de error-permanente-mezclado.
- **El `console.warn` puede ser tragado por el prerender** igual que hoy. Best-effort, no regresión.
- **Tiempo de build en outage real**: +~0.9s (caso `.error` de red, 3 intentos) o sin cambio (~8s, caso timeout no-reintentado). Solo en el caso ya-roto.
