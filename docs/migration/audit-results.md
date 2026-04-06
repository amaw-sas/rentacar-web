# Auditoría de Código - Migración a Monorepo

**Fecha:** 2026-01-20
**Proyecto:** rentacar-main (alquilatucarro.com)
**Objetivo:** Identificar código compartido vs específico por marca

---

## Resumen Ejecutivo

| Categoría | Total Archivos | Compartido (Logic) | Específico (UI) | Mixto |
|-----------|----------------|-------------------|-----------------|-------|
| **Composables** | 25 | 25 (100%) | 0 (0%) | 0 |
| **Stores** | 3 | 3 (100%) | 0 (0%) | 0 |
| **Utils/Types** | 50+ | 50+ (100%) | 0 (0%) | 0 |
| **Components** | 47 | 0 (0%) | 47 (100%) | 0 |
| **Pages** | 25+ | 0 (0%) | 25+ (100%) | 0 |
| **Layouts** | ~3 | 0 (0%) | 3 (100%) | 0 |
| **Config** | 1 | ~60% | ~40% | 1 |

### Conclusión Principal

✅ **Separación clara:** ~95% del código ya está naturalmente separado
- Lógica de negocio: 100% compartida
- Presentación: 100% específica
- Solo `app.config.ts` requiere división manual

---

## 1. Archivos Compartidos → `packages/logic/`

### 1.1. Composables (25 archivos)

**Ubicación actual:** `app/composables/*.ts`
**Destino:** `packages/logic/src/composables/`

| Archivo | Función | Complejidad | Notas |
|---------|---------|-------------|-------|
| `useCategory.ts` | Gestión de categorías de vehículos | Alta (16KB) | Lógica crítica |
| `useCityContent.ts` | Contenido dinámico por ciudad | Alta (57KB) | Altamente compartido |
| `useCityFAQs.ts` | FAQs por ciudad | Alta (37KB) | Altamente compartido |
| `useVehicleCategories.ts` | Categorías de vehículos | Alta (35KB) | Lógica crítica |
| `useSearch.ts` | Motor de búsqueda | Media (7KB) | Lógica crítica |
| `useBaseSEO.ts` | SEO base | Baja (3KB) | Compartido |
| `useCityPageSEO.ts` | SEO por ciudad | Baja (1.7KB) | Compartido |
| `useSearchPageSEO.ts` | SEO búsqueda | Baja (1.1KB) | Compartido |
| `useAggregateRating.ts` | Rating agregado | Baja (3.7KB) | Schema.org |
| `useBreadcrumbs.ts` | Breadcrumbs SEO | Baja (1.3KB) | SEO |
| `useCityProductSchema.ts` | Schema producto ciudad | Media (4.5KB) | Schema.org |
| `useCityRelations.ts` | Relaciones entre ciudades | Media (6KB) | Lógica compartida |
| `useLocalBusiness.ts` | Schema negocio local | Baja (2.7KB) | Schema.org |
| `useProductSchema.ts` | Schema producto | Media (4.4KB) | Schema.org |
| `usePromotionSchema.ts` | Schema promoción | Baja (3.3KB) | Schema.org |
| `useVideoSchema.ts` | Schema video | Baja (2.3KB) | Schema.org |
| `useRecordReservationForm.ts` | Formulario reserva | Media (3.9KB) | Lógica crítica |
| `useSearchByRouteParams.ts` | Búsqueda por params | Baja (900B) | Routing |
| `useDefaultRouteParams.ts` | Params por defecto | Baja (1KB) | Routing |
| `useFetchCategoriesAvailabilityData.ts` | Fetch disponibilidad | Baja (1.1KB) | API |
| `useFetchRentacarData.ts` | Fetch datos rentacar | Baja (200B) | API |
| `useData.ts` | Utilidad datos | Baja (300B) | Utility |
| `useMessages.ts` | Gestión mensajes | Baja (1.3KB) | UI state |
| `useMoneyFormat.ts` | Formateo moneda | Baja (300B) | Formatter |
| `usePhoneField.ts` | Campo teléfono | Baja (730B) | Form field |

