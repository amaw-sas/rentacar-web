# Plan de implementación — Wizard de reserva acompañada (alquicarros)

**Fecha:** 2026-07-01
**Diseño (fuente):** `docs/specs/2026-07-01-alquicarros-reservation-wizard-design.md` (aprobado + revisado)
**Holdout:** 15 escenarios observables SCEN-W-01, W-01b, W-02..W-14 (en el spec)
**Branch/worktree:** `feat/alquicarros-reservation-wizard` · `.worktrees/alquicarros-reservation-wizard/`
**Marca-local:** solo `packages/ui-alquicarros/`; `logic/` y las hermanas no se tocan.

Cada paso es scenario-driven: define escenario → escribe código → satisface → refactor.
Los escenarios ya existen en el spec; aquí se ligan a cada paso. Ningún paso es "solo tests".

---

## Mapa de archivos (Step 6.5)

### Nuevos — `packages/ui-alquicarros/app/`

| Archivo | Responsabilidad única |
|---|---|
| `config/vehicleSegments.ts` | Taxonomía de segmentos (array ordenado `{ id, label, icon, gamaCodes }`) + `segmentForCode(code)` con fail-soft `"otros"`. Sin lógica de UI. |
| `composables/useReservationWizard.ts` | Máquina de pasos: `currentStep`, `maxReachedStep`, `goTo/next/back`, `canAdvance(step)`, y `deriveStepFromRoute()` SSR-estable. No posee estado de dominio; deriva de `reservationForm` + `selectedCategory`. |
| `components/wizard/ReservationWizard.vue` | Shell orquestador: layout `<main>` + `<aside>`, monta el paso activo, cablea la máquina. Único punto que conoce todos los pasos. |
| `components/wizard/WizardStepper.vue` | Barra de pasos; cada paso alcanzado es clicable (emite `goTo`). Presentación pura. |
| `components/wizard/WizardSummary.vue` | Resumen persistente. Sidebar sticky (desktop) / barra inferior expandible (móvil). Lee estado de dominio; no lo muta. |
| `components/wizard/VehicleSegmentTile.vue` | Tile de un segmento (nivel 1): label, icono, "desde $X". Presentación pura. |
| `components/wizard/steps/StepSearch.vue` | Paso 1: envuelve el `Searcher` existente dentro del shell. |
| `components/wizard/steps/StepVehicle.vue` | Paso 2: nivel 1 tiles de segmento (oculta vacíos) → nivel 2 vehículos del segmento. Fija `selectedCategory`. |
| `components/wizard/steps/StepCoverage.vue` | Paso 3: comparador Básico vs Total; togglea `withTotalCoverage`/`haveTotalInsurance`. |
| `components/wizard/steps/StepExtras.vue` | Paso 4 (opcional): toggles de adicionales + "Omitir". |
| `components/wizard/steps/StepData.vue` | Paso 5: reúsa `ReservationForm`; dispara `submitForm()`. |

### Modificados — `packages/ui-alquicarros/app/`

| Archivo | Cambio |
|---|---|
| `pages/reservas/index.vue` | Monta `ReservationWizard` en vez del hero+Searcher+`CategorySelectionSection` actuales; deriva el paso inicial del query. |
| `components/CityPage.vue` | En `mode="results"` renderiza `ReservationWizard` (Paso 2) en vez de `CategorySelectionSection`. |
| `pages/[city]/buscar-vehiculos/…/hora-devolucion/[hora_devolucion]/index.vue` + gemelo `referido/…` | Entran al wizard en Paso 2 con búsqueda hidratada del path. SEO sin cambios. |
| `pages/[city]/buscar-vehiculos/…/categoria/[categoria]/index.vue` (+ gemelo referido) | Entran al wizard en Paso 3 con la gama del path preseleccionada; fallback Paso 2 si no hay match. |

### Reúso sin tocar
- `logic`: `useSearch`, `useSearchByRouteParams`, `useCategory`, `useStoreSearchData` (`selectedCategory`), `useStoreReservationForm`, `pickPriceForDate`, `pickEffectiveTotalCoverageUnitCharge`, `ExtrasData`, `mapAvailabilityFetchError`, `classifyOneWayDistanceError`, `routeForReservationStatus`, `useSearchPageSEO`.
- brand-local: `app/composables/useSearchByQueryParams.ts`, `Searcher.vue`, `ReservationForm.vue`, y `CategoryCard`/`CategorySelectionSection` como base del nivel-2.

