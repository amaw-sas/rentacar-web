---
name: reservas-hero-cls
created_by: pabloandi
created_at: 2026-07-01T00:00:00Z
---

# alquicarros — /reservas hero CLS (heading-hero en critical-cls) · web#289

Lighthouse `simulate` (default) medía CLS 0.187 en `/reservas` (columna del Searcher).
Investigación (systematic-debugging): NO se reproduce en Chrome real — LH `devtools`
(throttle aplicado) y Playwright real a 1×/4×/6× CPU + fast/4G, cold, dan 0.000. Es
un artefacto de Lantern. Mecanismo latente real: el h1 del hero usa `.heading-hero`
(`typography.css`: `@apply text-4xl md:text-5xl lg:text-7xl leading-tight`) que gana
al `text-3xl`/`leading-[1.1]` inline en el render final, pero `.heading-hero` está en
el CSS inyectado, no en el crítico → con solo crítico el h1 pinta a 30px (text-3xl) y
salta a 36px al aterrizar heading-hero; la columna del Searcher (fila 2 del grid móvil)
se desplaza. Fix defensivo (decisión del usuario): declarar `.heading-hero` en el
critical-cls con sus valores finales por breakpoint, al final del layer para ganar la
cascada. Elimina la carrera y baja el número lab.

## SCEN-R-01: el crítico reserva el tamaño final del h1 del hero
**Given**: la app alquicarros (build/SSR o preview)
**When**: se extrae el `<style>` crítico inline y se instrumenta el h1 del hero durante la carga (CPU throttled)
**Then**: el crítico declara `.heading-hero` con `font-size: 2.25rem; line-height: 1.25` (y breakpoints md 3rem / lg 4.5rem); el `font-size` computado del h1 NO cambia entre el primer paint y el estado asentado (se mantiene en 36px en móvil, sin salto 30px→36px)
**Evidence**: grep del inline `<style>` + probe Playwright del `getComputedStyle(h1).fontSize` en el tiempo

## SCEN-R-02: /reservas baja el CLS lab
**Given**: `/reservas` en el preview de Vercel
**When**: se corre Lighthouse mobile (default `simulate`)
**Then**: Cumulative Layout Shift < 0.1 (baseline 0.187)
**Evidence**: `lh-reservas.json` → `audits['cumulative-layout-shift'].numericValue`

## SCEN-R-03: city sin regresión
**Given**: `/bogota` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: CLS se mantiene < 0.1 (baseline 0.033; el h1 de city usa la misma clase heading-hero)
**Evidence**: `lh-city.json` → `numericValue`

## SCEN-R-04: home sin regresión
**Given**: `/` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: CLS se mantiene < 0.1 (baseline 0.000; el home NO usa heading-hero, pero el critical-cls es global — no debe empeorar)
**Evidence**: `lh-home.json` → `numericValue`

## SCEN-R-05: el h1 no cambia de tamaño visible ni rompe invariantes
**Given**: el worktree con el cambio aplicado
**When**: se corren las suites unit de alquicarros y se compara el tamaño final del h1 con y sin el cambio
**Then**: el tamaño FINAL del h1 es idéntico (heading-hero ya ganaba antes; solo se adelanta al primer paint); reskin-invariants + f0/f2/f3 verdes
**Evidence**: `pnpm --filter ui-alquicarros test` + probe del `fontSize` asentado (36px móvil, igual que baseline)
