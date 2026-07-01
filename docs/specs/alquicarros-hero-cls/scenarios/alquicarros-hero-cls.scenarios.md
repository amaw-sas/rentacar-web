---
name: alquicarros-hero-cls
created_by: pabloandi
created_at: 2026-07-01T00:00:00Z
---

# alquicarros — hero CLS via critical-cls

Mobile Lighthouse (Vercel alias `rentacar-web-alquicarros-git-main`) medió CLS
above-the-fold en el hero del reskin (#210): city `/bogota` 0.366, `/reservas`
0.209, home `/` 0.005 (latente — comparte el patrón). Causa raíz confirmada de
forma determinista: no hay `<link rel=stylesheet>` bloqueante; el `<style>`
crítico inline servido NO contiene `py-10`/`md:py-12`/`gap-10`/`leading-[1.1]`,
que el DOM del hero sí usa → aplican tras el primer paint (viajan en el CSS
inyectado por JS) → el hero crece (+80px de `py-10` en móvil) y empuja lo ya
pintado hacia abajo. Fix: reservar esa geometría en el bloque `critical-cls` de
`packages/ui-alquicarros/nuxt.config.ts` (mirror de alquilame #287).

## SCEN-ACR-CLS-01: el crítico inline reserva la geometría del hero
**Given**: la app alquicarros desplegada (o build local con SSR)
**When**: se solicita `/bogota` y se extrae solo el `<style>` crítico inline del `<head>`
**Then**: ese CSS inline declara `.py-10`, `.md:py-12`, `.gap-10` y `.leading-[1.1]` (y `.aspect-[16/9]`), de modo que el hero reserva su altura desde el primer paint sin depender del CSS inyectado por JS
**Evidence**: HTML servido (`curl`) + grep del contenido entre `<style>...</style>`; y `packages/ui-alquicarros/nuxt.config.ts` contiene esas reglas en `app.head.style` (verificable por unit test que lee el archivo)

## SCEN-ACR-CLS-02: city /bogota sin CLS
**Given**: `/bogota` en el preview de Vercel (imágenes reales del CDN)
**When**: se corre Lighthouse mobile
**Then**: Cumulative Layout Shift < 0.1 (baseline 0.366)
**Evidence**: `lh-city.json` → `audits['cumulative-layout-shift'].numericValue`

## SCEN-ACR-CLS-03: /reservas sin CLS — DEFERIDO (causa raíz distinta)
**Given**: `/reservas` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: Cumulative Layout Shift < 0.1 (baseline 0.209)
**Evidence**: `lh-reservas.json` → `audits['cumulative-layout-shift'].numericValue`

**Estado: NO satisfecho por este fix — deferido a issue aparte (decisión del usuario).**
El critical-cls redujo /reservas a 0.187 (no <0.1). Investigación (systematic-debugging):
la geometría del hero YA está reservada en el crítico (`h-[360px]`/`h-[410px]` del
guard #109, `py-10`, `gap-10`, `text-3xl`, `text-base`). En navegador real (Playwright,
incluso con throttling CPU 4x + red 4G) el CLS es 0; el 0.187 es un shift
Lantern-simulado de la columna del `Searcher` bajo carga lenta (hidratación del chunk
async), NO un colapso de CSS crítico. Mismo síntoma en alquilame (0.209) → problema
compartido del componente Searcher, no del critical-cls del hero. Fuera de alcance de
este fix; requiere investigación propia del Searcher.

## SCEN-ACR-CLS-04: home sin regresión
**Given**: `/` en el preview de Vercel
**When**: se corre Lighthouse mobile
**Then**: Cumulative Layout Shift se mantiene < 0.1 (baseline 0.005; el fix es global por marca y no debe empeorarlo)
**Evidence**: `lh-home.json` → `audits['cumulative-layout-shift'].numericValue`

## SCEN-ACR-CLS-05: invariantes visuales/reskin preservadas
**Given**: el worktree con el cambio de critical-cls aplicado
**When**: se corren las suites unit de alquicarros
**Then**: `reskin-invariants` + `f0-foundation` + `f2-legales` + `f3-citypage` pasan; ningún componente cambia (solo se añade CSS crítico que ya existía en el stylesheet inyectado)
**Evidence**: salida de `pnpm --filter ui-alquicarros test`
