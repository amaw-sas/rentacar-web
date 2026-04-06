# SEO Command Center - Diseño del Sistema

**Fecha:** 2026-01-18
**Estado:** Aprobado
**Autor:** Claude + Diego

---

## Resumen Ejecutivo

Sistema de dashboard web local para tracking completo de SEO, incluyendo métricas de resultado y actividad, con integración a Moz y Google Search Console via MCPs.

### Decisiones de Diseño

| Aspecto | Decisión |
|---------|----------|
| Ubicación | Ruta `/seo` en sitio actual (Nuxt 3) |
| Autenticación | Password simple via `SEO_PASSWORD` env var |
| Persistencia | Archivos JSON/MD en `docs/seo/data/` (versionados en git) |
| Herramientas | Moz Pro + Google Search Console |
| Actualización | Semi-automática con skill `/seo-update` |

---

## Objetivos del Proyecto

| Métrica | Actual | 3 meses | 6 meses |
|---------|-------:|--------:|--------:|
| Domain Authority | 53 | 55 | 58 |
| Backlinks totales | 6,994 | 8,000 | 10,000 |
| Linking domains | 433 | 500 | 600 |
| Keywords top 20 | 0 | 3 | 10 |
| Internal links | 33 | 183 | 333 |
| Blog posts | 7 | 11 | 15 |

---

## Arquitectura

```
rentacar-main/
│
├── app/pages/seo/                    # Dashboard (8 páginas)
│   ├── index.vue                     # Overview + KPIs + Alertas
│   ├── backlinks.vue                 # Tracking backlinks
│   ├── tareas.vue                    # Checklist + Activity tracking
│   ├── keywords.vue                  # Posiciones + targets
│   ├── contenido.vue                 # Blog + Internal links + CTR + Freshness
│   ├── competidores.vue              # Comparativa DA
│   ├── herramientas.vue              # MCPs + Cuotas
│   ├── rendimiento.vue               # GSC + Core Web Vitals
│   └── analisis/[...slug].vue        # Viewer reportes MD
│
├── app/middleware/
│   └── seo-auth.ts                   # Middleware autenticación
│
├── docs/seo/
│   ├── data/                         # JSONs versionados
│   │   ├── metrics.json              # KPIs históricos
│   │   ├── backlinks.json            # Lista backlinks
│   │   ├── tasks.json                # Tareas mensuales
│   │   ├── activity.json             # Log de actividad
│   │   ├── keywords.json             # Rankings
│   │   ├── competitors.json          # DA competidores
│   │   ├── content.json              # Blog + internal links + CTR
│   │   ├── performance.json          # GSC + CWV
│   │   └── tools.json                # MCPs + cuotas
│   │
│   ├── reports/                      # Reportes mensuales
│   │   └── YYYY-MM-monthly.md
│   │
│   └── setup/                        # Guías de configuración
│       ├── moz-mcp-setup.md
│       └── gsc-oauth-setup.md
│
├── server/api/seo/                   # API endpoints
│   ├── auth.post.ts                  # Login con SEO_PASSWORD
│   ├── metrics.get.ts
│   ├── backlinks.[get|post].ts
│   ├── tasks.[get|post|patch].ts
│   ├── activity.[get|post].ts
│   └── [...].ts
│
└── .claude/commands/
    └── seo-update.md                 # Skill actualización
```

---

## Secciones del Dashboard

### 1. Overview (`/seo`)

KPIs principales con barras de progreso hacia metas:

- Domain Authority: 53 → 58
- Backlinks: 6,994 → 10,000
- Linking Domains: 433 → 600
- Keywords Top 20: 0 → 10

**Alertas:**
- Días sin actividad
- Cuotas de herramientas por vencer
- Balance de backlinks (ganados vs perdidos)

**Acciones rápidas:**
- Botón ejecutar `/seo-update`
- Link a último análisis Moz

---

### 2. Backlinks (`/seo/backlinks`)

**Resumen:**
- Total follow / nofollow
- Ganados / perdidos últimos 30 días
- Balance neto

**Tabla de backlinks:**
- Fuente (URL)
- Anchor text
- DA de la fuente
- Follow/Nofollow
- Fecha descubierto
- Estado (activo/perdido/nuevo)

**Filtros:**
- Por tipo (follow/nofollow)
- Por DA mínimo
- Por fecha
- Por estado

