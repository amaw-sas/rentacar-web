---
name: iva-source-of-truth
created_by: claude
created_at: 2026-07-17T00:00:00Z
---

# Issue #314 — Fuente de verdad del IVA (hoy 19% hardcodeado)

El IVA (19%) está escrito a mano en la web. La auditoría lo marcó en un solo
punto, pero el mismo literal aparece en **tres** sitios de `packages/logic`, y
dos de ellos alimentan el registro de reserva que se persiste en el dashboard.
No es solo un número en pantalla.

## El problema real

La web es un *pass-through*: `availability.post.ts` reenvía la respuesta del
dashboard sin reformarla. El dashboard ya es la fuente de verdad operativa del
IVA — devuelve `IVAFeeAmount` (un monto ya calculado). El defecto está en la
forma del payload:

- `taxFeePercentage` viene como **porcentaje** → la web puede recalcular la tasa
  cuando el subtotal cambia (Seguro Total).
- `IVAFeeAmount` viene solo como **monto absoluto** → no hay porcentaje para
  recalcular. Por eso, cuando el usuario elige Seguro Total y el subtotal crece,
  la web no puede reusar el monto del dashboard y **cablea 19% a mano**.

En las rutas donde recalcula (Seguro Total y reserva mensual), la web se
convierte en una segunda fuente de verdad silenciosa del IVA, y ese número entra
al registro persistido. Si el dashboard y la web divergieran, el comprobante
guardado llevaría el número de la web.

Los tres sitios del literal (todos en `packages/logic`, compartido por las tres
marcas):

1. `useCategory.ts` — `getIVAFeePrice`: `const ivaPercentage = 19` para el IVA
   mostrado con Seguro Total.
2. `useRecordReservationForm.ts` — reserva mensual: `total_price_to_pay / 1.19`
   desglosa el precio base pre-IVA, que se persiste como `total_price`.
3. `useRecordReservationForm.ts` — reserva regular: `iva_fee: getIVAFeePrice`
   persiste el IVA calculado localmente (que usó el literal 19).

## Decisión de negocio

El IVA es la tarifa general de Colombia, fija por ley (19%), no varía por
categoría. Pero el valor correcto no es el bug: el bug es que la web tenga el
dato. La corrección acordada con finanzas:

> El dashboard expone `IVAFeePercentage` en el payload de disponibilidad
> (simétrico a `taxFeePercentage`) y la web lo consume. Un solo dueño del dato.

Secuencia acordada: **consumo defensivo con fallback**. La web lee
`IVAFeePercentage` si viene; si falta (el dashboard aún no despliega), cae a una
constante documentada `IVA_PERCENTAGE = 19`. La web aterriza sin acoplar el
release al dashboard, y opera igual antes y después de que el campo exista.

## Diseño

### 1. Tipo

`packages/logic/src/utils/types/data/CategoryAvailabilityData.ts`: agregar
`IVAFeePercentage?: number`. Opcional — el dashboard puede no enviarlo todavía.

### 2. Constante de fallback

Nuevo `packages/logic/src/utils/ivaRate.ts` (plano en `utils/`, misma
convención que `fetchTimeouts.ts`):

```ts
// Tarifa general de IVA en Colombia, fija por ley (Estatuto Tributario).
// Fallback usado solo mientras el dashboard no emite IVAFeePercentage en el
// payload de disponibilidad. La fuente de verdad es el dashboard; esta
// constante evita un NaN cuando el campo aún no existe. Issue #314.
export const IVA_PERCENTAGE = 19;
```

Exportada por el barrel `@rentacar-main/logic/utils`.

### 3. `useCategory.ts`

Nuevo ref junto a `taxFeePercentage`:

```ts
const ivaFeePercentage = ref<number>(
  categoryAvailableData.IVAFeePercentage ?? IVA_PERCENTAGE
);
```

`getIVAFeePrice` usa `ivaFeePercentage.value` en lugar del literal 19. El `??`
preserva un 0 legítimo del dashboard (nullish, no falsy). `ivaFeePercentage` se
expone en el `return` para que el registro de reserva lea el mismo valor.

### 4. `useRecordReservationForm.ts`

- El sitio `iva_fee: getIVAFeePrice` se corrige solo: deriva de `useCategory`.
- La reserva mensual reemplaza el literal `/ 1.19` por el divisor derivado del
  porcentaje:

