# Diseño: Deploy Multi-Rama con GitHub Actions

**Fecha:** 2026-01-27
**Estado:** Aprobado
**Autor:** Sistema de diseño colaborativo

## Contexto

Durante la fase 6 de migración a monorepo, se necesita probar deploys de manera controlada sin afectar la rama `main` de producción. Las marcas `alquilame` y `alquicarros` aún no están en producción y pueden usarse como entornos de prueba.

## Objetivos

1. Permitir deploys automáticos desde rama `alquicarros` para probar cambios
2. Mantener el comportamiento actual en rama `main` (deploy de 3 marcas)
3. Optimizar deploys: solo desplegar marcas afectadas por cambios
4. Evitar contaminación de releases: solo `main` genera tags/releases

## Arquitectura

### Workflow Único con Lógica Condicional

Se modifica `.github/workflows/deploy.yml` para:
- Escuchar 2 ramas: `main` y `alquicarros`
- Detectar cambios en packages específicos
- Generar matriz dinámica según rama y archivos modificados
- Crear releases solo desde `main`

### Lógica de Detección de Cambios

```yaml
if rama == 'main':
  if cambios en 'packages/logic/**':
    deploy: [alquilatucarro, alquicarros, alquilame]
  else if cambios en 'packages/ui-alquilatucarro/**':
    deploy: [alquilatucarro]
  else if cambios en 'packages/ui-alquicarros/**':
    deploy: [alquicarros]
  else if cambios en 'packages/ui-alquilame/**':
    deploy: [alquilame]

if rama == 'alquicarros':
  if cambios en 'packages/logic/**':
    deploy: [alquicarros, alquilame]  # Logic compartido afecta ambas
  else if cambios en 'packages/ui-alquicarros/**':
    deploy: [alquicarros]
  else if cambios en 'packages/ui-alquilame/**':
    deploy: [alquilame]
  else:
    deploy: []  # Skip deploy
```

## Escenarios de Uso

| # | Rama | Cambios en | Resultado |
|---|------|------------|-----------|
| 1 | `main` | `logic/` | Despliega: alquilatucarro + alquicarros + alquilame + 3 releases |
| 2 | `main` | `ui-alquilatucarro/` | Despliega: alquilatucarro + 1 release |
| 3 | `main` | `ui-alquicarros/` | Despliega: alquicarros + 1 release |
| 4 | `main` | `ui-alquilame/` | Despliega: alquilame + 1 release |
| 5 | `alquicarros` | `logic/` | Despliega: alquicarros + alquilame (sin releases) |
| 6 | `alquicarros` | `ui-alquicarros/` | Despliega: alquicarros (sin releases) |
| 7 | `alquicarros` | `ui-alquilame/` | Despliega: alquilame (sin releases) |
| 8 | `alquicarros` | `.github/workflows/` | No despliega nada |

## Decisiones Técnicas

### 1. Secrets de GitHub

**Decisión:** No se requieren secrets adicionales.

**Razón:** Las 3 marcas comparten:
- Mismo Firebase Project (`rentacar-403321`)
- Misma cuenta de servicio para deploy
- Mismas credenciales Firebase App
- Mismos endpoints de API

### 2. Dominios

**Configuración:**
- `alquilatucarro.com` - Producción
- `alquilame.co` - Staging/Preview (no `.com`)
- `alquicarros.com` - Staging/Preview

**Uso:** Variable `domain` en matriz se usa para `NUXT_GSC_REDIRECT_URI` (OAuth callback futuro).

### 3. Releases y Tags

**Decisión:** Solo rama `main` genera releases.

**Razón:**
- Rama `alquicarros` es para pruebas, no debe contaminar historial de releases
- Evita confusión entre versiones de producción vs staging
- Mantiene changelog limpio

### 4. Job de Detección

Se agrega job `detect-changes` que:
- Usa `git diff` para detectar archivos modificados
- Genera array JSON con marcas a desplegar
- El job `deploy` consume este output como matriz dinámica

## Implementación

### Cambios en deploy.yml

1. **Trigger:** Agregar rama `alquicarros`
2. **Job nuevo:** `detect-changes` antes de `deploy`
3. **Matriz dinámica:** Usar `fromJson()` con output de `detect-changes`
4. **Condicionales:** Agregar `if: github.ref_name == 'main'` en steps de releases

## Ventajas

- ✅ Eficiente: solo despliega lo necesario
- ✅ Seguro: rama de prueba no contamina releases
- ✅ Mantenible: un solo workflow, lógica centralizada
- ✅ Flexible: fácil agregar más ramas de prueba
- ✅ Cobertura completa: todos los packages UI cubiertos

## Limitaciones

1. **Primer push a rama nueva:** `github.event.before` puede estar vacío, se usa comparación con HEAD
2. **Cambios solo en workflow:** No despliega nada, cambios aplican en siguiente push
3. **Detección manual:** No usa GitHub Actions `paths` filter (no soporta matrices dinámicas)

## Plan de Migración Futuro

Una vez validadas las pruebas en `alquicarros`:
1. Merge a `main`
2. Eliminar ramas `alquilatucarro`, `alquilame`, `alquicarros`
3. Todo el tráfico de producción fluye desde `main`

## Rollback

Si el workflow falla, revertir a commit anterior:
```bash
git revert <commit-hash>
git push
```

El workflow anterior seguirá funcional en `main`.
