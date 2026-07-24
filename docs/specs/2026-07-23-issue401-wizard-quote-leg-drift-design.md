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
al paso 5, saltar a **Búsqueda** por el stepper (`canGoTo(n) = n <= maxReached`, el salto es legal),
cambiar solo el lugar de devolución, y volver a **Datos** por el stepper.

El payload hereda el mismo corte: `useRecordReservationForm.ts:68` envía `return_location` vivo y
`:71` `return_fee` congelado; `coverage_days` y `coverage_price` (`:73-74`) van igual de congelados.

Sale ahora porque #367 hizo que el resumen **afirmara** la devolución. El corte es anterior, pero
antes era silencioso: podía estar desincronizado sin decir nada. Ahora enuncia sede, badge y
ausencia de traslado una pantalla antes de «Confirmar reserva».

## Seis hechos que cambian la decisión

**1. La gama estaba condenada de todos modos.** `useSearch.ts:293-300` anula
`categoriesAvailabilityData` ante cualquier cambio del tramo, y esa instancia de `useSearch` vive
todo el ciclo de la superficie de reserva. Así que tocar el tramo ya deja el paso 2 sin filas: hay
que volver a buscar, y volver a buscar anula la gama por el watcher de `pending`. El «coste de UX
real» que planteaba el issue solo existe en el caso *cambio y deshago sin buscar*.

**2. Ese watcher es `watchDebounced` con 50 ms.** La anulación de la disponibilidad **no** es
síncrona con la edición. Durante esos 50 ms el grid del paso 2 sigue pintando las filas de la
búsqueda vieja. Obliga a que el aviso gane a `groups.length === 0` en el orden de guardas, y obliga
a los unitarios a avanzar temporizadores antes de aseverar sobre el grid.

**3. Lo que caduca es la DISPONIBILIDAD, no solo la cotización.** Con la disponibilidad anulada, el
paso 2 dice «Sin vehículos para esta búsqueda / No encontramos disponibilidad para estas fechas y
sede» (`StepVehicle.vue:69-88`). No es que no haya: es que no se ha buscado. Y esto pasa **haya o no
haya gama elegida**. Cualquier diseño que cuelgue el aviso de `selectedCategory` deja sin arreglar el
caso más común.

**4. En alquicarros el tramo solo se edita desde el paso 1.** La prop `externalSearch` existe
(`:76`) pero **nadie la pasa**: los dos únicos puntos de montaje —`pages/reservas/index.vue:16` y
`components/reservas/Results.vue:16`— renderizan `<ReservationWizard />` a secas, así que vale
siempre `false` (default en `:78`). El bloque de `CityPage` que montaba el wizard se **eliminó** como
código muerto en SCEN-322-X06 (`CityPage.vue:9-17`, con un «NO reintroducir» explícito). Consecuencia:
por acción del usuario, el tramo no cambia mientras se está en un paso ≥ 3; solo lo mueven los clamps
internos de `useSearch` (ver Riesgos).

**5. El avance de los pasos 3 y 4 no exige gama, y la red de #313 no siempre rescata.**
`canAdvance` (`useReservationWizard.ts:112-125`) solo consulta `hasSelectedCategory` en
`case 'vehiculo'`; `'seguro'` y `'adicionales'` devuelven `true` sin condición, y `'datos'` mira solo
`formValid`. Lo que hoy tapa ese hueco es la red de #313 (`ReservationWizard.vue:336-349`), pero
arranca con `if (!settled || hasUsableCategory) return`: **si la búsqueda deja de estar asentada, la
red se apaga.** Hoy eso no importa porque una gama nula en paso ≥ 3 siempre viene precedida de una
búsqueda, que vuelve a asentar. Cualquier diseño que anule la gama **sin buscar** desarma la red, y
entonces desde el paso 4 se llega a un «Confirmar reserva» habilitado que no confirma: valibot
rechaza `vehiculo` (`categoryForm.ts:9-12`) y ese campo no tiene `UFormField` en `ReservationForm.vue`,
así que el fallo es mudo — lo documenta el propio `ReservationWizard.vue:325-327`.

**6. La primitiva de comparación ya existe.** `reservationSearchSignature()`
(`app/composables/useSearchByQueryParams.ts:43-55`, exportada) es la firma de los seis campos del
tramo, y ya se usa para decidir si una cotización viva se puede reutilizar al volver de `/chat`.

## Decisión

**Anular la cotización, cerrar el avance y explicar por qué.** Cuando el tramo vivo deja de coincidir
con el que se consultó, la cotización se descarta —igual que hoy hace re-buscar—, se registra que la
búsqueda quedó rancia, y se cierra el avance de los pasos que hoy lo dan gratis.

