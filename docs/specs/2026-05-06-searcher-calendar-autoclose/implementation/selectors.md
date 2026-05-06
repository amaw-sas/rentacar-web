# Selector Spike — Step 0 Findings

**Date:** 2026-05-06
**Branch:** main (commit `0e7fc80`)
**Tool:** `/agent-browser` runtime sobre `pnpm dev:alquilatucarro` (puerto 4000)
**Page tested:** `http://localhost:4000/armenia` (no se prueban las otras 2 marcas — convención del proyecto: el Searcher es código compartido idéntico entre marcas. La verificación cross-marca queda para Step 3 vía e2e parametrizado por `BRAND`).

## TL;DR

- Selector estable de **estado abierto/cerrado del popover**: `aria-expanded` del trigger button (NOT `[role="dialog"]` directo, aunque éste también funciona). El bug actual: tras click en celda, `aria-expanded` permanece `"true"`.
- Selector estable de **celda de día clickeable**: `[data-reka-calendar-cell-trigger][data-value="YYYY-MM-DD"]` para targeting determinístico, o `:not([data-disabled]):not([data-unavailable]):not([data-outside-view])` para "primera disponible".
- Sin cambios necesarios en `Searcher.vue` para selectores estables — TODOS son provistos por Reka UI nativamente. **NO se requieren `data-testid`.**

## Plan corrections derivados de Step 0

| Plan asumía | Realidad observada | Corrección |
|---|---|---|
| Tests usan `page.goto('/')` | Homepage usa `<SelectBranch />`, NO `<Searcher />`. Searcher vive en `[city]` (`CityPage.vue:79,91`). | Usar `page.goto('/armenia')` (mismo patrón que `searcher-mobile-label-click.spec.ts:9`). |
| `#pickup-date` es trigger del popover | `#pickup-date` es el `<u-input-date>` wrapper que contiene 3 spinbuttons (day/month/year) y un trigger button separado. El trigger del popover es `button[aria-label="Seleccione una día de recogida"]`. | Click en el button del popover, NO en `#pickup-date`. Aunque `<u-input-date>` también tiene `@click="pickupDateCalendarOpen = true"` en el wrapper, así que ambos abren el popover. Para tests, preferir el trigger button (semánticamente correcto). |
| Asserción de cierre vía `[role="dialog"]` desaparece | `[role="dialog"]` cuenta sí va de 1 a 0 al cerrar (confirmado), pero `aria-expanded` en el trigger es más explícito y resistente a cambios de Nuxt UI. | Asertar AMBOS para defensa en profundidad: `aria-expanded="false"` en trigger AND `[role="dialog"]` count == 0. |
| Día cells via `[role="gridcell"]` | El `<td role="gridcell">` es el wrapper; el clickeable es `<div role="button" data-reka-calendar-cell-trigger>` adentro. Atributos `data-disabled`/`data-unavailable` están en el DIV interno, NO en el TD. | Targetear `[data-reka-calendar-cell-trigger]` directamente, no `[role="gridcell"]`. |
| Cross-marca en `/` | Las 3 marcas comparten el componente `Searcher.vue`; `Cities` (Supabase) garantiza `/armenia` válido en las 3. | OK. Step 3 e2e con `BRAND` env. |

## DOM observado

### Estado inicial (popover cerrado, 2026-05-06 09:30 hora servidor)

```
- button "Seleccione una día de recogida" [aria-expanded=false]
  (3 spinbuttons asociados al input desktop: day=7, month=5, year=2026)
- button "Seleccione una día de devolución" [aria-expanded=false]
  (3 spinbuttons: day=14, month=5, year=2026 — pickup +7 días vía watcher)
```

Hay **2 instancias** de cada `#pickup-date` y `#return-date` en el DOM (CityPage.vue renderiza dos `<Searcher />` — una para desktop, una para mobile, alternando vía `hidden sm:block` / `sm:hidden`). Los tests deben usar `.first()` (desktop) con viewport ≥640px, o `.last()` con viewport <640px (mismo patrón que `searcher-mobile-label-click.spec.ts:17,22,47`).

### Estado abierto

Tras click en `button[aria-label="Seleccione una día de recogida"]`:

```
- [role="dialog"] count: 1
- [data-state="open"] count: 2  (trigger + content)
- [data-reka-popper-content-wrapper] count: 1
- button "Seleccione una día de recogida" [aria-expanded=true, aria-controls="reka-popover-content-v-0-12-19"]
- button "Mes anterior" [disabled]  (porque min date = today, no se puede ir antes)
- button "Mes siguiente"
- 42 [role="gridcell"] (incluye headers de día de semana, días del mes, padding)
- N [data-reka-calendar-cell-trigger] (clickeables)
```

### Estructura de una celda de día clickeable

```html
<td role="gridcell" aria-disabled="false" data-slot="cell" class="...">
  <div
    role="button"
    aria-label="jueves, 9 de julio de 2026"
    data-reka-calendar-cell-trigger=""
    data-value="2026-07-09"
    data-slot="cellTrigger"
    tabindex="-1"
    class="... data-disabled:!text-gray-300 data-disabled:!opacity-40 ...
           data-unavailable:line-through ...
           data-today:font-semibold ...
           data-[selected]:bg-success ..."
  >9</div>
</td>
```

