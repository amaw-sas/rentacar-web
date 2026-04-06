# Optimizaciones On-Page

## Checklist por Página de Ciudad

### Meta Tags

- [ ] Title: "Alquiler de Carros en [Ciudad] | AlquilaTuCarro.com" (≤60 chars)
- [ ] Description: Incluye keyword + CTA + diferenciador (≤155 chars)
- [ ] H1: Único, incluye keyword principal
- [ ] H2-H3: Estructura lógica con keywords secundarias

### Contenido

- [ ] Contenido único (no duplicado entre ciudades)
- [ ] Mínimo 800 palabras de contenido útil
- [ ] Keyword principal en primeros 100 palabras
- [ ] Variaciones de keyword distribuidas naturalmente
- [ ] Preguntas frecuentes específicas de la ciudad

### Schema Markup

- [ ] LocalBusiness schema
- [ ] FAQPage schema
- [ ] BreadcrumbList schema
- [ ] Product schema (para vehículos)

### Imágenes

- [ ] Alt text descriptivo con keyword
- [ ] Nombres de archivo descriptivos
- [ ] Compresión optimizada (WebP)
- [ ] Lazy loading implementado

### Enlaces Internos

- [ ] Link a ciudades cercanas
- [ ] Link a página de vehículos
- [ ] Link a FAQs generales
- [ ] Breadcrumbs funcionales

---

## Estado por Ciudad

| Ciudad | Title | H1 | OG Image | Schema | Contenido | Inlinks |
|--------|-------|----|-----------|---------|-----------| --------|
| Bogotá | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Medellín | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Cali | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Barranquilla | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Cartagena | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Santa Marta | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Bucaramanga | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Pereira | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Armenia | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Manizales | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Ibagué | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Neiva | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Villavicencio | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Cúcuta | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Montería | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Valledupar | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Floridablanca | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Palmira | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |
| Soledad | ✅ | ⚠️ 2 H1s | ❌ | ✅ | ✅ | ✅ |

**Leyenda:** ⬜ Pendiente | ✅ Completado | ⚠️ Parcial | ❌ Faltante

**Issues detectados (2026-01-15):**
- ⚠️ **Doble H1**: Todas las páginas tienen 2 etiquetas H1 (header + hero)
- ❌ **OG Image**: Ninguna página tiene meta tag `og:image`
- ⚠️ **Typo**: H1 hero dice "ALQUILERDE" en lugar de "ALQUILER DE"

### Auditoría Detallada (2026-01-14)

| Elemento | Estado | Implementación |
|----------|--------|----------------|
| Title SEO | ✅ 19/19 | `"Alquiler de Carros en [Ciudad] desde $32/día"` |
| Meta Description | ✅ 19/19 | Única por ciudad, truncada a 155 chars |
| H1 con keyword | ✅ 19/19 | `"ALQUILER DE CARROS EN [Ciudad] Colombia"` |
| H2s con keyword | ✅ 8/8 | Todas incluyen variaciones de "alquiler de carros" |
| Contenido expandido | ✅ 19/19 | Intro + ventajas + destinos + tips + temporada (~770 palabras) |
| FAQs únicas | ✅ 19/19 | 6 preguntas específicas por ciudad |
| FAQPage Schema | ✅ 19/19 | Rich snippets en SERPs |
| Breadcrumb Schema | ✅ 19/19 | Home > [Ciudad] |
| AggregateRating | ✅ 19/19 | 4.9 estrellas por testimonios |
| LocalBusiness Schema | ❌ N/A | Deshabilitado (modelo agregador) |
| Product Schema | ⬜ 0/19 | Pendiente para vehículos |
| Links ciudades cercanas | ✅ 19/19 | Sección "Alquiler en ciudades cercanas" implementada |

### Gaps Prioritarios

1. ~~**🔴 Internal Linking (Inlinks)** - 0/19 ciudades~~ ✅ **COMPLETADO (2026-01-14)**
   - Implementado composable `useCityRelations.ts` con mapeo geográfico
   - Sección "Alquiler de carros en ciudades cercanas" en CityPage.vue
   - 19 ciudades con 3-4 links internos cada una

