# Searcher: Cierre automático del calendario al seleccionar fecha

**Date:** 2026-05-06
**Status:** Approved
**Scope:** UI fix — desktop only (móvil usa input nativo)

## Problem

En el formulario de búsqueda de disponibilidad (`Searcher.vue`), los popovers de fecha de recogida y fecha de devolución se abren al hacer click en el `<u-input-date>`, pero **no se cierran** cuando el usuario selecciona una fecha en el `<u-calendar>` interno. El popover sólo se cierra si el usuario hace click fuera. UX incorrecta: una selección concreta debería confirmar y cerrar.

## Root cause

`packages/ui-{brand}/app/components/Searcher.vue` (idéntico en las 3 marcas):

- Desktop pickup popover: líneas 132-160 (popover) dentro del bloque desktop 119-164.
- Desktop return popover: líneas 196-225 (popover) dentro del bloque desktop 182-229.

```vue
<u-popover v-model:open="pickupDateCalendarOpen">
  ...
  <template #content>
    <u-calendar v-model="selectedPickupDate" ... />
  </template>
</u-popover>
```

`<u-popover>` se abre con `@click="pickupDateCalendarOpen = true"` en el `<u-input-date>`, pero ningún handler escucha el evento de selección de `<u-calendar>` para revertir `pickupDateCalendarOpen` a `false`. Misma estructura con `returnDateCalendarOpen`.

Móvil (`<input type="date">` nativo en líneas 103-117 para recogida y 165-180 para devolución) cierra automáticamente vía SO — fuera de alcance.

## Decision

Agregar el handler `@update:model-value` al `<u-calendar>` que cierra el popover correspondiente:

```vue
<u-calendar
  v-model="selectedPickupDate"
  @update:model-value="pickupDateCalendarOpen = false"
  ...
/>
```

Idéntico para el calendario de devolución con `returnDateCalendarOpen`.

### Alternativas consideradas

| Opción | Descripción | Por qué se descartó |
|---|---|---|
| Watcher sobre el ref `selectedPickupDate` | `watch(selectedPickupDate, () => { pickupDateCalendarOpen.value = false })` | Dispara también ante mutaciones programáticas del store (p. ej. `useSearch.ts:151-153` setea `fechaDevolucion = recogida + 7d`). Acopla cierre a *cualquier* cambio del ref, no a la acción del usuario. Más frágil ante cambios futuros del watcher. |
| Eventos `@day-select`/`@select` | Eventos no listados como contrato público de `<u-calendar>` v4 | Depende de internals; `update:modelValue` es la API estable documentada. |

### Decisión de scope: no encadenar popovers

Cuando el usuario selecciona la fecha de recogida, el popover de devolución **no** se abre automáticamente. La fecha de devolución por defecto (+7 días) se setea via watcher existente en `useSearch.ts:151-153` sin abrir UI adicional. El usuario debe hacer click en el `<u-input-date>` de devolución si quiere modificarla. Razón: el reporte pide cierre automático, no encadenamiento; agregar encadenamiento amplía alcance y puede sorprender al usuario.

## Affected files (blast radius)

- `packages/ui-alquilatucarro/app/components/Searcher.vue` — 2 líneas (1 por calendario)
- `packages/ui-alquilame/app/components/Searcher.vue` — idéntico
- `packages/ui-alquicarros/app/components/Searcher.vue` — idéntico

Sin cambios en:
- `packages/logic/` (store `useStoreReservationForm`, composable `useSearch`)
- Server endpoints
- Tipos
- Configuración

Consumidores del componente: páginas `[city]/...` que embeben `<Searcher />`. Ningún contrato cambia.

## Observable scenarios

**SCEN-001 — Cierre tras selección de fecha de recogida (desktop)**
- **Given** el formulario en viewport ≥640px, el popover de "Día de recogida" abierto.
- **When** el usuario hace click en una celda de día válida (no deshabilitada, ≥ `minPickupDate`).
- **Then** el popover se cierra (no visible / `aria-expanded="false"`) y el `<u-input-date>` muestra la fecha seleccionada.

