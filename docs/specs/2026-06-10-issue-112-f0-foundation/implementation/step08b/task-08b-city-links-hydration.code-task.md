## Status: COMPLETED
## Blocked-By: step08a/task-08a-footer-structure.code-task.md
## Completed: 2026-06-10

> Evidence: guard #109 INTACT — `git diff origin/main` shows ZERO changed lines from
> `<script lang="ts" setup>` onward (verified: 0 +/- content lines after the script
> tag). `reservationInitDay/EndDay` stay `ref<string|null>(null)`, computed ONLY in
> `onMounted`; `getCityReservationURL` unchanged → `/${city.id}` stable href at SSR.
> City buttons keep `v-for="city in cities"` (useData), `:to="getCityReservationURL"`,
> `:external="true"`, `target="_blank"` — no `wa.me`. Restyle to red-on-red:
> `bg-white/10 hover:bg-white/20 ring-1 ring-white/25` (was `bg-blue-600 hover:bg-blue-800`).
> f0-chrome step08b PASS (guard refs + onMounted-assignment + internal-link asserts).
> 19-count + no-hydration-warning are runtime → step10 (E2E blocked: no Supabase creds).

# Task: Enlaces de ciudad internos + guard de hidratación #109 (default.vue)

## Description
Verificar y preservar el guard de hidratación del issue #109 en la sección de ciudades del footer reskinneado, manteniendo los 19 enlaces internos a `/[city]` (SEO) y restyleando los botones a rojo sin tocar la lógica de fechas.

## Background
MONEY-LANDMINE (#109): los 19 botones de ciudad usan `getCityReservationURL(city)` con `reservationInitDay/EndDay` calculados SOLO en `onMounted` (`default.vue:195-201`). En SSR/primera hidratación las fechas son `null` → `buildCityReservationURL` (`logic/src/utils/buildCityReservationURL.ts:43-44`) retorna el href estable `/${city.id}`, idéntico en servidor y cliente (evita hydration attribute mismatch). Decisión aprobada: enlaces INTERNOS (no WhatsApp como el diseño estático). Si la fusión de Step 8a alteró el `v-for`, hay que restaurar este comportamiento exacto.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§3 — guard #109 + enlaces de ciudad)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Mantener el cálculo de `reservationInitDay/EndDay` solo en `onMounted` (no mover a SSR).
2. `getCityReservationURL(city)` → `/${city.id}` en SSR (fechas null); deep-link con fecha fresca tras montar.
3. `:external="true" target="_blank"` en cada `UButton` de ciudad; `v-for` sobre `cities` de `useData()`.
4. Restyle de los 19 botones a rojo (tokens de marca) sin alterar la lógica.

## Dependencies
- **Step 08a**: estructura del footer rojo ya consolidada.

## Implementation Approach
1. Revisar la sección de ciudades tras Step 8a.
2. Confirmar/restaurar el patrón onMounted + href SSR estable.
3. Aplicar el restyle rojo a los botones.
4. Verificar SSR sin hydration warning + E2E.

## Acceptance Criteria
1. **19 enlaces internos (SCEN-F0-04)**
   - Given cualquier página
   - When se ve el footer
   - Then cada uno de los 19 enlaces de ciudad tiene `href="/{city.id}"` (p.ej. `/bogota`), interno, no `wa.me`.
2. **Sin hydration mismatch (#109)**
   - Given SSR y primera hidratación
   - When se compara el href renderizado en servidor vs cliente (pre-onMounted)
   - Then es idéntico (`/${city.id}`); sin warning de hydration en consola.
3. **E2E verde**
   - Given los selectores de footer/ciudad
   - When `pnpm test:e2e:alquilame`
   - Then pasan (testids preservados).

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: hydration, ssr, footer, issue-109, seo, money-landmine
- **Required Skills**: Nuxt SSR/hydration, Vue, @internationalized/date
- **Step**: 08b of 11
- **Files to Modify**: app/layouts/default.vue (sección ciudades + script)
- **Files to Read**: design doc §3, logic/src/utils/buildCityReservationURL.ts, default.vue:186-209
- **Context Estimate**: M
- **Scenario-Strategy**: required
