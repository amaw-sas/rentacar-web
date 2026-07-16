# Tarifas mensuales más allá del horizonte de datos: fail-closed en vez de fallback silencioso

**Date:** 2026-07-16
**Status:** Approved
**Issue:** #313 — [Auditoría][Operación] Cargar tarifas 2027 — sin precios activos tras 31-dic-2026 (fallback silencioso)
**Scope:** `packages/logic` (selección de precio + useCategory + transformers) y un banner por marca. La carga de tarifas 2027 es trabajo de operación, no de este PR.

## Problema

Verificado contra Supabase el 2026-07-16: ninguna fila de `category_pricing` tiene `valid_until` posterior a **2026-12-31**, y ninguna tiene `valid_until` NULL. Desde el 1-ene-2027, `pickPriceForDate` (`packages/logic/src/utils/pickPriceForDate.ts`) no encuentra fila activa que cubra el pickup y cae en silencio a:

- la fila `inactive` (legacy) más cercana en el tiempo (regla 2), o
- la fila activa más barata / season-low (regla 3).

Ese precio no es solo display: `useCategory.getTotalPrice` lo usa para cobrar la reserva mensual. Resultado: cotizaciones 2027 con tarifas 2026 (o legacy) sin ninguna señal de error.

Hay un segundo silencio detrás del primero: cuando `getCategoryMonthPrice()` devuelve `undefined` en reserva mensual, `useCategory.getDailyPrice` cae a la matemática **diaria** (`vehicleDayCharge + coverageUnitCharge`, línea ~147) y `getTotalPrice` cae a `0`. Devolver `undefined` desde la selección sin tocar esas ramas solo cambiaría un precio fabricado por otro.

## Distinción clave: hueco vs. horizonte

