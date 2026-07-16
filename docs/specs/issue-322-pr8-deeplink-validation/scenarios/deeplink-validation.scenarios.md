---
name: deeplink-validation
created_by: agent
created_at: 2026-07-16T19:00:00Z
issue: 322
pr_package: 8
---

# Issue 322 · PR8 — Deep-links validados y búsqueda sin duplicados

Holdout para el bloque B restante: alquicarros no valida deep-links,
`missing_parameters` es silencioso, y hay instancias duplicadas de
useSearch/Searcher.

## SCEN-322-V01 — alquicarros autocorrige deep-links inválidos

**Given** un deep-link PATH de /reservas en alquicarros con fecha de recogida en el pasado
**When** el usuario navega a esa URL
**Then** el middleware corrige los parámetros (redirect a fechas válidas) en lugar de mostrar «Sin vehículos» vacío

**Evidence**: middleware declarado en las páginas PATH de alquicarros + unit/e2e test de la corrección.

## SCEN-322-V02 — validateSearchParams tiene UNA implementación compartida

**Given** las 3 marcas del monorepo
**When** se busca la lógica de validación de deep-links
**Then** vive en `packages/logic` (una sola fuente) y las marcas la consumen — no hay dos copias de ~270 líneas

**Evidence**: estructura de archivos + imports; las copias por marca eliminadas o reducidas a wrapper.

## SCEN-322-V03 — missing_parameters deja de ser silencioso

**Given** una búsqueda que dispara `missing_parameters` (p. ej. enlace sin horas)
**When** `search()` recibe ese error
**Then** el usuario ve un mensaje de UI (toast o inline) y `pending` termina en false — la página no queda en blanco sin explicación

**Evidence**: unit test del store que asserta el error visible.

## SCEN-322-V04 — Los watchers de useSearch se registran una sola vez por página

**Given** la página de resultados hidratada por parámetros de ruta
**When** se instancia la sincronización de búsqueda
**Then** no se crea una instancia adicional de useSearch con sus 8 watchers duplicados

**Evidence**: unit test o assert estructural — useSearchByRouteParams/useSearchByQueryParams reutilizan una única instancia.

## SCEN-322-V05 — /reservas de alquilame monta UN solo Searcher

**Given** la página /reservas de alquilame renderizada
**When** se inspecciona el DOM
**Then** existe exactamente una instancia montada de `<Searcher>` (la variante desktop/móvil no montada no existe en el DOM)

**Evidence**: gate con useBreakpoints + v-if (patrón ghost-calendar del repo) + test.