Alternativas descartadas:

- *Anular a secas* (lo que proponía el issue): cinco líneas, pero el resumen se vacía sin decir por
  qué, el paso 2 sigue afirmando que no hay disponibilidad, y por el hecho 5 abre el camino al
  «Confirmar reserva» mudo.
- *Congelar y comparar conservando la gama*: su única ganancia es el caso deshacer, y a cambio deja
  en el store una instancia con precios que no aplican —justo la condición que este issue denuncia—
  confiando en que todos los consumidores respeten la marca de rancia.

## Diseño

### Estado (`ReservationWizard.vue`)

Los seis refs del tramo hay que añadirlos al `storeToRefs(form)` de `:105-113`; hoy no están ahí.

```ts
const {
  politicaPrivacidad, isSubmittingForm, formSubmitLocked, vehiculo,
  haveTotalInsurance, haveMonthlyReservation, selectedMonthlyMileage,
  lugarRecogida, lugarDevolucion,      // ← nuevos
  fechaRecogida, fechaDevolucion,      // ← nuevos
  horaRecogida, horaDevolucion,        // ← nuevos
} = storeToRefs(form)

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

/** Tramo con el que se pidió la disponibilidad que hay ahora en pantalla. */
const quotedSearchSignature = ref<string | null>(null)
/** Pestillo: la disponibilidad en pantalla ya no corresponde al tramo vivo. */
const searchStale = ref(false)
```

Se watchea la **firma**, no los seis refs sueltos. `useSearch` encadena escrituras con `flush:'sync'`
(`lugarRecogida → lugarDevolucion`, `fechaRecogida → fechaDevolucion`, `horaRecogida →
horaDevolucion`), así que una sola edición del usuario mueve dos refs. Un watcher sobre la firma las
agrupa en un disparo, y dice lo que importa en vez de enumerar seis campos que alguien tendrá que
acordarse de ampliar.

**Trampa latente que hereda:** `reservationSearchSignature` mapea `value ?? ''`
(`useSearchByQueryParams.ts:53`), así que colapsa `null` y `''`. La anulación de disponibilidad de
`useSearch.ts:293-300` dispara sobre los refs crudos, no sobre la firma. Una transición `null → ''`
en cualquiera de los seis mataría las filas sin mover la firma → `searchStale` en false sobre filas
muertas. Hoy nadie escribe `''` en esos refs; queda escrito para el día que alguien lo haga.

### `searchStale` es un pestillo, no una igualdad

Un `computed(() => live !== quoted)` **reintroduce los dos defectos** en el camino *cambio y deshago
sin buscar*: al deshacer, las firmas vuelven a coincidir y la comparación cae a false, pero
`selectedCategory` sigue en null y `categoriesAvailabilityData` también. Resultado: el paso 2 vuelve a
afirmar «Sin vehículos» y el resumen vuelve a enseñar un CTA muerto sin motivo visible —el defecto de
#387— con el agravante de que ahora *nosotros* lo causamos.

El pestillo dice la verdad observable: una vez tirada la disponibilidad, no hay disponibilidad, se
deshaga o no la edición. Solo lo baja una búsqueda nueva.

### `searchStale` no depende de que haya gama elegida

El hecho 3 lo exige. La máquina se cuelga de `pending` y de la firma, y **`selectedCategory` no es
fuente del watcher**: anularla es una *consecuencia* de la rancia, no su condición.

### Watcher único — reemplaza `ReservationWizard.vue:164-169`

```ts
watch(
  [pending, liveSearchSignature],
  ([isPending], [wasPending]) => {
    // 1. Búsqueda nueva: captura el tramo consultado y descarta la gama vieja.
    if (isPending && !wasPending) {
      quotedSearchSignature.value = liveSearchSignature.value
      searchStale.value = false
      selectedCategory.value = null
      vehiculo.value = null
      return
    }
    // 2. Red de seguridad: si una búsqueda RESUELVE sin que hayamos capturado nada
    //    (montaje con `pending` ya en true), adoptar el tramo VIVO para no quedar
    //    inertes. Best-effort: si el usuario editó el tramo durante el vuelo, el vivo
    //    no es el consultado y adoptaremos de más. Ver SCEN-401-13.
    if (!isPending && wasPending && quotedSearchSignature.value === null) {
      quotedSearchSignature.value = liveSearchSignature.value
      return
    }
    // 3. Nada consultado en este montaje → nada puede estar rancio.
    if (quotedSearchSignature.value === null) return
    // 4. Ya latcheado: la anulación es idempotente, no hay que repetirla.
    if (searchStale.value) return
    // 5. El tramo vivo sigue siendo el consultado.
    if (liveSearchSignature.value === quotedSearchSignature.value) return
    // 6. Rancio.
    searchStale.value = true
    selectedCategory.value = null
    vehiculo.value = null
  },
  { flush: 'sync' },
)
```

