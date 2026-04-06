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

# Instalar dependencias usando el comando oficial de Playwright
sudo npx playwright install-deps chromium firefox webkit

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
    echo "1. Ejecuta manualmente: sudo npx playwright install-deps"
    echo "2. O ejecuta solo con Chromium: pnpm test:e2e:chromium"
fi
