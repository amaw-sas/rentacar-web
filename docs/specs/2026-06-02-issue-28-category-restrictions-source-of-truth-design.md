# Source of truth para restricciones de categorías — ADR + plan de migración

**Fecha**: 2026-06-02
**Issue**: [#28](https://github.com/amaw-sas/rentacar-web/issues/28)
**Tipo**: ADR (decisión de arquitectura) + plan de migración por olas. No incluye código — el alcance acordado en triage es decisión + plan.
**Decisión de triage**: Opción **C híbrido → B** (consolidar reglas operacionales en `rentacar-dashboard`/Supabase; dejar en web solo reglas de UI).
**Repos involucrados**: `rentacar-web` (consumer), `rentacar-dashboard` (admin / SoT de catálogo).
**Referente de formato y patrón**: `docs/specs/2026-05-04-cities-supabase-migration-design.md` (migración cities por olas).

---

## TL;DR

El issue pedía decidir A/B/C y, si B/C, **crear** una tabla `category_availability_rules`. Al auditar el dashboard antes de planear apareció el dato que reescribe el issue:

**La mitad de la infraestructura ya existe en el dashboard y está probada en producción.**

- Las restricciones **geográficas** (#3 solo-Bogotá, #4 CX, #5 GY) tienen schema, query layer, actions y **UI admin** ya construidos: `vehicle_categories.visibility_mode` + tabla pivote `category_city_visibility`, usados hoy por las gamas LY/LP/VP. Falta backfill de los sets de #28 y consumo en la web. **No hay que crear schema nuevo.**
- La restricción de **modo mensual** (#1) ya está modelada en el dashboard como `category_pricing.monthly_*_price = NULL` (migración 042). La web la **duplica** en un array hardcoded `noMonthlyCategories`. Es derivable del payload sin schema nuevo.
- **kmExtra** (#6) ya migró por completo. El fallback hardcoded de la web (`EXTRA_KM_BY_CODE` en `useTariffs.ts`) **ya se borró** en `9a41993` (2026-05-02), que pasó a leer `extra_km_charge` del payload. No queda nada que limpiar: Ola 0 está hecha desde antes de este ADR.
- **Pico y placa** (#2) solo existe en el dashboard como **texto libre** (`description` y array `tags`: "Libre Pico y Placa", "exenta de pico y placa") — no consultable. Es la única regla que necesita una columna estructurada nueva. **Ojo con la semántica invertida**: el flag web `hasPicoyPlaca()` renderiza el badge "sin pico y placa", es decir devuelve `true` cuando la gama está **exenta**. El nombre miente. La migración debe corregir el nombre, no propagarlo.

Consecuencia: la Opción C/B es **más barata y menos arriesgada** de lo que el issue estimó. La recomendación del issue se confirma, con un plan mucho más corto.

---

## Decisión (el ADR)

> Las cinco restricciones inventariadas en #28 son **políticas operacionales** ("qué oferta aplica bajo qué condiciones"), no invariantes de UI. Su dueño natural es operaciones/producto, y el sistema de registro de catálogo ya es el dashboard sobre Supabase. Por tanto se consolidan en `rentacar-dashboard` y la web pasa a **leerlas del payload `/api/rentacar-data`** en lugar de hardcodearlas. La web conserva solo lo que es regla de presentación (validación de fechas/formularios).

**Estado**: aceptada en triage 2026-06-02. Implementación pendiente de autorización por ola.

**Por qué C→B y no A (status quo):** el riesgo de A ya se materializó — el filtro mensual estuvo roto durante años por un operador `in` mal usado y nadie lo notó porque la regla vivía en código sin observabilidad ni dueño claro (corregido en `43aef47`). Mantener arrays hardcoded reproduce ese fallo: drift entre fuentes (#B), y cada categoría nueva exige un PR en web además del seed en el dashboard (#C). Mover al SoT vuelve las reglas operables sin release.

**Por qué C→B y no B puro:** no toda regla pertenece al dashboard. Validación de fechas y reglas de formulario son de UI y se quedan en web. Solo migra lo operacional.

---

## Estado real por restricción (verificado en código, ambos repos)

| # | Restricción | Web hoy | Dashboard hoy | Brecha real |
|---|---|---|---|---|
| 1 | No mensual (FU/FL/GL/LU) | array `noMonthlyCategories` en `useStoreSearchData.ts:42` | implícito: `monthly_*_price = NULL` (mig. 042) | Derivable del payload. Decidir: derivar de pricing NULL, o columna explícita `available_modes`. Sin schema obligatorio. |
| 2 | Pico y placa (FU/FL/GL/LY/LP/LU) | `hasPicoyPlaca()` en `useCategory.ts:97` → badge "sin pico y placa" (semántica = **exenta**, nombre invertido) | solo texto libre en `description`/`tags`, no consultable | **Única que necesita columna nueva** — nombrarla por su semántica real (`picoyplaca_exempt`, no `has_picoyplaca`) + backfill + lectura web. |
| 3 | Solo Bogotá (FU/FL/GL) | array de **branch codes** `['AABOT','ACBOT','ACBEX','ACBNN','ACBOJ']` en `useStoreSearchData.ts:189` | schema existe (`category_city_visibility`), **datos ausentes** para FU/FL/GL | Backfill `visibility_mode='restricted'` + filas city. Web lee. **Granularidad branch→city: ver open question O1.** |
| 4 | CX en 7 ciudades | array de **city slugs** en `useStoreSearchData.ts:202` | schema existe, datos ausentes para CX | Backfill + lectura web. Mapea limpio (city→city). |
| 5 | GY en 8 ciudades | array de **city slugs** en `useStoreSearchData.ts:218` | schema existe, datos ausentes para GY | Backfill + lectura web. Mapea limpio. |
| 6 | kmExtra fallback por gama | ~~fallback hardcoded~~ **ya borrado** (`9a41993`); lee `extra_km_charge` del payload | `extra_km_charge` (mig. 035), transformer ya lo lee | **Ninguna** — Ola 0 ya completada en `9a41993`. Lo que queda (`?? 0`, `> 0 ? : null`) es null-handling, no drift. |

### Evidencia de que el schema geográfico ya existe y funciona

```
rentacar-dashboard/
  supabase/migrations/014_category_city_visibility.sql   # visibility_mode + tabla pivote
  supabase/seed.sql:285-302                               # LY→[bogota,medellin], LP→[bogota], VP→[cali,monteria]
  lib/queries/category-city-visibility.ts                # capa de lectura
  lib/actions/category-city-visibility.ts                # mutaciones admin
  app/(dashboard)/categories/[id]/page.tsx               # UI que lo gestiona
```

El whitelist seeded cubre LY/LP/VP (gamas especiales), **no** las categorías que la web hardcodea (FU/FL/GL/CX/GY). Esa es exactamente la brecha de datos a backfillear.

---

## Decisiones acordadas

| Decisión | Resultado | Razón |
|---|---|---|
| Dirección | Opción C híbrido → B | Las 5 restricciones son operacionales; el SoT ya es el dashboard. |
| Schema geográfico (#3/#4/#5) | **Reusar `category_city_visibility` existente** | Ya construido, probado (LY/LP/VP) y con UI admin. Crear `category_availability_rules` sería duplicar. Descarta la propuesta de schema del issue. |
| Modo mensual (#1) | Derivar de `category_pricing` (monthly NULL) — sin columna nueva en Ola A; reconsiderar `available_modes` solo si aparece un modo que no sea expresable por pricing | El dato ya viaja en el payload. Una columna declarativa es redundante hoy. |
| Pico y placa (#2) | Columna nueva `vehicle_categories.picoyplaca_exempt boolean` (nombre por semántica real, no `has_picoyplaca`) | Es atributo del vehículo, no derivable de dato estructurado existente (solo vive como texto en description/tags). Única regla que exige schema. Aprovechar para corregir el nombre invertido del flag web. |
| kmExtra (#6) | Cleanup del fallback web, sin trabajo de dashboard | Ya migrado. |
| Tamaño de entrega | **Una PR por ola**, no big bang | Patrón establecido por la migración cities. Review chico, rollback granular, menos conflicto con ramas paralelas. |
| Endpoint | Extender `/api/rentacar-data` (no endpoint nuevo) | Las reglas viajan en el HTML que ya se renderiza server-side. Un solo fetch, un solo cache (maxAge 3600, key por buildId). |
| Coordinación inter-repo | DDL + backfill se aplican en `rentacar-dashboard`; la web solo consume | Boundary existente: `logic/` no escribe en Supabase admin; lee vía endpoint. |

---

## Arquitectura objetivo

```
rentacar-dashboard (SoT)
  Supabase
    ├── vehicle_categories
    │     ├── visibility_mode      (existe — #3/#4/#5)
    │     └── picoyplaca_exempt    (NUEVO — #2; nombre por semántica real)
    ├── category_city_visibility   (existe — pivote category×city)
    └── category_pricing.monthly_* (existe — #1 implícito)
        ▲ gestionado por UI admin (operaciones, sin release)
        │
rentacar-web (consumer)
  server/api/rentacar-data.get.ts
    └── fetchRentacarData()  → añadir columnas/joins al select de vehicle_categories
    └── transformers.ts
        ├── transformVehicleCategories()  → exponer picoYPlaca + visibilityMode + cities permitidas
        └── (modo mensual ya derivable de category_pricing en el payload)
        ↓
  plugin rentacar-data → useState('rentacar-data')
        ↓
  useStoreSearchData.ts   → reemplazar arrays hardcoded por lecturas del payload
  useCategory.ts          → hasPicoyPlaca() lee flag, no array
```

Lo que se borra de la web al cerrar todas las olas:
- `noMonthlyCategories` array (`useStoreSearchData.ts:42-46`)
- `bogotaBranches` / `onlyBogotaCategories` / arrays CX / GY (`useStoreSearchData.ts:172-233`)
- array pico y placa (`useCategory.ts:97`)
- ~~fallback kmExtra hardcoded~~ (ya borrado en `9a41993`)

---

## Plan por olas

Cada ola es una unidad entregable e independiente, ordenada por **menor esfuerzo / mayor certeza primero**. Cada ola autoriza su propio holdout de escenarios vía `/scenario-driven-development` antes de tocar código — este documento no fabrica escenarios por adelantado.

### Ola 0 — Cleanup kmExtra (#6) · ✅ ya completada en `9a41993`

**Estado: hecha antes de este ADR.** El fallback `EXTRA_KM_BY_CODE` se borró el 2026-05-02 (`9a41993`, "refactor(tarifas): read kmExtra from vehicle_categories instead of local mapping"), que threadeó `extra_km_charge` por `transformer → CategoryData → useTariffs`. Esta ola se listó por una premisa que no chequeó el historial git; no hay código que cambiar.

Lo que permanece **no** es un fallback hardcoded y se queda:
- `transformers.ts:108` `Number(row.extra_km_charge ?? 0)` — coerción null-safe (default de columna = 0).
- `useTariffs.ts:90` `extra_km_charge > 0 ? … : null` — "0 = sin configurar → renderiza —", semántica de display intencional documentada en `9a41993`.

Borrar cualquiera de las dos sería una regresión sin beneficio. El siguiente trabajo real es Ola A.

### Ola A — Modo mensual (#1) · esfuerzo S · solo web

Derivar "no acepta mensual" del payload en vez del array. Una categoría no acepta mensual cuando su `category_pricing` vigente tiene los `monthly_*_price` en NULL (es como el dashboard ya lo expresa, mig. 042).

- Dashboard: ninguno (ya modelado).
- Web: reemplazar `noMonthlyCategories.includes(code)` por un predicado derivado del pricing del payload.
- Riesgo: el predicado debe respetar el filtro temporal de `pickPriceForDate` (Reglas 2/3 del pricing — ver `reference_rentacar_data_cache_pricing_internals`). Mezclar mal el filtro de fecha con la detección de NULL es un landmine de dinero. Escenarios deben cubrir el borde temporal.
- Aceptación: FU/FL/GL/LU no aparecen en reserva mensual sin que su código esté en ningún array; agregar una categoría daily-only en el dashboard la excluye del mensual en web sin tocar código.

### Ola B — Pico y placa (#2) · esfuerzo M · dashboard + web

Única ola que añade schema. Cuidado con la semántica: el badge dice "sin pico y placa" = la gama está **exenta**. La columna se nombra por su significado real.

- Dashboard:
  - DDL: `ALTER TABLE vehicle_categories ADD COLUMN picoyplaca_exempt boolean NOT NULL DEFAULT false;`
  - Backfill: `picoyplaca_exempt = true` para FU, FL, GL, LY, LP, LU (los 6 del array actual, que ya se describen como "sin/libre/exenta pico y placa" en el seed del dashboard).
  - UI admin: exponer el toggle en la página de categoría (mismo patrón que visibility).
- Web: `select` incluye la columna; transformer la expone; `useCategory.hasPicoyPlaca()` lee el flag y **se renombra** (ej. `isPicoyPlacaExempt()`) para que el código deje de mentir. El texto del badge ("sin pico y placa") no cambia.
- Aceptación: el badge aparece exactamente en las mismas 6 gamas que hoy; marcar una gama nueva como exenta en el dashboard enciende su badge sin release; ningún identificador del flujo afirma lo contrario de lo que hace.

### Ola C — Restricciones geográficas (#3/#4/#5) · esfuerzo M-L · dashboard backfill + web

Reusar `category_city_visibility`. Cero schema nuevo.

- Dashboard backfill:
  - `visibility_mode='restricted'` para CX, GY, FU, FL, GL.
  - Filas `category_city_visibility` que reproduzcan los arrays actuales:
    - CX → 7 ciudades (barranquilla, bogota, bucaramanga, cali, cartagena, medellin, santa-marta)
    - GY → 8 ciudades (las 7 de CX + soledad)
    - FU/FL/GL → bogota (ver O1 sobre branch vs city)
- Web: el transformer expone, por categoría, `visibilityMode` y el set de city slugs permitidas; `filteredCategories` filtra por esos datos en vez de los arrays.
- Aceptación: para cada par (categoría restringida × ciudad), la web muestra/oculta la categoría igual que hoy; agregar una ciudad a CX en el dashboard la habilita en web sin release.

### Ola D — Borrado final + guardas · esfuerzo S · solo web

Una vez A–C en producción y verificadas: eliminar todos los arrays hardcoded muertos y añadir un test que falle si reaparecen (guarda anti-regresión del drift #B).

---

## Backfill: mapeo exacto de los sets actuales

Fuente de verdad del estado a reproducir (snapshot de los arrays hardcoded hoy):

`picoyplaca_exempt = true` significa que la gama está **libre** de pico y placa (muestra el badge "sin pico y placa").

| Categoría | visibility_mode | Ciudades permitidas | picoyplaca_exempt | acepta mensual |
|---|---|---|---|---|
| CX | restricted | barranquilla, bogota, bucaramanga, cali, cartagena, medellin, santa-marta | false | sí |
| GY | restricted | barranquilla, bogota, bucaramanga, cali, cartagena, medellin, santa-marta, soledad | false | sí |
| FU | restricted | bogota (ver O1) | true | no |
| FL | restricted | bogota (ver O1) | true | no |
| GL | restricted | bogota (ver O1) | true | no |
| LU | all | — | true | no |
| LY | restricted (ya seeded) | bogota, medellin | true | (según pricing) |
| LP | restricted (ya seeded) | bogota | true | (según pricing) |

El backfill se versiona como migración idempotente en `rentacar-dashboard/supabase/migrations/` (patrón de las migraciones 042/047: `DO $$ ... ON CONFLICT DO NOTHING`).

---

## Open questions / riesgos

- **O1 — Granularidad branch vs city para #3 (solo-Bogotá).** La web filtra FU/FL/GL por **branch code** (5 sucursales de Bogotá); `category_city_visibility` es **por ciudad**. Si esas 5 sucursales son exactamente las de Bogotá, `city=bogota` es equivalente y mapea limpio. Si en el futuro Bogotá tuviera una sucursal donde FU/FL/GL **no** deban ofrecerse, el modelo city-level no lo expresa. **Acción**: confirmar con operaciones que la regla real es "ciudad Bogotá", no "estas 5 sucursales". Si fuera branch-level, se necesita una tabla `category_branch_visibility` análoga (no existe). Bloquea solo la Ola C.
- **O2 — `available_modes` explícito vs derivar.** Derivar "no mensual" de pricing NULL acopla la regla de modo a la presencia de datos de pricing. Es correcto hoy (mig. 042 lo hace así a propósito), pero si algún día una categoría tuviera pricing mensual y aun así no debiera ofrecerse mensual, haría falta la columna declarativa. Se deja como reconsideración futura, no se construye ahora (YAGNI).
- **O3 — Invalidación de caché.** `/api/rentacar-data` cachea 1h (maxAge 3600, key por buildId). Un cambio urgente de regla en el dashboard tarda hasta 1h en reflejarse. Es el mismo tradeoff que ya tiene pricing (#7/#16); no se resuelve en este alcance, se hereda. Documentar para operaciones.
- **O4 — Rename del flag pico y placa.** La Ola B no solo añade la columna: renombra `hasPicoyPlaca()` (mentira: devuelve true para exentas) a algo veraz. Es un cambio de nombre que toca los 3 `CategoryTags.vue`, `ReservationResume.vue` y `CategoryCard.vue` de las 3 marcas. Bajo riesgo (rename mecánico), pero el review de la Ola B debe esperar ese diff, no solo la lectura de la columna. Confirmar de paso con operaciones que las 6 gamas marcadas son efectivamente las exentas hoy (el badge se le muestra al cliente).
- **O5 — Multi-marca.** Las 3 marcas heredan de `logic`, así que todas reciben la misma regla. `category_city_visibility` no tiene `franchise_id`. Hoy las reglas son idénticas entre marcas, así que no bloquea; si en el futuro divergen, se modela con una columna/join de franquicia (fuera de alcance).

---

## Fuera de alcance

- Implementación de cualquier ola (este documento es decisión + plan; cada ola se autoriza aparte).
- Tabla `category_availability_rules` propuesta en el issue: **descartada**, el schema existente la hace innecesaria.
- Columna `available_modes`: no se construye (O2).
- `category_branch_visibility`: solo si O1 resuelve "branch-level".
- Resolver la invalidación de caché (#7/#16): heredado, no nuevo.

---

## Criterios de aceptación del ADR (este entregable)

- [x] Decisión A/B/C registrada con justificación (C→B).
- [x] Estado real por restricción verificado en ambos repos, no asumido.
- [x] Plan por olas con esfuerzo, repos tocados y aceptación por ola.
- [x] Mapeo de backfill explícito contra los arrays actuales.
- [x] Open questions que bloquean implementación identificadas (O1 bloquea Ola C).
- [ ] Triage del issue #28 actualizado con esta decisión (acción de cierre).

---

*Estado de implementación (act. 2026-06-02): Ola 0 ya estaba completada (`9a41993`). El próximo trabajo real es **Ola A** (modo mensual, solo web, sin schema), autorizando su holdout de escenarios con `/scenario-driven-development`. Ola B/C requieren coordinación con `rentacar-dashboard` y resolver O1 antes de la C.*
