---
name: wizard-return-info
created_by: pabloandi
created_at: 2026-07-23T00:00:00Z
---

# Issue #367 — el resumen del wizard de alquicarros debe mostrar la devolución

El resumen persistente del wizard (`WizardSummary.vue`) acompaña al cliente los 5 pasos
hasta "Confirmar reserva", pero solo emite `Duración`, `Recogida` (nombre de sede),
`Desde` (fecha corta), `Vehículo`, `Seguro`, `Kilometraje` y `Adicionales`. Nunca dice
dónde ni cuándo se entrega el carro, ni a qué hora se recoge.

El one-way es alcanzable y además es el default silencioso: `useSearch.ts:230-234`
sincroniza `lugarDevolucion = lugarRecogida` al cambiar la recogida, pero el Searcher
expone un selector de "Lugar de devolución" independiente (`Searcher.vue:46-85`) que el
usuario puede mover. Cuando difiere, `useSearch.ts:180-187` lanza un toast informativo
("Tarifa adicional por traslado") en el momento de buscar — transitorio, muerto tres
pasos antes de confirmar. El resumen no lo repite jamás.

La tarifa de traslado entra sumada al total sin nombrarse: `useCategory.ts:271-275` hace
`getTotalPrice = totalAmount + coverageTotalAmount + returnFee`. La marca hermana sí la
nombra ("Traslado: $ X", `ui-alquilatucarro/app/components/ReservationResume.vue:89-91`).

Todo el estado necesario ya existe en `useStoreReservationForm` (`selectedReturnLocation`,
`humanFormattedReturnDate`, `humanFormattedPickupHour`, `humanFormattedReturnHour`) y en
`useCategory` (`currencyReturnFee`, `hasReturnFee`), y un grep de esos identificadores en
`packages/ui-alquicarros/app` devuelve cero usos.

Este cambio NO desglosa el total línea por línea (Vehículo × N días / Seguro / Adicionales
como sumandos): exigiría exportar computeds nuevos desde `useCategory` — compartido por
las 3 marcas — y en mensual `monthPriceMileage` es un número opaco que ya trae vehículo y
kilometraje dentro, así que las líneas no reconciliarían. Va a issue aparte.

## SCEN-01: el one-way se ve como one-way

**Given**: recogida en una sede de Bogotá y devolución en una sede de Medellín
(`lugarRecogida !== lugarDevolucion`).
**When**: el cliente ve el resumen persistente del wizard.
**Then**: aparece una fila `Devolución` con el nombre de la sede de entrega, acompañada
de una marca visual que la distingue: `otra ciudad` cuando difiere la ciudad de la sede,
`otra sede` cuando es la misma ciudad. El cliente no puede confirmar sin haber visto que
devuelve en otro sitio.
**Evidence**: DOM con `[data-testid="wizard-return-branch"]` y
`[data-testid="wizard-oneway-badge"]`.

## SCEN-02: fecha y hora en ambos extremos del alquiler

**Given**: una reserva con fecha y hora de recogida y de devolución elegidas.
**When**: el cliente ve el resumen.
**Then**: la fila `Recogida` lleva debajo su fecha corta y su hora, y la fila `Devolución`
lleva debajo las suyas, ligadas a `humanFormattedPickupDateShort` /
`humanFormattedPickupHour` y `humanFormattedReturnDateShort` / `humanFormattedReturnHour`.
La antigua fila `Desde` desaparece: la absorbe la sub-línea de `Recogida`.
**Evidence**: DOM del resumen con las cuatro cadenas; source de `WizardSummary.vue` sin
la fila `Desde`.

## SCEN-03: el round-trip no se marca como one-way

**Given**: recogida y devolución en la MISMA sede (`lugarRecogida === lugarDevolucion`,
el default que impone el watcher de `useSearch`).
**When**: el cliente ve el resumen.
**Then**: la fila `Devolución` sigue apareciendo con su fecha y su hora (el cliente
necesita saber cuándo entrega), pero SIN la marca de one-way. La marca solo señala una
diferencia real.
**Evidence**: DOM con `[data-testid="wizard-return-branch"]` presente y
`[data-testid="wizard-oneway-badge"]` ausente.

