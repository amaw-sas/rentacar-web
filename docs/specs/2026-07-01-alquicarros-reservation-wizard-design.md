# Wizard de reserva acompañada — alquicarros

**Fecha:** 2026-07-01
**Estado:** diseño aprobado; pendiente de implementación
**Marca:** alquicarros (aislado; hermanas intactas)
**Relacionado:** #210 (reskin naranja — este wizard reemplaza el bloque de resultados F3), F3-citypage scenarios

## Qué y por qué

alquicarros diverge del flujo de resultados que comparten alquilatucarro y
alquilame. Hoy las tres marcas muestran, tras la búsqueda, un grid de tarjetas de
gama donde cada tarjeta lleva inline la selección de seguro y de adicionales, y un
slideover de dos pasos para confirmar. El cliente decide todo de golpe, sin guía.

alquicarros lo convierte en un **wizard de 5 pasos** que acompaña al cliente y
simplifica la decisión: agrupa las gamas en segmentos comerciales, dedica un paso
a elegir vehículo, otro a seguro, otro (opcional) a adicionales, y mantiene un
**resumen de selección + precios siempre visible**. El motor de disponibilidad, el
store de reserva y el endpoint de `record` no cambian: el wizard es una capa de
presentación/orquestación sobre el estado de dominio que ya existe.

Esta es una **decisión de producto**, no parte del reskin. #210 preservaba el
comportamiento del motor; aquí lo divergimos a propósito, solo para alquicarros.

## Decisiones tomadas (brainstorming)

1. **Unidad de selección:** segmento → vehículo (2 niveles). El grupo simplifica
   la entrada, pero el vehículo (gama) sigue siendo la unidad reservada. El cliente
   conserva el control de qué carro específico reserva.
2. **Alcance del stepper:** wizard completo desde cero, incluyendo la búsqueda como
   Paso 1.
3. **Ubicación vs SEO:** `/reservas` es la entrada canónica limpia del wizard (Paso 1).
   El wizard **es la experiencia de resultados**, así que el mismo componente se monta
   también en las rutas de resultados por ciudad (`/[city]/buscar-vehiculos/…`), donde
   `CityPage mode="results"` renderiza el wizard en vez del grid actual. Las landings de
   ciudad siguen siendo SEO puro; las rutas de resultados conservan su SEO actual
   (canonical a `/[city]`, sin `noindex` — ver Data flow). La indexación se preserva.
4. **Divergencia:** solo alquicarros por ahora. Todo el código nuevo es marca-local;
   `logic/` no se toca; cero riesgo para las hermanas.
5. **Layout del resumen:** sidebar fijo pegajoso en desktop; barra inferior
   expandible en móvil.

## Arquitectura y ubicación

Todo el código nuevo vive en `packages/ui-alquicarros/`. De `logic/` se reúsan de
**solo lectura** (sin modificarlos): `useSearch`, `useSearchByRouteParams`,
`useCategory`, `useStoreSearchData` (incluida su ref `selectedCategory`, la instancia
de `useCategory` de la gama elegida), `useStoreReservationForm`, `pickPriceForDate`,
`pickEffectiveTotalCoverageUnitCharge`, el tipo `ExtrasData`,
`mapAvailabilityFetchError` y `classifyOneWayDistanceError`.

De piezas **brand-local ya existentes** se reúsa `app/composables/useSearchByQueryParams.ts`
(driver de búsqueda desde el query string en `/reservas`) — el wizard se apoya en él
para la sincronización de query + el parámetro `paso`.

Árbol nuevo `app/components/wizard/`:

