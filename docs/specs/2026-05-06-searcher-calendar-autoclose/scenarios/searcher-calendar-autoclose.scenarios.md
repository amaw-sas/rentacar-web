---
name: searcher-calendar-autoclose
created_by: pablo+claude
created_at: 2026-05-06T09:00:00Z
---

# Searcher: Cierre automático del calendario al seleccionar fecha

Fix de UX para los popovers de fecha (recogida y devolución) en el formulario
de búsqueda de disponibilidad de categorías (`Searcher.vue`). Hoy el popover
desktop (`<u-popover>` envolviendo `<u-calendar>`) se abre al hacer click en
el `<u-input-date>` pero **no cierra** cuando el usuario selecciona un día —
sólo cierra al click outside. El fix: agregar `@update:model-value="<state> = false"`
a cada `<u-calendar>` para revertir `v-model:open` del popover ante selección.

Móvil usa `<input type="date">` nativo del SO — fuera de alcance, pero se
verifica no-regresión.

Spec asociado: `docs/specs/2026-05-06-searcher-calendar-autoclose-design.md`
(commits `0088e28`, `6203317`).

---

## SCEN-001: Cierre tras selección de fecha de recogida (desktop)

**Given**:
- Viewport ≥640px (`width: 1280, height: 720` en Playwright; los inputs `#pickup-date` / `#return-date` son visibles, los `*-mobile` ocultos por `sm:hidden`).
- Página `/` o cualquier ruta que renderiza `<Searcher />` cargada (`pnpm dev:alquilatucarro` u otra marca).
- El usuario hizo click en `#pickup-date` y el popover abrió: existe un elemento `[role="dialog"]` visible que contiene `<u-calendar>` (Reka UI renderiza el `content` del `<u-popover>` con ese rol).

**When**: El usuario hace click en una celda de día válida del calendario (selector: una celda con `[data-day]` y sin atributo `data-disabled`/`data-unavailable`, idealmente la primera disponible ≥ `minPickupDate`).

**Then**:
- El popover desaparece del DOM (o pasa a `[data-state="closed"]`/`hidden`); `[role="dialog"]` ya no está visible.
- El input `#pickup-date` muestra la fecha seleccionada (formato del `<u-input-date>`, p. ej. `MM/DD/YYYY` según locale por defecto).
- El store Pinia refleja la selección: `useStoreReservationForm().fechaRecogida` es la fecha clickeada en formato ISO esperado por el store.
- Cero errores en consola, cero requests fallidos en Network panel.

**Evidence**:
- DOM: `await expect(page.getByRole('dialog')).toBeHidden()` tras el click en la celda.
- DOM: `await expect(page.locator('#pickup-date')).toHaveValue(/* fecha esperada */)`.
- Re-runs estables: ejecutar el test 3 veces seguidas, todas pasan sin flakiness.

---

## SCEN-002: Cierre tras selección de fecha de devolución (desktop)

**Given**:
- Viewport ≥640px.
- Fecha de recogida ya seleccionada (sea por SCEN-001 previo o por estado inicial); `#return-date` por tanto tiene una fecha por defecto (+7 días vía watcher en `useSearch.ts:151-153`).
- El usuario hizo click en `#return-date` y el popover de devolución está abierto: `[role="dialog"]` visible conteniendo el `<u-calendar>` con `min-value=minReturnDate` y `max-value=maxReturnDate`.

**When**: El usuario hace click en una celda válida (entre `minReturnDate` y `maxReturnDate`, sin `data-disabled`).

**Then**:
- El popover de devolución desaparece (`[role="dialog"]` no visible).
- `#return-date` muestra la fecha seleccionada.
- `useStoreReservationForm().fechaDevolucion` refleja la selección.
- El popover de recogida sigue cerrado (no se abre por efecto colateral).

**Evidence**:
- DOM: `await expect(page.getByRole('dialog')).toBeHidden()` tras click.
- DOM: `await expect(page.locator('#return-date')).toHaveValue(/* fecha esperada */)`.
- DOM: el popover trigger de recogida no muestra `aria-expanded="true"`.

---

## SCEN-003: Independencia entre popovers

**Given**:
- Viewport ≥640px.
- Ambos popovers cerrados al cargar.
- El usuario abrió únicamente el popover de recogida (click en `#pickup-date`); existe un único `[role="dialog"]` visible asociado al input de recogida.

**When**: El usuario selecciona una fecha válida en el calendario de recogida.

**Then**:
- El popover de recogida cierra (`[role="dialog"]` previamente visible ya no lo está).
- El popover de devolución permanece cerrado: no aparece un nuevo `[role="dialog"]` visible.
- Sólo `useStoreReservationForm().fechaRecogida` cambia con el click directo. (`fechaDevolucion` puede actualizarse vía watcher SCEN-005 — eso es comportamiento legítimo, no apertura de popover.)

**Evidence**:
- DOM: `await expect(page.getByRole('dialog')).toHaveCount(0)` o `toBeHidden()` tras la selección — ningún popover queda abierto.
- Inspección visual con `/agent-browser`: tras la selección, ambos `<u-input-date>` muestran sólo el input, sin overlay de calendario.

---

## SCEN-004: Móvil intacto

**Given**:
- Viewport <640px (Playwright: `viewport: { width: 375, height: 812 }`, iPhone 13/14 size).
- Página renderiza `<Searcher />`.

