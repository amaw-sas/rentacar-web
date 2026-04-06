# Date Range Picker - Diseño de Implementación

**Fecha:** 2026-02-06
**Componente:** Searcher.vue
**Objetivo:** Reemplazar componentes separados de fecha pickup/return con un único date-range picker

## Resumen Ejecutivo

Unificar la selección de fechas de recogida y devolución usando el componente `UCalendar` de Nuxt UI en modo `range`, manteniendo la lógica interna con variables separadas para compatibilidad con el código existente.

## Decisiones de Diseño

### 1. Alcance Multi-Dispositivo
- **Decisión:** Date-range picker Nuxt UI para móvil y desktop
- **Razón:** Experiencia de usuario consistente y aprovechamiento completo de las capacidades de Nuxt UI

### 2. Vista de Meses
- **Desktop:** 2 meses simultáneos (`:number-of-months="2"`)
- **Móvil:** 1 mes (`:number-of-months="1"`)
- **Implementación:** Computed property reactivo basado en media query `(min-width: 640px)`

### 3. Manejo de Estado
- **Decisión:** Objeto range con computed properties bidireccionales
- **Razón:** Mantiene compatibilidad con stores y lógica existente sin refactorización masiva
- **Variables:**
  - `dateRange` (nuevo): `{ start: CalendarDate, end: CalendarDate }`
  - `selectedPickupDate` (existente): string ISO
  - `selectedReturnDate` (existente): string ISO

### 4. Presentación Visual
- **Decisión:** Input-like con popover
- **Implementación:** `UButton` estilizado como input + `UPopover` + `UCalendar`
- **Label:** "Período de alquiler" (unifica ambas fechas)

### 5. Validaciones
- ✅ Mínimo 1 día de diferencia (via `is-date-disabled`)
- ✅ Máximo 30 días de alquiler (via `:maximum-days`)
- ✅ Min/max dates existentes (`:min-value`, `:max-value`)

## Arquitectura Técnica

### Conversión de Formatos

```typescript
import { CalendarDate, parseDate, getLocalTimeZone, DateFormatter } from '@internationalized/date'

// String ISO → CalendarDate
function stringToCalendarDate(dateString: string): CalendarDate | null {
  if (!dateString) return null
  return parseDate(dateString)
}

// CalendarDate → String ISO
function calendarDateToString(calendarDate: CalendarDate | null): string | null {
  if (!calendarDate) return null
  return calendarDate.toString()
}
```

### Computed Bidireccional

```typescript
const dateRange = computed({
  get: () => ({
    start: stringToCalendarDate(selectedPickupDate.value),
    end: stringToCalendarDate(selectedReturnDate.value)
  }),
  set: (newRange) => {
    if (newRange?.start) {
      selectedPickupDate.value = calendarDateToString(newRange.start)
    }
    if (newRange?.end) {
      selectedReturnDate.value = calendarDateToString(newRange.end)
    }
  }
})
```

### Validación de Fechas

```typescript
const MAX_RENTAL_DAYS = 30

const isDateDisabled = (date: DateValue) => {
  if (dateRange.value?.start && !dateRange.value?.end) {
    // Deshabilitar mismo día que inicio
    return date.compare(dateRange.value.start) === 0
  }
  return false
}

const dateRangeError = computed(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return null

  const daysDiff = dateRange.value.end.compare(dateRange.value.start)

  if (daysDiff === 0) return 'La devolución debe ser al menos 1 día después'
  if (daysDiff > MAX_RENTAL_DAYS) return `Máximo ${MAX_RENTAL_DAYS} días de alquiler`

  return null
})
```

### Responsividad

```typescript
const isDesktop = ref(false)

onMounted(() => {
  const updateIsDesktop = () => {
    isDesktop.value = window.matchMedia('(min-width: 640px)').matches
  }
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)
  onUnmounted(() => window.removeEventListener('resize', updateIsDesktop))
})

const numberOfMonths = computed(() => isDesktop.value ? 2 : 1)
```

## Estructura del Template

```vue
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
  </u-form-field>

  <p v-if="dateRangeError" class="text-sm text-error-500 mt-1">
    {{ dateRangeError }}
  </p>
</div>
```

## Edge Cases y Manejo de Errores

### 1. Selección Incompleta
```typescript
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

### 2. Auto-cierre del Popover
```typescript
watch(() => dateRange.value?.end, (end) => {
  if (end && dateRange.value?.start) {
    setTimeout(() => {
      dateRangePopoverOpen.value = false
    }, 300)
  }
})
```

### 3. Validación Antes de Búsqueda
```typescript
const isDateRangeValid = computed(() => {
  return dateRange.value?.start && dateRange.value?.end && !dateRangeError.value
})

// En botón de búsqueda:
:disabled="!isDateRangeValid || pendingSearching || !animateSearchButton"
```

## Formateo de Fechas

```typescript
const df = new DateFormatter('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

function formatDateRange(range: { start: CalendarDate, end: CalendarDate }) {
  const start = df.format(range.start.toDate(getLocalTimeZone()))
  const end = df.format(range.end.toDate(getLocalTimeZone()))
  return `${start} - ${end}` // "15 feb 2026 - 20 feb 2026"
}
```

## Accesibilidad

- ✅ `aria-label` descriptivo en botón
- ✅ `role="dialog"` en popover (Nuxt UI lo maneja)
- ✅ Navegación con teclado nativa
- ✅ Focus trap dentro del popover
- ✅ Mensajes de error descriptivos

## Impacto en Código

### Archivos Afectados
- `packages/ui-alquilatucarro/app/components/Searcher.vue`

### Bloques a Eliminar
- Líneas 103-116: Móvil - input date pickup
- Líneas 119-165: Desktop - u-input-date + calendar pickup
- Líneas 168-181: Móvil - input date return
- Líneas 185-232: Desktop - u-input-date + calendar return

### Variables a Eliminar
- `pickupDateCalendarOpen`
- `returnDateCalendarOpen`

### Variables a Agregar
- `dateRange`
- `dateRangePopoverOpen`
- `isDesktop`
- `numberOfMonths` (computed)
- `dateRangeError` (computed)
- `isDateRangeValid` (computed)

### Funciones a Agregar
- `stringToCalendarDate()`
- `calendarDateToString()`
- `formatDateRange()`
- `isDateDisabled()`

## Testing

### Casos de Prueba Esenciales
1. Selección de rango válido (pickup → return)
2. Intento de seleccionar mismo día (debe estar deshabilitado)
3. Intento de seleccionar rango > 30 días (debe mostrar error)
4. Cierre de popover sin completar selección (debe revertir)
5. Auto-cierre al completar selección
6. Responsividad: cambio entre 1 y 2 meses
7. Sincronización con variables separadas
8. Validación antes de permitir búsqueda

## Próximos Pasos

1. Crear rama `feat/date-range-picker`
2. Implementar conversión de formatos
3. Implementar computed bidireccional
4. Actualizar template
5. Implementar validaciones
6. Implementar manejo de errores
7. Testing manual en móvil y desktop
8. Commit y PR
