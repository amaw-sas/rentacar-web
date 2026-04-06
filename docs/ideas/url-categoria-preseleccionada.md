# Idea: URL con Categoría Pre-seleccionada

**Fecha:** 2026-01-12
**Estado:** Pendiente de implementar
**Prioridad:** Media
**Tamaño estimado:** S (~40-60 líneas)

## Contexto

El usuario quiere poder compartir una URL que lleve directamente al resumen de reserva con una categoría de vehículo específica ya seleccionada.

### URL actual
```
/bogota/buscar-vehiculos/lugar-recogida/aarme/lugar-devolucion/aarme/fecha-recogida/2026-01-13/fecha-devolucion/2026-01-20/hora-recogida/12:00/hora-devolucion/12:00
```

### URL deseada
```
/bogota/buscar-vehiculos/.../hora-devolucion/12:00?categoria=c
```

## Hallazgos del Análisis

### Flujo Actual de Selección de Categoría

1. **Búsqueda de vehículos:** El usuario llega a la URL de búsqueda
2. **Carga de datos:** `useSearchByRouteParams()` dispara la búsqueda via `storeSearch.search()`
3. **Renderizado de categorías:** `CategorySelectionSection.vue` muestra las categorías disponibles en `filteredCategories`
4. **Selección manual:** Usuario hace click en "Solicitar este vehículo" en `CategoryCard.vue`
5. **Evento emitido:** `@selected-category="setSelectedCategory"` en `CategorySelectionSection.vue`
6. **Estado actualizado:** `selectedCategory` se guarda en el store `useStoreSearchData`
7. **Slideover abierto:** `slideoverReservationResume = true`

### Archivos Clave

| Archivo | Rol |
|---------|-----|
| `app/stores/useStoreSearchData.ts` | Store con `selectedCategory`, `filteredCategories`, `search()` |
| `app/components/CategorySelectionSection.vue` | Renderiza categorías, maneja selección, contiene slideover |
| `app/components/CategoryCard.vue` | Tarjeta individual, emite `selectedCategory` al click |
| `app/components/ReservationResume.vue` | Contenido del slideover de resumen |
| `app/pages/[city]/buscar-vehiculos/.../index.vue` | Página que usa `CityPage` |

### Estructura del Store de Búsqueda

```typescript
// useStoreSearchData.ts
const selectedCategory = ref<ReturnType<typeof useCategory> | null>(null);
const filteredCategories = computed<CategoryAvailabilityData[]>(() => { ... });
```

### Función de Selección en CategorySelectionSection

```typescript
function setSelectedCategory(category: ReturnType<typeof useCategory>) {
  vehiculo.value = category.categoryCode.value;
  selectedCategory.value = category;
  slideoverReservationResume.value = true;
}
```

## Implementación Propuesta

### Opción 1: Query Parameter (Recomendada)

**Ventajas:**
- No requiere cambios en el routing
- Backward compatible
- Fácil de implementar

**Cambios necesarios:**

1. **CategorySelectionSection.vue** - Añadir watcher para query param:

```typescript
const route = useRoute();

// Watch para auto-selección cuando hay query param
watch(
  [() => route.query.categoria, filteredCategories],
  ([categoriaParam, categories]) => {
    if (!categoriaParam || !categories.length || selectedCategory.value) return;

    const categoryCode = String(categoriaParam).toUpperCase();
    const categoryData = categories.find(
      (c) => c.categoryCode === categoryCode && c.estimatedTotalAmount !== 999999999
    );

    if (categoryData && vehicleCategories[categoryCode]) {
      // Crear instancia de useCategory y seleccionar
      const category = useCategory(categoryData);
      setSelectedCategory(category);
    }
  },
  { immediate: true }
);
```

### Opción 2: Segmento de Ruta

Añadir `/categoria/[categoria]` al final de la ruta.

**Desventaja:** Requiere crear nueva estructura de carpetas en pages.

## URL Final Esperada

```
http://localhost:3001/bogota/buscar-vehiculos/lugar-recogida/aarme/lugar-devolucion/aarme/fecha-recogida/2026-01-13/fecha-devolucion/2026-01-20/hora-recogida/12:00/hora-devolucion/12:00?categoria=c
```

## Notas Adicionales

- Los códigos de categoría son: C, F, FX, LE, GC, G4, GR, FU, FL, GL
- Solo se debe auto-seleccionar si la categoría está disponible (`estimatedTotalAmount !== 999999999`)
- Considerar UX: mostrar mensaje si la categoría solicitada no está disponible
