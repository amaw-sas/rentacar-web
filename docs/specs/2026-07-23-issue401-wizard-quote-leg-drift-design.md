# El wizard con el tramo vivo y el precio viejo — diseño

Issue [#401](https://github.com/amaw-sas/rentacar-web/issues/401) (P1, bug) · Fecha: 2026-07-23 · Marca: alquicarros

## El problema

El resumen del wizard puede afirmar «devuelves en Medellín El Poblado · otra ciudad» mientras el
total que enseña —y el que viaja al dashboard— es el de una ida y vuelta a Bogotá, sin tarifa de
traslado. Dos fuentes de verdad que nadie sincroniza:

| Dato | Origen | Naturaleza |
|---|---|---|
| Sede, fecha y hora de recogida/devolución, badge one-way | `useStoreReservationForm` | **vivo** |
| Total, IVA, tarifa de traslado, cobertura, `reference_token` | `selectedCategory` (instancia de `useCategory`) | **congelado** en el momento de la búsqueda |

`selectedCategory` solo se anula en `ReservationWizard.vue:164-169`, colgado de `pending`. Editar el
tramo sin pulsar BUSCAR nunca pone `pending` en true, así que la cotización sobrevive al cambio.

Ruta reproducida (sin deep-link): buscar Bogotá Aeropuerto → Bogotá Aeropuerto, elegir gama, llegar
al paso 5, saltar a **Búsqueda** por el stepper (`isReached(step) = step <= maxReached`, el salto es
legal), cambiar solo el lugar de devolución, y volver a **Datos** por el stepper.

El payload hereda el mismo corte: `useRecordReservationForm.ts:68` envía `return_location` vivo y
`:71` `return_fee` congelado; `coverage_days` y `coverage_price` (`:73-74`) van igual de congelados.

Sale ahora porque #367 hizo que el resumen **afirmara** la devolución. El corte es anterior, pero
antes era silencioso: podía estar desincronizado sin decir nada. Ahora enuncia sede, badge y
ausencia de traslado una pantalla antes de «Confirmar reserva».

## Tres hechos que cambian la decisión

**1. La gama estaba condenada de todos modos.** `useSearch.ts:290-299` anula
`categoriesAvailabilityData` ante cualquier cambio del tramo, y esa instancia de `useSearch` vive
todo el ciclo de `/reservas` (la crea `useSearchByQueryParams` dentro de `onMounted`, y el shell del
wizard está montado en los cinco pasos). Así que tocar el tramo ya deja el paso 2 sin filas: hay que
volver a buscar, y volver a buscar anula la gama por el watcher de `pending`. El «coste de UX real»
que planteaba el issue solo existe en el caso *cambio y deshago sin buscar*.

**2. En la misma ruta hay una segunda afirmación falsa.** Con la disponibilidad anulada, el paso 2
dice «Sin vehículos para esta búsqueda / No encontramos disponibilidad para estas fechas y sede»
(`StepVehicle.vue:70-78`). No es que no haya: es que no se ha buscado.

**3. La primitiva de comparación ya existe.** `reservationSearchSignature()`
(`app/composables/useSearchByQueryParams.ts:44-56`, exportada) es la firma de los seis campos del
tramo, y ya se usa para decidir si una cotización viva se puede reutilizar al volver de `/chat`.

## Decisión

**Anular la cotización y explicar por qué.** Cuando el tramo vivo deja de coincidir con el que se
consultó, la cotización se descarta, igual que hoy hace re-buscar. Y se registra el tramo cotizado,
que es lo que permite nombrar la causa en las dos superficies donde el usuario la sufre.

Alternativas descartadas:

- *Anular a secas* (lo que proponía el issue): cinco líneas, fail-closed real, pero el resumen se
  vacía sin decir por qué y el paso 2 sigue afirmando que no hay disponibilidad.
- *Congelar y comparar conservando la gama*: su única ganancia sobre lo anterior es el caso deshacer,
  y a cambio deja en el store una instancia con precios que no aplican —justo la condición que este
  issue denuncia— confiando en que todos los consumidores respeten la marca de rancia.

## Diseño

### Estado (`ReservationWizard.vue`)

```ts
const liveSearchSignature = computed(() =>
  reservationSearchSignature({
    pickup: lugarRecogida.value,
    dropoff: lugarDevolucion.value,
    pickupDate: fechaRecogida.value,
    dropoffDate: fechaDevolucion.value,
    pickupTime: horaRecogida.value,
    dropoffTime: horaDevolucion.value,
  }),
)

const quotedSearchSignature = ref<string | null>(null)

const searchStale = computed(
  () => quotedSearchSignature.value !== null &&
        liveSearchSignature.value !== quotedSearchSignature.value,
)
```

Se watchea la **firma**, no los seis refs sueltos. `useSearch` encadena escrituras con `flush:'sync'`
(`lugarRecogida → lugarDevolucion`, `fechaRecogida → fechaDevolucion`, `horaRecogida →
horaDevolucion`), así que una sola edición del usuario mueve dos refs. Un watcher sobre la firma las
agrupa en un disparo, y además dice lo que importa («el tramo consultado es otro») en vez de
enumerar seis campos que alguien tendrá que acordarse de ampliar.

### Watcher principal — reemplaza `ReservationWizard.vue:164-169`

| Transición | Acción |
|---|---|
| `pending` false→true | `quotedSearchSignature = live`; anular `selectedCategory` y `vehiculo` |
| firma ≠ cotizada (con cotizada ≠ null) | anular `selectedCategory` y `vehiculo`; `maxReachedStep = min(maxReachedStep, 2)`; si el paso actual ≥ 3, `goTo('vehiculo')` |
| `pending` true→false | no-op: al terminar la búsqueda la firma viva es la cotizada por construcción |

`quotedSearchSignature` **no** se limpia al invalidar: es lo que mantiene `searchStale` en true hasta
la siguiente búsqueda. La anulación es idempotente, así que seguir editando campos no hace daño.

La captura ocurre en `pending` false→true porque ese es el instante en que
`useFetchCategoriesAvailabilityData` lee los refs del form: la firma capturada *es* la consultada.

### Watcher de adopción

```ts
watch(selectedCategory, (sc) => {
  if (sc && quotedSearchSignature.value === null) {
    quotedSearchSignature.value = liveSearchSignature.value
  }
}, { immediate: true })
```

Volver de `/chat` a la misma URL reutiliza la cotización sin togglear `pending`
(`canReuseExistingSearch`), y el remonte deja la firma cotizada en null. La adopción la fija con el
tramo vivo, que en ese camino es el cotizado por construcción: la reutilización exige firma idéntica.
Sin esto, un cambio de tramo posterior a esa vuelta no invalidaría nada.

Va en un watcher aparte, no en el principal con `immediate: true`. En la primera llamada inmediata
Vue entrega `undefined` como valor viejo, y destructurar `[wasPending]` de ahí revienta.

### Rebote de paso

En `/reservas` hay que estar en el paso 1 para editar el tramo, pero en las city pages el Searcher
vive en `CityHero` y es editable desde el paso 4. Sin el rebote, el stepper mostraría «alcanzado: 2»
con el usuario parado en el 4. Es el mismo movimiento que la red de seguridad de #313
(`ReservationWizard.vue:339-349`), que aquí no dispara porque `searchSettled` cae a false en cuanto
`useSearch` anula la disponibilidad.

`goTo` antes de bajar `maxReachedStep`: `canGoTo` exige `n <= maxReached`, así que el orden inverso
bloquearía su propio salto.

### Superficies

`searchStale` viaja como prop a los dos hijos del shell. Un nivel, explícito; ningún estado nuevo
sale del wizard.

**`StepVehicle.vue`** — bloque vacío nuevo. Orden de guardas: `pending` → **stale** → error de
disponibilidad → `groups.length === 0` → grid.

Stale gana al banner de error a propósito: `error.value` solo se limpia al arrancar la siguiente
búsqueda, así que tras cambiar el tramo describe un trayecto que ya no es el del usuario. El caso
`one_way_not_available` lo hace evidente. El usuario corrige la sede de devolución justo *porque* el
banner se lo pidió; seguir enseñándoselo lo dejaría sin saber que ya no aplica.

```
┌──────────────────────────────────────────┐
│ Cambiaste los datos de búsqueda           │
│ Pulsa BUSCAR para ver la disponibilidad   │
│ y los precios de este nuevo trayecto.     │
│              [ Ajustar búsqueda ]         │
└──────────────────────────────────────────┘
```

Reutiliza el botón `wizard-adjust-search-test`, que ya emite `adjust-search` → `onGoTo('busqueda')`.

**`WizardSummary.vue`** — el precio cae solo: sin `selectedCategory`, `totalLabel` es null y con él
desaparecen «Total renta», «IVA + Tasa» e «incluye traslado». Lo único que se añade es la causa.

- Escritorio: sustituye a «Incluye IVA y tasa» (`v-if="totalLabel"` → `v-else-if="searchStale"`).
- Móvil: franja fina **sobre** la barra, fuera del detalle expandible. El detalle nace colapsado, así
  que meter ahí la explicación dejaría al usuario móvil con un CTA muerto y sin motivo visible, que
  es el defecto que arregló #387.

La fila de devolución sigue mostrando el tramo vivo, que es lo que el usuario acaba de elegir. Lo que
se va es el precio; el tramo no se oculta.

**CTA.** No necesita código: `advanceState.hasSelectedCategory` es false en los pasos 2-4 y el submit
del paso 5 valida `vehiculo` nulo. El rebote impide además quedarse en «Datos» con un botón muerto.

### Alcance

Tres archivos, todos bajo `packages/ui-alquicarros/app/components/wizard/`:
`ReservationWizard.vue` (estado y watchers), `StepVehicle.vue` y `WizardSummary.vue` (una prop y un
bloque cada uno). Consumidores fuera del wizard: ninguno.

**Fuera:** `packages/logic`. `useRecordReservationForm` conserva su corte vivo/congelado, pero en
alquicarros deja de ser alcanzable: sin gama no hay submit. Y `useSearch` conserva su toast de
traslado.

**Las marcas hermanas tienen el mismo hueco y no se tocan aquí.**
`CategorySelectionSection.vue:344` (alquilatucarro) y `:293` (alquilame) cuelgan la misma anulación
de `pendingSearch`, y en ellas el Searcher convive con el grid en la misma página, así que el hueco
es más accesible que en alquicarros: no hace falta ni el stepper. El fix tampoco es portable, porque
no tienen pasos ni stepper y anular con el slideover abierto tiene su propia coreografía
(`urlSyncDepth`). Se reproduce con agent-browser y se abre el issue con esa evidencia dentro.

## Escenarios observables

| ID | Given | When | Then |
|---|---|---|---|
| SCEN-401-01 | Cotización de ida y vuelta AABOT→AABOT elegida, wizard en el paso 5 | cambio solo el lugar de devolución a Medellín por el stepper y vuelvo a Datos | no se enseña ningún total (ni el viejo ni otro) y el CTA no confirma la reserva |
| SCEN-401-02 | Cotización one-way con tarifa de traslado > 0 | devuelvo la sede de devolución a la de recogida sin volver a buscar | la línea «incluye traslado» no sobrevive al badge «otra ciudad» |
| SCEN-401-03 | Tramo cambiado sin buscar | entro al paso 2 | el paso dice que cambié la búsqueda y que pulse BUSCAR, no que no haya vehículos |
| SCEN-401-04 | City page con resultados, wizard en el paso 4 (Adicionales) | cambio la fecha en el Searcher del hero | el wizard no me deja en un paso cuyo contenido ya no aplica, y el stepper no ofrece saltar adelante |
| SCEN-401-05 | Búsqueda completa | elijo gama y avanzo hasta Datos sin tocar el tramo | nada se invalida: el total y la gama siguen en el resumen en cada paso |
| SCEN-401-06 | `/reservas?…` con gama elegida; salgo a `/chat` | vuelvo con el botón atrás a la misma URL | la gama y el precio siguen ahí (el remonte no cuenta como cambio de tramo) |
| SCEN-401-07 | Deep-link `/…/categoria/C` | la búsqueda asienta y la gama se preselecciona | la preselección no se auto-anula |
| SCEN-401-08 | Tramo cambiado sin buscar, aviso visible | pulso BUSCAR | el flujo se recupera: hay filas, el aviso desaparece y se puede volver a elegir gama |
| SCEN-401-09 | Cotización elegida, error `one_way_not_available` visible en el paso 2 | corrijo la sede de devolución sin buscar | el banner de error deja de hablar de un trayecto que ya no es el mío |
| SCEN-401-10 | Móvil, resumen colapsado, tramo cambiado sin buscar | miro la barra inferior | veo por qué el CTA está deshabilitado sin tener que expandir el detalle |

SCEN-401-05, -06 y -07 son las guardas anti-regresión: fijan que la invalidación no se dispare en el
camino feliz, en el remonte ni en el deep-link con gama.

## Riesgos

**Falsos positivos por clamps de horario.** `useSearch` ajusta la hora de recogida cuando cambian las
opciones (`watch(pickupHourOptions)`), y las opciones dependen del horario de la sucursal, que llega
con la admin data. Si esa data aterrizara *después* de una búsqueda ya asentada, el clamp movería la
hora y la cotización se invalidaría sola. La carrera es estrecha, porque esa misma admin data
alimenta el selector con el que se busca, y el fallo cae del lado seguro: pide re-buscar en vez de
cotizar mal. Se comprueba en runtime con SCEN-401-05.

**Contraste del aviso.** El texto nuevo aparece en dos superficies con fondos distintos, así que hay
que medirlo en las dos con el método de #364: canvas 1×1 sobre el color computado, porque Tailwind 4
emite `oklch()` y el fondo se resuelve subiendo por el árbol. Mínimo AA.

## Verificación

- Unitarios (vitest, dentro de `packages/ui-alquicarros`): la máquina de invalidación (captura,
  invalidación, idempotencia, adopción tras remonte) y el render de las dos superficies. Cada
  escenario con su aserción.
- Runtime con agent-browser sobre el worktree: SCEN-401-01, -03, -04 y -10, que es donde vive la
  afirmación falsa. Cero errores de consola, cero peticiones fallidas.
- Typecheck por delta con `git stash`, nunca `| tail`: el exit code que se ve es el del `tail`.
