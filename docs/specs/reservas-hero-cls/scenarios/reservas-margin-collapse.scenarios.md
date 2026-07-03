---
name: reservas-margin-collapse-cls
created_by: pabloandi
created_at: 2026-07-02T00:00:00Z
supersedes_measurement_claim: web#291 ("reservas 0.187→0" fue artefacto de medición)
brands: [alquicarros, alquilame]
---

# /reservas hero CLS — colapso de márgenes UA (reset Preflight ausente del crítico)

Tras #290/#291, `/reservas` seguía dando CLS **bimodal** en Lighthouse mobile
(0 ó ~0.19, ~25% de las corridas) en alquicarros **y** alquilame. El #291
(declarar `.heading-hero` en el crítico) NO lo arregló: su claim "reservas
0.187→0" fue un artefacto de medición sobre una métrica ruidosa.

**Root cause (determinista, `box-probe.cjs` — crítico-solo vs CSS-completo,
mobile 390px):** el `@layer base` del critical-cls (`nuxt.config.ts`) resetea
solo `body/img/picture/svg`, NO los bloques. Al primer paint el `<h1>` del hero
carga con margen UA `0.67em×36px ≈ 24px` arriba+abajo y el `<p>` con `1em = 16px`;
cuando el CSS principal inyectado por JS aterriza (trae el Preflight de Tailwind
→ `margin:0`) esos márgenes colapsan → la columna de texto encoge 48px (229→181)
→ el Searcher sube 48px (top 373→325) → CLS. Bimodal porque solo se registra
cuando la inyección aterriza un frame después del primer paint.

**Fix (mismo mecanismo defensivo que #290/#291):** llevar al crítico lo que hoy
solo viaja en el CSS inyectado — el reset de bloques de Preflight **y** `.mt-4`
(sin `.mt-4` el reset solo movería el shift a +16px). Probado sin desplegar
(`hyp-test.cjs`): con el fix inyectado, `searcherCol.top` 373→325 == asentado,
`Δ 0`.

## SCEN-RMC-01: el crítico declara el reset de bloques y .mt-4
**Given**: la app (alquicarros o alquilame), SSR/preview
**When**: se extrae el `<style>` crítico inline servido en `/reservas`
**Then**: el crítico declara, dentro de `@layer base`, una regla de reset de
márgenes que cubre `h1` y `p` (`margin: 0`), y dentro de `@layer utilities`
declara `.mt-4 { margin-top: 1rem }`
**Evidence**: curl HTML desplegado + grep del inline `<style>`

## SCEN-RMC-02: primer paint == asentado (prueba determinista, la fuerte)
**Given**: `/reservas` mobile (390px) en el preview de Vercel
**When**: se mide `getBoundingClientRect().top` de la columna del Searcher
(`#hero .grid > *:nth-child(2)`) en crítico-solo (JS de `_nuxt` bloqueado) vs
CSS-completo
**Then**: `searcherCol.top` es idéntico en ambos estados (`Δ = 0px`); el `<h1>`
tiene `margin-top: 0` y el `<p>` `margin-bottom: 0` ya en el primer paint
**Evidence**: `box-probe.cjs` → `deltas.searcherCol.topΔ == 0`

## SCEN-RMC-03: /reservas elimina el spike de CLS
**Given**: `/reservas` en el preview de Vercel, ambas marcas
**When**: se corre Lighthouse mobile ×6+ por marca (baseline: ~25% daban ~0.19)
**Then**: TODAS las corridas dan CLS < 0.1 (spike bimodal eliminado, no solo
promedio bajo)
**Evidence**: 6 `lh-reservas-*.json` por marca → `audits['cumulative-layout-shift'].numericValue`

## SCEN-RMC-04: home y city sin regresión
**Given**: `/` y `/bogota` en el preview de Vercel, ambas marcas
**When**: se corre Lighthouse mobile
**Then**: CLS se mantiene < 0.1 (el reset alinea primer-paint al asentado; no
debe exponer otro hueco de margen above-the-fold)
**Evidence**: `lh-home.json` / `lh-city.json` por marca → `numericValue`

## SCEN-RMC-05: invariantes preservadas
**Given**: el worktree con el cambio aplicado
**When**: se corren las suites unit de ambas marcas
**Then**: el estado asentado es idéntico (Preflight ya aplicaba `margin:0`); f0
(incl. el nuevo guard del reset+mt-4) + reskin-invariants + f2/f3 verdes en
alquicarros y alquilame
**Evidence**: `pnpm --filter ui-alquicarros test` + `--filter ui-alquilame test`