| Componente | Responsabilidad |
|---|---|
| `ReservationWizard.vue` | Shell: barra de pasos + `<main>` + `<aside>` resumen. Orquesta la máquina de pasos y el gating de navegación. |
| `WizardSummary.vue` | Resumen persistente. Sidebar sticky (desktop) / barra inferior expandible (móvil). Lee estado de dominio, no lo posee. |
| `WizardStepper.vue` | La barra de pasos; cada paso alcanzado es clicable para editar. |
| `steps/StepSearch.vue` | Paso 1. Reúsa el `Searcher` dentro del shell. |
| `steps/StepVehicle.vue` | Paso 2. Nivel 1 tiles de segmento + nivel 2 vehículos del segmento. |
| `steps/StepCoverage.vue` | Paso 3. Comparador Básico vs Total. |
| `steps/StepExtras.vue` | Paso 4 (opcional). Adicionales + "Omitir". |
| `steps/StepData.vue` | Paso 5. Reúsa `ReservationForm`. |
| `VehicleSegmentTile.vue` | Tile de segmento (nivel 1) con "desde $X". |

Composable brand-local `app/composables/useReservationWizard.ts`: máquina de pasos
(`currentStep`, `maxReachedStep`, `goTo/next/back`, `canAdvance` por paso). No
duplica estado de dominio — deriva de `reservationForm` + `selectedCategory`.

## Taxonomía de segmentos

Config brand-local `app/config/vehicleSegments.ts`: array ordenado
`{ id, label, icon, gamaCodes }` + helper `segmentForCode(code)` con fallback.

| Segmento | Gamas | Nota |
|---|---|---|
| Económicos | `C`, `CX` | Compactos ágiles de ciudad, precio más bajo. |
| Sedanes | `F`, `FX`, `FL`, `FU`, `FY` | Más baúl y confort, familia. |
| Camionetas / SUV | `G4`, `GC`, `GL`, `GY` | Posición alta, carretera. (`GR` no se ofrece.) |
| Premium | `LE`, `LP`, `LU`, `LY` | Máximo confort e imagen. |
| Otros | fallback | Cualquier código en disponibilidad no mapeado (`H`, `G`, `GR`, `GX`, `V`, `VP`…). Nunca se pierde un vehículo. |

Vans/Pasajeros (`V`, `VP`) **no aplican** — alquicarros no las ofrece; si aparecen,
caen en "Otros". Un segmento sin vehículos disponibles en la búsqueda actual **se
oculta**.

## Máquina de pasos

`1 Búsqueda → 2 Vehículo (segmento→gama) → 3 Seguro → 4 Adicionales (opcional) → 5 Datos`

- `canAdvance` por paso: 1 requiere búsqueda válida; 2 requiere gama seleccionada;
  3 requiere elección de seguro (Básico preseleccionado, así que siempre satisfecho);
  4 opcional (botón "Omitir"); 5 delega en la validación valibot de `ReservationForm`.
- **Back sin pérdida:** cada paso alcanzado es clicable (barra y sidebar) para editar;
  volver no borra selecciones posteriores válidas.
- **Fuente de verdad:** `reservationForm` (branches, fechas/horas, `haveTotalInsurance`,
  personales) + `selectedCategory` de `useCategory` (gama, `withTotalCoverage`,
  `withExtraDriver`/`withBabySeat`/`withWash`). El wizard orquesta; no crea estado
  de dominio nuevo.

## Data flow y URL

- **Paso 1 (handshake búsqueda→avance):** el `Searcher` de alquicarros escribe el query
  string (F3 SCEN-F3-07); `useSearchByQueryParams` corre `doSearch()` →
  `useStoreSearchData.search()`. El wizard **observa** el fin de la búsqueda (transición
  de `pending`→resultados con `hasAvailableCategories`) y **entonces** avanza a Paso 2.
  El Searcher no maneja el avance; el wizard orquesta la transición al completarse la
  consulta. Añade `&paso=vehiculo` al query.
- **Sincronización de URL — `/reservas`** (bookmarkable + SEO): el estado se refleja en el
  query (`?lugar_recogida=…&fecha_recogida=…&hora_…=…&paso=vehiculo`). Cualquier estado
  con parámetros de búsqueda emite `robots: noindex, follow` (invariante F3 SCEN-F3-06);
  `/reservas` limpio queda **indexable** y arranca en Paso 1 sin disparar búsqueda.
