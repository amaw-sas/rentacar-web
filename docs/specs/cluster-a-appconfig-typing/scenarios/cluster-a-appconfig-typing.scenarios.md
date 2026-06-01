---
name: cluster-a-appconfig-typing
created_by: claude
created_at: 2026-06-01T00:00:00Z
follows: logic-buildmode-residual
---

# Cluster A — tipar app.config (franchise/organization/reservation)

## Contexto

Primer cluster del baseline de errores de tipo reales. En `ui-alquilatucarro`, 96 accesos a
`franchise`/`organization`/`reservation` eran TS18046 (`is of type 'unknown'`) en composables SEO
compartidos (`useBaseSEO`, `useAggregateRating`, `useLocalBusiness`…) y páginas/componentes de marca.

Causa raíz (probada con un probe `const x: null = useAppConfig().franchise` y con `vue-tsc`): el
`uiConfig` compartido (`logic/src/config/ui.config.ts`) definía `header.slots.close`, un slot que
**no existe** en @nuxt/ui v4 (Header expone root/container/left/center/right/.../body). Eso hacía a
`uiConfig` no asignable a `AppConfigUI`, violando el constraint `C extends AppConfigInput` de
`defineAppConfig`. Ante la violación, TS colapsa `C` al constraint (índice `[key: string]: unknown`),
así que TODO el app.config — incluidos franchise/organization/reservation — quedaba `unknown`.

El override era además un no-op en runtime (el slot no existe → @nuxt/ui lo ignora).

**Fix:** eliminar el bloque `header` inválido de `uiConfig`. Restaura la inferencia del app.config
completo. Cambio cero-visual.

Línea base (`ui-alquilatucarro`): 454 errores TS.

## SCEN-001: franchise/organization/reservation dejan de ser `unknown`

**Given**: `uiConfig` sin el slot inválido `header.close`, tras `nuxt prepare`.
**When**: `pnpm --filter ui-<marca> typecheck` en las 3 marcas.
**Then**: el conteo de `error TS18046: '<x>' is of type 'unknown'` para `x ∈ {franchise,
organization, reservation}` pasa a **0** en las 3 marcas (era 96 en alquilatucarro).
**Evidence**: stdout typecheck — `grep -E "'(franchise|organization|reservation)' is of type 'unknown'" | wc -l` == 0.

## SCEN-002: el TS2322 de `ui` en app.config desaparece

**Given**: el mismo estado.
**When**: typecheck.
**Then**: `app/app.config.ts ... error TS2322 ... not assignable to type 'AppConfigUI'` ya no aparece
en ninguna marca (0).
**Evidence**: stdout — `grep -c 'app.config.ts.*error TS2322'` == 0.

## SCEN-003: sin regresión de #18 ni del residual de capa

**Given**: el fix.
**When**: typecheck.
**Then**: auto-imports Vue (`ref|computed|watch|reactive|nextTick|onMounted`) == 0, handlers de
servidor (`defineEventHandler|sendRedirect|createError`) == 0, y residual composables/stores
(`logic/src/(composables|stores)` TS2304) == 0, en las 3 marcas. El total por marca baja respecto a
su baseline (~-108 en alquilatucarro).
**Evidence**: stdout typecheck — los tres greps == 0; total < baseline.

## SCEN-004: sin regresión visual del header

**Given**: `header.slots.close` era un no-op en runtime (slot inexistente en @nuxt/ui v4).
**When**: se carga la home en navegador (agent-browser) y se abre el menú/header en viewport móvil.
**Then**: el header y su botón de cierre se ven y funcionan igual que antes del cambio; 0 errores de
consola, 0 requests fallidos.
**Evidence**: screenshot del header (desktop + móvil) + consola limpia vía agent-browser.

## SCEN-005: sin regresión en la suite de logic

**Given**: el fix.
**When**: `pnpm --filter @rentacar-main/logic test run`.
**Then**: todos los tests pasan (≥ 260).
**Evidence**: stdout vitest — `Test Files N passed`, 0 failed.

## Non-goals

- Otros clusters del baseline: páginas SEO con data `{}` (TS2339), fixtures de tests, blog
  (`related`/`p` unknown). `typecheck` sigue exit 1 por ellos.
- Re-implementar el estilo del botón de cierre del header bajo un slot v4 válido (era no-op; si se
  desea, es enhancement aparte).

## Anti-reward-hacking

SCEN-001/002 miden eliminación a 0 de una clase concreta (no "menos errores"). SCEN-003 evita
moverlo rompiendo trabajo previo. SCEN-004 exige verificación visual real (no asumir "no-op").
