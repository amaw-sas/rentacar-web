# Plan de implementación — conductor adicional (#396)

Diseño: [`2026-07-27-issue396-conductor-adicional-datos-design.md`](./2026-07-27-issue396-conductor-adicional-datos-design.md) · Fecha: 2026-07-27 · Rama: `amaw-dev/issue-395-epic-propuesta-conductor`

Los pasos 1-6 de sop-planning los cubre el spec, que ya está aprobado y commiteado. Este documento es
el mapa de archivos y el plan de ejecución.

## Mapa de archivos

| Archivo | Responsabilidad | Estado |
|---|---|---|
| `packages/logic/src/utils/validation/userInformationForm.ts` | `EXTRA_DRIVER_DOCUMENT_FORMAT` + `extraDriverDocumentError()`, puro, hermano de `identificationError` | Modificado |
| `packages/logic/src/utils/validation/reservationForm.ts` | Tres entradas `v.nullish` + dos `v.forward(v.partialCheck(...))` inline | Modificado |
| `packages/logic/src/utils/types/fields/FormRecordFields.ts` | Contrato del payload: dos campos opcionales | Modificado |
| `packages/logic/src/stores/useStoreReservationForm.ts` | Dos refs + su salida en el `return` | Modificado |
| `packages/logic/src/composables/useRecordReservationForm.ts` | Desestructurar los dos refs e insertar las claves solo con el flag activo | Modificado |
| `packages/ui-alquilatucarro/app/components/ReservationForm.vue` | Espejo del flag en `baseForm` + bloque condicional + nota de tratamiento | Modificado |
| `packages/ui-alquilame/app/components/ReservationForm.vue` | Lo mismo, con el estilo de la marca | Modificado |
| `packages/ui-alquicarros/app/components/ReservationForm.vue` | Lo mismo. Cubre el wizard vía `StepData` | Modificado |
| `packages/logic/src/utils/validation/__tests__/extraDriverFields.test.ts` | `safeParse` sobre el schema: obligatoriedad condicional, formato, centinelas | Nuevo |
| `packages/logic/src/composables/__tests__/useRecordReservationForm.extraDriver.test.ts` | Forma del body en los tres casos: marcado, desmarcado, nunca marcado | Nuevo |
| `packages/ui-{3 marcas}/app/components/__tests__/ReservationForm.extraDriver.test.ts` | Contrato de fuente: el espejo existe en `baseForm` y los campos están bajo el `v-if` | Nuevo ×3 |

