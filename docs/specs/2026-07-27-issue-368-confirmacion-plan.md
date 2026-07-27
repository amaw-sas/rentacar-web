# Plan de implementación — Confirmación de reserva (issue #368, hallazgo #1)

Diseño fuente: `docs/specs/2026-07-27-issue-368-confirmacion-design.md` (aprobado, 4 rondas de revisión). Los 10 escenarios del spec son el holdout SDD.

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `packages/logic/src/stores/useStoreReservationForm.ts` | MODIFICAR | Tipo `ReservationSummary` + ref `lastReservationSummary`; congelarlo en la rama `/reservado/` de `submitForm` (leyendo `useStoreSearchData().selectedCategory` **dentro del cuerpo de la acción**, lazy, para no crear ciclo de init de módulos ES); exponerlo en el return. |
| `packages/ui-alquicarros/app/composables/useReservationRecap.ts` | NUEVO | Lee el snapshot + `reserveCode` de la ruta; gate de tres partes (`code` match + `categoryName` + `total`); mapea a display (etiquetas de seguro/km). Devuelve `{ show, recap }`. Sin estado vivo. |
| `packages/ui-alquicarros/app/config/reservationRequirements.ts` | NUEVO | Los 3 strings de requisitos "qué llevar" como constante única. |
| `packages/ui-alquicarros/app/components/ReservationForm.vue` | MODIFICAR | Re-apuntar el `<ul>` de requisitos (`:17-19`) a la constante. Sin cambio de comportamiento. |
| `packages/ui-alquicarros/app/pages/reservado/[reserveCode]/index.vue` | MODIFICAR | `role="status"`; botón copiar; bloque recap (`v-if="show"`); checklist; enlaces reales de contacto; variante `unavailable` con reintento + contacto. |
| `packages/logic/src/stores/__tests__/useStoreReservationForm.recap.test.ts` | NUEVO | SCEN-10: submit real congela el snapshot con nombre+total correctos (sin `.value`). |
| `packages/ui-alquicarros/app/composables/__tests__/useReservationRecap.test.ts` | NUEVO | SCEN-1..4: gate y mapeo. |
| `packages/ui-alquicarros/app/pages/reservado/__tests__/confirmacion.mount.test.ts` | NUEVO | SCEN-1,2,5,6,7,8: render de página, enlaces, copiar, unavailable. |
| `packages/ui-alquicarros/tests/confirmacion-contrast.a11y.test.ts` | NUEVO | SCEN-9: contraste AA de textos nuevos. |

## Prerrequisitos

- Ninguno nuevo. `franchise.{whatsapp,email,phone}` ya en `app.config.ts`. `normalizeReservationCode` ya importado por la página.

## Pasos (SDD: escenario → código → satisfacer → refactor)

### Paso 1 — Snapshot congelado en el store (Fundación) · M · dep: ninguna
El usuario envía una reserva exitosa → en la rama `/reservado/` de `submitForm`, antes del `navigateTo`, se congela `lastReservationSummary` con `code` (`dataRecord.value.reserveCode`), `categoryName`/`total` de `useStoreSearchData().selectedCategory` **sin `.value`** (deep ref auto-desenvuelto), y fechas/horas/sedes(name,city)/días/flags de los computeds del form store **con `.value`**. Se expone en el return. `lastSubmittedCode` NO se toca.
- **Escenario:** SCEN-10 (end-to-end obligatorio) — manejar el `submitForm` REAL con un `selectedCategory` poblado (instancia real de `useCategory`, no sembrada) y afirmar `lastReservationSummary.code === dataRecord.reserveCode`, `categoryName === selectedCategory.categoryDescription`, `total === selectedCategory.currencyTotalToPayWithAdditionals`.
- **Aceptación:** el test falla si se añade `.value` a los campos cross-store (oracle independiente); pasa con la captura correcta. `useStoreSearchData()` se llama dentro del cuerpo de la acción, no en setup.

