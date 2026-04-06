# Bug: Defaults no respetan contexto de ciudad en URL

**Status:** Identificado durante testing de formato 12h
**Prioridad:** Media
**Scope:** Fuera del alcance del requerimiento "formato 12h en URLs"
**Fecha:** 2026-02-04

## Descripción

Cuando el middleware `validateSearchParams` resetea los parámetros a valores default debido a un formato inválido, los lugares de recogida y devolución **no respetan el contexto de la ciudad** presente en la URL.

## Reproducir

1. Navegar a una URL con ciudad específica y formato de hora inválido:
   ```
   /armenia/buscar-vehiculos/lugar-recogida/armenia-aeropuerto/lugar-devolucion/armenia-aeropuerto/fecha-recogida/2026-02-10/fecha-devolucion/2026-02-17/hora-recogida/25:00/hora-devolucion/13:00
   ```

2. El middleware detecta formato inválido (25:00) y resetea a defaults

3. **Comportamiento actual (incorrecto):**
   ```
   Redirige a: /armenia/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/...
   ```

4. **Comportamiento esperado (correcto):**
   ```
   Redirige a: /armenia/buscar-vehiculos/lugar-recogida/armenia-aeropuerto/lugar-devolucion/armenia-aeropuerto/...
   ```

## Impacto

**UX:** Si un usuario tiene un enlace antiguo/inválido para Armenia, Medellín, u otra ciudad, al corregirse el formato inválido se le cambia la ciudad a Bogotá (default global).

**Alcance afectado:**
- ❌ /armenia/... → resetea a bogota-aeropuerto
- ❌ /medellin/... → resetea a bogota-aeropuerto
- ❌ /cartagena/... → resetea a bogota-aeropuerto
- ✅ /bogota/... → mantiene bogota-aeropuerto (correcto por casualidad)

## Causa Raíz

El composable `useDefaultRouteParams` retorna defaults globales **sin considerar** el parámetro de ciudad presente en la ruta:

```typescript
// Archivo: packages/logic/src/composables/useDefaultRouteParams.ts
const defaultLugarRecogida = ref<string | null>('bogota-aeropuerto'); // ❌ Hard-coded
const defaultLugarDevolucion = ref<string | null>('bogota-aeropuerto'); // ❌ Hard-coded
```

**Ubicaciones afectadas:**
- `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts` (líneas 89-99)
- `packages/ui-alquilame/app/middleware/validateSearchParams.ts` (líneas similares)
- `packages/ui-alquicarros/app/middleware/validateSearchParams.ts` (líneas similares)

## Solución Propuesta

### Opción A: Context-Aware Defaults (Recomendada)

Modificar `useDefaultRouteParams` para aceptar contexto de ciudad:

```typescript
// useDefaultRouteParams.ts
export function useDefaultRouteParams(cityContext?: string) {
  const defaultLugarRecogida = computed(() => {
    if (cityContext) {
      return `${cityContext}-aeropuerto`; // e.g., "armenia-aeropuerto"
    }
    return 'bogota-aeropuerto'; // fallback global
  });

  // Similar para defaultLugarDevolucion...
}
```

**Llamada desde middleware:**
```typescript
// validateSearchParams.ts
const citySlug = to.path.split('/')[1]; // Extract "armenia" from "/armenia/..."
const {
  defaultLugarRecogida,
  defaultLugarDevolucion,
  // ...
} = useDefaultRouteParams(citySlug);
```

**Beneficios:**
- ✅ Respeta contexto de ciudad en todas las situaciones
- ✅ Backwards compatible (funciona sin parámetro)
- ✅ Solución centralizada (un solo cambio)

**Complejidad:** S (~40 LOC)

### Opción B: Extraer ciudad del path en middleware

Detectar la ciudad directamente en el middleware antes de usar defaults:

```typescript
// En validateSearchParams.ts
const pathSegments = to.path.split('/');
const citySlug = pathSegments[1]; // e.g., "armenia", "medellin"

// Usar ciudad para construir defaults contextuales
const cityAirport = `${citySlug}-aeropuerto`;

to.params.lugar_recogida = cityAirport;
to.params.lugar_devolucion = cityAirport;
```

**Beneficios:**
- ✅ Solución rápida sin modificar composables
- ✅ Explícito y fácil de entender

**Desventajas:**
- ❌ Duplicación en 3 middlewares (alquilatucarro, alquilame, alquicarros)
- ❌ No centralizado

**Complejidad:** S (~30 LOC, pero x3 archivos = 90 LOC total)

## Recomendación

**Implementar Opción A** en sesión futura dedicada. Es la solución más robusta y centralizada.

## Tests

El test está **documentado pero skip** en:
```
e2e/time-format-12h.spec.ts
test.skip('KNOWN BUG: defaults no respetan contexto de ciudad en URL')
```

Una vez corregido el bug, **remover el `.skip`** para activar el test de regresión.

## Notas Adicionales

- Este bug **existe antes** del requerimiento de formato 12h
- El requerimiento de formato 12h **no introduce** este bug, solo lo hace más visible al aumentar los casos donde se usan defaults
- El bug afecta igualmente a otras validaciones que resetean a defaults (fechas inválidas, lugares inválidos, etc.)

## Referencias

- Branch: `feature/12h-time-format-urls`
- Commits relacionados: 983b414, 55c2757, 54a407c, 1c51350
- Test e2e: `e2e/time-format-12h.spec.ts` línea ~235