2. ~~**🟡 H2s con keywords** - 1/7 H2s optimizados~~ ✅ **COMPLETADO (2026-01-14)**
   - 8/8 H2s ahora incluyen keywords: "alquiler de carros", "carro de alquiler", "carro rentado", "alquilar carro", "rentaron carros"
   - Variaciones naturales para evitar keyword stuffing

3. ~~**🟡 Word count** - ~600-700 palabras (meta: 800+)~~ ✅ **MEJORADO (2026-01-14)**
   - Nueva sección "Ventajas de alquilar carro en [Ciudad]" (+100 palabras)
   - Total actual: ~770 palabras (cercano a meta de 800+)
   - Contenido semi-dinámico con nombre de ciudad

---

## Core Web Vitals

### Objetivos

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| LCP | < 2.5s | PageSpeed Insights |
| INP | < 200ms | PageSpeed Insights |
| CLS | < 0.1 | PageSpeed Insights |

### Acciones Técnicas

- [ ] Optimizar imágenes (WebP, sizing)
- [ ] Implementar lazy loading
- [ ] Minificar CSS/JS
- [ ] Preload fuentes críticas
- [ ] Server-side rendering
- [ ] Caché de CDN configurado

---

## Acciones Urgentes

### ✅ Meta Description Corregida (2025-01-11)

**Problema:** `app.config.ts` línea 68 decía "14 ciudades más" (implicaba 17 total).
**Solución:** Cambiado a "16 ciudades más" (3 + 16 = 19 ciudades).

---

## Issues Core Web Vitals

| Métrica | Valor Actual | Objetivo | Detectado | Estado |
|---------|--------------|----------|-----------|--------|
| **LCP** (mobile) | 0.9s | < 2.5s | 2026-01-15 | ✅ **EXCELENTE** |
| **FCP** (mobile) | 1.0s | < 1.8s | 2026-01-14 | ✅ OK |
| **TBT** (mobile) | 194ms | < 200ms | 2026-01-14 | ✅ OK |
| **CLS** (mobile) | **0.772** | < 0.1 | 2026-01-15 | 🔴 **REGRESIÓN** |
| **INP** (mobile) | < 200ms | < 200ms | 2024-12-23 | ✅ Optimizado |
| **Performance** | 68-71/100 | 90+ | 2026-01-15 | 🔴 Bajó (por CLS) |
| **SEO** | 100/100 | 100 | 2026-01-15 | ✅ Perfecto |
| **Accesibilidad** | 100/100 | 100 | 2026-01-15 | ✅ Perfecto |

### 🔴 URGENTE: CLS Regresión (2026-01-15)

**Problema:** CLS subió de 0 a 0.772 (7.7x peor que objetivo)

**Causa:** Iconos de estrellas (`Icon name="heroicons:star"`) sin CSS crítico
- `.w-5`, `.h-5` no están en critical CSS de `nuxt.config.ts`
- `svg { height: auto }` global sobreescribe atributos HTML
- Estrellas se renderizan grandes y luego saltan a tamaño correcto

**Solución:** PR #43 - Agregar tamaños al CSS crítico

**Estado:** Pendiente merge y deploy

### ✅ Verificación CWV (2026-01-12)

**Medición PageSpeed Insights Mobile:**

| Métrica | Baseline (Ene 11) | Actual (Ene 12) | Cambio |
|---------|-------------------|-----------------|--------|
| Performance | 76 | **84** | +8 pts ✅ |
| LCP | 4.5s | **3.6s** | -20% ✅ |
| FCP | 2.9s | 2.7s | -7% ✅ |
| TBT | 90ms | 150ms | +67% (aún 🟢) |
| CLS | 0 | 0 | = ✅ |
| Speed Index | - | 3.1s | 🟢 |

**Fixes aplicados que contribuyeron:**
- ✅ Media queries en preloads hero image
- ✅ type="image/avif" en preloads
- ✅ Preconnect a Firebase Storage

### 🔴 Issues Pendientes para LCP < 2.5s

#### 1. ✅ CSS Render-Blocking (RESUELTO 2026-01-12)