**When**: El usuario carga la página y observa los inputs de fecha.

**Then**:
- `#pickup-date-mobile` y `#return-date-mobile` son visibles y tienen atributo `type="date"` (input nativo del navegador/SO).
- `#pickup-date` y `#return-date` (variantes desktop) están ocultos por la clase `hidden sm:block` en sus contenedores.
- El cambio del valor de los inputs móviles vía API de Playwright (`page.locator('#pickup-date-mobile').fill('2026-06-15')`) actualiza `useStoreReservationForm().fechaRecogida` y dispara el watcher de +7 días en `useSearch.ts:151-153`, igual que hoy.
- No se ejercita el picker nativo del SO (Playwright no controla overlays del sistema); este escenario verifica el contrato de DOM, no la UX del picker nativo.

**Evidence**:
- DOM: `await expect(page.locator('#pickup-date-mobile')).toBeVisible()` y `toHaveAttribute('type', 'date')`.
- DOM: `await expect(page.locator('#return-date-mobile')).toBeVisible()`.
- DOM: el contenedor desktop tiene `class*="hidden"` en este viewport.
- Comportamiento: tras `fill()` en `#pickup-date-mobile`, asertar que el input de devolución refleja una fecha 7 días posterior.

---

## SCEN-005: Watcher de fecha por defecto preservado

**Given**:
- Viewport ≥640px.
- Estado inicial: ninguna fecha seleccionada por el usuario, `fechaRecogida` y `fechaDevolucion` con valores por defecto del store al montarse `<Searcher />`.
- El popover de recogida está abierto.

**When**: El usuario selecciona una fecha de recogida en el calendario (ejemplo: hoy + 14 días).

**Then**:
- El popover de recogida cierra (vía SCEN-001).
- `useStoreReservationForm().fechaDevolucion` se setea automáticamente a `fechaRecogida + 7 días` (comportamiento de `useSearch.ts:151-153` intacto, ya que el fix sólo agrega un event handler al template, no toca store ni composable).
- El popover de devolución permanece cerrado a pesar del cambio programático de `fechaDevolucion` (SCEN-003 reforzado).
- Ambos `<u-input-date>` muestran las dos fechas correctas tras la única acción del usuario.

**Evidence**:
- Store: `useStoreReservationForm().fechaDevolucion` evaluada después del click ≡ `fechaRecogida + 7 días`.
- DOM: `#return-date` muestra la fecha calculada sin que el usuario haya tocado ese input.
- DOM: `[role="dialog"]` cuenta total = 0 tras la acción.

---

## SCEN-001 + R1 sanity: no-cierre prematuro al abrir el popover

**Given**: Viewport ≥640px, ningún popover abierto, fecha de recogida con valor por defecto.

**When**: El usuario hace click en `#pickup-date` para abrir el popover y NO interactúa más durante 1 segundo.

**Then**: El popover sigue abierto (R1 Plan A asume que `<u-calendar>` no emite `update:model-value` al montarse con el valor del store). Si este escenario falla, el spec autoriza activar R1 Plan B (`userInteracted` guard).

**Evidence**: `await expect(page.getByRole('dialog')).toBeVisible()` tras `await page.waitForTimeout(1000)`.

---

## SCEN-001 + R2 sanity: navegación de mes no cierra el popover

**Given**: Viewport ≥640px, popover de recogida abierto, calendario mostrando el mes actual.

**When**: El usuario hace click 2 veces en el control "next month" del calendario sin seleccionar día.

**Then**: El popover sigue abierto. `month-controls`/`year-controls` mutan `focusedValue` interno de Reka UI, no `modelValue`, por lo que no debe disparar `@update:model-value`.

**Evidence**: tras los 2 clicks, `await expect(page.getByRole('dialog')).toBeVisible()`. El header del calendario muestra el mes +2 respecto al actual.

---

## Non-goals (explícito)

- **Refactor a componente compartido `DatePickerField`**: la duplicación de `Searcher.vue` entre las 3 marcas existe; NO se aborda aquí. Introducir abstracción para 2 líneas/archivo viola YAGNI.
- **Encadenar apertura del popover de devolución tras seleccionar recogida**: descartado durante brainstorming. La fecha de devolución se setea automáticamente vía watcher (+7 días) sin abrir UI adicional.
- **Fix del bug bfcache (R3)**: tras retroceder desde `/reservado/{reserveCode}` los widgets quedan bloqueados; tracked en [issue #25](https://github.com/amaw-sas/rentacar-web/issues/25). NO se cierra con este spec.
- **Typo `aria-label="Seleccione una día"`** (líneas 140, 204 de `Searcher.vue`): pre-existente, fuera de alcance.
- **Picker nativo móvil**: Playwright no controla overlays del SO; SCEN-004 verifica DOM contract, no UX del picker.

---

## Verification matrix (mapping a archivos)

| Scenario | Test file | Viewport | Marca |
|---|---|---|---|
| SCEN-001 | `e2e/searcher-calendar-autoclose.spec.ts` | desktop (1280×720) | `BRAND=alquilatucarro` (mín.); idealmente las 3 |
| SCEN-002 | mismo | desktop | mismo |
| SCEN-003 | mismo | desktop | mismo |
| SCEN-004 | mismo | mobile (375×812) | mismo |
| SCEN-005 | mismo | desktop | mismo |
| R1 sanity | mismo | desktop | mismo |
| R2 sanity | mismo | desktop | mismo |
