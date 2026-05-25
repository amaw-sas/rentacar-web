# Implementation Plan: rentacar-data transient retry (#7, #16-F2)

**Date**: 2026-05-25
**Spec (detailed design)**: `docs/specs/2026-05-25-rentacar-data-transient-retry-design.md` (aprobado + revisado por subagente, 2 iteraciones)
**Scenarios (holdout)**: `docs/specs/2026-05-25-rentacar-data-transient-retry/scenarios/rentacar-data-transient-retry.scenarios.md`
**Branch / worktree**: `fix/rentacar-data-transient-retry` (off `origin/main`)

> Nota de proceso: las fases de clarificación/research/detailed-design de sop-planning se completaron en `/brainstorming` (el spec aprobado es el detailed-design). Este plan cubre Step 6.5 (file structure) + Step 7 (steps) + Step 7.5 (review loop).

## File Structure

Un solo archivo de producción + su test. El fix vive en `packages/logic` y se propaga a las 3 marcas vía el layer (`extends: ['@rentacar-main/logic']`). Cero cambios por marca, cero cambios en el handler/plugin.

| Archivo | Acción | Responsabilidad única |
|---|---|---|
| `packages/logic/server/utils/rentacarDataFetch.ts` | MODIFY | Fetch resiliente de rentacar-data: el batch de 6 queries (`runBatch`, extraído del cuerpo actual), la clasificación de errores recuperables (`isRetryableResult`), y el loop de retry acotado en `fetchRentacarData`. Helpers `sleep`/`logRetry` inline. |
| `packages/logic/server/utils/__tests__/rentacarDataFetch.test.ts` | MODIFY | Unit tests: migra los 3 call-sites de test existentes (la única llamada de producción, en el handler, no cambia) a `{ retries: 0 }`; agrega SCEN-R1..R6. |

**Decisión de decomposición**: el clasificador, el batch y el retry son una sola responsabilidad cohesiva ("traer rentacar-data de forma resiliente") y son chicos; co-locarlos en el archivo existente sigue el patrón del repo (utils chicos y enfocados) y evita fragmentar una unidad que cambia junta. `isRetryableResult` se **exporta** solo para testeo unitario directo (SCEN-R5). No se crean archivos nuevos.

**No se tocan** (fuera de alcance, confirmado en blast-radius del spec): `rentacar-data.get.ts` (handler), `plugins/rentacar-data.ts`, `nuxt.config.ts` (prerender/failOnError), caché swr/shared-storage.

## Prerequisites

- Ninguna dependencia nueva. `@supabase/supabase-js@^2.100.1` (postgrest-js 2.101.1) ya instalado.
- Trabajar dentro del worktree `fix/rentacar-data-transient-retry`.
- Vitest ya configurado (`packages/logic/vitest.config.ts`, `environment: node`).

## Steps

### Chunk 1: retry resiliente en fetchRentacarData

- [ ] **Step 1 — Clasificador `isRetryableResult(result)`** | Size: S | Dependencies: none
  - SDD: escribir primero SCEN-R5 (tabla `it.each`) en `rentacarDataFetch.test.ts` con los fixtures de shape real `{ error, status }` → falla (la función no existe) → implementar `isRetryableResult` exportada en `rentacarDataFetch.ts` → verde.
  - Reglas: `false` si `!result.error`, si `error.code` empieza con `'PGRST'`, o si `result.status` es 4xx; `true` en cualquier otro caso (red `code:''`/`status:0`, 5xx, códigos PG de conexión, desconocido).
  - **Scenario**: dado un resultado PostgREST, cuando se clasifica, entonces devuelve recuperable solo para errores no-PostgREST/no-4xx (SCEN-R5).
  - **Acceptance**:
    - `isRetryableResult` exportada; SCEN-R5 verde (9 casos: 5 `false`, 4 `true`).
    - `pnpm --filter @rentacar-main/logic exec vitest run rentacarDataFetch` pasa SCEN-R5.
    - Sin lectura de `error.status` (status solo del wrapper); cero referencias a campos inexistentes de `PostgrestError`.