**SCEN-002 — Cierre tras selección de fecha de devolución (desktop)**
- **Given** el formulario en viewport ≥640px con fecha de recogida seleccionada y el popover de "Día de devolución" abierto.
- **When** el usuario hace click en una celda de día válida (entre `minReturnDate` y `maxReturnDate`).
- **Then** el popover de devolución se cierra y el `<u-input-date>` muestra la fecha seleccionada.

**SCEN-003 — Independencia entre popovers**
- **Given** el popover de recogida abierto, el de devolución cerrado.
- **When** el usuario selecciona una fecha de recogida.
- **Then** sólo el popover de recogida se cierra; el popover de devolución permanece cerrado (no se abre ni cambia de estado).

**SCEN-004 — Móvil intacto**
- **Given** viewport <640px (input `<input type="date">` nativo visible).
- **When** el usuario abre la página de búsqueda.
- **Then** los inputs móviles (`#pickup-date-mobile`, `#return-date-mobile`) son visibles, tienen `type="date"`, y los inputs desktop (`#pickup-date`, `#return-date`) están ocultos vía clase `hidden sm:block`. Cambio del modelo en estos inputs preserva `fechaRecogida`/`fechaDevolucion` y dispara el watcher de +7 días igual que hoy.

**SCEN-005 — Watcher de fecha por defecto preservado**
- **Given** viewport ≥640px, sin fecha de recogida seleccionada (estado inicial).
- **When** el usuario selecciona una fecha de recogida en el calendario.
- **Then** el popover de recogida se cierra **y** `fechaDevolucion` se setea a recogida + 7 días (`useSearch.ts:151-153`), sin abrir el popover de devolución.

## Satisfaction strategy

- **E2E (Playwright, multi-marca via `BRAND` env):** nuevo `e2e/searcher-calendar-autoclose.spec.ts` cubriendo SCEN-001..005. Selectores y aserciones de visibilidad del popover:
  - **Apertura:** click en `#pickup-date` (resp. `#return-date`) y esperar `[role="dialog"]` visible. `<u-popover>` de Nuxt UI usa Reka UI internamente, que renderiza el `content` con `role="dialog"` cuando está abierto.
  - **Cierre:** asertar que el `[role="dialog"]` previamente visible desaparece del DOM tras click en celda de día. Equivalente con `await expect(dialog).toBeHidden()`.
  - **Selección de día:** `<u-calendar>` renderiza celdas con `[data-day]`; click sobre la primera celda no deshabilitada (`:not([data-disabled])`).
  - Si tras `/agent-browser` runtime los selectores anteriores no son estables, fallback: agregar `data-testid="pickup-date-popover"` / `return-date-popover` al `<u-popover>` y `data-testid="pickup-date-trigger"` / `return-date-trigger` al `<u-input-date>`.
- **SCEN-004 móvil:** test Playwright con `viewport: { width: 375, height: 812 }` que asegura `#pickup-date-mobile` y `#return-date-mobile` visibles y `[type="date"]`, y que `#pickup-date` / `#return-date` están ocultos. NO se ejercita el picker nativo del SO (Playwright no controla el picker del sistema), sólo se verifica el contrato de DOM.
- **Validación runtime con `/agent-browser`** en al menos una marca (`pnpm dev:alquilatucarro`) antes de commit, con consola y network limpios.

