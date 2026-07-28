---
name: e2e-suite-collects
created_by: agent
created_at: 2026-07-22T09:00:00Z
issue: 374
---

# Issue 374 — La suite e2e no recolecta (`__dirname` en ESM)

`e2e/firebase-cleanup.spec.ts:10` usaba `__dirname` dentro de un módulo ESM
(`package.json` declara `"type": "module"`). La referencia lanza en tiempo de
**recolección**, y Playwright aborta la corrida entera antes de ejecutar una
sola prueba: `Total: 0 tests in 0 files` en las tres marcas.

Pasó inadvertido desde el commit inicial (`d27315e`) porque el job e2e de CI
nombra los archivos de spec explícitamente, y ese filtro excluye el archivo roto
de la recolección.

## SCEN-374-01 — La suite recolecta en las tres marcas

**Given** el monorepo con `"type": "module"`
**When** se ejecuta `BRAND=<marca> playwright test --list` para las tres marcas
**Then** el comando termina con éxito
**And** reporta más de 0 pruebas para cada marca

**Evidence**: medido tras el arreglo — alquilatucarro 1105 en 42 archivos;
alquicarros 800 en 30; alquilame 800 en 30. Antes: `Total: 0 tests in 0 files`
con `ReferenceError: __dirname is not defined in ES module scope`.

## SCEN-374-02 — El spec antes irrecolectable pasa

**Given** `e2e/firebase-cleanup.spec.ts` derivando la raíz desde `import.meta.url`
**When** se ejecuta ese spec en chromium
**Then** sus 7 aserciones de infraestructura pasan

**Evidence**: `7 passed (605ms)`. Confirma que el archivo no solo recolecta: sus
aserciones sobre la limpieza de Firebase describen el repo real.

## SCEN-374-03 — El embudo de reserva se ejecuta de verdad, no vacuo

**Given** un dev server de alquicarros con credenciales Supabase
**When** se ejecutan los specs del embudo que corre CI
**Then** todas las pruebas pasan
**And** ninguna queda en `skipped` (un run todo-skipped no probaría nada)

**Evidence**: `13 passed (1.3m)`, 0 skipped, contra servidor real en :4001.

## SCEN-374-04 — CI falla si la suite vuelve a no recolectar

**Given** un cambio que rompe la recolección por cualquier causa
**When** corre el job «Quality Checks»
**Then** el paso de recolección falla con una anotación de error
**And** el guard vive en el job que **siempre** corre, no en el job e2e
condicionado a los secretos de Supabase — ahí un fork sin secretos lo saltaría
en silencio

**Evidence**: el guard afirma la invariante («la suite recolecta»), no una causa
concreta. Un grep de `__dirname` solo atraparía esta regresión; `--list` atrapa
además errores de sintaxis, imports rotos y módulos ausentes.