---

### 3. Tareas (`/seo/tareas`)

**Progreso mensual:**
- Barra de progreso: X/100 backlinks
- Porcentaje completado

**Checklist por categoría:**
- Directorios
- Guest posts
- Partnerships
- Prensa/PR

**Activity Tracking (Accountability):**

| Actividad | Meta | Hecho | % |
|-----------|------|-------|---|
| Outreach enviados | 50 | X | X% |
| Respuestas recibidas | 15 | X | X% |
| Links conseguidos | 100 | X | X% |
| Artículos publicados | 4 | X | X% |
| Internal links agregados | 50 | X | X% |

**Alertas:**
- "X días sin actividad de outreach"
- "X días sin publicar contenido"

---

### 4. Keywords (`/seo/keywords`)

**Distribución de rankings:**
- Top 1-3: X keywords
- Top 4-10: X keywords
- Top 11-20: X keywords
- Top 21-50: X keywords

**Tabla de keywords tracked:**
- Keyword
- Posición actual
- Volumen mensual
- Dificultad
- Tendencia (subiendo/bajando/estable)

**Keywords objetivo:**
- Lista de keywords por agregar
- Volumen estimado

---

### 5. Contenido (`/seo/contenido`)

**Internal Linking:**
- Progreso: 33 → 500 links
- Barra de progreso
- Páginas huérfanas
- Oportunidades de linking

**Blog - Content Calendar:**
- Artículos publicados (lista)
- Artículos planificados con fecha target
- Botón agregar nuevo artículo

**CTR Optimization:**
- Páginas con bajo CTR
- Sugerencias de mejora
- Estado de optimización

**Content Freshness:**
- Artículos por antigüedad
- Alertas de contenido desactualizado (>6 meses)
- Estado de actualización

**Landing Pages Pipeline:**
- Keywords target para nuevas páginas
- Volumen estimado
- Estado (propuesta/en progreso/publicada)

**Errores 404 con Backlinks:**
- URLs con backlinks desperdiciados
- PA y linking domains
- Acción: crear redirect

---

### 6. Competidores (`/seo/competidores`)

**Ranking visual por DA:**
1. alquilatucarro.com - DA 53
2. rentingcolombia.com - DA 34
3. avis.com.co - DA 19
4. budget.com.co - DA 10
5. hertz.com.co - DA 3
6. sixt.com.co - DA 3

**Tabla comparativa detallada:**
- DA
- Total backlinks
- Linking domains
- Internal links
- Follow %

**Última actualización y botón actualizar**

---

### 7. Rendimiento (`/seo/rendimiento`)

**Google Search Console:**
- Impresiones (últimos 28 días)
- Clicks
- CTR
- Tendencia vs período anterior

**Top páginas por clicks**

**Top queries por clicks**

**Core Web Vitals:**
- PageSpeed Desktop/Mobile
- LCP, FID, CLS
- Histórico últimos 3 meses

**Indexación:**
- Páginas indexadas vs total
- Páginas excluidas

---

### 8. Herramientas (`/seo/herramientas`)

**Moz Pro:**
- Cuenta: seoboom50
- Plan: Pro ($99/mes)
- Cuotas:
  - Domain Overview: X/5 (renueva: fecha)
  - Link Explorer: X/10 (renueva: fecha)
- Estado MCP: instalado/pendiente
- Botones: instalar, documentación

**Google Search Console:**
- Propiedad verificada
- Estado OAuth
- Botones: configurar OAuth, guía setup

**Otras herramientas (opcional):**
- Ahrefs: no configurado
- Semrush: no configurado

---

### 9. Análisis (`/seo/analisis`)

**Lista de reportes disponibles:**
- Por fecha
- Tipo (Moz, mensual, competidores)
- Botones: ver, descargar

**Viewer de markdown:**
- Renderizado del reporte seleccionado
- Navegación entre reportes

---

## Estructura de Datos

### `metrics.json`

```json
{
  "current": {
    "domainAuthority": 53,
    "pageAuthority": 39,
    "backlinksTotal": 6994,
    "linkingDomains": 433,
    "keywordsTop20": 0,
    "spamScore": null,
    "lastUpdated": "2026-01-17"
  },
  "goals": {
    "3months": { "da": 55, "backlinks": 8000, "domains": 500, "keywords": 3 },
    "6months": { "da": 58, "backlinks": 10000, "domains": 600, "keywords": 10 }
  },
  "history": [
    { "month": "2026-01", "da": 53, "backlinks": 6994, "domains": 433, "keywords": 0 }
  ]
}
```

