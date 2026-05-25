---
name: rentacar-data-transient-retry
created_by: brainstorming + sop-planning
created_at: 2026-05-25T00:00:00Z
spec: docs/specs/2026-05-25-rentacar-data-transient-retry-design.md
plan: docs/specs/2026-05-25-rentacar-data-transient-retry/implementation/plan.md
issues: ["#7", "#16"]
---

Holdout para el retry acotado de `fetchRentacarData` ante fallo transitorio en build-time (causa raíz verificada: la primera llamada en frío a `/api/rentacar-data` durante el prerender de `/` falla, y el plugin fail-loud aborta el deploy). Todos los scenarios son unit sobre la util `fetchRentacarData` / `isRetryableResult`; el mock de supabase cuenta cuántas veces corre el batch. Behavior groundeado en `@supabase/postgrest-js@2.101.1` (red/abort → resultado resuelto `{ error: { code: '' }, status: 0 }`, no throw; `status` en el wrapper, no en `.error`).

## SCEN-R1: blip transitorio en el intento 1 se recupera en el intento 2 (reproduce el bug del deploy)

**Given**: un `supabase` cuyo batch devuelve un `result.error` con `code: ''`, `status: 0` (forma de error de red) en el intento 1, y resultados válidos (`error: null`) en el intento 2.
**When**: se invoca `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
**Then**: retorna la tupla de 6 resultados exitosa; NO lanza; el batch (consulta a supabase) corrió exactamente 2 veces.
**Evidence**: valor de retorno aserteado sin `.error`; contador de invocaciones del mock `from()` por tabla → 2 corridas del batch.

## SCEN-R2: blip transitorio en TODOS los intentos → fail-loud preservado, sin throw

**Given**: un `supabase` cuyo batch devuelve `result.error` con `code: ''`, `status: 0` en cada intento.
**When**: se invoca `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
**Then**: NO lanza; retorna la tupla con `.error` poblado tras exactamente 3 corridas (`retries + 1`); el handler la traducirá a 500 (preserva SCEN-001).
**Evidence**: `await expect(...).resolves` (no `rejects`); `results.some(r => r.error)` === true; contador de corridas = 3.

## SCEN-R3: error de datos (PGRST116) NO se reintenta

**Given**: un `supabase` cuyo batch devuelve un `result.error` con `code: 'PGRST116'`, `status: 406` (fila ausente, el caso de #59).
**When**: se invoca `fetchRentacarData(supabase, { retries: 2, retryDelayMs: 0 })`.
**Then**: NO reintenta — el batch corre exactamente 1 vez; retorna inmediato con el `.error` intacto.
**Evidence**: contador de corridas = 1; `isRetryableResult({ error: { code: 'PGRST116' }, status: 406 })` === `false`.

## SCEN-R4: timeout en todos los intentos sigue lanzando → 504

**Given**: un `supabase` cuyo batch excede `timeoutMs` (abort vía AbortController) en todos los intentos.
**When**: se invoca `fetchRentacarData(supabase, { timeoutMs: 10, retries: 2, retryDelayMs: 0 })` con timers avanzados.
**Then**: lanza `RentacarDataTimeoutError` tras agotar intentos; el handler lo mapea a 504 (preserva #7/#53).
**Evidence**: `await expect(...).rejects.toBeInstanceOf(RentacarDataTimeoutError)`.

## SCEN-R5: `isRetryableResult` clasifica correctamente (tabla)

**Given/When/Then**: con fixtures que llevan el shape real `{ error, status }` (NO `code`/`status` top-level), `isRetryableResult` retorna:
- `false` para: `{ error: null }`; `{ error: { code: 'PGRST116' }, status: 406 }`; `{ error: { code: 'PGRST301' }, status: 401 }`; `{ error: { message: 'forbidden' }, status: 401 }`; `{ error: { message: 'not found' }, status: 404 }`.
- `true` para: `{ error: { code: '' }, status: 0 }` (red); `{ error: { message: 'unavailable' }, status: 503 }`; `{ error: { code: '57P03' }, status: 503 }` (PG conexión); `{ error: { message: 'x' } }` (desconocido, sin status).
**Evidence**: tabla `it.each` aserteada campo por campo.

## SCEN-R6: tests existentes migrados siguen verdes (regresión)

**Given**: los tests SCEN-1/2/3 de `rentacarDataFetch.test.ts` reescritos a `fetchRentacarData(supabase, { timeoutMs: 8000, retries: 0 })`.
**When**: corre la suite.
**Then**: verde, con la misma semántica de 1-corrida que antes (happy path, timeout→throw, `.error` passthrough); ningún cuelgue bajo fake timers.
**Evidence**: `pnpm --filter @rentacar-main/logic exec vitest run rentacarDataFetch` → todos pasan.

---

## Matriz de no-regresión (contratos existentes que el fix debe preservar)

| Contrato | Preservado porque |
|---|---|
| SCEN-001 (build aborta ante outage real) | outage → agota 3 intentos → handler 500/504 → plugin re-throw → exit≠0 (solo se retrasa ~unos segundos) |
| SCEN-002 (plugin re-throw + cause chain) | el plugin y el handler no se tocan |
| SCEN-007 (transformExtras null sin coercion) | `transformExtras` y el handler no se tocan |
| #7/#53 (timeout → 504) | `RentacarDataTimeoutError` sigue propagándose tras agotar (SCEN-R4) |
| #12 (query faqs, 6ª) | las 6 queries quedan intactas dentro de `runBatch`, misma tupla |
| #16-F1 / #59 (PGRST116 → degrade) | PGRST116 clasificado no-recuperable → 1 corrida, sin latencia extra (SCEN-R3) |

## Cobertura honesta

SCEN-R1 reproduce el mecanismo (transitorio→recupera) a nivel unit, NO el prerender real de Vercel — mismo caveat que el e2e de #59. Es el gate autoritativo del fix. La validación end-to-end real es observar un deploy de preview que pase tras el merge (verificación manual post-merge, no automatizable aquí).
