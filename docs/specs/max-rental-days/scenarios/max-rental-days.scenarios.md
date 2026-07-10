---
name: max-rental-days
created_by: pabloandi
created_at: 2026-07-10T00:00:00Z
---

# Tope duro de 30 días de alquiler

Regla de negocio confirmada: **un alquiler no puede superar 30 días facturables**
(`selectedDays` = `rentalDayCount`, que suma un día extra cuando el sobrante pasa
`GRACE_HOURS = 4`).

Hoy la regla vive solo en el `:max-value` del calendario de devolución
(`useStoreReservationForm.ts:248`). Una ruta hidratada la ignora, y la hora de
devolución puede empujar el conteo por encima del tope aun dentro del calendario.

Decisiones que estos escenarios codifican:

- Si el rango excede 30 días facturables, la web **recorta en silencio** y cotiza.
- Mensualidad ⇔ `selectedDays === 30`, y **una mensualidad no lleva horas extras**:
  la hora de devolución nunca es posterior a la de recogida.

Marca de referencia para las URLs: alquicarros (`/reservas/...`). Las mismas ventanas
aplican a alquilame (`/reservas/...`) y alquilatucarro (`/[city]/buscar-vehiculos/...`).
Sede: `bogota-aeropuerto` (código `AABOT`). Recogida siempre `2026-08-15 12:00pm`.

---

## SCEN-MRD-01: una URL de 31 días se cotiza como 30

**Given**: un visitante abre un enlace cuya devolución es `2026-09-15` (31 días de calendario)
**When**: la página de resultados hidrata la búsqueda desde la ruta y consulta disponibilidad
**Then**: el resumen muestra `30 días`, la devolución es `2026-09-14` a las `12:00pm`, y el
POST a `/api/reservations/availability` viaja con la ventana recortada
**Evidence**: texto del `aside` («Duración 30 días») + cuerpo del request interceptado

## SCEN-MRD-02: el recorte no depende del exceso

**Given**: un enlace cuya devolución es `2026-09-29` (45 días de calendario)
**When**: la página hidrata la búsqueda
**Then**: el resumen muestra `30 días` — el mismo resultado que SCEN-MRD-01
**Evidence**: texto del `aside`

## SCEN-MRD-03: la hora de devolución no puede empujar el conteo (red-green)

**Given**: un enlace con devolución `2026-09-14` (la fecha tope) a las `05:00pm`, recogida `12:00pm`
**When**: la página hidrata la búsqueda
**Then**: el resumen muestra `30 días` y la hora de devolución mostrada es `12:00pm`
**Evidence**: texto del `aside` + valor del select de hora de devolución

Hoy este escenario **falla**: el resumen muestra `31 días`. Es el repro RED.
La causa: `returnHourOptions` (`useSearch.ts:384`) solo recorta las horas
`if (selectedDays === 30)`, y `05:00pm` hace que el conteo sea 31, apagando la condición.

## SCEN-MRD-04: la mensualidad legítima no se toca

**Given**: un enlace de `2026-08-15 12:00pm` → `2026-09-14 12:00pm` (30 días exactos)
**When**: la página hidrata la búsqueda y el visitante elige la gama C
**Then**: el resumen muestra `30 días`, el Paso 3 se llama «Seguro y km», el bloque de
kilometraje ofrece `1.000 km` y `2.000 km`, y el total de la gama C es `$ 3.806.000`
**Evidence**: DOM del stepper, del bloque de kilometraje y del `aside`

## SCEN-MRD-05: un alquiler regular no se recorta

**Given**: un enlace de `2026-08-15 12:00pm` → `2026-09-13 12:00pm` (29 días)
**When**: la página hidrata la búsqueda
**Then**: el resumen muestra `29 días`, el Paso 3 se llama «Seguro» y no hay bloque de
kilometraje; las fechas no se modifican
**Evidence**: DOM del stepper + texto del `aside`

## SCEN-MRD-06: el recorte retrocede a un día abierto, nunca avanza

**Given**: una sede de devolución que cierra el día `pickup + 30`
**When**: una URL pide más de 30 días y la web recorta la devolución
**Then**: la devolución cae en el último día **abierto en o antes** de `pickup + 30`;
el resultado nunca supera los 30 días facturables
**Evidence**: fecha de devolución en el `aside` + `rentalDayCount` derivado ≤ 30

## SCEN-MRD-07: el buscador no ofrece horas que rompan el tope

**Given**: el buscador con 30 días seleccionados y recogida a las `12:00pm`
**When**: el visitante despliega el select de hora de devolución
**Then**: ninguna opción es posterior a `12:00pm`
**Evidence**: opciones renderizadas del select

## SCEN-MRD-08: el cambio no toca las marcas

**Given**: la rama de este trabajo
**When**: se compara con `origin/main`
**Then**: `git diff --name-only origin/main` solo lista rutas bajo `packages/logic/`,
`e2e/` y `docs/`; cero cambios en `packages/ui-alquilatucarro/`, `packages/ui-alquilame/`
y `packages/ui-alquicarros/`
**Evidence**: salida de `git diff --name-only origin/main`
