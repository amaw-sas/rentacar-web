---
name: monthly-availability
created_by: pabloandi
created_at: 2026-06-02T16:00:00Z
issue: 28
ola: A
---

# Ola A — Disponibilidad mensual derivada del pricing (issue #28)

Contexto: hoy `useStoreSearchData.ts` decide qué categorías se ofrecen en
reserva mensual con un array hardcoded `noMonthlyCategories = ['FU','FL','GL','LU']`.
El dashboard ya modela "no acepta mensual" como `category_pricing.monthly_*_price = NULL`
(mig. 042), que el transformer expone como `month_prices[].{1k_kms,2k_kms} = 0`.
Ola A reemplaza el array por una derivación del payload: una categoría **ofrece
mensual** cuando el row de pricing aplicable a la fecha de recogida tiene al menos
un precio mensual por kilometraje positivo.

Observable de todos los escenarios: la **lista de `categoryCode`** que aparece en
`useStoreSearchData` (`categoriesAvailabilityData` tras `search()`, o el computed
`categories` en el camino LLNRAG009). El "usuario" es el cliente que arma una
reserva y ve —o no ve— tarjetas de categoría.

Regla anti-reward-hacking para esta ola: ningún identificador del código de
producción puede contener la lista `['FU','FL','GL','LU']`. Si el comportamiento
se logra volviendo a hardcodear esos códigos, la ola NO está satisfecha aunque los
tests pasen. La señal debe venir del dato (`month_prices`), no del código.

---

## SCEN-A01: reserva mensual oculta las categorías sin precio mensual

**Given**: payload admin con 3 categorías — `C` y `LE` con un row de pricing
activo cuyo `1k_kms = 900000` y `2k_kms = 1200000`; `FU` con un row de pricing
activo cuyo `1k_kms = 0` y `2k_kms = 0` (como deja la mig. 042 para las gamas no
mensuales). El cliente eligió reserva mensual (`haveMonthlyReservation = true`) con
fecha de recogida dentro del rango de validez de esos rows.
**When**: se ejecuta `search()` con respuesta de disponibilidad vacía sin error.
**Then**: `categoriesAvailabilityData` contiene `C` y `LE`; **no** contiene `FU`.
**Evidence**: `searchStore.categoriesAvailabilityData.map(c => c.categoryCode)` →
incluye `'C'` y `'LE'`, excluye `'FU'`.

## SCEN-A02: el camino no-mensual pasa el payload sin tocar

**Given**: el cliente NO eligió mensual (`haveMonthlyReservation = false`); la
disponibilidad devuelve `['C','FU','LU']` en ese orden.
**When**: se ejecuta `search()`.
**Then**: `categoriesAvailabilityData` refleja exactamente `['C','FU','LU']` — la
derivación mensual no aplica al flujo diario.
**Evidence**: `searchStore.categoriesAvailabilityData.map(c => c.categoryCode)`
es estrictamente igual a `['C','FU','LU']`.

## SCEN-A03: derivación por dato, no por pertenencia a una lista

**Given**: payload admin con una categoría **nueva** `ZZ` (un código que nunca
estuvo en el array legacy `['FU','FL','GL','LU']`) cuyo único row de pricing activo
tiene `1k_kms = 0` y `2k_kms = 0`, más `C` con pricing mensual positivo. Reserva
mensual, fecha dentro del rango.
**When**: se ejecuta `search()`.
**Then**: `ZZ` queda **excluida** del mensual sin que su código aparezca en ningún
literal del código de producción — prueba que la decisión vino del pricing en cero,
no de una lista. `C` aparece.
**Evidence**: `categoriesAvailabilityData.map(c => c.categoryCode)` excluye `'ZZ'`,
incluye `'C'`; y `grep -r "'FU'.*'FL'.*'GL'.*'LU'" packages/logic/src` no encuentra
un array de exclusión mensual en producción.

## SCEN-A04: LLNRAG009 en mensual no muestra como "no disponible" las categorías sin mensual

