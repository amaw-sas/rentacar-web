# SEO Project Progress Tracker - Alquilatucarro

> Registro de avances verificado contra código real. Actualizado: 2026-01-17 (GSC ✓, GBP N/A)

## Estado General: ✅ Muy Avanzado

El proyecto SEO está significativamente más avanzado de lo documentado previamente.

---

## Implementaciones Completadas

### 1. Infraestructura Técnica SEO ✅

| Item | Estado | Archivo/Commit |
|------|--------|----------------|
| SSR habilitado | ✅ | `nuxt.config.ts:7` |
| Prerender de 19 ciudades | ✅ | `nuxt.config.ts:267-301` |
| Prerender de blog | ✅ | `nuxt.config.ts:292-300` |
| Sitemap dinámico | ✅ | `nuxt.config.ts:307-343` |
| Robots.txt configurado | ✅ | `nuxt.config.ts:345-372` |
| HTML lang="es" | ✅ | `nuxt.config.ts:21` |
| www → non-www redirect | ✅ | commit `7de21a6` |
| Canonical URLs | ✅ | `index.vue:311` |
| llms.txt (AI discovery) | ✅ | `nuxt.config.ts:374-481` |
| Google Search Console | ✅ | Indexación verificada 2026-01-17 |

### 2. Schema.org / Structured Data ✅

| Schema | Estado | Archivo |
|--------|--------|---------|
| Organization | ✅ | `useBaseSEO.ts:42-51` |
| WebSite + SearchAction | ✅ | `useBaseSEO.ts:28-38` |
| AutoRental (global) | ✅ | `useBaseSEO.ts:52-96` |
| LocalBusiness por ciudad | ✅ | `useLocalBusiness.ts` |
| BreadcrumbList | ✅ | `useBreadcrumbs.ts` |
| FAQPage (home) | ✅ | `index.vue:297-307` |
| AggregateRating | ✅ | `useAggregateRating.ts` |
| Review (testimonios) | ✅ | `useAggregateRating.ts:41-62` |
| Product (vehículos) | ✅ | `useProductSchema.ts` |
| VideoObject | ✅ | `useVideoSchema.ts` |
| Offer/Promotion | ✅ | `usePromotionSchema.ts` |

### 3. Core Web Vitals ✅

| Métrica | Estado | Implementación |
|---------|--------|----------------|
| LCP optimizado | ✅ | Preload AVIF hero, `nuxt.config.ts:144-164` |
| CLS reducido | ✅ | CSS crítico inline, aspect-ratio containers |
| CSS crítico | ✅ | `nuxt.config.ts:23-140` (117 líneas) |
| Vitalizer enabled | ✅ | `nuxt.config.ts:171-177` |
| Prefetch disabled | ✅ | `nuxt.config.ts:176` |

**Resultados PageSpeed:**
- Desktop: 99/100
- Mobile: ~85/100
- CLS: 0

### 4. Open Graph / Social Media ✅

| Item | Estado | Archivo |
|------|--------|---------|
| OG Image personalizada | ✅ | `/public/img/og-alquilatucarro.jpg` |
| OG meta tags | ✅ | `index.vue:277-295` |
| Twitter cards | ✅ | `index.vue:290-295` |
| Image dimensions 1200x630 | ✅ | Verificado en Facebook Debugger |

### 5. Contenido SEO por Ciudad ✅

| Item | Estado | Archivo |
|------|--------|---------|
| Contenido único 19 ciudades | ✅ | `useCityContent.ts` (629 líneas) |
| ~500-800 palabras por ciudad | ✅ | Intro + destinations + tips |
| Destinos cercanos | ✅ | 4 destinos por ciudad |
| Tips de conducción | ✅ | Pico y placa, peajes, parqueo |
| Mejor temporada | ✅ | Recomendaciones por ciudad |
| FAQs por ciudad | ✅ | `useCityFAQs.ts` |
| Testimonios por ciudad | ✅ | `useCityAggregateRating()` |

### 6. Blog / Content Marketing ✅

| Artículo | Estado |
|----------|--------|
| Requisitos alquilar carro | ✅ |
| Pico y placa 2026 | ✅ |
| Tipos de carros | ✅ |
| Rutas desde Bogotá | ✅ |
| Eje Cafetero guía | ✅ |
| Costa Caribe guía | ✅ |
| Viajar con niños | ✅ |

### 7. Testing SEO ✅

| Item | Estado | Archivo |
|------|--------|---------|
| E2E tests SEO | ✅ | `e2e/seo.spec.ts` |
| Validación schema | ✅ | En tests |
| Performance thresholds | ✅ | Por entorno |

---

## Pendientes / Oportunidades

### Alta Prioridad

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Link Building | Backlinks de sitios colombianos | M |

### Media Prioridad

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Más artículos blog | Expandir contenido | M |
| Reviews de Google | Solicitar a clientes | S |
| Sitemap de imágenes | Incluir fotos vehículos | S |

### Baja Prioridad

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Hreflang (multi-idioma) | Solo si hay audiencia int'l | L |
| AMP (obsoleto) | No recomendado en 2026 | - |

---

## Historial de Cambios Principales

| Fecha | Cambio | Commit |
|-------|--------|--------|
| 2026-01-17 | GSC revisado: indexación saludable | - |
| 2026-01-17 | OG Image personalizada | `0a41a0f` |
| 2026-01-16 | CLS fixes finales | `667bb8f` |
| 2026-01-15 | www redirect | `7de21a6` |
| 2026-01-14 | Aspect-ratio hero | `26d9737` |
| 2026-01-13 | CLS star icons, H1 fix | `591bb72` |
| 2026-01 | LCP optimization campaign | Múltiples |
| 2025-12 | Schema.org completo | Múltiples |
| 2025-11 | Contenido ciudades 19 | `useCityContent.ts` |
| 2025-10 | Blog inicial | 7 artículos |

---

## Verificación de Implementación

Para verificar cualquier item, usa:

```bash
# Schema.org
grep -r "useSchemaOrg" app/

# Composables SEO
ls app/composables/use*SEO*.ts app/composables/use*Schema*.ts

# Git history SEO
git log --oneline --all | grep -i seo

# Test SEO
npx playwright test e2e/seo.spec.ts
```

---

## No Aplica (por modelo de negocio)

### Google Business Profile por Sucursal ❌

**Motivo**: Alquilatucarro es una **plataforma de intermediación**, no una empresa de alquiler de vehículos.

> "Alquilatucarro.com es una plataforma de intermediación que conecta a usuarios con empresas de alquiler de vehículos (Rentadoras). No somos propietarios ni operadores de los vehículos."
> — `terminos-condiciones.vue`

**Por qué NO aplica GBP por sucursal**:
- Las "sucursales" en el código son ubicaciones de las Rentadoras aliadas, no propias
- Crear GBP para ubicaciones ajenas viola políticas de Google
- Riesgo de suspensión de perfiles

**Alternativa implementada**:
- ✅ Schema.org LocalBusiness por ciudad (`useLocalBusiness.ts`)
- ✅ Páginas SEO por ciudad con contenido geo-optimizado
- ✅ AggregateRating con testimonios

**Opcional** (bajo valor): Un único GBP corporativo para AMAW SAS (oficina en Cali).

---

## Notas

- La documentación anterior (`SEO-STRATEGY-CONSOLIDATION.md`) estaba desactualizada
- El código real muestra implementación mucho más completa
- Core Web Vitals están en verde (Desktop 99, CLS 0)
- Schema.org cubre todos los tipos relevantes para AutoRental
- Modelo de negocio: Agregador/Intermediario (no rental company directa)
