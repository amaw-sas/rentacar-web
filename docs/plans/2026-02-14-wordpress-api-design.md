# Diseño: API de Integración WordPress → Nuxt Blog

**Fecha:** 2026-02-14
**Autor:** Claude (brainstorming session)
**Estado:** Aprobado para implementación

---

## 📋 Resumen Ejecutivo

Sistema de API REST para recibir posts de WordPress y transformarlos automáticamente en posts de Nuxt Content, con optimización de imágenes y persistencia en Firebase Storage.

**Enfoque seleccionado:** API Monolítica con Transformador Directo
**ROI:** +3 (beneficio: 5, complejidad: 2)

---

## 🎯 Objetivos

1. **Recibir posts desde WordPress** en formato WordPress REST API
2. **Transformar a formato Nuxt Content** (Markdown + frontmatter)
3. **Optimizar imágenes** con Sharp (webp, resize)
4. **Persistir en Firebase Storage** (independiente de deploys)
5. **Servir dinámicamente** en runtime con cache de 5 minutos
6. **Seguridad robusta** (IP whitelist + API key + rate limiting)

---

## 🏗️ Arquitectura General

### Flujo de Datos

```
WordPress (origen)
    ↓ HTTP POST (imagen)
[1] /server/api/blog/upload-image.post.ts
    ↓ Sharp optimization
    ↓ Firebase Storage upload
    ← URL retornada

WordPress construye post con URLs
    ↓ HTTP POST (post completo)
[2] /server/api/blog/wordpress-sync.post.ts
    ↓ Middleware (IP + API Key + Rate Limit)
    ↓ Transformador (WordPress → Markdown)
    ↓ Firebase Storage (guarda .md)

[3] Nuxt Content Runtime Loader
    ↓ Fetch posts desde Storage (cache 5 min)
    ↓ Merge con posts estáticos
    ↓ Blog pages → Usuarios finales
```

### Componentes Principales

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **Middleware Seguridad** | `server/middleware/blog-api-auth.ts` | Rate limiting + API Key + IP whitelist |
| **Endpoint Upload** | `server/api/blog/upload-image.post.ts` | Optimizar y subir imágenes |
| **Endpoint Sync** | `server/api/blog/wordpress-sync.post.ts` | Transformar y guardar posts |
| **Optimizador Sharp** | `server/utils/image-optimizer.ts` | Pipeline resize + webp |
| **Storage Client** | `server/utils/firebase-storage.ts` | Firebase Storage SDK wrapper |
| **Transformador WP** | `server/utils/wordpress-to-nuxt.ts` | WordPress API → Nuxt Content |
| **Loader Dinámico** | `server/plugins/content-dynamic-loader.ts` | Cargar posts runtime |
| **Error Handler** | `server/utils/error-handler.ts` | Manejo centralizado errores |
| **Logger** | `server/utils/logger.ts` | Logging estructurado JSON |

---

## 🔐 Seguridad

### Capas de Protección

1. **IP Whitelist**: Solo IPs autorizadas pueden llamar la API
2. **API Key**: Header `X-API-Key` obligatorio
3. **Rate Limiting**: 100 requests/hora por IP
4. **Validación de Archivos**: Solo imágenes ≤10MB
5. **Sanitización**: Strip HTML tags en títulos/descripciones

### Configuración

```typescript
// nuxt.config.ts
runtimeConfig: {
  // Firebase Admin
  firebaseProjectId: '',        // NUXT_FIREBASE_PROJECT_ID
  firebaseClientEmail: '',      // NUXT_FIREBASE_CLIENT_EMAIL
  firebasePrivateKey: '',       // NUXT_FIREBASE_PRIVATE_KEY
  firebaseStorageBucket: '',    // NUXT_FIREBASE_STORAGE_BUCKET

  // Blog API
  blogApiKey: '',               // NUXT_BLOG_API_KEY
  blogApiAllowedIps: '',        // NUXT_BLOG_API_ALLOWED_IPS (comma-separated)
}
```

---

## 📸 Optimización de Imágenes con Sharp

### Pipeline de Transformación

```
Input: imagen.jpg (4000x3000px, 3.2MB, JPEG)
    ↓
[1] Resize
    - Featured: 1920x1080px (fit: cover)
    - Content: 1200px width (fit: inside)
    ↓
[2] Conversión WebP
    - Quality: 85 (featured) / 80 (content)
    - Effort: 4
    - Smart subsampling
    ↓
Output: imagen.webp (1920x1440px, 245KB, WebP)
Ahorro: 92.3%
```

### Configuración por Tipo

