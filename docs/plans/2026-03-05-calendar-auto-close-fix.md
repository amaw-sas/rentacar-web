# Calendar Auto-Close Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** El popover del calendario se cierra automáticamente siempre que el usuario seleccione un rango completo de fechas, sin importar si tenía fechas previas o no.

**Architecture:** El auto-cierre ya existe en los tres `Searcher.vue` de cada brand, pero el guard `wasEmpty` impide que se dispare cuando el usuario abre el picker con un rango ya completo (ambas fechas establecidas). La solución es eliminar ese guard y simplificar la lógica.

**Tech Stack:** Vue 3, Nuxt, UCalendar (Nuxt UI), TypeScript

---

## Diagnóstico del bug

**Código actual (líneas 494-510 en cada Searcher.vue):**

```typescript
let wasEmpty = false
watch(dateRangePopoverOpen, (isOpen) => {
  if (isOpen) {
    wasEmpty = !dateRange.value?.start || !dateRange.value?.end
  }
})

watch(() => dateRange.value?.end, (end, oldEnd) => {
  const endChanged = end && (!oldEnd || end.compare(oldEnd) !== 0)
  if (end && dateRange.value?.start && dateRangePopoverOpen.value && wasEmpty && endChanged) {
    // ↑ `wasEmpty` bloquea el cierre cuando ambas fechas ya estaban establecidas
    setTimeout(() => {
      dateRangePopoverOpen.value = false
    }, 300)
  }
})
```

**Flujo con bug:**
- Usuario abre picker (ya tiene inicio=A y fin=B) → `wasEmpty = false` (ambas fechas están)
- Usuario hace clic en nueva fecha inicio → UCalendar resetea el end
- Usuario hace clic en nueva fecha fin → `watch` detecta el cambio de `end`
- Condición `wasEmpty` = false → NO cierra el popover ✗

**Fix:** Eliminar la lógica `wasEmpty` por completo. La condición `endChanged` ya garantiza que el cierre sólo se dispara cuando `end` cambia genuinamente.

---

### Task 1: Actualizar lógica auto-cierre en ui-alquicarros

**Files:**
- Modify: `packages/ui-alquicarros/app/components/Searcher.vue:494-510`

**Step 1: Verificar el código actual a modificar**

```bash
grep -n "wasEmpty\|dateRangePopoverOpen\|auto-close" packages/ui-alquicarros/app/components/Searcher.vue
```

Expected: Líneas 494-510 con la lógica `wasEmpty`.

**Step 2: Reemplazar el bloque de auto-cierre**

Reemplazar las líneas 494-510 con:

```typescript
  watch(() => dateRange.value?.end, (end, oldEnd) => {
    const endChanged = end && (!oldEnd || end.compare(oldEnd) !== 0)
    if (end && dateRange.value?.start && dateRangePopoverOpen.value && endChanged) {
      setTimeout(() => {
        dateRangePopoverOpen.value = false
      }, 300)
    }
  })
```

El comentario del bloque (líneas 481-492) también debe actualizarse para reflejar el nuevo comportamiento:

```typescript
  /**
   * Auto-close popover when range selection is complete
   *
   * UX Flow: User opens picker → selects start date → selects end date → popover auto-closes.
   * Works regardless of whether the picker was opened empty or with existing dates.
   *
   * The 300ms delay gives visual feedback before closing (user sees their selection).
   */
```

**Step 3: Verificar que no quedan referencias a wasEmpty**

```bash
grep -n "wasEmpty" packages/ui-alquicarros/app/components/Searcher.vue
```

Expected: Sin resultados.

---

### Task 2: Actualizar lógica auto-cierre en ui-alquilame

**Files:**
- Modify: `packages/ui-alquilame/app/components/Searcher.vue:494-510`

**Step 1: Verificar el código actual**

```bash
grep -n "wasEmpty" packages/ui-alquilame/app/components/Searcher.vue
```

Expected: Líneas ~494-503 con la lógica `wasEmpty`.

**Step 2: Aplicar el mismo reemplazo que en Task 1**

Misma lógica exacta que Task 1 — eliminar el watch de `dateRangePopoverOpen` y la variable `wasEmpty`, simplificar el watch de `dateRange.value?.end`.

**Step 3: Verificar**

```bash
grep -n "wasEmpty" packages/ui-alquilame/app/components/Searcher.vue
```

