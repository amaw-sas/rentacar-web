# Date Range Picker - Plan de Implementación

> **Para Claude:** REQUERIDO: Usar superpowers:executing-plans para implementar este plan tarea por tarea.

**Objetivo:** Reemplazar componentes separados de fecha de recogida/devolución con un único date-range picker de Nuxt UI

**Arquitectura:** Unificar selección de fechas usando UCalendar con prop `range`, manteniendo variables internas separadas (selectedPickupDate/selectedReturnDate) mediante computed properties bidireccionales para compatibilidad con stores existentes.

**Tech Stack:** Nuxt 3, Nuxt UI, Vue 3 Composition API, @internationalized/date

---

## Task 1: Crear rama y preparar entorno

**Archivos:**
- Git branch: `feat/date-range-picker`

**Paso 1: Crear rama desde main**

```bash
git checkout main
git pull origin main
git checkout -b feat/date-range-picker
```

Esperado: Rama creada y checkout exitoso

**Paso 2: Verificar estado limpio**

```bash
git status
```

Esperado: "On branch feat/date-range-picker" y working tree clean

---

## Task 2: Agregar imports necesarios

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue:323`

**Paso 1: Agregar imports de @internationalized/date**

En la sección `<script setup>` después de la línea 323, agregar:

```typescript
import { CalendarDate, parseDate, getLocalTimeZone, DateFormatter } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
```

**Paso 2: Verificar sintaxis**

```bash
cd packages/ui-alquilatucarro
npm run typecheck
```

Esperado: No errores de TypeScript

**Paso 3: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add @internationalized/date imports"
```

---

## Task 3: Implementar funciones de conversión de formatos

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (después de imports)

**Paso 1: Agregar función stringToCalendarDate**

Después de los imports, antes de las variables locales (línea ~326):

```typescript
// Conversion helpers: String ISO ↔ CalendarDate
function stringToCalendarDate(dateString: string | null): CalendarDate | null {
  if (!dateString) return null
  try {
    return parseDate(dateString)
  } catch {
    return null
  }
}
```

**Paso 2: Agregar función calendarDateToString**

```typescript
function calendarDateToString(calendarDate: CalendarDate | null): string | null {
  if (!calendarDate) return null
  return calendarDate.toString()
}
```

**Paso 3: Verificar sintaxis**

```bash
npm run typecheck
```

Esperado: No errores

**Paso 4: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add date format conversion helpers"
```

---

## Task 4: Agregar nuevas variables y constantes

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue:326-345`

**Paso 1: Agregar constante MAX_RENTAL_DAYS**

Después de las funciones de conversión, antes de las variables locales:

```typescript
// Constants
const MAX_RENTAL_DAYS = 30
```

**Paso 2: Agregar nuevas variables ref**

Después de la línea 342 (después de `animateSearchButton`):

```typescript
const dateRangePopoverOpen = ref<boolean>(false)
const isDesktop = ref<boolean>(false)
```

**Paso 3: Eliminar variables obsoletas**

Eliminar las líneas 344-345:

```typescript
// ELIMINAR ESTAS LÍNEAS:
// const pickupDateCalendarOpen = ref<boolean>(false)
// const returnDateCalendarOpen = ref<boolean>(false)
```

**Paso 4: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 5: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add new state variables for date-range picker"
```

---

## Task 5: Implementar computed bidireccional dateRange

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (después de variables ref)

**Paso 1: Agregar computed dateRange**

Después de las variables ref, antes del objeto `calendarUIConfig`:

```typescript
// Date range computed: sincroniza con selectedPickupDate/selectedReturnDate
const dateRange = computed({
  get: () => ({
    start: stringToCalendarDate(selectedPickupDate.value),
    end: stringToCalendarDate(selectedReturnDate.value)
  }),
  set: (newRange: { start: CalendarDate | null, end: CalendarDate | null } | null) => {
    if (newRange?.start) {
      selectedPickupDate.value = calendarDateToString(newRange.start)
    }
    if (newRange?.end) {
      selectedReturnDate.value = calendarDateToString(newRange.end)
    }
  }
})
```

**Paso 2: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 3: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): implement bidirectional dateRange computed"
```

