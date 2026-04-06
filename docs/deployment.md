# Guía de Deployment - Monorepo Multi-Marca

**Fecha:** 2026-01-20
**Proyecto:** rentacar-main (alquilatucarro.com)
**Versión:** 1.0.0

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Build Local](#2-build-local)
3. [Deploy Manual](#3-deploy-manual)
4. [CI/CD Automatizado](#4-cicd-automatizado)
5. [Estrategias de Deploy](#5-estrategias-de-deploy)
6. [Rollback](#6-rollback)
7. [Monitoreo Post-Deploy](#7-monitoreo-post-deploy)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Resumen Ejecutivo

### 1.1. Plataforma de Hosting

| Marca | Hosting | URL | Firebase Project |
|-------|---------|-----|------------------|
| Alquilatucarro | Firebase Hosting | alquilatucarro.com | `alquilatucarro` |
| Alquilame | Firebase Hosting | alquilame.com | `alquilame` |
| Alquicarros | Firebase Hosting | alquicarros.com | `alquicarros` |

### 1.2. Proceso de Deploy

```
┌─────────────────────────────────────────┐
│  1. Cambio en código                    │
│     - Logic: Afecta 3 marcas            │
│     - UI: Afecta 1 marca                │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  2. Build                               │
│     pnpm build                          │
│     → packages/ui-{marca}/.output/      │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  3. Deploy                              │
│     firebase deploy --only hosting      │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  4. Verificación                        │
│     - Smoke tests                       │
│     - Monitoreo                         │
└─────────────────────────────────────────┘
```

### 1.3. Tiempos de Deploy

| Escenario | Tiempo Estimado |
|-----------|----------------|
| **Deploy 1 marca** | 5-10 min |
| **Deploy 3 marcas (paralelo)** | 10-15 min |
| **Hotfix urgente** | 10-15 min |
| **Rollback** | 2-3 min |

---

## 2. Build Local

### 2.1. Build de una Marca

```bash
# Build alquilatucarro
cd packages/ui-alquilatucarro
pnpm build

# Output:
# .output/
# ├── public/          # Assets estáticos
# └── server/          # Server (si aplica)

# Verificar build
ls -lh .output/public/
```

### 2.2. Build de Todas las Marcas

**Opción 1: Build secuencial**
```bash
# Desde root
pnpm build

# Equivalente a:
pnpm --filter ui-alquilatucarro build
pnpm --filter ui-alquilame build
pnpm --filter ui-alquicarros build
```

**Opción 2: Build paralelo (más rápido)**
```bash
# Desde root - Builds en paralelo
pnpm --filter "ui-*" build --parallel

# O configurar max workers
pnpm --filter "ui-*" build --max-workers 3
```

### 2.3. Preview Local del Build

```bash
# Build + Preview
cd packages/ui-alquilatucarro
pnpm build
pnpm preview

# Acceder en http://localhost:4173

# Preview con puerto específico
pnpm preview --port 4200
```

### 2.4. Verificación Pre-Deploy

**Checklist antes de hacer deploy:**

```bash
# 1. TypeCheck
pnpm --filter ui-alquilatucarro typecheck
# Debe salir sin errores

# 2. Lint
pnpm --filter ui-alquilatucarro lint
# Debe salir sin errores

# 3. Tests (si aplica)
pnpm --filter ui-alquilatucarro test
# Todos los tests deben pasar

# 4. Build
pnpm --filter ui-alquilatucarro build
# Debe completar sin errores

# 5. Preview
pnpm --filter ui-alquilatucarro preview
# Verificar manualmente que funciona
```

---

## 3. Deploy Manual

### 3.1. Configuración de Firebase

**Estructura de firebase.json por marca:**

```bash
# packages/ui-alquilatucarro/firebase.json
```

```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/_nuxt/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ],
    "redirects": [
      {
        "source": "/old-url",
        "destination": "/new-url",
        "type": 301
      }
    ]
  }
}
```

### 3.2. Deploy de una Marca

**Deploy a producción:**

```bash
# 1. Navegar al package
cd packages/ui-alquilatucarro

# 2. Asegurar que .env.prod existe
cp .env.example .env.prod
# Editar con valores de producción

# 3. Build con env de producción
pnpm build --dotenv .env.prod

# 4. Login a Firebase (si no estás logueado)
firebase login

# 5. Deploy
firebase deploy --only hosting

# Output:
# ✔  Deploy complete!
#
# Project Console: https://console.firebase.google.com/project/alquilatucarro/overview
# Hosting URL: https://alquilatucarro.com
```

**Deploy a staging/preview:**

```bash
# Deploy a channel de preview
firebase hosting:channel:deploy preview

# Output:
# ✔  Deploy complete!
#
# Preview URL: https://alquilatucarro--preview-abc123.web.app
# Expires: 2026-02-19
```

### 3.3. Deploy de Múltiples Marcas

**Opción 1: Deploy secuencial**

```bash
# Script manual
cd packages/ui-alquilatucarro
pnpm build --dotenv .env.prod
firebase deploy --only hosting
cd ../..

cd packages/ui-alquilame
pnpm build --dotenv .env.prod
firebase deploy --only hosting --project alquilame
cd ../..

cd packages/ui-alquicarros
pnpm build --dotenv .env.prod
firebase deploy --only hosting --project alquicarros
cd ../..
```

**Opción 2: Script automatizado**

```bash
# Crear script en root
vim scripts/deploy-all.sh
```

```bash
#!/bin/bash
set -e

BRANDS=("alquilatucarro" "alquilame" "alquicarros")
PROJECTS=("alquilatucarro" "alquilame" "alquicarros")

for i in "${!BRANDS[@]}"; do
  BRAND="${BRANDS[$i]}"
  PROJECT="${PROJECTS[$i]}"

  echo "🚀 Deploying $BRAND..."

  cd "packages/ui-$BRAND"

  # Build
  pnpm build --dotenv .env.prod

  # Deploy
  if [ "$BRAND" = "alquilatucarro" ]; then
    firebase deploy --only hosting
  else
    firebase deploy --only hosting --project "$PROJECT"
  fi

  cd ../..

  echo "✅ $BRAND deployed successfully!"
  echo ""
done

echo "🎉 All brands deployed!"
```

```bash
# Dar permisos de ejecución
chmod +x scripts/deploy-all.sh

# Ejecutar
./scripts/deploy-all.sh
```

---

## 4. CI/CD Automatizado

### 4.1. GitHub Actions - CI

**`.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeCheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build all brands
        run: pnpm build
```

### 4.2. GitHub Actions - Deploy

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy

on:
  push:
    branches: [main]
    paths:
      - 'packages/**'

jobs:
  # Job 1: Deploy alquilatucarro
  deploy-alquilatucarro:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.message, 'alquilatucarro') ||
      contains(github.event.head_commit.modified, 'packages/logic') ||
      contains(github.event.head_commit.modified, 'packages/ui-alquilatucarro')

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build alquilatucarro
        run: pnpm --filter ui-alquilatucarro build
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          GOOGLE_ANALYTICS_ID: ${{ secrets.GA_ID_ALQUILATUCARRO }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ALQUILATUCARRO }}
          projectId: alquilatucarro
          channelId: live
          entryPoint: packages/ui-alquilatucarro

  # Job 2: Deploy alquilame
  deploy-alquilame:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.message, 'alquilame') ||
      contains(github.event.head_commit.modified, 'packages/logic') ||
      contains(github.event.head_commit.modified, 'packages/ui-alquilame')

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build alquilame
        run: pnpm --filter ui-alquilame build
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          GOOGLE_ANALYTICS_ID: ${{ secrets.GA_ID_ALQUILAME }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ALQUILAME }}
          projectId: alquilame
          channelId: live
          entryPoint: packages/ui-alquilame

  # Job 3: Deploy alquicarros
  deploy-alquicarros:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.message, 'alquicarros') ||
      contains(github.event.head_commit.modified, 'packages/logic') ||
      contains(github.event.head_commit.modified, 'packages/ui-alquicarros')

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build alquicarros
        run: pnpm --filter ui-alquicarros build
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          GOOGLE_ANALYTICS_ID: ${{ secrets.GA_ID_ALQUICARROS }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ALQUICARROS }}
          projectId: alquicarros
          channelId: live
          entryPoint: packages/ui-alquicarros
