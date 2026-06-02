---
name: geo-visibility-web
created_by: pabloandi
created_at: 2026-06-02T21:00:00Z
issue: 28
ola: C-web
---

# Ola C-web — leer la visibilidad geográfica del payload (issue #28)

El dashboard ahora marca CX/GY/FU/FL/GL como `restricted` con su whitelist de
ciudades en `category_city_visibility` (Ola C dashboard, rentacar-dashboard#93).
El web pasa a filtrar por ese dato en vez de los 3 arrays hardcoded
(`bogotaBranches`+`onlyBogotaCategories`, CX 7 ciudades, GY 8 ciudades).

**Semántica de rollout (clave):** `vehicle_categories.visibility_mode` NUNCA es
null — es `NOT NULL DEFAULT 'all'` (mig 014). Así que NO se puede usar
"columna ausente → fallback". En su lugar, la visibilidad es la **conjunción**:
`visible = dataAllows AND legacyAllows`. El fallback hardcoded es un constraint
adicional, no un "else": pre-backfill (mode='all') preserva el comportamiento
actual vía `legacyAllows`; post-backfill ambos coinciden; una categoría nueva
marcada `restricted` en el dashboard se filtra por el dato aunque no esté en
ningún array. Ola D elimina el término `legacyAllows`.

La decisión se aísla en el util puro `isCategoryVisibleInCity(visibilityMode,
allowedCities, categoryCode, pickupCity, pickupBranchCode)`.

Observable: `filteredCategories` (las tarjetas que ve el cliente según el lugar
de recogida).

## SCEN-C01: categoría restringida por dato — oculta fuera de sus ciudades

**Given**: una categoría con `visibilityMode='restricted'` y `allowedCities=['bogota']`.
**When**: el cliente elige recogida en `medellin`, y en otra corrida en `bogota`.
**Then**: oculta en medellin, visible en bogota.
**Evidence**: `isCategoryVisibleInCity('restricted', ['bogota'], 'FU', 'medellin', branch)` → `false`;
`isCategoryVisibleInCity('restricted', ['bogota'], 'FU', 'bogota', branch)` → `true`.

## SCEN-C02: transición — pre-backfill (mode='all') preserva el filtro legacy

**Given**: FU aún sin backfill: `visibilityMode='all'`, `allowedCities=[]`, pero su
código sigue en la lista legacy "solo Bogotá".
**When**: el cliente elige una sucursal que NO es de Bogotá.
**Then**: FU queda oculta — el término `legacyAllows` (branch ∈ bogotaBranches)
la filtra aunque el dato diga 'all'. Comportamiento idéntico al actual.
**Evidence**: `isCategoryVisibleInCity('all', [], 'FU', 'medellin', 'AAMDE')` → `false`
(sucursal no-Bogotá); `isCategoryVisibleInCity('all', [], 'FU', 'bogota', 'AABOT')` → `true`.

## SCEN-C03: categoría no restringida ni en legacy — visible en todos lados

**Given**: una categoría `C` con `visibilityMode='all'` y que no está en ningún
array legacy.
**When**: el cliente elige cualquier ciudad.
**Then**: visible.
**Evidence**: `isCategoryVisibleInCity('all', [], 'C', 'pasto', 'AAPAS')` → `true`.

## SCEN-C04: CX/GY conservan sus listas de ciudades (legacy + dato coinciden)

**Given**: CX restringida a 7 ciudades, GY a 8 (incluye soledad).
**When**: recogida en una ciudad fuera de la lista (p.ej. `pasto` para CX),
y dentro (p.ej. `cali`).
**Then**: CX oculta en pasto, visible en cali; GY visible en soledad.
**Evidence**: `isCategoryVisibleInCity('restricted', [7 ciudades], 'CX', 'pasto', b)` → `false`;
`isCategoryVisibleInCity('restricted', [7], 'CX', 'cali', b)` → `true`;
`isCategoryVisibleInCity('restricted', [8 con soledad], 'GY', 'soledad', b)` → `true`.

## SCEN-C05: sin lugar de recogida, no se oculta nada

**Given**: una categoría restringida, pero el cliente aún no eligió lugar de
recogida (`pickupCity` y `pickupBranchCode` ausentes).
**When**: se evalúa la visibilidad.
**Then**: visible — los filtros solo aplican con lugar elegido (guarda actual).
**Evidence**: `isCategoryVisibleInCity('restricted', ['bogota'], 'FU', undefined, undefined)` → `true`.

## Fuera de alcance

- Eliminar los arrays hardcoded (el término `legacyAllows`) — Ola D.
- Granularidad por sucursal (category_branch_visibility) — solo si O1 cambia a branch-level.