- [ ] **Step 2 — Retry acotado + nueva firma + migración de tests** | Size: M | Dependencies: Step 1
  - SDD: escribir primero SCEN-R1/R2/R3/R4 (nuevos) + migrar SCEN-1/2/3 a `{ timeoutMs: 8000, retries: 0 }` (SCEN-R6) → fallan/rompen → implementar → verde.
  - Refactor: extraer el cuerpo actual (`Promise.all` de 6 queries + `AbortController` + chequeo `signal.aborted` → `RentacarDataTimeoutError`) a `runBatch(supabase, timeoutMs)` interno, sin cambio de comportamiento ni de la tupla/orden de 6 resultados (preserva #12 faqs).
  - Firma nueva: `fetchRentacarData(supabase, { timeoutMs = 8000, retries = 2, retryDelayMs = 300 }: FetchOptions = {})` — backward-compatible con el handler (`fetchRentacarData(supabase)` sigue válido).
  - Loop de retry (pseudocódigo en spec §Diseño): por intento `0..retries`, corre `runBatch`; si retorna y hay un `result.error` recuperable (`isRetryableResult`) → guarda `lastResults` y reintenta tras `sleep(retryDelayMs * 2**attempt)`; si lanza (timeout) → reintenta, y en el último intento re-lanza; si no hay error recuperable → retorna de inmediato. Al agotar con `.error` → retorna `lastResults` (handler hace 500).
  - Helpers inline: `sleep(ms)` y `logRetry(attempt, retries, err)` → `console.warn('[rentacar-data] transient fetch failure (attempt N/M), retrying…', err)`.
  - **Scenarios embebidos**:
    - blip que recupera en intento 2 → retorna ok, 2 corridas (SCEN-R1).
    - blip en todos los intentos → sin throw, retorna `.error`, 3 corridas → handler 500 (SCEN-R2, preserva SCEN-001).
    - PGRST116 → 1 corrida, sin reintento (SCEN-R3, preserva #59).
    - timeout en todos → `RentacarDataTimeoutError` → 504 (SCEN-R4, preserva #7/#53). Nota de test: con `retries: 2` el loop arma un `setTimeout(timeoutMs)` por intento → avanzar fake timers **por intento** (3×); `retryDelayMs: 0` evita tener que avanzar el backoff.
    - tests existentes migrados verdes, sin cuelgue (SCEN-R6).
  - **Acceptance**:
    - Los 3 call-sites existentes usan `{ timeoutMs: 8000, retries: 0 }`; toda la suite `rentacarDataFetch` verde (SCEN-1/2/3 migrados + R1..R6), 0 skipped, 2 corridas estables.
    - El handler `rentacar-data.get.ts` NO se modifica; `pnpm --filter ui-* typecheck` sin nuevos errores que referencien `rentacarDataFetch` (delta-vs-baseline; baseline rojo conocido).
    - Diff de producción acotado a `rentacarDataFetch.ts`.

## Testing Strategy

- **Unit** (autoritativo): `rentacarDataFetch.test.ts` cubre SCEN-R1..R6 con un mock de supabase que cuenta corridas del batch y simula `.error` de red (`code:''`, `status:0`), PGRST116, y abort/timeout (fake timers). Comando: `pnpm --filter @rentacar-main/logic exec vitest run rentacarDataFetch`.
- **Regresión de suite logic**: `pnpm --filter @rentacar-main/logic exec vitest run` — confirmar que nada más se rompe (el plugin test y transformers no dependen de la firma).
- **SCEN-001 (manual, no automatizable aquí)**: `pnpm build:alquilatucarro` con `NUXT_SUPABASE_URL` inválido → exit≠0 con `[rentacar-data] Failed to load` (comportamiento sin cambio respecto a hoy; solo se retrasa ~unos segundos por los reintentos).
- **Cobertura honesta**: ningún unit ejercita el prerender real de Vercel; el gate end-to-end es observar un deploy de preview verde tras el merge.

## Rollout Plan

- **Deploy**: push de la rama `fix/rentacar-data-transient-retry` → PR nuevo (#7/#16-F2). El deploy de preview de Vercel es en sí la validación end-to-end del fix (debe pasar de forma estable; idealmente confirmar con 2+ deploys o redeploys dado que el fallo era intermitente).
- **Monitoreo**: buscar `[rentacar-data] transient fetch failure` en los logs de build/runtime — si aparece seguido, indica un problema de conexión más persistente que merece el follow-up de caché (swr/shared-storage, #16-F2).
- **Rollback**: el cambio es un solo archivo en `logic`; revert del commit restaura el comportamiento anterior. Sin migraciones ni cambios de infra. Riesgo bajo.
- **Gate pre-PR**: `/verification-before-completion` con evidencia fresca (suite verde + typecheck delta) antes de cualquier claim de "done".
