# Migración a Monorepo Multi-Marca

**Fecha de Inicio:** 2026-01-20
**Estado:** 📋 Documentado - Pendiente de Ejecución
**Tiempo Estimado:** 15-20 días
**Tipo:** Migración Incremental con Zero Downtime

---

## Resumen Ejecutivo

### Problema Actual

```
┌─────────────────────────────────────────────┐
│  3 Branches Git Separados                   │
│  ├─ main (alquilatucarro.com)              │
│  ├─ alquilame                               │
│  └─ alquicarros                             │
│                                             │
│  ❌ Merge Hell: 4-6 horas/semana            │
│  ❌ Bugs por inconsistencia: 3-5/mes        │
│  ❌ Hotfixes lentos: 2 horas                │
│  ❌ Cherry-pick manual constante            │
└─────────────────────────────────────────────┘
```

### Solución: Monorepo

```
┌─────────────────────────────────────────────┐
│  Monorepo con pnpm Workspaces               │
│  ├─ packages/logic/                         │
│  │   └─ Lógica compartida (100%)            │
│  ├─ packages/ui-alquilatucarro/             │
│  ├─ packages/ui-alquilame/                  │
│  └─ packages/ui-alquicarros/                │
│                                             │
│  ✅ 1 cambio → 3 marcas actualizadas        │
│  ✅ Zero merge conflicts                    │
│  ✅ Consistency garantizada                 │
│  ✅ Hotfixes en 15 minutos                  │
│  ✅ 12-15 horas/semana ahorradas            │
└─────────────────────────────────────────────┘
```

### ROI

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Cambios en lógica | 4 horas | 10 min | 96% ⬇️ |
| Hotfixes críticos | 2 horas | 15 min | 88% ⬇️ |
| Bugs por inconsistencia | 3-5/mes | 0 | 100% ⬇️ |
| **Tiempo ahorrado/semana** | - | **12-15 horas** | 🎯 |
| **Productividad** | Baseline | **+150%** | 🚀 |
| **ROI Breakeven** | - | **2 semanas** | ✅ |

---

## Estado de la Migración

### ✅ Fase 0: Preparación (Completada)

- [x] Auditoría de código completada
- [x] Documentación creada
  - [x] `docs/migration/audit-results.md`
  - [x] `docs/architecture.md`
  - [x] `docs/development-guide.md`
  - [x] `docs/deployment.md`
  - [x] `MIGRATION.md` (este documento)
  - [x] `README.md` (actualizado)
- [ ] Backup completo del repositorio
- [ ] Branch `migration/monorepo` creado
- [ ] Equipo capacitado

### ⏳ Fase 1: Estructura Base (Pendiente)

**Duración estimada:** 2 días

- [ ] Crear estructura de directorios
- [ ] Configurar `pnpm-workspace.yaml`
- [ ] Crear `packages/logic/package.json`
- [ ] Crear packages UI (`ui-alquilatucarro`, `ui-alquilame`, `ui-alquicarros`)
- [ ] Configurar `.gitignore`
- [ ] Configurar `tsconfig.json` compartido

### ⏳ Fase 2: Migrar Logic Package (Pendiente)

**Duración estimada:** 3 días

- [ ] Mover `app/composables/` → `packages/logic/src/composables/`
- [ ] Mover `app/stores/` → `packages/logic/src/stores/`
- [ ] Mover `app/utils/` → `packages/logic/src/utils/`
- [ ] Dividir `app/app.config.ts` → `packages/logic/src/config/`
- [ ] Crear barrel exports (`index.ts`)
- [ ] Verificar imports
- [ ] Instalar dependencias

### ⏳ Fase 3: Crear UI Packages (Pendiente)

**Duración estimada:** 5 días

- [ ] Migrar `ui-alquilatucarro` (marca principal)
  - [ ] Copiar estructura
  - [ ] Configurar `nuxt.config.ts`
  - [ ] Configurar `app.config.ts`
  - [ ] Actualizar imports
  - [ ] Testing local
- [ ] Migrar `ui-alquilame`
- [ ] Migrar `ui-alquicarros`

### ⏳ Fase 4: Testing (Pendiente)

**Duración estimada:** 3 días

- [ ] Testing manual de las 3 marcas
- [ ] Verificar HMR cross-package
- [ ] Testing de builds
- [ ] Tests de regresión
- [ ] Performance testing

