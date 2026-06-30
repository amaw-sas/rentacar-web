# Mensaje claro para one-way sin distancia registrada (LLNRRE003)

## Motivación

Una búsqueda de disponibilidad **one-way** (recogida ≠ devolución) entre sucursales cuya distancia Localiza no tiene registrada falla con `unknown_error` / `shortText: LLNRRE003` (HTTP 500). El cliente ve el toast genérico **"No pudimos completar la búsqueda"**, que no explica el problema ni ofrece salida.

Evidencia (logs Localiza vía Railway, 2026-06-30) — es un **Warning** OTA, no un error fatal:

> `LLNRRE003` · Code `303` · Type `3` · Status `NotProcessed` · "**Distância entre cidades não cadastrada.** Para mais informações, entre em contato com a Central de Reservas Localiza."

Confirmado contra producción: round-trip en cada sucursal por separado rinde 200; solo falla al cruzarlas (ACBAN ↔ AABAN), independiente de fechas. La causa raíz vive río abajo (Localiza no tiene la distancia entre ciudades) y se rastrea en **rentacar-dashboard#205**. Este spec cubre **solo la web**: traducir ese caso a un mensaje accionable.

## Decisiones

1. **Trigger**: `shortText === "LLNRRE003"` **Y** recogida ≠ devolución (ambos códigos no nulos). El doble gate evita secuestrar un `unknown_error` de infraestructura genuino: solo reescribimos cuando es demostrablemente una búsqueda one-way.
2. **Enfoque B — clasificar → renderizar**: un helper puro sintetiza un código semántico `one_way_not_available`; `createErrorMessage` lo traduce a copy. Sigue el patrón existente de códigos sintetizados por la web (`server_error`, `missing_parameters`).
3. **Superficie**: toast de error (rojo), consistente con los demás remapeos de validación de `createErrorMessage` (`same_hour_error`, `out_of_schedule_*`). Sin nuevo bloque inline.
4. **Copy**:
   - Título: `Entrega en otra sede no disponible`
   - Descripción: `Por ahora no podemos cotizar la entrega en una sede distinta a la de recogida. Elige la misma sede para recoger y devolver, o escríbenos y te ayudamos.`

## Arquitectura — cambios file-level

Todo el cambio vive en `packages/logic` (Nuxt Layer) → propaga a las 3 marcas. Sin cambios de componentes/UI.

### 1. `utils/types/data/LocalizaErrorResponse.ts`

Añadir `| "one_way_not_available"` al union `error`. Es un código **sintetizado por la web** (no lo emite Localiza), igual que `server_error`.

### 2. `utils/helpers/classifyOneWayDistanceError.ts` — nuevo

Helper puro, sin efectos:

```ts
import type LocalizaErrorResponse from '../types/data/LocalizaErrorResponse';

// Localiza no puede cotizar el one-way cuando la distancia entre las ciudades
// de recogida y devolución no está registrada: responde unknown_error con
// shortText LLNRRE003 (OTA Code 303, "Distância entre cidades não cadastrada").
// Reframe ese caso —y SOLO ese— como un código semántico que createErrorMessage
// traduce a copy accionable. El gate pickup≠return evita reetiquetar un
// unknown_error de infraestructura genuino. Ver rentacar-dashboard#205.
export function classifyOneWayDistanceError(
  error: LocalizaErrorResponse,
  pickupLocation: string | null,
  returnLocation: string | null,
): LocalizaErrorResponse {
  if (
    error.shortText === 'LLNRRE003' &&
    pickupLocation &&
    returnLocation &&
    pickupLocation !== returnLocation
  ) {
    return { ...error, error: 'one_way_not_available' };
  }
  return error;
}
```

### 3. `composables/useFetchCategoriesAvailabilityData.ts`

En el `catch`, encadenar el helper después de `mapAvailabilityFetchError` (ahí ya están `lugarRecogida`/`lugarDevolucion` en scope vía `storeToRefs`). Añadir también el import en el bloque correspondiente: `import { classifyOneWayDistanceError } from '../utils/helpers/classifyOneWayDistanceError'`.

```ts
} catch (e) {
  error.value = classifyOneWayDistanceError(
    mapAvailabilityFetchError(e),
    lugarRecogida.value,
    lugarDevolucion.value,
  );
}
```

### 4. `composables/useMessages.ts` — `createErrorMessage`

Añadir una rama, antes del fallback `server_error || connection_timeout || unknown_error`:

```ts
if (message.error == "one_way_not_available") {
  error.title = "Entrega en otra sede no disponible";
  error.message = "Por ahora no podemos cotizar la entrega en una sede distinta a la de recogida. Elige la misma sede para recoger y devolver, o escríbenos y te ayudamos.";
}
```

`one_way_not_available` es un código distinto → NO matchea el fallback genérico ni `isServerError` (`=== 'server_error'`) en `CategorySelectionSection.vue`. Cae en la rama toast y, al no ser `no_available_categories_error`, deja `categories` en `[]` (grilla vacía, sin tarjetas grises) en ambas ramas (monthly y non-monthly) de `useStoreSearchData`. Sin cambios en esa store.

## Comportamiento observable (resumen)

| Caso | shortText | pickup vs return | Resultado |
|------|-----------|------------------|-----------|
| One-way sin distancia | `LLNRRE003` | ≠ | Toast "Entrega en otra sede no disponible" |
| Mismo error en round-trip | `LLNRRE003` | = | Toast genérico (sin cambio) |
| Infra genuina en one-way | otro/ninguno | ≠ | Toast genérico / bloque server_error (sin cambio) |

## Observable scenarios

Holdout en `scenarios/one-way-distance-message.scenarios.md` (SCEN-OW-01..05). Encodean la tabla anterior más la verificación de grilla vacía e idempotencia del helper.

## Test layer mapping

- **Unit (helper)**: `utils/helpers/classifyOneWayDistanceError.test.ts` (colocado, junto a `extractStructuredError.test.ts`) — cubre los 3 casos de la tabla + bordes (un solo lugar null, error ya clasificado → idempotente).
- **Unit (copy)**: extender `composables/__tests__/useMessages.createErrorMessage.test.ts` — `one_way_not_available` rinde el título/descripción exactos y NO el fallback genérico.
- **E2E (opcional)**: Playwright con `page.route` stubbeando `/api/reservations/availability` → 500 `{error:"unknown_error",shortText:"LLNRRE003"}` en ruta one-way; assert toast con el nuevo título. Reusa el patrón de `2026-05-04-availability-error-feedback`.

## Satisfaction criteria

- `pnpm --filter @rentacar-main/logic test` verde, incluidos los nuevos casos.
- En runtime (worktree dev), una búsqueda one-way ACBAN→AABAN muestra el toast "Entrega en otra sede no disponible"; una round-trip ACBAN→ACBAN con el mismo error simulado mantiene el toast genérico.
- `pnpm --filter ui-alquilatucarro typecheck` sin nuevos errores por el union ampliado.

## Fuera de alcance

- Fix de la causa raíz (Localiza / dashboard): **#205**.
- Bloque inline persistente para one-way (hoy el toast se auto-cierra a los 20s). Si se quisiera persistencia tipo `server_error`, sería un branch nuevo en `CategorySelectionSection.vue` — no se hace ahora (YAGNI).
- Migración a un código semántico del dashboard (`one_way_distance_not_registered`): cuando el dashboard lo exponga, `classifyOneWayDistanceError` puede keyear por ese código en vez de `shortText`. El helper queda como único punto a tocar.
