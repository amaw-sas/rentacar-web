# Diseño — #116: enriquecer `ReserveAction` con la capa programática (D2)

> Épico #63 (auditoría agéntica 2026-05-26) · Follow-up de #64 · Layer `logic` → 3 marcas
> Desbloqueado por D2 (`amaw-sas/rentacar-dashboard#73`, CLOSED 2026-06-10, PR dashboard#120)

## Problema

#64 declaró un `ReserveAction` con un único `EntryPoint` web (`urlTemplate:
franchise.website`). Eso cubre la **ruta de descubrimiento humana/web**: un agente
que lee el JSON-LD entiende que el sitio permite reservar, pero solo tiene una URL
de home para "ejecutar" la acción — no un contrato programático.

Quedó diferida la **ruta agéntica fiable**: un puntero resoluble a la API pública
documentada (creación de reservas + OpenAPI), que es justo lo que entregó D2.

## Decisión

`target` del `ReserveAction` pasa de un `EntryPoint` único a un **array de dos**
(patrón canónico schema.org para una acción ejecutable por web *o* por API):

1. **EntryPoint web (sin cambios)** — `urlTemplate: franchise.website`,
   `actionPlatform: [Desktop, Mobile]`. Ruta de descubrimiento humana.
2. **EntryPoint programático (NUEVO)** — ruta agéntica:
   - `urlTemplate: ${API_BASE}/api/reservations` (POST de creación de reserva).
   - `httpMethod: 'POST'`, `contentType: 'application/json'`,
     `encodingType: 'application/json'`.
   - `actionApplication` → `SoftwareApplication` con:
     - `name: 'Rentacar Reservations API'`
     - `applicationCategory: 'BusinessApplication'`
     - `url: ${API_BASE}/api/openapi` (el OpenAPI fetchable de D2)

`result` → `RentalCarReservation` se conserva.

### Modelo de auth (verificado en `middleware.ts` del dashboard)

- `/api/openapi` y `/api/locations` → **totalmente públicos, sin key** (la data ya
  es pública en los sitios de marca). El `actionApplication.url` es resoluble por
  cualquier agente sin credenciales.
- `/api/reservations` → requiere `x-api-key` (documentado en el propio OpenAPI bajo
  `apiKey`). Advertir este `EntryPoint` **no es engañoso**: es justo la "ruta MCP/API
  (requiere registrar el conector)" del épico #63 — el agente lee el OpenAPI vía
  `actionApplication.url`, descubre el requisito de key, y registra el conector. La
  discoverability apunta a la doc de auth; el endpoint no se presenta como anónimo.

### Nota de tipado (tensión issue vs. schema.org)

El issue pide literalmente `@type: WebAPI`. Ground truth de `schema-dts@1.1.5`:
`actionApplication` (propiedad de `EntryPoint`) exige `SoftwareApplication`;
`WebAPI` es subtipo de `Service` y **no es asignable** a `actionApplication`.
Forzarlo requeriría un cast mentiroso que rompe el tipado estricto del proyecto y
produce JSON-LD semánticamente dudoso.

**Resolución:** el nodo se modela como `SoftwareApplication`
(`'@type': 'SoftwareApplication'`) y referencia el OpenAPI vía `url`. Cumple el
escenario observable del issue ("`actionApplication` resoluble hacia la API pública
documentada") sin sacrificar validez. Se descartó modelar un nodo `WebAPI` separado
con `documentation` porque no se conecta al `ReserveAction` y es menos descubrible
para un agente que recorre `potentialAction`.

## Origen de `API_BASE`

**`runtimeConfig.public.rentacarPublicApiBase`**, con default declarado en el layer
`packages/logic/nuxt.config.ts` (heredado por las 3 marcas — la API del dashboard es
un único chokepoint brand-agnóstico hacia Localiza). El composable lo lee con
`useRuntimeConfig().public.rentacarPublicApiBase`.

- **Default:** `https://rentacar-dashboard-delta.vercel.app` — alias de **producción**
  del proyecto Vercel del dashboard. ⚠️ El host "pelado" `rentacar-dashboard.vercel.app`
  (que cita la *descripción* del OpenAPI) **no resuelve** (`DEPLOYMENT_NOT_FOUND`); es
  un string stale. El alias real es `-delta`, verificado live:
  `GET /api/openapi` → 200 (OpenAPI 3.0.3) y `GET /api/locations` → 200 (31 sedes).
  Coincide con el `NUXT_RENTACAR_ADMIN_URL` de prod (`.env`, comentado).
- **Override por entorno:** `NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE` (p.ej. localhost en
  dev, preview vs prod). Se elige `runtimeConfig.public` sobre una constante hardcodeada
  precisamente porque la fragilidad del host quedó demostrada.

## Alcance

- **Archivos:**
  - `packages/logic/nuxt.config.ts` — añadir `runtimeConfig.public.rentacarPublicApiBase`.
  - `packages/logic/src/composables/useBaseSEO.ts` — bloque `potentialAction`.
- **Imports:** añadir `SoftwareApplication` a los tipos de `schema-dts`.
- **Blast radius:** `useBaseSEO` corre site-wide en las 3 marcas. El nuevo
  `EntryPoint` aparece junto al web existente. Nuevo key en `runtimeConfig.public`
  (aditivo, con default — no rompe builds existentes). **Sin consumidores de código**
  — solo enriquece el output JSON-LD. Sin cambios de API, datos ni runtime de reservas.

## Fuera de alcance

- **Deep-link por ciudad** (`urlTemplate` parametrizado): diferido (YAGNI). Necesita
  wiring del directorio `/api/locations` (slug↔code↔ciudad) y lógica por-ciudad en
  un composable hoy por-marca. Follow-up si aporta valor SEO real.
- **Cambios en dashboard:** D2 ya está cerrado y desplegado.

## Verificación

- `pnpm --filter ui-<brand> typecheck` (una marca, no root — disco WSL2).
- Render real del JSON-LD: levantar dev y `curl | grep`/agent-browser sobre el
  `<script type="application/ld+json">` del home → confirmar el segundo EntryPoint
  con `httpMethod` y el `actionApplication.url` al OpenAPI.
- Smoke check externo (advisory): `GET ${API_BASE}/api/openapi` → 200 + OpenAPI válido.

## Escenarios observables (holdout)

Ver `scenarios/issue-116.scenarios.md`.
