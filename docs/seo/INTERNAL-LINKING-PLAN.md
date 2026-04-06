# Plan de Internal Linking - alquilatucarro.com

**Fecha:** 2026-01-17
**Objetivo:** Aumentar de 33 a 500+ internal links
**Baseline Moz:** 33 internal follow links (vs 23K+ de rentingcolombia.com)

---

## Resumen Ejecutivo

### Estado Actual

| Página | Links Internos Salientes | Problema |
|--------|--------------------------|----------|
| Homepage (`/`) | ~5 (solo nav) | Sin enlaces a ciudades ni blog |
| City Pages (`/[city]`) | 4-8 (ciudades cercanas) | Sin enlaces a blog |
| Blog Index (`/blog`) | ~10 (posts) | Solo CTA a home |
| Blog Posts | 1-3 (a `/bogota`) | Sin cross-linking entre posts |
| Footer | 19 (ciudades) | `external=true` - pierde valor SEO |

### Meta: Estructura de Silo

```
                    Homepage (/)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   [Ciudades]        [Blog]       [Categorías]
        │               │               │
    /bogota         /blog/...      /compacto (futuro)
    /medellin                      /sedan (futuro)
    /cali                          /camioneta (futuro)
        │               │
   [Ciudades         [Posts
    Relacionadas]    Relacionados]
```

---

## Acciones Prioritarias

### PRIORIDAD 1: Quick Wins (ROI Alto, Esfuerzo Bajo)

#### 1.1 Corregir Footer - Remover `external=true`

**Archivo:** `app/layouts/default.vue`
**Línea:** ~82-88

**Antes:**
```vue
<UButton
  :to="getCityReservationURL(city)"
  :external="true"
  target="_blank"
```

**Después:**
```vue
<UButton
  :to="`/${city.id}`"
```

**Impacto:** +19 internal links inmediatos
**Esfuerzo:** 5 minutos

---

#### 1.2 Agregar Sección "Ciudades Destacadas" en Homepage

**Archivo:** `app/pages/index.vue`
**Ubicación:** Después de la sección de categorías

```vue
<!-- Ciudades Destacadas Section -->
<UPageSection id="ciudades" class="bg-gray-100 text-black">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
      <span class="text-red-700">Alquiler de carros</span>
      <span class="text-black"> en las principales ciudades</span>
    </h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <NuxtLink
        v-for="city in featuredCities"
        :key="city.id"
        :to="`/${city.id}`"
        class="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-lg transition-all"
      >
        <LocationIcon cls="text-red-600 size-8 mb-2" />
        <span class="font-semibold text-gray-900">{{ city.name }}</span>
      </NuxtLink>
    </div>
  </div>
</UPageSection>
```

**Impacto:** +10-19 internal links (ciudades principales)
**Esfuerzo:** 30 minutos

---

#### 1.3 Agregar Sección "Del Blog" en Homepage

**Archivo:** `app/pages/index.vue`
**Ubicación:** Antes de FAQs

```vue
<!-- Blog Section -->
<UPageSection id="blog-preview" class="bg-white text-black">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-2xl md:text-3xl font-bold text-center mb-4">
      <span class="text-red-700">Guías y Tips</span>
      <span class="text-black"> para tu viaje</span>
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in latestPosts"
        :key="post.path"
        :to="post.path"
        class="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all"
      >
        <img :src="post.image" :alt="post.alt" class="w-full aspect-video object-cover">
        <div class="p-4">
          <h3 class="font-bold group-hover:text-red-700">{{ post.title }}</h3>
        </div>
      </NuxtLink>
    </div>
    <div class="text-center mt-6">
      <NuxtLink to="/blog" class="text-red-700 font-semibold hover:underline">
        Ver todos los artículos →
      </NuxtLink>
    </div>
  </div>
</UPageSection>
```

**Impacto:** +4 internal links (3 posts + link a blog)
**Esfuerzo:** 45 minutos

---

### PRIORIDAD 2: Blog ↔ Ciudades (ROI Alto, Esfuerzo Medio)