- **Entrada directa por parámetros de búsqueda (regla general):** abrir `/reservas` **con
  parámetros de búsqueda** en el URL (compartido/bookmarkeado) hidrata y ejecuta la búsqueda
  vía `useSearchByQueryParams` y **entra directo al Paso 2** (resultados), SIN pasar
  manualmente por el Paso 1 — aunque el URL no traiga `paso=vehiculo`. La presencia de
  `lugar_recogida` es suficiente. Es el mismo principio que los deep-links de ciudad, pero
  para el query string de `/reservas`. `/reservas` **sin** parámetros → Paso 1.
- **Deep-links de resultados por ciudad** `/[city]/buscar-vehiculos/…` (ISR): el wizard se
  monta en esa ruta (vía `CityPage mode="results"`), hidrata la búsqueda desde el path con
  `useSearchByRouteParams` y **entra en Paso 2** con disponibilidad cargada. **SEO de esa
  ruta: sin cambios respecto a hoy** — `useSearchPageSEO` canonicaliza a `/[city]` y NO
  emite `robots` meta (el `noindex,follow` es exclusivo de `/reservas?query`, no de esta
  ruta). La variante `/…/categoria/[gama]` entra en **Paso 3** con la gama preseleccionada:
  además del hidratado de búsqueda, se lee `route.params.categoria` (lectura brand-local
  extra — `useSearchByRouteParams` NO cubre la gama) y se hace match con la fila de
  disponibilidad para fijar `selectedCategory`.
- **Rehidratación / gate SSR-estable:** `currentStep` se deriva de valores SSR-estables,
  espejando cómo `reservas/index.vue` gatea en `route.query.lugar_recogida`:
  1. sin parámetros de búsqueda → **Paso 1**;
  2. con parámetros de búsqueda presentes (`lugar_recogida`) → **al menos Paso 2**;
  3. si además hay `route.query.paso` posterior (o el segmento de path `/categoria/[gama]`)
     → ese paso (2..5), para conservar back/forward y compartir un paso avanzado.
  Refresh o back reconstruye el paso desde ahí, sin flash de paso incorrecto ni CLS.
- **Submit** (Paso 5): sin cambios → `submitForm()` → `routeForReservationStatus` →
  `/reservado/[code]` | `/pendiente` | `/sindisponibilidad`.

## Contenido por paso

- **Paso 2 — Vehículo.** Nivel 1: tiles de segmento con "desde $X" (el más barato
  disponible del segmento), ocultando segmentos sin stock. Nivel 2: vehículos del
  segmento (carrusel, specs, precio/día). Seleccionar → el sidebar refleja gama +
  subtotal.
- **Paso 3 — Seguro.** Comparador **Básico vs Total** lado a lado: qué cubre cada uno,
  deducible, `+$X/día`. Preselección **Básico**; Total marcado "recomendado" sin
  forzar. Alimenta `haveTotalInsurance`/`withTotalCoverage` → recalcula el total en vivo.
- **Paso 4 — Adicionales (opcional).** Conductor adicional / silla de bebé / lavado con
  precios de `ExtrasData` (con fallbacks actuales). Botón **"Omitir"** visible. Cada
  toggle actualiza el sidebar.
- **Paso 5 — Datos.** Reúsa `ReservationForm` (validación valibot intacta). El sidebar
  muestra el total final antes de confirmar.

## Estados y errores

- **Sin disponibilidad** en Paso 2 → estado vacío inline con CTA "ajustar búsqueda"
  (vuelve a Paso 1); no navegación dura a `/sindisponibilidad`.
- **Error de disponibilidad / one-way** → banner reusando `mapAvailabilityFetchError` /
  `classifyOneWayDistanceError` (mensajería actual, sin duplicar).
- **Contraste AA:** todo control relleno en naranja de marca usa texto oscuro
  (`text-gray-900`) — regla transversal F0/F3.

## Fuera de alcance (YAGNI)

- No se toca `logic/`.
- No se portan cambios a alquilatucarro/alquilame.
- No se rediseña el motor de disponibilidad ni el endpoint `record`.
- No se añade estado de dominio nuevo (el wizard deriva del estado existente).
- No se implementa persistencia server-side del progreso del wizard (solo query URL).

