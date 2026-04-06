# Blog Improvements Tracker

> Documento de seguimiento para mejoras del blog de Alquilatucarro
> Fecha inicio: 2026-01-13
> Rama principal: `feature/blog-improvements`

---

## Estado General

| Fase | Estado | Fecha |
|------|--------|-------|
| Fase 1 — Setup inicial | ✅ Completado | 2026-01-13 |
| Fase 2 — Análisis | ✅ Completado | 2026-01-31 |
| Fase 2 — Implementación | ✅ Completado | 2026-01-31 |
| Fase 2 — Testing + Deploy | ⏳ Pendiente (commit + push + CI/CD) | - |

---

## Mejoras por Prioridad

### 🔴 PRIORIDAD ALTA

#### 1. Corregir imágenes incorrectas
- **Estado:** ✅ Completado
- **Archivos modificados:**
  - `public/img/blog/pico-y-placa.webp` - reemplazada con imagen de tráfico urbano
  - `public/img/blog/viajar-ninos.webp` - reemplazada con imagen de viaje en carretera
- **Fuente:** Imágenes de Unsplash (libres de derechos)

#### 2. Actualizar fechas 2025 → 2026
- **Estado:** ✅ Completado
- **Archivos modificados:**
  - `content/blog/requisitos-alquilar-carro-colombia.md` - título y fecha actualizados
  - `content/blog/pico-y-placa-colombia-2026.md` - **RENOMBRADO** de 2025
  - `content/blog/tipos-carros-alquilar-cual-elegir.md` - fecha y footer actualizados
  - `content/blog/rutas-carro-desde-bogota.md` - título y fecha actualizados
  - `content/blog/eje-cafetero-en-carro-guia-completa.md` - título y fecha actualizados
  - `content/blog/costa-caribe-cartagena-santa-marta-carro.md` - título y fecha actualizados
  - `content/blog/viajar-carro-con-ninos-colombia.md` - fecha actualizada
  - `nuxt.config.ts` - rutas prerender y sitemap actualizadas
- **Cambios realizados:**
  - Títulos: "2025" → "2026"
  - Fechas frontmatter: `2026-01-13`
  - H1 en contenido: actualizados donde aplicaba
  - Footer "Última actualización": Enero 2026

#### 3. Eliminar título duplicado en artículos
- **Estado:** ✅ Completado
- **Archivos modificados:** Todos los 7 archivos markdown en `content/blog/`
- **Solución:** Eliminado el H1 del contenido markdown (el título ya se muestra en el hero del template)
- **Resultado:** Título solo en hero, contenido inicia con introducción

---

### 🟡 PRIORIDAD MEDIA

#### 4. Agregar iconografía a categorías
- **Estado:** ✅ Completado
- **Archivos modificados:**
  - `app/pages/blog/index.vue`
  - `app/pages/blog/[...slug].vue`
- **Iconos agregados (Lucide via UIcon):**
  - Guías: `i-lucide-book-open`
  - Rutas: `i-lucide-route`
  - Destinos: `i-lucide-map-pin`
  - Tips: `i-lucide-lightbulb`
  - Fecha: `i-lucide-calendar`
  - Tiempo de lectura: `i-lucide-clock`
- **Elementos actualizados:**
  - Badge de categoría en featured post
  - Badge de categoría en cards del grid
  - Badge de categoría en hero de artículo
  - Fecha y tiempo de lectura en todos los componentes

#### 5. Barra de progreso de lectura
- **Estado:** ✅ Completado
- **Archivo modificado:** `app/pages/blog/[...slug].vue`
- **Implementación:**
  - Barra fixed en top (z-50)
  - Color rojo (bg-red-700)
  - Altura 4px (h-1)
  - Progreso calculado basado en scroll del artículo
  - Transición suave (transition-all duration-150)

#### 6. Botones de compartir
- **Estado:** ✅ Completado
- **Archivo modificado:** `app/pages/blog/[...slug].vue`
- **Redes implementadas:**
  - WhatsApp (verde)
  - Facebook (azul)
  - Twitter/X (negro)
  - Copiar enlace (gris, con feedback visual)
- **Ubicación:**
  - Desktop: Sección en sidebar con botones circulares
  - Mobile: Barra flotante fija en la parte inferior
- **Características:**
  - Iconos de Lucide
  - Transiciones de hover
  - Feedback visual al copiar enlace (icono cambia a check)

---

### 🟢 PRIORIDAD BAJA

#### 7. Filtros por categoría en listado
- **Estado:** ✅ Completado
- **Archivo modificado:** `app/pages/blog/index.vue`
- **Funcionalidad implementada:**
  - Chips/botones para filtrar (Todos, Guías, Rutas, Destinos, Tips)
  - Cada botón con su icono correspondiente
  - "Todos" por defecto
  - Filtrado client-side reactivo
  - URL query param `?categoria=guias` para SEO
  - Estado vacío contextual con botón para limpiar filtro