**Total:** ~250KB de lógica compartida

**Organización recomendada:**

```
packages/logic/src/composables/
├── api/
│   ├── useFetchCategoriesAvailabilityData.ts
│   ├── useFetchRentacarData.ts
│   └── index.ts
├── business/
│   ├── useCategory.ts
│   ├── useVehicleCategories.ts
│   ├── useSearch.ts
│   ├── useRecordReservationForm.ts
│   └── index.ts
├── content/
│   ├── useCityContent.ts
│   ├── useCityFAQs.ts
│   ├── useCityRelations.ts
│   └── index.ts
├── seo/
│   ├── useBaseSEO.ts
│   ├── useCityPageSEO.ts
│   ├── useSearchPageSEO.ts
│   ├── useBreadcrumbs.ts
│   └── index.ts
├── schema/
│   ├── useAggregateRating.ts
│   ├── useCityProductSchema.ts
│   ├── useLocalBusiness.ts
│   ├── useProductSchema.ts
│   ├── usePromotionSchema.ts
│   ├── useVideoSchema.ts
│   └── index.ts
├── utils/
│   ├── useMessages.ts
│   ├── useMoneyFormat.ts
│   ├── usePhoneField.ts
│   ├── useData.ts
│   ├── useDefaultRouteParams.ts
│   ├── useSearchByRouteParams.ts
│   └── index.ts
└── index.ts
```

### 1.2. Stores Pinia (3 archivos)

**Ubicación actual:** `app/stores/*.ts`
**Destino:** `packages/logic/src/stores/`

| Archivo | Función | Estado | Notas |
|---------|---------|--------|-------|
| `useStoreSearchData.ts` | Store de búsqueda | Global (8KB) | 100% compartido |
| `useStoreReservationForm.ts` | Store de reserva | Global (8KB) | 100% compartido |
| `useStoreAdminData.ts` | Store admin/SEO | Global (1KB) | 100% compartido |

**Total:** ~17KB de estado global compartido

**Organización:**

```
packages/logic/src/stores/
├── useStoreSearchData.ts
├── useStoreReservationForm.ts
├── useStoreAdminData.ts
└── index.ts
```

### 1.3. Utils y Types (50+ archivos)

**Ubicación actual:** `app/utils/**/*.ts`
**Destino:** `packages/logic/src/utils/`

**Types - Data:**
- `CategoryAvailabilityData.ts`
- `RecordReservationApiData.ts`
- `ReservationApiStatus.ts`
- `CategoryMonthPriceData.ts`
- `BranchData.ts`
- `CategoryData.ts`
- `ReservasApiData.ts`
- `LocalizaErrorResponse.ts`
- `VehicleCategoryData.ts`
- `InsuranceTypeData.ts`
- `CategoryModelData.ts`
- `PageConfigData.ts`

**Types - Type:**
- `CategoryType.ts`
- `City.ts`
- `ErrorMessage.ts`
- `Message.ts`
- `BlogPost.ts`
- `Faq.ts`
- `IdentificationType.ts`
- `Testimonial.ts`
- `MonthlyMileage.ts`

**Types - Fields:**
- `FormFields.ts`
- `FormRecordFields.ts`
- `FormSubmitFields.ts`

**Organización:**

```
packages/logic/src/utils/
├── types/
│   ├── data/
│   │   ├── CategoryAvailabilityData.ts
│   │   ├── BranchData.ts
│   │   └── ... (todos los data types)
│   ├── type/
│   │   ├── City.ts
│   │   ├── CategoryType.ts
│   │   └── ... (todos los types)
│   ├── fields/
│   │   ├── FormFields.ts
│   │   └── ... (todos los form fields)
│   └── index.ts
└── index.ts
```

### 1.4. Config Compartida (extraída de app.config.ts)

**Datos a extraer:**

