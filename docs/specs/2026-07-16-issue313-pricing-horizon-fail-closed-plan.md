# Plan de implementación — issue #313 fail-closed más allá del horizonte de tarifas

**Date:** 2026-07-17
**Status:** Draft (pendiente aprobación en plan mode)
**Spec:** `docs/specs/2026-07-16-issue313-pricing-horizon-fail-closed-design.md` (Approved, commit 21e1d6f)
**Issue:** #313 — PR referenciará sin cerrar (la carga de tarifas 2027 es de operación).

## Mapa de archivos (Step 6.5)

| Archivo | Acción | Responsabilidad única | SCEN |
|---|---|---|---|
| `packages/logic/src/utils/pricingHorizon.ts` | NEW | `isBeyondPricingHorizon(prices, pickupDate)` — única fuente de la regla de horizonte | 1,2,3 |
| `packages/logic/src/utils/__tests__/pricingHorizon.test.ts` | NEW | Unit del predicado + bordes | 1,2,3 |
| `packages/logic/src/utils/pickPriceForDate.ts` | MODIFY | Regla 0: horizonte excedido → `undefined`. Reglas 1-3 intactas | 1 |
| `packages/logic/src/utils/__tests__/pickPriceForDate.test.ts` | NEW | Unit de las 4 reglas (regresión + regla 0) | 1,2 |
| `packages/logic/src/composables/useCategory.ts` | MODIFY | `isMonthlyPriceUnavailable` + cierre de fall-throughs mensuales | 4 |
| `packages/logic/src/composables/__tests__/useCategory.getTotalPrice.test.ts` | MODIFY | SCEN-4 ambas variantes de cobertura | 4 |
| `packages/logic/server/utils/transformers.ts` | MODIFY | Warning `[pricing-horizon]` si max `valid_until` < hoy+60d | 7,8 |
| `packages/logic/server/utils/__tests__/transformers.test.ts` | MODIFY | SCEN-7/8 (spy `console.warn`) | 7,8 |
| `packages/ui-alquicarros/app/components/wizard/steps/StepVehicle.vue` | MODIFY | Banner de flujo + etiqueta por tile + bloqueo de avance | 4b,5 |
| `packages/ui-alquilame/app/components/CategorySelectionSection.vue` | MODIFY | Banner de flujo + estado inline por card | 4b,6 |
| `packages/ui-alquilatucarro/app/components/CategorySelectionSection.vue` | MODIFY | Espejo de alquilame | 4b,6 |
| `packages/ui-alquilame/app/components/__tests__/CategorySelectionSection.test.ts` | MODIFY | Componente: estado inline + condición de banner | 4b |
| `e2e/pricing-horizon-alquicarros.spec.ts` | NEW | E2E wizard mensual bloqueado (fixture `page.route`, fechas relativas) | 5 |
| `e2e/pricing-horizon-alquilame.spec.ts` | NEW | E2E cards mensuales bloqueadas | 6 |

Límite de responsabilidad: `pricingHorizon.ts` es la ÚNICA definición del predicado; `pickPriceForDate`, `useCategory` y la UI lo consumen, no lo reimplementan. `categoryOffersMonthly.ts` y `StepCoverage.vue` NO se tocan (fail-open en oferta; degradación ya cubierta e inalcanzable).

## Pasos (Step 7) — orden por dependencia, SDD scenario-first

### Fase 1 — Fundación (contrato de selección)

**Paso 1 · `pricingHorizon` util + unit** · S · dep: ninguna
Escenario: dado filas con max `end_date`=D, `isBeyondPricingHorizon(prices, D+1d)`→true; `D`→false; open-ended (`end_date` vacío)→siempre false; `prices` vacío / fecha inválida→false; pickup anterior a todo el dato→false.
Acepta: SCEN-1/2/3 + bordes verdes en `pricingHorizon.test.ts`.

