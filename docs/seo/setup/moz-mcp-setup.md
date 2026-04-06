# Moz MCP Setup Guide

## Overview

Esta guía configura el MCP de Moz para integrar la API de Link Explorer directamente en Claude Code.

## Prerequisites

- Cuenta Moz Pro activa (seoboom50)
- API Key de Moz (disponible en Moz Dashboard)
- Node.js 18+ instalado

## Paso 1: Obtener API Credentials

1. Ir a [Moz Dashboard](https://moz.com/products/pro)
2. Account Settings > API Credentials
3. Copiar:
   - **Access ID**: (tu access ID)
   - **Secret Key**: (tu secret key)

## Paso 2: Instalar Moz MCP

```bash
# Clonar el repositorio
git clone https://github.com/metehan777/moz-mcp.git
cd moz-mcp

# Instalar dependencias
npm install

# Build
npm run build
```

## Paso 3: Configurar Claude Code

Agregar al archivo `~/.claude/settings.json` (o `.claude/settings.local.json` del proyecto):

```json
{
  "mcpServers": {
    "moz": {
      "command": "node",
      "args": ["/path/to/moz-mcp/dist/index.js"],
      "env": {
        "MOZ_ACCESS_ID": "tu-access-id",
        "MOZ_SECRET_KEY": "tu-secret-key"
      }
    }
  }
}
```

## Paso 4: Verificar Instalación

Reiniciar Claude Code y verificar:

```bash
claude /mcp
```

Debería mostrar el servidor `moz` como disponible.

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `moz_domain_authority` | Obtener DA/PA de un dominio |
| `moz_link_metrics` | Métricas de enlaces de una URL |
| `moz_top_links` | Top backlinks de un dominio |
| `moz_anchor_text` | Distribución de anchor text |

## Quotas y Límites

| Recurso | Límite | Reset |
|---------|--------|-------|
| Domain Overview | 5/mes | 1ro del mes |
| Link Explorer | 10/mes | Cada 24h |

**Costo aproximado por query:**
- Domain Overview: ~$20
- Link Explorer: ~$10

## Uso con SEO Command Center

Una vez configurado, los datos de Moz se pueden actualizar manualmente o via skill:

```bash
# Actualizar métricas de dominio
/seo-moz-update alquilatucarro.com

# Comparar con competidores
/seo-moz-compare alquilatucarro.com rentingcolombia.com
```

## Troubleshooting

### Error: "API rate limit exceeded"
- Verificar quotas en [Moz Dashboard](https://moz.com/products/api)
- Esperar reset (24h para Link Explorer)

### Error: "Invalid credentials"
- Verificar Access ID y Secret Key
- Regenerar credenciales si es necesario

### MCP no aparece en Claude
- Verificar path al archivo dist/index.js
- Revisar logs: `claude --mcp-debug`

## Referencias

- [Moz Links API Docs](https://moz.com/help/links-api)
- [Moz MCP Repository](https://github.com/metehan777/moz-mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude-code/mcp)
