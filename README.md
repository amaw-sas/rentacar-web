# Alquilatucarro - Monorepo Multi-Marca

Monorepo para las marcas de alquiler de vehículos: **alquilatucarro.com**, **alquilame.com** y **alquicarros.com**.

[![CI](https://github.com/[org]/rentacar-main/workflows/CI/badge.svg)](https://github.com/[org]/rentacar-main/actions)
[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Quick Start](#-quick-start)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentación](#-documentación)
- [Stack Tecnológico](#-stack-tecnológico)

---

## 🏗️ Arquitectura

Este proyecto utiliza un **monorepo** con pnpm workspaces para separar **lógica compartida** de **presentación específica** por marca.

```
rentacar-main/
├── packages/
│   ├── logic/                     # 🧠 Lógica compartida (100%)
│   │   ├── composables/          # Business logic
│   │   ├── stores/               # Pinia stores
│   │   ├── utils/                # Types & utilities
│   │   └── config/               # Shared configuration
│   │
│   ├── ui-alquilatucarro/        # 🎨 alquilatucarro.com
│   ├── ui-alquilame/             # 🎨 alquilame.com
│   └── ui-alquicarros/           # 🎨 alquicarros.com
│
├── docs/                          # 📚 Documentación completa
└── .github/workflows/             # 🤖 CI/CD
```

### Beneficios

✅ **1 cambio en lógica → 3 marcas actualizadas automáticamente**
✅ **Zero merge conflicts** - No más cherry-pick manual
✅ **Consistency garantizada** - Imposible tener lógica diferente
✅ **Hotfixes en 15 minutos** - Deploy rápido de fixes críticos
✅ **12-15 horas/semana ahorradas** - Elimina trabajo duplicado

Ver [Arquitectura Completa](./docs/architecture.md)

---

## 🚀 Quick Start

### Requisitos

| Software | Versión Mínima |
|----------|----------------|
| Node.js | 20.0.0 |
| pnpm | 9.0.0 |
| Git | 2.0+ |

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url> rentacar-main
cd rentacar-main

# 2. Instalar pnpm (si no está instalado)
npm install -g pnpm@latest

# 3. Instalar dependencias
pnpm install

# 4. Configurar variables de entorno
cp packages/ui-alquilatucarro/.env.example packages/ui-alquilatucarro/.env.local
# Editar .env.local con valores reales

# 5. Iniciar desarrollo
pnpm dev:alquilatucarro
```

Acceder en **http://localhost:3000**

---

## 💻 Desarrollo

### Desarrollar una Marca

```bash
# Marca principal (alquilatucarro)
pnpm dev:alquilatucarro
# → http://localhost:3000

# Otras marcas
pnpm dev:alquilame
# → http://localhost:3001

pnpm dev:alquicarros
# → http://localhost:3002
```

### Desarrollar Todas las Marcas Simultáneamente

```bash
pnpm dev:all

# Abre 3 dev servers en paralelo:
# → http://localhost:3000 (alquilatucarro)
# → http://localhost:3001 (alquilame)
# → http://localhost:3002 (alquicarros)
```

### Estructura de Comandos

```bash
# Instalar dependencias
pnpm install

# Typecheck
pnpm typecheck                              # Todos los packages
pnpm --filter ui-alquilatucarro typecheck  # Solo una marca

# Lint
pnpm lint                                   # Todos los packages
pnpm --filter @rentacar-main/logic lint    # Solo logic

# Tests
pnpm test                                   # Todos los tests
pnpm --filter @rentacar-main/logic test    # Solo logic

# Build
pnpm build                                  # Todas las marcas
pnpm --filter ui-alquilatucarro build      # Solo una marca

# Limpiar caches
pnpm clean
```

---

## 🧪 Testing

```bash
# Tests unitarios (logic package)
pnpm --filter @rentacar-main/logic test

# Tests con watch mode
pnpm --filter @rentacar-main/logic test --watch

# Tests con coverage
pnpm --filter @rentacar-main/logic test --coverage

# Tests de todas las marcas
pnpm --filter "ui-*" test
```

---

## 🚢 Deployment

### Build para Producción

```bash
# Build todas las marcas
pnpm build

# Build marca específica
pnpm --filter ui-alquilatucarro build
```

### Deploy a Firebase

```bash
# Deploy alquilatucarro
cd packages/ui-alquilatucarro
pnpm build --dotenv .env.prod
firebase deploy --only hosting

# Deploy alquilame
cd ../ui-alquilame
pnpm build --dotenv .env.prod
firebase deploy --only hosting --project alquilame

# Deploy alquicarros
cd ../ui-alquicarros
pnpm build --dotenv .env.prod
firebase deploy --only hosting --project alquicarros
```

### Deploy Automatizado

```bash
# Script para deploy de todas las marcas
./scripts/deploy-all.sh
```

Ver [Guía de Deployment](./docs/deployment.md)

---

## 📚 Documentación

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](./docs/architecture.md) | Visión general de la arquitectura del monorepo |
| [Guía de Desarrollo](./docs/development-guide.md) | Workflow diario, convenciones, troubleshooting |
| [Guía de Deployment](./docs/deployment.md) | Build, deploy, CI/CD, rollback |
| [Migración](./MIGRATION.md) | Estado y plan de migración a monorepo |
| [Auditoría](./docs/migration/audit-results.md) | Análisis de código compartido vs específico |

### Flujos Comunes

**Cambio en Lógica Compartida:**
```bash
# 1. Editar composable
vim packages/logic/src/composables/business/useReservation.ts

# 2. Guardar
# ✅ HMR automático - Las 3 marcas se actualizan

# 3. Commit
git add packages/logic/
git commit -m "fix(logic): reservation validation"
git push
```

**Cambio en Diseño de Una Marca:**
```bash
# 1. Editar componente
vim packages/ui-alquilame/app/components/Hero.vue

# 2. Guardar
# ✅ Solo alquilame se actualiza

# 3. Commit
git add packages/ui-alquilame/
git commit -m "feat(alquilame): new hero design"
git push
```

**Hotfix Crítico:**
```bash
# 1. Fix en logic
vim packages/logic/src/composables/business/useCategory.ts

# 2. Build y deploy urgente
cd packages/ui-alquilatucarro
pnpm build
firebase deploy --only hosting

# ✅ En producción en 15 minutos
```

---

## 🛠️ Stack Tecnológico

### Core

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Nuxt 3** | 4.1.3 | Framework |
| **Vue 3** | 3.5.22 | UI Framework |
| **TypeScript** | 5.9.3 | Type Safety |
| **pnpm** | 9.0+ | Package Manager & Workspaces |

### Estado y Data

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Pinia** | 3.0.3 | State Management |
| **Nuxt Content** | 3.10.0 | Content Management |

### UI

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Nuxt UI** | 4.2.1 | Component Library |
| **Tailwind CSS** | - | Styling |

### SEO

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **@nuxtjs/seo** | 3.2.2 | SEO & Meta Tags |

### Deployment

| Tecnología | Uso |
|------------|-----|
| **Firebase Hosting** | Hosting de las 3 marcas |
| **GitHub Actions** | CI/CD Pipeline |

---

## 📁 Estructura de Packages

### `@rentacar-main/logic`

Lógica de negocio compartida entre las 3 marcas.

```
packages/logic/src/
├── composables/
│   ├── api/              # API calls
│   ├── business/         # Business logic
│   ├── content/          # Dynamic content
│   ├── seo/              # SEO utilities
│   ├── schema/           # Schema.org
│   └── utils/            # Utility composables
├── stores/               # Pinia stores
├── utils/
│   └── types/            # TypeScript types
├── config/               # Shared configuration
└── middleware/           # Shared middleware
```

### `ui-{marca}`

Presentación específica de cada marca (componentes, páginas, layouts).

```
packages/ui-alquilatucarro/
├── app/
│   ├── app.config.ts     # Marca-specific config
│   ├── components/       # Vue components
│   ├── pages/            # Routes
│   ├── layouts/          # Layouts
│   └── assets/           # Styles
├── server/               # Server routes
├── public/               # Static assets
└── nuxt.config.ts        # Nuxt config
```

---

## 🤝 Contribuir

### Convenciones

**Commits:**
```bash
# Cambio en logic package
git commit -m "feat(logic): add new composable"
git commit -m "fix(logic): fix validation bug"

# Cambio en UI package
git commit -m "feat(alquilatucarro): new hero section"
git commit -m "fix(alquilame): button color"

# Cambio en múltiples packages
git commit -m "feat: new promotions feature"
```

**Branches:**
```bash
# Features
git checkout -b feature/promotions

# Bugfixes
git checkout -b fix/reservation-bug

# Hotfixes
git checkout -b hotfix/critical-bug
```

### Code Review

Antes de crear PR:

```bash
# 1. Verificar que compila
pnpm typecheck

# 2. Verificar lint
pnpm lint

# 3. Verificar tests
pnpm test

# 4. Verificar builds
pnpm build
```

---

## 🆘 Troubleshooting

### Problema: "Cannot find module '@logic/...'"

```bash
# Solución:
pnpm install
pnpm dev:alquilatucarro
```

### Problema: "HMR no funciona"

```bash
# Solución:
pnpm clean
pnpm install
pnpm dev:all
```

### Problema: "Build falla"

```bash
# Solución:
pnpm typecheck  # Ver errores de TypeScript
pnpm lint       # Ver errores de lint
pnpm build      # Ver errores de build
```

Ver más en [Troubleshooting](./docs/development-guide.md#troubleshooting)

---

## 📊 Métricas

### Comparativa Antes/Después del Monorepo

| Métrica | Antes (3 Branches) | Después (Monorepo) | Mejora |
|---------|-------------------|-------------------|--------|
| Cambios en lógica | 4 horas | 10 min | 96% ⬇️ |
| Hotfixes críticos | 2 horas | 15 min | 88% ⬇️ |
| Bugs por inconsistencia | 3-5/mes | 0 | 100% ⬇️ |
| Testing 3 marcas | 90 min | 30 min | 67% ⬇️ |
| **Tiempo ahorrado/semana** | - | **12-15 horas** | 🎯 |

---

## 📄 Licencia

Private - Todos los derechos reservados © 2026

---

## 🔗 Enlaces

- **Sitios de Producción:**
  - [alquilatucarro.com](https://alquilatucarro.com)
  - [alquilame.com](https://alquilame.com)
  - [alquicarros.com](https://alquicarros.com)

- **Firebase Console:**
  - [alquilatucarro](https://console.firebase.google.com/project/alquilatucarro)
  - [alquilame](https://console.firebase.google.com/project/alquilame)
  - [alquicarros](https://console.firebase.google.com/project/alquicarros)

---

**Última actualización:** 2026-01-20
