# Baseline SEO - Enero 2025

> Estado: **Actualizado**
> Fecha inicial: 2025-01-11
> Última actualización: 2025-01-15
> Método: Búsqueda manual en Google + PageSpeed Insights + Auditoría técnica + GSC

## Resumen Ejecutivo

| Métrica | Valor Inicial (Ene 11) | Valor Actual (Ene 15) | Cambio |
|---------|------------------------|----------------------|--------|
| Domain Authority (MOZ) | Pendiente | Pendiente | - |
| Keywords en Top 10 | 0 de 19 | 0 de 19 | = |
| Performance Mobile | 76/100 | 68-71/100 | 🔻 |
| LCP Mobile | 4.5s 🔴 | 0.9s 🟢 | ✅ +80% |
| CLS Mobile | 0 🟢 | 0.772 🔴 | ⚠️ Regresión |
| Accessibility Score | - | 100/100 🟢 | - |
| SEO Score | - | 100/100 🟢 | - |
| **Clics GSC (3 meses)** | - | 403 | - |
| **Impresiones GSC** | - | 18,700 | - |
| **CTR GSC** | - | 2.2% | - |
| **Posición Media GSC** | - | 21.2 | - |

### Hallazgos Principales

1. **LCP MEJORADO**: De 4.5s a 0.9s - excelente progreso
2. **CLS EMPEORADO**: De 0 a 0.772 - PR #44 en deploy para corregir
3. **Brand queries bien posicionadas**: "alquilatucarro" en posición 3, "alquila tu carro" en posición 1
4. **Ibagué casi en Top 10**: Posición 9.5 - oportunidad de optimización
5. **Tráfico www/non-www dividido**: Requiere redirección canónica
6. **Problemas técnicos en fix**: PR #44 corrige doble H1 + CLS + FOUC

---

## Posiciones Actuales por Ciudad

| Ciudad | Keyword | Posición | Competidores en Top 3 |
|--------|---------|----------|----------------------|
| Bogotá | alquiler de carros bogota | >10 | Localiza, Despegar, Alamo |
| Medellín | alquiler de carros medellin | >10 | Localiza, Alamo, Despegar |
| Cali | alquiler de carros cali | >10 (estimado) | - |
| Barranquilla | alquiler de carros barranquilla | >10 (estimado) | - |
| Cartagena | alquiler de carros cartagena | >10 | Localiza, Alamo, Executive |
| Santa Marta | alquiler de carros santa marta | >10 (estimado) | - |
| Bucaramanga | alquiler de carros bucaramanga | >10 (estimado) | - |
| Pereira | alquiler de carros pereira | >10 (estimado) | - |
| Armenia | alquiler de carros armenia | >10 (estimado) | - |
| Manizales | alquiler de carros manizales | >10 (estimado) | - |
| Ibagué | alquiler de carros ibague | >10 (estimado) | - |
| Neiva | alquiler de carros neiva | >10 (estimado) | - |
| Villavicencio | alquiler de carros villavicencio | >10 (estimado) | - |
| Cúcuta | alquiler de carros cucuta | >10 (estimado) | - |
| Montería | alquiler de carros monteria | >10 (estimado) | - |
| Valledupar | alquiler de carros valledupar | >10 (estimado) | - |
| Floridablanca | alquiler de carros floridablanca | >10 (estimado) | - |
| Palmira | alquiler de carros palmira | >10 (estimado) | - |
| Soledad | alquiler de carros soledad | >10 (estimado) | - |

**Nota:** Ciudades marcadas "estimado" basadas en patrón consistente de las 3 verificadas.
**Total:** 19 ciudades operativas.

---

## Competidores Identificados (Top 10 Bogotá)

| Posición | Competidor | Tipo |
|----------|------------|------|
| 1 | Localiza | Multinacional |
| 2 | Despegar | Agregador |
| 3 | Alamo | Multinacional |
| 4 | Executive Rent a Car | Local |
| 5 | Equirent | Local |
| 6 | Rentcars | Agregador |
| 7 | Kayak | Agregador |
| 8 | Alkilautos | Agregador local |
| 9 | Autoalquilados | Local |
| 10 | Renting Colombia | Local |