Nada más se toca. `ReservationFormSection.vue` es código muerto y queda fuera; `formValid` y
`ctaDisabled` del wizard tampoco se tocan (reabriría #366).

## Paso 0 — Baseline antes de tocar nada

Medir, no recordar. Correr la suite de `packages/logic` y la de las tres marcas, y anotar los números
exactos. El repo tiene rojos de base conocidos y hay tests flaky en `logic`, así que lo que cuenta al
final es el **delta**, no el verde absoluto.

Tamaño: S · Depende de: nada · Criterio: números de partida anotados en la sesión.

## Paso 1 — La regla del documento rechaza basura y acepta pasaporte

`extraDriverDocumentError(documento)` en `userInformationForm.ts`: `null` si el valor es aceptable,
mensaje en español si no. Vacío devuelve `null` (la obligatoriedad la impone el cross-field, igual que
en `identificationError`). Reutiliza `SENTINEL_BLOCKLIST`.

Tamaño: S · Depende de: Paso 0 · Escenarios: SCEN-396-03, SCEN-396-04

Criterio: `1020304050` y `AB123456` pasan; `123456` devuelve el mensaje de centinela; `12345` y
`ABCDEFGHIJKLMNOP` devuelven el de formato.

## Paso 2 — Con el adicional marcado, el schema exige nombre y cédula

Tres entradas `v.nullish` en `reservationEntries` y dos `v.forward(v.partialCheck(...))` escritos
inline en el `v.pipe`. La trampa a evitar es `v.optional`: los refs del store son `null` y `optional`
solo neutraliza `undefined`.

Tamaño: S · Depende de: Paso 1 · Escenarios: SCEN-396-02, SCEN-396-03, SCEN-396-04, SCEN-396-07

Criterio: con `conductorAdicional: false` y los dos campos en `null`, `safeParse` del formulario
completo devuelve `success: true` — este es el que atrapa la trampa. Con `true` y el nombre vacío,
falla con el issue apuntando a `conductorAdicionalNombre`. Las suites existentes de
`userInformationForm.test.ts` y `normalizePhoneNumber.test.ts` siguen en el mismo número.

## Paso 3 — El store guarda los dos datos

Dos refs `string | null` y su salida en el `return`. Sin lógica.

Tamaño: S · Depende de: Paso 2 · Criterio: importables desde `storeToRefs` sin error de tipos.

## Paso 4 — El payload lleva los datos solo si el adicional está contratado

Desestructurar los dos refs en `useRecordReservationForm` e insertar las claves dentro de un `if` sobre
`selectedCategory.value?.withExtraDriver`, con `trim()`.

Tamaño: M · Depende de: Paso 3 · Escenarios: SCEN-396-05, SCEN-396-06, SCEN-396-07

Criterio: con el flag activo y `"  Ana Pérez  "`, el body lleva `extra_driver_name: "Ana Pérez"`. Con
el flag apagado y los refs poblados, `'extra_driver_name' in body === false`. Sin adicional, el body
tiene exactamente las mismas claves que antes del cambio.

## Paso 5 — alquilatucarro pide los datos en el paso de datos

Espejo en `baseForm`, bloque bajo `v-if="formState.conductorAdicional"` antes de la casilla de
privacidad, nota de tratamiento, `data-testid` en ambos campos. Más el test de contrato de fuente.

Tamaño: M · Depende de: Paso 4 · Escenarios: SCEN-396-01

Criterio: sin el flag, el bloque no está en el DOM. Con el flag, aparecen los dos campos con su
etiqueta y la nota. El test de contrato falla si alguien borra el espejo de `baseForm`.

## Paso 6 — alquilame, misma edición

Tamaño: S · Depende de: Paso 5 · Escenarios: SCEN-396-01, SCEN-396-08

## Paso 7 — alquicarros, misma edición

Cubre el wizard sin tocarlo: `StepData.vue` ya renderiza este componente.

Tamaño: S · Depende de: Paso 6 · Escenarios: SCEN-396-01, SCEN-396-08

## Paso 8 — El recorrido real en el navegador

Servidor de desarrollo del worktree y recorrido completo del wizard de alquicarros: marcar el
adicional en el paso 4, llegar al paso 5, dejar los campos vacíos, pulsar «Confirmar reserva» y ver el
error al lado del campo; llenarlos y comprobar el body del POST; volver al paso 4, desmarcar, y
comprobar que el body ya no lleva las claves. Cero errores de consola, cero peticiones fallidas.

Es el paso donde se ve lo que jsdom no ve: el error rancio al desmarcar y si el salto entre el paso 4
y el 5 desconcierta.

Tamaño: M · Depende de: Paso 7 · Escenarios: los 8, en runtime

## Paso 9 — Delta contra el baseline

Repetir lo del Paso 0 y comparar. Typecheck por marca, nunca en la raíz (congela el disco en WSL2).

Tamaño: S · Depende de: Paso 8 · Criterio: mismo número de fallos que el baseline, o menos.

## Orden y despliegue

Los pasos 1-4 son el núcleo compartido y se pueden verificar sin UI. Los pasos 5-7 son la misma
edición tres veces; si la primera revela que el diseño no encaja, se corrige antes de replicarla.

La PR no se mergea hasta que dashboard#293 persista los campos. Si se mergea antes, el formulario
exige datos que mueren en silencio. No hay `git push` sin autorización explícita.

## Dos cosas comprobadas antes de escribir el plan

**Ningún test existente se rompe por la obligatoriedad nueva.** Siete archivos mencionan
`withExtraDriver`, pero los siete son contratos de fuente: leen el código como texto y aseveran sobre
él. Ninguno marca el flag y envía, así que ninguno se topa con los campos ahora obligatorios. Tampoco
hay nada en `e2e/` que toque el conductor adicional.

**El guard de SDD bloquea `*.scenarios.md` nuevos dentro de un worktree.** Los 8 escenarios de este
plan van a necesitar su artefacto, y crearlo aquí choca con el guard. La receta conocida es crearlo
desde el clon de `main`. Hay que resolverlo al entrar en SDD, no al final.

## Riesgos vivos

| Riesgo | Señal temprana | Qué hacer |
|---|---|---|
| `v.nullish` mal puesto congela todos los envíos | El criterio del Paso 2 (schema válido sin adicional) falla | Es el propio criterio quien lo atrapa, antes de tocar UI |
| El error rancio al desmarcar sí molesta | Aparece en el Paso 8 | Limpiar el error al ocultar el bloque, o vaciar los refs al desmarcar |
| El salto paso 4 → paso 5 desconcierta | QA del Paso 8 | Recordatorio bajo la casilla en `StepExtras.vue`, no mover los campos |
| Flaky de la suite de `logic` se confunde con regresión | Delta del Paso 9 no cuadra | Comprobar `git status` y re-correr en aislamiento antes de culpar al cambio |
