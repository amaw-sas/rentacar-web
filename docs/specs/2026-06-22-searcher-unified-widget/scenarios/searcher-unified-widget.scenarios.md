---
name: searcher-unified-widget
created_by: pablo+claude
created_at: 2026-06-22T00:00:00Z
---

# Searcher: widget unificado @nuxt/ui (eliminar inputs nativos móviles)

Migra el formulario de búsqueda de disponibilidad (`Searcher.vue`, en las 3 marcas)
para que **móvil y desktop dejen de usar inputs nativos**, eliminando la rama
nativa móvil: `<input type="date">`, los `<select>` de lugar/hora,
`clampMobileDateInput`, el bridge string↔`CalendarDate` y el binding `:value`
one-way. En **móvil**, lugar, hora y fecha se eligen en un **`<u-slideover>` a
pantalla completa** (bottom sheet, patrón Kayak): lugar/hora vía el componente
`SearcherSelectDrawer` (botón trigger + slideover con buscador sin autofocus +
lista de opciones), y la fecha vía slideover con `<u-calendar>`. En **desktop** se
mantiene el widget actual: `<u-select-menu>` para lugar/hora y `<u-popover>` +
`<u-calendar>` para fecha.

Origen: directiva tras problemas con el input nativo de calendario/seleccionable
en móvil (globo de validación dark-mode en Android, no clearable, bridge frágil).
Referente competencia: Kayak (calendario custom en todo dispositivo, nunca nativo).
Prototipo validado en worktree `.worktrees/spike-searcher-unified` (3 riesgos OK;
bug "calendario fantasma" por estado compartido encontrado y corregido).

Spec asociado: `docs/specs/2026-06-22-searcher-unified-widget-design.md`.
**Supersede** el `SCEN-004: Móvil intacto` (input nativo) de
`docs/specs/2026-05-06-searcher-calendar-autoclose/` — ese contrato queda obsoleto.

Marcas: `alquilatucarro`, `alquilame`, `alquicarros`. Ruta de prueba: `/{city}`
(p. ej. `/bogota`), que renderiza `<Searcher />` vía `CityPage.vue`.
`mobile = 390×844`, `desktop = 1280×900`.

---

## SCEN-001: Selección de fecha de recogida en móvil vía slideover (sin input nativo)

**Given**:
- Viewport móvil (390×844), página `/bogota` cargada, `<Searcher />` montado.
- El campo "Día de recogida" muestra un botón con la fecha por defecto formateada
  en español (p. ej. "23 de junio de 2026"), NO un `<input type="date">`.
- No existe en el DOM ningún `input[type="date"]`.

**When**: El usuario toca el botón "Día de recogida" y luego una celda de día
válida (futura, no deshabilitada) en el calendario.

**Then**:
- Al tocar el botón aparece un `<u-slideover>` (`[role="dialog"]` con
  `data-side="bottom"`) que contiene un `<u-calendar>` con `[role="grid"]`.
- Al seleccionar el día: el slideover cierra (`[role="dialog"]` no visible),
  el botón muestra la nueva fecha formateada, y
  `useStoreReservationForm().fechaRecogida` refleja la fecha ISO seleccionada.
- Cero `input[type="date"]` en el DOM en todo el flujo.

**Evidence**:
- DOM: `await expect(page.locator('input[type="date"]')).toHaveCount(0)`.
- DOM: `await expect(page.getByRole('dialog')).toBeVisible()` tras tocar el botón;
  `toBeHidden()` tras seleccionar día.
- DOM: el botón trigger contiene el texto de la fecha seleccionada.
- Store: `fechaRecogida` ≡ ISO del día clickeado.

---

## SCEN-002: Selección de fecha de devolución en móvil vía slideover

**Given**: Viewport móvil, fecha de recogida ya fijada, botón "Día de devolución"
visible con su fecha formateada y badge de días (`N días`).

**When**: El usuario toca "Día de devolución" y selecciona un día válido
(≥ recogida, ≤ `maxReturnDate`, no deshabilitado).

