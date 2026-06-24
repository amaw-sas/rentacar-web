# Design: Searcher widget unificado @nuxt/ui

**Scenarios (holdout)**: `docs/specs/2026-06-22-searcher-unified-widget/scenarios/searcher-unified-widget.scenarios.md`
**Status**: planning · **Date**: 2026-06-22 · **Brands**: las 3

## Contexto

`Searcher.vue` (formulario de búsqueda de disponibilidad, duplicado en las 3
marcas) renderiza **dos árboles según breakpoint**: inputs nativos
(`<input type="date">`, `<select>`) en móvil y `@nuxt/ui`/reka-ui en desktop.
Todos los workarounds del componente viven en la rama nativa móvil:

- Globo de validación dark-mode de Android → `clampMobileDateInput` (omitir
  `min`/`max`, clampear a mano).
- El input nativo emite strings ISO; el modelo es `CalendarDate` → bridge
  string↔objeto (`onMobilePickupDateChange`/`onMobileReturnDateChange`) + binding
  `:value` one-way para no inyectar strings al ref compartido.
- bfcache rompe la reactividad de los `<select>` nativos → recarga forzada.

La directiva (tras problemas reportados con el input nativo y mirando a Kayak)
pide cambiar a un widget de calendario/seleccionable. La evaluación concluyó
**quedarse en `@nuxt/ui` 4 y unificar móvil+desktop**: `UCalendar`/`UInputDate`/
`UInputTime` están construidos sobre `@internationalized/date` — el mismo modelo
que ya usa el proyecto (`DateObject`=`CalendarDate`, `TimeObject`=`Time`), cero
conversiones. Kayak confirma el patrón: calendario custom en todo dispositivo,
nunca el picker nativo (desktop = rango doble-mes en popover; móvil = calendario
full-screen bottom-sheet).

Un prototipo en `.worktrees/spike-searcher-unified` validó los 3 riesgos
(USelectMenu móvil con buscador, slideover sin fuga de pointer-events, CLS 0.0394)
y descubrió un bug: estado de apertura compartido entre popover y slideover →
calendario fantasma portaleado al `<body>`. El prototipo es desechable; esta
implementación se reconstruye scenario-driven.

## Resultado esperado

Desaparecen `input[type="date"]`, los `<select>` nativos, `clampMobileDateInput` y
el bridge de strings. **Móvil**: lugar y hora vía el componente
`SearcherSelectDrawer` (botón trigger + `<u-slideover side="bottom">` a pantalla
completa con buscador sin autofocus + lista de opciones); fecha vía
`<u-slideover side="bottom">` con `<u-calendar>` (celdas grandes). **Desktop**: sin
cambios observables (popover + segmentos para fecha; `<u-select-menu>` para
lugar/hora).

## Approach

### Decisión clave: superficies móvil/desktop con estado de apertura separado

El bug del prototipo ("calendario fantasma") venía de **compartir** el ref de
apertura entre el popover desktop (su contenido se portalea al `<body>`, ignora
`hidden sm:block`) y el slideover móvil: abrir el móvil disparaba también el
portal desktop. La corrección aprobada y validada usa **refs separados por
superficie**, nunca compartidos:

- Desktop: `<u-input-date>` + `<u-popover v-model:open="pickupDateCalendarOpen">` + `<u-calendar>`, envuelto en `hidden sm:block`.
- Móvil: `<u-button>` (muestra `formatHumanDate`) + `<u-slideover v-model:open="pickupDateSlideoverOpen">` + `<u-calendar>`, envuelto en `sm:hidden`.

El contenido de cada overlay solo se renderiza cuando su propio ref está abierto;
como el popover desktop permanece cerrado en móvil, su grid no se monta → en móvil
hay **exactamente un** `[role="grid"]` visible (SCEN-003). El handler de selección
(`onPickupDateSelect`/`onReturnDateSelect`) fija el valor y cierra **ambas**
superficies, así que sirve a popover y slideover por igual.

