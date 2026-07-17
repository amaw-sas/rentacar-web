# Issue #314 — Plan de implementación: fuente de verdad del IVA

**Spec:** `docs/specs/2026-07-17-issue-314-iva-source-of-truth-design.md`
**Fecha:** 2026-07-17
**Complejidad global:** S · **Riesgo:** Bajo (fallback preserva comportamiento actual)

## Mapa de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `packages/logic/src/utils/ivaRate.ts` | Constante `IVA_PERCENTAGE = 19` documentada (fallback). Plano en `utils/`, misma convención que `fetchTimeouts.ts`. | Crear |
| `packages/logic/src/utils/index.ts` (barrel) | `export { IVA_PERCENTAGE } from './ivaRate'` (named export, estilo del barrel). | Editar |
| `packages/logic/src/utils/types/data/CategoryAvailabilityData.ts` | Agregar `IVAFeePercentage?: number` (opcional). | Editar |
| `packages/logic/src/composables/useCategory.ts` | Ref `ivaFeePercentage`; `getIVAFeePrice` usa el ref; exponer en `return`. | Editar |
| `packages/logic/src/composables/useRecordReservationForm.ts` | Path mensual: `/ 1.19` → divisor derivado del `%`. | Editar |
| `packages/logic/src/composables/__tests__/useCategory.iva.test.ts` | Escenarios SCEN-314-01/02/03/05. | Crear |
| `packages/logic/src/composables/__tests__/useRecordReservationForm.iva.test.ts` | Escenarios SCEN-314-04 (mensual) y SCEN-314-06 (`iva_fee` persistido en reserva regular honra el `%`). | Crear |

Todo vive en `packages/logic` (compartido por las 3 marcas). Sin cambios de UI ni de rutas server.

## Prerequisitos

- Ninguna dependencia nueva. Vitest ya está configurado en `packages/logic`.
- Verificar el path exacto del barrel de utils antes de editar (Step 1).

## Pasos (SDD: escenario → código → satisfacer)

### Paso 1 — Constante de fallback + export | Size: S | Deps: none
Crear `utils/ivaRate.ts` con `IVA_PERCENTAGE = 19` y comentario doc (tarifa general Colombia; fallback hasta que el dashboard emita el `%`). Agregar `export { IVA_PERCENTAGE } from './ivaRate'` al barrel.
**Criterio de aceptación:** `import { IVA_PERCENTAGE } from '@rentacar-main/logic/utils'` resuelve a `19` en un test.

### Paso 2 — Campo opcional en el tipo | Size: S | Deps: Paso 1
Agregar `IVAFeePercentage?: number` a `CategoryAvailabilityData`, con comentario simétrico a `taxFeePercentage`.
**Criterio de aceptación:** typecheck de `packages/logic` sin nuevos errores; fixtures existentes (sin el campo) siguen compilando por ser opcional.

### Paso 3 — SCEN-314-01/02/03/05: `getIVAFeePrice` consume el `%` | Size: M | Deps: Paso 1,2
Escenario primero: dado un `useCategory` con Seguro Total activo,
- payload `IVAFeePercentage: 21` → IVA usa 21% (**SCEN-01**),
- payload sin el campo → IVA usa 19% fallback (**SCEN-02**),
- payload `IVAFeePercentage: 0` → IVA = 0, el `??` no pisa el cero (**SCEN-03**),
- sin Seguro Total → IVA = `IVAFeeAmount` del dashboard, sin recálculo (**SCEN-05**).
Luego el código: ref `ivaFeePercentage = ref(categoryAvailableData.IVAFeePercentage ?? IVA_PERCENTAGE)`; `getIVAFeePrice` usa `ivaFeePercentage.value`; exponer `ivaFeePercentage` en el `return`.
**Criterio de aceptación:** los 4 escenarios pasan; sin Seguro Total la rama queda idéntica (regresión verde).

### Paso 4 — SCEN-314-04: path mensual derivado del `%` | Size: S | Deps: Paso 3
Escenario primero: reserva mensual → `total_price` persistido = `round(total_price_to_pay / (1 + ivaPct/100))`, con `ivaPct` = `selectedCategory.ivaFeePercentage ?? IVA_PERCENTAGE`. Por el límite arquitectónico (tarjetas mensuales no vienen del payload), el valor es el fallback; el escenario verifica igualdad numérica con el `/ 1.19` actual pero sin literal mágico.
Luego el código: reemplazar `/ 1.19` en `useRecordReservationForm.ts`.
**SCEN-314-06 (persistencia end-to-end):** reserva regular con Seguro Total y payload `IVAFeePercentage: 21` → el `iva_fee` del payload de record honra el 21% (prueba que el valor *persistido*, no solo el mostrado, sale de la fuente correcta). Este es el corazón del issue #314: el número que entra al registro.
**Criterio de aceptación:** SCEN-04 pasa (`total_price` numéricamente igual al comportamiento previo para 19%); SCEN-06 pasa (`iva_fee` persistido = recálculo con 21%).

### Paso 5 — Issue companion en el dashboard | Size: S | Deps: none (paralelo)
Abrir issue en `rentacar-dashboard`: agregar `IVAFeePercentage` al payload de `/api/reservations/availability` (simétrico a `taxFeePercentage`). Referenciar #314.
**Criterio de aceptación:** issue creada y enlazada; el spec la menciona como dependencia cross-repo.

## Estrategia de testing

- **Unit (vitest, `packages/logic`):** SCEN-01..05 como tests de comportamiento sobre `useCategory` y `useRecordReservationForm` (montar con Pinia, setear `withTotalCoverage`/`haveMonthlyReservation`, aserciones numéricas sobre `getIVAFeePrice` y el payload de record).
- **Regresión:** los tests existentes de `useCategory`/`useRecordReservationForm` deben seguir verdes sin cambios (el fallback preserva 19%).
- **Verificación manual:** no aplica cambio de UI; el número mostrado con Seguro Total no cambia mientras el dashboard no emita el campo (fallback = 19, idéntico a hoy). `/verification-before-completion` con evidencia de vitest antes del commit de código.

## Rollout

- **Deploy web:** independiente. Con fallback, la web opera igual antes y después del dashboard.
- **Deploy dashboard:** cuando la issue companion se implemente y emita `IVAFeePercentage`, la web lo toma automáticamente (sin redeploy).
- **Rollback:** revertir el commit de `packages/logic`; el comportamiento vuelve al literal 19 (idéntico efecto observable).