## Risks

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | `@update:model-value` también dispara cuando `<u-calendar>` recibe el valor inicial al montarse → cierre prematuro al abrir el popover por primera vez. | **Plan A (esperado):** Nuxt UI v4 emite `update:model-value` sólo en cambio del valor; `selectedPickupDate` se computa del store al montar y no muta en mount. Verificar en runtime con `/agent-browser`: abrir popover sin tocar nada, esperar 1s, asertar popover sigue abierto. **Plan B (si reproduce):** envolver el handler en un guard contra el primer mount: `let userInteracted = false; onMounted(() => { nextTick(() => { userInteracted = true }) })` y cambiar el handler a `@update:model-value="userInteracted && (pickupDateCalendarOpen = false)"`. Plan B local al template; no afecta store ni composable. |
| R2 | Navegación de mes/año dentro del calendario podría disparar `update:model-value`. | No esperado: `month-controls`/`year-controls` mutan estado interno (`focusedValue`) del calendario Reka UI, no `modelValue`. Validar en runtime: abrir popover, click `next-month` 2 veces, asertar popover sigue abierto. Si reproduce, ver R1 Plan B. |
| R3 | bfcache restoration: tras retroceder desde `/reservado/{reserveCode}`, los widgets de fecha quedan bloqueados. Existe handler `pageshow` (`Searcher.vue:355-357`) que recarga, pero el bug persiste según reporte del usuario. | **Fuera de alcance de este spec.** Tracked en [issue #25](https://github.com/amaw-sas/rentacar-web/issues/25). |
| R4 | Inconsistencia entre las 3 marcas si se edita una sola. | Cambio idéntico aplicado a los 3 archivos. Test e2e multi-marca (`BRAND=alquilatucarro|alquilame|alquicarros`) detecta deriva futura. |
| R5 | Regresión en SCEN-005 (watcher +7 días) si se toca lógica del store. | Cambio puramente template (event handler). Store y composable intactos. SCEN-005 lo cubre. |

## Verification plan

1. Implementar 6 ediciones (2 calendarios × 3 marcas) en `Searcher.vue`: agregar `@update:model-value="<state> = false"` en cada `<u-calendar>` (líneas ~149 y ~213 por archivo).
2. `pnpm typecheck` — debe pasar.
3. `pnpm lint` — debe pasar.
4. `/agent-browser` runtime sobre `pnpm dev:alquilatucarro`:
   - Abrir popover recogida → seleccionar fecha → confirmar cierre (R1 Plan A check).
   - Abrir popover sin seleccionar nada, esperar 1s → confirmar popover sigue abierto (R1 sanity).
   - Abrir popover, click `next-month` 2 veces → confirmar popover sigue abierto (R2 sanity).
   - Confirmar `fechaDevolucion` se llenó automáticamente (+7 días) sin abrir su popover.
   - Abrir popover devolución → seleccionar fecha → confirmar cierre.
   - Consola: cero errores. Network: cero requests fallidos.
5. E2E nuevo `e2e/searcher-calendar-autoclose.spec.ts` ejecutado vía `pnpm test:e2e` cubriendo SCEN-001..005, mínimo `BRAND=alquilatucarro`; idealmente las 3 marcas.
6. `/dogfood` exploratorio sobre el formulario de búsqueda.
7. `/verification-before-completion` antes de commit/PR.

## Out of scope (YAGNI)

- Refactor para extraer un componente `DatePickerField` compartido entre marcas. La duplicación existente está fuera del bug reportado; introducir abstracción ahora viola YAGNI cuando sólo agregamos 2 líneas por archivo.
- Encadenar apertura del popover de devolución tras selección de recogida (descartado por el usuario; ver decisión de scope arriba).
- Cambios en móvil (`<input type="date">` ya cierra solo vía SO).
- Fix de R3 (bfcache desde `/reservado/{reserveCode}`) — tracked en [issue #25](https://github.com/amaw-sas/rentacar-web/issues/25).
- Typo pre-existente en `aria-label="Seleccione una día de recogida"` (líneas 140, 204) — no introducido por este spec, fuera de alcance.

## Handoff

- **Next skill:** `/sop-planning` para producir un plan de implementación ordenado con acceptance criteria por paso.
- **Holdout:** los 5 escenarios observables anteriores son la entrada para `/scenario-driven-development`. Al iniciar SDD se creará el directorio `docs/specs/2026-05-06-searcher-calendar-autoclose/scenarios/` con `searcher-calendar-autoclose.scenarios.md` extraído de este documento, conforme la convención de specs vecinas (`2026-04-29-bundled-rentacar-data-resilience/scenarios/`, etc.).