Sin `immediate: true`. No porque destructurar reviente —en un watch **multi-fuente** Vue 3.5 entrega
`[]` como valores viejos y `const [w] = []` da `undefined` sin lanzar; el que lanza es el
single-source— sino porque un disparo inmediato con `wasPending === undefined` hace verdadera la
guarda 1: un montaje con una búsqueda en vuelo capturaría y anularía la selección sin motivo. La
guarda 2 cubre ese montaje por el otro lado, cuando la búsqueda resuelve.

**Dependencia del flanco `false→true`, y su límite exacto.** `search()` escribe
`pending.value = true` (`useStoreSearchData.ts:78`); una segunda búsqueda arrancada con la primera en
vuelo escribiría `true` sobre `true` y no produciría flanco, dejando `searchStale` en true sobre filas
frescas. **No es alcanzable pulsando BUSCAR**: el botón se deshabilita mientras hay búsqueda en vuelo
—`canSearch` niega `pendingSearching`, que espeja `pending` (`Searcher.vue:540-544`, `:646`)— y además
es un `NuxtLink` que normalmente navega y remonta (`onSearchClick`, `:508-521`).

Sí existe una vía por código, y conviene nombrarla en vez de fingir imposibilidad:
`useSearchByQueryParams.ts:158-171` observa la firma de los seis params de la query y llama a
`runSearchFromQuery()` en cada cambio, así que un atrás/adelante del navegador entre dos estados de
query con una búsqueda en vuelo llega a `search()` sin pasar por el botón. Misma familia: un montaje
de `useSearchByRouteParams` que caiga en mitad de un vuelo.

**Y la salida no es gratis.** El arreglo correcto sería colgar la captura del contador
`searchGeneration`, pero es un `let` de módulo (`useStoreSearchData.ts:72`) que **no está en el objeto
que el store devuelve** (`:320-332`): exponerlo es tocar `packages/logic`, que está fuera del alcance
decidido. Queda escrito como deuda con su coste, no como nota al pie.

**Por qué un solo watcher.** Con dos —uno para `pending`, otro para la firma— el orden entre ellos lo
decide la posición en la cola de Vue, y las ramas «capturar» e «invalidar» se pisan: el mismo tick
que arranca una búsqueda cambia la firma. Un cuerpo con precedencia explícita convierte en código lo
que si no es un supuesto sobre el scheduler.

**Por qué `flush: 'sync'`.** `search()` pone `pending = true` en `:78` y a continuación —dentro del
mismo tick, antes de su primer `await`— `useFetchCategoriesAvailabilityData` arma su `body:` leyendo
los refs del form. Y `useSearch` los muta en flush `pre`: `watch(pickupHourOptions, …)` en `:407` y
`watch(returnHourOptions, …, { immediate: true })` en `:551`. Con flush `pre` la captura correría
*después* de esas mutaciones y podría registrar un tramo que no es el que se consultó. Con `sync` la
firma se captura en el instante exacto en que `pending` bascula: la firma capturada *es* la
consultada.

No compite con el otro watcher `sync` del archivo, el de derivación de flags (`:129-142`): los
efectos `sync` corren en orden de suscripción y ese se registra antes, así que al anular la gama
corre primero él —apagando `haveTotalInsurance` y `selectedMonthlyMileage`, correcto sin gama—. Y
como `selectedCategory` ya no es fuente de nuestro watcher, no hay reentrancia.

### Adopción inicial

Va **después** de `searchSettled` (`:150-154`), del que depende:

```ts
onMounted(() => {
  if (searchSettled.value || selectedCategory.value) {
    quotedSearchSignature.value = liveSearchSignature.value
  }
})
```

Cubre el montaje que hereda estado del store sin arrancar una búsqueda: volver de `/chat` a la misma
URL reutiliza la cotización sin togglear `pending` (`canReuseExistingSearch` en
`useSearchByQueryParams.ts:119-147`). Sin esta captura, la guarda 3 dejaría pasar cualquier cambio de
tramo posterior sin invalidar nada.

Se condiciona a `searchSettled || selectedCategory`, no solo a la gama, por el hecho 3: si en
pantalla hay filas —o un banner de error— heredados del store, también pueden quedarse rancios.

Va en `onMounted` y no en el setup a propósito, porque el orden de hidratación difiere entre las dos
superficies de `/reservas` y el setup queda del lado malo en una de ellas:

