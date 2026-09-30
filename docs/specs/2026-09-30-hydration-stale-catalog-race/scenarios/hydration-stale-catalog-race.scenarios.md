---
name: hydration-stale-catalog-race
created_by: orchestrator
created_at: 2026-09-30T04:10:00Z
---

# Contexto

Diagnóstico en vivo (2026-09-30, producción alquilatucarro.com): el HTML de ISR
llega con el catálogo embebido a >=1 h (`CATALOG_MAX_AGE_MS`). En el cliente,
`installRouteCatalogFreshness.check()` corre en `app:mounted` — ANTES de que la
Suspense de la página termine de hidratar — y `fetchFresh()` vacía el catálogo
(`clearCatalog`) antes de pedir el nuevo. Consecuencias observadas:

- 404 fantasma: el setup de `[city]/index.vue` corre contra el catálogo vacío,
  `getCityById` no encuentra la ciudad y lanza `createError 404 fatal` aunque el
  servidor respondió 200 (reproducido determinísticamente en dev forzando
  `hasFreshCatalog -> false` en cliente: `is404: true`).
- Mismatch de hidratación: `Hydration node mismatch — rendered on server:
  div.flex.flex-col.lg:grid.lg:grid-cols-10.lg:gap-10 … expected on client:
  Symbol(v-cmt)` en `<Index>` (el `v-if="city"` de la página se vuelve
  comentario).

Defecto 3 (independiente): entre el primer paint y el fin de la hidratación,
`SelectBranch` (portada) se ve interactivo pero traga los clics en silencio.

## SCEN-001: el refresco por vencimiento nunca deja el catálogo vacío
**Given**: catálogo compartido cargado con `catalogFetchedAt` vencido (>=1 h) y `cities` con Bogotá
**When**: `check()` dispara el refresco y el `$fetch` del catálogo fresco aún no resuelve
**Then**: durante toda la ventana en vuelo, `catalog.cities` sigue conteniendo Bogotá y `loaded` sigue `true`; al resolver, el catálogo muestra los datos frescos
**Evidence**: aserciones vitest sobre el estado del ref DURANTE el fetch en vuelo (inspeccionado desde el mock de `$fetch`) y después de resolver

## SCEN-002: un refresco fallido conserva el catálogo viejo y reintenta
**Given**: catálogo vencido con datos completos; `$fetch` rechaza (red caída)
**When**: `check()` dispara el refresco y falla
**Then**: `catalog.cities` conserva los datos previos (nunca se vacía), y queda programado un reintento
**Evidence**: aserciones vitest sobre el ref tras el rechazo + timer de reintento pendiente (fake timers)

## SCEN-003: ninguna mutación del catálogo mientras hidrata
**Given**: `nuxtApp.isHydrating === true` y catálogo vencido
**When**: `check()` es invocado (p. ej. desde el hook `app:mounted`)
**Then**: no se dispara ningún `$fetch` ni mutación del catálogo; el trabajo queda diferido a `app:suspense:resolve`, y al dispararse ese hook (ya con `isHydrating` false) el refresco corre
**Evidence**: vitest — `$fetch` no llamado mientras `isHydrating`; llamado exactamente una vez tras invocar el callback registrado en `app:suspense:resolve`

## SCEN-004: el piso de precio nulo sigue llegando con el refresco horario
**Given**: catálogo vencido con `dayPriceFloorGross: 157696.09`; el servidor ahora responde `dayPriceFloorGross: null`
**When**: el refresco corre y resuelve
**Then**: la clave queda PRESENTE y con valor `null` (contrato absent!=null intacto)
**Evidence**: test existente `the hourly refresh drops a floor the server no longer publishes` sigue en verde sin modificarse

## SCEN-005: el 404 de ciudad solo se lanza con catálogo poblado
**Given**: página `[city]` con catálogo poblado que NO contiene el slug pedido
**When**: el setup de la página corre
**Then**: 404 («Ciudad no encontrada»)
**Given**: página `[city]` con catálogo VACÍO en cliente (estado de fallo de datos)
**When**: el setup de la página corre
**Then**: NUNCA un 404 (la URL puede ser válida); el error es 503 de datos no disponibles
**Evidence**: vitest del guard de la página (unidad extraída) cubriendo ambos estados

## SCEN-006: «Elige una ciudad» nunca traga un clic en silencio
**Given**: portada servida por SSR, hidratación aún NO terminada
**When**: el usuario hace clic en el control «Elige una ciudad»
**Then**: el control muestra un estado visible de carga; al terminar la hidratación el diálogo de ciudades se abre solo (el clic no se pierde)
**Given**: hidratación terminada
**When**: clic en el control
**Then**: el diálogo abre de inmediato, sin estado de carga
**Evidence**: e2e Playwright — clic disparado apenas existe el DOM del control; aserción del diálogo visible después; consola sin errores

## SCEN-A (producción/preview, del encargo): 20 cargas de /bogota, /medellin y /cartagena
**Evidence**: 0 renders del 404 de cliente con respuesta 200 del servidor (navegador real contra la preview de Vercel)

## SCEN-B: consola con 0 mensajes «Hydration» en portada, ciudad y resultados
**Evidence**: captura de consola por carga en navegador real

## SCEN-C: clic temprano en «Elige una ciudad» abre el diálogo o muestra carga
**Evidence**: e2e + verificación manual en navegador real