**Paso 2 · `pickPriceForDate` regla 0 + unit** · S · dep: Paso 1
Escenario: dado pickup más allá del horizonte, `pickPriceForDate`→`undefined` (no legacy, no season-low); dentro del hueco→sigue devolviendo fila (regresión regla 2/3 de PR #308).
Acepta: SCEN-1 y SCEN-2 verdes en `pickPriceForDate.test.ts`.

### Fase 2 — Núcleo (fail-closed en precio)

**Paso 3 · `useCategory` cierra fall-throughs + `isMonthlyPriceUnavailable`** · M · dep: Paso 2
Escenario: reserva mensual con pickup fuera de horizonte → `getTotalPrice`/`getDailyPrice`/`getDailyBasePrice`/`getActualTotalPrice` devuelven `0` explícito en AMBAS variantes (`withTotalCoverage` true/false), nunca caen a matemática diaria ni de Seguro Total; `isMonthlyPriceUnavailable`=true. Se expone en el return block (~L402).
Acepta: SCEN-4 (dos variantes) verde en `useCategory.getTotalPrice.test.ts`; grep de consumidores de `getTotalPrice` sin regresión.

### Fase 3 — Señal server-side

**Paso 4 · `transformers` warning de horizonte + unit** · S · dep: ninguna (paralelizable con Fase 1-2)
Escenario: max `valid_until` global < hoy+60d → `console.warn('[pricing-horizon] …')` con fecha y días; ≥60d → sin warning; fila con `valid_until` NULL/vacío → horizonte infinito, sin warning y sin crash.
Acepta: SCEN-7/8 verdes en `transformers.test.ts` (spy `console.warn`).

### Fase 4 — UI por marca (dos niveles)

**Paso 5 · alquicarros `StepVehicle.vue` + e2e** · M · dep: Paso 3
Mecanismo: `StepVehicle.vue:210` ya llama `pickPriceForDate(row.categoryMonthPrices, fechaRecogida)` en `rowMonthlyBasic`. El tile distingue "indisponible POR horizonte" (vs. otras causas de `Infinity`) con `isBeyondPricingHorizon(row.categoryMonthPrices, fechaRecogida)` per-row — mismo array, sin conflar. Banner de flujo cuando ese predicado es true para TODOS los tiles renderizables.
Escenario: en modo mensual, tile cuya tarifa resulta indisponible POR horizonte muestra "Tarifa no disponible para tu fecha" (no `''` silencioso), CTA deshabilitado; cuando TODAS las categorías exceden → banner "Las tarifas para tu fecha aún no están disponibles. Escríbenos y te cotizamos" + CTA WhatsApp (número desde franchises Supabase); avance de paso bloqueado sin categoría con fila válida.
Acepta: SCEN-5 verde en `e2e/pricing-horizon-alquicarros.spec.ts` (fixture `page.route`, horizonte=hoy+30d, pickup=hoy+60d); SCEN-4b (horizontes divergentes: A bloqueada, B cotiza, sin banner).

**Paso 6 · alquilame `CategorySelectionSection.vue` + component + e2e** · M · dep: Paso 3
Escenario: card individualmente fuera de horizonte → estado inline vía `isMonthlyPriceUnavailable`, sin permitir reservar; banner de flujo solo cuando todas exceden.
Acepta: SCEN-6 verde en `e2e/pricing-horizon-alquilame.spec.ts`; SCEN-4b en `CategorySelectionSection.test.ts` (inline sin banner cuando divergen).

**Paso 7 · alquilatucarro `CategorySelectionSection.vue` (espejo)** · S · dep: Paso 6
Escenario: mismo comportamiento e idéntico texto/CTA que alquilame.
Acepta: paridad verificada; test de componente espejo si aplica.

## Prerrequisitos

- Sin dependencias nuevas. Reutiliza `CategoryMonthPriceData`, patrón WhatsApp-desde-franchises existente, `page.route` para estubar fixtures e2e.
- Reiniciar dev server antes de e2e (packages/logic no recarga fiable en dev — ver memoria `reference_logic_hmr_stale_dev_server`).

## Estrategia de testing

- **Unit** (vitest): Pasos 1-4. Ejecutar por marca con `ionice -c3 nice -n19` para no congelar disco WSL2; delta-vs-baseline, no "verde absoluto".
- **Component** (vitest): SCEN-4b en `CategorySelectionSection.test.ts`.
- **E2E** (Playwright, `./e2e/`): SCEN-5/6, fechas relativas a hoy vía `page.route` (sin date-rot). Un solo spec por marca; correr aislado para evitar timeouts falsos WSL2.
- **Runtime QA**: `/agent-browser` + `/dogfood` sobre el wizard alquicarros y cards alquilame — cero errores de consola, cero requests fallidos.

## Rollout

- Un PR, referencia `#313` **sin** keyword de cierre.
- Verificación por commit vía `/verification-before-completion` (una vez por commit).
- Al cerrar: abrir issue en `rentacar-dashboard` para alerta proactiva de operación (fuera de alcance de este repo).
- Rollback: cambios aditivos y fail-closed; revertir el PR restaura el fallback previo sin migración de datos.

## Riesgos y mitigación

- `getTotalPrice`→0 filtrándose a superficie no auditada: bloqueo por flag (`isMonthlyPriceUnavailable`), no por precio; grep de consumidores en Paso 3.
- Auto-Test [FAIL] tras editar e2e suele ser ruido (ver memoria); confirmar con corrida aislada real.
- Horizontes divergentes entre categorías: cubierto por los dos niveles; SCEN-4b lo fija.
