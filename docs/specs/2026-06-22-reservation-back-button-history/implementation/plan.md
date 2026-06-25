---
name: reservation-back-button-history-plan
created_by: claude
created_at: 2026-06-22T00:00:00Z
issue: null
related: ../../issue-65-a11y-reservation-slideover/design.md
status: approved (plan only — no implementado)
---

# Plan — "Atrás" del navegador vuelve al paso anterior, no al index

Aprobado solo como plan. No tocar código hasta confirmación explícita.

## Problema

En móvil, tras buscar y entrar a un vehículo se abre el slideover de reserva
(2 pasos: **Resumen** → **Datos**). El botón "atrás" del navegador (no el de
pantalla) lleva al **index** desde cualquiera de los dos pasos, perdiendo el
listado y obligando a repetir ciudad/fechas/horas.

## Causa raíz

`CategorySelectionSection.vue` sincroniza la URL del slideover con
`window.history.replaceState` (`:354`), tanto al **abrir** como al **cambiar de
paso**. `replaceState` **sobrescribe** la entrada actual en vez de **agregar**
una, así que el slideover nunca crea entradas de historial propias. La pila
queda `index → /categoria/X` (el listado fue sobreescrito) y "atrás" salta al
index.

`replaceState` fue deliberado por dos motivos (ambos con tests):
1. Evitar que Nuxt re-monte la página `/categoria/[codigo]` (`router.replace`
   causaba re-search + scroll al tope + loop; ver `:341-344`).
2. Limpiar la URL tras submit para que "atrás" no reabra el slideover
   (`stripReservarParam` en `useStoreReservationForm.ts`;
   `e2e/reservation-back-url-cleanup.spec.ts`).

## Escenarios observables

1. **Back desde Datos** → **cierra** y vuelve al **listado** (una sola entrada; NO re-busca, conserva scroll). El "Volver" interno sí hace Datos→Resumen.
2. **Back desde Resumen** → **cierra** el slideover y vuelve al **listado** con su scroll, no al index.
3. **Back desde el listado** → index (un paso más).
4. **Deep-link / reload** de `/…/categoria/X` (y `?reservar=X`) → auto-abre el paso correcto, sin empujar entradas extra.
5. **Tras enviar la reserva** → "atrás" desde la confirmación **no reabre** el slideover ni bloquea el Searcher (invariante existente preservado).
6. En todo momento: un solo `[role=dialog]`; al cerrar, `<body>` sin `pointer-events:none` pegado.

## Diseño — UNA sola entrada de historial (decisión final tras prueba en móvil)

> El plan inicial empujaba **dos** entradas (Resumen y Datos) para que "atrás"
> hiciera Datos→Resumen. La prueba en móvil mostró que la entrada de Datos
> (`/categoria/X?reservar`) difiere de la ruta donde Vue Router cree estar (el
> listado), así que "atrás" desde Datos **navegaba/re-montaba** → flash de
> "recargar los carros". Decisión: **una sola entrada** para todo el slideover;
> "atrás" desde cualquier paso vuelve al listado limpio.

| Acción | Plan final |
|---|---|
| Abrir Resumen (`setSelectedCategory`) | **`pushState`** → única entrada `/categoria/X` |
| Resumen → Datos (`goToForm`) | `replaceState` a `?reservar` (**no** empuja) |
| Datos → Resumen ("Volver" interno) | cambio de paso + `replaceState` (no toca historial) |
| Apertura desde URL (deep-link, enmascarada) | sin cambio |

Hacia atrás — listener `popstate` que reconcilia por la URL ya retrocedida:

