# Plan de implementación — #116 ReserveAction `actionApplication`

**Fecha:** 2026-06-16
**Spec:** `../design.md` · **Holdout:** `../scenarios/issue-116.scenarios.md`
**Worktree:** `.worktrees/issue-116-reserveaction-webapi` · rama `feat/issue-116-reserveaction-actionapplication`

Cambio pequeño y acotado (2 archivos). El diseño ya está aprobado y revisado, así que
este plan solo ordena la implementación SDD con criterios de aceptación atados a los
escenarios observables. 3 pasos: foundation (config) → core (JSON-LD) → integración
(verificación runtime del JSON-LD renderizado, que es el mecanismo de observación de
este feature SEO).

## File structure (decomposición)

| Archivo | Acción | Responsabilidad única |
|---------|--------|------------------------|
| `packages/logic/nuxt.config.ts` | crear bloque `runtimeConfig` | Exponer `public.rentacarPublicApiBase` a las 3 marcas (default fallback `-delta`, overridable `NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE`). Único lugar donde vive la URL base del dashboard. |
| `packages/logic/src/composables/useBaseSEO.ts` | modificar bloque `potentialAction` (líneas 88-105) + import | Enriquecer `ReserveAction.target` con el `EntryPoint` programático + `actionApplication`; leer la base de `useRuntimeConfig()`. |

Sin nuevos consumidores; solo cambia output JSON-LD. Files que cambian juntos: ninguno
más — el composable consume el config, frontera limpia vía `useRuntimeConfig()`.

## Prerequisites

- `pnpm install` en el worktree (deps).
- `.env.local` copiado a la raíz del worktree para el dev server (plugin rentacar-data
  hard-throws sin él → 500 en toda página). Dev port worktree: 4000.
- Sin migraciones, sin cambios de backend (D2 ya desplegado).

## Implementation Steps

### Step 1 — `runtimeConfig.public.rentacarPublicApiBase` en el layer | Size: S | Deps: none

**Qué:** crear el bloque `runtimeConfig` (hoy inexistente) en
`packages/logic/nuxt.config.ts`:
```ts
runtimeConfig: {
  public: {
    // Base pública de la API del dashboard (D2). Override en prod vía
    // NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE; el default es fallback de un alias
    // de proyecto Vercel (frágil) — ver spec.
    rentacarPublicApiBase: 'https://rentacar-dashboard-delta.vercel.app',
  },
},
```

**Escenario implícito:** *Given* las 3 marcas extienden el layer, *when* leen
`useRuntimeConfig().public.rentacarPublicApiBase`, *then* obtienen la base (default o
override) — habilita SCEN-116-005 (base idéntica brand-agnóstica).

**Acceptance:**
- [ ] Bloque `runtimeConfig.public` creado con la key y comentario.
- [ ] En una marca, el valor resuelve (default) y el override por `NUXT_PUBLIC_*` lo
      reemplaza (smoke: log temporal o typecheck del acceso).
- [ ] `ionice -c3 nice -n19 pnpm --filter ui-alquilatucarro typecheck` verde para el
      acceso `useRuntimeConfig().public.rentacarPublicApiBase` (gate temprano de
      SCEN-116-004: si sale `unknown`, resolver con key en marca o augmentación
      `.d.ts` — **NUNCA** cast).

### Step 2 — enriquecer `ReserveAction` en `useBaseSEO.ts` | Size: M | Deps: Step 1

**Qué:** en el bloque `potentialAction` (líneas 88-105):
1. Import: añadir `SoftwareApplication` a la línea de tipos `schema-dts`.
2. Leer base: `const { rentacarPublicApiBase } = useRuntimeConfig().public` (al inicio
   del composable, junto a `useAppConfig()`).
3. `target` pasa de objeto único a **array de dos** EntryPoints:
   - #1 web: idéntico al actual (`urlTemplate: franchise.website`, `actionPlatform`).
   - #2 programático: `urlTemplate: \`${rentacarPublicApiBase}/api/reservations\``,
     `httpMethod: 'POST'`, `contentType: 'application/json'`,
     `encodingType: 'application/json'`,
     `actionApplication: <SoftwareApplication>{ '@type': 'SoftwareApplication',
     name: 'Rentacar Reservations API', applicationCategory: 'BusinessApplication',
     url: \`${rentacarPublicApiBase}/api/openapi\` }`.
