---
name: monthly-discount-badge
created_by: pabloandi
created_at: 2026-06-02T18:00:00Z
issue: none
---

# Bug — badge "Dto Hoy" muestra "NaN %" en reserva mensual

Reportado por operaciones: en el **Resumen de Reserva** (`ReservationResume.vue`),
sección "Tarifa Diaria", el badge `Dto Hoy {{ getDiscount }} %` aparece como
**"Dto Hoy NaN %"** cuando la reserva es mensual. Con mensualidad no debe salir el
texto de descuento.

Causa raíz (verificada): el badge en `ReservationResume.vue` se renderiza **sin
guarda** — a diferencia de su hermano (el precio tachado, gated por
`v-if="hasDiscount()"`) y de su equivalente en `CategoryCard.vue:67` (gated). En
mensualidad el objeto de disponibilidad trae `vehicleDayCharge = 0` y
`coverageUnitCharge = 0` (el precio real vive en `month_prices`), así que
`getDiscount` calcula `100 * ((0 - 0) / |0|) = NaN`. El descuento "Dto Hoy" es un
concepto de tarifa **diaria**; no aplica a la mensual.

Observable: el texto renderizado del Resumen de Reserva, y la estructura del
template (la guarda existe en las 3 marcas).

---

## SCEN-D01: reserva mensual no muestra el badge de descuento

**Given**: un cliente con una reserva **mensual** (`haveMonthlyReservation = true`),
cuya categoría tiene `vehicleDayCharge = 0` y `coverageUnitCharge = 0` (forma del
objeto de disponibilidad mensual).
**When**: se renderiza el Resumen de Reserva (`ReservationResume.vue`).
**Then**: **no** aparece el badge "Dto Hoy …%". En particular, nunca se muestra
"Dto Hoy NaN %".
**Evidence**: el DOM del Resumen de Reserva no contiene el texto "Dto Hoy" en
modo mensual (validación en navegador / e2e); y el badge en los 3
`ReservationResume.vue` está gated por `hasDiscount()` (estructura del template),
predicado que es `false` en mensual.

## SCEN-D02: con descuento diario real, el badge aparece con su porcentaje

**Given**: una reserva **diaria** con un descuento real
(`discountAmount > 0` tal que `hasDiscount()` es `true`).
**When**: se renderiza el Resumen de Reserva.
**Then**: el badge aparece como "Dto Hoy N %" con un porcentaje finito (p.ej.
"Dto Hoy 15 %"), nunca "NaN", y junto al precio base tachado.
**Evidence**: el badge y el precio tachado comparten la misma condición
`hasDiscount()`; el porcentaje es un número finito formateado.

## SCEN-D03: getDiscount nunca produce el texto "NaN"

**Given**: una categoría cuyo `vehicleDayCharge` y `coverageUnitCharge` son ambos
0 (base nula — el caso mensual que disparaba el bug).
**When**: se evalúa `getDiscount`.
**Then**: devuelve un texto numérico finito ("0"), nunca "NaN" — una función de
presentación no debe emitir "NaN" aunque se la invoque con base nula.
**Evidence**: `getDiscount` con base 0 → string que no contiene "NaN"; defensa en
profundidad además de la guarda del template.

---

## Fuera de alcance

- `CategoryCard.vue` ya gatea el badge correctamente (`v-if="hasDiscount()"`, línea
  67) — no se toca.
- La lógica de cálculo de descuento diario para reservas con descuento real no
  cambia; solo se evita el NaN y se oculta el badge cuando no hay descuento.
