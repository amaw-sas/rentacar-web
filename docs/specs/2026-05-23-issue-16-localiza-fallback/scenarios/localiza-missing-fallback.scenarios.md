---
name: localiza-missing-fallback
created_by: scenario-driven-development
created_at: 2026-05-23T00:00:00Z
issues: ["#16"]
---

Holdout para Issue #16 Finding 1: el handler `/api/rentacar-data` lanza 500 (crash de
toda la página vía SCEN-002) cuando la fila `rental_companies` con `code='localiza'`
falta (PostgREST `PGRST116` en `.single()`), aunque `categories` y `branches` carguen
bien. Fix: tolerar el error de `companyResult` a nivel API → `extras: undefined`,
alineado con el contrato `ReservasApiData.extras: ExtrasData | undefined` y los
fallbacks `?? 12000/20000/...` de `useCategory`. `categories`/`branches`/`cities`/
`franchises`/`faqs` deben SEGUIR lanzando — esos sí rompen el booking flow.

Alcance: solo Finding 1. Finding 2 (`swr` + shared storage) se consolida en issue #7.

## SCEN-16-1: fila localiza ausente degrada a extras undefined (no crash)

**Given**: `fetchRentacarData` resuelve con un 6-tuple donde `companyResult = { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }` y los otros 5 results (`categories`, `locations`, `cities`, `franchises`, `faqs`) tienen `data` válida y `error: null`.
**When**: se invoca el event handler de `packages/logic/server/api/rentacar-data.get.ts`.
**Then**: el handler NO lanza; retorna un objeto con `extras === undefined`; `categories`, `branches`, `vehicleCategories`, `cities`, `franchiseTestimonials`, `faqs` están poblados desde sus transformers respectivos; `transformExtras` NO es invocado ni una vez.
**Evidence**: valor de retorno del handler aserteado en test unit (`expect(result.extras).toBeUndefined()`, `expect(result.categories).toBe(<sentinel categorías>)`); spy `transformExtras` con `toHaveBeenCalledTimes(0)`.

## SCEN-16-2: error en categories sigue lanzando 500 (booking-breaking loud)

**Given**: `fetchRentacarData` resuelve con `categoriesResult = { data: null, error: { message: 'boom' } }` (el resto válidos, incluido `companyResult` ok).
**When**: se invoca el handler.
**Then**: el handler lanza un error cuyo `statusCode === 500`; el assembly de `extras` nunca se evalúa (la página de disponibilidad rota NO se degrada en silencio).
**Evidence**: `await expect(handler()).rejects.toMatchObject({ statusCode: 500 })`.

## SCEN-16-3: fila localiza presente transforma extras normal (happy-path regression)

**Given**: `fetchRentacarData` resuelve con `companyResult = { data: { extra_driver_day_price: 15000, baby_seat_day_price: 10000, wash_price: 20000, wash_onsite_price: 30000, wash_deep_price: 150000, wash_deep_upholstery_price: 225000 }, error: null }` (resto válidos).
**When**: se invoca el handler.
**Then**: `extras` NO es `undefined`; `extras` es el output de `transformExtras(companyResult.data)`; `transformExtras` es invocado exactamente una vez con la row. Garantiza que fila-con-columnas-NULL (objeto truthy, error null) NUNCA se confunde con fila-ausente (SCEN-007 preservado).
**Evidence**: `expect(result.extras).toBe(<sentinel transformExtras>)`; spy `transformExtras` con `toHaveBeenCalledTimes(1)` y `toHaveBeenCalledWith(companyResult.data)`.

## SCEN-16-4: cliente renderiza sin $0 cuando extras está ausente (e2e client contract)

**Given**: cualquiera de las 3 marcas en Playwright; `/api/rentacar-data` interceptado y devuelto con un payload donde `extras` está **omitido/undefined** (forma del missing-row, distinta de `extras` con campos null que cubre SCEN-010); usuario navega a `/` y a `/bogota`.
**When**: la página renderiza (SSR + hidratación).
**Then**: ambas rutas retornan HTTP 200; no hay console errors que matcheen `[useFetchRentacarData]|Failed to load|Data not loaded`; el markup visible no contiene literal `$0`/`$ 0`.
**Evidence**: `response.status() === 200`; array de console errors filtrado vacío; `body.innerText` sin match `/\$\s?0(?!\d)/`.

> Cobertura honesta: el route-mock REEMPLAZA la respuesta del servidor, así que SCEN-16-4 NO ejercita el fix server-side. El gate autoritativo del fix es **SCEN-16-1 (unit)**. SCEN-16-4 documenta que el cliente tolera `extras` ausente end-to-end, complementando la cadena SCEN-003 (sentinel) + SCEN-008 (`?? 12000`).

---

## Matriz de no-regresión (scenarios existentes que el fix debe preservar)

| Scenario existente | Preservado porque |
|---|---|
| SCEN-001 (build aborta si Supabase down) | `categoriesResult.error` se chequea primero y sigue lanzando 500 |
| SCEN-002 (plugin re-throws) | sigue re-throw ante error genuino; missing-row pasa a 200 (el fix) |
| SCEN-003 (sentinel `extras: undefined`) | el fix produce el mismo valor que el sentinel ya usa |
| SCEN-007 (transformExtras null columns) | fila con nulls = objeto truthy + error null → va a transformExtras |
| SCEN-008/009 (useCategory `?? default`) | no se toca useCategory ni transformExtras |
| SCEN-010 (cotización no muestra $0) | cliente ya tolera extras null/undefined via `extras?.` |