- **Superficie query (`pages/reservas/index.vue`)**: `useSearchByQueryParams()` se llama en el setup
  del propio wizard (`:93`), así que su `onMounted` se registra antes que el nuestro y corre antes.
  Capturamos el tramo ya hidratado — la única lectura exacta que tenemos, y en el setup la
  perderíamos.
- **Superficie path (`components/reservas/Results.vue`)**: `useSearchByRouteParams()` lo llama
  `Results.vue:34`, que es el **padre** (`Results.vue:16` renderiza `<ReservationWizard />`). Los
  `onMounted` del hijo corren primero, así que capturamos el tramo *persistido* en el store antes de
  la hidratación.

El segundo orden es seguro, pero **no** por `canReuseExistingSearch`: ese guard vive en el driver de
query, y `useSearchByRouteParams` no tiene ninguno — escribe los seis refs incondicionalmente (`:48`
y siguientes) y **siempre** llama a `doSearch()` (`:75`). Esa es la razón real: en esa superficie la
guarda 1 dispara sí o sí unos microsegundos después y re-captura la firma correcta bajando el
pestillo. Si la hidratación escribe valores distintos, la guarda 6 los marca rancios en el intervalo;
como su única secuela es anular una gama que la guarda 1 iba a anular igual, no queda residuo.

### Cerrar el avance en vez de mover al usuario

Esta es la pieza que el hecho 5 obliga, y la que sustituye al rebote de paso que llevaba el borrador
anterior.

Hay **tres** puertas hacia adelante desde los pasos 3-5, no una, y cerrar solo la primera deja el
hecho 5 vivo.

**1. `canAdvance` en `'seguro'` y `'adicionales'`** (`useReservationWizard.ts:118-121`):

```ts
case 'seguro':
case 'adicionales':
  return Boolean(state.hasSelectedCategory)
```

**2. `canAdvance` en `'datos'`** (`:122-123`). Sin esto, quien ya esté en el paso 5 recupera el CTA
«Confirmar reserva» en cuanto marca la casilla de privacidad —`advanceState.formValid` es
literalmente `Boolean(politicaPrivacidad.value)` (`ReservationWizard.vue:362`)— y vuelve al envío
mudo del hecho 5:

```ts
case 'datos':
  return Boolean(state.formValid && state.hasSelectedCategory)
```

**3. El `@skip` de Adicionales.** `ReservationWizard.vue:41` ata el botón «Omitir» directamente a
`wizard.next`, y `next()` (`useReservationWizard.ts:169-173`) **avanza sin consultar `canAdvance`**.
Es la única llamada a `next()` sin gate: `:254` y `:266` están condicionadas a
`currentStep === 'busqueda'` y `:386` pasa por `canAdvanceCurrent`. Hay que enrutarla por un handler
que compruebe `canAdvanceCurrent`, igual que `onNext`.

Que el aviso sustituya el contenido de Adicionales tapa esta puerta en el camino rancio, pero **eso
es un `v-if` en una plantilla hija, no un invariante de la máquina**, y hay una ventana donde no
aplica: la guarda 1 anula la gama en `pending false→true` **sin** encender `searchStale`. Con
`/reservas?…&paso=adicionales` la ruta deriva paso 4, `useSearchByQueryParams` dispara `doSearch()` al
montar, y durante el vuelo Adicionales se renderiza normal con la gama nula —tres filas «$ » y un
botón Omitir vivo—. La red de #313 solo se arma cuando la búsqueda asienta.

En el camino feliz los tres son no-op: al paso 3 no se llega sin haber elegido gama en el paso 2. Solo
muerden cuando la gama se anula bajo los pies del usuario. Hay que actualizar el docblock de
`:104-110`, que hoy dice «seguro: siempre (Básico preseleccionado)».

**Qué NO rompe.** El deep-link de #313 (`/categoria/X` con fecha fuera del horizonte) sigue
comportándose igual: `advanceState.hasSelectedCategory` ya es
`!!sc && !sc.isMonthlyPriceUnavailable` (`ReservationWizard.vue:360-361`), así que una gama
inusable nunca contó como seleccionada para avanzar. Antes solo la paraba la red de #313; ahora la
paran las dos. Redundante y correcto. Fuera de `ReservationWizard.vue:365-367` y del test de la
máquina no hay más consumidores de `canAdvance`.

**Por qué no se rebota de paso.** El borrador anterior clampaba `maxReachedStep` a 2 y hacía
`goTo('vehiculo')`. Se retira por tres razones:

1. **Su motivación era falsa.** Estaba escrita para un Searcher fuera del wizard editable desde el
   paso 4. Ese surface no existe (hecho 4).