**Then**:
- Abre un slideover independiente con su `<u-calendar>` (`min-value`=recogida,
  `max-value`=`maxReturnDate`).
- Tras seleccionar: cierra, el botón muestra la fecha, `fechaDevolucion` se
  actualiza y el badge `N días` recalcula (= días entre recogida y devolución).

**Evidence**:
- DOM: `getByRole('dialog')` visible→hidden alrededor de la selección.
- Store: `fechaDevolucion` ≡ ISO seleccionado; `selectedDays` consistente.
- DOM: el badge muestra el conteo correcto (reusar el assert de
  `docs/specs/issue-99-search-copy-day-count`).

---

## SCEN-003: Un solo calendario — no aparece calendario fantasma

**Given**: Viewport móvil, ambos campos de fecha cerrados.

**When**: El usuario toca "Día de recogida" para abrir el calendario móvil.

**Then**:
- Existe **exactamente un** `[role="grid"]` de calendario visible en el DOM.
- NO aparece un segundo calendario portaleado al `<body>` (el popover desktop
  no debe renderizarse en móvil). Regresión del bug encontrado en el prototipo:
  estado de apertura compartido entre popover desktop (portaleado, ignora
  `hidden sm:block`) y slideover móvil.

**Evidence**:
- DOM: `await expect(page.getByRole('grid')).toHaveCount(1)` mientras el
  slideover está abierto (filtrando grids de calendario, no otras tablas).
- Inspección `/agent-browser`: una sola superficie de calendario, sin overlay
  flotante en esquina superior izquierda.

---

## SCEN-004: `body` recupera interactividad tras cerrar el calendario (regresión #25)

**Given**: Viewport móvil, página `/bogota` cargada.

**When**: El usuario abre y cierra el calendario de recogida y el de devolución
**3 veces** (cerrando con el botón "Cerrar" del slideover y con selección de día).

**Then**: Tras cada cierre, `document.body` NO queda con
`style.pointer-events: none` ni atributo `data-scroll-locked`, y el botón
"BUSCAR VEHÍCULOS" sigue siendo clickeable.

**Evidence**:
- DOM: tras cada ciclo, `body.style.pointerEvents` ∈ {"", no-set} y
  `body.hasAttribute('data-scroll-locked') === false`.
- DOM: `await expect(page.getByRole('link', { name: /BUSCAR/i })).toBeEnabled()`.
- 3 iteraciones, todas verdes (sin flakiness).

---

## SCEN-005: Desktop sin regresión — popover, segmentos e input intactos

**Given**: Viewport desktop (1280×900), `/bogota` cargada.

**When**: El usuario hace click en `#pickup-date` (segmentos de `<u-input-date>`)
y selecciona un día en el `<u-popover>` que despliega.

**Then**:
- El popover abre (`[role="dialog"]`), al seleccionar día cierra (auto-close
  preservado de `searcher-calendar-autoclose`), `#pickup-date` muestra la fecha
  y `fechaRecogida` se actualiza.
- En desktop NO se renderiza ningún `<u-slideover>` de fecha visible.

**Evidence**:
- DOM: `#pickup-date` y `#return-date` visibles; botones trigger móviles ocultos
  (`hidden`/no presentes) en este viewport.
- DOM: dialog visible→hidden alrededor de la selección; `#pickup-date` con valor.

---

## SCEN-006: Lugar de recogida/devolución seleccionable en móvil vía drawer (sin `<select>` nativo)

**Given**: Viewport móvil, `/bogota`, sucursales cargadas (`sortedBranches`).
El campo "Lugar de recogida" muestra un **botón trigger** (no un `<select>`),
con el `name` de la sucursal actual o el placeholder.

**When**: El usuario toca el botón "Lugar de recogida"; se abre un
**`SearcherSelectDrawer`** (slideover a pantalla completa), escribe en su buscador
para filtrar y toca una sucursal.

**Then**:
- No existe `<select>` nativo en el DOM para lugar/hora.
- Al tocar el trigger aparece un `<u-slideover>` (`[role="dialog"]`,
  `data-side="bottom"`) a pantalla completa (`h-dvh`) con un `<u-input>` de
  búsqueda **sin autofocus** (el teclado NO aparece solo) y una lista de botones
  de opción.