Expected: Sin resultados.

---

### Task 3: Actualizar lógica auto-cierre en ui-alquilatucarro

**Files:**
- Modify: `packages/ui-alquilatucarro/app/components/Searcher.vue:494-510`

**Step 1: Verificar el código actual**

```bash
grep -n "wasEmpty" packages/ui-alquilatucarro/app/components/Searcher.vue
```

**Step 2: Aplicar el mismo reemplazo**

Misma lógica exacta que Task 1 y Task 2.

**Step 3: Verificar**

```bash
grep -n "wasEmpty" packages/ui-alquilatucarro/app/components/Searcher.vue
```

Expected: Sin resultados.

---

### Task 4: Actualizar tests e2e

**Files:**
- Modify: `e2e/date-range-picker.spec.ts`

**Step 1: Añadir test de auto-cierre al cambiar rango existente**

Añadir al `test.describe('Date Range Picker - URL Synchronization')` el siguiente test:

```typescript
test('debe cerrar el popover al seleccionar rango con fechas previas ya establecidas', async ({ page }) => {
  // Start with existing dates in URL
  const testUrl = '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/lugar-devolucion/centro/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-15/hora-recogida/10:00%20AM/hora-devolucion/10:00%20AM/';

  await page.goto(testUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Open the date picker (which already has dates set)
  const dateButton = page.locator('button').filter({ hasText: /feb.*2026/i }).first();
  await expect(dateButton).toBeVisible({ timeout: 10000 });
  await dateButton.click();
  await page.waitForTimeout(500);

  // Verify calendar is open
  const calendarGrid = page.locator('[role="grid"]').first();
  await expect(calendarGrid).toBeVisible({ timeout: 5000 });

  // Click a new start date (March 5)
  const march5 = page.locator('[data-value="2026-03-05"], [aria-label*="5 de marzo"]').first();
  await march5.click();
  await page.waitForTimeout(300);

  // Click a new end date (March 10)
  const march10 = page.locator('[data-value="2026-03-10"], [aria-label*="10 de marzo"]').first();
  await march10.click();

  // Calendar should auto-close within 600ms
  await page.waitForTimeout(600);
  await expect(calendarGrid).not.toBeVisible({ timeout: 2000 });
});
```

**Step 2: Ejecutar los tests e2e para verificar**

```bash
cd /home/pabloandi/proyectos/rentacar/rentacar-main
npx playwright test e2e/date-range-picker.spec.ts --reporter=line
```

Expected: Todos los tests existentes pasan. El nuevo test puede fallar si el servidor no está corriendo — es aceptable como documentación de comportamiento esperado.

---

### Task 5: Verificación manual y commit

**Step 1: Verificar que no hay referencias residuales a wasEmpty en ningún Searcher**

```bash
grep -rn "wasEmpty" packages/*/app/components/Searcher.vue
```

Expected: Sin resultados.

**Step 2: Verificar que el auto-cierre existe en los 3 archivos**

```bash
grep -n "dateRangePopoverOpen.value = false" packages/*/app/components/Searcher.vue
```

Expected: Una línea por cada uno de los 3 archivos.

**Step 3: Commit**

```bash
git add packages/ui-alquicarros/app/components/Searcher.vue \
        packages/ui-alquilame/app/components/Searcher.vue \
        packages/ui-alquilatucarro/app/components/Searcher.vue \
        e2e/date-range-picker.spec.ts
git commit -m "fix(ux): always auto-close date picker popover on range selection

Previously the popover only auto-closed when opened from an empty state
(wasEmpty guard). Users who had existing dates and opened the picker to
change them experienced the calendar staying open after selecting a new
range, causing confusion.

Removed the wasEmpty guard so the popover always closes when a complete
date range is selected, regardless of initial state."
```

---

## Notas técnicas

- **Sin cambios en la API de los componentes**: solo lógica interna del watcher.
- **Sin nuevas dependencias**.
- **Δ LOC estimado**: ~-15 líneas por archivo × 3 archivos = ~-45 LOC neto. Tamaño: **S**.
- **Riesgo**: Bajo. El caso de uso "picker vacío → seleccionar rango" sigue funcionando exactamente igual. El único cambio es que el caso "picker con fechas → cambiar rango" ahora también cierra el popover.
- **El 300ms de delay**: Se mantiene. Es intencional para dar feedback visual antes de cerrar.