2. **Introducía una regresión.** Con `sync` y seis escrituras secuenciales, la hidratación de la
   superficie path puede cruzar la guarda 6 con una firma a medio escribir. La guarda 1 baja el
   pestillo y re-captura acto seguido, pero **no deshacía el clamp**: en una navegación blanda a la
   superficie path con paso derivado ≥ 3, el usuario aterrizaba en el paso 2 con la preselección
   hecha pero inalcanzable.
3. **En su único disparo real empeora la experiencia.** Ese disparo es la carrera de clamps de
   `useSearch` (ver Riesgos): mover al usuario de Datos a Vehículo a mitad de formulario, y encima
   latcheado, es peor que dejarlo donde está sin poder avanzar y con el motivo escrito.

**Lo que la red de #313 sigue haciendo, y no se toca.** Si la búsqueda anterior terminó en `error` o
en inventario vacío, esas señales no se limpian fuera de `search()` (`useStoreSearchData.ts:77`,
`:86`), así que `searchSettled` sigue en true y la red sigue armada: al siguiente cambio de paso hacia
un paso ≥ 3, rebota a Vehículo y clampa. Es comportamiento preexistente de #313, no de este cambio, y
los escenarios lo dicen en vez de negarlo.

### Superficies

`searchStale` viaja como prop a los pasos 2, 3 y 4 y al resumen. Un nivel, explícito; ningún estado
nuevo sale del wizard. El bloque de aviso se extrae a `WizardStaleNotice.vue` para no triplicarlo.

```
┌──────────────────────────────────────────┐
│ Cambiaste los datos de búsqueda           │
│ Pulsa BUSCAR para ver la disponibilidad   │
│ y los precios de este nuevo trayecto.     │
│              [ Ajustar búsqueda ]         │
└──────────────────────────────────────────┘
```

**`StepVehicle.vue`** — orden de guardas: `pending` → **stale** → error de disponibilidad →
`groups.length === 0` → grid. Stale gana a las dos siguientes por motivos distintos:

- *Al error*: `error.value` solo se limpia al arrancar la siguiente búsqueda
  (`useStoreSearchData.ts:77`), así que tras cambiar el tramo describe un trayecto que ya no es el del
  usuario. El caso `one_way_not_available` lo hace evidente: el usuario corrige la sede de devolución
  justo *porque* el banner se lo pidió.
- *Al vacío*: durante los 50 ms del debounce `groups.length` todavía es > 0, y después es 0. Sin
  precedencia, el paso pasaría de grid viejo a «Sin vehículos» —las dos afirmaciones falsas— en vez
  del aviso.

El botón reutiliza `wizard-adjust-search-test`, que ya emite `adjust-search` → `onGoTo('busqueda')`.

**`StepCoverage.vue` y `StepExtras.vue`** — el aviso **sustituye** al contenido del paso mientras
`searchStale`, con el `v-if` **dentro** del componente, no en el padre. La forma importa: los
watchers de `StepCoverage:145-152` (`canQuoteTotal`) y `:206-217` (corrección de kilometraje) son de
script, y con el `v-if` dentro siguen corriendo y no-opean sobre `sc === null`. Cambiarlos al padre
los desmontaría; volverían a correr al remontar porque ambos son `immediate: true`, pero sería por
accidente y no por diseño. No es cosmético: con la gama nula esos pasos afirman cosas falsas.

- `canQuoteTotal` (`:139-142`) devuelve `true` en mensual **sin consultar `selectedCategory`**, así
  que la card de Seguro Total se renderiza (`:46`) e imprime `+ $ {{ coveragePrice }} / mes` con
  `coveragePrice` en `''` (`:176-181`) → literalmente **«+ $ / mes»**.
- `isTotal` es false, así que la card Básico se pinta con `border-brand-600 bg-brand-50 ring-2` y el
  icono de check (`:24`, `:31`): afirma «Seguro Básico seleccionado» mientras el resumen de al lado
  dice `Seguro: —`.
- En Adicionales, `priceOf` devuelve `''` (`StepExtras.vue:82-84`) → tres filas **«$ »** con
  checkboxes cuyo setter no-opea (`:74-79`).

**Coste que esto tiene y hay que decir en voz alta:** los adicionales marcados viven en la instancia
de `useCategory` (`withExtraDriver`, `withBabySeat`, `withWash`), así que anular `selectedCategory`
los destruye, y re-elegir la misma gama después construye una instancia nueva con los flags en su
valor por defecto. Quien había marcado «Conductor adicional» y «Silla bebé» los pierde. No es nuevo
—pasa hoy en cada re-búsqueda, y `StepVehicle.vue:339-342` nombra esta misma clase de pérdida como
«data loss en conversión»— pero este cambio la produce en un camino donde antes no ocurría, así que
va escrita y aseverada en SCEN-401-08.

