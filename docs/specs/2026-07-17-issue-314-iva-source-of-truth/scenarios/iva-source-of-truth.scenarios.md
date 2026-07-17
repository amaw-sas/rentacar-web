---
name: iva-source-of-truth
created_by: claude
created_at: 2026-07-17T00:00:00Z
---

# Issue #314 — Fuente de verdad del IVA

El IVA (19%) estaba hardcodeado en tres sitios de `packages/logic`. El dashboard
pasa a exponer `IVAFeePercentage` en el payload de disponibilidad; la web lo
consume y cae a una constante documentada `IVA_PERCENTAGE = 19` cuando el campo
no viene. La fuente de verdad es el dashboard.

## SCEN-314-01: el IVA con Seguro Total usa el porcentaje del dashboard

**Given**: un `useCategory` construido con un payload de disponibilidad que trae
`IVAFeePercentage: 21` (subtotal y tasa cualesquiera positivos), con
`withTotalCoverage = true`
**When**: se lee `getIVAFeePrice`
**Then**: el IVA es `round((subtotal + tasa) * 21 / 100)` — usa 21%, no 19%
**Evidence**: valor numérico de `getIVAFeePrice.value` en un test vitest de
`packages/logic`, comparado contra el cálculo con 21%.

## SCEN-314-02: sin el campo, el IVA cae al fallback 19%

**Given**: un `useCategory` construido con un payload SIN `IVAFeePercentage`
(el dashboard aún no lo emite), con `withTotalCoverage = true`
**When**: se lee `getIVAFeePrice`
**Then**: el IVA es `round((subtotal + tasa) * 19 / 100)` — idéntico al
comportamiento actual antes del cambio
**Evidence**: valor numérico de `getIVAFeePrice.value` en vitest, igual al
cálculo con la constante `IVA_PERCENTAGE`.

## SCEN-314-03: un porcentaje 0 del dashboard produce IVA cero

**Given**: un `useCategory` construido con `IVAFeePercentage: 0`, con
`withTotalCoverage = true`
**When**: se lee `getIVAFeePrice`
**Then**: el IVA es `0` — el `?? IVA_PERCENTAGE` no pisa el cero (nullish, no
falsy)
**Evidence**: `getIVAFeePrice.value === 0` en vitest.

## SCEN-314-04: reserva mensual desglosa el precio base con el porcentaje nombrado

**Given**: una reserva mensual con `getActualTotalPrice` conocido (p.ej. 1.190.000)
y sin `IVAFeePercentage` en la categoría (las tarjetas mensuales no vienen del
payload → fallback por construcción)
**When**: se arma el payload de registro en `useRecordReservationForm`
**Then**: `total_price` persistido es `round(total_price_to_pay / (1 + 19/100))`
= `round(1.190.000 / 1.19)` = 1.000.000 — numéricamente idéntico al `/ 1.19`
previo, pero derivado de la constante nombrada, sin literal mágico
**Evidence**: campo `total_price` del `formData` enviado al endpoint de registro,
capturado en vitest (mock de `$fetch`).

## SCEN-314-05: sin Seguro Total el IVA sigue siendo el monto del dashboard

**Given**: un `useCategory` con `IVAFeeAmount` conocido del dashboard (p.ej.
45.000) y `withTotalCoverage = false`
**When**: se lee `getIVAFeePrice`
**Then**: el IVA es exactamente `45.000` — la rama sin Seguro Total no recalcula,
lee el monto del dashboard tal cual (regresión: comportamiento intacto)
**Evidence**: `getIVAFeePrice.value === 45000` en vitest, sin depender de ningún
porcentaje.

## SCEN-314-06: el iva_fee persistido en reserva regular honra el porcentaje

**Given**: una reserva regular (no mensual) con Seguro Total y una categoría con
`IVAFeePercentage: 21`
**When**: se arma el payload de registro en `useRecordReservationForm`
**Then**: el campo `iva_fee` del payload es el IVA recalculado con 21% (el mismo
que `getIVAFeePrice`), probando que el valor *persistido* en el registro de
reserva —no solo el mostrado en pantalla— sale de la fuente correcta
**Evidence**: campo `iva_fee` del `formData` enviado al endpoint de registro,
capturado en vitest, igual al cálculo con 21%.
