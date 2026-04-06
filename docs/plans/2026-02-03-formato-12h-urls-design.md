# Diseño: URLs con Formato de Hora 12h

**Fecha**: 2026-02-03
**Tamaño**: M (~250 LOC)
**Enfoque**: Conversión en Capa de Presentación (ROI: +2)

## Problema

Las URLs de búsqueda de vehículos usan formato de hora 24h no intuitivo:
- `/bogota/buscar-vehiculos/.../hora-recogida/13:00/hora-devolucion/13:00`
- Formato 24h es menos natural para usuarios colombianos
- Inconsistente con estándares de UX para mercado latinoamericano

## Solución

Cambiar URLs a formato 12h con retrocompatibilidad completa:
- `/bogota/buscar-vehiculos/.../hora-recogida/01:00pm/hora-devolucion/01:00pm`
- Store interno sigue en formato 24h (sin cambios en lógica de negocio)
- Redirect automático de URLs legacy 24h a formato 12h

## Decisiones de Diseño

### Formato Seleccionado
- **URL**: `01:00pm` (sin espacio, minúsculas)
- **Medianoche**: `12:00am`
- **Mediodía**: `12:00pm`
- **Razón**: Sin espacios evita %20 en URLs, minúsculas más natural en web

### Retrocompatibilidad
- **Comportamiento**: Redirect inmediato (como branch slugs)
- **Pattern**: Sigue precedente del commit b547558 (branch slugs)
- URLs 24h siguen funcionando → redirigen automáticamente a 12h

### Alcance
- **Solo URLs**: Store interno mantiene formato 24h
- **Sin cambios en API**: Backend sigue recibiendo 24h
- **Sin cambios en UI**: Labels del selector mantienen formato actual

## Arquitectura

### 1. Funciones de Utilidad

**Ubicación**: `packages/logic/src/utils/useDateFunctions.ts`

#### formatTime12h()
Convierte DateTimeObject a formato 12h para URLs.

```typescript
/**
 * Format a datetime object to 12h format (hh:mm[am|pm])
 * @param datetime DateTimeObject
 * @returns string - formato: "01:00pm", "12:00am"
 */
export function formatTime12h(datetime: DateTimeObject): string {
  const hour = datetime.hour;
  const minute = datetime.minute.toString().padStart(2, '0');

  // Convert 24h to 12h
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'pm' : 'am';

  return `${hour12.toString().padStart(2, '0')}:${minute}${period}`;
}
```

**Ejemplos:**
- `13:00` → `01:00pm`
- `00:00` → `12:00am`
- `12:00` → `12:00pm`
- `23:30` → `11:30pm`

#### parseTime12hOr24h()
Parsea ambos formatos (12h y 24h) para retrocompatibilidad.

```typescript
/**
 * Parse time string in either 12h or 24h format
 * @param timeString - "13:00" (24h) or "01:00pm" (12h)
 * @returns TimeObject or null if invalid
 */
export function parseTime12hOr24h(timeString: string): TimeObject | null {
  // Try 24h format first (existing behavior)
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    try {
      return parseTime(timeString);
    } catch {
      return null;
    }
  }

  // Try 12h format: 01:00pm, 12:30am
  const match = timeString.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  // Convert to 24h
  if (period === 'am') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  try {
    return parseTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  } catch {
    return null;
  }
}
```

#### Funciones de Detección

```typescript
/**
 * Check if time string is in 12h format
 */
export function isTime12hFormat(timeString: string): boolean {
  return /^\d{1,2}:\d{2}(am|pm)$/i.test(timeString);
}

/**
 * Check if time string is in 24h format
 */
export function isTime24hFormat(timeString: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeString);
}
```

### 2. Generación de URLs

**Modificaciones en `packages/logic/src/composables/useSearch.ts`**

```typescript
const searchLinkParams = computed(() => {
  const pickupBranch = searchBranchByCode(lugarRecogida.value ?? '');
  const returnBranch = searchBranchByCode(lugarDevolucion.value ?? '');

  // Convert stored 24h format to 12h for URLs
  const pickupTime = horaRecogida.value
    ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaRecogida.value)))
    : null;
  const returnTime = horaDevolucion.value
    ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaDevolucion.value)))
    : null;

  return {
    referido: referido.value,
    lugar_recogida: pickupBranch?.slug,
    lugar_devolucion: returnBranch?.slug,
    fecha_recogida: fechaRecogida.value,
    fecha_devolucion: fechaDevolucion.value,
    hora_recogida: pickupTime,
    hora_devolucion: returnTime,
  };
});
```