### `backlinks.json`

```json
{
  "summary": {
    "totalFollow": 3514,
    "totalNofollow": 3447,
    "gained30d": 4,
    "lost30d": 16
  },
  "backlinks": [
    {
      "url": "https://source.com/page",
      "targetUrl": "/",
      "anchorText": "alquilatucarro",
      "da": 45,
      "follow": true,
      "dateDiscovered": "2026-01-10",
      "status": "active"
    }
  ]
}
```

### `tasks.json`

```json
{
  "months": {
    "2026-01": {
      "goal": 100,
      "completed": 5,
      "percentage": 5,
      "tasks": [
        {
          "id": 1,
          "type": "directory",
          "target": "colombia.travel",
          "status": "done",
          "da": 65,
          "date": "2026-01-18",
          "notes": "Registrado en portal empresarios"
        }
      ]
    }
  }
}
```

### `activity.json`

```json
{
  "2026-01": {
    "backlinks": {
      "outreachSent": 12,
      "outreachGoal": 50,
      "responsesReceived": 3,
      "linksAcquired": 5,
      "linksGoal": 100
    },
    "blog": {
      "articlesPlanned": 3,
      "articlesWritten": 1,
      "articlesPublished": 0,
      "articlesGoal": 4
    },
    "internalLinking": {
      "linksAdded": 0,
      "linksGoal": 50
    },
    "ctrOptimization": {
      "pagesOptimized": 0,
      "pagesGoal": 5
    },
    "contentRefresh": {
      "articlesUpdated": 0,
      "articlesGoal": 2
    },
    "landingPages": {
      "pagesCreated": 0,
      "pagesGoal": 1
    },
    "lastActivityDate": "2026-01-13",
    "consecutiveDaysActive": 0,
    "bestStreak": 5,
    "activityLog": [
      {
        "date": "2026-01-13",
        "type": "outreach",
        "target": "colombia.travel",
        "result": "success",
        "notes": "Registrado en portal"
      }
    ]
  }
}
```

### `keywords.json`

```json
{
  "tracked": [
    {
      "keyword": "alquiler vehiculo colombia",
      "position": 27,
      "previousPosition": 27,
      "volume": 5,
      "difficulty": 33,
      "trend": "stable",
      "history": [
        { "month": "2026-01", "position": 27 }
      ]
    }
  ],
  "targets": [
    {
      "keyword": "alquiler carros medellin",
      "volume": 50,
      "difficulty": null,
      "status": "planned",
      "notes": "Crear landing page específica"
    }
  ],
  "distribution": {
    "top3": 0,
    "top10": 0,
    "top20": 0,
    "top50": 3,
    "beyond50": 0
  }
}
```

### `competitors.json`

```json
{
  "lastUpdated": "2026-01-17",
  "competitors": [
    {
      "domain": "alquilatucarro.com",
      "isUs": true,
      "da": 53,
      "spamScore": null,
      "totalLinks": 6994,
      "linkingDomains": 433,
      "followPercent": 50,
      "internalLinks": 33
    },
    {
      "domain": "rentingcolombia.com",
      "isUs": false,
      "da": 34,
      "spamScore": 1,
      "totalLinks": 55298,
      "linkingDomains": 601,
      "followPercent": 56,
      "internalLinks": 23886,
      "threatLevel": "high"
    }
  ]
}
```

### `content.json`

