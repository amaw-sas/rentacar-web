---
name: catalog-pricing
created_by: agent
created_at: 2026-07-16T19:00:00Z
issue: 322
pr_package: 10
---

# Issue 322 · PR10 — Selección de pricing por fecha y catálogo recortado

Holdout para `activePricing[0]` sin criterio y el catálogo maestro completo
embarcado en cada página.

## SCEN-322-K01 — El cargo de Seguro Total se selecciona por fecha de recogida

**Given** una categoría con una fila de `category_pricing` activa aplicable a la fecha de recogida y otra fila legacy inactiva con valores distintos
**When** el server transforma el catálogo
**Then** el cargo de cobertura sale de la fila aplicable por fecha (mismo criterio que `pickPriceForDate`), nunca de `activePricing[0]` por orden indefinido

**Evidence**: unit test de transformers con dos filas y fechas que discriminan.

## SCEN-322-K02 — Sin fila activa aplicable, no se cotiza con tarifa retirada

**Given** una categoría cuyas filas de pricing están todas inactivas
**When** se calcula el cargo de cobertura
**Then** NO se usa la fila inactiva: la cobertura queda sin cotizar de forma visible (omitida/fallo explícito), nunca con una tarifa retirada

**Evidence**: unit test del caso solo-inactivas.

## SCEN-322-K03 — El payload del catálogo no embarca datos que la ruta no consume

**Given** cualquier página del sitio en una marca
**When** se sirve el payload de rentacar-data
**Then** no incluye `franchises` de otras marcas ni `testimonials`/`description` de las 19 ciudades completas — solo lo que la ruta consume
**And** las páginas de ciudad siguen mostrando sus testimonios (sin regresión)

**Evidence**: unit test del server util + medición de tamaño antes/después + tests de las páginas consumidoras verdes.
