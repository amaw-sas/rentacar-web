# Planning Summary: rentacar-data transient retry (#7, #16-F2)

**Date**: 2026-05-25
**Goal**: Que un fallo transitorio de la primera llamada en frío a `/api/rentacar-data` durante el prerender no aborte el deploy de las 3 marcas, sin romper el fail-loud ante un outage real.

## Artifacts Created
- `2026-05-25-rentacar-data-transient-retry-design.md` — diseño detallado (vía `/brainstorming`; aprobado + revisado por subagente, 2 iteraciones; incluye blast-radius verificado).
- `scenarios/rentacar-data-transient-retry.scenarios.md` — holdout SDD (SCEN-R1..R6 + matriz de no-regresión).
- `implementation/plan.md` — file structure + plan de 2 steps (revisado por subagente, aprobado).
- `summary.md` — este documento.

> Las fases de clarificación/research de sop-planning se completaron en `/brainstorming`; no se re-derivaron (el diseño estaba locked y revisado).

## Key Decisions
1. **Retry dentro de `fetchRentacarData`** (no en `$fetch` del plugin): ve tanto el `.error` transitorio como el throw de timeout, y es testeable de forma determinista con el seam existente.
2. **Clasificación solo-transitorios** (`isRetryableResult`): reintenta red/5xx/PG-conexión/desconocido; NO reintenta `PGRST*` (incl. PGRST116 de #59) ni 4xx. Groundeado en `@supabase/postgrest-js@2.101.1` (red/abort → `{ error:{code:''}, status:0 }`, no throw; `status` en el wrapper).
3. **Fail-loud preservado**: outage real agota 3 intentos → handler 500/504 → exit≠0 (SCEN-001 intacto, solo se retrasa).
4. **Alcance mínimo**: un solo archivo de producción + su test; sin tocar handler/plugin/nuxt.config. Caché swr/shared-storage queda como follow-up (#16-F2).
5. **PR nuevo aparte** de #59 (que sigue su curso); comparten error path pero son fixes distintos y complementarios.

## Complexity Estimate
- **Overall**: S–M (un archivo de producción + su test).
- **Duration**: ~2 h de implementación.
- **Risk Level**: Bajo (cambio aislado en `logic`, revert de un commit; sin migraciones ni infra).

## Recommended Next Steps
1. Implementar con SDD: Step 1 (clasificador + SCEN-R5) → Step 2 (retry + firma + migración de tests + SCEN-R1..R6).
2. `/verification-before-completion` con evidencia fresca antes de cualquier claim de done.
3. `/pull-request` (review + security + edge-case + performance) → PR nuevo (#7/#16-F2).
4. Validación end-to-end: observar deploy de preview verde (idealmente 2+ corridas, dado que el fallo era intermitente).

## Open Questions
- El trigger exacto de la primera llamada en frío (TLS/DNS/pool) quedó sin capturar (el prerender se tragó el error subyacente). El `console.warn` de diagnóstico que agrega este fix hará diagnosticable la próxima ocurrencia. Si reaparece seguido tras el merge → escalar al follow-up de caché swr/shared-storage (#16-F2).
