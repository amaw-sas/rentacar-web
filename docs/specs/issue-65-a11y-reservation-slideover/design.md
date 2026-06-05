---
name: issue-65-a11y-reservation-slideover
created_by: claude
created_at: 2026-06-04T00:00:00Z
issue: 65
epic: 63
ola: 0
---

# A11y del flujo de reserva: un solo slideover modal + autocomplete

Issue #65 (épico #63, Ola 0). Dos defectos de accesibilidad en el flujo de
reserva de las tres marcas. Comparten archivos, se arreglan juntos.

## Diagnóstico (corrige a la auditoría)

La auditoría de caja negra reportó "dos `role=dialog` sin `aria-modal`". El
código dice otra cosa.

- `@nuxt/ui` 4.2.1: el prop `modal` de `Slideover` es `true` por defecto. Con
  `modal` activo, reka-ui ya pone `aria-modal="true"`, focus-trap y
  `pointer-events:none` en el `<body>` (esto último es la cicatriz de #25). Los
  slideovers usan `:overlay="false"` pero **no** tocan `modal` → siguen siendo
  modales.
- El defecto real no es "falta `aria-modal`" sino **dos diálogos modales
  abiertos a la vez**: el slideover "Datos para reservas" está anidado en el
  `#footer` del slideover "Resumen de la reserva"
  (`CategorySelectionSection.vue:127`), y el watch de apertura directa
  (`:374-390`) abre ambos en cascada sin cerrar el primero.

Por eso el fix es estructural (garantizar un único modal activo), no añadir un
atributo.

## Problema A — des-anidar + mutuamente excluyentes

Sacar el slideover "Datos" del `#footer` de "Resumen": ambos pasan a ser
hermanos top-level controlados por `slideoverReservationResume` y
`slideoverReservationForm`, con la invariante **a lo sumo uno abierto**. El
botón "Siguiente" deja de ser un trigger anidado y pasa a un handler explícito.

Dos handlers nuevos, `goToForm` y `backToResume`, mutan **ambos refs en el
mismo tick, de forma síncrona** (sin `nextTick` entre las dos asignaciones).
Esto es precondición de correctitud: los watchers usan `flush: 'pre'` (default),
así que leen el estado ya consolidado al disparar. Si se metiera un `nextTick`
entre las asignaciones, el watcher de URL vería un estado intermedio y borraría
el `?reservar=X` (rompe SCEN-004).

Transiciones (cada una deja un único modal o ninguno):

| Acción de usuario / sistema | `resume` | `form` |
|---|---|---|
| Click en tarjeta (`setSelectedCategory`) | `true` | `false` |
| "Siguiente" en Resumen (`goToForm`) | `false` | `true` |
| "Volver" en Datos (`backToResume`) | `true` | `false` |
| "Volver" en Resumen | `false` | `false` |
| Deep-link `?reservar=X` | `false` | `true` |
| Deep-link `/categoria/X` o `?resumen=X` | `true` | `false` |

### Watchers: qué cambia y qué no

Hay tres bloques de watchers. Solo dos se tocan, y de forma quirúrgica.

**1. Watcher de auto-apertura por deep-link (`:357-393`) — SÍ cambia.** Hoy,
cuando `abrirFormularioDirecto` es `true`, abre `resume` y luego `form` en
cascada (deja los dos abiertos). Con slideovers hermanos eso renderiza dos
`[role=dialog]` a la vez y rompe la invariante (SCEN-001). Cambio: para
`?reservar=X` abre **solo** `form` (`resume=false`); para `/categoria/X` o
`?resumen=X` abre **solo** `resume`. La cascada anidada de `nextTick`
desaparece. Nota: `abrirFormularioDirecto` se deriva solo de `reservarParam`;
`?resumen=X` cae en la rama "solo resume", igual que el path `/categoria/X`.

**2. Watchers de sincronización de URL (`:332-354`) — NO se reescriben.** Están
probados (cicatriz de #25). Solo se añade un guard de una línea al watcher de
`slideoverReservationResume`:

```
if (!isOpen && !slideoverReservationForm.value) updateCategoriaUrl(undefined)
```

Razón: en la transición Resumen→Datos, `resume` pasa a `false` mientras `form`
ya es `true` (mismo tick). Sin el guard, este watcher borraría el `?reservar=X`
que el watcher de `form` acaba de poner. Con el guard, la URL solo se limpia
cuando se cierran ambos.

El watcher de cierre de `form` (`:341-354`) ya está condicionado a `resume` y no
cambia, pero su correctitud es load-bearing en la transición Datos→Resumen.
Traza de `backToResume` (reemplaza el handler de línea 163, que hoy solo hace
`form=false`): setea `resume=true; form=false` síncrono → el watcher de `form`
ve `resume=true` y llama `updateCategoriaUrl(codigo, false)` (quita `?reservar`,
deja `/categoria/X`); el watcher de `resume` ve `isOpen=true` y no entra a la
rama de limpieza. URL neta: `/categoria/X`. Coincide con SCEN-003.

**3. `onBeforeRouteLeave` (`:401-409`) — NO cambia.** Sigue cerrando ambos refs
antes del unmount para no reintroducir el `pointer-events:none` colgado de #25.
El guard `isUpdatingFromUrl` hace que el watcher de `resume` (incluida la línea
nueva) salga temprano durante el teardown, así que no dispara `replaceState`.

### aria-modal

Con `modal` por defecto `true` y un único slideover abierto, reka-ui renderiza
exactamente un `[role=dialog][aria-modal=true]`. No se asume: se verifica en
runtime con Playwright (`/agent-browser`).

## Problema B — autocomplete + nombre accesible del teléfono

- `ReservationForm.vue`: `autocomplete` en los campos con token HTML estándar —
  `given-name` (nombres), `family-name` (apellidos), `email` (correo). Tipo y
  número de identificación **no tienen token estándar**; no se fabrica uno
  (sería ruido para el agente de autocompletado). La auditoría misma solo
  enumera cuatro tokens.
- `usePhoneField.ts` (logic, archivo único compartido): añadir
  `autocomplete: "tel"` a `phoneInputOptions`.
- Asociar `VueTelInput` a su `UFormField label="Teléfono"` y **quitar el
  `aria-label="Número de teléfono"`** de `phoneInputOptions`. Razón (resuelta
  ahora, no en implementación): el `aria-label` y el label visible "Teléfono"
  compiten por el nombre accesible. Por precedencia ARIA, `aria-label` gana →
  el nombre accesible sería "Número de teléfono" mientras el label visible dice
  "Teléfono", lo que **viola WCAG 2.5.3 Label in Name** (el texto visible debe
  estar contenido en el nombre accesible). Decisión: el nombre accesible es
  "Teléfono", provisto por el `UFormField` vía `aria-labelledby` apuntando al id
  del label del field (o alineando el `for`/`id`). Se elimina el `aria-label`
  redundante. `usePhoneField` solo lo consume este formulario, así que quitarlo
  es seguro. La API exacta del slot/id de `UFormField` se confirma con Context7
  al implementar; la decisión de cuál string es el nombre accesible ya está
  tomada.

## Blast radius

- `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/components/CategorySelectionSection.vue`
  — **byte-idénticos** (md5 `3ff360b3…`). Mantener idénticos tras el cambio.
- `packages/ui-{…}/app/components/ReservationForm.vue` — byte-idénticos
  (md5 `16adb618…`). Mantener idénticos.
- `packages/logic/src/composables/usePhoneField.ts` — único, propaga a las 3
  marcas vía el layer.
- Sin consumidores fuera de presentación. Flujo crítico de conversión.
- ⚠️ Riesgos: deep-link `?reservar=X`; regresión `pointer-events:none` de #25.
  Ambos cubiertos por escenarios + verificación runtime.

## Fuera de alcance

- Deduplicar los componentes de UI al layer (refactor mayor, no es de este
  issue). Las copias siguen byte-idénticas.
- Tokens `autocomplete` inventados para tipo/número de identificación.
- Tocar el prop `modal`/`overlay` (la modalidad ya es correcta).

## Nota para el implementador

`PhoneInputOptionsType` (`packages/logic/src/utils/types/type/PhoneInputOptionsType.ts`)
ya está desincronizado: declara `showDialCode/id/name/placeholder` pero omite el
`aria-label` actual. Al añadir `autocomplete` y quitar `aria-label`, actualizar
el tipo (`autocomplete: string`, sin `aria-label`) por higiene. No rompe el
typecheck (TS no aplica excess-property check al retorno de un
`computed<T>(() => ({...}))`), pero el tipo debe reflejar la realidad.

La aserción de SCEN-008 ("nombre accesible == 'Teléfono'") se valida con el
accessibility tree en runtime, no solo por presencia de atributos. Si
`VueTelInput` renderiza su `<input>` dentro de su propia estructura, puede que
`for`/`id` no baste y haya que usar `aria-labelledby`; el árbol de
accesibilidad es el árbitro.

## Escenarios observables

Ver `scenarios/a11y-reservation-slideover.scenarios.md`. Son el holdout para
`/scenario-driven-development`.
