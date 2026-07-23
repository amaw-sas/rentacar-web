---
name: wizard-price-breakdown
created_by: pabloandi
created_at: 2026-07-23T00:00:00Z
---

# Issue #373 — el precio mostrado en el wizard de alquicarros debe ser el que se registra

El resumen del wizard (`WizardSummary.vue`) mostraba como "Total" el `getTotalPrice`
(renta SIN IVA ni tasa administrativa), mientras el payload a
`/api/reservations/record` registra `getActualTotalPrice` (CON IVA + tasa). En una
reserva diaria eso deja al cliente aprobando un precio ~31% menor al que se le
cobra. En mensual coincide porque el catálogo mensual ya trae el IVA embebido.

La marca hermana (`ui-alquilatucarro/ReservationResume.vue`) ya desglosa las tres
cifras: "Total renta" (sin IVA/tasa) + "IVA + Tasa" + "Total a pagar" (con todo).
Este cambio lleva ese mismo desglose al wizard de alquicarros.

Todos los computeds necesarios ya existen en `useCategory` y viajan vivos en el
objeto `selectedCategory` del store: `currencyTotalToPayWithAdditionals`,
`currencyIvaAndTax`, `currencyTotalWithAdditionals`, `hasAdditionalServices`.

## SCEN-01: el total prominente en reserva diaria refleja lo que se cobra

**Given**: reserva DIARIA de Gama C (ej. `AVD5YCWXP`), con `getTotalPrice` = $881.797
(renta sin IVA/tasa) y `getActualTotalPrice` = $1.154.272,73 (lo que va al payload).
**When**: el cliente ve el resumen persistente del wizard (`WizardSummary.vue`).
**Then**: la cifra prominente etiquetada "Total a pagar" se vincula a
`currencyTotalToPayWithAdditionals` (IVA + tasa incluidos), NO a `getTotalPrice`.
El valor mostrado ya no difiere ~31% de `total_price_to_pay`.
**Evidence**: source de `WizardSummary.vue` (binding a `currencyTotalToPayWithAdditionals`);
DOM renderizado del total prominente en runtime.

## SCEN-02: la reserva diaria desglosa "IVA + Tasa" como línea explícita

**Given**: misma reserva diaria.
**When**: el cliente ve el resumen.
**Then**: aparece una línea "IVA + Tasa" vinculada a `currencyIvaAndTax`,
posicionada por encima del total prominente. El cliente entiende de dónde sale
la diferencia entre la renta y el total a pagar.
**Evidence**: DOM con `data-testid="wizard-iva-tax-line"`; orden en source (línea
IVA antes que el total a pagar).

## SCEN-03: las tres cifras reconcilian (renta + IVA/tasa = total a pagar)

**Given**: reserva diaria, sin adicionales: renta $881.797, IVA+tasa $272.476.
Con conductor adicional (+$84.000): renta $965.797.
**When**: se leen las tres cifras del resumen.
**Then**: `Total renta` + `IVA + Tasa` = `Total a pagar`.
Sin adicionales: 881.797 + 272.476 = 1.154.273.
Con conductor: 965.797 + 272.476 = 1.238.273 (el adicional entra en renta Y en el
total a pagar; el IVA+tasa no cambia por el adicional, que no tributa en este modelo).
**Evidence**: valores computados de `useCategory` (`getTotalWithAdditionals +
getIvaAndTaxAmount === getTotalToPayWithAdditionals`); DOM en runtime.

## SCEN-04: en reserva mensual no se muestra la línea "IVA + Tasa"

**Given**: reserva MENSUAL (el precio del catálogo ya incluye IVA, así que
`getIvaAndTaxAmount` = 0 y `getTotalPrice` == `getActualTotalPrice`).
**When**: el cliente ve el resumen.
**Then**: NO aparece la línea "IVA + Tasa" (evita mostrar "$0" o sugerir un cargo
extra inexistente). El total prominente conserva su valor mensual (con leyenda
"Incluye IVA y tasa").
**Evidence**: source con `v-if="!haveMonthlyReservation"` sobre la línea IVA;
DOM en runtime mensual sin la línea.

## SCEN-05: más allá del horizonte de tarifas sigue fail-closed (regresión #313)

**Given**: reserva cuyo pickup cae más allá del horizonte de datos
(`isMonthlyPriceUnavailable` = true), donde los totales son 0.
**When**: el cliente ve el resumen.
**Then**: el total muestra "—" (no un total fabricado de $0), igual que antes del
cambio. El CTA sigue bloqueado.
**Evidence**: source (`totalLabel` devuelve null cuando `isMonthlyPriceUnavailable`);
DOM mostrando "—".