**`WizardSummary.vue`** — el precio cae solo: sin `selectedCategory`, `totalLabel` es null y con él
desaparecen «Total renta», «IVA + Tasa» e «incluye traslado». Lo único que se añade es la causa.

- Escritorio: sustituye a «Incluye IVA y tasa» (`:80`, `v-if="totalLabel"` → `v-else-if="searchStale"`).
- Móvil: franja fina dentro del contenedor de la barra (`:101`), **encima** del `<transition>` del
  detalle. El detalle nace colapsado, así que meter ahí la explicación dejaría al usuario móvil con
  un CTA muerto y sin motivo visible, que es el defecto que arregló #387.

El resumen **no se renderiza en el paso 1**: vive en la rama `v-else` de `:32-53`, mientras el paso 1
toma el `v-if` de `:29`. Toda observación sobre el resumen es en pasos 2-5; los escenarios lo dicen.

La fila de devolución sigue mostrando el tramo vivo, que es lo que el usuario acaba de elegir. Lo que
se va es el precio; el tramo no se oculta.

### Alcance y blast radius

Siete archivos, todos brand-local en `packages/ui-alquicarros/app/`:

| Archivo | Cambio |
|---|---|
| `components/wizard/ReservationWizard.vue` | estado, watcher, adopción, props a 4 hijos, `@skip` gateado |
| `composables/useReservationWizard.ts` | `canAdvance` para `'seguro'`, `'adicionales'` y `'datos'` + docblock |
| `components/wizard/WizardStaleNotice.vue` | **nuevo**, el bloque de aviso |
| `components/wizard/steps/StepVehicle.vue` | prop + guarda |
| `components/wizard/steps/StepCoverage.vue` | prop + sustitución de contenido |
| `components/wizard/steps/StepExtras.vue` | prop + sustitución de contenido |
| `components/wizard/WizardSummary.vue` | prop + línea de motivo (dos superficies) |

**Consumidores afectados fuera de esos archivos:** ninguno en runtime.

**Pero el cambio de `canAdvance` enmienda un escenario ya aprobado, y eso necesita decisión
explícita.** Tres aserciones de `reservation-wizard-machine.test.ts` cambian de valor: `:180`
(`canAdvance('seguro', {}) === true`), `:184` (`canAdvance('adicionales', {}) === true`) y `:189`
(`canAdvance('datos', { formValid: true }) === true`). De las tres, **solo la de `:184` está ligada
por nombre a un escenario**: **SCEN-W-07** («canAdvance('adicionales') siempre true — paso opcional»,
`:10`). Las otras dos son invariantes sin id, así que actualizarlas es mantenimiento normal.
Reescribir la de SCEN-W-07 para que pase sería exactamente la clase de ajuste que no se hace.

La enmienda que se propone es de invariante, no de aserción: SCEN-W-07 decía *«Adicionales es
opcional, así que no impone requisitos propios»*, y sigue siendo verdad — lo que cambia es que un
paso **no puede avanzar sin una gama viva**, que es una precondición del flujo entero y no un
requisito del paso. Formulado así, la redacción nueva es *«los pasos posteriores a Vehículo no
imponen requisitos propios, pero ninguno avanza con la gama anulada»*. El hecho 5 es la evidencia de
por qué la formulación vieja era insuficiente: dejaba llegar a un «Confirmar reserva» mudo.

Alternativa si se prefiere no tocar SCEN-W-07: dejar `canAdvance` intacto y reinstaurar el rebote de
paso solo para `currentStepNumber >= 3`. Cuesta la experiencia descrita en el riesgo de clamps
(sacar al usuario de Datos a mitad de formulario) y vuelve a depender del orden entre invalidación y
máquina de pasos. **Es una decisión del usuario, no mía.**

**Fuera:** `packages/logic`. `useRecordReservationForm` conserva su corte vivo/congelado, pero en
alquicarros deja de ser alcanzable: sin gama no hay submit. Y `useSearch` conserva su toast de
traslado y su debounce.

**Fuera también, y es trabajo aparte: las marcas hermanas.** `CategorySelectionSection.vue:344`
(alquilatucarro) y `:293` (alquilame) cuelgan la misma anulación de `pendingSearch`, y en ellas el
Searcher convive con el grid en la misma página, así que el hueco es más accesible que en
alquicarros: no hace falta ni el stepper. El fix tampoco es portable, porque no tienen pasos ni
stepper y anular con el slideover abierto tiene su propia coreografía (`urlSyncDepth`). **Follow-up
explícito, fuera de este PR:** reproducir con agent-browser y abrir el issue con esa evidencia dentro.

