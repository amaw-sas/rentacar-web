# Planning Summary — Searcher Calendar Autoclose

**Date:** 2026-05-06
**Goal:** Cerrar automáticamente los popovers de fecha (recogida y devolución) en `Searcher.vue` cuando el usuario selecciona un día en el calendario desktop. Móvil ya funciona vía input nativo.

## Artifacts created

- `docs/specs/2026-05-06-searcher-calendar-autoclose-design.md` (commits `0088e28`, `6203317`) — spec aprobado tras 2 iteraciones de reviewer
- `docs/specs/2026-05-06-searcher-calendar-autoclose/scenarios/searcher-calendar-autoclose.scenarios.md` (commit `df3f819`) — holdout SDD con 7 escenarios (SCEN-001..005 + R1/R2 sanity)
- `docs/specs/2026-05-06-searcher-calendar-autoclose/implementation/plan.md` — plan de 5 steps tras 2 iteraciones de reviewer
- `docs/specs/2026-05-06-searcher-calendar-autoclose/summary.md` — este documento
- Issue [#25](https://github.com/amaw-sas/rentacar-web/issues/25) — bug bfcache widgets bloqueados (R3, fuera de alcance)

Artefactos de brainstorming/research/idea-honing **NO** se duplicaron — el spec aprobado consolida toda esa información (decisión, alternativas, riesgos, scope).

## Key decisions

1. **Approach: `@update:model-value` event en `<u-calendar>`** — descarta watcher sobre el ref del store (R1: dispara ante mutaciones programáticas como el watcher +7 días) y eventos no contractuales (`@day-select`).
2. **Sin encadenamiento de popovers** — al seleccionar recogida, el popover de devolución NO se abre automáticamente. El watcher existente (`useSearch.ts:151-153`) llena la fecha de devolución +7 días; eso es suficiente.
3. **Sin componente compartido `DatePickerField`** — YAGNI explícito. Cambio mecánico de 2 líneas × 3 archivos no justifica abstracción.
4. **R3 (bfcache) tracked aparte** — issue #25. Este spec NO lo aborda; sólo el handler `pageshow` existente ya tenía intención de mitigarlo y persiste el bug.
5. **TDD con e2e (red→green)** — Step 1 escribe el test que falla; Step 2 lo hace pasar. Sin tests nuevos en logic (el cambio es puramente template).
6. **Step 0 selector spike** — antes de escribir tests, descubrir DOM real de Reka UI calendar para evitar selectores ciegos. Fallback: agregar `data-testid` (autorizado en spec).

## Complexity estimate

- **Overall:** S/M (cambio aislado, holdout claro, e2e infra existente)
- **Duration:** 3-4 horas trabajo activo (5 steps: S+M+S+S+S)
- **Risk level:** Bajo. Bloqueante potencial si Plan B de R1/R2 reproduce (~30 min adicional).

## Recommended next steps

1. Invocar `/scenario-driven-development` para ejecutar Step 0 (selector spike) con el holdout vivo.
2. Avanzar Steps 1-3 (TDD red, fix alquilatucarro, mirror) bajo SDD.
3. Step 4: `/dogfood` + `/verification-before-completion` + `/pull-request`.
4. Tras merge: trabajar issue #25 (bfcache) por separado — no bloquea este fix.

## Open questions

- **Plan B necesario para R1/R2?** — Plan A asume Nuxt UI v4 emite `update:model-value` sólo en cambio. Plan B (gate `userInteracted`) listo si Step 2 runtime sorprende. Resuelto en runtime, no antes.
- **Selectores Reka UI estables?** — pendiente de Step 0. Si no, agregar `data-testid` (decisión consciente, no fragilidad).

## Status

| Etapa | Estado |
|---|---|
| Brainstorming | ✅ aprobado |
| Spec + reviewer loop | ✅ aprobado (iter 2) |
| Holdout extraction | ✅ commit `df3f819` |
| Implementation plan + reviewer loop | ✅ aprobado (iter 2) |
| Implementation execution | ⏳ pendiente — Step 0 |
