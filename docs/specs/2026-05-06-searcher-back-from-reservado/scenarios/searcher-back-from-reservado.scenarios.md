---
name: searcher-back-from-reservado
created_by: pablo+claude
created_at: 2026-05-06T15:00:00Z
issue: https://github.com/amaw-sas/rentacar-web/issues/25
---

# Searcher: desbloqueo de widgets tras Back desde `/reservado/{reserveCode}`

Fix para el bug que deja los widgets de fecha del Searcher (`#pickup-date`, `#return-date` y selects de lugar/hora) inertes tras completar una reservación, aterrizar en `/reservado/{code}` y presionar Back. El mitigador anterior (`Searcher.vue:357-359` — recarga si `event.persisted=true`) no aplica al flujo SPA real: validación runtime via `/agent-browser` confirma que `pageshow` **no dispara** en SPA back-nav (`pageshowLog: []`); solo `popstate`. El handler es código muerto en este path.

## Causa raíz validada

- **H1 (origen del lock):** los dos `<u-slideover>` anidados de `CategorySelectionSection.vue:60,125` están abiertos cuando `submitForm` (`useStoreReservationForm.ts:225-250`) invoca `navigateTo('/reservado/X')`. Reka UI Dialog con `modal:true` (default) aplica `pointer-events:none` al `<body>` — verificado por baseline en `e2e/reservation-back-url-cleanup.spec.ts:62-65`. Al desmontar por route-change sin transición `v-model:open=false`, el lock se filtra al body (DOM compartido SPA).
- **H2 (mitigador inefectivo):** `pageshow` no dispara en SPA back-nav. El handler en `Searcher.vue:357-359` jamás se invoca en el flujo real — solo en bfcache cross-document, escenario no típico del usuario.

## Decisión de fix

**Defensa en doble capa**, ambas necesarias:

1. **Capa 1 — origen:** `onBeforeRouteLeave` en `CategorySelectionSection.vue` (3 marcas) que cierra `slideoverReservationResume` y `slideoverReservationForm` + `nextTick()` antes de permitir el unmount. Reka UI ejecuta su cleanup vía la transición `open=false` del DialogRoot.
2. **Capa 2 — defensa:** dentro del `onMounted` de `Searcher.vue` (3 marcas), antes del `addEventListener('pageshow')` existente, limpiar `body.style.pointerEvents` y `body.dataset.scrollLocked` si están sucios. Loggea `console.warn` para trazabilidad. El handler `pageshow` se mantiene para el caso bfcache cross-document.

Spec asociado: plan en `~/.claude/plans/floofy-cooking-pearl.md`.

---

## SCEN-001: Body interactivo tras submit-Back (capa 1, root cause)

**Given:**
- Viewport ≥640px (`width: 1280, height: 720` en Playwright).
- Endpoint `**/api/reservations/record` mockeado vía `page.route()` para responder `{ reserveCode: "TEST123", reservationStatus: "reservado" }` (mapea a `/reservado/TEST123` por `routeForReservationStatus` en `packages/logic/src/utils/reservationStatusRoute.ts:18-20`).
- Endpoint `**/api/reservations/availability` mockeado para devolver al menos 1 categoría con `categoryCode` válido (e.g., `ECONOMY`), `estimatedTotalAmount` finito, `referenceToken` presente.
- Página `[city]/buscar-vehiculos/.../categoria/ECONOMY?reservar=ECONOMY` cargada — el watcher en `CategorySelectionSection.vue:345-381` auto-abre los dos slideovers (resume + form). `getComputedStyle(document.body).pointerEvents === 'none'` por la modal-lock de Reka UI.

**When:**
- El usuario completa los campos requeridos del form (mock-friendly: usar `page.fill` directo).
- Click en "Solicitar reserva" → `submitForm` ejecuta → mock devuelve `reservationStatus: 'reservado'` → `navigateTo('/reservado/TEST123')`.
- `await page.waitForURL('**/reservado/TEST123')`.
- `await page.goBack()` (Playwright equivalente al Back del navegador).
- `await page.waitForURL(/buscar-vehiculos/)`.

