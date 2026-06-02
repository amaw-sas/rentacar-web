---
name: picoyplaca-web
created_by: pabloandi
created_at: 2026-06-02T20:00:00Z
issue: 28
ola: B2-web
---

# Ola B2-web — leer la exención de pico y placa del payload (issue #28)

El dashboard ahora expone `vehicle_categories.picoyplaca_exempt` (Ola B2 dashboard,
rentacar-dashboard#92). El web pasa a leer ese flag en vez de la lista hardcoded
`['FU','FL','GL','LY','LP','LU']`. Estrategia de rollout: **fallback transicional**
— la columna manda; si la categoría no la trae (columna aún no aplicada/backfilleada
en la Supabase que lee el web), cae al array. El array se borra en Ola D.

La decisión se aísla en un util puro `resolvePicoyPlacaExempt(flag, code)`; el flag
se threadea por `transformer → CategoryData → CategoryAvailabilityData → useCategory`.

Observable: `isPicoyPlacaExempt()` (que renderiza el badge "sin pico y placa").

## SCEN-B2-01: la columna manda — una gama marcada exenta muestra el badge aunque no esté en el array

**Given**: una categoría con `picoyplacaExempt = true` proveniente de la columna,
cuyo código NO está en la lista hardcoded (p.ej. un código nuevo `ZZ`).
**When**: se evalúa la exención.
**Then**: es exenta (`true`) — la decisión vino del dato, no de la lista.
**Evidence**: `resolvePicoyPlacaExempt(true, 'ZZ')` → `true`.

## SCEN-B2-02: la columna manda — una gama marcada NO exenta no muestra el badge aunque esté en el array

**Given**: una categoría con `picoyplacaExempt = false` desde la columna, cuyo
código SÍ está en el array hardcoded (p.ej. `FU`).
**When**: se evalúa la exención.
**Then**: NO es exenta (`false`) — la columna sobreescribe al array legacy.
**Evidence**: `resolvePicoyPlacaExempt(false, 'FU')` → `false`.

## SCEN-B2-03: fallback transicional — sin columna, usa el array hardcoded (preserva hoy)

**Given**: una categoría con `picoyplacaExempt = null` (columna ausente, antes del
backfill).
**When**: se evalúa la exención.
**Then**: cae al array — FU/FL/GL/LY/LP/LU exentas (incluye LU, issue #93), C no.
Comportamiento idéntico al actual mientras la columna no esté poblada.
**Evidence**: `resolvePicoyPlacaExempt(null, 'LU')` → `true`;
`resolvePicoyPlacaExempt(null, 'FU')` → `true`; `resolvePicoyPlacaExempt(null, 'C')` → `false`.

## Fuera de alcance

- Borrar el array de fallback — Ola D (cuando la columna esté backfilleada en prod).
- Restricciones geográficas / mensual — otras olas.