```typescript
// Compartido (60% del archivo)
- cities: City[] (lista de ciudades)
- cityFAQs: Record<string, FAQ[]> (FAQs por ciudad)
- vehicleCategories: VehicleCategory[] (categorías de vehículos)
- insuranceTypes: InsuranceType[] (tipos de seguro)
- identificationTypes: IdentificationType[] (tipos de ID)
- monthlyMileages: MonthlyMileage[] (kilometrajes mensuales)
```

**Destino:**

```
packages/logic/src/config/
├── cities.ts
├── faqs.ts
├── vehicleCategories.ts
├── insuranceTypes.ts
├── identificationTypes.ts
├── monthlyMileages.ts
└── index.ts
```

---

## 2. Archivos Específicos → `packages/ui-{marca}/`

### 2.1. Components (47 archivos)

**Ubicación actual:** `app/components/**/*.vue`
**Destino:** `packages/ui-{marca}/app/components/`

**Componentes principales:**
- `Carrusel.vue` - Carrusel de imágenes
- `CategoryCard.vue` - Tarjeta de categoría (27KB)
- `CategorySelectionSection.vue` - Sección selección (12KB)
- `CategoryTags.vue` - Tags de categoría
- `ChatWidget.vue` - Widget de chat
- `CityPage.vue` - Página de ciudad (19KB)
- `Logo.vue` - Logo de marca (9KB) **[ESPECÍFICO POR MARCA]**
- `ReservationForm.vue` - Formulario de reserva
- `ReservationFormSection.vue` - Sección formulario
- `ReservationResume.vue` - Resumen de reserva
- `Searcher.vue` - Buscador (12KB)
- `SelectBranch.vue` - Selector de sucursal

**Directorios:**
- `Hero/` - Hero sections **[ESPECÍFICO POR MARCA]**
- `Icons/` - Iconos custom
- `Images/` - Imágenes **[ESPECÍFICO POR MARCA]**
- `Placeholders/` - Placeholders
- `seo/` - Componentes SEO

**Evaluación:**
- ❌ No mover a logic - Son presentación pura
- ⚠️ Algunos pueden tener diseño diferente por marca (Logo, Hero, Images)
- ✅ Mantener en cada UI package

### 2.2. Pages (25+ archivos)

**Ubicación actual:** `app/pages/**/*.vue`
**Destino:** `packages/ui-{marca}/app/pages/`

**Páginas principales:**
- `index.vue` - Home page
- `[city]/index.vue` - Página de ciudad
- `[city]/buscar-vehiculos/...` - Búsqueda de vehículos
- `blog/index.vue` - Blog
- `blog/[...slug].vue` - Post de blog
- `seo/index.vue` - Dashboard SEO
- `seo/competidores.vue` - SEO competidores
- `seo/keywords.vue` - SEO keywords
- `seo/backlinks.vue` - SEO backlinks
- `seo/contenido.vue` - SEO contenido
- `seo/tareas.vue` - SEO tareas
- `seo/herramientas.vue` - SEO herramientas
- `seo/rendimiento.vue` - SEO rendimiento
- `seo/login.vue` - Login SEO
- `reservado/[reserveCode]/index.vue` - Reserva confirmada
- `pendiente.vue` - Reserva pendiente
- `sindisponibilidad.vue` - Sin disponibilidad
- `terminos-condiciones.vue` - Términos y condiciones
- `politica-privacidad.vue` - Política de privacidad
- `gana/index.vue` - Programa referidos
- `gana/terminos-condiciones.vue` - Términos referidos
- `gana/politicas-privacidad.vue` - Políticas referidos

**Evaluación:**
- ❌ No mover a logic - Son presentación pura
- ✅ Mantener en cada UI package
- ⚠️ Algunas pueden tener diseño diferente por marca

### 2.3. Layouts

**Ubicación actual:** `app/layouts/*.vue`
**Destino:** `packages/ui-{marca}/app/layouts/`

**Evaluación:**
- ❌ No mover a logic - Son presentación
- ⚠️ Probablemente diferentes por marca (header, footer, branding)
- ✅ Mantener en cada UI package

### 2.4. Middleware

