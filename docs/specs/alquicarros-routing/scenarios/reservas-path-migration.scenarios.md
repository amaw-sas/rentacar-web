---
name: reservas-path-migration
created_by: orchestrator
created_at: 2026-07-08T00:00:00Z
---

# Holdout — alquicarros: wizard de `/reservas` por PATH (routing independence, fase 3)

Directiva: la búsqueda de `/reservas` va en el PATH (no query). alquicarros ya no tiene
`buscar-vehiculos` (borrado PR #304). Su `/reservas` es un WIZARD de 5 pasos. La migración
crea un árbol de páginas PATH bajo `/reservas` que hidrata la búsqueda vía `useSearchByRouteParams`
y monta el wizard; el paso sigue en `?paso=` (híbrido). El link del operador con categoría
(`/reservas/.../categoria/X`) revive el deep-link latente del wizard → Paso 3 (Seguro) con la gama
preseleccionada. alquilatucarro, alquilame y `packages/logic` intactos.

Decisiones del usuario: (1) esquema **PATH** (híbrido: `?paso=` en query); (2) el link operador
aterriza en **Seguro (Paso 3)** con la gama elegida.

---

## SCEN-ACP-01: `buscar-vehiculos` responde 301 hacia `/reservas` preservando el resto
- **Given** el sitio alquicarros servido
- **When** `GET /{city}/buscar-vehiculos/<cualquier resto>` — incl. variantes `referido/` y `categoria/`
- **Then** HTTP **301** con `Location` = `/reservas/<mismo resto>` (server middleware path→path; se
  descarta el segmento de ciudad y se reenvía el resto). No renderiza resultados bajo la URL original.
- **Evidence**: `curl -sI` status line `HTTP/1.1 301` + header `location:` de las 3 variantes.

## SCEN-ACP-02: el buscador de `/reservas` limpio navega a un PATH de resultados (Paso 2)
- **Given** alquicarros con backend de disponibilidad, en `/reservas` limpio (Paso 1, buscador)
- **When** el usuario elige sucursal + fechas + horas y pulsa "Buscar"
- **Then** la URL resultante es `/reservas/lugar-recogida/{slug}/lugar-devolucion/{slug}/fecha-recogida/{f}/fecha-devolucion/{f}/hora-recogida/{h}/hora-devolucion/{h}`
  (PATH, sin query string de búsqueda) y el wizard entra en **Paso 2 (Vehículo)** con la grid disponible.
- **Evidence**: `page.url()` con segmentos de path (no `?lugar_recogida=`); DOM del stepper en Paso 2 / cards visibles.

## SCEN-ACP-03: deep-link con categoría aterriza en Seguro (Paso 3) con gama preseleccionada (flujo operador)
- **Given** alquicarros con disponibilidad, gama `C` presente
- **When** se abre `/reservas/lugar-recogida/{slug}/.../categoria/c`
- **Then** el wizard arranca en **Paso 3 (Seguro)** con la gama `C` ya seleccionada (resumen persistente
  muestra la gama); el cliente avanza Seguro → Adicionales → Datos.
- **Evidence**: DOM — paso activo = Seguro; el resumen/sidebar muestra la gama C; no arranca en Paso 1/2.

## SCEN-ACP-04: SEO — `/reservas` limpio indexable, paths de resultados noindex
- **Given** alquicarros servido
- **When** `GET /reservas` (limpio) y `GET /reservas/lugar-recogida/.../` (resultados)
- **Then** `/reservas` limpio NO emite meta robots noindex (indexable), canonical `/reservas`; cualquier
  `/reservas/lugar-recogida/**` emite `robots: noindex, follow` + canonical `/reservas`. El sitemap excluye
  los paths de resultados de `/reservas` y ya no menciona `buscar-vehiculos`.
- **Evidence**: HTML renderizado (`curl` + grep `<meta name="robots"` y `<link rel="canonical"`); sitemap.

## SCEN-ACP-05: `?paso=` híbrido — el paso se refleja en query sobre la URL PATH
- **Given** una página PATH de resultados de alquicarros con la búsqueda hidratada
- **When** el cliente avanza de paso en el wizard (p.ej. a Adicionales)
- **Then** la URL refleja `?paso=adicionales` (via replaceState) SIN perder el PATH de búsqueda; recargar
  mantiene el PATH de búsqueda.
- **Evidence**: `page.url()` tras avanzar contiene el PATH `/reservas/lugar-recogida/...` + `?paso=adicionales`.

## SCEN-ACP-06: independencia — alquilatucarro/alquilame/logic intactos
- **Given** el diff de esta rama
- **When** `git diff --name-only` contra `origin/main`
- **Then** solo toca `packages/ui-alquicarros/**`, `e2e/**`, `playwright.config.ts` y `docs/specs/**`.
  NADA en `packages/logic/**`, `ui-alquilatucarro/**`, `ui-alquilame/**`. Y `/{city}/buscar-vehiculos/...`
  sigue resolviendo (200/render, no 301) en alquilatucarro.
- **Evidence**: salida de `git diff --name-only origin/main`; `curl` de una URL buscar-vehiculos en el dev de alquilatucarro → 200.

## SCEN-ACP-07: build/tests verdes
- **Given** la rama implementada
- **When** typecheck (alquicarros), unit (alquicarros), e2e `BRAND=alquicarros`
- **Then** pasan sin fallas nuevas vs baseline; los specs buscar-vehiculos-flow siguen ignorados solo en
  alquicarros; ningún test falla por el cambio.
- **Evidence**: `pnpm --filter ui-alquicarros test` (delta 0 vs baseline), typecheck (0 nuevos), e2e dirigido.