**Atributos de estado** (todos en el DIV interno, no en el TD):
- `data-disabled` — celda deshabilitada por `min-value` / `max-value`
- `data-unavailable` — fechas no disponibles (no usado actualmente, futuro)
- `data-outside-view` — días del mes anterior/siguiente que rellenan la grilla
- `data-today` — celda del día actual
- `data-selected` — celda seleccionada actualmente (sólo 1 en el calendar)
- `data-highlighted` — celda con focus de teclado

### Bug confirmado en runtime

1. Estado inicial: `aria-expanded="false"` en trigger.
2. Click en trigger → `aria-expanded="true"`, `[role="dialog"]` count = 1.
3. Click en celda `data-value="2026-05-15"` → spinbuttons cambian a `15/5/2026` y los de devolución a `22/5/2026` (+7 días watcher OK), **PERO** `aria-expanded` sigue en `"true"` y `[role="dialog"]` count sigue en 1. **← este es el bug.**
4. Click en "Mes siguiente" 2x sin seleccionar → `aria-expanded` permanece `"true"`. ✅ R2 Plan A confirmed: month nav no cierra.
5. Press Escape → `aria-expanded="false"`, `[role="dialog"]` count = 0. (Cierre por ESC funciona; el caso roto es selección.)
6. Console: 0 errores.

## Selectores Playwright sugeridos para Step 1

```ts
// === TRIGGERS DEL POPOVER ===
const pickupTrigger = page.getByRole('button', { name: 'Seleccione una día de recogida' }).first();
const returnTrigger = page.getByRole('button', { name: 'Seleccione una día de devolución' }).first();

// === ESTADO ABIERTO/CERRADO ===
// Preferir aria-expanded (más explícito que [role="dialog"]):
await expect(pickupTrigger).toHaveAttribute('aria-expanded', 'true');   // abierto
await expect(pickupTrigger).toHaveAttribute('aria-expanded', 'false');  // cerrado
// Defensa adicional:
await expect(page.locator('[role="dialog"]')).toHaveCount(0);           // cerrado
await expect(page.locator('[role="dialog"]')).toHaveCount(1);           // abierto

// === CELDAS DE DÍA ===
// Target específico (determinístico):
const cell = page.locator('[data-reka-calendar-cell-trigger][data-value="2026-05-15"]');
// Primera celda disponible (no disabled, no outside-view):
const firstAvailable = page.locator(
  '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-unavailable]):not([data-outside-view])'
).first();
// Celda seleccionada actualmente:
const selected = page.locator('[data-reka-calendar-cell-trigger][data-selected]');

// === NAVEGACIÓN DE MES ===
const nextMonth = page.getByRole('button', { name: 'Mes siguiente' });
const prevMonth = page.getByRole('button', { name: 'Mes anterior' });

// === LECTURA DE FECHA SELECCIONADA (para SCEN-005) ===
// Opción A: leer data-value de la celda con data-selected (requiere abrir popover, NO ideal):
const selectedISO = await page.locator('[data-reka-calendar-cell-trigger][data-selected]').first().getAttribute('data-value');
// Opción B (recomendada para SCEN-005): leer los 3 spinbuttons del input de devolución y componer:
async function readDate(inputId: string) {
  const wrapper = page.locator(`#${inputId}`).first();
  const day = await wrapper.getByRole('spinbutton', { name: 'day,' }).textContent();
  const month = await wrapper.getByRole('spinbutton', { name: /^month,/ }).textContent();
  const year = await wrapper.getByRole('spinbutton', { name: /^year,/ }).textContent();
  return new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
}
const pickupDate = await readDate('pickup-date');
const returnDate = await readDate('return-date');
expect(returnDate.getTime() - pickupDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
```

## Routing decisión

Las 3 marcas comparten:
- `pages/[city]/index.vue` (proxy a `<CityPage />`)
- Cities catalog en Supabase (commit `8c8ca8f` — migración firebase→supabase)
- `armenia` es la ciudad canónica usada en otros e2e (`searcher-mobile-label-click.spec.ts:9`, `extras-null-smoke.spec.ts`, etc.)

`page.goto('/armenia')` funciona en `BRAND={alquilatucarro,alquilame,alquicarros}` porque Cities está poblado para todas. Si `/armenia` falla en `alquilame` o `alquicarros` durante Step 3, sustituir por `/bogota` u otra ciudad común.

## Decisión final del spike

- **NO se requieren `data-testid`** en `Searcher.vue`. Reka UI provee selectores semánticos estables (`aria-expanded`, `data-reka-calendar-cell-trigger`, `data-value`).
- El plan se actualiza con los selectores específicos arriba antes de Step 1.
- Plan B de R1/R2 NO necesario por ahora — el comportamiento actual (popover NO cierra al seleccionar día) confirma que `update:model-value` solamente se dispara en cambio del valor, no en otras interacciones del calendar (mes nav, mount). Plan A será suficiente.

## Console errors

Cero errores observados durante toda la sesión de spike. Network panel no inspeccionado en detalle (no hubo señales de fallo).
