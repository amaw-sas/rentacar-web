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

Hay un segundo silencio detrás del primero: cuando `getCategoryMonthPrice()` devuelve `undefined` en reserva mensual, las ramas mensuales de `useCategory` caen a matemática ajena al mensual según la cobertura elegida — sin Seguro Total, `getDailyPrice` cae a la matemática **diaria** (`vehicleDayCharge + coverageUnitCharge`, línea ~147) y `getTotalPrice` cae a `0` (línea ~239); con Seguro Total, `getDailyPrice` cae a `vehicleDayCharge + effectiveTotalCoverageUnitCharge` (línea ~133) y `getTotalPrice` a `getSubtotal` (línea ~215) — números fabricados distintos de cero. Devolver `undefined` desde la selección sin tocar esas ramas solo cambiaría un precio fabricado por otro.

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

### 3. UI — dos niveles: estado por card/tile + banner por flujo

El gate de la regla 0 es **por categoría** (cada una tiene sus propias filas) y los horizontes pueden divergir entre categorías. Dos niveles cubren ambos casos sin huecos:

- **Nivel card/tile (siempre):** una categoría individualmente más allá de su horizonte muestra estado inline "Tarifa no disponible para tu fecha" en lugar de precio, y no permite reservar. En alquilame/alquilatucarro lo gobierna `isMonthlyPriceUnavailable` en la card; en el wizard alquicarros, el tile de segmento cuyo precio mensual resulta `Infinity` **por horizonte excedido** muestra la etiqueta en vez del `''` silencioso actual.
- **Nivel flujo (banner):** cuando **todas** las categorías renderizables están más allá de su horizonte (equivalente a `pickup > max(end_date)` global — el caso 2027 con los datos de hoy), aparece además el banner "Las tarifas para tu fecha aún no están disponibles. Escríbenos y te cotizamos" con CTA WhatsApp.

Superficies:

- **alquicarros** (`wizard/steps/StepVehicle.vue`): banner + etiquetas por tile según lo anterior. Bloqueo de avance: el CTA de selección queda deshabilitado para categorías sin tarifa, y el avance de paso en modo mensual exige una categoría seleccionada con fila válida. `StepCoverage.vue` **no cambia**: ya degrada (`mileagePlans → []`, seguro `?? 0`) y es inalcanzable si StepVehicle bloquea.
- **alquilame / alquilatucarro** (`CategorySelectionSection.vue`): banner bajo la condición de flujo; estado inline por card vía `isMonthlyPriceUnavailable`.
- Texto y CTA idénticos entre marcas; número WhatsApp desde franchises de Supabase (patrón existente).
- Reserva **diaria** no se toca: sus precios vienen de disponibilidad Localiza, no de `category_pricing`.

### 4. Señal server-side — `packages/logic/server/utils/transformers.ts`

En `transformCategories`: calcular el max `valid_until` global de todas las filas de pricing; si `< hoy + 60 días` → `console.warn('[pricing-horizon] monthly pricing data ends <fecha> (<N> days away) — load new rates in the dashboard')`. Una fila con `valid_until` NULL/vacío significa horizonte infinito → **nunca** se emite warning (hoy no existen filas así, pero el cálculo no debe avisar en falso ni fallar si aparecen). Corre en cada rebuild del cache de rentacar-data; visible en logs de Vercel.

## Escenarios observables

- **SCEN-1 (gate de selección):** Given filas de pricing todas con `end_date` acotado (ninguna open-ended) y max `end_date` = D, When `pickPriceForDate(prices, D+1día)`, Then devuelve `undefined` (no fila legacy, no season-low).
- **SCEN-2 (hueco intacto):** Given filas activas para enero y marzo (hueco en febrero) y una fila inactive, When pickup en febrero, Then el fallback legacy/season-low sigue devolviendo fila (comportamiento actual sin cambio).
- **SCEN-3 (open-ended):** Given una fila con `end_date` vacío, When pickup en cualquier fecha futura, Then nunca se considera excedido el horizonte.
- **SCEN-4 (useCategory fail-closed):** Given reserva mensual con pickup más allá del horizonte, When se leen `getTotalPrice` / `getDailyPrice` **en ambas variantes de cobertura** (`withTotalCoverage` true y false), Then devuelven 0 sin caer a la matemática diaria ni a la de Seguro Total, y `isMonthlyPriceUnavailable` es `true`.
- **SCEN-4b (horizontes divergentes):** Given categoría A con horizonte vencido para el pickup y categoría B con horizonte vigente, When se renderiza el flujo mensual, Then A muestra "Tarifa no disponible para tu fecha" y no permite reservar, B cotiza normal, y **no** hay banner de flujo.
- **SCEN-5 (wizard alquicarros):** Given fixture de pricing con horizonte que termina antes del pickup elegido (fechas relativas a hoy), When el usuario llega a StepVehicle en modo mensual, Then ve el banner, no ve precios mensuales y no puede avanzar.
- **SCEN-6 (cards alquilame/alquilatucarro):** Given la misma fixture, When el usuario busca mensual con ese pickup, Then ve el banner en la sección de categorías y las cards no permiten reservar.
- **SCEN-7 (warning server):** Given datos cuyo max `valid_until` está a menos de 60 días de hoy, When corre `transformCategories`, Then se emite el warning `[pricing-horizon]` con fecha y días restantes.
- **SCEN-8 (sin warning):** Given datos con horizonte a más de 60 días, When corre `transformCategories`, Then no hay warning.

## Fuera de alcance

- **Cargar tarifas 2027** — operación (dashboard/Supabase). El PR referencia #313 **sin** keyword de cierre: el issue queda abierto hasta que operación cargue los datos.
- **Alerta proactiva para ops** — issue nuevo en `rentacar-dashboard` (ahí vive operación); se abre al cerrar este trabajo.
- **Pickup 2026 con retorno 2027** — la selección por fecha de pickup es la regla de negocio existente; no cambia.
- **Validación server-side del precio al crear la reserva** — deuda conocida (mismo patrón que #311); anotada, no resuelta aquí.

## Testing

- **Unit** `pricingHorizon` + `pickPriceForDate`: SCEN-1/2/3 + borde pickup == max end (no excedido) + `prices` vacío/fecha inválida.
- **Unit** `useCategory`: SCEN-4 (ambas variantes de cobertura).
- **Component/unit** superficies: SCEN-4b (estado por card/tile sin banner cuando los horizontes divergen).
- **Unit** `transformers`: SCEN-7/8 (spy sobre `console.warn`).
- **E2E** (fixtures estubadas vía `page.route`, horizonte = hoy+30d y pickup = hoy+60d — sin date-rot): SCEN-5 en alquicarros, SCEN-6 en alquilame.

## Riesgos

- Horizontes divergentes entre categorías: cubierto por diseño con los dos niveles de la sección 3 (estado inline por card/tile siempre; banner solo cuando todas exceden). SCEN-4b lo verifica.
- `getTotalPrice` devolviendo 0 podría filtrarse a una superficie no auditada. Mitigación: bloqueo de avance/reserva por flag, no por precio; grep de consumidores de `getTotalPrice` en la implementación.