#### 8. Bio de autor al final del artículo
- **Estado:** ✅ Completado
- **Archivo modificado:** `app/pages/blog/[...slug].vue`
- **Implementación:**
  - Sección después del contenido del artículo
  - Avatar del autor (80x80, rounded-full)
  - Nombre del autor
  - Descripción de la empresa
  - CTAs: "Reservar un Carro" y "Más artículos"
  - Diseño responsive (columna en mobile, fila en desktop)
  - Fondo gris claro con bordes redondeados

---

---

## FASE 2 — Mejoras Detectadas (2026-01-31)

> Auditoría completa del blog: código fuente, producción y SEO técnico.

### 🔴 CRÍTICAS — Impacto SEO directo

#### F2-1. og:image usa ruta relativa (social sharing roto)
- **Estado:** ✅ Completado
- **Problema:** `og:image` se define como `/img/blog/pico-y-placa.webp` (relativa). Facebook, WhatsApp y Twitter necesitan URL absoluta para mostrar preview de imagen al compartir.
- **Archivo:** `app/pages/blog/[...slug].vue:440`
  ```
  ogImage: post.value.image,  // → "/img/blog/pico-y-placa.webp"
  ```
- **Solución:** Prefijar con `franchise.website`:
  ```
  ogImage: `${franchise.website}${post.value.image}`,
  ```
- **Archivos afectados:** `[...slug].vue` (líneas 440, 451)
- **Impacto:** Alto — Sin esto, compartir en redes NO muestra imagen.
- **Esfuerzo:** S (5 min)

#### F2-2. Sitemap hardcodeado — no escala
- **Estado:** ✅ Completado — `server/api/__sitemap__/urls.ts` genera URLs dinámicamente
- **Problema:** Las URLs del blog están listadas manualmente en `nuxt.config.ts:599-633`. Cada nuevo artículo requiere actualización manual del sitemap. Si se olvida, Google no indexa.
- **Archivo:** `nuxt.config.ts:624-632`
- **Solución:** Generar URLs de blog dinámicamente leyendo los archivos de `content/blog/`. Mantener URLs estáticas solo para páginas no-content.
- **Impacto:** Alto — Riesgo de artículos sin indexar al crecer el blog.
- **Esfuerzo:** M (composable + refactor config)

#### F2-3. Imágenes sin width/height — CLS alto
- **Estado:** ✅ Completado — Migrado a NuxtImg con width/height explícitos
- **Problema:** Todas las `<img>` del blog carecen de atributos `width` y `height`, causando Cumulative Layout Shift (CLS) que penaliza Core Web Vitals.
- **Archivos:**
  - `app/pages/blog/index.vue:30-35` (featured image)
  - `app/pages/blog/index.vue:96-99` (grid cards)
  - `app/pages/blog/[...slug].vue:14-18` (hero)
  - `app/pages/blog/[...slug].vue:32-36` (author avatar)
  - `app/pages/blog/[...slug].vue:209-212` (related posts)
- **Solución:** Migrar a `<NuxtImage>` (ver F2-4) que resuelve esto automáticamente, o agregar width/height explícitos.
- **Impacto:** Alto — Afecta puntuación PageSpeed y ranking.
- **Esfuerzo:** S si se agregan atributos manuales / M si se migra a NuxtImage

#### F2-4. No usa NuxtImage — sin optimización de imágenes
- **Estado:** ✅ Completado — Todas las `<img>` migradas a `<NuxtImg>` con sizes responsive
- **Problema:** El blog usa `<img>` crudo en todas partes. No aprovecha NuxtImage/NuxtPicture que ofrece: responsive srcset, conversión WebP/AVIF, lazy loading nativo, dimensiones automáticas, placeholder blur.
- **Archivos:** Todos los `<img>` en `index.vue` y `[...slug].vue`
- **Verificación:** `grep -r "NuxtImg\|NuxtPicture" packages/ui-alquilatucarro/` → 0 resultados.
- **Solución:** Reemplazar `<img>` por `<NuxtImage>` o `<NuxtPicture>`. Requiere verificar que `@nuxt/image` esté instalado y configurado.
- **Impacto:** Alto — Mejora LCP, CLS, y peso de página de un golpe.
- **Esfuerzo:** M (verificar módulo + reemplazar tags + probar)

---

### 🟡 IMPORTANTES — UX y mantenibilidad

