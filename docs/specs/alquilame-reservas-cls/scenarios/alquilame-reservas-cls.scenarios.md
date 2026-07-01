---
name: alquilame-reservas-cls
created_by: pabloandi
created_at: 2026-07-01T00:00:00Z
---

# alquilame — /reservas hero CLS (heading-hero en critical-cls)

Mirror del fix de alquicarros (web#289 / PR #291). alquilame `/reservas` mide ~0.209
de CLS en Lighthouse mobile. Misma causa: el h1 del hero usa `.heading-hero`
(`typography.css`: `@apply text-4xl md:text-5xl lg:text-7xl leading-tight`), que gana
al `text-3xl`/`leading-[1.1]` inline en el render final pero viaja solo en el CSS
inyectado → con solo crítico el h1 pinta a 30px y salta a 36px; ese salto empuja la
columna del Searcher (fila 2 del grid móvil). Fix: declarar `.heading-hero` en el
critical-cls con sus valores finales por breakpoint, al final del layer para ganar la
cascada.

## SCEN-ALM-R-01: el crítico reserva el tamaño final del h1 del hero
**Given**: la app alquilame (build/SSR o preview)
**When**: se extrae el `<style>` crítico inline y se instrumenta el h1 del hero durante la carga (CPU throttled)
**Then**: el crítico declara `.heading-hero` con `font-size: 2.25rem; line-height: 1.25` (+ md 3rem / lg 4.5rem); el `font-size` computado del h1 NO cambia entre el primer paint y el estado asentado (se mantiene en 36px móvil, sin salto 30px→36px)
**Evidence**: grep del inline `<style>` + probe Playwright del `getComputedStyle(h1).fontSize` en el tiempo

## SCEN-ALM-R-02: /reservas baja el CLS lab
**Given**: `/reservas` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: Cumulative Layout Shift < 0.1 (baseline ~0.209)
**Evidence**: `lh-reservas.json` → `audits['cumulative-layout-shift'].numericValue`

## SCEN-ALM-R-03: city sin regresión
**Given**: `/bogota` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: CLS se mantiene < 0.1 (el h1 de city usa la misma clase heading-hero)
**Evidence**: `lh-city.json` → `numericValue`

## SCEN-ALM-R-04: home sin regresión
**Given**: `/` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: CLS se mantiene < 0.1
**Evidence**: `lh-home.json` → `numericValue`

## SCEN-ALM-R-05: el h1 no cambia de tamaño visible ni rompe invariantes
**Given**: el worktree con el cambio aplicado
**When**: se corren las suites unit de alquilame y se compara el tamaño final del h1
**Then**: el tamaño FINAL del h1 es idéntico (heading-hero ya ganaba antes; solo se adelanta al primer paint); suites verdes salvo baseline pre-existente
**Evidence**: `pnpm --filter ui-alquilame test` + probe del `fontSize` asentado