**Ubicación actual:** `app/middleware/*.ts`
**Destino:** Evaluar caso por caso

**Archivos:**
- `seo-auth.ts` - Auth para dashboard SEO
- `validateCityParams.ts` - Validación de parámetros de ciudad
- `validateSearchParams.ts` - Validación de parámetros de búsqueda

**Evaluación:**
- ✅ `validateCityParams.ts` → `packages/logic/src/middleware/` (100% compartido)
- ✅ `validateSearchParams.ts` → `packages/logic/src/middleware/` (100% compartido)
- ⚠️ `seo-auth.ts` → Depende si las credenciales son por marca o globales

### 2.5. Config Específica (en app.config.ts)

**Datos específicos (40% del archivo):**

```typescript
// Específico por marca
- ui: {} (configuración Nuxt UI - tema, colores, componentes)
- franchise: {
    name: string (alquilatucarro.com vs alquilame.com)
    shortname: string
    logo: string (URL del logo)
    primaryColor: string
    secondaryColor: string
    contactEmail: string
    contactPhone: string
    socialMedia: {}
  }
```

**Destino:** `packages/ui-{marca}/app/app.config.ts`

---

## 3. Archivos Mixtos (Requieren División)

### 3.1. app.config.ts

**Ubicación actual:** `app/app.config.ts` (108KB)
**Acción:** Dividir en compartido + específico

**División recomendada:**

**Compartido → `packages/logic/src/config/`:**
```typescript
// packages/logic/src/config/cities.ts
export const cities: City[] = [...]

// packages/logic/src/config/faqs.ts
export const cityFAQs: Record<string, FAQ[]> = {...}

// packages/logic/src/config/vehicleCategories.ts
export const vehicleCategories: VehicleCategory[] = [...]

// packages/logic/src/config/insuranceTypes.ts
export const insuranceTypes: InsuranceType[] = [...]
```

**Específico → `packages/ui-{marca}/app/app.config.ts`:**
```typescript
import { cities, cityFAQs, vehicleCategories, insuranceTypes } from '@logic/config'

export default defineAppConfig({
  // Config UI (Nuxt UI theme)
  ui: {
    slideover: {...},
    // ... resto config UI
  },

  // Datos desde logic
  cities,
  faqs: cityFAQs,
  vehicleCategories,
  insuranceTypes,

  // Datos específicos de marca
  franchise: {
    name: 'alquilatucarro.com', // ← Diferente por marca
    shortname: 'alquilatucarro',
    logo: 'https://...',
    primaryColor: '#FF5733',
    // ...
  }
})
```

---

## 4. Archivos Adicionales

### 4.1. Server API

**Ubicación:** `server/api/**/*.ts`
**Evaluación:** Requiere inspección

**Acción recomendada:**
1. Listar archivos: `find server/api -type f`
2. Identificar si hay lógica compartida vs específica
3. Probablemente TODO compartido → `packages/logic/src/server/`

### 4.2. Public Assets

**Ubicación:** `public/**/*`
**Evaluación:** 100% específico por marca

**Archivos típicos:**
- Logos
- Favicons
- Imágenes de marca
- Robots.txt (puede tener URLs específicas)
- Sitemap.xml (URLs específicas)

**Destino:** `packages/ui-{marca}/public/`

---

## 5. Resumen de Migración

### Archivos a Mover

| Origen | Destino | Archivos | Tamaño |
|--------|---------|----------|--------|
| `app/composables/` | `packages/logic/src/composables/` | 25 | ~250KB |
| `app/stores/` | `packages/logic/src/stores/` | 3 | ~17KB |
| `app/utils/` | `packages/logic/src/utils/` | 50+ | ~100KB |
| `app/app.config.ts` (60%) | `packages/logic/src/config/` | 1 → 6 | ~65KB |
| `app/middleware/` (parcial) | `packages/logic/src/middleware/` | 2-3 | ~5KB |

**Total lógica compartida:** ~437KB en 85+ archivos

### Archivos a Mantener en UI