#### 2.1 Agregar "Artículos Relacionados" en City Pages

**Archivo:** `app/components/CityPage.vue`
**Ubicación:** Después de sección "Ciudades Cercanas"

**Lógica:** Mostrar posts del blog que mencionen la ciudad

```typescript
// Mapeo de ciudades a posts relevantes
const cityBlogMapping: Record<string, string[]> = {
  'bogota': [
    '/blog/rutas-carro-desde-bogota',
    '/blog/pico-y-placa-colombia-2026',
    '/blog/requisitos-alquilar-carro-colombia'
  ],
  'medellin': [
    '/blog/eje-cafetero-en-carro-guia-completa',
    '/blog/requisitos-alquilar-carro-colombia'
  ],
  'cartagena': [
    '/blog/costa-caribe-cartagena-santa-marta-carro',
    '/blog/requisitos-alquilar-carro-colombia'
  ],
  'santa-marta': [
    '/blog/costa-caribe-cartagena-santa-marta-carro'
  ],
  // ... más ciudades
}
```

**Impacto:** +2-4 links por ciudad = +38-76 internal links
**Esfuerzo:** 2 horas

---

#### 2.2 Mejorar Links en Blog Posts

**Problema actual:** Los posts solo enlazan a `/bogota`

**Solución:** Agregar enlaces contextuales a ciudades mencionadas

**Ejemplo en `rutas-carro-desde-bogota.md`:**

Actual:
```markdown
[Reserva tu carro para Villa de Leyva →](/bogota)
```

Mejorado:
```markdown
**¿Vienes desde otra ciudad?** También ofrecemos alquiler en:
- [Medellín](/medellin) - Explora el Eje Cafetero
- [Cali](/cali) - Descubre el Pacífico
- [Cartagena](/cartagena) - Aventura en la Costa

[Reserva tu carro en Bogotá →](/bogota)
```

**Impacto:** +3-5 links por post = +21-35 internal links
**Esfuerzo:** 1-2 horas

---

#### 2.3 Agregar "Posts Relacionados" al Final de Blog Posts

**Archivo:** `app/pages/blog/[...slug].vue`

**Componente sugerido:**
```vue
<section v-if="relatedPosts.length > 0" class="bg-gray-100 py-8 px-4">
  <h2 class="text-xl font-bold mb-4">Artículos Relacionados</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <NuxtLink
      v-for="post in relatedPosts"
      :key="post.path"
      :to="post.path"
      class="bg-white p-4 rounded-lg hover:shadow-md"
    >
      <span class="font-semibold">{{ post.title }}</span>
    </NuxtLink>
  </div>
</section>
```

**Lógica:** Relacionar por categoría o tags

**Impacto:** +2-3 links por post = +14-21 internal links
**Esfuerzo:** 1.5 horas

---

### PRIORIDAD 3: Estructura Avanzada (ROI Medio, Esfuerzo Alto)

#### 3.1 Crear Página Hub de Ciudades (`/ciudades`)

**Nueva página:** `app/pages/ciudades/index.vue`

```vue
<template>
  <UPage>
    <UPageHero>
      <template #title>
        <h1>Alquiler de Carros en Colombia</h1>
      </template>
      <template #description>
        <p>Operamos en 19 ciudades de Colombia. Encuentra la sede más cercana.</p>
      </template>
    </UPageHero>

    <!-- Mapa de Colombia con ciudades -->
    <!-- Grid de todas las ciudades con links -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NuxtLink
        v-for="city in cities"
        :key="city.id"
        :to="`/${city.id}`"
      >
        {{ city.name }}
      </NuxtLink>
    </div>
  </UPage>
</template>
```

**Impacto:** +19 internal links + hub central
**Esfuerzo:** 3-4 horas

---

#### 3.2 Crear Páginas de Categorías de Vehículos

**Nuevas páginas:**
- `/vehiculos/compacto`
- `/vehiculos/sedan`
- `/vehiculos/camioneta-suv`

