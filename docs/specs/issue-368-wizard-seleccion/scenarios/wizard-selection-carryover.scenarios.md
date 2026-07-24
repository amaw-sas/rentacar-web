---
name: wizard-selection-carryover
created_by: orchestrator
created_at: 2026-07-23T00:00:00Z
---

# Continuidad de la selección en el wizard de alquicarros (issue #368, sub-proyecto B1)

Holdout de `docs/specs/2026-07-23-wizard-continuidad-datos-design.md`. Plan de
implementación en `docs/specs/2026-07-23-wizard-continuidad-datos-plan.md`.

Dos defectos observables: cambiar de gama en el Paso 2 reconstruye la instancia de
`useCategory` y pierde Seguro Total, plan de kilometraje y adicionales; y la búsqueda
nueva descarta la selección sin decirlo. Un tercero salió al analizarlos: `withMileage`
arranca en `"1k_kms"` y su único guardián vive dentro de `StepCoverage`, que el stepper
puede saltarse.

Todas las evidencias son de DOM en jsdom, montando el shell real con Pinia real. El
precedente de montaje es `app/components/wizard/__tests__/WizardSummary.mount.test.ts`
(docblock `// @vitest-environment jsdom`), NO `tests/wizard-summary-price.test.ts`, que
es regex sobre fuente.

---

## SCEN-368B1-01: el Seguro Total sobrevive al cambio de gama

**Given**: el Paso 2 con la gama A elegida y Seguro Total activo, en reserva regular,
donde la gama B también cotiza Total.

**When**: el usuario elige la gama B.

**Then**: la fila "Seguro" del resumen sigue diciendo "Seguro Total", y "Total a pagar"
muestra el importe de la gama B, distinto del que mostraba para la gama A.

**Evidence**: DOM — texto de la fila "Seguro" del `<dl>` del resumen, y contenido de
`[data-testid="wizard-total-a-pagar"]` antes y después del cambio.

---

## SCEN-368B1-02: el Seguro Total que no se puede cotizar cae y se anuncia

**Given**: una reserva **regular** en el Paso 2 con Seguro Total activo, donde la gama B
no tiene cargo diario de Total aplicable a la fecha (`canQuoteTotalCoverage` false).

**When**: el usuario elige la gama B.

**Then**: la fila "Seguro" dice "Seguro Básico" y aparece un banner `role="status"` que
nombra la pérdida del Seguro Total.

**Evidence**: DOM — texto de la fila "Seguro", y presencia y texto del elemento con
`role="status"` por encima del bloque de ramas del Paso 2.

---

## SCEN-368B1-03: el plan de kilometraje se corrige sin montar StepCoverage

**Given**: una reserva mensual con la gama A elegida y plan de 2.000 km, con
`maxReachedStep` en 5, y una gama B que solo vende el plan de 1.000 km.

**When**: el usuario elige la gama B y salta por el stepper directamente al Paso 5
("Datos"), sin pasar por el Paso 3.

**Then**: la fila "Kilometraje" del resumen dice "1.000 km" y "Total a pagar" muestra un
importe, no el guion de fail-closed.

**Evidence**: DOM — texto de la fila "Kilometraje" y de
`[data-testid="wizard-total-a-pagar"]`, que no debe ser "—".

---

## SCEN-368B1-04: los adicionales sobreviven siempre

**Given**: el Paso 2 con la gama A elegida y los flags de conductor adicional y lavado
activos.

**When**: el usuario elige la gama B.

**Then**: la fila "Adicionales" del resumen sigue listando "Conductor" y "Lavado".

**Evidence**: DOM — texto de la fila "Adicionales" del resumen.

---

## SCEN-368B1-05: el re-tap de la misma gama sigue sin efecto

**Given**: el Paso 2 con la gama A elegida y Seguro Total activo.

**When**: el usuario toca la card de la gama A otra vez.