### Paso 2 — `useReservationRecap()` (Núcleo) · M · dep: Paso 1
La confirmación necesita saber si pintar el recap y con qué valores → el composable lee el snapshot + la ruta, aplica `show = summary!=null && summary.code===normalizeReservationCode(param) && !!categoryName && !!total`, y mapea flags a etiquetas (seguro Total/Básico, plan de km).
- **Escenarios:** SCEN-1 (match → valores exactos), SCEN-2 (null → oculto), SCEN-3 (código distinto → oculto), SCEN-4 (nombre/total ausentes → oculto, sin `undefined`).
- **Aceptación:** los cuatro casos observables; el mapeo de etiquetas cubre Total/Básico y mensual/no-mensual.

### Paso 3 — Constante de requisitos + re-apuntar el form (Fundación) · S · dep: ninguna
Los requisitos "qué llevar" deben tener una sola fuente → extraer los 3 strings a `app/config/reservationRequirements.ts` y re-apuntar `ReservationForm.vue`.
- **Escenario:** el formulario sigue renderizando los 3 requisitos textualmente iguales (sin cambio de comportamiento) — verificado por el mount/DOM existente del form o una aserción de que el `<li>` sale de la constante.
- **Aceptación:** cero delta visual en el form; la constante es la única fuente.

### Paso 4 — Página: recap + checklist + `role="status"` (Núcleo) · M · dep: Pasos 2,3
Tras confirmar, el cliente ve qué reservó y qué llevar → la variante `confirmed` gana `role="status"`, el bloque recap (`v-if="show"`, patrón `bg-white/10 rounded-2xl`) con los campos del composable, y el checklist desde la constante.
- **Escenarios:** SCEN-1 (recap con valores exactos en el DOM), SCEN-9 (contraste AA de los textos del recap y checklist).
- **Aceptación:** con snapshot válido sembrado, el DOM muestra nombre/fechas/sedes/días/seguro/total; sin snapshot, el recap no está pero el checklist sí. Contraste ≥ 4.5.

### Paso 5 — Página: enlaces de contacto reales + `unavailable` con reintento (Integración) · M · dep: Paso 4
El bloque "modificar/cancelar" no enlaza nada, y `unavailable` no ofrece salida → enlazar WhatsApp (`franchise.whatsapp`), correo (`mailto:franchise.email`), teléfono (`tel:`) en ambas variantes; `unavailable` gana botón de reintento (recargar) + contacto, conservando su `role="status"`.
- **Escenarios:** SCEN-5 (hrefs correctos), SCEN-8 (unavailable: reintento + contacto + `role="status"`).
- **Aceptación:** `href` exactos desde `franchise`; la variante `unavailable` ya no es un callejón sin salida.

### Paso 6 — Página: botón copiar código (Pulido) · S · dep: Paso 4
El código es difícil de copiar a mano → botón copiar junto al código, con `aria-label` y anuncio "Código copiado"; degrada si no hay clipboard.
- **Escenarios:** SCEN-6 (clipboard mockeado → escribe + anuncia), SCEN-7 (clipboard ausente/rechaza → sin excepción, código seleccionable).
- **Aceptación:** ambos caminos observables; el botón nunca lanza.

## Estrategia de pruebas

- **Store (SCEN-10):** test de `submitForm` real con `useStoreSearchData` poblado; oracle independiente para el bug de `.value`.
- **Composable (SCEN-1..4):** unit puro, sin montar.
- **Página (SCEN-1,2,5,6,7,8):** mount jsdom (arnés `// @vitest-environment jsdom` en línea 1; ver [[reference-wizard-mount-harness-jsdom]] por las trampas de auto-import y stubs).
- **a11y (SCEN-9):** contraste en canvas 1×1 (Tailwind 4 emite oklch).
- Baseline typecheck ui-alquicarros = 51; delta objetivo 0.

## Rollout

- Sin migración ni flag. Cambio aditivo en el store (campo nuevo) + página. Rama `pabloandi/issue-368-confirmacion-reserva` → PR → main.
- Verificación runtime `/agent-browser` + `/dogfood` antes de "hecho": reservar en sesión y ver el recap; refrescar y ver la degradación; cero errores de consola.
- Rollback: `git revert` del merge; el campo de store nuevo no tiene consumidores fuera de la confirmación.
