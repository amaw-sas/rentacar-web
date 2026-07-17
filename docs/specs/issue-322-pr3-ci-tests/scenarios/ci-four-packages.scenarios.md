---
name: ci-four-packages
created_by: agent
created_at: 2026-07-16T14:05:00Z
issue: 322
pr_package: 3
---

# Issue 322 · PR3 — Encender control de calidad (CI 4 paquetes)

Holdout para el bloque A del issue madre: tests y CI no se ejecutaban en las
marcas (solo `logic`), y el script `test` faltaba en la marca en producción.

## SCEN-322-CI01 — ui-alquilatucarro tiene script test ejecutable

**Given** el monorepo con `pnpm`
**When** se ejecuta `pnpm --filter ui-alquilatucarro test`
**Then** vitest corre la suite unitaria del paquete (no falla por script ausente)

**Evidence**: `package.json` scripts + salida de vitest.

## SCEN-322-CI02 — CI corre las 4 suites unitarias

**Given** un push/PR al repo
**When** corre el workflow CI
**Then** se ejecutan tests de `logic`, `ui-alquilatucarro`, `ui-alquilame` y `ui-alquicarros`
**And** un fallo en cualquier paquete marca el job como fallido

**Evidence**: `.github/workflows/ci.yml`.

## SCEN-322-CI03 — Extractor de CategorySelectionSection no es vacuo

**Given** el test de loading del botón «Solicitar reserva»
**When** se extrae el bloque del botón
**Then** el bloque contiene la etiqueta «Solicitar reserva» (no cadena vacía)
**And** las aserciones negativas (`not.toMatch(/animate-spin/)`) no pasan por vacío

**Evidence**: `CategorySelectionSection.test.ts` ancla en texto estable sin exigir `>`.

## SCEN-322-CI04 — Suites de las 3 marcas pasan en local (gate pre-CI)

**Given** el código de la rama
**When** se corre `vitest run` en cada paquete de UI + logic
**Then** todos los tests pasan (sin fallos conocidos por anclas obsoletas)

**Evidence**: salida de vitest en las 4 packages.
