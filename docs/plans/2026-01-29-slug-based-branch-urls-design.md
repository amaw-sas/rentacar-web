# Diseño: URLs con Slugs para Sucursales

**Fecha**: 2026-01-29
**Tamaño**: M (~250 LOC)
**Enfoque**: Slug Generado Dinámicamente (ROI: +2)

## Problema

Las URLs de búsqueda de vehículos usan códigos internos no intuitivos:
- `/armenia/buscar-vehiculos/lugar-recogida/aarme/...`
- Códigos como "aarme", "aabot" no son legibles para usuarios, SEO, ni LLMs

## Solución

Reemplazar códigos por slugs legibles basados en nombres de sucursales:
- `/armenia/buscar-vehiculos/lugar-recogida/armenia-aeropuerto/...`
- Slug generado dinámicamente desde el nombre sin duplicar datos

## Arquitectura

### 1. Función Slugify

**Ubicación**: `packages/logic/src/utils/slugify.ts`

```typescript
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

**Características**:
- Normaliza acentos: "José" → "jose"
- Convierte espacios a guiones
- Elimina caracteres especiales
- Maneja casos edge (espacios múltiples, guiones duplicados)

### 2. Store: Búsqueda por Slug

**Modificaciones en `useStoreAdminData.ts`**:

```typescript
import { slugify } from '../utils/slugify';

const sortedBranches = computed<BranchData[] | []>(() =>
  branches
    ? [...branches].map(branch => ({
        ...branch,
        slug: slugify(branch.name)
      })).sort((a, b) => a.name.localeCompare(b.name))
    : []
);

function searchBranchBySlug(slug: string): BranchData | undefined {
  return sortedBranches.value.find(
    (branch: BranchData) => slugify(branch.name) === slug
  );
}

function isBranchSlug(slug: string): boolean {
  return searchBranchBySlug(slug) !== undefined;
}
```

**Principio clave**: El slug se calcula en runtime, no se almacena en config. `branches.config.ts` permanece como única fuente de verdad.

### 3. Generación de URLs

**Modificaciones en `useSearch.ts`**:

```typescript
const searchLinkParams = computed(() => {
  const pickupBranch = searchBranchByCode(lugarRecogida.value ?? '');
  const returnBranch = searchBranchByCode(lugarDevolucion.value ?? '');

  return {
    referido: referido.value,
    lugar_recogida: pickupBranch?.slug,
    lugar_devolucion: returnBranch?.slug,
    fecha_recogida: fechaRecogida.value,
    fecha_devolucion: fechaDevolucion.value,
    hora_recogida: horaRecogida.value,
    hora_devolucion: horaDevolucion.value,
  };
});
```

### 4. Valores por Defecto

**Modificaciones en `useDefaultRouteParams.ts`**:

```typescript
const defaultBranchSlug = 'bogota-aeropuerto'; // antes era 'AABOT'
const defaultLugarRecogida = ref<string | null>(defaultBranchSlug);
const defaultLugarDevolucion = ref<string | null>(defaultBranchSlug);
```

### 5. Validación en Middleware

**Modificaciones en `validateSearchParams.ts`** (x3 packages):

```typescript
const lugar_recogida = to.params.lugar_recogida as string;
const lugar_devolucion = to.params.lugar_devolucion as string;

const { searchBranchBySlug } = useStoreAdminData();
const pickupBranch = searchBranchBySlug(lugar_recogida);
const returnBranch = searchBranchBySlug(lugar_devolucion);

if (!pickupBranch || !returnBranch) {
  const { defaultLugarRecogida, defaultLugarDevolucion } = useDefaultRouteParams();

  to.params.lugar_recogida = defaultLugarRecogida.value;
  to.params.lugar_devolucion = defaultLugarDevolucion.value;

  createMessage({
    type: "info",
    message: "Ubicación inválida. Se ajustó a la sede por defecto.",
  });

  return navigateTo({ name: to.name, params: to.params });
}
```

### 6. Lectura de Route Params

**Modificaciones en composable que lee route params**:

```typescript
const route = useRoute();
const slugRecogida = route.params.lugar_recogida as string;
const slugDevolucion = route.params.lugar_devolucion as string;

const { searchBranchBySlug } = storeAdminData;
const branchRecogida = searchBranchBySlug(slugRecogida);
const branchDevolucion = searchBranchBySlug(slugDevolucion);

if (branchRecogida) lugarRecogida.value = branchRecogida.code;
if (branchDevolucion) lugarDevolucion.value = branchDevolucion.code;
```

## Flujo de Datos

```
URL con slug
    ↓
[Middleware] Valida slug existe
    ↓
[Route Params Reader] slug → código (AABOT)
    ↓
[Store Interno] Usa códigos
    ↓
[Link Generator] código → slug
    ↓
Nueva URL con slug
```

## Ejemplos de Slugs Generados

- "Armenia Aeropuerto" → `armenia-aeropuerto`
- "Barranquilla Aeropuerto" → `barranquilla-aeropuerto`
- "Medellín Aeropuerto José María Córdoba" → `medellin-aeropuerto-jose-maria-cordoba`
- "Bogotá Almacén Éxito del Country" → `bogota-almacen-exito-del-country`
- "Cali Norte Chipichape" → `cali-norte-chipichape`

## Testing

### Unit Tests

```typescript
// slugify.test.ts
describe('slugify', () => {
  it('converts basic text', () => {
    expect(slugify('Armenia Aeropuerto')).toBe('armenia-aeropuerto');
  });

  it('handles accents', () => {
    expect(slugify('Medellín José María')).toBe('medellin-jose-maria');
  });

  it('handles special characters', () => {
    expect(slugify('Almacén Éxito')).toBe('almacen-exito');
  });
});
```

### Integration Tests

```typescript
// useStoreAdminData.test.ts
it('searchBranchBySlug finds branch', () => {
  const branch = searchBranchBySlug('armenia-aeropuerto');
  expect(branch?.code).toBe('AARME');
});

it('isBranchSlug validates correctly', () => {
  expect(isBranchSlug('armenia-aeropuerto')).toBe(true);
  expect(isBranchSlug('invalid')).toBe(false);
});
```

## Archivos Modificados

1. **Nuevo**: `packages/logic/src/utils/slugify.ts`
2. **Modificar**: `packages/logic/src/utils/index.ts`
3. **Modificar**: `packages/logic/src/stores/useStoreAdminData.ts`
4. **Modificar**: `packages/logic/src/composables/useSearch.ts`
5. **Modificar**: `packages/logic/src/composables/useDefaultRouteParams.ts`
6. **Modificar**: `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts`
7. **Modificar**: `packages/ui-alquilame/app/middleware/validateSearchParams.ts`
8. **Modificar**: `packages/ui-alquicarros/app/middleware/validateSearchParams.ts`
9. **Modificar**: Composable que lee route params (identificar cual es)

## Consideraciones

### Ventajas
- ✅ URLs legibles y amigables con SEO
- ✅ Mejor experiencia para LLMs
- ✅ Cero duplicación de datos (slug calculado dinámicamente)
- ✅ Single source of truth (branches.config.ts)
- ✅ Todos los slugs son únicos (verificado manualmente)

### Desventajas
- ⚠️ Rompe URLs existentes (sin retrocompatibilidad por decisión de diseño)
- ⚠️ Slugify se ejecuta en cada acceso (overhead mínimo, aceptable)

### Mitigaciones
- Impacto de URLs rotas es aceptable según decisión de usuario
- Overhead de slugify es negligible (<1ms por operación)