> Nota: el design original contempló `useBreakpoints + v-if` para montar un solo
> host. Se descartó frente a la solución `sm:hidden`/`hidden sm:block` + refs
> separados, que es la que la directiva validó (más simple, sin dependencia de
> `useBreakpoints` para SSR-gating y consistente con el resto del componente).

Lugar y hora: en móvil usan `SearcherSelectDrawer` (`class="... sm:hidden"`); en
desktop el `<u-select-menu>` existente (`hidden sm:block`, `data-testid` con sufijo
`-desktop-test`). El drawer encapsula trigger + slideover + buscador + lista, de
modo que las 4 ramas nativas se reemplazan por 4 invocaciones del mismo componente.

### Capa que NO se toca

`onMounted` watchers store↔ref, `useSearch`, `isPickupDateUnavailable`/
`isReturnDateUnavailable`, `isSelectionWithinSchedule`, badges (`rentalDays`,
`extraHoursLabel`), sanitización `pointer-events` del body (#25) y
`handleSearcherPageShow`. La fecha se mantiene como `CalendarDate` con `v-model`
directo en `UInputDate`/`UCalendar` (handler común `onPickupDateSelect`/
`onReturnDateSelect` que fija el valor, re-habilita BUSCAR y cierra el overlay).

### Reutilizar

- `formatHumanDate(date: DateObject)` de `@rentacar-main/logic/utils` para la
  etiqueta del botón móvil (es-CO, ya usado por el store).
- `calendarUIConfig`, props `:min-value`/`:max-value`/`:is-date-unavailable`/
  `color="success"` ya presentes en el desktop actual.
- `pickupHourOptions`/`returnHourOptions` de `useSearch` (alimentan USelectMenu).
- API `USlideover`: `side="bottom"`, `v-model:open`, slot `#body`, `title`.

## Archivos a modificar

Patrón idéntico replicado por marca (la duplicación de `Searcher.vue`/`SelectBranch.vue`
es preexistente; extraer componente compartido es follow-up). Por cada
`B ∈ {alquilatucarro, alquilame, alquicarros}`:

- `packages/ui-B/app/components/SearcherSelectDrawer.vue` — **nuevo** (drawer móvil
  reutilizable para lugar/hora). En alquilame el badge usa `bg-red-600 text-white`;
  en alquilatucarro/alquicarros `bg-[#a3f78b] text-black`.
- `packages/ui-B/app/components/Searcher.vue` — swap de presentación móvil (4 ramas
  `<select>` → `SearcherSelectDrawer`; 2 `<input type=date>` → botón + slideover
  calendario).
- `packages/ui-B/app/components/SelectBranch.vue` — `<select>` móvil del home →
  botón trigger + `<u-slideover>` con buscador; al elegir navega (`goToReservationPage`).

**Preservar por marca** (no copy ciego): badge color, padding del wrapper
(alquilame `p-2` vs `px-2 py-2 max-sm:py-0.5!`), ancho del form (alquilame sin
`md:w-3/6 lg:w-4/6`), y la lógica de submit propia de alquilame (`searchDestination`
+ derivación de ciudad #112-F3 + branching `/reservas`).

Tests (reescritura — el contrato viejo asume nativo móvil):

- `packages/ui-B/app/components/__tests__/SearcherSelectDrawer.mount.test.ts` —
  **nuevo** (6 escenarios: placeholder, label seleccionado, abre+lista, filtra,
  emite+cierra, resetea query).
- `packages/ui-B/app/components/__tests__/Searcher.test.ts` — eliminar asserts de
  `:value` one-way / clamp / `name="*-mobile"` y el `u-calendar.length === 2`;
  asertar el nuevo contrato de source (slideover móvil, sin native, año-controls
  off, sanitización body, pageshow). **Conservar** los bloques propios de alquilame
  (SCEN-002 width, #112-F3, SCEN-003 submit).
- `packages/ui-B/app/components/__tests__/SelectBranch.test.ts` — quitar el assert
  del `<select>` nativo; asertar drawer (slideover `h-dvh`, buscador no-autofocus,
  opciones centradas `text-lg`, `goToReservationPage`).
- `e2e/searcher-unified-widget.spec.ts` (nuevo) — SCEN-001..016 multi-marca
  (`BRAND`), móvil + desktop. Selectores estables `data-testid="*-test"`.

`@vueuse/core` ya está en `package.json` de cada marca — sin nuevas deps.

## Pasos de implementación (scenario-driven)

Worktree nuevo desde `origin/main` (el del prototipo es desechable). Holdout de
escenarios commiteado en la rama padre ANTES de implementar.

1. **SCEN-001/002 (móvil fecha)**: encode E2E falla → implementar host móvil
   (botón + slideover + calendar, `useBreakpoints` `v-else`) → satisfacer.
2. **SCEN-003 (no fantasma)**: encode → verificar `grid` count 1 (el `v-if`
   garantiza un solo árbol) → satisfacer.
3. **SCEN-004 (pointer-events ×3)**: encode regresión #25 → satisfacer.
4. **SCEN-005 (desktop)**: encode → confirmar host desktop bajo `v-if isDesktop`
   sin regresión de auto-close.
5. **SCEN-006/007 (lugar/hora)**: encode → quitar `<select>` nativos, USelectMenu
   único → satisfacer.
6. **SCEN-008/009/010/011 (reglas)**: encode → confirmar min/max/unavailable/+7/
   badge/no-clear vía calendar (sin código nuevo de lógica) → satisfacer.
7. **SCEN-012/013**: encode bfcache + submit params → satisfacer.
8. **Reescribir `Searcher.test.ts`** por marca al nuevo contrato.
9. **SCEN-014**: parametrizar E2E por `BRAND`, replicar el cambio a alquilame y
   alquicarros → suite verde en las 3.
10. **REFACTOR**: limpiar, alinear convenciones; escenarios siguen satisfechos.

## Verificación end-to-end

- E2E: `pnpm test:e2e` + `:alquilame` + `:alquicarros` (los 3 BRAND), móvil+desktop.
- Unit: `pnpm --filter ui-<brand> test` (Searcher.test reescrito), una marca a la
  vez.
- Runtime `/agent-browser` (390px + desktop) por marca: 0 errores consola, 0
  requests ≥400, capturas de slideover/select.
- SCEN-015 CLS: build comparable, PerformanceObserver vs `origin/main`.
- Typecheck por marca: `ionice -c3 nice -n19 pnpm --filter ui-<brand> typecheck`
  (NUNCA el typecheck raíz — congela el disco WSL2). Delta-vs-baseline: 0 errores
  nuevos (baseline rojo conocido = blog/config, ajeno a Searcher).
- Quality gate: code-reviewer + code-simplifier + edge-case-detector +
  performance-engineer sobre el diff; luego verification-before-completion.
- `/dogfood` móvil al cierre.

## Rollout

PR único con las 3 marcas (cambio idéntico, mismo root cause) — coherente con la
preferencia de agrupar fixes acoplados. Verificar previews por marca vía el alias
Vercel `-git-main-` (alquicarros/alquilame no auto-construyen preview de branch).

## Riesgos

1. **USelectMenu vs rueda nativa (hora)**: trade-off aceptado (buscador compensa
   48 slots). Si producto exige la rueda, follow-up.
2. **Overlays reka-ui en móvil**: SCEN-004 (×3) es el guardia del #25; el
   `useBreakpoints v-if` reduce superficie (un solo overlay activo).
3. **`useBreakpoints` SSR**: mitigado — campos de fecha client-gated; selects no
   se ramifican por viewport.
4. **Paridad de marca**: alquilame tiene reskin propio (gradientes/contraste);
   validar `calendarUIConfig` en su tema en runtime, no asumir.

## Non-goals

- Date-range doble-mes estilo Kayak (decisión de producto, follow-up).
- Componente `DatePickerField` compartido entre marcas (YAGNI ahora).
- Tocar `useSearch`/stores/`useDateFunctions`.

## Follow-ups

- Evaluar rango doble-mes (UX como Kayak) como iteración 2.
- Extraer `Searcher` a componente compartido en `logic`/un paquete UI común si
  surge una 3ª razón para tocar los tres a la vez.