El fallback actual es **deliberado** para huecos dentro del horizonte de datos (falta un mes intermedio, fila inactive cercana) — la regla 3 existe para prevenir el bug del $0 (PR #308). Ese comportamiento se conserva.

Lo que cambia es el caso donde el pickup cae **más allá de TODOS los datos** (el caso 2027): ahí no hay ningún respaldo para el precio y fabricarlo es el riesgo que señala la auditoría.

## Decisión (enfoque aprobado: gate en la selección + un estado visible por flujo)

### 1. Contrato de selección — `packages/logic/src/utils`

- Nuevo util `pricingHorizon.ts`:
  - `isBeyondPricingHorizon(prices: CategoryMonthPriceData[], pickupDate: string): boolean` — `true` cuando `pickup > max(end_date)` sobre **todas** las filas, cualquier `status`. `end_date` vacío = +∞ (nunca excedido). Pickup igual al max end **no** está excedido. Pickup *anterior* a todos los datos no cuenta como excedido (lo cubren las reglas existentes). `prices` vacío o `pickupDate` inválido → `false` (el camino `undefined` existente ya lo maneja).
- `pickPriceForDate` gana la regla 0: si `isBeyondPricingHorizon(prices, pickupDate)` → `undefined`. Reglas 1-3 intactas.
- `categoryOffersMonthly` **no cambia**: más allá del horizonte sigue ofreciendo mensual (fail-open en oferta). Si devolviera `false`, las gamas mensuales desaparecerían sin explicación — silencio otra vez. El "porqué" lo da el banner.
- `pickRepresentativeDailyPrice` no cambia (no es temporal por diseño).

### 2. `useCategory` — cerrar los fall-through silenciosos

- Nuevo computed expuesto: `isMonthlyPriceUnavailable` = `haveMonthlyReservation && withMileage && !getCategoryMonthPrice()`.
- Ramas mensuales de `getDailyPrice`, `getDailyBasePrice`, `getTotalPrice`, `getActualTotalPrice`: cuando es reserva mensual y no hay fila, devuelven `0` explícito — **nunca** caen a la matemática diaria. La UI no muestra ese 0: `isMonthlyPriceUnavailable` lo intercepta antes.

### 3. UI — un banner por flujo, reserva bloqueada

Condición del banner (por flujo, no por precio): reserva mensual activa **y** pickup más allá del horizonte global — `max(end_date)` sobre las `categoryMonthPrices` de todas las filas renderizables del flujo.

- **alquicarros** (`wizard/steps/StepVehicle.vue`): banner "Las tarifas para tu fecha aún no están disponibles. Escríbenos y te cotizamos" con CTA WhatsApp; precios mensuales ocultos (`fromPrice` ya degrada a `''` con `Infinity`); avance del wizard bloqueado para mensual.
- **alquilame / alquilatucarro** (`CategorySelectionSection.vue`): mismo banner bajo la misma condición; las cards mensuales no muestran precio ni permiten reservar (gobernadas por `isMonthlyPriceUnavailable`).
- Texto y CTA idénticos entre marcas; número WhatsApp desde franchises de Supabase (patrón existente).
- Reserva **diaria** no se toca: sus precios vienen de disponibilidad Localiza, no de `category_pricing`.

### 4. Señal server-side — `packages/logic/server/utils/transformers.ts`

En `transformCategories`: calcular el max `valid_until` global de todas las filas de pricing; si `< hoy + 60 días` → `console.warn('[pricing-horizon] monthly pricing data ends <fecha> (<N> days away) — load new rates in the dashboard')`. Corre en cada rebuild del cache de rentacar-data; visible en logs de Vercel.

## Escenarios observables

- **SCEN-1 (gate de selección):** Given filas de pricing cuyo max `end_date` es D, When `pickPriceForDate(prices, D+1día)`, Then devuelve `undefined` (no fila legacy, no season-low).
- **SCEN-2 (hueco intacto):** Given filas activas para enero y marzo (hueco en febrero) y una fila inactive, When pickup en febrero, Then el fallback legacy/season-low sigue devolviendo fila (comportamiento actual sin cambio).
- **SCEN-3 (open-ended):** Given una fila con `end_date` vacío, When pickup en cualquier fecha futura, Then nunca se considera excedido el horizonte.
- **SCEN-4 (useCategory fail-closed):** Given reserva mensual con pickup más allá del horizonte, When se leen `getTotalPrice` / `getDailyPrice`, Then devuelven 0 sin caer a la matemática diaria, y `isMonthlyPriceUnavailable` es `true`.
- **SCEN-5 (wizard alquicarros):** Given fixture de pricing con horizonte que termina antes del pickup elegido (fechas relativas a hoy), When el usuario llega a StepVehicle en modo mensual, Then ve el banner, no ve precios mensuales y no puede avanzar.
- **SCEN-6 (cards alquilame/alquilatucarro):** Given la misma fixture, When el usuario busca mensual con ese pickup, Then ve el banner en la sección de categorías y las cards no permiten reservar.
- **SCEN-7 (warning server):** Given datos cuyo max `valid_until` está a menos de 60 días de hoy, When corre `transformCategories`, Then se emite el warning `[pricing-horizon]` con fecha y días restantes.
- **SCEN-8 (sin warning):** Given datos con horizonte a más de 60 días, When corre `transformCategories`, Then no hay warning.

## Fuera de alcance

- **Cargar tarifas 2027** — operación (dashboard/Supabase). El issue #313 queda abierto hasta que ocurra; este PR referencia el issue sin cerrarlo (o lo cierra solo la parte técnica según decida el equipo — ver PR).
- **Alerta proactiva para ops** — issue nuevo en `rentacar-dashboard` (ahí vive operación); se abre al cerrar este trabajo.
- **Pickup 2026 con retorno 2027** — la selección por fecha de pickup es la regla de negocio existente; no cambia.
- **Validación server-side del precio al crear la reserva** — deuda conocida (mismo patrón que #311); anotada, no resuelta aquí.

## Testing

- **Unit** `pricingHorizon` + `pickPriceForDate`: SCEN-1/2/3 + borde pickup == max end (no excedido) + `prices` vacío/fecha inválida.
- **Unit** `useCategory`: SCEN-4.
- **Unit** `transformers`: SCEN-7/8 (spy sobre `console.warn`).
- **E2E** (fixtures estubadas vía `page.route`, horizonte = hoy+30d y pickup = hoy+60d — sin date-rot): SCEN-5 en alquicarros, SCEN-6 en alquilame.

## Riesgos

- El banner depende de que el flujo calcule el horizonte global con los mismos datos que la selección por categoría; si divergen, podría haber card sin precio y sin banner. Mitigación: ambos usan `pricingHorizon.ts` como única fuente.
- `getTotalPrice` devolviendo 0 podría filtrarse a una superficie no auditada. Mitigación: bloqueo de avance/reserva por flag, no por precio; grep de consumidores de `getTotalPrice` en la implementación.