## Escenarios observables

| ID | Given | When | Then |
|---|---|---|---|
| SCEN-401-01 | Cotización de ida y vuelta AABOT→AABOT elegida, wizard en el paso 5 (Datos) | vuelvo a Búsqueda por el stepper, cambio solo el lugar de devolución a Medellín, y navego al paso 2 | ninguna superficie enseña un total (ni el viejo ni otro), el resumen dice por qué, y el CTA no confirma la reserva |
| SCEN-401-02 | Igual que -01 pero con tarifa de traslado > 0 en la cotización vieja | navego al paso 2 y miro la tarjeta del resumen de escritorio | no queda ninguna línea «incluye traslado» junto a un badge «otra ciudad» que ya no corresponde |
| SCEN-401-03 | Búsqueda hecha, **sin gama elegida**, wizard en el paso 1 | cambio una fecha y subo al paso 2 | el paso dice que cambié la búsqueda y que pulse BUSCAR, no que no haya vehículos — ni antes ni después de que venza el debounce de 50 ms |
| SCEN-401-03b | Igual que -03 pero **con gama elegida** | ídem | ídem, y además el resumen pierde el total |
| SCEN-401-04 | Wizard en el paso 4 (Adicionales) con gama elegida y búsqueda asentada con resultados | `useSearch` mueve la hora sola por un clamp (`watch(pickupHourOptions)`, `:407`) | no puedo avanzar a Datos, se me dice por qué, y no se me saca del paso en el que estoy |
| SCEN-401-04b | Igual que -04 pero la búsqueda anterior terminó en error o inventario vacío | ídem, y luego navego a otro paso ≥ 3 | la red de #313 rebota a Vehículo y clampa el stepper: comportamiento preexistente que este cambio no altera |
| SCEN-401-04c | Wizard en el paso 3 (Seguro) o 4 con la gama anulada por rancia, **en reserva mensual (30 días)** | miro el contenido del paso | no veo «+ $ / mes», ni filas «$ », ni la card Básico marcada como elegida: veo el aviso y la vía de vuelta |
| SCEN-401-05 | Búsqueda completa | elijo gama y avanzo hasta Datos sin tocar el tramo | nada se invalida: el total y la gama siguen en el resumen en cada paso, y el avance funciona en los cinco |
| SCEN-401-06 | `/reservas?…` con gama elegida; salgo a `/chat` | vuelvo con el botón atrás a la misma URL | la gama y el precio siguen ahí (el remonte no cuenta como cambio de tramo) |
| SCEN-401-07 | Deep-link `/…/categoria/C` en carga limpia | la búsqueda asienta y la gama se preselecciona | la preselección no se auto-anula y el paso derivado de la ruta se respeta |
| SCEN-401-08 | Tramo cambiado sin buscar con adicionales ya marcados, aviso visible, tramo nuevo **válido** | pulso BUSCAR y vuelvo a elegir la misma gama | el flujo se recupera: hay filas y el aviso desaparece; y los adicionales que había marcado **no** vuelven marcados (se perdieron con la instancia) |
| SCEN-401-08b | Tramo rancio y `doSearch` sale por una de sus guardas sin togglear `pending` (`useSearch.ts:125-147` / `:154-161`) | pulso BUSCAR | el aviso NO desaparece: sin búsqueda nueva, seguir mostrándolo es lo correcto |
| SCEN-401-09 | Cotización elegida, error `one_way_not_available` visible en el paso 2 | corrijo la sede de devolución sin buscar | el banner de error deja de hablar de un trayecto que ya no es el mío |
| SCEN-401-10 | Móvil, tramo cambiado sin buscar | navego al paso 2 y miro la barra inferior fija **sin expandir el detalle** | veo por qué el CTA está deshabilitado |
| SCEN-401-11 | Tramo cambiado sin buscar, aviso visible | deshago la edición y dejo el tramo exactamente como estaba, sin pulsar BUSCAR | el aviso sigue ahí y el resumen sigue sin total: no hay disponibilidad que recuperar, y el paso 2 nunca afirma «Sin vehículos» |
| SCEN-401-12 | Paso 1 de `/reservas` con gama en el store; pulso BUSCAR y la app navega en blando a la superficie path | el wizard remonta y `useSearchByRouteParams` hidrata y re-busca | no queda residuo: el pestillo termina abajo, la firma cotizada es la del tramo hidratado, y ningún paso alcanzado se pierde |
| SCEN-401-13 | Montaje en el que `pending` ya está en true y no capturamos nada, **sin tocar el tramo mientras la búsqueda está en vuelo** | la búsqueda resuelve y después cambio el tramo | la invalidación funciona igual: la guarda 2 adoptó el tramo al resolver, así que el montaje no queda inerte |
| SCEN-401-14 | Paso 4 alcanzado por `?paso=adicionales` con la búsqueda **en vuelo**: la guarda 1 anuló la gama, `searchStale` está en false y el botón «Omitir» sigue vivo (la ventana no-rancia; con la red estrangulada se sostiene lo bastante para actuar) | pulso «Omitir — continuar sin adicionales», y si llego a Datos marco la casilla de privacidad | ninguna de las dos puertas me lleva a un «Confirmar reserva» que no confirma |

