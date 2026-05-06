# Implementation Plan — Searcher Calendar Autoclose

**Date:** 2026-05-06
**Spec:** `docs/specs/2026-05-06-searcher-calendar-autoclose-design.md` (commits `0088e28`, `6203317`)
**Holdout:** `docs/specs/2026-05-06-searcher-calendar-autoclose/scenarios/searcher-calendar-autoclose.scenarios.md` (commit `df3f819`)
**Related issue:** [#25](https://github.com/amaw-sas/rentacar-web/issues/25) (R3 bfcache, fuera de alcance)

## File structure

| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `packages/ui-alquilatucarro/app/components/Searcher.vue` | Edit (~2 líneas) | Agregar `@update:model-value` al `<u-calendar>` de recogida (entre líneas 148-158) y devolución (entre líneas 212-222) |
| `packages/ui-alquilame/app/components/Searcher.vue` | Edit (~2 líneas) | Mirror idéntico |
| `packages/ui-alquicarros/app/components/Searcher.vue` | Edit (~2 líneas) | Mirror idéntico |
| `e2e/searcher-calendar-autoclose.spec.ts` | New | Playwright multi-marca con 7 tests cubriendo SCEN-001..005 + R1/R2 sanity, viewport explícito por describe |
| `docs/specs/2026-05-06-searcher-calendar-autoclose/implementation/selectors.md` | New (Step 0) | Documenta selectores reales descubiertos en runtime de Reka UI calendar (cell, next-month, etc.) |

**Decomposición:** 4 archivos en una unidad lógica única. NO se extrae componente compartido (YAGNI). El test e2e usa `BRAND` env (config en `playwright.config.ts:12`, default `alquilatucarro`) para parametrizar marca.

## Scenario → acceptance criteria mapping

| Scenario | Test name esperado | Viewport | Acceptance |
|---|---|---|---|
| SCEN-001 (cierre recogida) | `cierra popover de recogida tras seleccionar día` | 1280×720 | `[role="dialog"]` desaparece tras click en celda; `#pickup-date` muestra fecha |
| SCEN-002 (cierre devolución) | `cierra popover de devolución tras seleccionar día` | 1280×720 | mismo patrón con `#return-date` |
| SCEN-003 (independencia) | `seleccionar recogida no abre devolución` | 1280×720 | `getByRole('dialog').count() === 0` post-click |
| SCEN-004 (móvil intacto) | `inputs móviles type=date visibles` | 375×812 | `#pickup-date-mobile` y `#return-date-mobile` visibles + `type="date"`; `#pickup-date` y `#return-date` ocultos |
| SCEN-005 (watcher +7 días) | `seleccionar recogida setea devolución +7 días sin abrir popover` | 1280×720 | Capturar `await page.locator('#return-date').inputValue()` antes (pre-click) y después (post-click); parsear ambos a `Date`; `(after - before) === 7 días` (o equivalentemente: `after === pickup + 7 días`). Popover devolución: `getByRole('dialog').count() === 0`. NOTA: el formato del `<u-input-date>` depende de locale; usar `inputValue()` lee el valor del input y se parsea con `new Date(...)` o `Date.parse(...)`. Si el formato es ambiguo (ej. MM/DD vs DD/MM), normalizar con un helper `parseInputDate()` en el spec del test. |
| R1 sanity | `popover permanece abierto al abrir sin tocar` | 1280×720 | `[role="dialog"]` visible tras `waitForTimeout(1000)` |
| R2 sanity | `navegar mes no cierra popover` | 1280×720 | `[role="dialog"]` visible tras 2 clicks en `next-month` |

Total: **7 tests por marca × 3 marcas = 21 ejecuciones** en CI.

## Prerequisites

- Repo limpio (`git status` → clean) con commit `df3f819` aplicado.
- `pnpm install` ejecutado.
- Node ≥20, pnpm ≥9.
- Playwright instalado (verificar con `pnpm playwright --version`); `e2e/install-deps.sh` está disponible si falta.

## Implementation steps

### Step 0 — Selector spike: descubrir DOM real de `<u-calendar>` abierto

**Size:** S (≤30 min)
**Dependencies:** none

**Why:** El plan asume selectores de Reka UI que no son contractuales (`[data-day]`, control de `next-month`). El spec ya autoriza fallback con `data-testid`, pero antes de elegir entre selector real vs `data-testid` hay que ver el DOM. Sin esto, Step 1 escribe selectores ciegos.

**Approach:**
1. Iniciar `pnpm dev:alquilatucarro` (puerto 4000).
2. Con `/agent-browser`: navegar a `/`, click `#pickup-date`, esperar popover abierto.
3. Tomar `browser_snapshot` del DOM con el calendario visible. Identificar:
   - Selector estable para celda de día clickeable (probablemente `[role="gridcell"]` o `[data-day]`).
   - Selector para celda deshabilitada (probablemente `[data-disabled]` o `aria-disabled="true"`).
   - Selector para botón "next month" (probablemente `button[aria-label*="next"]` o similar — ver props `next-month` en `Searcher.vue:157`).
   - Selector para indicador de mes/año (header del calendario).
4. Confirmar que `<u-popover>` content está marcado con `[role="dialog"]` cuando abierto (asumido en spec).
5. Confirmar que `pnpm dev:alquilame` (puerto 4002) y `pnpm dev:alquicarros` (puerto 4001) renderizan `<Searcher />` en `/` (homepage) — alternativamente, identificar la ruta correcta por marca para el test e2e. Las 3 marcas DEBEN tener una ruta común que renderice Searcher para que `BRAND=...` parametrice sin cambiar la URL.
6. Documentar hallazgos en `docs/specs/2026-05-06-searcher-calendar-autoclose/implementation/selectors.md` con el snapshot relevante. Este archivo es scratch/working notes de implementación; queda en repo junto al plan pero no es contrato.
7. Si los selectores son inestables o no expuestos en DOM (p. ej. clases hash de Tailwind como única opción), agregar al plan: añadir `data-testid` en Step 2 antes de Step 1's tests. (Esta decisión retroalimenta Step 1.)

**Acceptance criteria:**
- Archivo `selectors.md` creado con selectores reales documentados de runtime.
- Decisión registrada: usar selectores nativos de Reka UI O agregar `data-testid` (con qué valor, en qué línea de cada `Searcher.vue`).
- `/agent-browser` confirma `[role="dialog"]` aparece al abrir popover, desaparece al click outside (validación pre-fix).
- Confirmado: las 3 marcas renderizan `<Searcher />` en `/` (o ruta común documentada en `selectors.md` si difiere).

---

### Step 1 — Test e2e que falla (TDD red phase)

**Size:** M (~60-90 min)
**Dependencies:** Step 0

**Approach:**
1. Crear `e2e/searcher-calendar-autoclose.spec.ts` con 7 tests. Estructura:
   ```ts
   import { test, expect } from '@playwright/test';

   test.describe('Searcher calendar autoclose - desktop', () => {
     test.use({ viewport: { width: 1280, height: 720 } });

     test('cierra popover de recogida tras seleccionar día', async ({ page }) => { /* SCEN-001 */ });
     test('cierra popover de devolución tras seleccionar día', async ({ page }) => { /* SCEN-002 */ });
     test('seleccionar recogida no abre devolución', async ({ page }) => { /* SCEN-003 */ });
     test('seleccionar recogida setea devolución +7 días sin abrir popover', async ({ page }) => { /* SCEN-005 */ });
     test('popover permanece abierto al abrir sin tocar', async ({ page }) => { /* R1 sanity */ });
     test('navegar mes no cierra popover', async ({ page }) => { /* R2 sanity */ });
   });

   test.describe('Searcher calendar autoclose - mobile', () => {
     test.use({ viewport: { width: 375, height: 812 } });
     test('inputs móviles type=date visibles', async ({ page }) => { /* SCEN-004 */ });
   });
   ```
2. Cada test usa los selectores documentados en `selectors.md` (Step 0). Selección de día válida: primera celda clickeable disponible (no deshabilitada, ≥ `minPickupDate`).
3. Tests usan `page.goto('/')` (homepage de cada marca renderiza Searcher) y `await page.waitForLoadState('networkidle')`.
4. Para SCEN-005, capturar valor de `#return-date` antes y después; asertar diff de 7 días.
5. Ejecutar: `BRAND=alquilatucarro pnpm playwright test searcher-calendar-autoclose --project=chromium`.
6. **Expected (TDD red):**
   - SCEN-001/002/003/005: **FAIL** (popover no cierra — el bug actual).
   - R1/R2 sanity: **PASS** (esos tests asertan no-cierre, que ya es el comportamiento actual).
   - SCEN-004 (móvil): **PASS** (móvil ya funciona, sin cambios necesarios).
7. Si la distribución de fails no coincide con lo esperado: investigar selectores antes de Step 2.

**Acceptance criteria:**
- Archivo `e2e/searcher-calendar-autoclose.spec.ts` creado con 7 tests, viewport explícito por describe.
- `BRAND=alquilatucarro pnpm playwright test searcher-calendar-autoclose --project=chromium` ejecuta los 7 tests; SCEN-001/002/003/005 **fallan**, SCEN-004/R1/R2 **pasan** (red phase de SCEN-001..003,005).
- Output literal del comando capturado para usar como evidencia en Step 2.
- `pnpm typecheck` y `pnpm lint` pasan (el test file no debe romper esos comandos).

---

### Step 2 — Aplicar fix a `alquilatucarro` (TDD green phase)

**Size:** S (~20-30 min)
**Dependencies:** Step 1

**Approach:**
1. En `packages/ui-alquilatucarro/app/components/Searcher.vue`:
   - En el `<u-calendar v-model="selectedPickupDate" ...>` (abre línea 148, atributos hasta línea 158): agregar `@update:model-value="pickupDateCalendarOpen = false"`.
   - En el `<u-calendar v-model="selectedReturnDate" ...>` (abre línea 212, atributos hasta línea 222): agregar `@update:model-value="returnDateCalendarOpen = false"`.
2. Re-ejecutar: `BRAND=alquilatucarro pnpm playwright test searcher-calendar-autoclose --project=chromium`.
3. **Expected (green phase):** todos los 7 tests pasan (7 passed, 0 failed, 0 skipped).
4. Re-run del comando 3 veces consecutivas para verificar estabilidad (no flakiness).
5. `/agent-browser` runtime adicional sobre `pnpm dev:alquilatucarro`:
   - Abrir popover sin interactuar, esperar 1.5s → confirmar permanece abierto (R1 Plan A live check).
   - Abrir popover, click `next-month` 2x → confirmar permanece abierto (R2 live check).
   - Inspeccionar consola (cero errores) y network panel (cero requests fallidos).
6. **Si R1 Plan A falla** (popover cierra al abrir o al cambiar mes), aplicar **Plan B**:
   ```ts
   // En <script setup> de Searcher.vue, después de la sección de refs:
   const pickupCalendarUserInteracted = ref(false);
   const returnCalendarUserInteracted = ref(false);
   watch(pickupDateCalendarOpen, (open) => { if (!open) pickupCalendarUserInteracted.value = false; });
   watch(returnDateCalendarOpen, (open) => { if (!open) returnCalendarUserInteracted.value = false; });
   ```
   Y en el template:
   ```vue
   <u-calendar
     v-model="selectedPickupDate"
     @update:model-value="pickupCalendarUserInteracted ? (pickupDateCalendarOpen = false) : (pickupCalendarUserInteracted = true)"
     ...
   />
   ```
   Plan B local al template + 4 líneas en script. NO toca store, composable, ni los otros archivos.

**Acceptance criteria:**
- Diff a `Searcher.vue` muestra exactamente 2 líneas agregadas (Plan A) o ~2 + script changes (Plan B), sólo en alquilatucarro.
- `pnpm typecheck` pasa.
- `pnpm lint` pasa.
- E2E command output: 7 passed, 0 failed, 0 skipped en 3 ejecuciones consecutivas.
- `/agent-browser` confirma SCEN-001..005 + R1/R2 sanity en runtime.
- SCEN-001..005 + R1/R2 satisfechos en `BRAND=alquilatucarro`.

---

### Step 3 — Mirror a `alquilame` y `alquicarros`

**Size:** S (~20 min)
**Dependencies:** Step 2

**Approach:**
1. Aplicar exactamente el mismo cambio (Plan A o Plan B según resultó Step 2) en:
   - `packages/ui-alquilame/app/components/Searcher.vue` (líneas correspondientes).
   - `packages/ui-alquicarros/app/components/Searcher.vue` (líneas correspondientes).
2. Verificar que el bloque calendar es idéntico entre las 3 archives. Strategy: extraer una ventana acotada y diff:
   ```bash
   for brand in alquilatucarro alquilame alquicarros; do
     sed -n '128,228p' "packages/ui-${brand}/app/components/Searcher.vue" \
       > /tmp/searcher-${brand}-calendar.txt
   done
   diff /tmp/searcher-alquilatucarro-calendar.txt /tmp/searcher-alquilame-calendar.txt
   diff /tmp/searcher-alquilatucarro-calendar.txt /tmp/searcher-alquicarros-calendar.txt
   ```
   Ambos diffs deben ser **vacíos** (las 3 marcas comparten el mismo bloque de Searcher para el calendario).
3. Verificar la presencia del nuevo handler en las 3 archives:
   ```bash
   grep -c '@update:model-value' packages/ui-*/app/components/Searcher.vue
   ```
   - **Si Plan A se aplicó:** debe imprimir `2` en cada archivo (uno por calendar).
   - **Si Plan B se aplicó:** debe imprimir el mismo conteo en los 3 archivos (la cantidad exacta depende de cómo se factorizó el handler — anotar en Step 2 al aplicar Plan B y propagar el mismo conteo aquí). Lo crítico es que el conteo sea **idéntico entre las 3 marcas**, no un número absoluto.
4. Ejecutar el e2e en las 3 marcas, con 3 ejecuciones consecutivas por marca para verificar estabilidad (no flakiness):
   ```bash
   for brand in alquilatucarro alquilame alquicarros; do
     for i in 1 2 3; do
       BRAND=$brand pnpm playwright test searcher-calendar-autoclose --project=chromium
     done
   done
   ```
   Cada uno de los 9 runs (3 marcas × 3 ejecuciones) debe retornar 7 passed, 0 failed, 0 skipped.

**Acceptance criteria:**
- `diff` del bloque calendar (líneas 128-228) entre las 3 archives es vacío.
- `grep -c '@update:model-value'` retorna **el mismo conteo** en cada Searcher.vue (≥2 en Plan A; conteo de Plan B debe ser propagado por igual).
- E2E pasa en las 3 marcas con 3 ejecuciones consecutivas cada una (9 runs × 7 tests = 63 passed, 0 failed, 0 skipped).
- `pnpm typecheck` (corre las 3 ui-* en paralelo) y `pnpm lint` pasan.
- SCEN-001..005 + R1/R2 satisfechos en las 3 marcas, estables a lo largo de las 3 ejecuciones.

---

### Step 4 — Quality gate, dogfood, commit, PR

**Size:** S (~30-45 min)
**Dependencies:** Step 3

**Approach:**
1. **`/dogfood`** exploratorio sobre `pnpm dev:alquilatucarro`. Foco específico:
   - Selección rápida ida-y-vuelta: abrir recogida, seleccionar, abrir devolución, seleccionar — confirmar ambas cierran independientemente.
   - Teclado: abrir popover, navegar con flechas, Enter en celda — registrar comportamiento (no es scenario formal pero documentar findings).
   - Reabrir popover ya con fecha seleccionada (no estado inicial) — confirmar Plan A no dispara cierre prematuro en mount post-selección.
   - Cambio de marca via toggle de URL (si aplica) — sanity check.
   Issues no críticos van como follow-up tasks; críticos bloquean Step 4.
2. **`/verification-before-completion`** con evidencia fresca:
   - Output literal de los 3 comandos `BRAND=… pnpm playwright test ...`.
   - Output de `pnpm typecheck` y `pnpm lint`.
   - Resumen `/agent-browser` runtime.
   - Estado: 21/21 SCEN+sanity satisfechos × 3 marcas.
   - Reward hacking check: ningún `*.scenarios.md` modificado durante implementación.
3. Crear branch (sugerido: `fix/searcher-calendar-autoclose`):
   ```bash
   git checkout -b fix/searcher-calendar-autoclose
   ```
4. Commitear cambios — un solo commit recomendado:
   ```
   fix(reservations): cerrar popovers de fecha tras seleccionar día

   Spec: docs/specs/2026-05-06-searcher-calendar-autoclose-design.md
   Holdout: 7 escenarios (SCEN-001..005 + R1/R2 sanity).

   Cambio: agregar @update:model-value al <u-calendar> dentro del
   <u-popover> de recogida y devolución en las 3 marcas. Móvil
   sin cambios (input nativo ya cierra).

   E2E: e2e/searcher-calendar-autoclose.spec.ts cubre los 7 escenarios
   parametrizado por BRAND env, viewport explícito por describe.

   Out of scope: bug bfcache widget block (issue #25).
   ```
5. **`/pull-request`** para crear PR. El skill ejecuta los 4 reviewers (code-reviewer + security-reviewer + edge-case-detector + performance-engineer) en paralelo como gate.
6. Esperar resultados de los 4 reviewers; remediar issues bloqueantes; abrir PR a `main` cuando estén verdes.

**Acceptance criteria:**
- `/dogfood` documentado con findings (críticos resueltos antes de Step 4 cierre; no-críticos como follow-up).
- `/verification-before-completion` retorna 21/21 SCEN+sanity satisfechos con evidencia literal.
- 1 commit en branch `fix/searcher-calendar-autoclose` con scope `reservations`.
- PR creado vía `/pull-request`.
- Los 4 reviewers retornan sin bloqueantes; PR queda listo para revisión humana.

## Testing strategy

- **Unit:** ninguna. Cambio puramente template; no hay lógica nueva.
- **Integration:** ninguna. Store + composable intactos.
- **E2E:** `e2e/searcher-calendar-autoclose.spec.ts` — 7 tests, viewport explícito, parametrizado por `BRAND` env. Es el ground truth de satisfacción.
- **Runtime:** `/agent-browser` antes de Step 2 (selectors) y durante Step 2/4 (UX). `/dogfood` en Step 4.
- **Regression guard:** E2E en las 3 marcas detecta deriva (R4) y regresión móvil (R5).

## Rollout plan

- **Deploy:** Vercel preview por PR; promoción a producción tras merge a `main` (auto-deploy).
- **Monitoring:** ningún cambio de métricas. Cambio aislado de UX, no afecta endpoints ni datos.
- **Rollback:** revert del commit. Cambio aislado a 3 archives + 1 e2e; revert trivial sin migración de datos.

## Risk register

| # | Riesgo | Status / Plan |
|---|---|---|
| R1 | Cierre prematuro al abrir popover | Plan A esperado; Plan B (gate `userInteracted`) está restated en Step 2 con código completo. Local al template, sin tocar store/composable. |
| R2 | Navegación de mes cierra popover | Mismo Plan B que R1 si reproduce. |
| R3 | bfcache widgets bloqueados | **Out of scope.** Issue [#25](https://github.com/amaw-sas/rentacar-web/issues/25). |
| R4 | Deriva entre marcas | Step 3 verifica diff vacío de bloque calendar + grep handler count + e2e en las 3. |
| R5 | Regresión SCEN-005 (+7 días) | Cambio sólo template. SCEN-005 lo guarda. |
| New: selectores Reka UI inestables | Step 0 spike + fallback `data-testid` autorizado en spec. |

## Estimación

- **Total:** 5 steps, S+M+S+S+S ≈ **3-4 horas** trabajo activo.
- **Riesgo:** bajo. Cambio mecánico, holdout claro, e2e infra existente.
- **Bloqueante potencial:** Plan B de R1/R2 (~30 min adicional). Selectores Reka UI inestables (Step 0 lo descubre a 30 min de iniciar).

## Handoff

- **Next:** invocar `/scenario-driven-development` o `/sop-task-generator` para ejecutar Step 0.
- **Holdout vivo:** `docs/specs/2026-05-06-searcher-calendar-autoclose/scenarios/searcher-calendar-autoclose.scenarios.md`.
- **Verification gate:** `/verification-before-completion` en Step 4 antes del PR.
