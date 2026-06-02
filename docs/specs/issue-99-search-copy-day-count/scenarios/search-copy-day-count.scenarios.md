---
name: search-copy-day-count
created_by: claude
created_at: 2026-06-02T00:00:00Z
issue: 99
---

# Conteo de días del alquiler (copia de búsqueda)

`selectedDays` (store `useStoreReservationForm`) cuenta los días facturables del
alquiler y alimenta el texto de la función de copia (icono de pin), la detección
de reserva mensual (`== 30`) y el registro analítico. El precio al cliente lo
calcula el backend desde `pickupDateTime`/`returnDateTime`, no desde este valor.

Regla de negocio: se factura cada bloque de 24 h completo más un día extra
cuando la sobra supera una ventana de gracia de 4 h. Toda duración positiva
factura al menos 1 día.

## SCEN-001: devolución más temprana en el día, < 24 h (bug reportado)
**Given**: recogida 3 jun 2026 12:00 p. m., devolución 4 jun 2026 5:00 a. m. (17 h reales)
**When**: se calcula `selectedDays`
**Then**: el valor es `1` (no `2`); el texto de copia muestra `🗓 1 día`
**Evidence**: valor retornado por `rentalDayCount`; línea del mensaje de `buildWhatsappMessage`

## SCEN-002: exactamente 24 h
**Given**: recogida 3 jun 2026 12:00 p. m., devolución 4 jun 2026 12:00 p. m.
**When**: se calcula `selectedDays`
**Then**: el valor es `1`
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-003: 29 h, sobra supera la gracia
**Given**: recogida 3 jun 2026 12:00 p. m., devolución 4 jun 2026 5:00 p. m. (29 h)
**When**: se calcula `selectedDays`
**Then**: el valor es `2`
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-004: mismo día, varias horas
**Given**: recogida 3 jun 2026 8:00 a. m., devolución 3 jun 2026 5:00 p. m. (9 h)
**When**: se calcula `selectedDays`
**Then**: el valor es `1`
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-005: mismo día, pocas horas (mínimo 1 día)
**Given**: recogida 3 jun 2026 8:00 a. m., devolución 3 jun 2026 10:00 a. m. (2 h)
**When**: se calcula `selectedDays`
**Then**: el valor es `1`
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-006: sobra exactamente en el límite de gracia (28 h)
**Given**: recogida 3 jun 2026 12:00 p. m., devolución 4 jun 2026 4:00 p. m. (28 h, sobra = 4 h)
**When**: se calcula `selectedDays`
**Then**: el valor es `1` (la gracia es estrictamente `> 4 h`)
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-007: reserva mensual de 30 días preservada
**Given**: recogida 1 jun 2026 12:00 p. m., devolución 1 jul 2026 12:00 p. m. (30×24 h)
**When**: se calcula `selectedDays`
**Then**: el valor es `30` (la detección mensual `selectedDays == 30` sigue funcionando)
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-008: devolución no posterior a la recogida
**Given**: recogida y devolución idénticas (0 h), o devolución anterior a recogida
**When**: se calcula `selectedDays`
**Then**: el valor es `0` (no hay alquiler)
**Evidence**: valor retornado por `rentalDayCount`

## SCEN-009: singular vs plural en el texto de copia
**Given**: `selectedDays` es `1`, luego `2`
**When**: `buildWhatsappMessage` arma la línea de días
**Then**: muestra `🗓 1 día` (singular) y `🗓 2 días` (plural) respectivamente
**Evidence**: línea del mensaje de `buildWhatsappMessage` (regresión ya cubierta por S5)