**Then**: el resumen no cambia en ninguna fila y no aparece ningún banner
`role="status"`.

**Evidence**: DOM — el `<dl>` del resumen es idéntico antes y después, y no existe
elemento con `role="status"` en el Paso 2.

---

## SCEN-368B1-06: el reset por búsqueda nueva se explica

**Given**: el Paso 2 con un vehículo elegido.

**When**: el usuario cambia una fecha y vuelve a buscar, de modo que la búsqueda se
ejecuta y descarta la selección.

**Then**: la fila "Vehículo" del resumen vuelve a "Elige →" y aparece un banner
`role="status"` que dice que los precios se recalcularon y hay que elegir de nuevo.

**Evidence**: DOM — texto de la fila "Vehículo", y presencia y texto del elemento con
`role="status"`.

---

## SCEN-368B1-07: sin selección previa no hay ruido

**Given**: el Paso 2 sin vehículo elegido.

**When**: el usuario vuelve a buscar.

**Then**: no aparece ningún banner.

**Evidence**: DOM — ausencia de elemento con `role="status"` en el Paso 2.

---

## SCEN-368B1-08: el aviso de reset no sobrevive a la elección

**Given**: el banner de reset visible en el Paso 2.

**When**: el usuario elige un vehículo sin que se pierda nada, avanza al Paso 3 y vuelve
al Paso 2.

**Then**: el banner sigue ausente.

**Evidence**: DOM — ausencia de elemento con `role="status"` tras el viaje de ida y
vuelta. El ida y vuelta es lo que prueba el modelo: sin lógica de limpieza, solo la
escritura de la elección puede haberlo quitado.

---

## SCEN-368B1-09: el aviso de arrastre sí sobrevive al ida y vuelta

**Given**: un banner de arrastre visible tras perder el Seguro Total al cambiar de gama.

**When**: el usuario avanza al Paso 3 y vuelve al Paso 2.

**Then**: el banner sigue visible con el mismo texto.

**Evidence**: DOM — presencia y texto del elemento con `role="status"` tras el viaje.
Contrapunto deliberado de SCEN-368B1-08.

---

## SCEN-368B1-10: el reset se explica también cuando no hay resultados

**Given**: el Paso 2 con un vehículo elegido.

**When**: el usuario vuelve a buscar hacia fechas sin disponibilidad.

**Then**: el estado "Sin vehículos para esta búsqueda" se muestra **con** el banner de
reset visible por encima, no en su lugar.

**Evidence**: DOM — presencia simultánea de `[data-testid="wizard-vehicle-empty-test"]`
y del elemento con `role="status"`.

---

## SCEN-368B1-11: un segundo re-buscar sin nada que descartar no hereda el banner

**Given**: el estado vacío de SCEN-368B1-10, con el banner visible.

**When**: el usuario pulsa "Ajustar búsqueda" y busca de nuevo hacia fechas con
disponibilidad.

**Then**: los tiles se pintan **sin** banner.

**Evidence**: DOM — presencia de tiles de segmento y ausencia de elemento con
`role="status"`.

---

## SCEN-368B1-12: el arrastre no fabrica precio más allá del horizonte

**Given**: una reserva mensual con la gama A elegida, Seguro Total y plan de kilometraje
activos.

**When**: el usuario elige la gama B, cuya fecha de recogida cae más allá del horizonte
de tarifas mensuales.

**Then**: "Total a pagar" muestra "—", el CTA del resumen queda deshabilitado, y la
cadena "$ 0" no aparece en ninguna parte del DOM.

**Evidence**: DOM — contenido de `[data-testid="wizard-total-a-pagar"]`, atributo
`disabled` del CTA de escritorio, y ausencia de "$ 0" en el HTML renderizado. La gama B
se construye con el `useCategory` REAL sobre una fila con `categoryMonthPrices` fuera de
horizonte: con un stub, esta aserción mediría la forma del stub y no
`isMonthlyPriceUnavailable`.