```json
{
  "internalLinks": {
    "current": 33,
    "goal": 500,
    "orphanPages": ["/page1", "/page2"],
    "opportunities": []
  },
  "blog": {
    "published": [
      {
        "slug": "requisitos-alquilar-carro",
        "title": "Requisitos para alquilar un carro en Colombia",
        "publishedAt": "2025-10-15",
        "lastUpdated": "2025-10-15",
        "wordCount": 1200
      }
    ],
    "planned": [
      {
        "slug": "rutas-semana-santa-2026",
        "title": "Mejores rutas para Semana Santa 2026",
        "targetDate": "2026-03-01",
        "targetKeyword": "rutas semana santa colombia",
        "status": "idea"
      }
    ]
  },
  "ctrOptimization": {
    "lowCtrPages": [
      {
        "url": "/medellin",
        "impressions": 890,
        "ctr": 2.1,
        "status": "needs-improvement",
        "suggestedTitle": null
      }
    ]
  },
  "contentFreshness": [
    {
      "slug": "requisitos-alquilar-carro",
      "lastUpdated": "2025-10-15",
      "ageMonths": 3,
      "status": "review-needed"
    }
  ],
  "landingPagesPipeline": [
    {
      "keyword": "alquiler carros aeropuerto bogota",
      "volume": 120,
      "suggestedUrl": "/alquiler-carros-aeropuerto-bogota",
      "status": "proposed"
    }
  ],
  "errors404": [
    {
      "url": "/images/carros2.png",
      "linkingDomains": 19,
      "pa": 30,
      "status": "pending-redirect"
    }
  ]
}
```

### `performance.json`

```json
{
  "gsc": {
    "last28d": {
      "impressions": 12450,
      "clicks": 342,
      "ctr": 2.7,
      "avgPosition": 34.2
    },
    "previousPeriod": {
      "impressions": 11528,
      "clicks": 305,
      "ctr": 2.4
    },
    "topPages": [
      { "url": "/bogota", "clicks": 89, "impressions": 1200, "ctr": 7.4 }
    ],
    "topQueries": [
      { "query": "alquilatucarro", "clicks": 45, "impressions": 200, "position": 2.1 }
    ],
    "lastUpdated": "2026-01-17"
  },
  "cwv": {
    "desktop": { "score": 99, "lcp": 1.2, "fid": 12, "cls": 0 },
    "mobile": { "score": 85, "lcp": 2.1, "fid": 45, "cls": 0 },
    "history": [
      { "month": "2025-12", "desktop": 98, "mobile": 82 },
      { "month": "2026-01", "desktop": 99, "mobile": 85 }
    ]
  },
  "indexation": {
    "indexed": 47,
    "total": 52,
    "excluded": 5,
    "excludedReasons": ["duplicate", "canonical"]
  }
}
```

### `tools.json`

```json
{
  "moz": {
    "account": "seoboom50",
    "plan": "Pro",
    "cost": "$99/mes",
    "quotas": {
      "domainOverview": {
        "used": 1,
        "limit": 5,
        "resetsAt": "2026-02-01",
        "costPerQuery": "~$20"
      },
      "linkExplorer": {
        "used": 10,
        "limit": 10,
        "resetsAt": "2026-01-18",
        "costPerQuery": "~$10"
      }
    },
    "mcp": {
      "installed": false,
      "repo": "https://github.com/metehan777/moz-mcp",
      "setupGuide": "/docs/seo/setup/moz-mcp-setup.md"
    },
    "apiDocs": "https://moz.com/help/links-api"
  },
  "gsc": {
    "property": "https://alquilatucarro.com",
    "type": "Domain property",
    "connected": true,
    "quotas": {
      "queriesPerDay": { "limit": 25000, "note": "Prácticamente ilimitado" }
    },
    "mcp": {
      "installed": false,
      "repo": null,
      "note": "Requiere OAuth setup manual",
      "setupGuide": "/docs/seo/setup/gsc-oauth-setup.md"
    }
  },
  "pagespeed": {
    "enabled": true,
    "quotas": {
      "queriesPerDay": { "limit": 25000, "note": "API gratuita de Google" }
    },
    "mcp": {
      "installed": false,
      "note": "Opcional - bajo prioridad"
    }
  },
  "lastUpdated": "2026-01-18"
}
```

---

## Autenticación

### Middleware: `app/middleware/seo-auth.ts`

```typescript
export default defineNuxtRouteMiddleware((to) => {
  // Solo aplicar a rutas /seo/*
  if (!to.path.startsWith('/seo')) return

  // Verificar cookie de sesión
  const authCookie = useCookie('seo-auth')

  if (!authCookie.value) {
    // Redirigir a login
    return navigateTo('/seo/login')
  }
})
```

### Variables de Entorno

```bash
# .env.local
SEO_PASSWORD=tu-password-seguro-aqui
```

---

## Skill: `/seo-update`

### `.claude/commands/seo-update.md`

