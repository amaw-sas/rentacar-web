# Scenarios — #116 enriquecer ReserveAction con capa programática (D2)

Holdout observable. Verificación sobre el **JSON-LD renderizado** (no el source).
Aplica a las 3 marcas (alquilatucarro, alquilame, alquicarros). El `ReserveAction`
y su `EntryPoint` web de #64 (SCEN-002/003) siguen presentes y no se rompen.

## SCEN-116-001 — EntryPoint web preservado
- **Given** el grafo JSON-LD renderizado de la home de una marca
- **When** un agente recorre `potentialAction[ReserveAction].target`
- **Then** sigue existiendo un `EntryPoint` con `urlTemplate == franchise.website`
  y `actionPlatform` desktop+mobile (no se perdió la ruta web de #64)
- **Verify:** el JSON-LD contiene el `EntryPoint` web original; `result` sigue siendo
  `RentalCarReservation`

## SCEN-116-002 — EntryPoint programático presente y resoluble
- **Given** el grafo JSON-LD renderizado de la home
- **When** un agente busca en `target` un `EntryPoint` con método HTTP
- **Then** existe un segundo `EntryPoint` con:
  - `httpMethod == "POST"`
  - `contentType == "application/json"` y `encodingType == "application/json"`
  - `urlTemplate` que resuelve a la API pública de creación de reservas
    (`https://rentacar-dashboard.vercel.app/api/reservations`)
- **Verify:** `curl -s <url> | grep` del JSON-LD → encuentra el EntryPoint con
  `"httpMethod":"POST"` y `urlTemplate` al endpoint `/api/reservations`

## SCEN-116-003 — actionApplication resoluble hacia la API documentada
- **Given** el `EntryPoint` programático
- **When** un agente lee su `actionApplication`
- **Then** encuentra un nodo cuyo `url` resuelve al OpenAPI público de D2
  (`https://rentacar-dashboard.vercel.app/api/openapi`)
- **And** el nodo declara `name` y `applicationCategory`
- **Verify:** el JSON-LD contiene `actionApplication.url` == `/api/openapi`;
  un `GET` a esa URL devuelve un documento OpenAPI válido (smoke check de resolubilidad)

## SCEN-116-004 — Schema válido (type-clean, sin casts mentirosos)
- **Given** el código del `ReserveAction` enriquecido
- **When** se valida contra `schema-dts`
- **Then** `target` es `EntryPoint[]`; el `EntryPoint` programático tipa
  `httpMethod`/`contentType`/`encodingType` como `Text` y `actionApplication` como
  `SoftwareApplication` (no `WebAPI`); sin errores de tipo ni `@ts-ignore`/cast forzado
- **Verify:** `pnpm --filter ui-<brand> typecheck` (build-mode) verde; grep confirma
  ausencia de `@ts-` y de `'@type': 'WebAPI'` dentro de `actionApplication`

## SCEN-116-005 — Brand-agnóstico (3 marcas)
- **Given** el JSON-LD renderizado de cada marca
- **When** se compara el `actionApplication.url` y el `urlTemplate` programático
- **Then** los tres apuntan al mismo dashboard público (`rentacar-dashboard.vercel.app`),
  mientras el `EntryPoint` web sigue siendo el dominio propio de cada marca
- **Verify:** render en las 3 marcas → API base idéntica, `franchise.website` distinto

## Fuera de alcance (follow-up)
- Deep-link `urlTemplate` parametrizado por ciudad (necesita directorio
  `/api/locations` slug↔code↔ciudad).