**Then:**
- URL final = path base de búsqueda (sin `?reservar=`, sin `/categoria/X`) — ya cubierto por `stripReservarParam`, no es el contrato bajo test pero sirve como sanity.
- `getComputedStyle(document.body).pointerEvents !== 'none'` (la aserción central — el lock NO se filtra).
- `document.querySelectorAll('[role="dialog"]:not([data-state="closed"])').length === 0` (no slideover residual visible).
- `[data-testid="pickup-location-test"]` clickeable: tras `pickupSelect.click()`, `[role="listbox"]` aparece visible en <5s.
- Cero errores en consola, cero requests fallidos en Network panel (excepto los mocks intencionales).

**Evidence:**
- DOM: `await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents)).not.toBe('none')`.
- DOM: `await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })` tras click en `[data-testid="pickup-location-test"]`.
- Re-runs estables: ejecutar el test 3 veces seguidas, todas pasan sin flakiness.

**Test correspondiente:** `e2e/reservation-submit-back-unlocks-searcher.spec.ts` (nuevo).

---

## SCEN-002: Defensa en profundidad — body sucio en mount es limpiado (capa 2)

**Given:**
- Viewport ≥640px.
- Antes de navegar, `<body>` sucio inyectado: `await page.addInitScript(() => { document.body.style.pointerEvents = 'none'; })`. Esto simula un leak hipotético desde otro path (e.g., bug futuro en otra modal) sin depender del flujo de submit.

**When:**
- `await page.goto(searchPath)` (página de búsqueda con Searcher montado).
- `await page.waitForLoadState('networkidle')`.

**Then:**
- `getComputedStyle(document.body).pointerEvents === 'auto'` tras el mount del Searcher.
- En el log de browser console aparece un `[warn]` con texto que contiene `Searcher` o `body` — confirma que la capa 2 actuó (no fue silenciosa).

**Evidence:**
- DOM: `await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents)).toBe('auto')`.
- Console: capturar `page.on('console', msg => …)` y asertar al menos un warning relacionado.

**Test correspondiente:** mismo archivo e2e arriba.

---

## SCEN-003: Mitigador `pageshow` preservado (no-regresión)

**Given:** archivo fuente `packages/ui-{brand}/app/components/Searcher.vue`.

**When:** test source-level (Vitest) lee el archivo.

**Then:**
- Persiste `addEventListener('pageshow', handleSearcherPageShow)` dentro del `onMounted`.
- Persiste `removeEventListener('pageshow', handleSearcherPageShow)` en `onBeforeUnmount`.
- Persiste el check `if (event.persisted) window.location.reload()` (handler para bfcache cross-document).
- Adicionalmente, el bloque `onMounted` contiene la sanitización defensiva: una mención de `document.body` con asignación o reset (regex flexible: `body\.style\.pointerEvents` y/o `body\.removeAttribute\(.*scroll-locked.*\)`).

**Evidence:** asserts existentes en `Searcher.test.ts:25-41` siguen verdes; nuevo `it()` agregado al mismo describe que testea las dos líneas de cleanup.

**Test correspondiente:** `packages/ui-{brand}/app/components/__tests__/Searcher.test.ts` (extender existente).

---

## SCEN-004: Cierre programático no duplica history.replaceState

**Given:**
- Slideover de form abierto (URL contiene `?reservar=X`).
- Spy sobre `window.history.replaceState` instalado vía `page.evaluate`.

**When:**
- `submitForm` ejecuta exitosamente y dispara la cadena: `stripReservarParam()` → `navigateTo()`. `onBeforeRouteLeave` cierra los dos slideovers + `nextTick()` antes del unmount.

**Then:**
- `replaceState` se invoca **al máximo dos veces** durante la transición:
  1. Una desde `stripReservarParam` (la única necesaria — limpia la URL antes de navegar).
  2. Como máximo una más desde `updateCategoriaUrl` si el watcher en `CategorySelectionSection.vue:329-342` reacciona ANTES de la navegación. **Aceptable si idempotente** (limpia algo ya limpio) pero indeseable.