| Recurso | Tamaño | Duración Bloqueo |
|---------|--------|------------------|
| `/_nuxt/entry.*.css` | 93.2 KiB | **2,100 ms** |

**LCP Breakdown (antes del fix):**
- Time to first byte: 0 ms
- Resource load delay: 50 ms
- Resource load duration: 180 ms
- **Element render delay: 1,080 ms** ← Causado por CSS bloqueante

**Solución implementada:** Configurado `nuxt-vitalizer` en `nuxt.config.ts`:
```typescript
vitalizer: {
  disableStylesheets: 'entry',  // Remueve entry.*.css bloqueante
  disablePrefetchLinks: true,   // Mejora FCP removiendo prefetch links
}
```

**Impacto esperado:** -300ms en render blocking, mejor LCP y FCP.

#### 2. Imagen Hero Oversized (MEDIA PRIORIDAD)

| Imagen | Tamaño Servido | Tamaño Display | Ahorro |
|--------|----------------|----------------|--------|
| `familia-movil.avif` | 760×616 | 380×308 | 26.1 KiB |

**Solución:** Redimensionar imagen o usar srcset con tamaños correctos.

#### 3. JavaScript No Usado (BAJA PRIORIDAD)

- Est savings: 33 KiB
- **Solución:** Tree shaking, code splitting

---

### ✅ INP Optimizado (2025-01-11)

**Problema identificado:** Plugins globales cargaban JS innecesario en todas las páginas.

**Solución implementada:**

1. **vue-tel-input** (~70-80KB): Eliminado plugin global, ahora lazy load en `ReservationForm.vue`
   - Archivo eliminado: `app/plugins/useVueTelInput.client.ts`
   - Impacto: -50-80ms INP estimado

2. **js-confetti** (~15-20KB): Eliminado plugin global, ahora lazy load en página de confirmación
   - Archivo eliminado: `app/plugins/useJsConfetti.client.ts`
   - Impacto: -20-30ms INP estimado

**Resultado esperado:** Reducción de ~70-110ms en INP.

### ⚠️ LCP Fix Aplicado (2025-01-11) - Pendiente Verificar

**Problema identificado:** Preload de imagen hero sin media queries descargaba imagen desktop (2000x1620, ~500KB) en móvil.

**Solución implementada:**
- Agregado `media="(min-width: 768px)"` al preload de `familia.avif`
- Agregado preload condicional para `familia-movil.avif` con `media="(max-width: 767px)"`

**Commit:** `11a33e7 perf(lcp): agregar media queries a preloads de imagen hero`

**Resultado esperado:** LCP móvil de 4.5s → ~2.0-2.5s

**Pendiente:** Verificar mejora en PageSpeed Insights post-deploy.

### Pendientes de optimizar (menor prioridad):

**LCP adicionales:**
- Fuentes web bloqueando render (actualmente usa system fonts ✓)
- JavaScript bloqueante
- Servidor lento para mobile

**INP adicionales (menor prioridad):**
- Watchers en cascada en useSearch.ts (~10-20ms)
- Computed properties costosas en horas (~10-15ms)
- UModal siempre hidratado (~22-35ms)

### 🟡 Investigación LCP (2026-01-14)

**Medición PageSpeed API (promedio de múltiples runs):**
| Métrica | Valor | Variabilidad |
|---------|-------|--------------|
| Performance | 68-81/100 | Alta |
| LCP | 3.8s | Estable |
| FCP | 0.9-2.3s | Alta |
| TBT | 139-494ms | Alta |
| CLS | 0.000-0.430 | Variable |

**LCP Breakdown (fases del elemento LCP):**
| Fase | Duración | Estado |
|------|----------|--------|
| Time to first byte | 0.5ms | ✅ Excelente |
| Resource load delay | 43ms | ✅ Bien |
| Resource load duration | 257ms | ✅ OK |
| **Element render delay** | **673ms** | ❌ PROBLEMA |

**Root Cause identificado:** JavaScript bloqueando el render
| Script | Tiempo ejecución |
|--------|-----------------|
| DTjRpsKE.js (Vue/Nuxt) | 622ms |
| inline scripts | 547ms |
| Otros | 187ms |