```

### 4.3. Secrets Requeridos en GitHub

```bash
# Secrets a configurar en GitHub Settings > Secrets and variables > Actions

# API
API_BASE_URL=https://api.example.com

# Google Analytics
GA_ID_ALQUILATUCARRO=G-XXXXXXXXXX
GA_ID_ALQUILAME=G-YYYYYYYYYY
GA_ID_ALQUICARROS=G-ZZZZZZZZZZ

# Firebase Service Accounts
FIREBASE_SERVICE_ACCOUNT_ALQUILATUCARRO={...json...}
FIREBASE_SERVICE_ACCOUNT_ALQUILAME={...json...}
FIREBASE_SERVICE_ACCOUNT_ALQUICARROS={...json...}
```

**Obtener Firebase Service Account:**

```bash
# Para cada proyecto Firebase
firebase login
firebase projects:list

# Para alquilatucarro
firebase apps:sdkconfig WEB --project alquilatucarro

# Ir a Firebase Console:
# 1. Project Settings
# 2. Service Accounts
# 3. Generate new private key
# 4. Copiar JSON completo
# 5. Agregar como secret en GitHub
```

---

## 5. Estrategias de Deploy

### 5.1. Deploy por Tipo de Cambio

**Cambio en Logic Package:**

```bash
# Afecta a las 3 marcas