## Invariantes preservadas

- `data-testid="*-test"` que consumen los E2E (`BRAND=alquicarros`).
- SEO programático: `/reservas` limpio indexable; `/reservas?query` con parámetros
  `noindex,follow`; landings de ciudad y rutas ISR de resultados con su SEO actual intacto
  (canonical a `/[city]` vía `useSearchPageSEO`, sin `robots` meta añadido).
- Aislamiento: solo `packages/ui-alquicarros/**`. `logic/` y las otras dos marcas sin
  cambios de salida.
- El pin secreto WhatsApp (#41) y demás invariantes de las superficies F3 no se rompen.

## Escenarios observables (holdout → SDD)

Estos escenarios son el holdout que viaja a `/scenario-driven-development`. Cada
decisión de diseño tiene al menos uno.

### SCEN-W-01: /reservas limpio arranca el wizard en Paso 1 sin disparar búsqueda
**Given** un visitante abre `/reservas` sin query
**When** la página carga
**Then** el wizard monta el Paso 1 (Búsqueda) con el `Searcher` y sus `data-testid`;
NO se ejecuta ninguna consulta de disponibilidad; el `<head>` NO lleva `noindex`
**Evidence** DOM (Searcher presente, barra de pasos en "1 Búsqueda"), 0 requests al
endpoint de disponibilidad, HTML SSR sin meta robots noindex

### SCEN-W-01b: /reservas CON parámetros de búsqueda entra directo al Paso 2
**Given** un visitante abre un `/reservas?lugar_recogida=<slug>&lugar_devolucion=<slug>&fecha_recogida=<f>&fecha_devolucion=<f>&hora_recogida=<h>&hora_devolucion=<h>` compartido/bookmarkeado (sin `paso` explícito)
**When** la página carga
**Then** la búsqueda se hidrata y ejecuta desde el query vía `useSearchByQueryParams` y el
wizard monta **directamente el Paso 2** (resultados/segmentos), SIN quedar en el Paso 1; el
`<head>` emite `robots: noindex, follow`
**Evidence** request de disponibilidad con los slugs del query en la carga, barra de pasos en
"2 Vehículo" (no "1 Búsqueda"), meta robots noindex,follow en el HTML SSR

### SCEN-W-02: completar la búsqueda avanza al Paso 2 y muestra segmentos
**Given** el wizard en Paso 1 con una selección válida (recogida + fechas + horas)
**When** el usuario dispara la búsqueda
**Then** se ejecuta la consulta de disponibilidad y el wizard avanza al Paso 2
mostrando los tiles de segmento; el query de `/reservas` refleja los parámetros +
`paso=vehiculo` y el `<head>` emite `robots: noindex, follow`
**Evidence** request al endpoint con los slugs, barra de pasos en "2 Vehículo", URL
`/reservas?lugar_recogida=…&paso=vehiculo`, meta robots noindex,follow

### SCEN-W-03: los segmentos agrupan las gamas según la taxonomía y ocultan los vacíos
**Given** disponibilidad devuelta con gamas de varios segmentos y un segmento sin stock
**When** se renderiza el Paso 2 nivel 1
**Then** cada tile agrupa las gamas correctas (C/CX→Económicos, F/FX/FL/FU/FY→Sedanes,
G4/GC/GL/GY→Camionetas-SUV, LE/LP/LU/LY→Premium); el tile muestra el "desde $X" del más
barato disponible; los segmentos sin vehículos disponibles NO se renderizan
**Evidence** DOM de tiles vs `vehicleSegments.ts`; ausencia del tile del segmento vacío

### SCEN-W-04: una gama no mapeada cae en "Otros" y nunca se pierde
**Given** disponibilidad que incluye un código no listado en ningún segmento (p.ej. `H`)
**When** se renderiza el Paso 2 nivel 1
**Then** el vehículo aparece bajo el segmento "Otros" (no desaparece de la vista)
**Evidence** `segmentForCode('H') === 'otros'` (unit) + tile "Otros" con el vehículo (DOM)

### SCEN-W-05: elegir segmento → vehículo fija la gama y actualiza el resumen
**Given** el Paso 2 con el segmento "Económicos" abierto
**When** el usuario selecciona la gama C
**Then** `selectedCategory`/`vehiculo` = C; el sidebar muestra gama C, la ciudad, los
días y el subtotal; el wizard habilita avanzar a Paso 3
**Evidence** sidebar con "Gama C" + subtotal; `canAdvance` del Paso 2 = true

### SCEN-W-06: el Paso 3 recalcula el total al elegir Seguro Total
**Given** el Paso 3 con Básico preseleccionado y un subtotal visible en el sidebar
**When** el usuario elige Seguro Total
**Then** `haveTotalInsurance`/`withTotalCoverage` = true y el total renderizado en el
sidebar aumenta (recálculo en vivo, sin recargar)
**Evidence** total renderizado en el sidebar (DOM) antes < después; `withTotalCoverage`
del `selectedCategory` = true (observable vía el total expuesto `getTotalPrice`, no un
computed interno no exportado)

### SCEN-W-07: el Paso 4 es opcional y "Omitir" avanza sin adicionales
**Given** el Paso 4 (Adicionales) sin ninguna opción marcada
**When** el usuario pulsa "Omitir"
**Then** el wizard avanza al Paso 5 con `withExtraDriver/withBabySeat/withWash = false`;
el sidebar muestra "Adicionales —"
**Evidence** barra de pasos en "5 Datos", flags de extras en false, sidebar sin línea de
adicionales

### SCEN-W-08: el resumen es persistente y refleja cada cambio en todos los pasos
**Given** el wizard en cualquier paso ≥ 2 con gama, seguro y/o adicionales elegidos
**When** se inspecciona el resumen en desktop y en móvil
**Then** en desktop es un `<aside>` sticky siempre visible; en móvil es una barra
inferior fija expandible; en ambos refleja gama + seguro + adicionales + total
corrientes
**Evidence** computed style (aside sticky ≥ breakpoint; barra fija < breakpoint) +
contenido del resumen = estado actual

### SCEN-W-09: el deep-link de resultados entra al wizard en Paso 2 pre-cargado
**Given** un visitante abre `/[city]/buscar-vehiculos/lugar-recogida/…/hora-devolucion/…`
**When** la página carga
**Then** la búsqueda se hidrata desde el path (branches, fechas, horas) y el wizard
monta directamente el Paso 2 con disponibilidad ya cargada; el SEO de la ruta NO cambia
respecto a hoy — el `<head>` canonicaliza a `/[city]` (vía `useSearchPageSEO`) y NO añade
`robots` meta (el `noindex,follow` es de `/reservas?query`, no de esta ruta)
**Evidence** request de disponibilidad con los slugs del path, barra de pasos en
"2 Vehículo", `<link rel="canonical">` a `/[city]` y ausencia de meta robots noindex en el
HTML SSR (idéntico al comportamiento pre-wizard)

### SCEN-W-10: back preserva el estado ya elegido
**Given** el wizard en Paso 4 con gama C y Seguro Total elegidos
**When** el usuario hace clic en el paso "2 Vehículo" de la barra
**Then** vuelve al Paso 2 con la gama C aún seleccionada y el sidebar intacto (seguro
Total conservado); avanzar de nuevo no re-pregunta lo ya resuelto
**Evidence** Paso 2 con C marcada + sidebar con Seguro Total; sin reset de selecciones

### SCEN-W-11: submit desde el Paso 5 enruta igual que hoy (sin regresión)
**Given** el Paso 5 con datos válidos y una selección completa
**When** el usuario confirma
**Then** `submitForm()` se ejecuta y navega según `routeForReservationStatus`
(`/reservado/[code]` | `/pendiente` | `/sindisponibilidad`), idéntico al flujo actual
**Evidence** navegación a la ruta correcta por estado de la reserva

### SCEN-W-12: sin disponibilidad en Paso 2 no rompe el wizard
**Given** una búsqueda válida que devuelve cero categorías disponibles
**When** el wizard llega al Paso 2
**Then** muestra un estado vacío inline con CTA "ajustar búsqueda" que vuelve al Paso 1;
no hay error de consola ni navegación dura
**Evidence** DOM del estado vacío + CTA a Paso 1; consola limpia

### SCEN-W-13: aislamiento — las hermanas y logic no cambian de salida
**Given** el paquete tras implementar el wizard
**When** se corre typecheck 1-marca + Vitest de `ui-alquicarros` y se compara la salida
de alquilatucarro/alquilame
**Then** `logic/`, `ui-alquilatucarro` y `ui-alquilame` sin cambios; typecheck 1-marca y
Vitest de alquicarros en verde
**Evidence** diff git vacío en `packages/logic`, `packages/ui-alquilatucarro` y
`packages/ui-alquilame`; typecheck/Vitest de alquicarros verde

### SCEN-W-14: el deep-link con gama entra al wizard en Paso 3 con el vehículo preseleccionado
**Given** un visitante abre `/[city]/buscar-vehiculos/…/categoria/[gama]` (p.ej. `…/categoria/C`)
**When** la página carga
**Then** la búsqueda se hidrata desde el path y, además, se lee `route.params.categoria` para
fijar `selectedCategory` = esa gama; el wizard monta directamente el **Paso 3 (Seguro)** con
el vehículo ya elegido reflejado en el sidebar; si la gama del path no está en la
disponibilidad devuelta, cae al Paso 2 (no rompe)
**Evidence** barra de pasos en "3 Seguro", sidebar con la gama del path, comparador
Básico/Total visible; caso sin match → barra en "2 Vehículo" sin error de consola

## Testing y verificación

- **Unit (Vitest, `ui-alquicarros`):** `segmentForCode` + fail-soft "Otros" (SCEN-W-03/04);
  máquina de pasos `canAdvance`/back-preserva-estado (SCEN-W-05/07/10); derivación
  SSR-estable del paso inicial desde el URL (sin params→Paso 1, con params→Paso 2, `paso`
  posterior→ese paso — SCEN-W-01/01b/02/09/14); gating SSR del `noindex`.
- **E2E (Playwright, `BRAND=alquicarros`):** flujo completo 5 pasos; deep-link entra en
  Paso 2/3; sidebar refleja precio en cada paso; "Omitir" adicionales; sin regresión del
  Searcher unificado ni del submit.
- **Runtime (`/agent-browser` + `/dogfood`):** cero errores de consola / requests fallidos;
  sidebar sticky desktop + barra móvil; contraste AA de controles naranja; CLS no peor que hoy.

## Blast radius

- **Se modifica:** solo `packages/ui-alquicarros/`:
  - nuevo árbol `app/components/wizard/`, `app/composables/useReservationWizard.ts`,
    `app/config/vehicleSegments.ts`;
  - `app/pages/reservas/` (monta el wizard);
  - `app/components/CityPage.vue` — en `mode="results"` renderiza el wizard en vez de
    `CategorySelectionSection`;
  - el árbol de rutas de resultados `app/pages/[city]/buscar-vehiculos/…/index.vue`,
    su gemelo `referido/…` y la hoja `…/categoria/[categoria]/index.vue` — entran al wizard
    (Paso 2 / Paso 3) en lugar del grid;
  - `CategorySelectionSection.vue`/`CategoryCard.vue` quedan disponibles como base para el
    nivel-2 del Paso 2 (reúso o retiro según la implementación);
  - los tests del paquete.
- **Se reúsa sin tocar:** `packages/logic` (composables/stores/utils/tipos) y
  `app/composables/useSearchByQueryParams.ts` / `useSearchByRouteParams` (hidratado).
- **No se toca:** `packages/ui-alquilatucarro`, `packages/ui-alquilame`, `packages/logic`,
  `server/api` de reservas, `useSearchPageSEO` (el SEO de las rutas de resultados no cambia).
- **Consumidores a revisar:** los E2E `BRAND=alquicarros` (flujo de resultados y submit) y
  los tests de config/SEO del paquete.