#### F2-5. Todas las fechas son idénticas (12 ene 2026)
- **Estado:** ✅ Completado — Fechas escalonadas entre 6-30 enero 2026
- **Problema:** Los 7 artículos tienen `date: 2026-01-13`. Parece contenido publicado en masa. Google interpreta fechas como señal de frescura — publicar todo junto diluye esa señal.
- **Archivos:** Frontmatter de los 7 archivos en `content/blog/*.md`
- **Solución:** Escalonar las fechas. Ejemplo:
  - `requisitos-alquilar-carro-colombia.md` → 2026-01-06
  - `pico-y-placa-colombia-2026.md` → 2026-01-10
  - `tipos-carros-alquilar-cual-elegir.md` → 2026-01-14
  - `rutas-carro-desde-bogota.md` → 2026-01-18
  - `eje-cafetero-en-carro-guia-completa.md` → 2026-01-22
  - `costa-caribe-cartagena-santa-marta-carro.md` → 2026-01-26
  - `viajar-carro-con-ninos-colombia.md` → 2026-01-30
- **Esfuerzo:** S (editar frontmatter)

#### F2-6. Sin breadcrumbs visibles en UI
- **Estado:** ✅ Completado — Breadcrumbs visibles en ambas páginas
- **Problema:** El schema BreadcrumbList existe en `[...slug].vue:482-504`, pero no hay breadcrumbs visuales en la página. Perjudica navegabilidad y UX.
- **Archivos:** `app/pages/blog/[...slug].vue` y `app/pages/blog/index.vue`
- **Solución:** Agregar componente visual de breadcrumbs debajo del navbar. Ejemplo: `Inicio > Blog > Pico y Placa en Colombia 2026`
- **Esfuerzo:** S (componente simple con NuxtLink)

#### F2-7. Funciones utilitarias duplicadas
- **Estado:** ✅ Completado — Extraído a `composables/useBlogUtils.ts`
- **Problema:** `formatDate()`, `formatCategory()` y `getCategoryIcon()` están copiadas idénticamente en:
  - `app/pages/blog/index.vue:220-248`
  - `app/pages/blog/[...slug].vue:354-382`
- **Solución:** Extraer a un composable `app/composables/useBlogUtils.ts`:
  ```ts
  export function useBlogUtils() {
    return { formatDate, formatCategory, getCategoryIcon }
  }
  ```
- **Esfuerzo:** S (extraer + reemplazar imports)

#### F2-8. Tags no son clickeables
- **Estado:** ✅ Completado — Tags como NuxtLink con filtro por `?tag=` en index
- **Problema:** En `[...slug].vue:90-101`, los tags del artículo se muestran como badges estáticos (`<span>`). No hay navegación por tags.
- **Solución:** Convertir a `<NuxtLink>` que lleven a `/blog?tag=pico-y-placa` y agregar filtro por tag en `index.vue`.
- **Esfuerzo:** M (requiere lógica de filtrado adicional)

#### F2-9. Sin fecha de "última actualización"
- **Estado:** ✅ Completado — Campo `updated` en frontmatter + UI condicional
- **Problema:** Artículos sobre temas temporales (pico y placa 2026) no muestran cuándo se actualizaron. El schema soporta `dateModified` pero cae al mismo `date` si no existe campo `updated`.
- **Archivos modificados:**
  - Frontmatter de artículos temporales: campo `updated` agregado
  - `[...slug].vue`: muestra "Actualizado: X" junto a la fecha de publicación
  - Schema `dateModified` usa `updated` cuando existe
- **Esfuerzo:** S

#### F2-10. Bio de autor genérica
- **Estado:** ✅ Completado — Bio mejorada con E-E-A-T y CTA contextual
- **Problema:** `[...slug].vue:168-171` tiene texto corporativo hardcodeado idéntico para todos los artículos. No genera confianza E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
- **Solución implementada:** Bio de autor mejorada con texto que refuerza experiencia y autoridad. CTAs contextuales (WhatsApp + Reservar).
- **Esfuerzo:** S

---

### 🟢 CRECIMIENTO — Para escalar el blog

#### F2-11. Volumen de contenido insuficiente
- **Estado:** ✅ Completado — Plan de 15 artículos nuevos documentado
- **Problema:** Solo 7 artículos. Insuficiente para autoridad temática.
- **Solución implementada:** Plan de contenido completo basado en datos SEMrush con 15 artículos nuevos en 4 tiers (Quick Wins, City Support, Diferenciador, Expansión). ~27,350 vol/mes target combinado.
- **Documento:** `docs/seo/estrategia/BLOG-CONTENT-PLAN.md`
- **Esfuerzo:** M (investigación + plan) — L para producción de contenido

#### F2-12. Sin feed RSS
- **Estado:** ✅ Completado — Server route `/rss.xml` + link en head del blog
- **Problema:** No hay syndication del blog. Lectores no pueden suscribirse via RSS.
- **Solución implementada:** Nitro server route `server/routes/rss.xml.ts` genera RSS 2.0 con Atom self-link. Sin dependencias nuevas. Link `<link rel="alternate">` agregado al head del listado.
- **Archivos creados:** `server/routes/rss.xml.ts`
- **Archivos modificados:** `app/pages/blog/index.vue` (head)
- **Esfuerzo:** S