- El buscador filtra la lista por `name`; al tocar una opción, `lugarRecogida`
  (código de sucursal) se actualiza en el store, el watcher sincroniza
  `lugarDevolucion` (misma lógica que hoy en `useSearch`) y el slideover cierra.

**Evidence**:
- DOM: `await expect(page.locator('select')).toHaveCount(0)`.
- DOM: `getByRole('dialog')` visible tras tocar el trigger; al abrir,
  `document.activeElement` NO es el input de búsqueda (no-autofocus).
- DOM: escribir en el buscador reduce los botones de opción; `hidden`/cerrado tras
  seleccionar; el trigger muestra el `name` de la sucursal.
- Store: `lugarRecogida` ≡ `code` elegido; `lugarDevolucion` sincronizado.

---

## SCEN-007: Hora seleccionable en móvil vía drawer con buscador (sin `<select>` nativo)

**Given**: Viewport móvil, `/bogota`, opciones de hora cargadas
(`pickupHourOptions`, hasta 48 slots de 30 min filtrados por lead-time/horario).
El campo "Hora de recogida" muestra un **botón trigger** (no un `<select>`).

**When**: El usuario toca "Hora de recogida"; se abre el `SearcherSelectDrawer`
(slideover full-screen), escribe "3:00 p" en su buscador y toca "3:00 p. m.".

**Then**:
- El drawer es un `<u-slideover>` (`[role="dialog"]`) con buscador sin autofocus y
  una lista de botones de opción (texto centrado, `text-lg`); el buscador filtra a
  la coincidencia; al seleccionar, el campo muestra "3:00 p. m.", `horaRecogida`
  en el store ≡ "15:00" (formato 24h interno) y el slideover cierra.

**Evidence**:
- DOM: el campo "Hora de recogida" muestra "3:00 p. m." tras la selección.
- Store: `horaRecogida === "15:00"`.
- DOM: cero `<select>` nativos; `getByRole('dialog')` visible→hidden alrededor de
  la selección.

---

## SCEN-008: No se pueden elegir fechas pasadas (reemplaza el clamp nativo)

**Given**: Viewport móvil y desktop, fecha actual America/Bogota.

**When**: El usuario abre el calendario de recogida.

**Then**: Los días anteriores a `minPickupDate` (hoy, salvo rollover same-day)
están **deshabilitados** (atributo `data-disabled`/`aria-disabled`, no
clickeables). No existe forma de fijar una fecha pasada — satisface la intención
del antiguo `clampMobileDateInput` sin globo de validación de Android.

**Evidence**:
- DOM: celdas con fecha < `minPickupDate` tienen `[data-disabled]` y un click
  sobre ellas NO cambia `fechaRecogida`.
- Móvil: ya no existe `input[type="date"]` ⇒ imposible el globo dark-mode de
  Android (verificación estructural).

---

## SCEN-009: Devolución ≥ recogida + auto +7 días + badge (lógica de búsqueda preservada)

**Given**: Viewport móvil, sin selección previa del usuario.

**When**: El usuario fija recogida = hoy+3 días.

**Then**:
- `fechaDevolucion` se setea automáticamente a recogida+7 (watcher de
  `useSearch`), el badge muestra "7 días".
- En el calendario de devolución, los días < recogida están deshabilitados
  (`min-value`), y los > `maxReturnDate` también (`max-value`).

**Evidence**:
- Store: tras fijar recogida, `fechaDevolucion ≡ fechaRecogida + 7 días`.
- DOM: badge "7 días"; celdas < recogida con `[data-disabled]` en el calendario
  de devolución.

---

## SCEN-010: Restricción de horario por sucursal (#47) preservada en ambos widgets

**Given**: Una sucursal con días cerrados configurados (predicado
`isPickupDateUnavailable`/`isReturnDateUnavailable` no trivial).

**When**: El usuario abre el calendario (móvil slideover y desktop popover).

