# Protocolo de Creación de Artículos del Blog

> Documento que define el proceso estándar para crear artículos del blog de Alquilatucarro.
> Fecha de creación: 2026-02-05

---

## Resumen del Proceso

```
1. Planificación → 2. Redacción → 3. Imágenes → 4. Revisión → 5. Publicación
```

---

## 1. Planificación

### Antes de escribir

- [ ] Verificar que el artículo está en `BLOG-CONTENT-PLAN.md`
- [ ] Identificar keywords target (primaria + secundarias)
- [ ] Definir estructura de headings (H2, H3)
- [ ] Listar artículos existentes para internal linking (mínimo 3 links)
- [ ] Identificar qué imágenes se necesitarán (1 hero + 3-5 internas)

### Estructura recomendada

| Sección | Descripción |
|---------|-------------|
| Intro | 2-3 párrafos que enganchan y presentan el tema |
| Resumen/Tabla | Tabla resumen o puntos clave (escaneable) |
| Contenido principal | Secciones con H2, subtemas con H3 |
| Tips/Consejos | Callouts con información práctica |
| FAQs | 3-5 preguntas frecuentes (schema FAQ) |
| Conclusión | Cierre + CTA natural |

### Longitud objetivo

| Tipo de artículo | Palabras | Tiempo lectura |
|------------------|----------|----------------|
| Guía completa | 2,000-3,000 | 10-15 min |
| Destino/Ruta | 1,500-2,500 | 8-12 min |
| Tips/Consejos | 1,000-1,500 | 5-8 min |

---

## 2. Redacción

### Frontmatter obligatorio

```yaml
---
title: "Título SEO optimizado (50-60 caracteres)"
description: "Meta description (150-160 caracteres)"
image: /img/blog/nombre-imagen-hero.webp
alt: Descripción de la imagen para accesibilidad
author:
  name: Alquilatucarro
  avatar: [URL del logo]
date: YYYY-MM-DD
updated: YYYY-MM-DD  # Solo si es actualización
category: guias | rutas | destinos | tips
tags:
  - tag1
  - tag2
  - tag3
readingTime: X  # Minutos estimados
featured: true | false
---
```

### Elementos de contenido

#### Callouts (usar con moderación, 2-4 por artículo)

```markdown
::callout{type="info"}
Información útil o tips.
::

::callout{type="success"}
Recomendaciones o rutas sugeridas.
::

::callout{type="warning"}
Advertencias o precauciones importantes.
::
```

#### Tablas de datos prácticos

Cada destino/ruta debe incluir tabla con:
- Distancia desde ciudades principales
- Tiempo de viaje
- Tipo de carro recomendado
- Mejor época para visitar
- Días recomendados

#### Internal links

- Mínimo 3 links a otros artículos del blog
- Links contextuales (no forzados)
- Usar anchor text descriptivo

---

## 3. Imágenes

### Orden de prioridad de fuentes

1. **Imágenes existentes** en `/public/img/blog/` (reutilizar primero)
2. **Unsplash** (preferido para descarga autónoma - licencia libre)
3. **Pexels** (alternativa con licencia libre)
4. **Freepik** (requiere intervención manual del usuario)

### Fuente preferida: Unsplash (Autónoma)

**URL**: https://unsplash.com

**Ventajas**:
- URLs directas descargables vía CLI (sin login)
- Licencia libre (no requiere atribución obligatoria)
- Alta calidad consistente

**Proceso de descarga autónomo**:

```bash
# 1. Buscar imagen en Unsplash y copiar el ID de la URL
#    Ejemplo: https://unsplash.com/photos/ABC123xyz → ID = ABC123xyz

# 2. Descargar con curl usando URL directa
curl -L "https://images.unsplash.com/photo-ABC123xyz?w=1200&q=80" \
  -o packages/ui-alquilatucarro/public/img/blog/destino-descripcion.jpg

# 3. Convertir a WebP (requiere cwebp instalado)
cwebp -q 80 input.jpg -o output.webp

# Alternativa: usar sharp via npx
npx sharp-cli input.jpg -o output.webp --quality 80
```

### Fuente alternativa: Freepik (Manual)

**URL**: https://www.freepik.com

**Nota**: Requiere intervención del usuario para descargar. Usar solo cuando:
- No hay imagen adecuada en Unsplash
- Se necesita un estilo específico (ilustraciones, vectores)

**Criterios de búsqueda**:
1. Buscar en español primero (ej: "carretera colombia")
2. Si no hay resultados, buscar en inglés
3. Filtrar por "Fotos" (no vectores ni PSD)

### Cantidad de imágenes por artículo

| Tipo de artículo | Hero | Internas | Total |
|------------------|------|----------|-------|
| Guía completa | 1 | 4-6 | 5-7 |
| Destino/Ruta | 1 | 3-5 | 4-6 |
| Tips/Consejos | 1 | 2-3 | 3-4 |

### Criterios de selección

| Prioridad | Criterio |
|-----------|----------|
| 1 | Relevancia con el contenido |
| 2 | Con personas (preferible) |
| 3 | Paisajes colombianos reconocibles |
| 4 | Carros/vehículos en contexto de viaje |
| 5 | Alta calidad (mínimo 1200px ancho) |

### Proceso de descarga autónomo (CLI)