---

## Métricas de Autoridad

| Herramienta | Métrica | Valor |
|-------------|---------|-------|
| MOZ | Domain Authority | Pendiente |
| MOZ | Page Authority (Home) | Pendiente |
| Majestic | Trust Flow | Pendiente |
| Majestic | Citation Flow | Pendiente |

**Nota:** Requiere acceso a SEO Conjuntas para obtener estos datos.

---

## Core Web Vitals (PageSpeed Insights)

### Medición Actual (2025-01-15) - Mobile

| Ciudad | Performance | LCP | CLS | Accessibility | SEO | Best Practices |
|--------|-------------|-----|-----|---------------|-----|----------------|
| Bogotá | 71 | 0.9s 🟢 | 0.772 🔴 | 100 🟢 | 100 🟢 | 96 🟢 |
| Medellín | 68 | 0.9s 🟢 | 0.772 🔴 | 100 🟢 | 100 🟢 | 96 🟢 |
| Cali | ~70 | ~0.9s 🟢 | ~0.772 🔴 | 100 🟢 | 100 🟢 | ~96 🟢 |
| Cartagena | ~70 | ~0.9s 🟢 | ~0.772 🔴 | 100 🟢 | 100 🟢 | ~96 🟢 |
| Barranquilla | ~70 | ~0.9s 🟢 | ~0.772 🔴 | 100 🟢 | 100 🟢 | ~96 🟢 |

**Nota:** Valores con ~ son estimados basados en patrón consistente entre ciudades.

### Comparativa con Medición Inicial (2025-01-11)

| Métrica | Ene 11 | Ene 15 | Cambio | Notas |
|---------|--------|--------|--------|-------|
| LCP Mobile | 4.5s 🔴 | 0.9s 🟢 | **-80%** ✅ | Optimizaciones de imagen/animación |
| CLS Mobile | 0 🟢 | 0.772 🔴 | **Regresión** ⚠️ | Iconos de estrellas sin CSS crítico |
| Performance | 76 | 68-71 | -5 a -8 | CLS afecta score |
| Accessibility | - | 100 | - | Excelente |
| SEO Score | - | 100 | - | Excelente |

### Problema Actual: CLS de 0.772

**Causa identificada**: Iconos de estrellas (`Icon name="heroicons:star"`) causan layout shift porque:
1. El CSS de Tailwind (`.w-5`, `.h-5`) no está en critical CSS
2. `svg { height: auto }` global sobreescribe atributos HTML
3. Las estrellas se renderizan grandes y luego saltan a tamaño correcto

**Solución**: PR #43 - Agregar `.w-5`, `.h-5` al CSS crítico en `nuxt.config.ts`

**Estado**: Pendiente de merge y deploy

### Desktop (Score: ~99/100) 🟢

Desktop mantiene excelente rendimiento - sin cambios significativos.

---

## Auditoría de Meta Tags (2025-01-15)

### Resumen por Ciudad

| Ciudad | Title | Description | H1 Count | OG Image | Canonical |
|--------|-------|-------------|----------|----------|-----------|
| Bogotá | 59 chars ✅ | 157 chars ✅ | 2 ⚠️ | ❌ Missing | ✅ |
| Medellín | 61 chars ✅ | 150 chars ✅ | 2 ⚠️ | ❌ Missing | ✅ |
| Cartagena | 62 chars ✅ | 157 chars ✅ | 2 ⚠️ | ❌ Missing | ✅ |

### Problemas Detectados

#### 1. Doble H1 en todas las páginas ⚠️
- **Actual**: 2 etiquetas H1 por página
- **Correcto**: Solo 1 H1 por página
- **Impacto**: Confusión para SEO sobre contenido principal
- **Ubicación**: H1 en header (logo) + H1 en hero

#### 2. OG Image Faltante ❌
- **Actual**: No hay `og:image` meta tag
- **Impacto**: Previews pobres en redes sociales (Facebook, LinkedIn, WhatsApp)
- **Solución**: Agregar imagen OG por ciudad o genérica