#### F2-13. Sin captura de leads (newsletter)
- **Estado:** ✅ Completado — CTA con WhatsApp + Reservar (sin newsletter)
- **Problema:** El blog no captura emails. Lectores llegan, leen, se van. No hay mecanismo de retención.
- **Solución implementada:** En lugar de newsletter (no tienen sistema de email marketing), se implementó CTA de conversión directa con botones de WhatsApp y Reservar usando datos de `franchise` config. Más alineado con el modelo de negocio.
- **Esfuerzo:** S

#### F2-14. Sin navegación prev/next entre artículos
- **Estado:** ✅ Completado — Navegación cronológica prev/next
- **Problema:** Solo muestra "Artículos Relacionados" (misma categoría). No hay navegación secuencial.
- **Solución implementada:** Sección de navegación prev/next después del contenido, usando orden cronológico. UI con flechas y títulos de artículos adyacentes.
- **Archivos modificados:** `app/pages/blog/[...slug].vue`
- **Esfuerzo:** S

#### F2-15. Sin búsqueda en blog
- **Estado:** ✅ Completado — Búsqueda client-side con normalización Unicode
- **Problema:** No hay forma de buscar contenido dentro del blog.
- **Solución implementada:** Input de búsqueda en `index.vue` que filtra por título, descripción y tags. Normalización NFD para búsqueda insensible a acentos en español ("guia" encuentra "guía").
- **Archivos modificados:** `app/pages/blog/index.vue`
- **Esfuerzo:** S

#### F2-16. Sin paginación
- **Estado:** ✅ Completado — Paginación client-side con 6 posts/página
- **Problema:** Todos los artículos se muestran en una sola página. Con 7 es aceptable, pero no escalará a 20+.
- **Solución implementada:** Paginación con `POSTS_PER_PAGE = 6`, botones Anterior/Siguiente + números de página. Reset automático al cambiar filtros o búsqueda.
- **Archivos modificados:** `app/pages/blog/index.vue`
- **Esfuerzo:** S

---

### Orden de implementación recomendado (ROI)

| Orden | ID | Mejora | Benefit | Complex | ROI |
|-------|-----|--------|---------|---------|-----|
| 1 | F2-1 | og:image absoluta | 5 | 1 | **4** |
| 2 | F2-5 | Escalonar fechas | 3 | 1 | **2** |
| 3 | F2-9 | Campo `updated` | 3 | 1 | **2** |
| 4 | F2-7 | Composable blog utils | 3 | 1 | **2** |
| 5 | F2-3 | Width/height en imágenes | 4 | 2 | **2** |
| 6 | F2-4 | Migrar a NuxtImage | 5 | 3 | **2** |
| 7 | F2-6 | Breadcrumbs visibles | 3 | 1 | **2** |
| 8 | F2-2 | Sitemap dinámico | 4 | 3 | **1** |
| 9 | F2-10 | Bio autor mejorada | 2 | 1 | **1** |
| 10 | F2-14 | Navegación prev/next | 3 | 2 | **1** |
| 11 | F2-8 | Tags clickeables | 2 | 2 | **0** |
| 12 | F2-13 | Newsletter CTA | 4 | 3 | **1** |
| 13 | F2-11 | Más contenido | 5 | 5 | **0** |
| 14 | F2-15 | Búsqueda | 2 | 2 | **0** |
| 15 | F2-16 | Paginación | 2 | 2 | **0** |
| 16 | F2-12 | RSS feed | 1 | 2 | **-1** |

---

## Commits Realizados

| Commit | Descripción | Fecha |
|--------|-------------|-------|
| `8a8994a` | feat(blog): agregar imágenes a los 7 artículos del blog | 2026-01-13 |
| - | - | - |

---

## Notas de Implementación

### Decisiones técnicas
- Usar Lucide icons (ya instalado en el proyecto)
- Mantener paleta de colores existente
- No agregar dependencias nuevas si es posible

### Archivos clave del blog
```
content/blog/*.md          # Contenido markdown
app/pages/blog/index.vue   # Listado de artículos
app/pages/blog/[...slug].vue # Página de artículo
content.config.ts          # Configuración de colecciones
public/img/blog/           # Imágenes de artículos
```

---

## Rollback

Si es necesario revertir cambios:
```bash
# Volver al estado antes de mejoras
git checkout main
git reset --hard 8a8994a

# O revertir commits específicos
git revert <commit-hash>
```

---

## Contacto

- **Proyecto:** rentacar-main (Alquilatucarro)
- **Repositorio:** https://github.com/amaw-dev/rentacar-main