| Origen | Destino | Archivos |
|--------|---------|----------|
| `app/components/` | `packages/ui-{marca}/app/components/` | 47 |
| `app/pages/` | `packages/ui-{marca}/app/pages/` | 25+ |
| `app/layouts/` | `packages/ui-{marca}/app/layouts/` | 3 |
| `app/app.config.ts` (40%) | `packages/ui-{marca}/app/app.config.ts` | 1 |
| `public/` | `packages/ui-{marca}/public/` | Muchos |

---

## 6. Riesgos Identificados

### Riesgo Alto

❌ **app.config.ts es enorme (108KB)**
- Separar manualmente requiere cuidado
- Alto riesgo de romper imports

**Mitigación:**
1. Crear tests antes de dividir
2. Dividir incrementalmente
3. Verificar en dev después de cada paso

### Riesgo Medio

⚠️ **Algunos composables pueden tener dependencias circulares**
- Ejemplo: `useCategory` → `useVehicleCategories` → `useCategory`

**Mitigación:**
1. Mapear dependencias antes de mover
2. Refactorizar si es necesario

### Riesgo Bajo

✅ **La mayoría del código ya está bien separado**
- Composables no tienen lógica de UI
- Components no tienen lógica de negocio
- Stores son globales

---

## 7. Próximos Pasos

### Fase 0: Preparación
1. ✅ Auditoría completada
2. ⏳ Crear backup completo
3. ⏳ Crear branch `migration/monorepo`

### Fase 1: Estructura
1. ⏳ Crear estructura de monorepo
2. ⏳ Configurar pnpm workspace
3. ⏳ Crear package `@rentacar-main/logic`

### Fase 2: Migrar Lógica
1. ⏳ Mover composables (organizados por carpeta)
2. ⏳ Mover stores
3. ⏳ Mover utils/types
4. ⏳ Dividir app.config.ts
5. ⏳ Mover middleware compartido

### Fase 3: Crear UI Packages
1. ⏳ Crear `ui-alquilatucarro`
2. ⏳ Crear `ui-alquilame`
3. ⏳ Crear `ui-alquicarros`

### Fase 4: Testing
1. ⏳ Verificar que compila
2. ⏳ Verificar que HMR funciona
3. ⏳ Testing manual de las 3 marcas

---

## 8. Métricas de Complejidad

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Archivos compartidos** | 85+ | ✅ Clara separación |
| **Archivos específicos** | 75+ | ✅ Clara separación |
| **Archivos mixtos** | 1 | ⚠️ Requiere división manual |
| **Tamaño lógica compartida** | ~437KB | ✅ Manejable |
| **Complejidad migración** | Media-Alta | ⚠️ Requiere cuidado |
| **Riesgo de romper funcionalidad** | Bajo-Medio | ⚠️ Con testing adecuado |
| **Tiempo estimado migración** | 15-20 días | ⚠️ Con 1 persona full-time |

---

## Conclusiones

### ✅ Fortalezas

1. **Arquitectura ya casi separada:** El código actual ya sigue buenas prácticas
2. **Composables puros:** No hay mezcla de lógica y presentación
3. **Stores globales:** Pinia stores son perfectos para compartir
4. **Types bien definidos:** Sistema de tipos robusto

### ⚠️ Desafíos

1. **app.config.ts gigante:** Requiere división manual cuidadosa
2. **Testing manual:** No hay tests automatizados para verificar migración
3. **3 marcas simultáneas:** Multiplicar trabajo x3

### 🎯 Recomendación

**Proceder con la migración a monorepo (Opción 2)**

**Razones:**
- Arquitectura actual facilita la migración
- Separación clara entre lógica y presentación
- ROI alto (12-15 horas/semana ahorradas)
- Riesgo manejable con testing adecuado

**Estrategia:**
1. Migrar incrementalmente (no big bang)
2. Empezar con `ui-alquilatucarro` (marca principal)
3. Validar antes de migrar otras marcas
4. Crear rollback plan

---

**Documento generado:** 2026-01-20
**Próxima revisión:** Después de Fase 0 (Preparación)
