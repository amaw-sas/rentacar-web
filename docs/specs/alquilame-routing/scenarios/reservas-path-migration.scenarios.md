---
name: reservas-path-migration
created_by: orchestrator
created_at: 2026-07-08T00:00:00Z
---

# Holdout — alquilame: `/reservas` por PATH + quitar `buscar-vehiculos` + flujo operador

Directiva de independencia de enrutamiento (2ª fase). `/{city}/buscar-vehiculos/...` debe existir
SOLO en alquilatucarro. En alquilame se elimina y `/reservas` pasa a usar params por PATH
(heredando la estructura de buscar-vehiculos, sin el segmento `[city]`), con la categoría en el path
para el link del operador. El deep-link con categoría debe aterrizar en la CARD con selectores de
seguro/adicionales visibles (sin auto-abrir el slideover). alquilatucarro y `packages/logic` intactos.

Decisiones del usuario: (1) esquema **PATH** para `/reservas`; (2) arreglar el flujo del operador
(card con selectores, no salto al resumen); (3) redirect 301 preservando params (path→path, opción B
si el matcher lo permite; si no, 301 plano → `/reservas`).

---

## SCEN-AL-01: `buscar-vehiculos` responde 301 hacia `/reservas`
**Given**: el sitio alquilame servido
**When**: `GET /{city}/buscar-vehiculos/<cualquier combinación de params>` — incluidas las variantes
`.../referido/{referido}/...` y `.../categoria/{categoria}/...`
**Then**: HTTP **301**; `Location` es `/reservas/<mismo resto de path>` (opción B, preserva la
búsqueda) o `/reservas` (opción A). NO se renderiza ninguna página de resultados bajo la URL original.
**Evidence**: `curl -sI` status line = `HTTP/1.1 301` + header `location:` de las 3 variantes.

## SCEN-AL-02: el buscador de `/reservas` navega a un PATH de resultados
**Given**: alquilame con backend de disponibilidad disponible, en `/reservas` limpio
**When**: el usuario elige sucursal + fechas + horas en el `<Searcher>` y pulsa "Buscar"
**Then**: la URL resultante es `/reservas/lugar-recogida/{slug}/lugar-devolucion/{slug}/fecha-recogida/{fecha}/fecha-devolucion/{fecha}/hora-recogida/{hora}/hora-devolucion/{hora}`
(PATH, sin query string de búsqueda) y la grid de categorías con disponibilidad se renderiza.
**Evidence**: DOM/URL tras el submit (`page.url()` con segmentos de path, no `?lugar_recogida=`); las
`CategoryCard` visibles en el DOM.

## SCEN-AL-03: deep-link con categoría aterriza en la card (flujo operador)
**Given**: alquilame con disponibilidad, gama `C` presente
**When**: se abre `/reservas/lugar-recogida/{slug}/.../categoria/c`
**Then**: la card de la gama `C` queda **preseleccionada/enfocada** (scroll a ella) con sus selectores
de **seguro (Básico/Total) y adicionales visibles**, y el **slideover CERRADO**. Al pulsar "Solicitar
este vehículo" se abre el resumen y luego el formulario de datos.
**Evidence**: snapshot del DOM — el `[role=dialog]`/slideover NO está montado en el estado inicial; la
card `C` está en viewport con los toggles de seguro/adicionales; tras click en "Solicitar", el
slideover aparece en paso resumen.

## SCEN-AL-04: SEO — `/reservas` limpio indexable, paths de resultados noindex
**Given**: alquilame servido
**When**: se solicita `GET /reservas` (limpio) y `GET /reservas/lugar-recogida/.../` (con resultados)
**Then**: `/reservas` limpio NO emite meta robots noindex (indexable), canonical `/reservas`; cualquier
`/reservas/lugar-recogida/**` emite `robots: noindex, follow` + canonical `/reservas`. El sitemap
excluye los paths de resultados de `/reservas` y ya no menciona `buscar-vehiculos`.
**Evidence**: HTML renderizado (`curl` + grep de `<meta name="robots"` y `<link rel="canonical"`); el
sitemap generado sin entradas `buscar-vehiculos` y con exclusión de `/reservas/lugar-recogida/**`.

## SCEN-AL-05: ningún enlace vivo de alquilame apunta a `buscar-vehiculos`
**Given**: el código de `packages/ui-alquilame/app`
**When**: se busca cualquier target de navegación vivo hacia `buscar-vehiculos`
(`:to`, `navigateTo`, `router.push`, `href`, reconstrucción de URL)
**Then**: no existe ninguno: `sindisponibilidad.vue` reconstruye un PATH `/reservas/...`; `SelectBranch`
eliminado. Solo quedan referencias en comentarios y en el dead-code diferido (rama `mode==='results'`
de CityPage/Hero), inalcanzable.
**Evidence**: `grep -rn buscar-vehiculos packages/ui-alquilame/app` filtrado por patrones de navegación
→ 0 matches vivos; lista de matches restantes = comentarios/dead-code.

## SCEN-AL-06: independencia — alquilatucarro/alquicarros/logic intactos
**Given**: el diff de esta rama
**When**: `git diff --name-only` contra `origin/main`
**Then**: solo toca `packages/ui-alquilame/**`, `e2e/**`, `playwright.config.ts` y `docs/specs/**`.
NADA en `packages/logic/**`, `packages/ui-alquilatucarro/**`, `packages/ui-alquicarros/**`. Y
`/{city}/buscar-vehiculos/...` sigue resolviendo (200/render, no 301) en alquilatucarro.
**Evidence**: salida de `git diff --name-only origin/main`; `curl` de una URL buscar-vehiculos en el
dev de alquilatucarro → 200.

## SCEN-AL-07: build/tests verdes
**Given**: la rama implementada
**When**: se corren typecheck (alquilame), unit (alquilame) y e2e `BRAND=alquilame`
**Then**: pasan: unit sin `SelectBranch.test`; specs del flujo buscar-vehiculos que hard-assertan la
ruta se saltan SOLO en alquilame (siguen corriendo en alquilatucarro); ningún test falla por el cambio.
**Evidence**: salida de `pnpm --filter ui-alquilame test` (0 fallas nuevas vs baseline), typecheck
(0 errores en archivos tocados), y la corrida e2e `BRAND=alquilame`.