- Idealmente, `replaceState` solo se invoca una vez (la de `stripReservarParam`). Si se observan más, agregar guard `isClosingForLeave` al watcher para suprimirlo durante el cleanup pre-leave.

**Evidence:**
- `page.evaluate` instala spy: `window.__rsCount = 0; const orig = history.replaceState; history.replaceState = function(...a) { window.__rsCount++; return orig.apply(this, a); };`
- Tras submit y navegación, `await page.evaluate(() => window.__rsCount)` ≤ 2.

**Test correspondiente:** mismo archivo e2e (subtest dentro del describe SCEN-001).

---

## SCEN-005: Móvil (input nativo) intacto

**Given:** viewport <640px (`{ width: 375, height: 812 }`).

**When:** página de búsqueda cargada, sin slideovers abiertos.

**Then:**
- Inputs móviles `#pickup-date-mobile`, `#return-date-mobile` visibles, type=`date`.
- Selectivos `#pickup-location-mobile`, `#return-location-mobile` visibles y funcionales.
- Body sin lock: `getComputedStyle(document.body).pointerEvents === 'auto'`.
- Capa 2 NO loggea warning si body está limpio en mount.

**Evidence:**
- `await expect(page.locator('#pickup-date-mobile')).toBeVisible()`.
- `await expect.poll(...).toBe('auto')`.
- Console capture sin warnings de Searcher cleanup.

**Test correspondiente:** mismo archivo e2e (`describe('SCEN-005 — mobile no-regression')`).

---

## Non-goals (explícito)

- **Refactor de los slideovers anidados a un componente reutilizable**: la duplicación cross-marca y la nidificación de `<u-slideover>` dentro de `<u-slideover>` son anti-patterns conocidos pero fuera de alcance. Issue #25 es un fix puntual; abrir un nuevo issue si se quiere abordar el refactor.
- **Migrar slideover a `:modal="false"`**: cambiaría UX (sin focus trap, scroll behind permitido). Requiere validación QA separada.
- **Eliminar el handler `pageshow` existente**: el caso bfcache cross-document sigue siendo válido en algunos browsers; coexiste con la nueva capa.
- **Test de runtime con admin backend real**: se mockea via Playwright `page.route()` para evitar dependencia de credenciales externas.
- **Cobertura iOS/Safari específica**: alcance del test es Chromium (default Playwright). Si reportes futuros mencionan WebKit-only, agregar matriz multi-engine.

---

## Verification matrix (mapping a archivos)

| Scenario | Test file | Viewport | Marca |
|---|---|---|---|
| SCEN-001 | `e2e/reservation-submit-back-unlocks-searcher.spec.ts` | desktop (1280×720) | `BRAND=alquilatucarro` (mín.); ideal las 3 |
| SCEN-002 | mismo | desktop | mismo |
| SCEN-003 | `packages/ui-*/app/components/__tests__/Searcher.test.ts` | n/a (source-level) | las 3 |
| SCEN-004 | `e2e/reservation-submit-back-unlocks-searcher.spec.ts` | desktop | `alquilatucarro` |
| SCEN-005 | mismo | mobile (375×812) | `alquilatucarro` |

## Satisfaction criteria (Iron Law)

- Antes del fix: SCEN-001 + SCEN-002 deben **fallar** en e2e.
- Después del fix (Capa 1 + Capa 2): los 5 SCEN pasan en ≥3 corridas seguidas (sin flakiness).
- `pnpm typecheck` + `pnpm lint` + `pnpm test` (unit) verdes.
- `e2e/reservation-back-url-cleanup.spec.ts` sigue pasando (no-regresión del fix anterior).
- Validación runtime en `/agent-browser` con dev server local mockeando los endpoints (manual, no replicado en CI).
- `/verification-before-completion` invocado con evidencia fresca antes de commit/PR.