**Then**: Los días cerrados aparecen **no disponibles**
(`[data-unavailable]`, no seleccionables) en ambos widgets, y las opciones de
hora respetan `pickupHourOptions`/`returnHourOptions` filtradas por horario.
El gate `isSelectionWithinSchedule` sigue deshabilitando "BUSCAR" cuando aplica.

**Evidence**:
- DOM: celdas de días cerrados con `[data-unavailable]` en móvil y desktop.
- DOM: con selección fuera de horario, `link "BUSCAR VEHÍCULOS"` deshabilitado
  (`aria-disabled`/`disabled`).

---

## SCEN-011: El campo de fecha nunca queda en blanco (intención del no-clear guard)

**Given**: Viewport móvil, fecha de recogida fijada.

**When**: El usuario abre el slideover y lo cierra con "Cerrar" sin seleccionar
otro día.

**Then**: El botón de fecha sigue mostrando la fecha previa (nunca queda vacío);
`fechaRecogida` no cambia. El calendario no ofrece afordancia de "limpiar", así
que el estado vacío es estructuralmente imposible — satisface la intención del
antiguo guard `if (!value) repaint`.

**Evidence**:
- DOM: tras cerrar sin seleccionar, el trigger conserva la fecha previa.
- Store: `fechaRecogida` idéntico antes y después de abrir/cerrar.

---

## SCEN-012: bfcache — la página vuelve usable tras "atrás" del navegador

**Given**: Viewport móvil, usuario navegó de `/bogota` → reserva → "atrás".

**When**: El navegador restaura desde bfcache (`pageshow` con `persisted=true`).

**Then**: La página recarga (comportamiento preservado), los selects y campos de
fecha quedan responsivos. Regresión del manejo `handleSearcherPageShow`.

**Evidence**:
- Source/behavior: listener `pageshow` registrado en mount y removido en unmount;
  `window.location.reload()` cuando `event.persisted`.
- DOM tras restauración simulada: los `<u-select-menu>` abren y seleccionan.

---

## SCEN-013: La búsqueda envía los parámetros correctos desde las selecciones

**Given**: Viewport móvil, usuario fijó lugar, fechas y horas válidas.

**When**: El usuario toca "BUSCAR VEHÍCULOS".

**Then**: La navegación usa `searchLinkName`/`searchLinkParams` derivados de las
selecciones (mismo contrato que hoy), llevando a la página de resultados con la
ciudad/sucursal/fechas correctas. Cero errores de consola, cero requests ≥400.

**Evidence**:
- DOM: el `link` "BUSCAR VEHÍCULOS" apunta a la ruta esperada (`to` con
  `params` correctos) y está habilitado cuando la selección es válida.
- Network/console: 0 errores, 0 requests con status ≥400 en el flujo.

---

## SCEN-014: Paridad entre las 3 marcas

**Given**: `BRAND ∈ {alquilatucarro, alquilame, alquicarros}`.

**When**: Se ejecuta el suite en cada marca (móvil y desktop).

**Then**: En las 3 marcas, `Searcher.vue` no contiene `input[type="date"]` ni
`<select>` nativo, usa slideover/drawer en móvil + popover/select-menu en desktop,
y SCEN-001..013 se satisfacen. El estilo de marca (colores/gradientes) se respeta:
el badge de días/horas usa el color de cada marca (lime `#a3f78b`+negro en
alquilatucarro/alquicarros, `red-600`+blanco en alquilame), y el calendario hereda
el `calendarUIConfig` de cada marca con contraste correcto.

**Evidence**:
- E2E corrido con `BRAND=alquilatucarro|alquilame|alquicarros`, todos verdes.
- DOM por marca: `input[type="date"]` count 0, `select` count 0.
- DOM por marca: el badge de devolución usa la clase de color de su marca.

---

## SCEN-016: Selector de ciudad del home (`SelectBranch`) — drawer móvil + navegación

**Given**: Viewport móvil, página `/` (home) cargada, `<SelectBranch />` montado
con sucursales (`branches`). El selector muestra un **botón trigger** (icono rojo
de ubicación + chevron), NO un `<select>` nativo.

