---
name: dates-tz
created_by: agent
created_at: 2026-07-16T19:00:00Z
issue: 322
pr_package: 7
---

# Issue 322 · PR7 — Correctitud de fechas y zona horaria

Holdout para el bloque G restante: `formatTime` y `useTariffs` dependen del
reloj/TZ del runtime, y el watcher de fecha de recogida destruye la elección
del usuario.

## SCEN-322-T01 — formatTime es estable bajo cualquier TZ del runtime

**Given** un `CalendarDateTime` con hora de pared 08:30 (America/Bogota)
**When** se ejecuta `formatTime()` en un runtime con `TZ=UTC`
**Then** devuelve `08:30` — la hora de pared, sin corrimiento por la TZ del proceso

**Evidence**: unit test que fija `TZ=UTC` (o `process.env.TZ`) y compara con la hora de pared.

## SCEN-322-T02 — useTariffs calcula «hoy» en America/Bogota

**Given** un reloj de runtime en UTC donde son las 04:30 del día D+1 (23:30 del día D en Bogotá)
**When** la página de tarifas resuelve la fecha «hoy»
**Then** usa el día D (fecha Bogotá), no D+1 (fecha UTC)

**Evidence**: unit test del composable con reloj inyectado/mockeado.

## SCEN-322-T03 — Mover la recogida preserva la duración elegida

**Given** el usuario eligió recogida en el día D y devolución en D+5
**When** cambia la recogida a D+2
**Then** la devolución pasa a D+7 (misma duración de 5 días), snapeada a día abierto si aplica
**And** no colapsa a D+3 (+1 default)

**Evidence**: unit test de useSearch que simula la secuencia de cambios.

## SCEN-322-T04 — El default de devolución nunca cae el mismo día de la recogida

**Given** una recogida cuyo día siguiente está cerrado para la sede de devolución
**When** se aplica el default de devolución
**Then** la fecha resultante es estrictamente posterior a la recogida (nunca el mismo día)

**Evidence**: unit test con schedule que cierra el día D+1 y verifica resultado > D.

## SCEN-322-T05 — El +1 sigue aplicando cuando la devolución quedó inválida

**Given** una devolución elegida que queda anterior o igual a la nueva recogida
**When** el usuario mueve la recogida hacia adelante
**Then** la devolución se recalcula (recogida+duración o mínimo recogida+1), nunca queda antes de la recogida

**Evidence**: unit test de la transición inválida.