**Given**: reserva mensual; la disponibilidad falla con
`no_available_categories_error` (LLNRAG009). Payload admin con `B` y `C` (pricing
mensual positivo) y `FU` (pricing mensual en cero).
**When**: se ejecuta `search()` y se lee el computed `categories`.
**Then**: las tarjetas "no disponible" (`estimatedTotalAmount === 999999999`) son
solo `B` y `C`; `FU` no aparece (preserva issue #54, ahora derivado del dato).
**Evidence**: `searchStore.categories.map(c => c.categoryCode).sort()` es
`['B','C']` y todas tienen `estimatedTotalAmount === 999999999`.

## SCEN-A05: LLNRAG009 en no-mensual sigue mostrando todas las categorías

**Given**: reserva NO mensual; LLNRAG009. Mismo payload (`B`, `C`, `FU`).
**When**: se ejecuta `search()` y se lee `categories`.
**Then**: aparecen las tres como "no disponible" — el flujo diario nunca filtra por
mensual (guarda de regresión de issue #54).
**Evidence**: `searchStore.categories.map(c => c.categoryCode).sort()` es
`['B','C','FU']`.

## SCEN-A06: la disponibilidad mensual respeta la fecha de recogida

**Given**: una categoría `SX` con dos rows de pricing activos: rango A
(`valid_from` 2026-01-01 … `valid_until` 2026-06-30) con `1k_kms = 900000`; rango B
(`valid_from` 2026-07-01 … `valid_until` 2026-12-31) con `1k_kms = 0` y `2k_kms = 0`
(mensual discontinuado ese semestre). Reserva mensual.
**When**: se ejecuta `search()` con fecha de recogida 2026-03-15, y en otra corrida
con fecha 2026-08-15.
**Then**: con recogida en marzo `SX` **aparece** (su row aplicable tiene mensual
positivo); con recogida en agosto `SX` queda **excluida** (su row aplicable tiene
mensual en cero). La decisión usa el mismo row que `pickPriceForDate` selecciona
para mostrar el precio, así nunca se ofrece un mensual a $0.
**Evidence**: dos corridas; `categoriesAvailabilityData.map(c=>c.categoryCode)`
incluye `'SX'` para 2026-03-15 y lo excluye para 2026-08-15.

## SCEN-A08: fecha fuera de todos los rangos no excluye por una fila $0 de fallback

(Añadido tras revisión adversarial — code-reviewer + edge-case-detector hallaron
independientemente este hueco de dinero. Fortalece el holdout, no debilita ningún
SCEN previo.)

**Given**: una categoría `SX` con dos rows de pricing **activos**: rango A
(`valid_from` 2026-01-01 … `valid_until` 2026-06-30) con `1k_kms = 900000`; rango B
(`valid_from` 2026-07-01 … `valid_until` 2026-12-31) con `1k_kms = 0` y `2k_kms = 0`.
La fecha de recogida (p.ej. 2030-01-01) cae **fuera de todos los rangos activos**.
Reserva mensual.
**When**: se ejecuta `search()`.
**Then**: `SX` **sí** se ofrece. Como ningún row activo contiene la fecha, la
decisión no puede confiar en la fila que un fallback elegiría por "más barata"
(la de $0): cae a "¿algún row activo tiene mensual positivo?" → el rango A lo
tiene → se ofrece. Excluirla sería perder un mensual real por un artefacto de
selección de fecha fuera de rango.
**Evidence**: `categoryOffersMonthly([rangoA_900k, rangoB_0], '2030-01-01')` → `true`;
y la categoría aparece en `categoriesAvailabilityData` para una fecha fuera de rango.

## SCEN-A07: sin fecha resoluble, no se excluye una categoría con mensual real

**Given**: una categoría `C` con pricing mensual activo positivo, pero la fecha de
recogida está vacía/no resoluble por `pickPriceForDate` (devuelve `undefined`).
Reserva mensual.
**When**: se ejecuta `search()`.
**Then**: `C` **sí** se ofrece — la red de seguridad cae a "¿algún row activo tiene
mensual positivo?" para no excluir en masa por un dato de fecha ausente. Una
categoría con todos los rows en cero (`FU`) sigue excluida en este mismo caso.
**Evidence**: `categoriesAvailabilityData.map(c=>c.categoryCode)` incluye `'C'` y
excluye `'FU'` cuando `pickPriceForDate` devuelve `undefined`.

---

## Fuera de alcance de Ola A (no fabricar estos escenarios aquí)

- Restricciones geográficas (#3/#4/#5) — Ola C.
- Pico y placa (#2) — Ola B.
- Borrado de los arrays geográficos muertos — Ola D.
- Invalidación de caché del payload (O3) — heredado.