#### 3. Typo en H1 Hero ⚠️
- **Actual**: "ALQUILERDE CARROS EN [CIUDAD]"
- **Correcto**: "ALQUILER DE CARROS EN [CIUDAD]" (falta espacio)
- **Impacto**: Profesionalismo, keyword matching

### Elementos Correctos ✅
- Title tags: Longitud óptima (50-65 chars)
- Meta descriptions: Longitud óptima (150-160 chars)
- Canonical URLs: Correctas
- Keywords incluidas en title y description
- Schema LocalBusiness presente

---

## Google Search Console (Últimos 3 meses)

> Fecha de captura: 2025-01-15
> Período: Octubre 2025 - Enero 2026

| Métrica | Valor |
|---------|-------|
| Impresiones Totales | 18,700 |
| Clics Totales | 403 |
| CTR Promedio | 2.2% |
| Posición Promedio | 21.2 |

### Top Queries (por clics)

| Query | Clics | Impresiones | CTR | Posición |
|-------|-------|-------------|-----|----------|
| alquilatucarro | 71 | 160 | 44.4% | 3.0 |
| alquila tu carro | 46 | 211 | 21.8% | 1.1 |
| alquiler de carros bogotá éxito | 6 | 327 | 1.8% | 11.2 |
| alquiler de carros bogotá sin tarjeta de crédito | 4 | 324 | 1.2% | 8.6 |
| alquiler de carros sin tarjeta de crédito bogotá | 4 | 127 | 3.1% | 8.4 |
| alquiler carro monteria | 2 | 109 | 1.8% | 10.9 |
| alquiler de carros en bogota sin tarjeta de credito | 2 | 54 | 3.7% | 7.5 |
| alquiler de carros floridablanca | 2 | 31 | 6.5% | 10.1 |

**Análisis de Queries:**
- ✅ **Brand queries dominan** - "alquilatucarro" y "alquila tu carro" tienen posiciones 1-3
- ✅ **Keywords "sin tarjeta de crédito"** bien posicionadas (7-9) - diferenciador clave
- ⚠️ **Keywords de ciudades** aún fuera de top 10 para queries principales

### Top Páginas (por clics)

| Página | Clics | Impresiones | CTR | Posición |
|--------|-------|-------------|-----|----------|
| https://alquilatucarro.com/ | 323 | 14,802 | 2.2% | 20.5 |
| https://www.alquilatucarro.com/ | 72 | 3,163 | 2.3% | 26.9 |
| https://alquilatucarro.com/ibague | 2 | 81 | 2.5% | 9.5 |
| https://alquilatucarro.com/manizales | 1 | 109 | 0.9% | 11.2 |

**Hallazgos:**
- ⚠️ **Tráfico dividido www/non-www**: 323 vs 72 clics - configurar redirección canónica
- ✅ **Ibagué mejor posicionada**: Posición 9.5 (casi en Top 10)
- ✅ **Manizales progresando**: Posición 11.2 con 109 impresiones

---

## Análisis FODA (Actualizado Enero 15)

### Fortalezas
- ✅ LCP Mobile excelente: 0.9s (mejora del 80% vs inicial)
- ✅ Core Web Vitals Desktop excelentes (99/100)
- ✅ Accessibility Score perfecto: 100/100
- ✅ SEO Score perfecto: 100/100
- ✅ TBT bajo (buen JavaScript)
- ✅ Sitio funcional y moderno
- ✅ Meta tags bien optimizados (title, description)
- ✅ Schema LocalBusiness implementado
- ✅ **Brand queries bien posicionadas** (posición 1-3 para "alquilatucarro")
- ✅ **Diferenciador "sin tarjeta de crédito"** posicionado (pos 7-9)
- ✅ **GSC verificado** con datos de 3 meses: 403 clics, 18.7K impresiones

