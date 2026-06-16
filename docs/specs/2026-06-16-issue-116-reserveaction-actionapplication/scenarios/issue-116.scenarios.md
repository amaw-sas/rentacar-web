# Scenarios — #116 enriquecer ReserveAction con capa programática (D2)

Holdout observable. Verificación sobre el **JSON-LD renderizado** (no el source).
Aplica a las 3 marcas (alquilatucarro, alquilame, alquicarros). El `ReserveAction`
y su `EntryPoint` web de #64 (SCEN-002/003) siguen presentes y no se rompen.

`API_BASE` = `https://rentacar-dashboard-delta.vercel.app` (alias prod del dashboard,
overridable vía `NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE`).

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
  - `urlTemplate == ${API_BASE}/api/reservations` (endpoint de creación)
- **Verify:** `curl -s <url-home>` y grep del `<script type="application/ld+json">`
  → encuentra el EntryPoint con `"httpMethod":"POST"` y `urlTemplate` al endpoint
  `/api/reservations`. (Se grepea el JSON-LD renderizado del home; NO se curlea
  `/api/reservations`, que devolvería 401.)

## SCEN-116-003 — actionApplication apunta al OpenAPI documentado (gating)
- **Given** el `EntryPoint` programático
- **When** un agente lee su `actionApplication`
- **Then** encuentra un nodo `SoftwareApplication` con:
  - `url == ${API_BASE}/api/openapi`
  - `name` y `applicationCategory` declarados
- **Verify:** el JSON-LD emitido contiene `actionApplication.url` == `/api/openapi`
  bien formado. (Verificación repo-local sobre el JSON-LD; no depende de red externa.)

## SCEN-116-003b — OpenAPI externo resoluble (advisory smoke check)
- **Given** la `actionApplication.url` emitida
- **When** se hace `GET` a esa URL
- **Then** responde `200` con un documento OpenAPI válido
- **Verify:** `curl -s -w '%{http_code}' ${API_BASE}/api/openapi` → 200 + JSON OpenAPI.
  **Advisory:** depende de un deployment de terceros (dashboard); si está caído, no
  invalida el cambio de este repo — se reporta aparte, no es gate del holdout.

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
- **Then** los tres apuntan al mismo dashboard (`${API_BASE}`), mientras el
  `EntryPoint` web sigue siendo el dominio propio de cada marca
  (`alquilatucarro.com`, `alquilame.co`, `alquicarros.com`)
- **Verify:** render en las 3 marcas → API base idéntica, `franchise.website` distinto

## Fuera de alcance (follow-up)
- Deep-link `urlTemplate` parametrizado por ciudad (necesita directorio
  `/api/locations` slug↔code↔ciudad).