### Tests
- Unit (Vitest): `tests/vehicle-segments.test.ts`, `tests/reservation-wizard-machine.test.ts`.
- E2E (Playwright, raíz `/e2e`): `e2e/alquicarros-reservation-wizard.spec.ts` (`BRAND=alquicarros`).

**Boundary check:** cada `Step*.vue` se entiende sin leer los demás; el shell es el único con conocimiento global; la config y la máquina no importan componentes (testeable en aislamiento).

---

## Prerequisitos
- `pnpm install` en el worktree (deps ya en el lockfile).
- Dev server: `PORT=4000 pnpm --filter ui-alquicarros dev` (worktree lee `../../.env.local`; copiarlo si falta, si no el plugin rentacar-data lanza 500).
- Typecheck 1-marca: `ionice -c3 nice -n19 pnpm --filter ui-alquicarros typecheck` (nunca el root — congela WSL2).

---

## Fases y pasos (Step 7)

### Fase 1 — Fundación

**Paso 1 · Config de segmentos + fail-soft** · Size: S · Deps: none
Crear `config/vehicleSegments.ts` con la taxonomía cerrada (C/CX=Económicos; F/FX/FL/FU/FY=Sedanes; G4/GC/GL/GY=Camionetas-SUV; LE/LP/LU/LY=Premium) y `segmentForCode(code)` que devuelve `"otros"` para códigos no mapeados.
- *Escenario:* dado un código no mapeado (`H`), `segmentForCode` → `"otros"`; dado `C` → `"economicos"`. (SCEN-W-03, W-04)
- *Aceptación:* `tests/vehicle-segments.test.ts` verde: todos los códigos de `CategoryType` resuelven a un segmento; los 15 mapeados a su segmento nombrado; el resto a `"otros"`; orden de segmentos estable.

**Paso 2 · Máquina de pasos + derivación SSR-estable** · Size: M · Deps: Paso 1
Crear `composables/useReservationWizard.ts`: estado de pasos, `canAdvance(step)`, `goTo/next/back` (back preserva selecciones posteriores válidas), y `deriveStepFromRoute(route)` — sin params→1, con `lugar_recogida`→≥2, `paso` posterior→ese paso.
- *Escenario:* URL sin params → Paso 1; con `lugar_recogida` → Paso 2; con `paso=seguro` → Paso 3; back de Paso 4 a 2 conserva gama y seguro. (SCEN-W-01, W-01b, W-02, W-10)
- *Aceptación:* `tests/reservation-wizard-machine.test.ts` verde para la tabla de derivación y para back-preserva-estado; `canAdvance` refleja las precondiciones por paso.

### Fase 2 — Núcleo (shell + pasos)

**Paso 3 · Shell + Stepper + Paso 1 (Búsqueda) en `/reservas` limpio** · Size: M · Deps: Paso 2
`ReservationWizard.vue` + `WizardStepper.vue` + `StepSearch.vue`; montar en `pages/reservas/index.vue`. `/reservas` limpio arranca en Paso 1 con el `Searcher` (data-testid intactos), sin disparar búsqueda, indexable.
- *Escenario:* abrir `/reservas` sin query → Paso 1, 0 requests de disponibilidad, sin meta noindex. (SCEN-W-01)
- *Aceptación:* DOM con Searcher + barra en "1 Búsqueda"; 0 llamadas al endpoint; HTML SSR sin `robots noindex`; stepper clicable solo en pasos alcanzados.

**Paso 4 · Resumen persistente** · Size: M · Deps: Paso 3
`WizardSummary.vue` como `<aside>` sticky en desktop y barra inferior expandible en móvil; refleja ciudad/días/gama/seguro/adicionales/total desde el estado de dominio.
- *Escenario:* en cualquier paso ≥2 el resumen muestra la selección y el total corrientes; desktop sticky, móvil barra fija. (SCEN-W-08)
- *Aceptación:* computed style (aside sticky ≥ breakpoint; barra fija < breakpoint); contenido = estado actual; se actualiza al cambiar selección.

