---
name: pricing-horizon-fail-closed
created_by: pablo
created_at: 2026-07-17T00:00:00Z
---

# Holdout scenarios — issue #313: fail-closed más allá del horizonte de tarifas

Spec: `docs/specs/2026-07-16-issue313-pricing-horizon-fail-closed-design.md`
Plan: `docs/specs/2026-07-16-issue313-pricing-horizon-fail-closed-plan.md`

## SCEN-1: gate de selección devuelve undefined más allá del horizonte
**Given**: filas de `category_pricing` todas con `end_date` acotado (ninguna open-ended), con max `end_date` = D
**When**: se llama `pickPriceForDate(prices, D+1día)`
**Then**: devuelve `undefined` — no cae a fila legacy (regla 2) ni season-low (regla 3)
**Evidence**: valor de retorno de `pickPriceForDate` en unit test `pickPriceForDate.test.ts`

## SCEN-2: el hueco dentro del horizonte sigue intacto
**Given**: filas activas para enero y marzo (hueco en febrero) más una fila inactive, todas dentro del horizonte
**When**: pickup cae en febrero
**Then**: el fallback legacy/season-low sigue devolviendo una fila (comportamiento previo de PR #308 sin cambio)
**Evidence**: valor de retorno no-undefined de `pickPriceForDate` en `pickPriceForDate.test.ts`

## SCEN-3: fila open-ended nunca se considera excedida
**Given**: al menos una fila con `end_date` vacío (`''`)
**When**: pickup en cualquier fecha futura
**Then**: `isBeyondPricingHorizon(prices, pickup)` es `false` (horizonte infinito)
**Evidence**: valor booleano de `isBeyondPricingHorizon` en `pricingHorizon.test.ts`; bordes: `prices` vacío→false, fecha inválida→false, pickup==max end→false, pickup anterior a todo el dato→false

## SCEN-4: useCategory fail-closed en ambas variantes de cobertura
**Given**: reserva mensual (`haveMonthlyReservation && withMileage`) con pickup más allá del horizonte, para `withTotalCoverage` = true y = false
**When**: se leen `getTotalPrice()` y `getDailyPrice()`
**Then**: ambos devuelven `0` explícito — nunca caen a la matemática diaria ni a la de Seguro Total; y `isMonthlyPriceUnavailable` es `true`
**Evidence**: valores de retorno de `getTotalPrice`/`getDailyPrice` y de `isMonthlyPriceUnavailable` en `useCategory.getTotalPrice.test.ts`

## SCEN-4b: horizontes divergentes entre categorías (estado inline, sin banner)
**Given**: categoría A con horizonte vencido para el pickup y categoría B con horizonte vigente
**When**: se renderiza el flujo mensual (card/section)
**Then**: A muestra "Tarifa no disponible para tu fecha" y no permite reservar; B cotiza normal; y NO aparece el banner de flujo
**Evidence**: DOM del componente `CategorySelectionSection.test.ts` — presencia del texto inline en card A, ausencia del banner de flujo, card B con precio

## SCEN-5: wizard alquicarros bloquea reserva mensual sin tarifa
**Given**: fixture de pricing cuyo horizonte termina antes del pickup elegido (fechas relativas a hoy: horizonte = hoy+30d, pickup = hoy+60d)
**When**: el usuario llega a StepVehicle en modo mensual
**Then**: ve el banner "Las tarifas para tu fecha aún no están disponibles. Escríbenos y te cotizamos" con CTA WhatsApp, NO ve precios mensuales por tile, y NO puede avanzar de paso
**Evidence**: DOM/estado en e2e `e2e/pricing-horizon-alquicarros.spec.ts` — banner visible, ausencia de precio en tiles, botón de avance deshabilitado

## SCEN-6: cards alquilame/alquilatucarro bloquean reserva mensual sin tarifa
**Given**: la misma fixture de horizonte vencido para el pickup
**When**: el usuario busca mensual con ese pickup
**Then**: ve el banner en la sección de categorías y las cards no permiten reservar
**Evidence**: DOM en e2e `e2e/pricing-horizon-alquilame.spec.ts` — banner visible, cards sin CTA de reserva activo

## SCEN-7: warning server-side cuando el horizonte está cerca
**Given**: datos cuyo max `valid_until` está a menos de 60 días de hoy
**When**: corre `transformCategories`
**Then**: se emite `console.warn('[pricing-horizon] ...')` con la fecha del horizonte y los días restantes
**Evidence**: spy sobre `console.warn` en `transformers.test.ts` — llamada con substring `[pricing-horizon]`

## SCEN-8: sin warning cuando el horizonte está lejos (o es infinito)
**Given**: datos con max `valid_until` a más de 60 días, o con alguna fila `valid_until` NULL/vacío (horizonte infinito)
**When**: corre `transformCategories`
**Then**: no se emite ningún warning `[pricing-horizon]` y no ocurre crash
**Evidence**: spy sobre `console.warn` en `transformers.test.ts` — cero llamadas con substring `[pricing-horizon]`
