# Implementation Plan — one-way LLNRRE003 → mensaje claro

**Spec**: `docs/specs/2026-06-30-one-way-distance-message-design.md`
**Scenarios**: `docs/specs/2026-06-30-one-way-distance-message/scenarios/one-way-distance-message.scenarios.md` (SCEN-OW-01..05)
**Branch/worktree**: `fix/one-way-distance-message` @ `.worktrees/one-way-msg`
**Created**: 2026-06-30

> Diseño aprobado y spec-reviewed (enfoque B). Clarificación/research cubiertas en `/brainstorming`; este plan cubre solo decomposición + ejecución.

## File structure

Todo en `packages/logic` (Nuxt Layer → propaga a 3 marcas). Cero archivos de UI.

| Archivo | Acción | Responsabilidad única |
|---------|--------|------------------------|
| `src/utils/types/data/LocalizaErrorResponse.ts` | modify | Forma del error Localiza/sintetizado; +1 miembro `one_way_not_available` al union |
| `src/utils/helpers/classifyOneWayDistanceError.ts` | **new** | Función pura: detecta el caso one-way-sin-distancia (`shortText=LLNRRE003` + pickup≠return) y sintetiza el código semántico. Sin efectos, sin deps de store |
| `src/utils/helpers/classifyOneWayDistanceError.test.ts` | **new** | Unit del helper (colocado, junto a `extractStructuredError.test.ts`) |
| `src/composables/useFetchCategoriesAvailabilityData.ts` | modify | Wire del helper en el `catch` (+import); única integración con el contexto de búsqueda (pickup/return ya en scope) |
| `src/composables/useMessages.ts` | modify | `createErrorMessage`: +1 rama de copy para `one_way_not_available` |
| `src/composables/__tests__/useMessages.createErrorMessage.test.ts` | modify | Casos del nuevo código (copy exacto + no-fallback) |

Boundaries: la **detección** (helper puro) está separada de la **presentación** (createErrorMessage) y de la **integración** (composable). Cada unidad es testeable en aislamiento.

## Prerequisites

- Worktree ya creado desde `origin/main` fresco. Sin nuevas dependencias.
- `pnpm install` en el worktree antes de correr tests/dev (si aún no se hizo).

## Implementation Steps

### Step 1 — Foundation: código semántico + helper puro (con su unit) · Size: S · Deps: none

SDD: el helper es la unidad central y directamente testeable; sus tests encodean SCEN-OW-02, -03 y -05 (y la reclasificación de SCEN-OW-01 a nivel de dato).

- Añadir `| "one_way_not_available"` al union `error` de `LocalizaErrorResponse.ts`.
- Crear `classifyOneWayDistanceError(error, pickupLocation, returnLocation)`: si `error.shortText === 'LLNRRE003'` **y** `pickupLocation` **y** `returnLocation` **y** `pickupLocation !== returnLocation` → `{ ...error, error: 'one_way_not_available' }`; si no, retorna `error` sin cambio.
- Escribir `classifyOneWayDistanceError.test.ts` primero (rojo→verde).

**Scenario implícito**: dado un error LLNRRE003 de una búsqueda one-way → el sistema lo reclasifica a `one_way_not_available`; cualquier otro caso queda intacto.

**Acceptance**:
- `classifyOneWayDistanceError.test.ts` cubre: (a) LLNRRE003 + pickup≠return → `one_way_not_available`; (b) LLNRRE003 + pickup===return → sin cambio (SCEN-OW-02); (c) sin shortText / shortText distinto + pickup≠return → sin cambio (SCEN-OW-03); (d) error ya clasificado → idempotente; (e) un solo lugar null → sin cambio (SCEN-OW-05).
- `pnpm --filter @rentacar-main/logic test` verde.

### Step 2 — Integration: wire en el fetch composable · Size: S · Deps: Step 1

- En `useFetchCategoriesAvailabilityData.ts`, importar el helper (bloque de imports correspondiente) y envolver el `catch`: `error.value = classifyOneWayDistanceError(mapAvailabilityFetchError(e), lugarRecogida.value, lugarDevolucion.value)`.

