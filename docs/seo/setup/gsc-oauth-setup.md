# Google Search Console OAuth Setup

## Overview

Esta guía configura la integración de Google Search Console para obtener métricas de rendimiento orgánico.

## Prerequisites

- Acceso a Google Cloud Console
- Propiedad verificada en GSC (alquilatucarro.com)
- Node.js 18+ instalado

## Paso 1: Crear Proyecto en Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto: `alquilatucarro-seo`
3. Habilitar APIs:
   - Search Console API
   - Google Analytics Data API (opcional)

## Paso 2: Configurar OAuth Consent Screen

1. APIs & Services > OAuth consent screen
2. Seleccionar "External"
3. Completar información básica:
   - App name: `SEO Command Center`
   - User support email: tu email
   - Developer contact: tu email
4. Scopes: agregar `https://www.googleapis.com/auth/webmasters.readonly`
5. Test users: agregar tu email de Google

## Paso 3: Crear OAuth Credentials

1. APIs & Services > Credentials
2. Create Credentials > OAuth client ID
3. Application type: Desktop app
4. Name: `SEO Command Center CLI`
5. Descargar JSON y guardarlo como `gsc-credentials.json`

## Paso 4: Instalar GSC MCP (Opción A - MCP Existente)

```bash
# Si existe un MCP oficial
npm install -g @anthropic/mcp-gsc
```

## Paso 4: Crear Custom Integration (Opción B - Script Propio)

Crear archivo `scripts/gsc-fetch.ts`:

```typescript
import { google } from 'googleapis'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
const SITE_URL = 'https://alquilatucarro.com/'

async function fetchGSCData() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'gsc-credentials.json',
    scopes: SCOPES,
  })

  const searchconsole = google.searchconsole({ version: 'v1', auth })

  // Fetch last 28 days
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const response = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 100,
    },
  })

  // Save to JSON
  const dataPath = join(process.cwd(), 'docs/seo/data/performance.json')
  const existing = JSON.parse(readFileSync(dataPath, 'utf-8'))

  existing.gsc = {
    last28d: {
      impressions: response.data.rows?.reduce((sum, r) => sum + (r.impressions || 0), 0),
      clicks: response.data.rows?.reduce((sum, r) => sum + (r.clicks || 0), 0),
      ctr: response.data.rows?.[0]?.ctr,
      avgPosition: response.data.rows?.[0]?.position,
    },
    topQueries: response.data.rows?.slice(0, 10).map(r => ({
      query: r.keys?.[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    })),
    lastUpdated: new Date().toISOString(),
    status: 'connected',
  }

  writeFileSync(dataPath, JSON.stringify(existing, null, 2))
  console.log('GSC data updated successfully')
}

fetchGSCData()
```

## Paso 5: Autenticación Inicial

```bash
# Primera vez - abrirá navegador para autorizar
npx ts-node docs/seo/tools/update-gsc-data.ts
```

1. Se abrirá navegador
2. Seleccionar cuenta Google con acceso a GSC
3. Autorizar la aplicación
4. Token se guardará automáticamente

## Paso 6: Configurar Claude Code MCP (Opcional)

Si usas MCP, agregar a settings:

```json
{
  "mcpServers": {
    "gsc": {
      "command": "npx",
      "args": ["ts-node", "scripts/gsc-mcp-server.ts"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "./gsc-credentials.json"
      }
    }
  }
}
```

## Métricas Disponibles

| Métrica | Descripción |
|---------|-------------|
| Impressions | Veces que apareció en resultados |
| Clicks | Clics desde resultados de búsqueda |
| CTR | Click-through rate (clicks/impressions) |
| Position | Posición promedio en SERPs |
| Top Queries | Keywords con más impresiones |
| Top Pages | Páginas con mejor rendimiento |

## Actualización de Datos

### Manual
```bash
npm run gsc:update
```

### Automatizada (cron)
```bash
# Agregar a crontab (diario a las 6am)
0 6 * * * cd /path/to/project && npm run gsc:update
```

## Troubleshooting

### Error: "User does not have sufficient permissions"
- Verificar que tu cuenta tiene acceso a la propiedad en GSC
- Property debe ser tipo "Domain" o "URL prefix"

### Error: "OAuth consent screen not configured"
- Completar todos los pasos del consent screen
- Agregar tu email como test user

### Error: "API not enabled"
- Habilitar Search Console API en Google Cloud Console

### Tokens expirados
```bash
# Eliminar token guardado y re-autorizar
rm ~/.gsc-token.json
npm run gsc:update
```

## Límites de API

| Recurso | Límite |
|---------|--------|
| Queries per day | 25,000 |
| Requests per second | 5 |

*Prácticamente ilimitado para uso normal.*

## Referencias

- [Search Console API Docs](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
