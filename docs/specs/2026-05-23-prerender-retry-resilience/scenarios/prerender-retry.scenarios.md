---
name: prerender-retry-resilience
created_by: scenario-driven-development
created_at: 2026-05-23T00:00:00Z
issues: ["deploy-flakiness"]
---

Resiliencia ante fallos transitorios de build. Diagnóstico (2026-05-23): los deploys de
Vercel fallan **intermitentemente** porque el prerender SERIAL de Nitro (concurrency=1)
corre `/api/rentacar-data` por ruta; si hay un hiccup transitorio (red build↔Supabase,
flake puntual) el fetch falla → el plugin re-lanza por diseño (fail-loud, issue #2) → ruta
500 → tras `retry:3`/`retryDelay:500ms` (ventana ~1.5s, demasiado corta) → "Exiting due to
prerender errors" → deploy ERROR. Supabase de prod está sana (Pro, ACTIVE_HEALTHY, sin
errores en logs). Fix build-scoped: ampliar la ventana de reintentos del prerender para
tolerar un blip de varios segundos. NO se toca el fetch (evitar colgar requests de runtime).

## SCEN-PR-1: el prerender tolera un blip transitorio ampliando la ventana de reintentos

**Given**: las 3 marcas (`ui-alquilatucarro`, `ui-alquilame`, `ui-alquicarros`) con su `nitro.prerender` en `nuxt.config.ts`.
**When**: se inspecciona la config efectiva de prerender de cada marca.
**Then**: cada marca declara `retry` ≥ 5 y `retryDelay` ≥ 3000 (ms) dentro de `nitro.prerender` — ampliando la ventana de recuperación de ~1.5s (default 3×500ms) a ≥15s, suficiente para un blip transitorio de varios segundos. Los valores son byte-idénticos entre las 3 marcas.
**Evidence**: lectura fs de los 3 `nuxt.config.ts`; aserción de que `retry`/`retryDelay` están presentes con los valores acotados; diff byte-idéntico entre marcas.

## SCEN-PR-2: el cambio no rompe el build

**Given**: una marca con la nueva config de prerender.
**When**: corre `nuxt build` con datos disponibles (ventana sana).
**Then**: el build completa (exit 0), prerenderiza las rutas y no introduce errores nuevos; el comportamiento en ventana sana es idéntico (los reintentos solo actúan ante fallo).
**Evidence**: exit code 0 de `pnpm build:<marca>`; ausencia de "Exiting due to prerender errors" en ventana sana.

> Nota de satisfacción honesta: el efecto real (menos deploys fallidos) es **operacional/empírico** y no se puede forzar en un build unitario (no hay forma determinística de inyectar el blip transitorio). SCEN-PR-1 fija la intención (config acotada, anti-regresión, patrón fs como `image-cost-config.test.ts`); SCEN-PR-2 garantiza no-regresión del build sano. El fix de fondo del stampede/SWR sigue siendo issue #16-F2/#7 (fuera de alcance aquí).
