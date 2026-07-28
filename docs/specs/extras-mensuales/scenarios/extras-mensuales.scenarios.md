---
name: extras-mensuales
created_by: impl-extras
created_at: 2026-07-27T00:00:00Z
issue: none
---

# Extras en reserva mensual: precio fijo de $100.000 por mes

Pedido de negocio (Diego): en reservas **mensuales**, la silla de bebé y el
conductor adicional cuestan **$100.000 COP fijos por mes cada uno** — precio
final, IVA incluido — en las tres marcas. El flujo **diario** (1–29 días) no
cambia: sigue siendo `días × precio_día`.

Hoy la mensual multiplica por 30 el precio diario: `30 × 12.000 = 360.000` por
cada extra. El cliente mensual está viendo un cargo 3,6× el que la empresa
quiere cobrar.

Fuente del precio: Supabase `rental_companies` (fila `localiza`). Las columnas
nuevas `extra_driver_month_price` / `baby_seat_month_price` viajan por
`rentacarDataFetch` → `transformExtras` → `useFetchRentacarData` → `useCategory`.

Observable: los computeds monetarios de `useCategory` (`getAdditionalsTotal`,
`getTotalToPayWithAdditionals`) y las cadenas `currencyExtraDriverPrice` /
`currencyBabySeatPrice`.

**Alcance real, verificado:** esto mueve una cifra **mostrada**, no una
**cobrada**. `useRecordReservationForm.ts:79-80` persiste los extras como
banderas `1|0`, sin precio; y `total_price_to_pay` (`:100`, `:131`) sale de
`getActualTotalPrice`, que **no** suma `getAdditionalsTotal`. El extra se cobra
en la sede. Por eso los escenarios afirman sobre la pantalla, que es donde este
número vive.

---

## SCEN-X1: mensual + conductor adicional cuesta 100.000, no 360.000

**Given**: una reserva **mensual** (`haveMonthlyReservation = true`, 30 días) y
`rental_companies` con `extra_driver_month_price = 100000` y
`extra_driver_day_price = 12000`
**When**: el cliente marca "conductor adicional"
**Then**: `getExtraDriverPrice` vale exactamente `100000` (no `360000`)
**Evidence**: valor numérico devuelto por el computed en
`packages/logic/src/composables/__tests__/useCategory.monthlyExtras.test.ts`

## SCEN-X2: mensual + silla de bebé cuesta 100.000

**Given**: la misma reserva mensual con `baby_seat_month_price = 100000`
**When**: el cliente marca "silla de bebé"
**Then**: `getBabySeatPrice` vale exactamente `100000`
**Evidence**: valor numérico del computed en el mismo archivo de test

## SCEN-X3: el flujo diario no se mueve

**Given**: una reserva **diaria** de 29 días (`haveMonthlyReservation = false`)
con `extra_driver_day_price = baby_seat_day_price = 12000`
**When**: el cliente marca ambos extras
**Then**: `getExtraDriverPrice` = `348000` y `getBabySeatPrice` = `348000`
(29 × 12.000), sin rastro del precio mensual
**Evidence**: valores numéricos de ambos computeds; el precio mensual configurado
es distinto (100.000) para que un cruce de ramas se note

## SCEN-X4: el total a pagar refleja el precio nuevo

**Given**: la reserva mensual de X1 con conductor adicional marcado
**When**: se lee el total con adicionales
**Then**: `getTotalToPayWithAdditionals` = `getActualTotalPrice + 100000`, es
decir 260.000 menos que con el cálculo viejo
**Evidence**: diferencia numérica entre `getTotalToPayWithAdditionals` y
`getActualTotalPrice`

## SCEN-X8: la migración debe ir ANTES que el despliegue de la web

**Given**: el `select` de `rentacarDataFetch` pide `extra_driver_month_price`
**When**: ese código llega a producción **sin** la migración 109 aplicada
**Then**: PostgREST responde `42703 column does not exist`; `rentacar-data.get.ts`
trata cualquier `companyResult.error` como "sin extras" y devuelve
`extras: undefined`, con lo que **los seis** precios de extras (los dos diarios,
los dos mensuales y los cuatro de lavado) caen a los respaldos del código, sin
excepción ni aviso en logs
**Evidence**: `packages/logic/server/api/rentacar-data.get.ts:80` —
`companyResult.error ? undefined : transformExtras(...)`. Esto es una restricción
de ORDEN DE DESPLIEGUE, no un test: primero la migración, después el deploy.

## SCEN-X5: sin configuración en base de datos, el precio sigue siendo 100.000

**Given**: `useFetchRentacarData` devuelve `extras = null` (la fila `localiza`
no existe o las columnas están en NULL) en una reserva mensual
**When**: el cliente marca ambos extras
**Then**: cada extra cuesta `100000` — el respaldo codificado es el precio
mensual, no `30 × 12000`
**Evidence**: valores de los computeds con `extras: null` y con las columnas
mensuales en `null`

## SCEN-X6: los dos extras juntos en mensual suman 200.000

**Given**: la reserva mensual de X1
**When**: el cliente marca conductor adicional **y** silla de bebé
**Then**: `getAdditionalsTotal` = `200000`
**Evidence**: valor numérico de `getAdditionalsTotal`

## SCEN-X7: la consulta a Supabase trae las columnas nuevas

**Given**: `rentacarDataFetch` consulta `rental_companies` con una lista
explícita de columnas
**When**: se inspecciona el `select` que se envía
**Then**: incluye `extra_driver_month_price` y `baby_seat_month_price` — sin
esto las columnas nunca llegan al navegador y X1/X2 caerían al respaldo sin que
nadie lo note
**Evidence**: cadena del `select` capturada por el mock de Supabase en
`packages/logic/server/utils/__tests__/rentacarDataFetch.monthlyExtras.test.ts`

---

## Rojo-verde exigido

Revertir la rama mensual de `getExtraDriverPrice` a `30 × DAY_PRICE` debe
enrojecer X1 y X4. Revertir la de `getBabySeatPrice`, X2 y X6. Ningún escenario
puede satisfacerse tocando solo texto fuente.