| Tipo | Dimensiones | Quality | Use Case |
|------|-------------|---------|----------|
| **featured** | 1920x1080 (cover) | 85 | Imagen destacada del post |
| **content** | 1200px max (inside) | 80 | Imágenes inline en contenido |

### Métricas Esperadas

- **Tiempo de procesamiento**: 200-500ms por imagen
- **Ahorro de peso**: 70-95% vs JPEG original
- **Compatibilidad WebP**: 97%+ navegadores modernos

---

## 🔄 Transformación WordPress → Nuxt Content

### Mapeo de Campos

| WordPress | Nuxt Content | Transformación |
|-----------|--------------|----------------|
| `title.rendered` | `title` | Strip HTML tags |
| `excerpt.rendered` | `description` | Strip HTML, max 160 chars |
| `content.rendered` | Body (Markdown) | HTML → Markdown (Turndown) |
| `slug` | Filename | `{slug}.md` |
| `date` | `date` | ISO 8601 |
| `modified` | `updated` | ISO 8601 |
| `_embedded.wp:featuredmedia[0].source_url` | `image` | URL directa |
| `_embedded.wp:term[0]` | `category` | Mapeo custom |
| `_embedded.wp:term[1]` | `tags` | Array strings |

### Mapeo de Categorías

```typescript
const CATEGORY_MAP = {
  'Guías': 'guias',
  'Rutas': 'rutas',
  'Destinos': 'destinos',
  'Tips': 'tips',
  'default': 'guias'
}
```

### Ejemplo de Output

```markdown
---
title: "Requisitos para Alquilar un Carro en Colombia 2026"
description: "Guía completa con todos los documentos necesarios..."
image: https://firebasestorage.googleapis.com/.../imagen.webp
alt: Persona mostrando documentos para alquilar carro
author:
  name: Alquilatucarro
  avatar: https://firebasestorage.googleapis.com/.../logo.png
date: 2026-02-13T10:30:00
updated: 2026-02-13T12:00:00
category: guias
tags:
  - requisitos
  - documentos
  - colombia
readingTime: 8
featured: false
---

¿Estás planeando un viaje por Colombia...
```

---

## 💾 Persistencia en Firebase Storage

### Estructura de Directorios

```
gs://rentacar-403321.firebasestorage.app/
  ├── blog-images/
  │   ├── featured/
  │   │   ├── 1708012345-abc123.webp
  │   │   └── 1708012346-def456.webp
  │   └── content/
  │       ├── 1708012347-ghi789.webp
  │       └── 1708012348-jkl012.webp
  └── blog-posts/
      ├── requisitos-alquilar-carro-colombia.md
      ├── pico-y-placa-colombia-2026.md
      └── tipos-carros-alquilar-cual-elegir.md
```

### Configuración de Archivos

- **Content-Type**: `image/webp` (imágenes), `text/markdown` (posts)
- **Cache-Control**: `public, max-age=31536000` (1 año)
- **Permisos**: Público (lectura)

---

## ⚡ Carga Dinámica en Runtime

### Plugin Nitro

```typescript
// server/plugins/content-dynamic-loader.ts
- Hook: content:file:beforeParse
- Cache: 5 minutos TTL
- Operación:
  1. Listar archivos en blog-posts/
  2. Descargar .md desde Storage
  3. Parsear frontmatter
  4. Cachear en memoria
```

### Endpoint de Servicio

```typescript
GET /api/blog/posts-dynamic
Response: Array<BlogPost>
```

### Integración con Blog

```typescript
// pages/blog/index.vue
const staticPosts = await queryCollection('blog').all()
const dynamicPosts = await $fetch('/api/blog/posts-dynamic')
const allPosts = [...staticPosts, ...dynamicPosts]
```

---

## 📊 APIs del Sistema

### 1. Upload de Imagen

**Endpoint:** `POST /api/blog/upload-image`

**Request:**
```http
POST /api/blog/upload-image
X-API-Key: super-secret-key
Content-Type: multipart/form-data

file: <binary>
type: "featured" | "content" (opcional)
alt: "Descripción" (opcional)
```