## SCEN-04: la tarifa de traslado se nombra dentro del Total renta

**Given**: una reserva diaria con `returnFeeAmount > 0` (one-way tarifado por Localiza).
**When**: el cliente ve el desglose de precio del resumen.
**Then**: bajo "Total renta" aparece una sub-línea que nombra el traslado con su importe,
ligada a `currencyReturnFee`. La redacción dice que va INCLUIDO, no que se sume aparte:
`getTotalPrice` ya lo contiene, así que presentarlo como sumando rompería la
reconciliación `Total renta + IVA + Tasa = Total a pagar` que fijó el issue #373.
**Evidence**: DOM con `[data-testid="wizard-return-fee-line"]`; las tres cifras del
desglose siguen reconciliando.

## SCEN-05: sin tarifa de traslado no hay línea de traslado

**Given**: `hasReturnFee()` falso — round-trip, o el fallo pass-through LLNRRE003 donde
Localiza devuelve la tarifa en 0 pese a ser un one-way genuino.
**When**: el cliente ve el desglose.
**Then**: la sub-línea de traslado NO se renderiza. Nunca aparece "incluye traslado $ 0",
que sugeriría un cargo inexistente.
**Evidence**: DOM sin `[data-testid="wizard-return-fee-line"]`.

## SCEN-06: el badge de one-way deriva de las sedes, no de la tarifa

**Given**: un one-way genuino (sedes distintas) cuya `returnFeeAmount` llega en 0 por el
fallo pass-through LLNRRE003.
**When**: el cliente ve el resumen.
**Then**: el badge de one-way SIGUE apareciendo. Atar la marca visual a la tarifa la
haría desaparecer justo en el caso que este issue denuncia: el cliente confirmando sin
saber que devuelve en otra ciudad.
**Evidence**: source de `WizardSummary.vue` (el computed del badge compara
`lugarRecogida` con `lugarDevolucion`, no lee `returnFeeAmount`); DOM con badge presente
y sin línea de traslado.

## SCEN-07: datos incompletos no fabrican filas

**Given**: un deep-link parcial sin sede o sin fecha de devolución — alcanzable porque
`Searcher.vue:527` solo exige `lugar_recogida + fecha_recogida + fecha_devolucion`.
**When**: el cliente ve el resumen.
**Then**: la fila se omite, o muestra `—` en estilo muted. Nunca renderiza `undefined`,
`null` ni una sede inventada, y nunca marca one-way por comparar contra un valor ausente.
**Evidence**: DOM sin literales `undefined`/`null`; badge ausente cuando falta cualquiera
de los dos códigos de sede.

## SCEN-08: el desglose de precio de #373 no regresiona

**Given**: los mismos casos que fijó el issue #373.
**When**: el cliente ve el resumen tras este cambio.
**Then**: "Total a pagar" sigue ligado a `currencyTotalToPayWithAdditionals` (IVA + tasa
incluidos); "IVA + Tasa" sigue oculto en reserva mensual y cuando la brecha es ≤ 0; y más
allá del horizonte de tarifas (`isMonthlyPriceUnavailable`) el total sigue mostrando `—`
sin signo peso, con el CTA bloqueado (regresión #313).
**Evidence**: los cinco casos de `WizardSummary.mount.test.ts` del holdout de #373 siguen
verdes sin modificarse.

## SCEN-09: desktop y móvil muestran lo mismo

**Given**: cualquiera de los casos anteriores.
**When**: el cliente ve el resumen en la tarjeta sticky de escritorio y en la barra
inferior expandible de móvil.
**Then**: las mismas filas (con sus sub-líneas y su badge) y la misma línea de traslado
aparecen en ambas superficies. Ninguna de las dos oculta información que la otra muestra.
**Evidence**: source con un único array `rows` recorrido por los dos bloques; DOM de
ambos viewports en runtime.