### ⏳ Fase 5: CI/CD (Pendiente)

**Duración estimada:** 2 días

- [ ] Crear `.github/workflows/ci.yml`
- [ ] Crear `.github/workflows/deploy.yml`
- [ ] Configurar secrets en GitHub
- [ ] Testing de pipelines

### ⏳ Fase 6: Go Live (Pendiente)

**Duración estimada:** 1 día

- [ ] Merge a `main`
- [ ] Deploy de las 3 marcas
- [ ] Verificación en producción
- [ ] Monitoreo post-deploy
- [ ] Deprecar branches antiguos

---

## Checklist de Pre-Migración

### Antes de Empezar

- [ ] **Backup completo creado**
  ```bash
  git clone rentacar-main rentacar-main-backup-2026-01-20
  cd rentacar-main-backup
  git checkout main && git pull
  git checkout alquilame && git pull
  git checkout alquicarros && git pull
  ```

- [ ] **Branch de migración creado**
  ```bash
  cd rentacar-main
  git checkout main
  git checkout -b migration/monorepo
  git push -u origin migration/monorepo
  ```

- [ ] **Dependencias actualizadas**
  ```bash
  node -v  # >= 20.0.0
  pnpm -v  # >= 9.0.0
  ```

- [ ] **Documentación leída**
  - [ ] `docs/migration/audit-results.md`
  - [ ] `docs/architecture.md`
  - [ ] `docs/development-guide.md`

- [ ] **Equipo notificado**
  - [ ] Desarrolladores
  - [ ] QA
  - [ ] DevOps
  - [ ] Stakeholders

---

## Plan de Rollback

### Si algo sale mal

**Opción 1: Usar backup**
```bash
cd ..
rm -rf rentacar-main
mv rentacar-main-backup-2026-01-20 rentacar-main
cd rentacar-main
git checkout main
```

**Opción 2: Revertir commits**
```bash
git log --oneline
git reset --hard <commit-antes-de-migración>
git push --force origin main
```

**Opción 3: Volver a branch pre-monorepo**
```bash
# Si creaste tag de backup
git checkout main-pre-monorepo
git checkout -b main-restored
git push origin main-restored
```

---

## Archivos Críticos

### Nuevos Archivos a Crear

```
rentacar-main/
├── pnpm-workspace.yaml                        # ⭐ NUEVO
├── package.json (root)                        # ⭐ ACTUALIZAR
├── packages/
│   ├── logic/
│   │   ├── package.json                       # ⭐ NUEVO
│   │   ├── tsconfig.json                      # ⭐ NUEVO
│   │   └── src/
│   │       ├── index.ts                       # ⭐ NUEVO
│   │       ├── composables/index.ts           # ⭐ NUEVO
│   │       ├── stores/index.ts                # ⭐ NUEVO
│   │       ├── utils/index.ts                 # ⭐ NUEVO
│   │       └── config/index.ts                # ⭐ NUEVO
│   ├── ui-alquilatucarro/
│   │   ├── package.json                       # ⭐ ACTUALIZAR
│   │   ├── nuxt.config.ts                     # ⭐ ACTUALIZAR
│   │   └── app/app.config.ts                  # ⭐ ACTUALIZAR
│   ├── ui-alquilame/                          # ⭐ NUEVO
│   └── ui-alquicarros/                        # ⭐ NUEVO
├── .github/workflows/
│   ├── ci.yml                                 # ⭐ NUEVO
│   └── deploy.yml                             # ⭐ NUEVO
└── scripts/
    └── deploy-all.sh                          # ⭐ NUEVO
```

### Archivos a Mover

```
DE: app/composables/*
A:  packages/logic/src/composables/*

DE: app/stores/*
A:  packages/logic/src/stores/*

DE: app/utils/*
A:  packages/logic/src/utils/*

DE: app/app.config.ts (60%)
A:  packages/logic/src/config/*

DE: app/components/*
A:  packages/ui-{marca}/app/components/*

DE: app/pages/*
A:  packages/ui-{marca}/app/pages/*
```

---

## Verificación de Éxito

### Checklist de Verificación

**Después de completar cada fase:**

- [ ] **Estructura**
  - [ ] Monorepo creado con estructura correcta
  - [ ] `pnpm install` funciona sin errores
  - [ ] Todos los packages listados: `pnpm list --depth 0`