**✅ Verificaciones positivas:**
- fetchpriority="high" aplicado
- No lazy load en imagen LCP
- Request discoverable en documento inicial
- Preloads correctamente configurados
- Preconnect a Firebase Storage

**Fix aplicado (2026-01-14):**
- CSS crítico del layout background agregado a nuxt.config.ts
- Commit: `4e0be9a`

**Impacto observado:** CLS mejoró a 0.000 en algunos tests, pero LCP sigue en 3.8s porque el problema principal es JavaScript, no CSS.

**🔴 Para reducir LCP a <2.5s se necesita:**
1. ~~Diferir hidratación de Vue hasta después del LCP~~ ✅ Implementado (2026-01-14)
2. Code splitting más agresivo del bundle principal
3. Considerar SSG (Static Site Generation) para landing pages

### ✅ Lazy Hydration Nativo de Nuxt 4 (2026-01-14)

**Commit:** `e772f02`

**Implementación en `app/pages/index.vue`:**

| Componente | Estrategia | Motivo |
|------------|------------|--------|
| `ImagesVideo` | `hydrate-on-visible` | Below the fold, no interactivo |
| `ImagesPersona` | `hydrate-on-visible` | Below the fold, no interactivo |
| `ImagesCategoriasCompacto/Sedan/SUV` | `hydrate-on-visible` | Below the fold, no interactivo |
| `UModal` (x3) | `hydrate-on-interaction` | Solo necesita JS al hacer clic |
| `UAccordion` | `hydrate-on-interaction` | Solo necesita JS al interactuar |

**Fix CLS adicional:** Wrapper `min-h-[48px]` en UUser avatars de testimonios.

**Resultados (PageSpeed API):**

| Métrica | Antes | Después | Cambio |
|---------|-------|---------|--------|
| Performance | 68-81 | 86 | +5-18 pts ✅ |
| Element render delay | 673ms | 455ms | -218ms (-32%) ✅ |
| scriptEvaluation | 644ms | 385ms | -259ms (-40%) ✅ |
| TBT | 280ms | 194ms | -86ms ✅ |
| CLS | 0.000-0.430 | 0.000 | Estable ✅ |
| LCP | 3.8s | 3.8s | Sin cambio |

**Nota:** LCP no cambió porque el hero (elemento LCP) sigue cargando igual. La mejora está en que JavaScript ahora bloquea menos el render.

---

## Próximos Pasos

### ✅ Completados
1. ~~Investigar y optimizar INP mobile (> 200ms)~~ ✅
2. ~~Implementar Critical CSS (nuxt-vitalizer)~~ ✅
3. ~~CSS crítico del layout background~~ ✅ (2026-01-14)
4. ~~Product Schema para vehículos~~ ✅
5. ~~H2s con keywords~~ ✅ 8/8
6. ~~Internal linking ciudades cercanas~~ ✅ 19/19
7. ~~Lazy Hydration nativo Nuxt 4~~ ✅ (2026-01-14) - Reduce element render delay 32%
8. ~~CLS variable (0-0.43)~~ ✅ (2026-01-14) - min-h fix en UUser avatars
9. ~~TBT > 200ms~~ ✅ (2026-01-14) - Ahora 194ms

### ✅ Completados (2026-01-16)
1. ✅ **CLS estrellas**: PR #44 mergeado - CSS crítico para iconos
2. ✅ **Doble H1**: PR #44 mergeado - Eliminado H1 duplicado
3. ✅ **Typo "ALQUILERDE"**: PR #44 mergeado - Corregido a "ALQUILER DE"
4. ✅ **www → non-www**: PR #46 mergeado - Redirect canónico configurado

### 🟡 Pendientes Media Prioridad
5. **OG Image faltante**: Agregar imagen OG para social sharing
5. Redimensionar imagen hero móvil a 380×308 (est. -26 KiB)
6. Ejecutar `/seo-audit` para detectar issues adicionales
7. Code splitting del bundle Vue/Nuxt principal (DTjRpsKE.js)

### ✅ LCP Resuelto (2026-01-15)
- LCP bajó de 3.8s a **0.9s** (76% mejora)
- Optimizaciones de imagen y animación aplicadas en PRs anteriores