4. `result: RentalCarReservation` se conserva. Actualizar el comentario (ya no "se
   añade cuando cierre D2" — D2 cerró).

**Escenario implícito:** *Given* el JSON-LD del home, *when* un agente recorre
`target`, *then* encuentra el EntryPoint web (SCEN-001) **y** el programático con
`httpMethod:POST` (SCEN-002) cuyo `actionApplication.url` apunta al OpenAPI (SCEN-003).

**Acceptance (atado a holdout):**
- [ ] `target` es `EntryPoint[]`; web EntryPoint sin cambios → **SCEN-116-001**.
- [ ] EntryPoint programático con `httpMethod/contentType/encodingType` + urlTemplate a
      `/api/reservations` → **SCEN-116-002**.
- [ ] `actionApplication` `SoftwareApplication` con `name`, `applicationCategory`, `url`
      a `/api/openapi` → **SCEN-116-003**.
- [ ] `result` sigue `RentalCarReservation`.
- [ ] typecheck verde; `grep` confirma cero `@ts-`/`@ts-ignore` y cero
      `'@type': 'WebAPI'` dentro de `actionApplication` → **SCEN-116-004**.

### Step 3 — verificación runtime del JSON-LD renderizado | Size: S | Deps: Step 2

**Qué:** levantar dev en el worktree (port 4000) y observar el `<script
type="application/ld+json">` del home. Este paso ES la observación del feature (SEO
structured data no tiene capa de unit test; el holdout son checks sobre el render).

**Acceptance:**
- [ ] `curl -s localhost:4000 | grep` del JSON-LD: presente el EntryPoint web original
      y el programático con `"httpMethod":"POST"` y `urlTemplate` a `/api/reservations`
      → **SCEN-116-001 / 002**.
- [ ] `actionApplication.url` == `.../api/openapi` en el JSON-LD emitido →
      **SCEN-116-003** (gating, repo-local).
- [ ] Smoke advisory: `curl -s -w '%{http_code}' <base>/api/openapi` → 200 + OpenAPI
      válido → **SCEN-116-003b** (no gate; si el dashboard está caído, se reporta
      aparte).
- [ ] Repetir el render en una 2ª marca (alquilame/alquicarros) → API base idéntica,
      `franchise.website` distinto → **SCEN-116-005**. (Brand-agnóstico por construcción
      del layer; basta validar 2 marcas, no las 3 — se documenta el muestreo.)
- [ ] Cero errores de consola / requests fallidos en el render del home.

## Testing Strategy

- **Type safety:** `pnpm --filter ui-<brand> typecheck` (una marca, build-mode; NUNCA
  root — disco WSL2). Es el gate de SCEN-116-004.
- **Observable (holdout):** checks `curl`/grep sobre el JSON-LD renderizado +
  smoke externo al OpenAPI. No hay unit tests nuevos: el feature es structured data
  observada en el render, alineado con el patrón de #64.
- **No regresión:** el EntryPoint web de #64 debe sobrevivir (SCEN-116-001).

## Rollout Plan

- **Deploy:** merge a `main` → Vercel build por marca. ⚠️ Prod DEBE setear
  `NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE` en las 3 marcas (Vercel env) antes/junto al
  deploy — el default `-delta` es frágil (ver spec). Sin esa env, prod emite el alias
  `-delta` (funciona hoy, pero atado a un alias de proyecto Vercel).
- **Monitoring:** validar JSON-LD del home en prod tras deploy (Rich Results / curl).
- **Rollback:** revert del commit; cambio aislado a JSON-LD, sin estado ni migración.

## Open / deferred

- Tipado del key del layer en `runtimeConfig.public` — única incógnita; resuelta en
  Step 1 vía typecheck (sin cast).
- Deep-link por ciudad — follow-up (necesita `/api/locations`).
- String stale del host pelado en el OpenAPI del dashboard — lo posee el dashboard,
  follow-up cross-repo.