- [ ] **Logic Package**
  - [ ] Composables movidos y exportados
  - [ ] Stores movidos y exportados
  - [ ] Utils movidos y exportados
  - [ ] Config extraída y exportada
  - [ ] `pnpm --filter @rentacar-main/logic typecheck` sin errores

- [ ] **UI Packages**
  - [ ] Las 3 marcas existen
  - [ ] `pnpm install` sin errores en cada una
  - [ ] `pnpm dev` funciona en cada una
  - [ ] HMR funciona
  - [ ] Imports desde logic funcionan

- [ ] **Funcionalidad**
  - [ ] Home page carga en las 3 marcas
  - [ ] Búsqueda funciona
  - [ ] Formulario de reserva funciona
  - [ ] SEO dashboard funciona (si aplica)
  - [ ] Navegación funciona
  - [ ] Assets se cargan correctamente

- [ ] **Build**
  - [ ] `pnpm build` funciona sin errores
  - [ ] Builds de las 3 marcas completan
  - [ ] `.output/` generado correctamente
  - [ ] `pnpm preview` funciona

- [ ] **CI/CD**
  - [ ] Pipeline de CI pasa
  - [ ] Pipeline de deploy configurado
  - [ ] Secrets configurados en GitHub

---

## Métricas de Éxito

### KPIs a Medir Post-Migración

| Semana | Métrica | Target |
|--------|---------|--------|
| **Semana 1** | Cambios en logic | < 15 min promedio |
| | Hotfixes | < 20 min |
| | Conflictos | 0 |
| | Bugs nuevos | 0 |
| **Semana 2** | Tiempo ahorrado | 10+ horas |
| | Satisfacción equipo | 8+/10 |
| **Semana 4** | ROI alcanzado | ✅ |
| | Productividad | +100% |

### Dashboard de Seguimiento

```markdown
## Semana 1 Post-Migración (Fecha: _____)
- Cambios en logic: ___
- Tiempo promedio: ___ min
- Conflictos: ___
- Hotfixes: ___
- Bugs: ___
- Horas ahorradas: ___

## Semana 2 Post-Migración (Fecha: _____)
...
```

---

## Soporte Post-Migración

### Primeros 30 Días

**Canales de comunicación:**
- Canal Slack: `#monorepo-migration`
- Daily standups (primeros 7 días)
- Weekly retrospectives (primeras 4 semanas)

**Onboarding:**
1. Sesión de training (2 horas) - [Agendar]
2. Pair programming primeros cambios
3. Documentación accesible en `/docs`
4. FAQ actualizado

**Troubleshooting común:**

| Problema | Solución |
|----------|----------|
| "No encuentro composable X" | Verificar auto-import en `nuxt.config.ts` |
| "Cambio en logic no se refleja" | Reiniciar dev server |
| "Error de tipos" | `pnpm typecheck`, verificar peerDependencies |
| "Build falla" | Verificar que logic se buildea primero |

---

## Branches Deprecados

### Después de la Migración

```bash
# Renombrar branches antiguos (NO eliminar todavía)
git branch -m alquilame alquilame-deprecated
git branch -m alquicarros alquicarros-deprecated

# Push para backup
git push origin alquilame-deprecated
git push origin alquicarros-deprecated

# Eventualmente (después de 1-2 meses sin issues):
git branch -D alquilame-deprecated
git branch -D alquicarros-deprecated
git push origin --delete alquilame-deprecated
git push origin --delete alquicarros-deprecated
```

---

## Conclusión

### Estado Actual

✅ **Documentación Completa**
- Auditoría realizada
- Arquitectura definida
- Guías creadas
- Plan detallado

⏳ **Próximos Pasos**

1. **Crear backup completo**
2. **Crear branch `migration/monorepo`**
3. **Capacitar equipo** (sesión de 2 horas)
4. **Ejecutar Fase 1** (estructura base)
5. **Iteración incremental** hasta completar

### Expectativas

**Tiempo Total:** 15-20 días (1 persona full-time)
**ROI Breakeven:** 2 semanas post-migración
**Beneficio a largo plazo:** 12-15 horas/semana ahorradas

### Contacto

Para preguntas sobre la migración:
- Documentación: `/docs`
- Slack: `#monorepo-migration`
- Email: [equipo técnico]

---

**Documento creado:** 2026-01-20
**Estado:** Documentado - Pendiente de Ejecución
**Próxima actualización:** Después de cada fase completada