**Principio clave**: Store interno mantiene 24h (`"13:00"`), URLs generan 12h (`"01:00pm"`).

### 3. Middleware con Redirect Automático

**Modificaciones en `validateSearchParams.ts` (x3 packages)**

Añadir después de la validación de branch slugs (línea ~77):

```typescript
// Validate time formats and redirect legacy 24h to 12h
const hora_recogida = to.params.hora_recogida as string;
const hora_devolucion = to.params.hora_devolucion as string;

// Detect legacy 24h format and redirect to 12h
const isPickup12h = isTime12hFormat(hora_recogida);
const isReturn12h = isTime12hFormat(hora_devolucion);

if (!isPickup12h || !isReturn12h) {
  // Parse times (supporting both formats)
  const pickupTime = parseTime12hOr24h(hora_recogida);
  const returnTime = parseTime12hOr24h(hora_devolucion);

  if (!pickupTime || !returnTime) {
    // Invalid time format - fallback to defaults
    const {
      defaultLugarRecogida,
      defaultLugarDevolucion,
      defaultFechaRecogida,
      defaultFechaDevolucion,
      defaultHoraRecogida,
      defaultHoraDevolucion
    } = useDefaultRouteParams();

    to.params.lugar_recogida = defaultLugarRecogida.value as string;
    to.params.lugar_devolucion = defaultLugarDevolucion.value as string;
    to.params.fecha_recogida = defaultFechaRecogida.value as string;
    to.params.fecha_devolucion = defaultFechaDevolucion.value as string;
    to.params.hora_recogida = defaultHoraRecogida.value as string;
    to.params.hora_devolucion = defaultHoraDevolucion.value as string;

    createMessage({
      type: "info",
      message: "Formato de hora inválido. Se ajustó al valor por defecto.",
    });

    return navigateTo({ name: to.name, params: to.params, query: to.query });
  }

  // Legacy 24h format detected - redirect to 12h URL
  to.params.hora_recogida = formatTime12h(toDatetime(createCurrentDateObject(), pickupTime));
  to.params.hora_devolucion = formatTime12h(toDatetime(createCurrentDateObject(), returnTime));

  return navigateTo({ name: to.name, params: to.params, query: to.query });
}

// Continue with existing date validations...
```

**Patrón aplicado**: Idéntico al usado para branch slugs (líneas 63-77 del middleware actual).

### 4. Lectura de Route Params

**Modificaciones en `packages/logic/src/composables/useSearchByRouteParams.ts`**

```typescript
onMounted(() => {
  // ... código existente ...

  // Parse times (supporting both 12h and 24h formats)
  const pickupTimeString = route.params.hora_recogida as string;
  const returnTimeString = route.params.hora_devolucion as string;

  const pickupTime = parseTime12hOr24h(pickupTimeString);
  const returnTime = parseTime12hOr24h(returnTimeString);

  // Convert to 24h format for internal store
  horaRecogida.value = pickupTime
    ? formatTime(toDatetime(createCurrentDateObject(), pickupTime))
    : null;
  horaDevolucion.value = returnTime
    ? formatTime(toDatetime(createCurrentDateObject(), returnTime))
    : null;

  // ... resto del código ...
  doSearch();
});
```

### 5. Valores por Defecto

**Modificaciones en `packages/logic/src/composables/useDefaultRouteParams.ts`**

```typescript
const defaultHoraRecogida = ref<string | null>('12:00pm');  // antes: '12:00'
const defaultHoraDevolucion = ref<string | null>('12:00pm'); // antes: '12:00'
```

### 6. Exports en Utils

**Modificaciones en `packages/logic/src/utils/index.ts`**

```typescript
export * from './useDateFunctions';

// Añadir exports explícitos si no están:
export {
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat
} from './useDateFunctions';
```

## Flujo de Datos

```
URL con 01:00pm (12h)
    ↓
[Middleware] Valida formato, acepta 12h
    ↓
[Route Params Reader] 01:00pm → TimeObject → "13:00" (24h)
    ↓
[Store Interno] Usa formato 24h ("13:00")
    ↓
[API Calls] Envía formato 24h
    ↓
[Link Generator] "13:00" → 01:00pm
    ↓
Nueva URL con 01:00pm (12h)

---

URL Legacy con 13:00 (24h)
    ↓
[Middleware] Detecta formato 24h
    ↓
[Middleware] Redirige a 01:00pm (12h)
    ↓
Continúa flujo normal
```