Guardas anti-regresión: -05, -06, -07 y -12 (el camino feliz, el remonte, el deep-link y la
navegación blanda). -11 guarda el pestillo, -04 el no-rebote, -13 la red de la guarda 2, -14 las tres
puertas hacia adelante.

**Ejecutabilidad.** SCEN-401-04, -04b, -08b y -13 no son alcanzables por interacción normal: los dos
primeros necesitan que la admin data del horario aterrice tarde; las guardas de `doSearch` del tercero
están tapadas por el `min-value` del calendario y el auto-bump (la única variante alcanzable es dejar
la página abierta hasta que pase la hora de recogida elegida); y el cuarto necesita un montaje con
`pending` ya en true. **Los cuatro son unitarios.** El resto se ejercita en navegador.

## Riesgos

**Falsos positivos por clamps de horario — y son el único disparo real de la invalidación fuera del
paso 1.** `useSearch` ajusta las horas cuando cambian las opciones (`watch(pickupHourOptions)` `:407`,
`watch(returnHourOptions)` `:551`), y también hay el rollover de mismo día (`:272-283`) y el tope
`MAX_RENTAL_DAYS` (`:428-444`). Las opciones dependen del horario de la sucursal, que llega con la
admin data. Si esa data aterrizara *después* de una búsqueda asentada, el clamp movería la hora y la
cotización se invalidaría sola con el usuario en cualquier paso. La carrera es estrecha, porque esa
misma admin data alimenta el selector con el que se busca, y el fallo cae del lado seguro: pide
re-buscar en vez de cotizar mal. **Es por esta carrera que no se rebota de paso**: el usuario se queda
donde está, sin poder avanzar y con el motivo a la vista. Se fija en SCEN-401-04.

**Contraste del aviso.** El texto nuevo aparece en cuatro sitios que resuelven a dos fondos:
`bg-white` en la tarjeta sticky de escritorio (`WizardSummary.vue:12`) y en el contenedor de la barra
móvil (`:101`), y el `bg-surface-soft` del contenedor de pasos 2-5 (`ReservationWizard.vue:32`) bajo
las tarjetas de `WizardStaleNotice`. Hay que medirlo con el método de #364 —canvas 1×1 sobre el color
computado, porque Tailwind 4 emite `oklch()` y el fondo se resuelve subiendo por el árbol—. Mínimo AA.

## Verificación

- Unitarios (vitest, dentro de `packages/ui-alquicarros`; desde la raíz el filtro excede 2 min): la
  máquina de invalidación (captura, adopción al resolver, invalidación con y sin gama, pestillo,
  idempotencia, adopción tras remonte), el nuevo `canAdvance` en los tres pasos —incluida la
  actualización de las tres aserciones existentes— el `@skip` gateado, y el render de las cuatro
  superficies. Cada escenario con su aserción. Los que tocan el grid del paso 2 deben avanzar
  temporizadores 50 ms o aseverarán contra filas viejas.
- **SCEN-401-04 aterriza como aserción sobre el fuente, no como test de comportamiento.** Montar el
  wizard y simular admin data tardía más el clamp de `pickupHourOptions` es un fixture
  desproporcionado; la forma que ya usa el repo para lo equivalente es
  `reservation-wizard-integration.test.ts:106-111`, que comprueba la red de #313 con
  `expect(src).toMatch(…)`. Aquí sería el negativo: que el watcher de invalidación **no** contenga
  `goTo` ni `maxReachedStep`. Se dice aquí para que nadie ni sobre-invierta ni debilite la aserción
  en silencio.
- Runtime con agent-browser sobre el worktree: SCEN-401-01, -02, -03, -03b, -04c, -05, -06, -08, -09,
  -10, -11, -12 y -14. Cero errores de consola, cero peticiones fallidas.
- Typecheck por delta con `git stash`, nunca `| tail`: el exit code que se ve es el del `tail`.