**Paso 5 · Paso 2 Vehículo (segmento → gama)** · Size: M · Deps: Paso 4
`StepVehicle.vue` + `VehicleSegmentTile.vue`: nivel 1 tiles de segmento con "desde $X" del más barato disponible, ocultando segmentos sin stock; nivel 2 vehículos del segmento (reúso de `CategoryCard` reducida); seleccionar fija `selectedCategory`/`vehiculo` y habilita avanzar.
- *Escenario:* disponibilidad multi-segmento con uno vacío → tiles correctos, vacío oculto, `H` bajo "Otros"; elegir gama C actualiza sidebar y habilita Paso 3. (SCEN-W-03, W-04, W-05)
- *Aceptación:* DOM de tiles = `vehicleSegments.ts`; segmento vacío ausente; "Otros" presente si llega código no mapeado; sidebar con gama + subtotal; `canAdvance(2)` true.

**Paso 6 · Paso 3 Seguro (comparador Básico/Total)** · Size: M · Deps: Paso 5
`StepCoverage.vue`: comparador lado a lado, Básico preseleccionado, Total "recomendado"; togglea `withTotalCoverage`/`haveTotalInsurance` y recalcula en vivo.
- *Escenario:* elegir Seguro Total → total renderizado del sidebar aumenta, sin recarga. (SCEN-W-06)
- *Aceptación:* total del sidebar (DOM) antes < después; `withTotalCoverage` del `selectedCategory` = true; asserción apuntada al total que el sidebar realmente renderiza (`getTotalPrice`/`currencyTotal…`).

**Paso 7 · Paso 4 Adicionales (opcional + Omitir)** · Size: S · Deps: Paso 6
`StepExtras.vue`: toggles de conductor adicional / silla bebé / lavado con precios de `ExtrasData`; botón "Omitir".
- *Escenario:* pulsar "Omitir" sin marcar nada → avanza a Paso 5 con flags en false y sidebar sin línea de adicionales. (SCEN-W-07)
- *Aceptación:* barra en "5 Datos"; `withExtraDriver/withBabySeat/withWash` false; cada toggle actualiza el sidebar.
- *Observable adicional (SCEN-W-10, DOM):* con gama C + Seguro Total elegidos, clic en el paso "2 Vehículo" del stepper vuelve a Paso 2 con C aún marcada y el seguro Total conservado en el sidebar; avanzar de nuevo no resetea. Verifica el observable de back-preserva-estado antes del gate E2E final (ya no diferido enteramente al Paso 13).

**Paso 8 · Paso 5 Datos + submit** · Size: M · Deps: Paso 7
`StepData.vue`: reúsa `ReservationForm` (valibot intacto); confirmar dispara `submitForm()` → `routeForReservationStatus`.
- *Escenario:* datos válidos + selección completa → navega a `/reservado/[code]` | `/pendiente` | `/sindisponibilidad` según estado. (SCEN-W-11)
- *Aceptación:* navegación correcta por estado; validación del formulario sin regresión; total final visible en el sidebar antes de confirmar.

### Fase 3 — Integración (routing / SEO / deep-links)

**Paso 9 · Handshake búsqueda→avance + entrada directa por query** · Size: M · Deps: Paso 8
En `/reservas`: el `Searcher` escribe el query; `useSearchByQueryParams` corre `doSearch`; el wizard observa el fin de la búsqueda y avanza a Paso 2 añadiendo `paso=vehiculo`. Abrir `/reservas?query` compartido entra directo en Paso 2.
- *Escenario:* completar búsqueda en Paso 1 → Paso 2 + query con params + `noindex,follow`; abrir `/reservas?lugar_recogida=…` → Paso 2 directo. (SCEN-W-02, W-01b)
- *Aceptación:* request de disponibilidad con los slugs; barra en "2 Vehículo"; URL con params; meta `robots noindex,follow`; entrada directa no queda en Paso 1.

**Paso 10 · CityPage results-mode + deep-links de ciudad → Paso 2** · Size: M · Deps: Paso 9
`CityPage.vue` en `mode="results"` renderiza el wizard; las rutas `buscar-vehiculos/…` (+ referido) hidratan con `useSearchByRouteParams` y entran en Paso 2. SEO de esas rutas sin cambios (canonical a `/[city]`, sin noindex — `useSearchPageSEO`).
- *Escenario:* abrir `/[city]/buscar-vehiculos/…` → Paso 2 con disponibilidad; canonical a `/[city]`, sin meta noindex. (SCEN-W-09)
- *Aceptación:* request con slugs del path; barra en "2 Vehículo"; `<link rel=canonical>` a `/[city]`; sin meta robots noindex (idéntico a hoy); marketing genérico oculto en SSR.