## Testing

### Unit Tests

**Archivo**: `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat
} from '../useDateFunctions';
import {
  createCurrentDateObject,
  createTimeFromString,
  toDatetime
} from '../useDateFunctions';

describe('formatTime12h', () => {
  it('converts 13:00 to 01:00pm', () => {
    const time = createTimeFromString('13:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00pm');
  });

  it('converts 00:00 to 12:00am', () => {
    const time = createTimeFromString('00:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00am');
  });

  it('converts 12:00 to 12:00pm', () => {
    const time = createTimeFromString('12:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00pm');
  });

  it('converts 23:30 to 11:30pm', () => {
    const time = createTimeFromString('23:30');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:30pm');
  });

  it('converts 01:00 to 01:00am', () => {
    const time = createTimeFromString('01:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00am');
  });

  it('converts 11:45 to 11:45am', () => {
    const time = createTimeFromString('11:45');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:45am');
  });
});

describe('parseTime12hOr24h', () => {
  it('parses 24h format', () => {
    const time = parseTime12hOr24h('13:00');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with pm', () => {
    const time = parseTime12hOr24h('01:00pm');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with am', () => {
    const time = parseTime12hOr24h('01:00am');
    expect(time?.hour).toBe(1);
    expect(time?.minute).toBe(0);
  });

  it('parses midnight correctly', () => {
    const time = parseTime12hOr24h('12:00am');
    expect(time?.hour).toBe(0);
    expect(time?.minute).toBe(0);
  });

  it('parses noon correctly', () => {
    const time = parseTime12hOr24h('12:00pm');
    expect(time?.hour).toBe(12);
    expect(time?.minute).toBe(0);
  });

  it('parses 11:59pm correctly', () => {
    const time = parseTime12hOr24h('11:59pm');
    expect(time?.hour).toBe(23);
    expect(time?.minute).toBe(59);
  });

  it('parses case insensitive (AM/PM)', () => {
    const timeUpper = parseTime12hOr24h('01:00PM');
    const timeLower = parseTime12hOr24h('01:00pm');
    expect(timeUpper?.hour).toBe(13);
    expect(timeLower?.hour).toBe(13);
  });

  it('returns null for invalid format', () => {
    expect(parseTime12hOr24h('25:00')).toBeNull();
    expect(parseTime12hOr24h('13:00xm')).toBeNull();
    expect(parseTime12hOr24h('invalid')).toBeNull();
    expect(parseTime12hOr24h('1:00pm')).toBeNull(); // single digit hour
  });
});

describe('format detection', () => {
  it('detects 12h format', () => {
    expect(isTime12hFormat('01:00pm')).toBe(true);
    expect(isTime12hFormat('12:30am')).toBe(true);
    expect(isTime12hFormat('11:59PM')).toBe(true);
    expect(isTime12hFormat('13:00')).toBe(false);
    expect(isTime12hFormat('invalid')).toBe(false);
  });

  it('detects 24h format', () => {
    expect(isTime24hFormat('13:00')).toBe(true);
    expect(isTime24hFormat('00:00')).toBe(true);
    expect(isTime24hFormat('23:59')).toBe(true);
    expect(isTime24hFormat('01:00pm')).toBe(false);
    expect(isTime24hFormat('invalid')).toBe(false);
  });
});
```

### Configuración Vitest

