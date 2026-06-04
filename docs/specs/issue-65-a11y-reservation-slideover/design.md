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

Transiciones (cada una deja un único modal o ninguno):

| Acción de usuario / sistema | `resume` | `form` |
|---|---|---|
| Click en tarjeta (`setSelectedCategory`) | `true` | `false` |
| "Siguiente" en Resumen (`goToForm`) | `false` | `true` |
| "Volver" en Datos (`backToResume`) | `true` | `false` |
| "Volver" en Resumen | `false` | `false` |
| Deep-link `?reservar=X` | `false` | `true` |
| Deep-link `/categoria/X` o `?resumen=X` | `true` | `false` |

### Integración con los watchers de URL (cicatriz de #25)

Los watchers que sincronizan la URL (`:332-354`) están probados y no se
reescriben. Solo se añade un guard de una línea al watcher de
`slideoverReservationResume`:

```
if (!isOpen && !slideoverReservationForm.value) updateCategoriaUrl(undefined)
```

Razón: en la transición Resumen→Datos, `resume` pasa a `false` mientras `form`
ya es `true`. Sin el guard, el watcher borraría el `?reservar=X` que el watcher
de `form` acaba de poner. Con el guard, la URL solo se limpia cuando se cierran
ambos. El watcher de cierre de `form` ya está condicionado a `resume`, así que
no necesita cambios.

`onBeforeRouteLeave` (`:401-409`) sigue cerrando ambos refs antes del unmount
para no reintroducir el `pointer-events:none` colgado de #25.

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
  `autocomplete: "tel"` a `phoneInputOptions`. Ya expone `id`, `name` y
  `aria-label` ("Número de teléfono") → el input de teléfono **ya tiene nombre
  accesible**.
- Asociar `VueTelInput` a su `UFormField label="Teléfono"`: hoy el `for` del
  label (id generado por `UFormField`) no coincide con el `id="telefono"`
  hardcodeado del input. Se alinea el id del input con el del field, o se usa
  `aria-labelledby`. La API exacta del slot/id de `UFormField` se confirma con
  Context7 al implementar.

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

## Escenarios observables

Ver `scenarios/a11y-reservation-slideover.scenarios.md`. Son el holdout para
`/scenario-driven-development`.