# Opción 1: Deploy manual de las 3
./scripts/deploy-all.sh

# Opción 2: CI/CD automático
git add packages/logic/
git commit -m "fix(logic): critical bug"
git push
# → CI/CD detecta cambio en logic
# → Deploy automático de las 3 marcas
```

**Cambio en UI Package:**

```bash
# Afecta solo a 1 marca

# Opción 1: Deploy manual
cd packages/ui-alquilame
pnpm build
firebase deploy --only hosting --project alquilame

# Opción 2: CI/CD automático
git add packages/ui-alquilame/
git commit -m "feat(alquilame): new hero"
git push
# → CI/CD detecta cambio en ui-alquilame
# → Deploy solo de alquilame
```

### 5.2. Deploy con Preview Channels

**Para testing antes de producción:**

```bash
# 1. Crear preview channel
cd packages/ui-alquilatucarro
firebase hosting:channel:deploy preview-feature-x

# Output:
# Preview URL: https://alquilatucarro--preview-feature-x-abc123.web.app
# Expires: 7 days

# 2. Compartir URL con stakeholders para testing

# 3. Si aprueba, deploy a producción
firebase deploy --only hosting

# 4. Si no aprueba, el preview expira en 7 días
```

**Preview desde PR (GitHub Actions):**

```yaml
# .github/workflows/preview.yml
name: Preview Deploy

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter ui-alquilatucarro build

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ALQUILATUCARRO }}
          projectId: alquilatucarro
          # channelId: live  ← No especificar para crear preview
          entryPoint: packages/ui-alquilatucarro
        id: firebase

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed!\n\n**URL:** ${{ steps.firebase.outputs.details_url }}`
            })
```

### 5.3. Blue-Green Deploy

**No aplicable directamente en Firebase Hosting, pero se puede simular:**

```bash
# 1. Deploy a preview channel
firebase hosting:channel:deploy blue

# 2. Verificar que funciona
curl https://alquilatucarro--blue-abc123.web.app

# 3. Si todo OK, deploy a producción
firebase deploy --only hosting

# 4. Si hay problema, rollback es inmediato (ver sección 6)
```

---

## 6. Rollback

### 6.1. Rollback en Firebase

**Firebase guarda historial de deploys:**

```bash
# 1. Ver historial de deploys
firebase hosting:clone

# Output:
# Release                       Create Time          Version
# alquilatucarro-abc123         2026-01-20 10:00     v1.2.3
# alquilatucarro-def456         2026-01-19 15:30     v1.2.2
# alquilatucarro-ghi789         2026-01-18 09:00     v1.2.1

# 2. Rollback a versión anterior
firebase hosting:clone alquilatucarro-def456 alquilatucarro

# ✅ Rollback completo en ~2 minutos
```

