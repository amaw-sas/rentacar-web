---
name: grid-deeplink-money
created_by: agent
created_at: 2026-07-16T13:39:26Z
issue: 322
pr_package: 1
---

# Issue 322 · PR1 — Blindar dinero en el grid (deep-link / Seguro Total / kilometraje)

Holdout para alquilatucarro y alquilame (`CategorySelectionSection` + `CategoryCard`).
alquicarros ya está cubierto por el wizard (`docs/specs/alquicarros-mensualidad/`); su
`CategorySelectionSection` es código muerto en runtime y se alinea solo por paridad.

## Contexto (causa raíz)

Dos fuentes de verdad desincronizadas en el grid, igual que el bug #308 del wizard:

| par | default instancia `useCategory` | default store `reservationForm` | ¿coinciden? |
|---|---|---|---|
| `withTotalCoverage` / `haveTotalInsurance` | `false` | `false` | sí, por coincidencia |
| `withMileage` / `selectedMonthlyMileage` | `"1k_kms"` | `null` | **no** |

`useRecordReservationForm` bifurca con `haveMonthlyReservation && selectedMonthlyMileage`.
Con `null` la reserva mensual cae a la rama regular (Localiza en ceros) → `total_price: 0`
y sin `monthly_mileage`.

Además, el deep-link a una gama **sin stock** (`estimatedTotalAmount === 999999999`)
preselecciona la fila centinela y abre el formulario con cotización basura y
`reference_token` vacío.

El fix `?seguro=total` en la URL solo vive en alquilatucarro; alquilame (y el grid
muerto de alquicarros) pierden Seguro Total al recargar o compartir.

---

## SCEN-322-M01 — Deep-link a gama sin stock no abre el formulario

**Given** disponibilidad con la gama `X` solo como fila unable (`estimatedTotalAmount === 999999999`)
**When** el usuario entra por `/categoria/x` o `?reservar=X` (alquilatucarro / alquilame)
**Then** no se preselecciona esa fila ni se abre el slideover de reserva
**And** la tarjeta "No disponible" permanece en el listado

**Evidence**: no hay `selectedCategory` con el centinela; slideover cerrado; DOM del listado.

## SCEN-322-M02 — Deep-link a gama disponible con reserva mensual fija kilometraje

**Given** búsqueda de 30 días con gama `C` disponible y precios mensuales
**When** el usuario entra por `/categoria/c` o `?reservar=C` y llega al paso de datos
**Then** el store tiene `selectedMonthlyMileage === "1k_kms"` (default de la instancia)
**And** el `POST /api/reservations/record` lleva `monthly_mileage: "1k_kms"` y
`total_price === Math.round(total_price_to_pay / 1.19)` (no 0)

**Este escenario DEBE fallar sin el fix** en alquilatucarro/alquilame.

**Evidence**: intercept del request; store flags antes del submit.

## SCEN-322-M03 — Los flags del form se derivan de la instancia (invariante)

**Given** cualquier ruta de entrada al formulario (click en card, deep-link, recarga F5)
**When** existe `selectedCategory`
**Then** `haveTotalInsurance === !!selectedCategory.withTotalCoverage`
**And** si es mensual: `selectedMonthlyMileage === selectedCategory.withMileage`
**And** si no es mensual: `selectedMonthlyMileage === null`

**Evidence**: un único watcher de derivación en `CategorySelectionSection` (fuente);
payload al enviar.

## SCEN-322-M04 — Seguro Total viaja en la URL (escritura)

**Given** el usuario eligió Seguro Total en una gama y abre el slideover / comparte
**When** se actualiza la URL de categoría o se genera el enlace de compartir
**Then** la URL incluye `seguro=total`
**And** con Seguro Básico el query `seguro` está ausente

Aplica a alquilatucarro, alquilame (y paridad del grid de alquicarros).

**Evidence**: `updateCategoriaUrl` / `getReservationShareUrl` y URL en el navegador.

## SCEN-322-M05 — Seguro Total se restaura desde la URL (lectura)

**Given** un enlace `/categoria/x?seguro=total` (o con `?reservar=x&seguro=total`)
**When** cargan las categorías y se preselecciona la gama disponible
**Then** `selectedCategory.withTotalCoverage === true`
**And** `haveTotalInsurance === true`
**And** el resumen / payload graban `total_insurance: true` (no seguro básico)

**Este escenario DEBE fallar sin el fix** en alquilame.

**Evidence**: store + intercept del POST; DOM del resumen ("Con Seguro total").

## SCEN-322-M06 — Compartir sin Seguro Total no inventa el param

**Given** Seguro Básico seleccionado
**When** el usuario copia o comparte el enlace de la reserva
**Then** la URL compartida no contiene `seguro=total`

**Evidence**: valor devuelto por `getReservationShareUrl`.