**Paso 11 · Deep-link `/categoria/[gama]` → Paso 3 preseleccionado** · Size: M · Deps: Paso 10
Hoja `categoria/[categoria]/index.vue` (+ referido): además del hidratado, lee `route.params.categoria`, hace match con la fila de disponibilidad y fija `selectedCategory`; entra en Paso 3; fallback Paso 2 si no hay match.
- *Escenario:* `/[city]/buscar-vehiculos/…/categoria/C` → Paso 3 con la gama C en el sidebar; gama sin match → Paso 2 sin error. (SCEN-W-14)
- *Aceptación:* barra en "3 Seguro" + sidebar con la gama del path + comparador visible; caso sin match → "2 Vehículo", consola limpia.

### Fase 4 — Robustez y verificación

**Paso 12 · Estados vacío/error en Paso 2** · Size: S · Deps: Paso 11
Estado vacío inline con CTA "ajustar búsqueda" (vuelve a Paso 1); banner de error reusando `mapAvailabilityFetchError`/`classifyOneWayDistanceError`.
- *Escenario:* búsqueda válida con cero categorías → estado vacío + CTA a Paso 1, sin navegación dura ni error de consola. (SCEN-W-12)
- *Aceptación:* DOM del estado vacío + CTA a Paso 1; error one-way muestra el banner correcto; consola limpia.

**Paso 13 · Verificación end-to-end + aislamiento + runtime QA** · Size: M · Deps: Paso 12
Ensamblar el flujo completo y validarlo: E2E `BRAND=alquicarros` (5 pasos, deep-link Paso 2/3, sidebar refleja precio, "Omitir", sin regresión del Searcher unificado ni del submit) + verificación de aislamiento + `/agent-browser` + `/dogfood`.
- *Escenario:* flujo completo reserva end-to-end sin regresión; `logic/` y hermanas con diff vacío; typecheck/Vitest de alquicarros verde. (SCEN-W-13 + cobertura E2E de W-02..W-14)
- *Aceptación:* `e2e/alquicarros-reservation-wizard.spec.ts` verde; diff git vacío en `packages/logic`, `packages/ui-alquilatucarro`, `packages/ui-alquilame`; typecheck 1-marca verde; cero errores de consola / requests fallidos; contraste AA de controles naranja; CLS no peor que hoy.

---

## Estrategia de testing
- **Unit (Vitest, ui-alquicarros):** taxonomía + fail-soft (Paso 1); máquina de pasos + derivación SSR + back-preserva-estado (Paso 2). Colocados en `tests/`.
- **Component/DOM:** gating de noindex y presencia del Searcher/tiles/summary vía los escenarios de cada paso funcional.
- **E2E (Playwright, `BRAND=alquicarros`):** flujo completo + deep-links Paso 2/3 + summary + Omitir (Paso 13); selectores `data-testid="*-test"` estables.
- **Runtime (`/agent-browser` + `/dogfood`):** cero errores/consola, sticky/barra por viewport, contraste, CLS (Paso 13).
- **Verificación antes de completar:** `/verification-before-completion` con evidencia fresca antes de cualquier claim de "done", commit final o PR.

## Rollout
- Trabajo aislado en el worktree/branch; push solo con autorización explícita del usuario.
- Sin cambios de backend/env; despliegue = build normal de la marca (`build:alquicarros`).
- **Rollback:** revertir el merge de la branch; al ser marca-local, no afecta a alquilatucarro/alquilame ni a `logic/`.
- **Monitoreo:** validar en el alias Vercel `-git-main-` de alquicarros tras merge (la public domain sigue en legacy hasta el cutover del épico #210).

## Riesgos / incertidumbres
- **Handshake de avance (Paso 9):** observar el fin de `pending` sin doble-avance ni carrera con el watcher de `useSearchByQueryParams`. Mitigación: flag de transición idempotente + test de la máquina.
- **CityPage results-mode (Paso 10):** el gate SSR debe ocultar marketing genérico sin flash (prop `mode`, no onMounted). Mitigación: derivar de `route`, verificar en SSR HTML.
- **Nivel-2 (Paso 5):** decisión reúso vs. reescritura de `CategoryCard`; empezar por reúso reducido, medir CLS.