**Archivo**: `packages/logic/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@rentacar-main/logic': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

**Ejecución:**
```bash
cd packages/logic
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # With coverage
```

### Integration Tests

Los tests de middleware existentes cubrirán automáticamente el redirect de formato 24h → 12h.

## Archivos Modificados

**Nuevos (2 archivos):**
1. `packages/logic/vitest.config.ts` (~15 LOC)
2. `packages/logic/src/utils/__tests__/useDateFunctions.test.ts` (~130 LOC)

**Modificados (8 archivos):**
1. `packages/logic/src/utils/useDateFunctions.ts` (+60 LOC)
2. `packages/logic/src/utils/index.ts` (+4 exports)
3. `packages/logic/src/composables/useSearch.ts` (~10 LOC modificadas)
4. `packages/logic/src/composables/useSearchByRouteParams.ts` (~8 LOC modificadas)
5. `packages/logic/src/composables/useDefaultRouteParams.ts` (~2 LOC modificadas)
6. `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts` (+30 LOC)
7. `packages/ui-alquilame/app/middleware/validateSearchParams.ts` (+30 LOC)
8. `packages/ui-alquicarros/app/middleware/validateSearchParams.ts` (+30 LOC)

**Total estimado:** ~250 LOC (Tamaño M)

## Plan de Rollback

### Escenario 1: Bug Crítico
**Acción:** Git revert completo

```bash
git revert <commit-hash>
git push origin main
```

**Impacto:**
- ✅ URLs 24h funcionan inmediatamente
- ⚠️ URLs 12h generadas durante despliegue fallan temporalmente
- **Tiempo**: < 5 minutos

### Escenario 2: Bug Menor
**Acción:** Hotfix específico en función afectada

**Ventajas del diseño:**
- Store interno no cambia (24h)
- API no cambia (24h)
- Solo capa de URLs afectada
- Bugs aislados y fáciles de corregir

### Por qué NO necesitamos Feature Flag

1. **Retrocompatibilidad bidireccional**
   - Parser acepta ambos formatos indefinidamente
   - Coexistencia pacífica 24h/12h

2. **Cambios aislados**
   - Lógica de negocio intacta
   - API intacta
   - Solo presentación (URLs) cambia

3. **Validación robusta**
   - Fallback a defaults si parsing falla
   - Tests unitarios cubren edge cases
   - Middleware con detección explícita

4. **Precedente exitoso**
   - Branch slugs (commit b547558) usaron mismo patrón
   - Sin feature flag, sin problemas

## Consideraciones

### Ventajas
- ✅ URLs más naturales para usuarios colombianos
- ✅ Mejor UX sin afectar lógica de negocio
- ✅ 100% retrocompatible
- ✅ Consistencia con patrón de branch slugs
- ✅ Store interno mantiene formato técnico (24h)
- ✅ Tests unitarios establecen cultura de testing

### Desventajas
- ⚠️ URLs existentes redirigen (overhead mínimo ~50ms)
- ⚠️ Requiere configuración de vitest (primera vez)

### Mitigaciones
- Redirect overhead negligible (<50ms por request)
- Vitest ya instalado, solo falta configuración
- Documentación clara para futuros desarrolladores

### URLs Antes y Después

**Antes (24h):**
```
/bogota/buscar-vehiculos/
  lugar-recogida/bogota-aeropuerto/
  lugar-devolucion/bogota-aeropuerto/
  fecha-recogida/2026-02-03/
  fecha-devolucion/2026-02-10/
  hora-recogida/13:00/
  hora-devolucion/13:00
```

**Después (12h):**
```
/bogota/buscar-vehiculos/
  lugar-recogida/bogota-aeropuerto/
  lugar-devolucion/bogota-aeropuerto/
  fecha-recogida/2026-02-03/
  fecha-devolucion/2026-02-10/
  hora-recogida/01:00pm/
  hora-devolucion/01:00pm
```

**Legacy (sigue funcionando):**
```
/bogota/buscar-vehiculos/.../hora-recogida/13:00/...
  ↓ (redirect automático)
/bogota/buscar-vehiculos/.../hora-recogida/01:00pm/...
```

## Casos Edge

### Medianoche y Mediodía
- `00:00` → `12:00am` ✅
- `12:00` → `12:00pm` ✅
- Consistente con estándar 12h

### Validación de Límites
- `25:00` → null → fallback a default ✅
- `13:00xm` → null → fallback a default ✅
- `-01:00pm` → null → fallback a default ✅

### Case Insensitivity
- `01:00PM` → acepta y normaliza ✅
- `01:00Pm` → acepta y normaliza ✅

### Reservas Mensuales
- Lógica existente no se afecta (opera en TimeObject)
- Comparaciones de hora siguen funcionando ✅

## Precedentes

Este diseño sigue el patrón establecido en:

**Commit b547558** - "feat: add backward compatibility for legacy branch codes in URLs"
- Mismo enfoque: función dual de búsqueda
- Mismo flujo: detección en middleware + redirect
- Mismo resultado: retrocompatibilidad 100%
- Misma confianza: sin feature flag necesario

## Próximos Pasos

1. ✅ Diseño validado con usuario
2. Implementación en worktree aislado
3. Escribir tests unitarios
4. Ejecutar tests (`pnpm test`)
5. Testing manual en 3 marcas (alquilatucarro, alquilame, alquicarros)
6. Code review
7. Merge a main
8. Monitoreo post-deploy (primeras 24h)