| Estado al recibir `popstate` | Acción |
|---|---|
| Slideover abierto en **Datos** | `slideoverStep = 'resumen'` (no cierra) |
| Slideover abierto en **Resumen** | `slideoverOpen = false` + cleanup de reka (replicar el de `onBeforeRouteLeave`, issue #25) |
| Slideover cerrado | no-op (dejar navegar) |

Botones internos "Volver" (`backToResume`, cerrar `:148`): pasan a usar
**`history.back()`** en vez de mutar `slideoverStep`/`slideoverOpen` directo, para
que el botón de pantalla y el físico recorran la **misma** pila.

### Edge case post-submit (lo destapa el push de 2 entradas)

Al enviar desde Datos hay **2 entradas empujadas** (Resumen + Datos) en la pila.
`stripReservarParam` hoy limpia solo la actual → "atrás" desde `/reservado`
caería en la entrada "Resumen" y **reabriría** el slideover (regresión del bug
que cubre `reservation-back-url-cleanup`).

→ Llevar un **contador de entradas empujadas** en el componente y, en el submit
(antes de `navigateTo('/reservado')`), deshacerlas (`history.go(-n)` o limpiar
las N vía replaceState) para aterrizar en la URL desnuda del listado.

## Mapa de archivos (blast radius)

| Archivo | Cambio |
|---|---|
| `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/components/CategorySelectionSection.vue` | `pushState` por paso; listener `popstate` step-aware; `history.back()` en botones internos; contador de entradas empujadas; **título → "Resumen de la selección"** (`:73`, y footer `:91` donde aplique) |
| `packages/logic/src/stores/useStoreReservationForm.ts` | `stripReservarParam`: deshacer las N entradas empujadas en submit |

**Paridad ×3:** el plan original (issue-65) asume las 3 copias byte-idénticas
(editar `alquilatucarro` → copiar). Hoy `alquilame` **difiere** (md5 distinto):
verificar primero que la divergencia sea solo cosmética de marca; reconciliar el
`<script>` antes de aplicar, y dejar las 3 con el mismo `<script>`/lógica.

## Pasos

**Paso 1 — Rename del título** · Size: XS · Dep: ninguna
"Resumen de la reserva" → "Resumen de la selección" en los 3 componentes.
Cero riesgo; se puede adelantar suelto.

**Paso 2 — pushState por paso + contador** · Size: M · Dep: 1
Cambiar el watcher `[slideoverOpen, slideoverStep]` para empujar en transiciones
hacia adelante (abrir, Resumen→Datos) y mantener `replaceState` solo para la
apertura-desde-URL (vía `urlSyncDepth`). Llevar `pushedEntries`.

**Paso 3 — listener `popstate` step-aware + cleanup** · Size: M · Dep: 2
Cerrar/bajar de paso según estado; replicar el cleanup de pointer-events de
`onBeforeRouteLeave`. Botones internos → `history.back()`.

**Paso 4 — submit deshace N entradas** · Size: S · Dep: 2,3
Extender `stripReservarParam`/flujo de submit.

## Tests (e2e Playwright)

- **Nuevo** `reservation-back-returns-to-listing.spec.ts`: Resumen → `goBack()` → listado, dialog cerrado, cards visibles.
- **Nuevo** `reservation-back-datos-to-resumen.spec.ts`: Datos → `goBack()` → sigue abierto en paso Resumen.
- **Nuevo** `reservation-back-after-submit-no-reopen.spec.ts`: tras submit, `goBack()` no reabre dialog, Searcher interactivo.
- **Revisar/ajustar**: `reservation-back-url-cleanup`, `reservation-submit-back-unlocks-searcher`, `reservation-a11y-single-dialog`, `clic-foto-abre-reserva`.

## Verificación

- `typecheck` 3 marcas + `pnpm test:e2e` (specs de arriba).
- `/agent-browser` + **iPhone real** sobre el preview: flujo index→listado→Resumen→Datos y "atrás" en cada paso. Cero errores de consola.

## Riesgos

- Zona con regresiones históricas (#25 pointer-events colgado, #65 single-dialog).
  Un `popstate` mal cerrado deja el modal o `pointer-events:none` pegado.
- Desync Vue Router ↔ history API: probar deep-link + reload + back combinados.
- Drift de paridad ×3 (alquilame): reconciliar antes de aplicar.
