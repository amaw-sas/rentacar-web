# Continuidad de la selección en el wizard de alquicarros — diseño

Issue: [#368](https://github.com/amaw-sas/rentacar-web/issues/368) · Epic [#372](https://github.com/amaw-sas/rentacar-web/issues/372) · Fecha: 2026-07-23

## El problema, en una frase

El wizard descarta elecciones que el usuario ya hizo, y no dice ni cuándo ni por qué.

## Alcance

#368 agrupa ocho hallazgos repartidos por cuatro superficies: el wizard, el formulario del paso 5, la página de confirmación y una lista de pulidos. Salen unos veinte cambios discretos. Un solo spec para todo eso no se sostiene.

| Sub-proyecto | Hallazgos | Estado |
|---|---|---|
| **B1 — continuidad de la selección** | 2 | **este documento** |
| B3 — historial por paso | 3 | separado, ver abajo |
| C — formulario y envío | 4, 5, 6, 7 | pendiente |
| A — confirmación | 1 + confeti | pendiente |
| D — pulido de pasos 2-4 | 8 | pendiente |

Este va primero porque es el único grupo que destruye trabajo ya hecho por el usuario. Los otros degradan la experiencia; este le borra elecciones.

### Por qué el historial se separó, y qué ya sabemos de él

El hallazgo 3 —que el botón atrás del navegador saca del wizard en vez de recorrer pasos— empezó dentro de este spec y salió tras dos rondas de revisión. No se abandona: se resecuencia, porque no es un problema de continuidad de datos sino de enrutamiento, y su superficie real es mucho mayor de lo que sugiere el issue.

Lo aprendido, para que el spec que lo tome no vuelva a pagarlo:

**El flujo principal de `/reservas` es por PATH, no por query.** `e2e/alquicarros-reservas-path.spec.ts:41-48` (SCEN-ACP-02) asegura que el buscador de `/reservas` limpio emite un href de path y explícitamente `expect(href).not.toContain('?lugar_recogida=')`. Existen cuatro páginas de path bajo `/reservas`, con variantes `referido` y `categoria`, todas de ocho segmentos o más. Cualquier manejador de `popstate` que reconstruya el route desde `window.location` obtiene `search` pero no `params`, así que necesita un parser del `pathname` contra esa gramática. Ese parser es la pieza no trivial del trabajo, y merece ser un helper puro con sus propias pruebas.

**`deriveStepFromRoute` no sirve como autoridad única URL→paso.** Su regla de `useReservationWizard.ts:82` devuelve `'seguro'` en cuanto hay `params.categoria`, antes de mirar `query.paso`. Eso es correcto como regla de *entrada* (un link de operador preselecciona la gama y deja al usuario en Seguro) y equivocado como mapeo general: en una sesión que entró por `/categoria/C`, todo popstate derivaría `seguro` sin importar el `?paso=`, el atrás quedaría muerto y el watcher de sync iría reescribiendo cada entrada mientras la recorre. Hace falta separar el modo de entrada del modo de retroceso.

**El contador de entradas del precedente no es portable.** `CategorySelectionSection.vue` mantiene `pushedEntries` de forma segura porque lo re-deriva absoluto desde la URL en cada popstate (0 si no hay `/categoria/`, 1 si lo hay — `:692` y `:695`), nunca lo decrementa. Un wizard de cinco pasos necesita un rango de 0 a 3 que no es re-derivable desde `?paso=`, porque esa URL no revela cuántas entradas de atrás son propias. La vía que sí es re-derivable desde estado observable es marcar la propiedad en `history.state`, como hace el propio precedente al empujar (`pushState({ slideover: true }, …)`, `:525`).

**El retroceso originado en la página no puede empujar historial.** Si el "Atrás" del stepper móvil (`WizardStepper.vue:49-58`) empujara una entrada, pulsar el atrás del navegador después movería al usuario hacia adelante. El precedente delega en `window.history.back()` (`:738-741`) y desenrolla N entradas con `history.go(-pushedEntries)` (`:745-748`).

**Cruzar un límite de navegación del router es un riesgo real.** Re-buscar desde un paso avanzado deja entradas rancias detrás; retroceder hasta ellas es una navegación con parámetros de búsqueda distintos, que re-dispara `doSearch()` sobre la búsqueda vieja. `reservationSearchSignature` (`useSearchByQueryParams.ts:44-55`) ya existe para comparar identidades de búsqueda y es la herramienta natural para acotar eso.

### Una advertencia para quien tome A

El hallazgo #1 propone "recapitular la reserva" en `/reservado/[reserveCode]`. Eso choca con una decisión de seguridad deliberada. El docstring de `packages/logic/src/composables/useReservationConfirmation.ts:46-48` lo dice sin ambigüedad:

> "The API response intentionally contains only an existence boolean; reservation data never reaches the browser or the Nuxt payload."

Esa URL es un identificador tipo bearer. Servir el detalle de la reserva desde el servidor reabre justo la exposición que ese endpoint cerró a propósito. El recap solo puede salir del store del cliente, en sesión; al recargar o abrir el enlace desde el correo no habrá nada que mostrar.

Lo que sí funciona siempre es lo demás: enlaces reales de WhatsApp y correo, checklist de requisitos, copiar el código. Ahí está el valor de ese hallazgo. Que A no se planee suponiendo lo contrario.

## Dos afirmaciones del issue que el código no respalda

Conviene separar lo que está roto de lo que solo lo parece.

**"Volver al paso 1 borra la selección."** No. El watcher que borra (`ReservationWizard.vue:164-169`) está gateado por la transición `pending` false→true, o sea por arrancar una búsqueda nueva, no por navegar al paso 1. Volver por el stepper y regresar no pierde nada.

Y el borrado, cuando ocurre, es correcto. `useCategory` congela los precios en refs al construirse, así que conservar la gama a través de una búsqueda con fechas distintas dejaría el sidebar y el payload con la cotización vieja. Ese es literalmente el bug #373, que costó un PR arreglar. El defecto no es que borre: es que no avisa. Quitar el reset sería una regresión.

**"La pista de volver atrás solo existe en desktop."** El stepper móvil tiene botón "Atrás" y puntos de progreso navegables (`WizardStepper.vue:47-82`). Lo que falta en móvil es la frase explicativa del resumen (`WizardSummary.vue:63-65`), que vive solo en el `<aside>` de desktop. Hallazgo real, bastante menor de lo que sugiere el texto, y encaja mejor en D.

## Lo que sí está roto

Cambiar de gama pierde el Seguro Total, el plan de kilometraje y los adicionales. `onSelect` (`StepVehicle.vue:338-346`) hace `selectedCategory.value = cat`, y `cat` es una instancia nueva de `useCategory` con los cinco flags en su default (`useCategory.ts:72-76`). Lo irónico es que el código ya previene el re-tap de la misma gama, con un comentario que nombra la pérdida de datos por su nombre. El cambio real la produce igual.

Y el reset por búsqueda nueva es silencioso. El usuario ajusta una fecha, vuelve a buscar, y su vehículo desapareció. Ni una línea que lo explique.

### El tercero, que salió mirando el arrastre

`useCategory.withMileage` arranca siempre en `"1k_kms"` (`useCategory.ts:73`). Si una gama no vende ese plan, el precio calculado es 0.

El único guardián que corrige eso vive dentro de `StepCoverage` (`:203-211`), así que solo corre si ese paso está montado. Y con `maxReachedStep` ya en 5, se puede cambiar de gama en el paso 2 y saltar por el stepper directo a "Datos" sin montarlo nunca. Misma familia que el bug de mensualidad de la PR #308.

No lo arreglo por separado. Validar el plan de kilometraje en el punto de cambio, que es justo lo que hace falta para el arrastre, lo cierra de paso.

## Decisiones

**El Seguro Total se arrastra, y se avisa.** El usuario lo eligió deliberadamente; perderlo por comparar carros es justo el defecto que reporta el issue. Si la gama nueva no lo cotiza, se cae y se dice en pantalla. La alternativa, volver a Básico en cada cambio, repite la fricción en la acción más frecuente del paso 2.

**El aviso del reset es posterior y no bloqueante.** Interceptar la búsqueda exigiría un guard de ruta sobre un `NuxtLink` para frenar una acción legítima. Se deja que el reset ocurra y se explica: cambiaron las fechas, los precios se recalcularon, hay que elegir otra vez.

**`useCategory` no se toca.** Sacar los cinco flags de la instancia al store del wizard sería más limpio en abstracto, pero ese composable vive en `packages/logic` y lo consumen las tres marcas. Un problema de alquicarros no justifica mover el suelo bajo el flujo de reserva de alquilatucarro y alquilame. Los flags se leen y escriben por la API de refs que ya expone (`useCategory.ts:445-475`).

## Diseño

Dos piezas, un PR.

### 1. `carrySelection`, función pura

Vive en `app/composables/useSelectionCarryOver.ts` y sigue la forma de `useReservationWizard.ts`: núcleo puro exportado más envoltorio, testeable sin Nuxt.

```ts
carrySelection(prev: SelectionFlags | null, ctx: CarryContext): CarryResult
// ctx:    { monthly, canQuoteTotal, sellablePlans }
// result: { flags, dropped: ('seguroTotal' | 'kilometraje')[] }
```

| Flag | Regla |
|---|---|
| `withTotalCoverage` | Sobrevive si `ctx.canQuoteTotal`. Si no, cae a `false` y entra en `dropped` |
| `withMileage` | Solo relevante en mensual. Sobrevive si la gama nueva vende ese plan; si no, cae al primer vendible en orden de kilometraje y entra en `dropped`. **Nunca queda en `null`** |
| `withExtraDriver`, `withBabySeat`, `withWash` | Siempre sobreviven |

Con `prev === null` devuelve los defaults y `dropped` vacío. No hay nada que arrastrar ni que anunciar.

Tres precisiones que no son opcionales.

**`canQuoteTotal` es el predicado consciente del mensual, no `canQuoteTotalCoverage` a secas.** En mensual el cobro real es `total_insurance_price` de la fila del mes, no el cargo diario, así que `StepCoverage.vue:139-142` devuelve `true` incondicional ahí. Gatear el arrastre por el `canQuoteTotalCoverage` crudo tiraría el Seguro Total en gamas mensuales que sí lo cotizan, anunciaría una pérdida que no ocurrió, y encima entraría en contradicción con el `watch(canQuoteTotal, immediate)` de `StepCoverage` en cuanto el usuario llegue al paso 3. La forma correcta es una sola: extraer ese predicado a un helper y que `StepCoverage` y `carrySelection` lo compartan.

**`withMileage` nunca puede acabar en `null`.** Si el conjunto de planes vendibles sale vacío (todos a 0, o la fecha cae más allá del horizonte y `pickPriceForDate` no devuelve fila), la tentación es devolver `null`. Sería grave: `isMonthlyPriceUnavailable` está gateado por `!!withMileage.value` (`useCategory.ts:111-113`), así que un `null` **desactiva el fail-closed de #313** y `hasUsableCategory` reporta la gama como usable. A partir de ahí `getTotalPrice` cae a la rama diaria y devuelve solo el `returnFee`, y el watcher de derivación pone `selectedMonthlyMileage` en `null`, con lo que `useRecordReservationForm` toma la rama regular y registra `total_price: 0` sin `monthly_mileage`. Es exactamente el bug de la PR #308. Con el conjunto vacío se conserva el valor entrante y se deja que `isMonthlyPriceUnavailable` falle cerrado, que es lo que ya hace `StepCoverage:207` al salir temprano con `plans.length === 0`.

**Los flags se fijan sobre la instancia nueva ANTES de asignarla al store.** El watcher de derivación de `ReservationWizard.vue:129-142` es `flush: 'sync'`: si se asigna primero, dispara con los defaults frescos y escribe `haveTotalInsurance = false` antes de que lleguen los valores corregidos. Y `search.trackVehicleSelection(cat)` mediría la instancia sin arrastrar. El precedente ya resolvió esto y dejó el porqué escrito en `CategorySelectionSection.vue:635-636`: "Restaurar Seguro Total ANTES de asignar al store para que el watcher de derivación vea `withTotalCoverage=true` en el primer tick."

Así queda `onSelect`: capturar los flags previos, construir el resultado, **aplicarlo sobre `cat`**, y solo entonces asignar `selectedCategory`, `vehiculo` y disparar el tracking y el aviso. El guard de re-tap se mantiene intacto.

### El contrato de los helpers extraídos

El conjunto de planes vendibles (1k/2k con precio positivo) ya se calcula en `StepCoverage.vue:189-196` y en `StepVehicle.vue:229-237`. Esta sería la tercera copia, así que entra como helper único. Pero extraer código que hoy funciona solo es seguro si el contrato queda fijado, y aquí hay tres trampas.

**El helper elige la fila, no la recibe.** `StepCoverage.vue:154-159` documenta un invariante load-bearing: la fila de precios mensuales debe ser la MISMA que usa `useCategory.getCategoryMonthPrice` para cobrar, porque `pickPriceForDate` puede devolver una fila `inactive` cuando ninguna activa cubre la fecha, y "elegirla de otro modo haría que la etiqueta mienta sobre lo que se cobra". `StepVehicle.rowMonthlyBasic` llama a `pickPriceForDate` por la misma razón. Así que la firma es `(prices, pickupDate) => MonthlyMileage[]`, con `pickPriceForDate` **dentro**. Si recibiera una fila ya elegida, el invariante se mudaría a los llamadores y la extracción sería justo lo que lo rompe.

**El orden es por kilometraje, no por precio.** `mileagePlans` empuja 1k y luego 2k en orden fijo, y el watcher correctivo toma `plans[0]` (`:208`). Eso es "primer vendible en orden de km", que coincide con "el más barato" solo por convención de los datos, no por construcción. Si el helper implementara "el más barato" literalmente, en una fila invertida (2k por debajo de 1k) `carrySelection` elegiría 2k donde `StepCoverage` habría elegido 1k, y el default del paso 3 cambiaría en silencio. No hay oscilación —el watcher solo corrige cuando el valor actual falta del conjunto— pero cambiar ese default está fuera de alcance. El helper devuelve orden de kilometraje.

**Devuelve el conjunto y nada más.** Los tres sitios quieren formas distintas: `StepCoverage` necesita además etiquetas y precios formateados con `moneyFormat`; `rowMonthlyBasic` necesita `min(vendibles) + returnFeeAmount`, que no es el conjunto; `carrySelection` solo quiere el conjunto. El helper devuelve `MonthlyMileage[]`; las etiquetas, el formateo y la suma de la tarifa de retorno se quedan en cada llamador. Si no, `moneyFormat` acaba dentro de un composable que este spec llama puro, y el `+ returnFeeAmount` de `rowMonthlyBasic` se pierde o se absorbe.

Para el otro helper, `canQuoteTotal(cat, monthly)`: tolera categoría nula y compara con `=== true` estricto, igual que `StepCoverage.vue:141`. En regular una categoría nula da `false`, y de eso depende lo que ve el watcher de `:145-152` en el primer montaje.

Una interacción que sí verifiqué y no es problema: el watcher correctivo de `:203-211` y `carrySelection` no se pelean. El watcher solo actúa cuando el valor actual falta del conjunto, así que tras un arrastre que ya aterrizó en un plan vendible es un no-op, y sale temprano con `plans.length === 0`, que es exactamente lo que pide la regla del conjunto vacío.

### 2. `useWizardNotice()`, una sola nota

Dos escritores y un renderizador. Escriben el shell, al arrancar una búsqueda, y `StepVehicle`, al elegir vehículo. Renderiza un banner `role="status"` en el paso 2.

**El banner va como hermano por encima del bloque de cuatro ramas, no dentro de los tiles.** `StepVehicle` tiene cuatro estados mutuamente excluyentes —cargando (`:19`), error de disponibilidad (`:28`), sin resultados (`:70`) y tiles (`:90`)—, así que colgarlo del grid de tiles lo haría invisible en los otros tres. El que importa es "sin resultados": el usuario re-buscó, perdió su vehículo **y** no obtuvo nada. Es el estado más confuso del flujo y justo donde falta la explicación. Además, un aviso que nunca se ve es un aviso que se queda armado.

```ts
type WizardNotice =
  | { kind: 'search-reset' }
  | { kind: 'carry'; dropped: CarryDropped[] }
  | null
```

Inline, no toast: es una explicación, no una notificación efímera. El `role="status"` sigue la convención que ya usa `packages/ui-alquicarros/app/components/ChatConversation.vue:176`.

**No hay lógica de borrado, y eso es deliberado.** La ranura se *escribe* en exactamente dos eventos y se *lee* solo en el paso 2:

| Evento | Qué escribe |
|---|---|
| Arranca una búsqueda nueva | `{ kind: 'search-reset' }` si el reset descartó una selección; `null` si no había nada que descartar |
| El usuario elige un vehículo | `{ kind: 'carry', dropped }` si algo cayó; `null` si no |

**Las dos escrituras son incondicionales, y la simetría es lo que sostiene el modelo.** La tentación es escribir solo cuando hay algo que anunciar, y eso deja el aviso armado indefinidamente: si el reset solo escribiera al descartar, bastaría re-buscar hacia una búsqueda sin disponibilidad (que deja `selectedCategory` en null), pulsar "Ajustar búsqueda" desde el estado vacío y volver a buscar con éxito para que el segundo reset no escribiera nada y el banner del primero apareciera pegado a una búsqueda que no descartó nada. Eso es justo lo que SCEN-368B1-07 prohíbe. Peor: `useState` es de ámbito de aplicación, así que un aviso armado y nunca visto viaja por navegación de cliente a otra ciudad o a `/reservas`.

La invariante que sostiene esto **no** es "toda entrada a una búsqueda nueva reinicia la ranura". Eso sería falso: hay al menos tres caminos a paso 2 sin que `pending` toggle. La rama de reutilización de `useSearchByQueryParams.ts:119-121`, y —más comunes— los dos guards con los que `doSearch` retorna antes de llegar a `search()`: fecha u hora de recogida ya pasadas (`useSearch.ts:145`) y rango invertido o de cero días (`:160`). Esos dos viven en `packages/logic`, así que aplican a las tres superficies, y no son exóticos: cualquier URL de resultados compartida o guardada en marcadores cae ahí en cuanto su fecha de recogida pasa.

La invariante real es más fuerte y sí se sostiene:

> La escritura del aviso y el reset de la selección los gobierna **la misma transición** `pending` false→true, así que no pueden discrepar.

Cuando el reset no dispara, la selección tampoco se descarta, y la ranura sigue conteniendo una escritura hecha sobre esa misma selección que sobrevive. Ranura y selección quedan mutuamente consistentes por construcción, no por enumerar caminos.

De ahí sale una restricción de implementación que no es opcional: **la escritura va dentro del callback del `watch(pending, …)` de `ReservationWizard.vue:164-169`**, no en un driver de búsqueda. Enganchar `useSearchByQueryParams` parece equivalente y no lo es: solo cubriría la superficie de query, porque las rutas por path y las de ciudad hidratan por `useSearchByRouteParams`, que vive en `packages/logic` y este spec no toca.

Un efecto del modelo que conviene fijar como decisión y no dejar como accidente: un aviso `carry` **sobrevive al ir al paso 3 y volver al 2**. Es defendible —la pérdida ocurrió y sigue vigente— pero es la diferencia de comportamiento más visible respecto de un modelo con limpieza, y SCEN-368B1-09 la ancla.

Las dos reglas de borrado que parecían naturales están ambas envenenadas, y conviene dejar escrito por qué para que nadie las reintroduzca. Un watcher sobre `currentStep` no sirve: el reset escribe la nota y acto seguido la red de seguridad (`:339-349`) llama a `wizard.goTo('vehiculo')`, así que el banner se borraría antes de que `StepVehicle` lo pinte. Y colgarlo de `wizard.next()` es peor, porque **dos de sus cuatro invocadores son el handshake de búsqueda**, no el usuario:

| Sitio | Quién llama |
|---|---|
| `:254` | Watcher de firma de query, tras la búsqueda |
| `:266` | Watcher de `pending` true→false, tras la búsqueda |
| `:386` | `onNext`, el CTA del usuario |
| `:41` | "Omitir" de StepExtras |

Con `:266` el fallo es determinista, no una carrera. El usuario en el paso 2 va al paso 1 —por la pastilla del stepper o por "Ajustar búsqueda" (`StepVehicle.vue:51-58`)—, reenvía los mismos parámetros, el `NuxtLink` no navega pero `doSearch` sí corre (#129, `:259-268`), `pending` togglea, el reset escribe el aviso, y al asentar `:266` llama `next()` y lo borra. El paso 2 se pinta sin banner y la selección desapareció en silencio.

Respaldado por `useState`. Lo importante no es que sea SSR-seguro, sino que **sobrevive a un remontaje**: en la ruta por path un re-buscar cambia los route params y puede remontar la página, llevándose por delante cualquier `ref` local del componente. No sustituir por un `ref` de módulo.

## Manejo de error

| Caso | Comportamiento |
|---|---|
| `prev === null` al cambiar de gama | Sin arrastre; la elección **escribe `null`** en la ranura, no la deja intacta |
| Conjunto de planes vendibles vacío | Se conserva el `withMileage` entrante; `isMonthlyPriceUnavailable` falla cerrado |
| Gama nueva más allá del horizonte de tarifas | El arrastre no fabrica precio: el fail-closed de #313 y la red de seguridad de `:339-349` siguen gobernando |
| Gama nueva sin cotización de Total en reserva regular | Cae a Básico y se anuncia |

### Una vía que no pasa por `carrySelection`

La preselección por deep-link (`ReservationWizard.vue:294-318`) construye la instancia de `useCategory` directamente, sin pasar por `onSelect`, así que el arrastre nunca corre ahí. Hoy es inocuo, pero por una razón que conviene dejar escrita porque no se ve: `deriveStepFromRoute:82` devuelve `'seguro'` para cualquier URL con `/categoria/X` —incluso una que traiga `?paso=datos`—, lo que topa `maxReachedStep` en 3 y obliga al usuario a pasar por el paso 3, donde el watcher correctivo de `StepCoverage` arregla el kilometraje. Si esa precedencia cambiara, esta vía quedaría sin guardián.

## Alcance de superficie

El wizard se monta hoy en exactamente dos sitios, y ninguno pasa la prop: `pages/reservas/index.vue:16` y `components/reservas/Results.vue:16`. O sea que `externalSearch` está muerto en `false` — la superficie de ciudad dejó de montarlo (SCEN-322-X06, custodiado por `tests/reservation-wizard-integration.test.ts:58-73`).

Lo que importa no es la ciudad, entonces, sino que esas dos superficies **hidratan por caminos distintos**: `/reservas` por query y `Results.vue` por path, vía `useSearchByRouteParams`. El watcher de reset de `:164-169` está por encima del bloque `if (!props.externalSearch)` de `:232`, así que sirve a las dos. Escribir el aviso en un driver de búsqueda no: cubriría solo la forma de query.

## Radio de impacto

| Archivo | Cambio |
|---|---|
| `app/components/wizard/steps/StepVehicle.vue` | `onSelect` arrastra flags antes de asignar; renderiza el banner; `rowMonthlyBasic` (`:229-237`) consume el helper |
| `app/components/wizard/ReservationWizard.vue` | Marca el reset que descartó selección |
| `app/components/wizard/steps/StepCoverage.vue` | `mileagePlans` y `canQuoteTotal` consumen los helpers, en vez de su copia local |
| `app/composables/useSelectionCarryOver.ts` | Nuevo: `carrySelection` + helper de planes vendibles + predicado `canQuoteTotal` |
| `app/composables/useWizardNotice.ts` | Nuevo |
| `tests/` de la marca | Suites nuevas (detalle en Pruebas) |

Todo bajo `packages/ui-alquicarros`, sin consumidores fuera de la marca. `packages/logic` no se modifica, así que alquilatucarro y alquilame no se ven afectados. Ningún documento existente queda desactualizado: la auditoría que originó el issue es un registro histórico.

Sin cambios en `e2e/`. Los escenarios de este spec son observables en jsdom, y eso evita de paso el riesgo de recolección de #374 y la necesidad del guard de marca — `playwright.config.ts:38-59` solo excluye los doce specs de `buscar-vehiculos`, así que un spec nuevo correría bajo las tres marcas. Cuando B3 traiga su e2e, necesitará el `test.skip(BRAND !== 'alquicarros', …)` de `e2e/alquicarros-reservation-wizard.spec.ts:25`.

## Pruebas

| Nivel | Qué prueba |
|---|---|
| Unit puro | `carrySelection` por tabla: arrastra todo / cae Seguro Total no cotizable / corrige kilometraje al primer vendible en orden de km / conjunto vendible vacío conserva el valor entrante y nunca devuelve `null` / `prev = null` |
| Unit puro | `canQuoteTotal` en mensual devuelve true aunque `canQuoteTotalCoverage` sea false; con categoría nula en regular devuelve false |
| Unit puro | El helper de planes vendibles elige la fila con `pickPriceForDate` y devuelve orden de kilometraje, no de precio — con una fila invertida (2k por debajo de 1k) sigue devolviendo 1k primero |
| Mount jsdom | Cambiar de gama conserva los flags y el resumen lo refleja; el re-tap sigue siendo no-op |
| Mount jsdom | Los flags llegan antes que la asignación: el watcher `flush: 'sync'` nunca observa `haveTotalInsurance = false` en un arrastre que conserva Total |
| Mount jsdom | El rebote de la red de seguridad no borra el aviso de reset |
| Mount jsdom | **El banner sobrevive a un re-buscar con los mismos parámetros desde el paso 1** — la ruta del handshake `:266`, que es la única que ninguna otra prueba cubre |
| Mount jsdom | **Dos búsquedas seguidas, la segunda sin nada que descartar, no dejan banner** — la escritura incondicional del reset |
| Mount jsdom | El banner se ve en los cuatro estados de `StepVehicle`, incluido "sin resultados" |
| Mount jsdom | **Una búsqueda que nunca llega a `search()`** (fecha de recogida ya pasada) deja intactas selección y ranura — ancla el sitio de escritura y falla ruidosamente si alguien la mueve a un driver |

El precedente es `app/components/wizard/__tests__/WizardSummary.mount.test.ts`, **no** `tests/wizard-summary-price.test.ts`. La distinción es load-bearing: `vitest.config.ts:12` fija `environment: 'node'` para toda la marca, y el segundo archivo es un test de regex sobre fuente que lo dice en su propia cabecera ("sin entorno DOM en esta marca") y delega la evidencia viva a runtime. Solo el primero monta de verdad, con un docblock `// @vitest-environment jsdom` en la línea 1, `vi.mock('pinia')` reduciendo `storeToRefs` a identidad y los stores por `vi.stubGlobal`. Los tests nuevos van en ese mismo directorio y con ese mismo docblock; sin él corren en `node` y no hay DOM que assertar.

Todos montan la forma de query. El arrastre no depende de la forma de la URL —`onSelect` no lee el route—, pero eso deja la superficie de path sin pasada en runtime: que B3, que sí vive en esa gramática, o D la recojan.

## Riesgos

El total puede subir sin que nadie lo pida: arrastrar el Seguro Total a una gama más cara mueve el precio. El sidebar lo refleja al instante y el banner lo nombra, pero sigue siendo un movimiento no solicitado. Se acepta conscientemente. La alternativa perdía la elección del usuario.

El helper compartido toca `StepCoverage`, que hoy funciona. Extraer su cálculo de planes vendibles es refactor dentro del archivo que ya estamos modificando, no refactor oportunista, pero cualquier divergencia entre la copia vieja y el helper sería un cambio de comportamiento silencioso en el paso 3. Las pruebas de tabla del helper son la defensa.

## Escenarios observables

Puente hacia scenario-driven-development. Cada decisión del diseño tiene al menos uno, y todos son comprobables desde fuera.

**SCEN-368B1-01 — el Seguro Total sobrevive al cambio de gama.**
*Dado* el paso 2 con una gama elegida y Seguro Total activo, *cuando* el usuario elige otra gama que sí cotiza Total, *entonces* la fila "Seguro" del resumen sigue diciendo "Seguro Total" y "Total a pagar" muestra el importe de la gama nueva, distinto del anterior.

**SCEN-368B1-02 — el Seguro Total que no se puede cotizar cae y se anuncia.**
*Dado* una reserva **regular** en el paso 2 con Seguro Total activo, *cuando* el usuario elige una gama sin cargo diario de Total aplicable a la fecha, *entonces* la fila "Seguro" dice "Seguro Básico" y aparece un banner `role="status"` que nombra la pérdida.

**SCEN-368B1-03 — el plan de kilometraje se corrige sin montar StepCoverage.**
*Dado* una reserva mensual con plan de 2.000 km, *cuando* el usuario cambia a una gama que solo vende 1.000 km y salta por el stepper directo a "Datos", *entonces* la fila "Kilometraje" del resumen dice "1.000 km" y "Total a pagar" muestra un importe, no el guion de fail-closed.

**SCEN-368B1-04 — los adicionales sobreviven siempre.**
*Dado* el paso 2 con conductor adicional y lavado marcados, *cuando* el usuario cambia de gama, *entonces* la fila "Adicionales" del resumen sigue listando ambos.

**SCEN-368B1-05 — el re-tap de la misma gama sigue sin efecto.**
*Dado* una gama ya elegida con Seguro Total, *cuando* el usuario toca esa misma card, *entonces* el resumen no cambia y no aparece banner.

**SCEN-368B1-06 — el reset por búsqueda nueva se explica.**
*Dado* el paso 2 con vehículo elegido, *cuando* el usuario cambia una fecha y vuelve a buscar, *entonces* la fila "Vehículo" vuelve a "Elige →" y aparece un banner que dice que los precios se recalcularon y hay que elegir de nuevo.

**SCEN-368B1-07 — sin selección previa no hay ruido.**
*Dado* el paso 2 sin vehículo elegido, *cuando* el usuario vuelve a buscar, *entonces* no aparece ningún banner.

**SCEN-368B1-08 — el aviso de reset no sobrevive a la elección.**
*Dado* el banner de reset visible en el paso 2, *cuando* el usuario elige un vehículo sin que nada se pierda, avanza al paso 3 y **vuelve al paso 2**, *entonces* el banner sigue ausente. El viaje de ida y vuelta es lo que prueba el modelo: sin lógica de limpieza, solo la escritura de la elección puede haberlo quitado.

**SCEN-368B1-09 — el aviso de arrastre sí sobrevive al ida y vuelta.**
*Dado* un aviso de arrastre visible tras perder el Seguro Total al cambiar de gama, *cuando* el usuario avanza al paso 3 y vuelve al paso 2, *entonces* el aviso sigue visible. La pérdida ocurrió y sigue vigente; es el contrapunto deliberado de SCEN-368B1-08.

**SCEN-368B1-10 — el reset se explica también cuando no hay resultados.**
*Dado* el paso 2 con vehículo elegido, *cuando* el usuario re-busca hacia fechas sin disponibilidad, *entonces* el estado "Sin vehículos para esta búsqueda" se muestra **con** el banner de reset visible por encima, no en su lugar.

**SCEN-368B1-11 — un segundo re-buscar sin nada que descartar no hereda el banner.**
*Dado* el estado vacío del escenario anterior con el banner visible, *cuando* el usuario pulsa "Ajustar búsqueda" y busca de nuevo hacia fechas con disponibilidad, *entonces* los tiles se pintan **sin** banner: la búsqueda nueva no descartó nada y la escritura incondicional del reset limpió la ranura.

**SCEN-368B1-12 — el arrastre no fabrica precio más allá del horizonte.**
*Dado* una reserva mensual con Seguro Total y plan elegidos, *cuando* el usuario cambia a una gama cuya fecha de recogida cae más allá del horizonte de tarifas, *entonces* el resumen no muestra un total, el CTA no permite avanzar, y en ningún caso aparece "$ 0".
