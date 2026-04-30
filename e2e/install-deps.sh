#!/bin/bash

# Script para instalar dependencias de Playwright en Ubuntu/Debian (WSL)
# Este script requiere sudo

echo "🎭 Instalando dependencias de Playwright..."
echo ""

# Verificar permisos de sudo antes de continuar
if ! sudo -n true 2>/dev/null; then
    echo "❌ Este script requiere privilegios sudo"
    echo ""
    echo "Ejecuta: sudo $0"
    exit 1
fi

echo "⚠️  Este script requiere privilegios de administrador (sudo)"
echo ""

# Verificar si estamos en WSL
if grep -qi microsoft /proc/version; then
    echo "✅ Detectado WSL"
fi

# Instalar dependencias usando el comando oficial de Playwright.
# Para WSL2 con node desde nvm + pnpm: sudo resetea PATH, así que ni
# pnpm ni node están disponibles para root. Resolvemos node + el cli
# de playwright como rutas absolutas en el shell del usuario y se las
# pasamos a sudo explícitas.
NODE_BIN=""
# Try PATH first (works when sourced from interactive shell or nvm-set PATH).
if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
fi
# Fallback: probe common nvm install path (this script may run under a non-
# interactive shell that did NOT source ~/.bashrc and therefore lacks nvm's
# PATH injection).
if [ -z "$NODE_BIN" ] && [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_BIN=$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -n1)
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
    echo "❌ node no encontrado en PATH ni en ~/.nvm/versions/node/*/bin/node"
    echo "   Si usás nvm, exportá NODE_BIN=\$(which node) antes de correr este script."
    exit 1
fi
echo "🔧 Usando node: $NODE_BIN"
PLAYWRIGHT_CLI="$(dirname "$0")/../node_modules/playwright/cli.js"
if [ ! -f "$PLAYWRIGHT_CLI" ]; then
    echo "❌ Playwright CLI no encontrado en $PLAYWRIGHT_CLI"
    echo "   Ejecuta primero: pnpm install"
    exit 1
fi
sudo "$NODE_BIN" "$PLAYWRIGHT_CLI" install-deps chromium firefox webkit

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencias instaladas correctamente"
    echo ""
    echo "Ahora puedes ejecutar las pruebas E2E con:"
    echo "  pnpm test:e2e"
else
    echo ""
    echo "❌ Error al instalar dependencias"
    echo ""
    echo "Solución alternativa:"
    echo "1. Ejecuta manualmente: sudo node_modules/.bin/playwright install-deps"
    echo "2. O ejecuta solo con Chromium: pnpm test:e2e:chromium"
fi
