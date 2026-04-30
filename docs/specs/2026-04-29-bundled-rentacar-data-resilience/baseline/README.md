# Baseline snapshot — pre-bundled-fix

**Capturado:** 2026-04-30 al iniciar Step 1 del plan
**Branch base:** `main` @ commit `952f63b`
**Branch de trabajo:** `fix/rentacar-data-resilience-bundled`

## Estado del repo en `main`

| Check | Estado | Razón |
|---|---|---|
| `pnpm typecheck` | **ROJO** (1531 errores únicos en 3 marcas) | Pre-existente, fuera del scope del bundle. |
| `pnpm lint` | **ROJO** (`eslint: not found`) | Script declarado pero `eslint` NO está en `devDependencies` de ninguna marca. Dead script. |

## Archivos contributing más errores

```
typecheck-alquilatucarro.txt   634 errors
typecheck-alquilame.txt        449 errors
typecheck-alquicarros.txt      448 errors
```

Cada archivo `.txt` contiene `file:line:column: error TS####: message` ordenado y deduplicado.

## Causas raíz identificadas (out of scope del bundle)

### 1. Migración Firebase → Supabase incompleta (Phase 3)

Per `docs/specs/2026-03-25-migration-firebase-to-vercel-supabase.md`, Phase 3 incluía:
> - "Migrar upload de imágenes: Firebase Storage → Supabase Storage"
> - "Reescribir server routes del blog: Firestore → Supabase queries"

**Realidad observada en main:**
- `packages/ui-{brand}/firebase.json` existe en las 3 marcas.
- `packages/ui-{brand}/server/utils/firebase-storage.ts` existe y tiene callers activos:
  - `server/plugins/content-dynamic-loader.ts`
  - `server/api/blog/post/[slug].delete.ts`
  - `server/api/blog/wordpress-sync.post.ts`
  - `server/api/blog/upload-image.post.ts`
  - `server/api/blog/debug.get.ts`
- Tests con `vi.mock('~/server/utils/firebase-storage')` siguen activos.

Phase 3 **parcialmente migrada** — Supabase para datos de reservas (categorías, branches, extras), Firebase aún para storage del blog.

### 2. Drift de config entre marcas

`ui-alquilatucarro/nuxt.config.ts` está más actualizada que las otras 2:
- Comment "Pinia config removed - stores are auto-imported from logic layer via extends" — el bloque `pinia: {}` fue removido.
- `ui-alquilame/nuxt.config.ts` y `ui-alquicarros/nuxt.config.ts` mantienen el bloque viejo `pinia: { ... }`.
- Module order también difiere.

Esto explica por qué alquicarros + alquilame **no resuelven Nuxt auto-imports** en `packages/logic/src/composables/*` cuando typechecean. La migración del cleanup-dead-configs (#1) fue parcial y dejó fuera 2 marcas.

### 3. `eslint` declarado pero no instalado

`packages/ui-{brand}/package.json` tiene `"lint": "eslint ."` pero ningún paquete declara `eslint` en `devDependencies`. Script muerto.

## Implicación para acceptance del bundle fix

Plan original §Step 1–6 acceptance: *"`pnpm typecheck` verde"*. **Imposible cumplir** dado el baseline.

**Acceptance ajustado (estrategia delta):**

Para cada step, definir verde como:

> Ejecutar `pnpm --filter ui-{brand} typecheck 2>&1 | grep -E "error TS" | sort -u > /tmp/current.txt`
> y `comm -13 docs/specs/2026-04-29-bundled-rentacar-data-resilience/baseline/typecheck-{brand}.txt /tmp/current.txt` debe ser **vacío** (sin nuevos errores) para las 3 marcas.

Si `comm` muestra deletions (errores que mis cambios eliminan accidentalmente) → bonus aceptable, no falla.

Para `pnpm lint`: **excluido** de acceptance del bundle. Issue separado para reactivar lint.

## Follow-up issues recomendados (post-bundle)

1. **Phase 3 completion:** migrar `firebase-storage.ts` blog flow a Supabase Storage. Eliminar `firebase.json` y dep de `firebase-admin`.
2. **Config drift:** propagar `nuxt.config.ts` de alquilatucarro a alquilame + alquicarros (pinia removal + module order).
3. **Reactivar lint:** agregar `eslint` + config compartida en cada UI package, o consolidar en root.