**Response 200:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/.../imagen.webp",
  "filename": "1708012345-abc123.webp",
  "originalSize": 3200000,
  "optimizedSize": 245000,
  "savings": "92.3%"
}
```

**Errores:**
- `400`: Archivo inválido o faltante
- `401`: API Key inválida
- `403`: IP no autorizada
- `413`: Archivo >10MB
- `429`: Rate limit excedido

---

### 2. Sincronización de Post

**Endpoint:** `POST /api/blog/wordpress-sync`

**Request:**
```json
{
  "id": 123,
  "title": { "rendered": "Título del Post" },
  "content": { "rendered": "<p>Contenido HTML...</p>" },
  "excerpt": { "rendered": "<p>Descripción...</p>" },
  "date": "2026-02-13T10:30:00",
  "modified": "2026-02-13T12:00:00",
  "slug": "titulo-del-post",
  "_embedded": {
    "wp:featuredmedia": [{
      "source_url": "https://storage.googleapis.com/.../featured.webp"
    }],
    "wp:term": [
      [{ "name": "Guías" }],
      [{ "name": "requisitos" }, { "name": "colombia" }]
    ]
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "slug": "titulo-del-post",
  "path": "blog-posts/titulo-del-post.md",
  "url": "/blog/titulo-del-post"
}
```

**Errores:**
- `400`: Payload inválido
- `401`: API Key inválida
- `403`: IP no autorizada
- `429`: Rate limit excedido
- `500`: Error en transformación

---

## 🚨 Manejo de Errores

### Estrategia

1. **Validación temprana**: Rechazar requests inválidos antes de procesar
2. **Logging estructurado**: JSON logs para cada operación
3. **Error bubbling**: Errors específicos con contexto
4. **No crash**: Fallos en carga dinámica no rompen el sitio

### Logging

```json
{
  "level": "ERROR",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "operation": "upload-image",
  "error": "File too large",
  "ip": "203.0.113.5",
  "size": 12000000
}
```

---

## ⚙️ Configuración de Deployment

### Firebase Functions

```typescript
// nuxt.config.ts
nitro: {
  firebase: {
    httpsOptions: {
      maxInstances: 1,
      memory: '1GiB',        // ← Optimizado para Sharp
      timeoutSeconds: 60
    }
  }
}
```

### Variables de Entorno

```bash
# .env (no commitear)
NUXT_FIREBASE_PROJECT_ID=rentacar-403321
NUXT_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@...
NUXT_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NUXT_FIREBASE_STORAGE_BUCKET=rentacar-403321.firebasestorage.app
NUXT_BLOG_API_KEY=change-me-super-secret
NUXT_BLOG_API_ALLOWED_IPS=203.0.113.5,203.0.113.10
```

### Dependencias Nuevas

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "sharp": "^0.33.0",
    "turndown": "^7.2.0"
  }
}
```

### .gitignore

```gitignore
# Posts dinámicos
content-dynamic/
blog-posts/

# Credentials
.env
.env.local
serviceAccountKey.json
```

---

## 📈 Métricas y Performance

### Benchmarks Esperados

| Operación | Tiempo | Memoria | Costo/Request |
|-----------|--------|---------|---------------|
| Upload imagen (2MB) | 300ms | 85 MB | $0.0000012 |
| Sync post | 150ms | 60 MB | $0.0000008 |
| Load posts (cache hit) | 5ms | 10 MB | $0 |
| Load posts (cache miss) | 800ms | 120 MB | $0.000003 |

### Escalabilidad

- **Auto-scaling**: Firebase Functions escala automáticamente
- **Concurrencia**: Sin límite (instancias ilimitadas)
- **Cache**: 5 min TTL reduce 99% de llamadas a Storage
- **Costo mensual estimado**: ~$0.50 para 1,000 posts/mes

---

## 🔄 Alternativas Consideradas

### Build-time vs Runtime

**Decisión:** Runtime (con nota para migrar a build-time si SEO crítico)

| Aspecto | Runtime (Elegido) | Build-time |
|---------|-------------------|------------|
| **Publicación** | Instantánea | 5-10 min rebuild |
| **SEO** | Bueno (SSR) | Perfecto (static) |
| **Performance** | Bueno (cache) | Excelente (CDN) |
| **Complejidad** | Baja | Media (webhook trigger) |
| **Flexibilidad** | Alta | Baja |

**Plan futuro:** Si Core Web Vitals lo requieren, migrar a build-time es refactorización acotada.

---

## ✅ Criterios de Éxito

1. ✅ WordPress puede subir imágenes y recibir URLs
2. ✅ WordPress puede crear posts que aparecen en `/blog` inmediatamente
3. ✅ Imágenes optimizadas a WebP con ahorro >70%
4. ✅ API bloqueada para IPs no autorizadas
5. ✅ Rate limiting previene abuso
6. ✅ Posts persisten entre deploys
7. ✅ Cache reduce latencia a <50ms (cache hit)
8. ✅ Logs estructurados para debugging

---

## 📚 Referencias

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Nuxt Content](https://content.nuxt.com/)
- [Turndown (HTML to Markdown)](https://github.com/mixmark-io/turndown)

---

**Aprobado para implementación:** 2026-02-14
**Próximo paso:** Crear plan de implementación detallado