```markdown
---
description: Actualiza datos del SEO Dashboard usando MCPs de Moz y GSC
---

## Proceso de Actualización

1. **Verificar cuotas disponibles** en tools.json
2. **Ejecutar MCPs** según cuotas:
   - Moz: DA, backlinks, competidores (si hay queries)
   - GSC: Impresiones, clicks, keywords (OAuth requerido)
3. **Actualizar JSONs** en docs/seo/data/
4. **Generar reporte** si hay cambios significativos
5. **Commit automático** con fecha

## Opciones

- `/seo-update` - Actualización completa
- `/seo-update moz` - Solo métricas Moz
- `/seo-update gsc` - Solo métricas GSC
- `/seo-update keywords` - Solo posiciones keywords
- `/seo-update --dry-run` - Ver qué se actualizaría sin ejecutar

## Ejemplo de Ejecución

1. Verificando cuotas...
   - Moz Domain Overview: 4/5 disponibles
   - Moz Link Explorer: 10/10 disponibles
   - GSC: Conectado

2. Ejecutando Moz MCP...
   - Obteniendo DA/PA alquilatucarro.com
   - Obteniendo backlinks nuevos
   - Comparando vs competidores

3. Ejecutando GSC...
   - Impresiones últimos 28 días
   - Clicks y CTR
   - Top queries y páginas

4. Actualizando JSONs...
   - metrics.json
   - backlinks.json
   - competitors.json
   - keywords.json
   - performance.json

5. Resumen de cambios
```

---

## Flujo de Trabajo Mensual

### Semana 1: Análisis
- [ ] Ejecutar `/seo-update`
- [ ] Revisar dashboard `/seo`
- [ ] Identificar backlinks perdidos
- [ ] Actualizar tareas del mes

### Semana 2-3: Ejecución
- [ ] Outreach a 10+ directorios
- [ ] Contactar 5+ blogs para guest posts
- [ ] Crear 1+ artículo de blog
- [ ] Agregar 20+ internal links
- [ ] Optimizar CTR de 2+ páginas

### Semana 4: Cierre
- [ ] Ejecutar `/seo-update` final
- [ ] Documentar backlinks conseguidos
- [ ] Generar reporte mensual
- [ ] Planificar siguiente mes

---

## Metas de Actividad Mensual

| Área | Actividad | Meta/Mes |
|------|-----------|----------|
| Backlinks | Outreach enviados | 50 |
| Backlinks | Links conseguidos | 100 |
| Blog | Artículos publicados | 4 |
| Internal Links | Links agregados | 50 |
| CTR | Páginas optimizadas | 5 |
| Content | Artículos actualizados | 2 |
| Landing Pages | Páginas nuevas | 1 |

---

## Configuración de MCPs

### Moz MCP

**Repositorio:** https://github.com/metehan777/moz-mcp

**Instalación:**
```bash
git clone https://github.com/metehan777/moz-mcp
cd moz-mcp
npm install
npm run build
```

**Configuración en `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "moz": {
      "command": "node",
      "args": ["C:/path/to/moz-mcp/dist/index.js"],
      "env": {
        "MOZ_API_TOKEN": "${MOZ_API_TOKEN}"
      }
    }
  }
}
```

### Google Search Console

**Requiere OAuth setup manual.**

Ver guía completa en: `/docs/seo/setup/gsc-oauth-setup.md`

---

## Implementación

### Fase 1: Estructura Base
- Crear estructura de carpetas
- Crear JSONs iniciales con datos actuales
- Middleware de autenticación

### Fase 2: Dashboard UI
- Página Overview
- Página Backlinks
- Página Tareas
- Página Keywords

### Fase 3: Dashboard Completo
- Página Contenido
- Página Competidores
- Página Rendimiento
- Página Herramientas
- Página Análisis

### Fase 4: Integraciones
- Configurar Moz MCP
- Configurar GSC OAuth
- Crear skill `/seo-update`

### Fase 5: Polish
- Alertas y notificaciones
- Gráficos de tendencia
- Exportación de reportes

---

## Notas Adicionales

- Todos los datos se versionan en git para histórico
- El dashboard es solo para uso interno (protegido con password)
- Las actualizaciones son semi-automáticas (requieren ejecutar skill)
- Los reportes mensuales se guardan en `docs/seo/reports/`
