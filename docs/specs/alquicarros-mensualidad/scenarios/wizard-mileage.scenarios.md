# alquicarros — kilometraje mensual en el wizard (holdout)

Escenarios observables definidos ANTES de la implementación. Ninguno se debilita para
que pase el código: si un escenario no se satisface, se corrige el código.

## Contexto

El wizard de 5 pasos (PR #294) reemplazó `CategorySelectionSection → CategoryCard` pero no portó
el selector de kilometraje. Dos fuentes de verdad quedan desincronizadas:

| par | default instancia `useCategory` | default store `reservationForm` | ¿coinciden? |
|---|---|---|---|
| `withTotalCoverage` / `haveTotalInsurance` | `false` | `false` | sí, por coincidencia |
| `withMileage` / `selectedMonthlyMileage` | `"1k_kms"` | `null` | **no** |

`useRecordReservationForm.ts:94` bifurca con `haveMonthlyReservation && selectedMonthlyMileage`.
Con `null` toda reserva mensual cae a la rama regular, cuyos insumos de Localiza están en cero
(`useStoreSearchData.ts:268-290`, LLNRAG009 para ventanas >= 30 días).

---

## SCEN-ACM-01 — El bloque de kilometraje aparece solo en reserva mensual

**Given** el wizard de `/reservas` con disponibilidad cargada
**When** la búsqueda abarca exactamente 30 días y el usuario llega al Paso 3
**Then** se renderiza un bloque «Kilometraje» con `1.000 km` preseleccionado
**And** con una búsqueda de 29 días el bloque no existe en el DOM

Evidence: DOM del Paso 3 en ambas búsquedas.

## SCEN-ACM-02 — Solo se ofertan los planes vendibles

**Given** el bloque de kilometraje visible
**When** la fila de precios que aplica a la fecha de recogida tiene `2k_kms > 0`
**Then** se oferta `2.000 km`
**And** si `2k_kms <= 0` esa opción no se renderiza
**And** `3.000 km` no se renderiza nunca (no es vendible en ninguna marca)

Evidence: DOM contra la fila devuelta por `pickPriceForDate`.

## SCEN-ACM-03 — Elegir un plan recalcula el precio mostrado

**Given** una reserva mensual con `1.000 km` seleccionado
**When** el usuario elige `2.000 km`
**Then** el total del sidebar y el de `WizardSummary` pasan al precio `2k_kms`
**And** ese precio sale de la misma fila que `pickPriceForDate` selecciona para el cobro

Evidence: DOM antes/después.

## SCEN-ACM-04 — El payload de una reserva mensual es correcto (red-green)

**Given** una reserva mensual con `2.000 km` y datos personales completos
**When** el usuario envía el formulario
**Then** el `POST /api/reservations/record` lleva `monthly_mileage: "2k_kms"`
**And** `total_price === Math.round(total_price_to_pay / 1.19)`
**And** `tax_fee === 0`, `iva_fee === 0`, `coverage_days === 0`

**Este escenario DEBE fallar sin el fix**: hoy el payload no lleva `monthly_mileage`
y `total_price` es `0`. Verificar el rojo antes de implementar.

Evidence: intercept del request.

## SCEN-ACM-05 — La reserva no mensual no cambia

**Given** una búsqueda de menos de 30 días
**When** el usuario envía el formulario
**Then** `selectedMonthlyMileage` es `null` y el payload conserva `tax_fee`, `iva_fee` y
`extra_hours` calculados por la rama regular

Evidence: intercept del request.

## SCEN-ACM-06 — Los flags del form siempre reflejan la instancia (invariante)

**Given** cualquier ruta de entrada al Paso 5
**When** el usuario envía el formulario
**Then** `haveTotalInsurance === selectedCategory.withTotalCoverage`
**And** `selectedMonthlyMileage === selectedCategory.withMileage`, o `null` si no es mensual

Rutas a cubrir: click paso a paso, deep-link `/categoria/X`, deep-link `?paso=datos`, recarga F5.

Evidence: lo que muestra `WizardSummary` contra lo que viaja en el payload.

## SCEN-ACM-07 — Re-elegir la misma gama no pierde la selección

**Given** una gama elegida con Seguro Total y adicionales
**When** el usuario vuelve al Paso 2 y toca la misma gama
**Then** seguro, kilometraje y adicionales se conservan
**And** al tocar una gama distinta todo vuelve a los valores por defecto

Evidence: DOM del Paso 3 y del resumen.

> **NO VERIFICADO EN RUNTIME LOCAL (2026-07-09).** El Paso 2 no renderiza cards en dev:
> `StepVehicle` destructura `useFetchRentacarData()` en `setup`, y si `useState('rentacar-data')`
> todavía es `null` recibe el `EMPTY_SENTINEL` congelado, del que ya no se recupera (no es
> reactivo). El plugin llena ese estado después del mount. Por eso
> `alquicarros-reservation-wizard.spec.ts` también salta sus casos de Paso 2
> ("vehicleCategories (Supabase) no disponible en el entorno") — es preexistente y ajeno
> a este cambio. El test e2e existe y se salta con esa razón; en CI (SSR con payload) corre.
> Cobertura estática mientras tanto: `tests/wizard-monthly-mileage.test.ts` asserta que el
> early-return de re-tap de `StepVehicle.onSelect` sigue en su sitio.

## SCEN-ACM-08 — El costo del Seguro Total se expresa en la unidad correcta

**Given** una reserva mensual
**When** el Paso 3 muestra el costo incremental del Seguro Total
**Then** muestra `total_insurance_price` de la fila mensual, con sufijo `/mes`
**And** no muestra el cargo diario `totalCoverageUnitCharge - coverageUnitCharge`

El cobro real en mensual es `monthPriceMileage + total_insurance_price` (`useCategory.ts:200-212`),
así que el cargo diario es una unidad distinta a la que se cobra.

Evidence: DOM contra el total cobrado.

## SCEN-ACM-09 — Independencia de marca

**Given** la rama de trabajo
**When** se ejecuta `git diff --name-only origin/main`
**Then** solo aparecen rutas bajo `packages/ui-alquicarros/`, `e2e/` y `docs/`
**And** cero cambios en `packages/logic/`, `packages/ui-alquilame/`, `packages/ui-alquilatucarro/`

Evidence: git diff.

## SCEN-ACM-10 — Sin regresiones de tipos ni tests

**Given** la rama de trabajo
**When** se corren typecheck y unit tests de alquicarros
**Then** el delta contra la baseline de `origin/main` es cero

Baselines conocidas y ajenas a este cambio: 52 errores de typecheck; 2 tests fallando en
`model-image-optimization`. Medir con `git stash push -u` antes de comparar.

Evidence: salida de los comandos.
