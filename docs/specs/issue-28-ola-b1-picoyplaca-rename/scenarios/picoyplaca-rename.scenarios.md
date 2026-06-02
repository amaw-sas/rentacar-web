---
name: picoyplaca-rename
created_by: pabloandi
created_at: 2026-06-02T19:00:00Z
issue: 28
ola: B1
---

# Ola B1 — renombrar el flag de pico y placa por su semántica real (issue #28, O4)

El flag `useCategory.hasPicoyPlaca()` **miente**: devuelve `true` para las gamas
que muestran el badge **"sin pico y placa"**, es decir las **exentas**. El nombre
afirma lo contrario de lo que hace. Ola B1 lo renombra a `isPicoyPlacaExempt()`
en todo el flujo (10 archivos), sin cambiar comportamiento ni el texto del badge.
El array hardcoded `["FU","FL","GL","LY","LP","LU"]` se mantiene en B1; moverlo al
dashboard es B2.

Refactor puro: las escenas observables del comportamiento previo deben seguir
satisfechas; solo cambia el nombre del identificador.

## SCEN-B1-01: el badge sigue apareciendo en las mismas 6 gamas

**Given**: las gamas exentas FU, FL, GL, LY, LP, LU y una no exenta (C).
**When**: se evalúa el predicado de exención de pico y placa.
**Then**: es `true` para las 6 exentas y `false` para C — idéntico al
comportamiento previo a B1 (issue #93). El texto del badge sigue siendo
"sin pico y placa".
**Evidence**: el whitelist del predicado contiene exactamente FU/FL/GL/LY/LP/LU
y no C (test source-level sobre `isPicoyPlacaExempt`).

## SCEN-B1-02: ningún identificador del flujo afirma lo contrario de lo que hace

**Given**: el código de las 3 marcas + el composable de logic.
**When**: se busca el símbolo `hasPicoyPlaca` en producción.
**Then**: no existe — fue renombrado a `isPicoyPlacaExempt` en el composable
(definición + export) y en sus consumidores (`CategoryTags`, `ReservationResume`,
`CategoryCard` de las 3 marcas). El nombre ahora dice que `true` = exenta.
**Evidence**: `grep -r "hasPicoyPlaca" packages/` (sin tests) → vacío;
`isPicoyPlacaExempt` presente en los 10 archivos.

## Fuera de alcance de B1

- Mover el array al dashboard (`picoyplaca_exempt` columna + backfill + lectura) — B2.
- Cambiar el texto o estilo del badge — no se toca.