**Contenido sugerido:**
- Descripción del tipo de vehículo
- Para qué viajes es ideal
- Link a cada ciudad donde está disponible
- FAQs específicas

**Impacto:** +57 internal links (19 ciudades × 3 categorías)
**Esfuerzo:** 8-12 horas

---

#### 3.3 Agregar Breadcrumbs Visibles

**Archivo:** `app/layouts/default.vue`

```vue
<nav aria-label="Breadcrumb" class="bg-gray-100 px-4 py-2">
  <ol class="flex items-center space-x-2 text-sm">
    <li><NuxtLink to="/">Inicio</NuxtLink></li>
    <li v-if="currentCity">
      <span class="mx-2">/</span>
      <span>{{ currentCity.name }}</span>
    </li>
  </ol>
</nav>
```

**Impacto:** +1 link por página (a home)
**Esfuerzo:** 1 hora

---

## Matriz de Implementación

| Acción | Links Ganados | Esfuerzo | ROI | Prioridad |
|--------|--------------|----------|-----|-----------|
| Fix footer `external=true` | +19 | 5 min | ★★★★★ | P1 |
| Ciudades en homepage | +10-19 | 30 min | ★★★★★ | P1 |
| Blog preview homepage | +4 | 45 min | ★★★★☆ | P1 |
| Blog posts en city pages | +38-76 | 2 h | ★★★★☆ | P2 |
| Links en blog posts | +21-35 | 2 h | ★★★★☆ | P2 |
| Posts relacionados | +14-21 | 1.5 h | ★★★☆☆ | P2 |
| Página hub `/ciudades` | +19 | 4 h | ★★★☆☆ | P3 |
| Páginas de categorías | +57 | 12 h | ★★★☆☆ | P3 |
| Breadcrumbs | +30 | 1 h | ★★★☆☆ | P3 |

---

## Proyección de Resultados

| Fase | Internal Links | Timeline |
|------|---------------|----------|
| **Actual** | 33 | - |
| **P1 completada** | ~85 | +1 día |
| **P2 completada** | ~200 | +1 semana |
| **P3 completada** | ~350+ | +2-3 semanas |

---

## Reglas de Internal Linking

### DO's
- Usar anchor text descriptivo con keywords (ej: "alquiler de carros en Bogotá")
- Enlazar contextualmente dentro del contenido
- Asegurar que todas las páginas importantes estén a ≤3 clicks del home
- Usar `NuxtLink` para enlaces internos (SPA navigation)
- Incluir enlaces bidireccionales (A→B y B→A)

### DON'Ts
- Evitar "click aquí" como anchor text
- No usar `external=true` ni `target="_blank"` para enlaces internos
- No crear páginas huérfanas (sin enlaces entrantes)
- No sobre-optimizar (máx 2-3 enlaces por párrafo)
- No enlazar desde el footer masivamente (ya existe)

---

## Monitoreo

### KPIs a Seguir

| Métrica | Baseline | Meta 1 mes | Meta 3 meses |
|---------|----------|------------|--------------|
| Internal follow links (Moz) | 33 | 100 | 350+ |
| Páginas indexadas (GSC) | ~30 | ~35 | ~50 |
| Clicks orgánicos | baseline | +10% | +25% |
| Posición promedio | #35 | #30 | #25 |

### Herramientas
- **Moz Link Explorer:** Internal links count
- **Google Search Console:** Coverage, clicks, posiciones
- **Screaming Frog:** Auditoría de estructura de enlaces

---

## Próximos Pasos

1. [ ] Implementar P1.1: Fix footer external links
2. [ ] Implementar P1.2: Sección ciudades en homepage
3. [ ] Implementar P1.3: Sección blog en homepage
4. [ ] Crear composable `useCityBlogPosts.ts`
5. [ ] Implementar P2.1: Blog posts en city pages
6. [ ] Actualizar blog posts con más enlaces a ciudades

---

*Plan creado: 2026-01-17*
*Próxima revisión: 2026-02-17*