**Scenario implícito**: dado el 500 LLNRRE003 capturado en una búsqueda one-way → `error.value.error` que recibe la store es `one_way_not_available`.

**Acceptance**:
- Los tests existentes del composable/store siguen verdes (sin regresión en `server_error`/`missing_parameters`/`no_available_categories_error`).
- Revisión de código: el `mapAvailabilityFetchError` sigue corriendo primero (preserva el downgrade de infra), el helper solo re-rotula encima.

### Step 3 — Presentation: rama de copy en createErrorMessage (con test) · Size: S · Deps: Step 1

SDD: extender `useMessages.createErrorMessage.test.ts` con el caso del nuevo código antes de añadir la rama.

- Añadir en `createErrorMessage`, antes del fallback `server_error || connection_timeout || unknown_error`:
  - título `Entrega en otra sede no disponible`
  - descripción `Por ahora no podemos cotizar la entrega en una sede distinta a la de recogida. Elige la misma sede para recoger y devolver, o escríbenos y te ayudamos.`

**Scenario implícito**: dado `createErrorMessage({error:'one_way_not_available', shortText:'LLNRRE003'})` → emite un toast color `error` con ese título/descripción y NO el genérico (SCEN-OW-01 copy).

**Acceptance**:
- Nuevos casos en `useMessages.createErrorMessage.test.ts`: (a) renderiza título/desc exactos; (b) NO cae en el título genérico `No pudimos completar la búsqueda`.
- `pnpm --filter @rentacar-main/logic test` verde.

### Step 4 — Runtime satisfaction de los scenarios de UI · Size: M · Deps: Steps 2,3

Verificación observable (no "test coverage" retroactivo): satisface SCEN-OW-01, -02, -04 en runtime. Es el gate de `/verification-before-completion`.

- Worktree dev server (copiar `.env.local`, puerto bumped; ver memoria de runtime validation). Stub del proxy `/api/reservations/availability` → 500 `{"error":"unknown_error","message":"...","shortText":"LLNRRE003"}` vía `page.route` (agent-browser network route no intercepta el POST — usar Playwright `page.route`).
- Ruta one-way (norte→aeropuerto): assert toast "Entrega en otra sede no disponible" + sin tarjetas `.categoria` + banner `¡Vehículos Disponibles!` ausente (SCEN-OW-01, -04).
- Ruta round-trip (norte→norte) mismo stub: assert toast genérico "No pudimos completar la búsqueda" (SCEN-OW-02).
- Zero console errors / zero failed requests (más allá del 500 stubbeado intencional).

**Acceptance**:
- Evidencia fresca (screenshot/DOM) de los 3 asserts.
- `ionice -c3 nice -n19 pnpm --filter ui-alquilatucarro typecheck` sin nuevos errores por el union ampliado (delta-vs-baseline, no "verde" absoluto).

## Testing Strategy

- **Unit (helper)**: `classifyOneWayDistanceError.test.ts` — tabla de decisión completa + bordes/idempotencia. Cubre SCEN-OW-02, -03, -05.
- **Unit (copy)**: `useMessages.createErrorMessage.test.ts` — SCEN-OW-01 (copy) + no-fallback.
- **Runtime (UI)**: Step 4 — SCEN-OW-01, -02, -04 observables en browser con stub.
- E2E Playwright formal: opcional, fuera de alcance de este plan (spec lo marca opcional).

## Rollout Plan

- Cambio aditivo y de bajo riesgo (nuevo código + nueva rama de copy; no toca paths existentes salvo el `catch` que solo re-rotula).
- Deploy estándar por marca (PR → merge → Vercel). Sin migraciones ni env nuevas.
- **Rollback**: revert del commit de implementación; el helper es la única superficie nueva, su ausencia restaura el toast genérico.
- **Monitoreo**: tras deploy, una búsqueda one-way ACBAN→AABAN en prod debe mostrar el nuevo toast (mientras #205 no resuelva la causa raíz upstream).

## Open Questions

- Ninguna bloqueante. Forward-compat: cuando el dashboard exponga un código semántico (`one_way_distance_not_registered`, ver #205), `classifyOneWayDistanceError` es el único punto a re-keyear (de `shortText` al código).