---

## Task 6: Implementar responsividad (isDesktop y numberOfMonths)

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (dentro de onMounted)

**Paso 1: Agregar computed numberOfMonths**

Después del computed `dateRange`:

```typescript
// Responsive: 2 meses en desktop, 1 en móvil
const numberOfMonths = computed(() => isDesktop.value ? 2 : 1)
```

**Paso 2: Agregar lógica de responsividad en onMounted**

Dentro del bloque `onMounted()`, después de las inicializaciones de stores (línea ~354), agregar:

```typescript
  // Setup responsive detection
  const updateIsDesktop = () => {
    isDesktop.value = window.matchMedia('(min-width: 640px)').matches
  }
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)

  onUnmounted(() => {
    window.removeEventListener('resize', updateIsDesktop)
  })
```

**Paso 3: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 4: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add responsive detection for calendar months"
```

---

## Task 7: Implementar validaciones

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (después de numberOfMonths)

**Paso 1: Agregar función isDateDisabled**

```typescript
// Validation: disable same-day selection
const isDateDisabled = (date: DateValue) => {
  if (dateRange.value?.start && !dateRange.value?.end) {
    // Deshabilitar el mismo día que la fecha de inicio
    return date.compare(dateRange.value.start) === 0
  }
  return false
}
```

**Paso 2: Agregar computed dateRangeError**

```typescript
// Error message for invalid ranges
const dateRangeError = computed(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return null

  const start = dateRange.value.start
  const end = dateRange.value.end
  const daysDiff = end.compare(start)

  if (daysDiff === 0) {
    return 'La devolución debe ser al menos 1 día después'
  }
  if (daysDiff > MAX_RENTAL_DAYS) {
    return `Máximo ${MAX_RENTAL_DAYS} días de alquiler`
  }

  return null
})
```

**Paso 3: Agregar computed isDateRangeValid**

```typescript
// Validation state for search button
const isDateRangeValid = computed(() => {
  return dateRange.value?.start && dateRange.value?.end && !dateRangeError.value
})
```

**Paso 4: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 5: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add date range validations"
```

---

## Task 8: Implementar función de formateo de fechas

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (después de validaciones)

**Paso 1: Agregar DateFormatter instance**

```typescript
// Date formatter for display
const df = new DateFormatter('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})
```

**Paso 2: Agregar función formatDateRange**

```typescript
// Format date range for display
function formatDateRange(range: { start: CalendarDate | null, end: CalendarDate | null }) {
  if (!range.start || !range.end) return ''

  const start = df.format(range.start.toDate(getLocalTimeZone()))
  const end = df.format(range.end.toDate(getLocalTimeZone()))

  return `${start} - ${end}`
}
```

**Paso 3: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 4: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add date range formatter"
```

---

## Task 9: Implementar watchers para edge cases

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (dentro de onMounted, al final)

**Paso 1: Agregar watcher para selección incompleta**

Dentro de `onMounted()`, al final, después de todos los otros watchers:

```typescript
  // Edge case: revertir si se cierra sin completar selección
  watch(dateRangePopoverOpen, (isOpen) => {
    if (!isOpen && dateRange.value?.start && !dateRange.value?.end) {
      // Revertir a estado anterior
      dateRange.value = {
        start: stringToCalendarDate(selectedPickupDate.value),
        end: stringToCalendarDate(selectedReturnDate.value)
      }
    }
  })
```

**Paso 2: Agregar watcher para auto-cierre**

```typescript
  // Auto-close popover when range selection is complete
  watch(() => dateRange.value?.end, (end) => {
    if (end && dateRange.value?.start) {
      setTimeout(() => {
        dateRangePopoverOpen.value = false
      }, 300)
    }
  })
```

**Paso 3: Verificar sintaxis**

```bash
npm run typecheck
```

**Paso 4: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add edge case handlers for date picker"
```