### Debilidades
- ❌ **CLS Mobile crítico: 0.772** (objetivo < 0.1) - iconos de estrellas
- ❌ Keywords de ciudades fuera de Top 10
- ❌ Doble H1 en todas las páginas de ciudad
- ❌ Falta OG Image para social sharing
- ❌ Typo "ALQUILERDE" en H1 hero
- ❌ Sin datos de autoridad de dominio conocidos
- ❌ **Tráfico dividido www/non-www** (323 vs 72 clics)

### Oportunidades
- 🎯 19 ciudades = 19 oportunidades de posicionamiento
- 🎯 **Ibagué casi en Top 10** (posición 9.5) - optimizar para entrar
- 🎯 **Manizales progresando** (posición 11.2, 109 impresiones)
- ~~🎯 **Keywords "sin tarjeta de crédito"** ya posicionadas - expandir contenido~~ → **ANULADO 2026-07-29 por el dueño.** No expandir: la tarjeta de crédito es obligatoria, así que atraer más de esa búsqueda trae gente que no puede alquilar. La FAQ del home que ya rankea SE QUEDA (responde "no" honestamente y ahorra la llamada), pero no se escribe contenido nuevo para el tema. Ver `docs/specs/2026-07-29-parrilla-blog-design.md`.
- 🎯 Long-tail keywords con poca competencia
- 🎯 FAQs estructuradas para featured snippets
- 🎯 Contenido local diferenciado por ciudad

### Amenazas
- ⚠️ Competidores con alto DA (Localiza, Kayak, Despegar)
- ⚠️ Agregadores con gran inversión SEO
- ⚠️ Google Local Pack favorece negocios con ubicación física

---

## Próximos Pasos Prioritarios

### ✅ Completados (2026-01-16)
1. ~~**Merge PR #43**~~ → ✅ **PR #44 mergeado** - Fix CLS estrellas + doble H1 + FOUC
2. ✅ **PR #46 mergeado** - Redirección www → non-www canónica
3. **Agregar OG Image** - Para mejor social sharing (pendiente)

### 🟡 Alta Prioridad (Este mes)
4. **Obtener métricas DA/PA** - Con MOZ/SEMRush
5. **Optimizar página Ibagué** - Ya en posición 9.5, push para Top 10
6. ~~**Expandir contenido "sin tarjeta de crédito"**~~ - **ANULADO 2026-07-29:** tema vetado, no expandir (ver Oportunidades arriba)

### 🟢 Media Prioridad (Próximo mes)
7. **Análisis de competidores** - Top 3 por ciudad
8. **Gap de keywords** - Identificar oportunidades
9. **Contenido local** - Diferenciar páginas de ciudad
10. **FAQs estructuradas** - Para featured snippets

---

## Metodología de Captura

- **Posiciones:** Búsqueda manual en Google.com (Colombia) modo incógnito
- **Core Web Vitals:** PageSpeed Insights (pagespeed.web.dev)
- **Meta Tags:** Browser automation + JavaScript extraction
- **Fechas:** 2025-01-11 (inicial), 2025-01-15 (actualización)

---

## Histórico de Actualizaciones

| Fecha | Cambio |
|-------|--------|
| 2025-01-11 | Baseline inicial capturado |
| 2025-01-15 | Actualización Core Web Vitals: LCP mejoró 80% (4.5s → 0.9s), CLS empeoró (0 → 0.772) |
| 2025-01-15 | Auditoría meta tags: detectados doble H1, falta OG Image, typo en hero |
| 2025-01-15 | PR #43 creado para corregir CLS (CSS crítico para iconos) |
| 2025-01-15 | **Datos GSC capturados**: 403 clics, 18.7K impresiones, CTR 2.2%, pos. media 21.2 |
| 2025-01-15 | PR #44 creado: fix CLS estrellas (SVG dimensions) + doble H1 + FOUC prevention |
| 2025-01-15 | Hallazgo: tráfico dividido www/non-www, Ibagué en pos 9.5 (casi Top 10) |

---

## Tickets/PRs Relacionados

| PR | Estado | Impacto |
|----|--------|---------|
| #43 | Cerrado | Intento inicial de fix CLS (parcial) |
| #44 | En deploy | Fix CLS estrellas + doble H1 + FOUC (CSS crítico completo) |