**When**: El usuario toca el selector de ciudad; se abre un `<u-slideover>` a
pantalla completa con buscador "Buscar ciudad" (sin autofocus), filtra y toca una
ciudad.

**Then**:
- No existe `<select>` nativo en el home; el trigger es un `<button id="select-branch-mobile">`.
- El slideover (`[role="dialog"]`, `data-side="bottom"`, `h-dvh`) lista las ciudades
  como botones centrados (`text-lg`); el buscador filtra por `name` sin abrir el
  teclado al abrir.
- Al tocar una ciudad, el slideover cierra y la app **navega** a la página de
  reserva de esa ciudad (`goToReservationPage`) — misma intención que el antiguo
  `handleMobileChange` del `<select>`.
- Desktop (`sm:`) mantiene el `USelectMenu` intacto.

**Evidence**:
- DOM: `await expect(page.locator('select')).toHaveCount(0)` en el home móvil;
  el trigger es `button#select-branch-mobile`.
- DOM: `getByRole('dialog')` visible tras tocar; `activeElement` no es el buscador.
- Navegación: tras tocar una ciudad, la URL cambia a la ruta de reserva de esa
  ciudad (slug correcto). 0 errores de consola, 0 requests ≥400.
- Source: el componente ya no contiene `<select`; usa `<u-slideover>` + `goToReservationPage`.

---

## SCEN-015: Sin regresión de CLS en la página de ciudad (móvil)

**Given**: Viewport móvil, `/bogota`, build de producción local
(`NITRO_PRESET=vercel` o `pnpm build` + `preview`).

**When**: Se mide CLS al cargar la página sin interacción.

**Then**: CLS ≤ 0.1 ("good") y sin regresión > 0.01 respecto al baseline de
`origin/main` medido en el mismo entorno. (Prototipo dev midió CLS 0.0394.)

**Evidence**:
- PerformanceObserver `layout-shift` (excluyendo `hadRecentInput`) sobre el
  prototipo vs `origin/main`, ambos en build comparable.
- LCP no peor que baseline; 0 errores de consola, 0 requests ≥400.

---

## Non-goals (explícito)

- **Rediseño a date-range picker doble-mes estilo Kayak**: cambio de UX mayor;
  decisión de producto separada. Este spec mantiene **dos campos de fecha única**
  (recogida + devolución). Se documenta como follow-up.
- **Componente compartido `DatePickerField` entre marcas**: la duplicación de
  `Searcher.vue` existe; extraer abstracción es follow-up, no se aborda aquí
  (mismo razonamiento YAGNI del spec previo). El cambio se replica por marca.
- **Cambios en `useSearch`, stores o `useDateFunctions`**: la lógica de búsqueda
  no se toca; solo la capa de presentación de `Searcher.vue`.
- **Rueda nativa del SO para hora**: se acepta el trade-off (USelectMenu con
  buscador). Si producto exige la rueda nativa, es un follow-up.

---

## Verification matrix

| Scenario | Test | Viewport | Marca |
|---|---|---|---|
| SCEN-001..004, 006..013 | `e2e/searcher-unified-widget.spec.ts` | mobile 390×844 | las 3 (BRAND) |
| SCEN-005 | mismo | desktop 1280×900 | las 3 |
| SCEN-008, 010 | mismo | mobile + desktop | las 3 |
| SCEN-014 | mismo (matriz BRAND) | mobile + desktop | las 3 |
| SCEN-015 | medición CLS/LCP (`/agent-browser` + PerformanceObserver) vs origin/main | mobile | alquilatucarro (mín.) |
| SCEN-016 | `/agent-browser` home + source contract `SelectBranch.test.ts` | mobile + desktop | las 3 |
| Unit (mount) | `packages/ui-*/app/components/__tests__/SearcherSelectDrawer.mount.test.ts` | n/a | las 3 |
| Unit (source contract) | reescritura de `packages/ui-*/app/components/__tests__/Searcher.test.ts` + `SelectBranch.test.ts` | n/a | las 3 |