---

## Task 10: Actualizar template - eliminar bloques antiguos

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue:103-232`

**Paso 1: Eliminar bloque móvil - fecha de recogida**

Eliminar líneas 103-116:

```vue
<!-- ELIMINAR ESTE BLOQUE COMPLETO -->
<!-- MÓVIL: Form field con input date nativo -->
<!--
<div class="bg-white rounded-xl p-2 shadow-sm sm:hidden">
    <u-form-field label="Día de recogida" size="xl">
        <input
            v-if="minPickupDate"
            type="date"
            id="pickup-date-mobile"
            name="pickup-date-mobile"
            v-model="selectedPickupDate"
            aria-label="Día de recogida"
            class="w-full"
            :min="minPickupDate.toString()"
        >
    </u-form-field>
</div>
-->
```

**Paso 2: Eliminar bloque desktop - fecha de recogida**

Eliminar líneas 119-165:

```vue
<!-- ELIMINAR ESTE BLOQUE COMPLETO -->
<!-- DESKTOP: Form field con u-input-date -->
```

**Paso 3: Eliminar bloque móvil - fecha de devolución**

Eliminar líneas 168-181

**Paso 4: Eliminar bloque desktop - fecha de devolución**

Eliminar líneas 185-232

**Paso 5: Verificar que el componente compila**

```bash
npm run dev
```

Esperado: App se ejecuta sin errores (aunque faltarán los campos de fecha)

**Paso 6: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "refactor(searcher): remove old date picker components"
```

---

## Task 11: Actualizar template - agregar nuevo date-range picker

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue` (después del bloque de devolución, antes de las horas)

**Paso 1: Agregar nuevo bloque de date-range picker**

Después del bloque de "Lugar de devolución" (desktop), antes del bloque de "Hora de recogida", insertar:

```vue
        <!-- Date Range Picker - Unified for mobile and desktop -->
        <div class="col-span-2 bg-white rounded-xl p-2 shadow-sm">
            <u-form-field label="Período de alquiler" size="xl">
                <u-popover v-model:open="dateRangePopoverOpen" :ui="{ content: 'bg-white' }">
                    <u-button
                        variant="ghost"
                        color="neutral"
                        class="w-full justify-start text-left font-normal"
                        aria-label="Seleccionar período de alquiler"
                    >
                        <template #leading>
                            <IconsCalendarIcon cls="size-4" />
                        </template>

                        <span v-if="dateRange.start && dateRange.end" class="text-gray-900">
                            {{ formatDateRange(dateRange) }}
                        </span>
                        <span v-else class="text-gray-400">
                            Selecciona fechas de recogida y devolución
                        </span>
                    </u-button>

                    <template #content>
                        <u-calendar
                            v-model="dateRange"
                            range
                            :number-of-months="numberOfMonths"
                            :min-value="minPickupDate"
                            :max-value="maxReturnDate"
                            :maximum-days="MAX_RENTAL_DAYS"
                            :is-date-disabled="isDateDisabled"
                            :prevent-deselect="true"
                            color="success"
                            :ui="calendarUIConfig"
                            :month-controls="true"
                            :year-controls="true"
                            :prev-month="{ color: 'gray', variant: 'soft' }"
                            :next-month="{ color: 'gray', variant: 'soft' }"
                            :prev-year="{ color: 'gray', variant: 'soft' }"
                            :next-year="{ color: 'gray', variant: 'soft' }"
                            class="p-2 calendar-light"
                        />
                    </template>
                </u-popover>

                <p v-if="dateRangeError" class="text-sm text-error-500 mt-1">
                    {{ dateRangeError }}
                </p>
            </u-form-field>
        </div>
```

**Paso 2: Verificar que el componente renderiza**

```bash
npm run dev
```

Abrir en navegador y verificar que aparece el nuevo date-range picker

**Paso 3: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add unified date-range picker component"
```

---

## Task 12: Actualizar botón de búsqueda con nueva validación