```bash
# Directorio destino
IMG_DIR="packages/ui-alquilatucarro/public/img/blog"

# Descargar desde Unsplash (reemplazar PHOTO_ID y FILENAME)
curl -L "https://images.unsplash.com/photo-PHOTO_ID?w=1200&q=80" -o "$IMG_DIR/FILENAME.jpg"

# Convertir a WebP
# Opción 1: cwebp (si está instalado)
cwebp -q 80 "$IMG_DIR/FILENAME.jpg" -o "$IMG_DIR/FILENAME.webp"

# Opción 2: sharp-cli via npx
npx sharp-cli "$IMG_DIR/FILENAME.jpg" -o "$IMG_DIR/FILENAME.webp" --quality 80

# Opción 3: PowerShell con .NET (Windows sin dependencias)
# Ver script en scripts/convert-to-webp.ps1
```

### Optimización de imágenes

**Configuración objetivo**:
- Formato: WebP (preferido) o JPEG
- Calidad: 80%
- Ancho máximo: 1200px (hero) / 800px (internas)
- Tamaño máximo: 200KB

**Herramientas CLI disponibles**:
| Herramienta | Instalación | Uso |
|-------------|-------------|-----|
| cwebp | `choco install webp` / `brew install webp` | `cwebp -q 80 in.jpg -o out.webp` |
| sharp-cli | `npm i -g sharp-cli` | `npx sharp-cli in.jpg -o out.webp` |
| Squoosh (web) | https://squoosh.app | Manual, para casos puntuales |

#### Nomenclatura de archivos

```
✓ eje-cafetero-paisaje.webp
✓ cartagena-murallas-turistas.webp
✓ san-gil-rafting-aventura.webp

✗ IMG_1234.jpg
✗ photo-1.webp
✗ imagen (1).jpeg
```

### Atribución

- **Unsplash/Pexels**: No requieren atribución (pero es cortesía incluirla)
- **Freepik**: Requiere atribución obligatoria en footer o página de créditos

---

## 4. Revisión

### Checklist pre-publicación

#### Contenido
- [ ] Título optimizado para SEO (50-60 chars)
- [ ] Meta description completa (150-160 chars)
- [ ] Frontmatter completo y correcto
- [ ] Sin errores ortográficos o gramaticales
- [ ] Internal links funcionando (mínimo 3)
- [ ] CTAs naturales incluidos
- [ ] Callouts usados apropiadamente

#### Imágenes
- [ ] Hero image definida y visible
- [ ] Imágenes internas (3-5 según tipo)
- [ ] Todas las imágenes optimizadas (WebP, <200KB)
- [ ] Alt text descriptivo en todas las imágenes
- [ ] Imágenes en `/public/img/blog/`

#### Técnico
- [ ] Archivo .md en `content/blog/`
- [ ] Slug sigue convención (kebab-case, sin tildes)
- [ ] Fecha correcta en frontmatter
- [ ] Categoría válida (guias|rutas|destinos|tips)
- [ ] Tags relevantes (3-5)

### Revisión visual

Antes de crear PR:
1. Ejecutar `pnpm run dev:alquilatucarro`
2. Navegar al artículo en localhost
3. Verificar:
   - [ ] Hero image carga correctamente
   - [ ] Título y metadata visibles
   - [ ] Breadcrumbs correctos
   - [ ] ToC (Table of Contents) generado
   - [ ] Imágenes internas cargan
   - [ ] Callouts renderizados
   - [ ] Tablas formateadas
   - [ ] Links internos funcionan
   - [ ] Author bio visible
   - [ ] Artículos relacionados muestran

---

## 5. Publicación

### Archivos a actualizar

Al agregar un nuevo artículo, actualizar:

1. **RSS Feed** (`public/rss.xml`)
   - Agregar nuevo `<item>` al inicio
   - Actualizar `<lastBuildDate>`
   - Mantener orden cronológico descendente

2. **Sitemap** (`nuxt.config.ts` → `sitemap.urls`)
   - Agregar URL del nuevo artículo
   - Formato: `/blog/slug-del-articulo`

3. **Prerender** (`nuxt.config.ts` → `prerender.routes`)
   - Agregar ruta para pre-renderizado
   - Formato: `/blog/slug-del-articulo`

### Proceso de PR

1. Crear rama: `feat/blog-nombre-articulo`
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Crear PR hacia `main`
5. Esperar CI/CD
6. Merge cuando esté verde

### Post-publicación

- [ ] Verificar en producción que el artículo carga
- [ ] Probar compartir en redes (og:image funciona)
- [ ] Actualizar `SESSION-STATE.md` con progreso
- [ ] Marcar artículo como completado en `BLOG-CONTENT-PLAN.md`

---

## Ejemplos de referencia

### Artículos bien ejecutados

| Artículo | Imágenes | Notas |
|----------|----------|-------|
| viajar-por-carretera-colombia-guia | 4 | Hero + 3 internas, todas de Freepik |
| precios-alquiler-carros-colombia | 3 | Hero + 2 internas |

### Estructura de carpetas

```
packages/ui-alquilatucarro/
├── content/
│   └── blog/
│       ├── articulo-nuevo.md
│       └── ...
└── public/
    └── img/
        └── blog/
            ├── articulo-hero.webp
            ├── articulo-imagen-1.webp
            └── ...
```

---

## Historial de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-02-05 | Creación inicial del protocolo |
| 2026-02-05 | Actualización: flujo autónomo de imágenes (Unsplash + CLI) |