```ts
const ivaPct = selectedCategory.value?.ivaFeePercentage ?? IVA_PERCENTAGE;
total_price = total_price_to_pay
  ? Math.round(total_price_to_pay / (1 + ivaPct / 100))
  : 0;
```

`selectedCategory` es un ref de Pinia que guarda el objeto de `useCategory`; Vue
desenvuelve sus refs anidados, así que `.ivaFeePercentage` se lee como número.

**Límite arquitectónico del path mensual (importante).** Las tarjetas de reserva
mensual NO se construyen desde el payload de disponibilidad: nacen de
`createCategoryAvailability` (`useStoreSearchData.ts`), cuyo factory no carga
`IVAFeePercentage`. Por construcción, `selectedCategory.value?.ivaFeePercentage`
es `undefined` para una reserva mensual y siempre resuelve al fallback
`IVA_PERCENTAGE`. El cambio aquí NO hace que el mensual honre un % del dashboard
— eso requeriría hilar el campo por el factory y el merge, fuera de alcance
(el precio mensual proviene de `month_prices`/category_pricing, no de Localiza).
El valor del cambio es eliminar el `1.19` mágico y dejar una única fuente nombrada
del porcentaje. La forma `?? IVA_PERCENTAGE` se mantiene por consistencia y para
que quede correcta si algún día el factory sí propaga el campo.

**Trampa de casing.** El campo del payload/tipo es `IVAFeePercentage` (mayúsculas,
como `IVAFeeAmount`); el ref local y la key del `return` son `ivaFeePercentage`
(minúscula inicial, como `ivaFeeAmount`). No confundirlos al implementar.

**Touch points (imports nuevos):** `IVA_PERCENTAGE` se importa en `useCategory.ts`
y en `useRecordReservationForm.ts`; `ivaFeePercentage` es un export NUEVO del
`return` de `useCategory` (hoy ni siquiera `ivaFeeAmount` se exporta — solo
`getIVAFeePrice`). Los mocks existentes no requieren cambio: `IVAFeePercentage?`
es opcional, así que los fixtures de test siguen compilando.

### 5. Cross-repo

Issue companion `rentacar-dashboard#280`: agregar `IVAFeePercentage` al payload
de `/api/reservations/availability`. Hasta ese despliegue, la web opera con el
fallback. Sin acople de release.

## Blast radius

- `packages/logic` — compartido por alquilatucarro, alquilame y alquicarros.
- Superficie afectada: IVA mostrado con Seguro Total; campos `iva_fee` y
  `total_price` del registro de reserva persistido.
- Sin cambio de UI. Sin cambio de contrato de red saliente (los campos ya se
  enviaban; cambia el valor cuando el dashboard provea el %).
- Consumidores sin cambio: `useStoreSearchData` pasa el objeto tal cual.

## Escenarios observables

- **SCEN-314-01** — Payload con `IVAFeePercentage: 21`, Seguro Total activo: el
  IVA mostrado usa 21%, no 19%.
- **SCEN-314-02** — Payload SIN `IVAFeePercentage`, Seguro Total activo: el IVA
  usa el fallback 19% (comportamiento actual intacto).
- **SCEN-314-03** — Payload con `IVAFeePercentage: 0`: el IVA calculado es 0 (el
  fallback no pisa el cero).
- **SCEN-314-04** — Reserva mensual: `total_price` persistido es
  `total_price_to_pay / (1 + IVA_PERCENTAGE / 100)`. Por el límite arquitectónico
  (las tarjetas mensuales no vienen del payload), el mensual usa el fallback por
  construcción; el escenario verifica que el resultado sea idéntico al `/ 1.19`
  actual pero derivado de la constante nombrada, sin literal mágico.
- **SCEN-314-05** — Sin Seguro Total: el IVA mostrado sigue siendo `IVAFeeAmount`
  del dashboard, sin recálculo local (rama intacta).
- **SCEN-314-06** — Persistencia end-to-end: reserva regular con Seguro Total y
  `IVAFeePercentage: 21`, el `iva_fee` del payload de registro honra el 21% (el
  valor persistido, no solo el mostrado, sale de la fuente correcta). Es el
  corazón del issue: el número que entra al registro de reserva.
