# Guía de Desarrollo - Monorepo Multi-Marca

**Fecha:** 2026-01-20
**Proyecto:** rentacar-main (alquilatucarro.com)
**Versión:** 1.0.0

---

## Tabla de Contenidos

1. [Setup Inicial](#1-setup-inicial)
2. [Workflow Diario](#2-workflow-diario)
3. [Convenciones de Código](#3-convenciones-de-código)
4. [Dónde va cada Tipo de Código](#4-dónde-va-cada-tipo-de-código)
5. [Trabajar con Logic Package](#5-trabajar-con-logic-package)
6. [Trabajar con UI Packages](#6-trabajar-con-ui-packages)
7. [Testing](#7-testing)
8. [Debugging](#8-debugging)
9. [Git Workflow](#9-git-workflow)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Setup Inicial

### 1.1. Requisitos

| Software | Versión Mínima | Verificación |
|----------|----------------|--------------|
| Node.js | 20.0.0 | `node -v` |
| pnpm | 9.0.0 | `pnpm -v` |
| Git | 2.0+ | `git --version` |

### 1.2. Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url> rentacar-main
cd rentacar-main

# 2. Instalar pnpm (si no está instalado)
npm install -g pnpm@latest

# 3. Instalar todas las dependencias
pnpm install

# 4. Verificar instalación
pnpm --filter @rentacar-main/logic typecheck
pnpm --filter ui-alquilatucarro typecheck

# ✅ Si todo compila sin errores, estás listo
```

### 1.3. Variables de Entorno

**Crear archivos .env por marca:**

```bash
# ui-alquilatucarro
cd packages/ui-alquilatucarro
cp .env.example .env.local
vim .env.local  # Agregar valores reales

# ui-alquilame
cd ../ui-alquilame
cp .env.example .env.local
vim .env.local

# ui-alquicarros
cd ../ui-alquicarros
cp .env.example .env.local
vim .env.local
```

**Ejemplo `.env.local`:**
```bash
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your-api-key-here

# Firebase
FIREBASE_PROJECT_ID=alquilatucarro
FIREBASE_API_KEY=your-firebase-key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
FACEBOOK_PIXEL_ID=1234567890

# Feature Flags
ENABLE_CHAT_WIDGET=true
ENABLE_SEO_DASHBOARD=true
```

### 1.4. Comandos Útiles

```bash
# Instalar dependencias en root
pnpm install

# Instalar en package específico
pnpm --filter ui-alquilatucarro add <package>

# Actualizar todas las dependencias
pnpm update

# Limpiar caches
pnpm clean
```

---

## 2. Workflow Diario

### 2.1. Desarrollo Local

**Opción 1: Desarrollar una marca específica**
```bash
# Terminal 1: Marca principal
pnpm dev:alquilatucarro

# Acceder en http://localhost:3000
```

**Opción 2: Desarrollar todas las marcas simultáneamente**
```bash
# Terminal 1: Todas las marcas en paralelo
pnpm dev:all

# Acceder en:
# - http://localhost:3000 (alquilatucarro)
# - http://localhost:3001 (alquilame)
# - http://localhost:3002 (alquicarros)
```

**Opción 3: Desarrollo granular**
```bash
# Terminal 1: alquilatucarro
cd packages/ui-alquilatucarro
pnpm dev

# Terminal 2: alquilame
cd packages/ui-alquilame
pnpm dev --port 3001

# Terminal 3: alquicarros
cd packages/ui-alquicarros
pnpm dev --port 3002
```

### 2.2. Escenarios Comunes

#### Escenario 1: Cambio en Lógica Compartida

**Ejemplo:** Arreglar bug en validación de formulario de reserva

```bash
# 1. Editar lógica
vim packages/logic/src/composables/business/useRecordReservationForm.ts

# 2. Guardar
# ✅ HMR automático - Las 3 marcas se actualizan instantáneamente

# 3. Verificar en dev servers
# - Abrir localhost:3000, 3001, 3002
# - Probar formulario en cada marca

# 4. Commit
git add packages/logic/src/composables/business/useRecordReservationForm.ts
git commit -m "fix(logic): reservation form validation"
```

**Ventajas:**
- ✅ 1 cambio → 3 marcas actualizadas
- ✅ HMR instantáneo
- ✅ Zero merge conflicts
- ✅ Consistency garantizada

#### Escenario 2: Cambio en Diseño de Una Marca

**Ejemplo:** Nuevo diseño de hero para alquilame

```bash
# 1. Editar componente específico
vim packages/ui-alquilame/app/components/Hero/HeroHome.vue

# 2. Guardar
# ✅ Solo alquilame se actualiza

# 3. Verificar
# - Abrir localhost:3001
# - Otras marcas no afectadas (3000, 3002)

# 4. Commit
git add packages/ui-alquilame/app/components/Hero/HeroHome.vue
git commit -m "feat(alquilame): new hero design"
```

**Ventajas:**
- ✅ Cambio aislado a una marca
- ✅ Otras marcas no afectadas
- ✅ Deploy independiente

#### Escenario 3: Cambio Mixto (Lógica + UI)

**Ejemplo:** Nueva feature de filtrado de vehículos

```bash
# 1. Crear lógica compartida
vim packages/logic/src/composables/business/useVehicleFilters.ts

# 2. Crear UI en marca principal
vim packages/ui-alquilatucarro/app/components/VehicleFilters.vue

# 3. Verificar en alquilatucarro
# - Abrir localhost:3000
# - Probar feature

# 4. Replicar UI en otras marcas (si aplica)
cp packages/ui-alquilatucarro/app/components/VehicleFilters.vue \
   packages/ui-alquilame/app/components/

# 5. Personalizar por marca (si aplica)
vim packages/ui-alquilame/app/components/VehicleFilters.vue

# 6. Commit
git add packages/logic/src/composables/business/useVehicleFilters.ts
git add packages/ui-*/app/components/VehicleFilters.vue
git commit -m "feat: vehicle filters"
```

#### Escenario 4: Hotfix Urgente

**Ejemplo:** Bug crítico en producción

```bash
# 1. Identificar dónde está el bug
# - ¿En lógica? → packages/logic/
# - ¿En UI? → packages/ui-{marca}/

# 2. Fix en logic (si aplica)
vim packages/logic/src/composables/business/useCategory.ts
git add packages/logic/src/composables/business/useCategory.ts
git commit -m "fix(logic): critical category bug"

# 3. Build marca afectada
cd packages/ui-alquilatucarro
pnpm build

# 4. Deploy urgente
firebase deploy --only hosting

# 5. Repetir para otras marcas
cd ../ui-alquilame
pnpm build
firebase deploy --only hosting --project alquilame

# ✅ Tiempo total: 15 minutos (vs 2 horas antes)
```

---

## 3. Convenciones de Código

### 3.1. Reglas de Oro

| Regla | ✅ BIEN | ❌ MAL |
|-------|---------|--------|
| **1. Lógica en Logic** | `packages/logic/src/composables/` | Lógica en `.vue` files |
| **2. Presentación en UI** | `packages/ui-*/app/components/` | Componentes en logic |
| **3. Estado en Stores** | `packages/logic/src/stores/` | Estado en composables |
| **4. Tipos Compartidos** | `packages/logic/src/utils/types/` | Types duplicados en UI |
| **5. Config Compartida** | `packages/logic/src/config/` | Config duplicada en UI |

### 3.2. Separación de Responsabilidades

**Componentes (UI Packages):**
```vue
<script setup lang="ts">
// ✅ BIEN: Delegar a composables
const { categories, isLoading, fetchCategories } = useVehicleCategories()
const { formatCurrency } = useMoneyFormat()

const handleClick = () => {
  fetchCategories()
}
</script>

<template>
  <div>
    <button @click="handleClick" :disabled="isLoading">
      Cargar Categorías
    </button>

    <div v-for="cat in categories" :key="cat.id">
      {{ cat.name }} - {{ formatCurrency(cat.price) }}
    </div>
  </div>
</template>
```

**Composables (Logic Package):**
```typescript
// ✅ BIEN: Lógica pura, sin dependencias de UI
export function useVehicleCategories() {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)

  const fetchCategories = async () => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/categories')
      categories.value = response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchCategories()
  })

  return {
    categories: readonly(categories),
    isLoading: readonly(isLoading),
    fetchCategories
  }
}
```

### 3.3. Naming Conventions

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Composables | `use{Noun}.ts` | `useSearch.ts` |
| Composables (Action) | `use{Verb}{Noun}.ts` | `useFetchCategories.ts` |
| Stores | `useStore{Noun}.ts` | `useStoreSearchData.ts` |
| Components | `{Noun}.vue` | `SearchForm.vue` |
| Components (Base) | `Base{Noun}.vue` | `BaseButton.vue` |
| Types (Data) | `{Noun}Data.ts` | `CategoryData.ts` |
| Types (Domain) | `{Noun}.ts` | `City.ts` |
| Utils | `{verb}{Noun}.ts` | `formatCurrency.ts` |

### 3.4. Import Conventions

**Auto-imports (Preferido):**
```typescript
// ✅ Auto-importado por Nuxt
const { categories } = useVehicleCategories()
const { cities } = useAppConfig()
```

**Explicit imports:**
```typescript
// ✅ Import explícito cuando auto-import no funciona
import { useSearch } from '@logic/composables/business/useSearch'
import type { City } from '@logic/utils/types/type/City'
import { cities } from '@logic/config/cities'
```

**Path aliases:**
```typescript
// Disponibles en UI packages
import Foo from '@/components/Foo.vue'      // → app/components/Foo.vue
import Bar from '~/components/Bar.vue'      // → app/components/Bar.vue
import { baz } from '@logic/composables/baz' // → ../logic/src/composables/baz
```

---

## 4. Dónde va cada Tipo de Código

### 4.1. Decision Tree

```
¿Este código necesita acceder a lógica de negocio?
│
├─ NO → ¿Es presentación pura (template, estilos)?
│       │
│       ├─ SÍ → packages/ui-{marca}/app/components/
│       │
│       └─ NO → ¿Es configuración de marca (logo, colores)?
│               │
│               └─ SÍ → packages/ui-{marca}/app/app.config.ts
│
└─ SÍ → ¿Es compartido entre todas las marcas?
        │
        ├─ SÍ → packages/logic/src/
        │       │
        │       ├─ Composable → composables/
        │       ├─ Store → stores/
        │       ├─ Type → utils/types/
        │       ├─ Config → config/
        │       └─ Util → utils/
        │
        └─ NO → packages/ui-{marca}/app/composables/ (si es específico)
```

### 4.2. Tabla de Decisión

| Código | Pregunta | Ubicación |
|--------|----------|-----------|
| **API call** | ¿Es igual para todas las marcas? | SÍ → `logic/composables/api/` |
| **Validación** | ¿Es regla de negocio? | SÍ → `logic/composables/business/` |
| **Formato** | ¿Es función pura? | SÍ → `logic/utils/` |
| **Tipo** | ¿Se usa en múltiples lugares? | SÍ → `logic/utils/types/` |
| **Config** | ¿Es dato compartido? | SÍ → `logic/config/` |
| **Componente** | ¿Tiene lógica de negocio? | NO → `ui-{marca}/components/` |
| **Página** | ¿Es ruta específica? | SÍ → `ui-{marca}/pages/` |
| **Layout** | ¿Tiene branding? | SÍ → `ui-{marca}/layouts/` |
| **Asset** | ¿Es logo/imagen de marca? | SÍ → `ui-{marca}/public/` |

### 4.3. Ejemplos Prácticos

**Ejemplo 1: Nueva función de formateo de fecha**

```typescript
// ✅ UBICACIÓN: packages/logic/src/utils/formatDate.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}
```

**Razón:** Es función pura, compartida, sin dependencias de marca.

**Ejemplo 2: Nuevo botón de acción principal**

```vue
<!-- ✅ UBICACIÓN: packages/ui-alquilatucarro/app/components/PrimaryButton.vue -->
<script setup lang="ts">
defineProps<{
  label: string
  onClick: () => void
}>()
</script>

<template>
  <button
    @click="onClick"
    class="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
  >
    {{ label }}
  </button>
</template>
```

**Razón:** Tiene estilos específicos de marca (bg-orange-500).

**Ejemplo 3: Nuevo tipo para Promoción**

```typescript
// ✅ UBICACIÓN: packages/logic/src/utils/types/type/Promotion.ts
export interface Promotion {
  id: string
  title: string
  description: string
  discountPercentage: number
  validUntil: Date
}
```

**Razón:** Tipo compartido, usado en múltiples composables y componentes.

**Ejemplo 4: Nueva lista de ciudades**

```typescript
// ✅ UBICACIÓN: packages/logic/src/config/cities.ts
import type { City } from '../utils/types/type/City'

export const cities: City[] = [
  {
    id: 'bogota',
    name: 'Bogotá',
    slug: 'bogota',
    // ...
  },
  // ...
]
```

**Razón:** Datos compartidos entre todas las marcas.

---

## 5. Trabajar con Logic Package

### 5.1. Crear Nuevo Composable

```bash
# 1. Crear archivo
vim packages/logic/src/composables/business/usePromotion.ts
```

```typescript
// packages/logic/src/composables/business/usePromotion.ts
import type { Promotion } from '@/utils/types/type/Promotion'

export function usePromotion() {
  const promotions = ref<Promotion[]>([])
  const isLoading = ref(false)

  const fetchPromotions = async () => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/promotions')
      promotions.value = response.data
    } catch (error) {
      console.error('Error fetching promotions:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    promotions: readonly(promotions),
    isLoading: readonly(isLoading),
    fetchPromotions
  }
}
```

```bash
# 2. Exportar en index.ts
vim packages/logic/src/composables/business/index.ts
```

```typescript
// Agregar
export * from './usePromotion'
```

```bash
# 3. Usar en UI package (auto-importado)
vim packages/ui-alquilatucarro/app/pages/promociones.vue
```

```vue
<script setup lang="ts">
// ✅ Auto-importado
const { promotions, fetchPromotions } = usePromotion()

onMounted(() => {
  fetchPromotions()
})
</script>
```

### 5.2. Crear Nueva Store

```bash
# 1. Crear store
vim packages/logic/src/stores/useStorePromotion.ts
```

```typescript
import { defineStore } from 'pinia'
import type { Promotion } from '@/utils/types/type/Promotion'

export const useStorePromotion = defineStore('promotion', () => {
  const activePromotion = ref<Promotion | null>(null)

  const setActivePromotion = (promotion: Promotion) => {
    activePromotion.value = promotion
  }

  const clearActivePromotion = () => {
    activePromotion.value = null
  }

  return {
    activePromotion: readonly(activePromotion),
    setActivePromotion,
    clearActivePromotion
  }
})
```

```bash
# 2. Exportar
vim packages/logic/src/stores/index.ts
```

```typescript
export * from './useStorePromotion'
```

### 5.3. Agregar Nuevo Tipo

```bash
# 1. Crear tipo
vim packages/logic/src/utils/types/type/Promotion.ts
```

```typescript
export interface Promotion {
  id: string
  title: string
  description: string
  discountPercentage: number
  validFrom: Date
  validUntil: Date
  vehicleCategoryIds?: string[]
}
```

```bash
# 2. Exportar
vim packages/logic/src/utils/types/type/index.ts
```

```typescript
export * from './Promotion'
```

---

## 6. Trabajar con UI Packages

### 6.1. Crear Nuevo Componente

```bash
# 1. Crear componente
vim packages/ui-alquilatucarro/app/components/PromotionCard.vue
```

```vue
<script setup lang="ts">
import type { Promotion } from '@logic/utils/types/type/Promotion'

const props = defineProps<{
  promotion: Promotion
}>()

const { formatDate } = useDateFormat()
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-xl font-bold">{{ promotion.title }}</h3>
    <p class="text-gray-600">{{ promotion.description }}</p>
    <div class="mt-4">
      <span class="text-orange-500 font-bold">
        {{ promotion.discountPercentage }}% OFF
      </span>
    </div>
    <div class="text-sm text-gray-500 mt-2">
      Válido hasta {{ formatDate(promotion.validUntil) }}
    </div>
  </div>
</template>
```

### 6.2. Crear Nueva Página

```bash
# 1. Crear página
vim packages/ui-alquilatucarro/app/pages/promociones/index.vue
```

```vue
<script setup lang="ts">
const { promotions, isLoading, fetchPromotions } = usePromotion()

onMounted(() => {
  fetchPromotions()
})

useSeoMeta({
  title: 'Promociones - Alquilatucarro',
  description: 'Descubre nuestras mejores promociones en alquiler de vehículos'
})
</script>

<template>
  <div class="container mx-auto py-12">
    <h1 class="text-4xl font-bold mb-8">Promociones</h1>

    <div v-if="isLoading" class="text-center">
      Cargando promociones...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PromotionCard
        v-for="promo in promotions"
        :key="promo.id"
        :promotion="promo"
      />
    </div>
  </div>
</template>
```

### 6.3. Personalizar por Marca

**Si el componente necesita ser diferente por marca:**

```bash
# alquilatucarro - Botón naranja
vim packages/ui-alquilatucarro/app/components/PromotionCard.vue
```

```vue
<template>
  <div class="bg-white rounded-lg">
    <!-- ... -->
    <button class="bg-orange-500 text-white">  <!-- Naranja -->
      Ver Promoción
    </button>
  </div>
</template>
```

```bash
# alquilame - Botón azul
vim packages/ui-alquilame/app/components/PromotionCard.vue
```

```vue
<template>
  <div class="bg-white rounded-lg">
    <!-- ... -->
    <button class="bg-blue-500 text-white">  <!-- Azul -->
      Ver Promoción
    </button>
  </div>
</template>
```

---

## 7. Testing

### 7.1. Testing de Logic Package

```bash
# Correr todos los tests de logic
pnpm --filter @rentacar-main/logic test

# Correr tests con watch mode
pnpm --filter @rentacar-main/logic test --watch

# Correr tests con coverage
pnpm --filter @rentacar-main/logic test --coverage
```

**Ejemplo de test:**
```typescript
// packages/logic/src/composables/__tests__/usePromotion.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePromotion } from '../business/usePromotion'

describe('usePromotion', () => {
  beforeEach(() => {
    // Setup
  })

  it('should initialize with empty promotions', () => {
    const { promotions } = usePromotion()
    expect(promotions.value).toEqual([])
  })

  it('should fetch promotions', async () => {
    const { promotions, fetchPromotions } = usePromotion()
    await fetchPromotions()
    expect(promotions.value.length).toBeGreaterThan(0)
  })
})
```

### 7.2. Testing de UI Packages

```bash
# Correr tests de una marca
pnpm --filter ui-alquilatucarro test

# Correr tests de todas las marcas
pnpm --filter "ui-*" test
```

---

## 8. Debugging

### 8.1. Debugging en Dev

**Vue DevTools:**
```bash
# 1. Instalar extensión de browser
# Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools/

# 2. Abrir dev server
pnpm dev:alquilatucarro

# 3. Abrir browser DevTools → Vue tab

# 4. Inspeccionar:
# - Components
# - Pinia stores
# - Router
```

**Console Logs:**
```typescript
// En composable
export function usePromotion() {
  const fetchPromotions = async () => {
    console.log('🚀 Fetching promotions...')
    const response = await $fetch('/api/promotions')
    console.log('✅ Promotions fetched:', response.data)
  }
}
```

### 8.2. Debugging Cross-Package

**Verificar que HMR funciona:**
```bash
# 1. Correr dev servers
pnpm dev:all

# 2. Editar composable
vim packages/logic/src/composables/business/usePromotion.ts
# Agregar console.log('LOGIC UPDATED')

# 3. Verificar en browsers
# - Abrir localhost:3000, 3001, 3002
# - Todos deben mostrar el console.log
```

---

## 9. Git Workflow

### 9.1. Commits Organizados

**Commit de lógica:**
```bash
git add packages/logic/src/composables/business/usePromotion.ts
git commit -m "feat(logic): add promotion composable"
```

**Commit de UI:**
```bash
git add packages/ui-alquilatucarro/app/components/PromotionCard.vue
git commit -m "feat(alquilatucarro): add promotion card component"
```

**Commit mixto:**
```bash
git add packages/logic/src/composables/business/usePromotion.ts
git add packages/ui-*/app/components/PromotionCard.vue
git commit -m "feat: add promotions feature

- Add usePromotion composable
- Add PromotionCard component for all brands"
```

### 9.2. Branches

**Feature branch:**
```bash
git checkout -b feature/promotions
# Desarrollar feature
git commit -m "feat: promotions"
git push origin feature/promotions
# Crear PR
```

**Hotfix:**
```bash
git checkout -b hotfix/critical-bug
# Fix bug
git commit -m "fix: critical bug"
git push origin hotfix/critical-bug
# Crear PR urgente
```

---

## 10. Troubleshooting

### 10.1. Problemas Comunes

**Problema:** "Cannot find module '@logic/composables/...'"

**Solución:**
```bash
# 1. Verificar que logic está instalado
pnpm --filter ui-alquilatucarro list @rentacar-main/logic

# 2. Reinstalar dependencias
pnpm install

# 3. Reiniciar dev server
pnpm dev:alquilatucarro
```

---

**Problema:** "HMR no funciona cross-package"

**Solución:**
```bash
# 1. Limpiar caches
pnpm clean

# 2. Reinstalar
pnpm install

# 3. Reiniciar dev servers
pnpm dev:all
```

---

**Problema:** "TypeScript errors en imports"

**Solución:**
```bash
# 1. Verificar tsconfig.json
cat packages/ui-alquilatucarro/tsconfig.json

# 2. Verificar que extends de root
# Debe contener: "extends": "../../tsconfig.json"

# 3. Reiniciar TS server en VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

**Problema:** "Build falla en CI/CD"

**Solución:**
```bash
# 1. Verificar que compila localmente
pnpm build

# 2. Verificar typecheck
pnpm typecheck

# 3. Verificar lint
pnpm lint

# 4. Si todo funciona local pero falla en CI:
# - Verificar versión de Node.js en CI
# - Verificar que pnpm-lock.yaml está committed
```

### 10.2. Comandos de Ayuda

```bash
# Listar todos los packages
pnpm list --depth 0

# Ver dependencias de un package
pnpm --filter ui-alquilatucarro list

# Verificar versiones
node -v
pnpm -v

# Limpiar todo
pnpm clean
rm -rf node_modules packages/*/node_modules
pnpm install

# Verificar workspace
pnpm -r exec pwd  # Lista todos los packages
```

---

## Recursos Adicionales

- [Arquitectura](./architecture.md) - Visión general de la arquitectura
- [Deployment](./deployment.md) - Guía de deployment
- [MIGRATION.md](../MIGRATION.md) - Detalles de migración

---

**Documento mantenido por:** Equipo de Desarrollo
**Última actualización:** 2026-01-20