**Archivos:**
- Modificar: `packages/ui-alquilatucarro/app/components/Searcher.vue:310-318`

**Paso 1: Actualizar prop disabled del botón de búsqueda**

Cambiar la línea 312:

```vue
<!-- ANTES: -->
:disabled="pendingSearching || !animateSearchButton"

<!-- DESPUÉS: -->
:disabled="!isDateRangeValid || pendingSearching || !animateSearchButton"
```

**Paso 2: Verificar que la validación funciona**

```bash
npm run dev
```

Probar:
1. Sin seleccionar fechas → botón deshabilitado ✓
2. Con rango válido → botón habilitado ✓

**Paso 3: Commit**

```bash
git add packages/ui-alquilatucarro/app/components/Searcher.vue
git commit -m "feat(searcher): add date range validation to search button"
```

---

## Task 13: Testing manual completo

**Archivos:**
- Test: `packages/ui-alquilatucarro/app/components/Searcher.vue`

**Paso 1: Testing en Desktop**

```bash
npm run dev
```

Abrir http://localhost:3000 en desktop viewport (>640px):

- [ ] Click en campo "Período de alquiler" abre popover
- [ ] Muestra 2 meses lado a lado
- [ ] Seleccionar fecha de inicio funciona
- [ ] Mismo día de inicio está deshabilitado
- [ ] Seleccionar fecha de fin funciona
- [ ] Popover se cierra automáticamente después de seleccionar fin
- [ ] Fechas se muestran formateadas en español
- [ ] Intentar rango > 30 días muestra error
- [ ] Botón de búsqueda se habilita solo con rango válido

**Paso 2: Testing en Móvil**

Cambiar viewport a móvil (<640px):

- [ ] Muestra 1 mes
- [ ] Todas las funcionalidades funcionan igual
- [ ] UI se adapta correctamente al espacio móvil

**Paso 3: Testing de Edge Cases**

- [ ] Cerrar popover sin completar selección revierte estado
- [ ] Cambiar tamaño de ventana actualiza número de meses
- [ ] Variables separadas se sincronizan correctamente
- [ ] Validaciones min/max dates funcionan

**Paso 4: Verificar no hay errores en consola**

Esperado: 0 errores o warnings

**Paso 5: Commit de ajustes (si hay)**

Si se encontraron bugs durante testing y se corrigieron:

```bash
git add .
git commit -m "fix(searcher): resolve [descripción del fix]"
```

---

## Task 14: Preparar para PR

**Archivos:**
- N/A

**Paso 1: Verificar build de producción**

```bash
npm run build
```

Esperado: Build exitoso sin errores

**Paso 2: Revisar todos los commits**

```bash
git log --oneline feat/date-range-picker ^main
```

Esperado: Lista clara de commits atómicos

**Paso 3: Push de la rama**

```bash
git push -u origin feat/date-range-picker
```

**Paso 4: Crear checklist para PR**

Crear archivo temporal con checklist:

```markdown
## PR Checklist

- [x] Implementado date-range picker unificado
- [x] Mantiene compatibilidad con variables separadas
- [x] Validaciones implementadas (mínimo 1 día, máximo 30 días)
- [x] Responsivo (2 meses desktop, 1 móvil)
- [x] Auto-cierre de popover
- [x] Edge cases manejados
- [x] Build de producción exitoso
- [x] Testing manual completado

## Testing Realizado

- Desktop: ✓
- Móvil: ✓
- Edge cases: ✓
- Validaciones: ✓

## Screenshots

[Adjuntar screenshots de desktop y móvil]
```

---

## Notas Finales

**Rollback si es necesario:**

```bash
git checkout main
git branch -D feat/date-range-picker
```

**Dependencias:**
- No requiere nuevas dependencias npm
- Usa `@internationalized/date` (ya incluido con Nuxt UI)

**Compatibilidad:**
- Mantiene 100% de compatibilidad con stores existentes
- No requiere cambios en otros componentes
- No afecta funcionalidad de búsqueda