### 6.2. Rollback con Git

```bash
# 1. Identificar commit problemático
git log --oneline

# 2. Revertir commit
git revert <commit-hash>

# 3. Push
git push

# 4. CI/CD hace deploy automático del revert
```

### 6.3. Rollback de Emergencia

**Si hay problema crítico en producción:**

```bash
# Opción 1: Rollback inmediato en Firebase Console
# 1. Ir a Firebase Console
# 2. Hosting → Release history
# 3. Click en versión anterior
# 4. Click "Rollback"
# ✅ ~30 segundos

# Opción 2: CLI
firebase hosting:clone <release-id> <site-name>

# Opción 3: Re-deploy versión anterior
git checkout <previous-commit>
cd packages/ui-alquilatucarro
pnpm build
firebase deploy --only hosting
```

---

## 7. Monitoreo Post-Deploy

### 7.1. Smoke Tests

**Checklist manual post-deploy:**

```bash
# Para cada marca
BRANDS=("alquilatucarro.com" "alquilame.com" "alquicarros.com")

for BRAND in "${BRANDS[@]}"; do
  echo "Testing $BRAND..."

  # 1. Home page carga
  curl -I "https://$BRAND" | grep "200 OK"

  # 2. Búsqueda funciona
  curl -I "https://$BRAND/bogota" | grep "200 OK"

  # 3. Assets cargan
  curl -I "https://$BRAND/_nuxt/entry.123.js" | grep "200 OK"

  echo "✅ $BRAND OK"
done
```

### 7.2. Monitoreo en Firebase

**Firebase Performance Monitoring:**

```typescript
// packages/ui-{marca}/app/plugins/firebase-perf.client.ts
import { getPerformance } from 'firebase/performance'

export default defineNuxtPlugin(() => {
  if (process.client) {
    const perf = getPerformance()
    // ✅ Monitoreo automático de:
    // - Page load
    // - Network requests
    // - Custom traces
  }
})
```

**Verificar en Firebase Console:**
```
Firebase Console → Performance
- Page load times
- API response times
- Errors
```

### 7.3. Google Analytics

**Verificar eventos:**

```bash
# 1. Abrir Google Analytics
# 2. Realtime → Events
# 3. Verificar que se registran eventos
# 4. Verificar que page_view funciona
```

---

## 8. Troubleshooting

### 8.1. Build Falla

**Error: "Module not found"**

```bash
# Solución:
pnpm install --frozen-lockfile
pnpm build
```

**Error: "Out of memory"**

```bash
# Solución: Aumentar memoria de Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### 8.2. Deploy Falla

**Error: "Authentication error"**

```bash
# Solución:
firebase login --reauth
firebase projects:list
firebase deploy --only hosting
```

**Error: "Permission denied"**

```bash
# Verificar que tienes permisos en el proyecto
firebase projects:list

# Verificar que estás en el directorio correcto
pwd
# Debe ser: packages/ui-{marca}/

# Verificar firebase.json
cat firebase.json
```

### 8.3. Site no Carga Después de Deploy

**Verificar:**

```bash
# 1. Build existe
ls -la .output/public/

# 2. firebase.json correcto
cat firebase.json

# 3. Verificar en Firebase Console
# Hosting → Release history
# Ver que el deploy se completó

# 4. Limpiar cache del browser
# Ctrl+Shift+R (hard refresh)

# 5. Verificar DNS
nslookup alquilatucarro.com

# 6. Verificar SSL
curl -I https://alquilatucarro.com
```

---

## Resumen de Comandos

```bash
# Build local
pnpm --filter ui-alquilatucarro build

# Preview local
pnpm --filter ui-alquilatucarro preview

# Deploy producción
cd packages/ui-alquilatucarro
firebase deploy --only hosting

# Deploy preview
firebase hosting:channel:deploy preview

# Rollback
firebase hosting:clone <release-id> alquilatucarro

# Ver historial
firebase hosting:clone

# Deploy todas las marcas
./scripts/deploy-all.sh
```

---

**Documento mantenido por:** Equipo de DevOps
**Última actualización:** 2026-01-20
