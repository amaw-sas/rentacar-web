# Continuidad de la selección en el wizard — plan de implementación

Spec: [`2026-07-23-wizard-continuidad-datos-design.md`](./2026-07-23-wizard-continuidad-datos-design.md) · Issue [#368](https://github.com/amaw-sas/rentacar-web/issues/368) · Fecha: 2026-07-23

Todo bajo `packages/ui-alquicarros/`. `packages/logic` no se toca en ningún paso, así que alquilatucarro y alquilame quedan fuera del radio.

Comando de cada paso: `pnpm --filter ui-alquicarros vitest run <archivo>`. La suite entera de la marca: `pnpm --filter ui-alquicarros test`.

## Mapa de archivos

| Archivo | Responsabilidad | Qué le pasa |
|---|---|---|
| `app/composables/useMonthlyPlans.ts` | **nuevo.** Predicados de tarifa mensual: `sellablePlans`, `canQuoteTotalCoverageFor` | puros, consumidos por los pasos 2 y 3 del wizard |
| `app/composables/useSelectionCarryOver.ts` | **nuevo.** Solo `carrySelection` | puro, sin dependencias de Nuxt |
| `app/composables/useWizardNotice.ts` | **nuevo.** Ranura única del aviso sobre `useState` | escribir y leer; sin lógica de borrado, por diseño |
| `app/components/wizard/steps/StepVehicle.vue` | Paso 2 | `onSelect` arrastra antes de asignar; `rowMonthlyBasic` consume el helper; el banner entra como hermano encima de las cuatro ramas |
| `app/components/wizard/steps/StepCoverage.vue` | Paso 3 | `mileagePlans` y `canQuoteTotal` pasan a consumir los helpers. El watcher correctivo de `:203-211` **no se toca** |
| `app/components/wizard/ReservationWizard.vue` | Shell del wizard | el watcher de `:164-169` escribe la ranura de forma incondicional |
| `app/composables/__tests__/useMonthlyPlans.test.ts` | **nuevo.** Tabla de los predicados | incluye fila invertida y empate |
| `app/composables/__tests__/useSelectionCarryOver.test.ts` | **nuevo.** Tabla del arrastre | las cinco reglas |
| `app/components/wizard/__tests__/harness.ts` | **nuevo.** Fixtures + factoría `mountWizard()` que afirma sus precondiciones | consumido por los tres archivos de la fase 3 |
| `app/components/wizard/__tests__/ReservationWizard.mount.test.ts` | **nuevo.** Evidencia DOM del shell | los escenarios de los pasos 5, 6 y 7 |
| `tests/wizard-monthly-mileage.test.ts` | guard de fuente del mensual | cuatro desenlaces distintos en el paso 1: dos re-apuntadas, una resuelta en `StepCoverage`, una convertida en aserción de comportamiento |
| `tests/wizard-contrast.a11y.test.ts` | invariante de contraste | `StepVehicle.vue` entra en su lista (paso 6) |

Dos responsabilidades, dos archivos. `sellablePlans` y `canQuoteTotalCoverageFor` son predicados de tarifa mensual que consumen los pasos 2 y 3 del wizard, y no tienen nada que ver con el arrastre; meterlos en `useSelectionCarryOver.ts` obligaría a `StepCoverage` a importar de un archivo llamado "carry-over" para pintar tiles de kilometraje.

## Lo que ya existe y hay que respetar

**El precedente de mount es `WizardSummary.mount.test.ts`, no `wizard-summary-price.test.ts`.** `vitest.config.ts:12` fija `environment: 'node'` para toda la marca. El segundo archivo es regex sobre fuente y lo dice en su cabecera: "sin entorno DOM en esta marca… la evidencia DOM/E2E viva se satisface en runtime". Solo el primero monta de verdad, con docblock `// @vitest-environment jsdom` en la línea 1. Sin ese docblock, un archivo nuevo corre en `node` y no hay DOM que assertar.

**Pero su `vi.mock('pinia')` NO se puede copiar aquí.** El precedente monta un componente hoja con categorías falsas, así que puede reducir `storeToRefs` a identidad y prescindir del resto de pinia. Este plan necesita el `useCategory` real (SCEN-12), y `useCategory.ts:9` importa `useStoreReservationForm` **directo del módulo**, no por auto-import, de modo que `vi.stubGlobal` no lo alcanza; ese store hace `import { defineStore } from 'pinia'` en su línea 2. Mockear pinia entero deja `defineStore` en `undefined` y el import revienta antes de que `useCategory` corra. La única forma que satisface las dos cosas es **pinia real**: `setActivePinia(createPinia())`, sin `vi.mock('pinia')`, y `vi.stubGlobal` apuntando a los módulos de store reales de logic para que componente y `useCategory` acaben en la misma instancia.

**Dos tests pasan hoy por un comentario, y este plan reescribe esos comentarios.** `reservation-wizard-steps.test.ts:123-125` afirma `expect(stepCoverage()).toMatch(/haveTotalInsurance/)`, y la única aparición de esa cadena en `StepCoverage.vue` está en sus docblocks (`:6` y `:215`). Reformular esa prosa en los pasos 1 o 2 pone rojo un test llamado "sincroniza haveTotalInsurance en el form" por una razón que no tiene nada que ver con su nombre.

**Y una trampa de negativa:** `reservas-path-routing.test.ts:45` afirma que `ReservationWizard.vue` **no** contiene `/useSearchByRouteParams\(/`. El paso 7 edita ese archivo y este plan habla de ese composable constantemente. Un comentario que lo escriba con paréntesis lo pone rojo; mencionarlo sin paréntesis es seguro.

**`externalSearch` está muerto en `false`.** El wizard se monta en `pages/reservas/index.vue:16` y `components/reservas/Results.vue:16`, y ninguno pasa la prop; la superficie de ciudad dejó de montarlo (SCEN-322-X06, custodiado por `tests/reservation-wizard-integration.test.ts:58-73`). Lo que importa no es la ciudad sino que esas dos superficies hidratan distinto: `/reservas` por query y `Results.vue` por path, vía `useSearchByRouteParams`. El watcher de reset de `:164-169` está encima del bloque de `:232` y sirve a las dos; un driver de búsqueda cubriría solo la de query.

**El watcher correctivo del paso 3 se queda.** `StepCoverage.vue:203-211` sigue cubriendo la preselección por deep-link (`ReservationWizard.vue:294-318`), que construye la instancia sin pasar por `onSelect`. Ya verifiqué que no se pelea con `carrySelection`: solo actúa cuando el valor falta del conjunto, así que tras un arrastre correcto es un no-op.

**`wizard.next()` no significa "el usuario avanzó".** Cuatro invocadores, dos de ellos watchers de búsqueda (`:254` y `:266`). Ningún paso puede colgar nada de esa función.

**El paso 2 tiene cuatro ramas excluyentes**: `pending` (`:19`), `availabilityError` (`:28`), `groups.length === 0` (`:70`) y los tiles (`:90`). El banner va fuera de las cuatro. Ojo con el testid: `wizard-adjust-search-test` existe **dos veces**, en la rama de error (`:51-58`) y en la de vacío (`:78-87`), así que un selector `.first()` acierta o falla según la rama activa.

**`WizardSummary` monta sus dos superficies a la vez.** El `<aside class="hidden lg:block">` (`:11`) y la barra móvil (`:71`) llevan un `UButton` cada uno (`:53` y `:123`), y jsdom no aplica CSS, así que en el DOM aparecen los dos "Continuar". `data-testid="wizard-total-a-pagar"` está solo en el de escritorio (`:49`) y es seguro; cualquier criterio que lea el CTA tiene que desambiguar. Misma familia que el testid duplicado de arriba.

## Prerrequisitos

Ninguno para los pasos 1 a 7: todo corre en Vitest, sin servidor de dev ni backend de disponibilidad.

Para la verificación final sí hace falta servidor en el worktree, que necesita `pnpm install` y copiar `.env.local` a la raíz — sin eso todo responde 500. Levantar con `PORT=4001 pnpm --filter ui-alquicarros dev`; el argumento `--port` da NuxtWelcome. Comprobar `/proc/PID/cwd` antes de fiarse del puerto, porque la navegación interna rebota a `:4000` si otro worktree sirve ahí.

**El typecheck de la raíz congela el disco en WSL2**: correr solo la marca, con `ionice -c3 nice -n19`, y medir delta contra el baseline, que ya está rojo en `main`.

**La suite de `packages/logic` tiene tres tests flaky** incluso en aislamiento (baseline verde = 140 archivos / 1057 tests). Este plan no la toca: cualquier rojo ahí es preexistente.

## Pasos

### Fase 1 — Predicados compartidos

Refactor que preserva comportamiento. No arregla nada visible; existe porque `carrySelection` necesita las mismas reglas que ya usan los pasos 2 y 3, y una tercera copia sería el defecto que este plan debería evitar, no crear.

**1. `sellablePlans`, con la fila elegida dentro** · M · sin dependencias

Cuando el paso 3 pinte sus planes de kilometraje y el paso 2 su "desde $X" mensual, ambos salen del mismo helper y muestran exactamente lo que mostraban antes.

Entra `sellablePlans(prices, pickupDate): { value: MonthlyMileage; price: number }[]` en `useMonthlyPlans.ts`, con `pickPriceForDate` **dentro** y en orden de kilometraje. Devuelve el precio crudo, no formateado: así el helper pasa a ser el dueño único de la selección de fila **para el conjunto de planes** —que es lo que hace load-bearing el invariante de `StepCoverage.vue:154-159`, la fila debe ser la MISMA que `useCategory.getCategoryMonthPrice` usa para cobrar— y aun así `moneyFormat` se queda en la vista. `coveragePrice` conserva su propio `monthPrice` para `total_insurance_price`; esa fila no pasa por el helper. `StepCoverage.mileagePlans` compone etiqueta y formato sobre lo que recibe; `rowMonthlyBasic` hace `Math.min` sobre los precios y le suma `returnFeeAmount`.

Ese asimetría es deliberada y frágil: el **plan por defecto** se elige por orden de kilometraje (`plans[0]`, `StepCoverage:208`), mientras que el **piso "desde"** se elige por el más barato (`Math.min`). Colapsar las dos durante la extracción es el error natural.

Tarea explícita del paso, no opcional: **re-apuntar a `useMonthlyPlans.ts` las aserciones de `tests/wizard-monthly-mileage.test.ts` que la extracción rompe con certeza.** Son tres:

La extracción se ejecutó antes de cerrar este plan, así que la lista no es predicción. Rompen tres, y cada una se arregla en un sitio distinto:

| Aserción | Por qué rompe | Dónde se arregla |
|---|---|---|
| `:71` — `/\['2k_kms'\]\s*>\s*0/` sobre `StepCoverage.vue` | el filtro `> 0` se muda al helper | re-apuntar a `useMonthlyPlans.ts` |
| `:111` — `/1k_kms/` sobre `StepVehicle.vue` | los literales dejan `rowMonthlyBasic` | re-apuntar a `useMonthlyPlans.ts` |
| `:67` — `not.toMatch(/3k_kms/)` sobre `StepCoverage.vue` | **la extracción AÑADE el literal prohibido** | en `StepCoverage`, la aserción no se mueve |

El tercero merece explicación porque el tipo empuja hacia el error. `MonthlyMileage` es `"1k_kms" \| "2k_kms" \| "3k_kms"`, así que un mapa de etiquetas escrito como `Record<MonthlyMileage, string>` está obligado por TypeScript a llevar la clave `3k_kms`, y esa aserción guarda un invariante de producto real: ninguna marca oferta 3k, como dice el docblock de `StepCoverage:184-188` y confirma el `v-if="false"` de `CategoryCard`. La salida es `Partial<Record<…>>` o dos ramas explícitas, **dentro de `StepCoverage`**. La aserción no se mueve al helper: el invariante pertenece a la vista que construye el mapa de etiquetas.

`:112` y `:114` viven en el mismo bloque `it` que `:111`, así que no llegan a correr. `:114` (`/>\s*0/`) sobreviviría además por una razón ajena, matcheando `renderable.value.length > 0` en `StepVehicle.vue:297`.

**`:107` no rompe, y eso es peor que si rompiera.** Al quitar el import y la llamada, `pickPriceForDate` sigue apareciendo en `StepVehicle.vue:227`, en un docblock, así que la aserción pasa afirmando sobre prosa. No se re-apunta al archivo nuevo —eso mudaría la fragilidad un archivo más allá— sino que se convierte en la aserción de comportamiento que ese comentario describe: `sellablePlans` devuelve los precios de la fila `inactive` de respaldo cuando ninguna activa cubre la fecha, que es la misma fila que `useCategory` usa para cobrar.

**`:79-82` se queda como está.** Sobre `StepCoverage.vue` esa cadena sí tiene código detrás: import real en `:116` y llamada real en `:162`, porque `coveragePrice` conserva su propio `monthPrice` para leer `total_insurance_price` (`:179`). Es una aserción débil, pero no es prosa, y guarda una frontera que sí conviene enunciar: el helper es dueño de la selección de fila **del conjunto de planes**, y el precio de cobertura conserva la suya.

Vigilar además `reservation-wizard-steps.test.ts:123-125`, que depende de otro comentario según se explica arriba.

Acepto el paso cuando la tabla del helper cubre fila invertida (2k por debajo de 1k → 1k sigue primero) y empate (`1k === 2k > 0` → 1k primero, que es donde un `reduce` con `<=` se iría a 2k); cuando cubre la fila `inactive` de respaldo, sustituyendo a `:107`; cuando `wizard-monthly-mileage.test.ts` pasa con `:71` y `:111` re-apuntados y `:67` resuelto en `StepCoverage`; y cuando una aserción numérica fija la aritmética del piso mensual.

Esa última tiene una trampa que hay que esquivar explícitamente. El piso lo calcula `rowMonthlyBasic`, que es `min(planes vendibles) + returnFeeAmount` —**dos** términos de una fila mensual—, y solo corre con `haveMonthlyReservation` en true. La rama diaria de `rowBasicTotal` es otra cosa: tres campos sumados (`totalAmount + coverageTotalAmount + returnFeeAmount`). Una fixture con `month_prices: []` sobre un alquiler de 7 días no ejercita el piso mensual en absoluto. La fixture de este criterio es mensual, con `1k_kms` y `2k_kms` positivos y `returnFeeAmount` distinto de cero, **y con la fila invertida**: así una sola aserción fija las dos mitades de la asimetría que sostiene el paso — el piso se elige por el más barato, mientras que el plan por defecto se elige por orden de kilometraje. Colapsarlas durante la extracción no rompe ningún test existente.

**2. `canQuoteTotalCoverageFor`, consciente del mensual** · S · sin dependencias

Cuando una gama mensual sin cargo diario de seguro llegue al paso 3, la card de Seguro Total sigue apareciendo.

Entra en `useMonthlyPlans.ts` replicando `StepCoverage.vue:139-142`: `true` incondicional en mensual, y `cat?.canQuoteTotalCoverage === true` en regular. Tolera categoría nula y compara estricto, porque de eso depende lo que ve el watcher de `:145-152` en el primer montaje.

**El nombre no puede ser `canQuoteTotal`.** `app/composables/*` se auto-importa y `StepCoverage.vue:139` ya declara un `const canQuoteTotal`; reusar el nombre no produce sombra sino auto-referencia y error de TDZ. `StepCoverage` mantiene su computed local y delega en el helper.

Acepto el paso cuando el test unitario cubre las **cuatro** combinaciones y el paso 3 se comporta igual que antes: mensual, regular con cotización, regular con categoría nula, y regular con `canQuoteTotalCoverage: false`. La cuarta no es redundante: el sentido del `=== true` estricto es que `undefined` y `false` den ambos falso, y `false` es justo la entrada de SCEN-02 —"una gama sin cargo diario de Total"—, mientras que la de categoría nula solo ejercita `undefined`.

**3. `carrySelection`, el núcleo puro** · M · depende de 1 y 2

Dados los flags de una gama y el contexto de otra, devuelve qué sobrevive y qué cae.

`withTotalCoverage` sobrevive si `ctx.canQuoteTotal`. `withMileage` sobrevive si la gama nueva vende ese plan, y si no cae al primero en orden de km; **con conjunto vacío conserva el valor entrante y nunca devuelve `null`**, porque `isMonthlyPriceUnavailable` (`useCategory.ts:111-113`) está gateado por `!!withMileage.value` y un null apaga el fail-closed de #313 hasta acabar registrando `total_price: 0` sin `monthly_mileage`. Los tres adicionales sobreviven siempre. Con `prev === null`, defaults y `dropped` vacío.

Acepto el paso cuando la tabla cubre las cinco reglas y el caso de conjunto vacío afirma dos cosas: que el resultado no es `null`, **y que `dropped` viene vacío**. Lo segundo es tan importante como lo primero. Con el conjunto vacío no se perdió nada —se conservó el valor entrante y el fail-closed hará su trabajo—, así que anunciar una pérdida sería mentir: SCEN-12 acabaría pintando un banner que reclama un plan caído justo al lado de un resumen que muestra "—". La tabla unitaria es lo único que puede atrapar eso.

### Fase 2 — El arnés

**4. Montar el shell en jsdom** · M · depende de 3

Este paso no añade cobertura a nada anterior: construye la infraestructura sin la cual **ningún** escenario de la fase 3 puede definirse de forma observable. Va aparte porque es el coste real de los pasos 5 a 7 y esconderlo dentro de ellos los volvería L.

El shell trae lo que el componente hoja no tenía: el watcher de derivación `flush: 'sync'`, el reset por `pending`, la red de seguridad y `canAdvanceCurrent` viven todos ahí. Es montable —`useReservationWizard` solo llama `useRoute()` y el resto es `ref`/`computed` plano, y `import.meta.client` es falsy bajo Vitest, así que el `scrollTo` de `:227`, el `replaceState` de `:278-284` y el `scrollIntoView` de `:312-314` nunca corren.

El arnés se extrae a `app/components/wizard/__tests__/harness.ts`, con los constructores de fixture y una factoría `mountWizard()`. Los pasos 5, 6 y 7 lo consumen los tres; duplicar el montaje en tres archivos es como la fixture diverge en silencio entre ellos.

Inventario de globales a stubear, que es lo que hay que tener delante al escribirlo:

| Global | Por qué |
|---|---|
| `useToast` | `useStoreSearchData.ts:43` llama `useMessages()`, y `useMessages.ts:7` llama `useToast()` sin guard. Sin este stub el store de búsqueda revienta antes de montar nada |
| `useState` | Dos consumidores, no uno: la ranura del aviso y `'rentacar-data'`. `useStoreAdminData.ts:6` importa `useFetchRentacarData` **directo**, así que esquiva el stub global; sembrar `useState('rentacar-data')` una vez cubre las dos rutas |
| `useRoute` | Con los seis parámetros de búsqueda. Ver abajo |
| `useFetchRentacarData` | Ruta por auto-import (la directa la cubre la semilla de `useState`) |
| `useSearchByQueryParams` | No-op |
| `useStoreSearchData`, `useStoreReservationForm`, `useCategory` | Apuntados a los módulos reales de logic |

`useRuntimeConfig` es opcional: los tres `analyticsBrand()` van en try/catch y sin él devuelven `'unknown'`. `useRecordReservationForm` no corre nunca — es `async` y solo se alcanza al enviar.

Y cinco condiciones que no son negociables:

**Pinia real, no mockeado.** `setActivePinia(createPinia())` y `vi.stubGlobal` de `useStoreSearchData` y `useStoreReservationForm` apuntando a los módulos reales de logic. Así componente y `useCategory` comparten instancia, `storeToRefs` nativo funciona, y los métodos que el flujo dispara —`trackVehicleSelection` en cada arrastre (`StepVehicle.vue:345`) y `trackCheckoutStarted` al saltar a "Datos" (`ReservationWizard.vue:226`)— vienen de serie en vez de haber que stubearlos uno a uno. Arrastra el grafo de stores: el setup de `useStoreSearchData` llama a `useStoreAdminData`, `useStoreReservationForm` y `useMessages`. Ese es el coste real del paso. La ruta de analítica es inerte (`trackAnalyticsEvent` devuelve false sin `gtag`, y los `analyticsBrand()` van en try/catch).

**`useMoneyFormat` no se stubea.** `useCategory` lo importa directo en su módulo (`:6`), así que un global no lo alcanza; si el stub formatea distinto que logic, SCEN-01 compararía cadenas de dos formateadores. O se deja el real, o se replica el `Intl` idéntico como hizo el precedente.

**Los nombres de componente son los de auto-import, no los de archivo.** El shell escribe `WizardStepsStepVehicle`, `WizardStepsStepCoverage`, `WizardStepsStepSearch`, `WizardStepsStepExtras`, `WizardStepsStepData`, `WizardSummary` y `WizardStepper`; `StepVehicle` escribe `WizardVehicleSegmentTile`, `WizardVehicleCard` y `PlaceholdersCategoryCard`. Registrar `{ StepVehicle }` no resuelve nada y el shell renderiza un hueco en silencio.

Reales: `WizardStepsStepVehicle`, `WizardSummary` y **`WizardVehicleCard`** — esta última es la que emite `select` con la instancia de `useCategory` (`StepVehicle.vue:132-140`), o sea el único disparador de `onSelect`; sin ella no hay escenario de fase 3 que pueda arrancar. Stubeados: `WizardStepper`, `WizardStepsStepSearch`, `WizardStepsStepCoverage`, `WizardStepsStepExtras`, `WizardStepsStepData`, `PlaceholdersCategoryCard`, `WizardVehicleSegmentTile`, y `UButton` e `IconsChevronDownIcon`, que usa `WizardSummary` (`:53`, `:116`, `:123`) y de los que depende el criterio "el CTA queda bloqueado". `StepVehicle` no contiene ningún `UIcon`.

**El stub de `useState` es de ámbito de módulo y va indexado por clave**, de modo que la misma clave devuelve el mismo ref entre montajes. Uno que entregue un ref nuevo por llamada hace que SCEN-09 pase por la razón equivocada y SCEN-08 pase vacíamente — y son contrapuntos deliberados el uno del otro, así que los dos se pondrían verdes pase lo que pase con la implementación.

**Los cuatro composables nuevos se importan explícitamente** en los componentes que los usan (`useWizardNotice`, `carrySelection`, `sellablePlans`, `canQuoteTotalCoverageFor`). Viven en `app/composables/*` y en un `mount()` pelado serían `undefined`; si el arnés los stubea, los pasos 6 y 7 afirmarían contra la semántica del stub, que es precisamente la invariante de "escrituras incondicionales, ninguna limpieza" que se trata de defender. Es la misma solución que el paso 2 usa para el TDZ.

#### Las dos formas de que el arnés mienta

Las dos se midieron ejecutando el montaje, no leyendo el código, y las dos producen verde con el DOM equivocado.

**`useRoute` sin los seis parámetros de búsqueda.** Con `{ query: {}, params: {} }`, `deriveStepFromRoute` devuelve `'busqueda'`, el shell renderiza el `StepSearch` stubeado y **el DOM queda vacío** — y aun así la aserción del watcher de derivación pasa. Sola no basta: hace falta la de humo que lee la fila "Vehículo".

**La fixture tiene que satisfacer el join del store.** `useStoreSearchData.ts:232` cruza por `availabilityByCode.get(categoryAdmin.id)` mientras el índice se construye sobre `row.categoryCode`. Si la fila admin no lleva `id` igual al `categoryCode` de la de disponibilidad, el join falla, el store sintetiza con el centinela `999999999`, `renderable` (`StepVehicle.vue:201-206`) lo filtra y sale `groups.length === 0`. El resultado es el estado vacío renderizado con `filteredCategories.length === 1`: todos los escenarios de arrastre correrían contra la rama vacía con aspecto saludable, y una aserción con forma de SCEN-10 pasaría por la razón equivocada. La fixture necesita `admin.id === availabilityRow.categoryCode`, más `visibility_mode` que satisfaga `isCategoryVisibleInCity` con `selectedPickupLocation` en null, más `category`, `name`, `models` y `month_prices`.

Ninguna de las dos se descubre leyendo `StepVehicle`: solo mirando qué rama se pintó. Por eso la factoría del arnés afirma sus propias precondiciones una vez —rama de tiles alcanzada, resumen presente, paso en `'vehiculo'`— en vez de dejar que cada escenario se dé cuenta.

Acepto el paso cuando el arnés monta el shell con una gama disponible; cuando afirma **positivamente** que se pintó la rama de tiles y no la vacía (conteo de tiles o ausencia de "Sin vehículos para esta búsqueda"); cuando permite togglear `pending` desde el test; cuando una aserción de humo lee del DOM la fila "Vehículo" del resumen; y —esto es lo que demuestra que el arnés es load-bearing— cuando fijar `withTotalCoverage` en la instancia seleccionada se observa en `haveTotalInsurance`, que prueba que la ruta `flush: 'sync'` está viva.

### Fase 3 — El arrastre y el aviso

**5. `onSelect` arrastra antes de asignar** · M · depende de 4 → SCEN-368B1-01, -03, -04, -12

Cuando el usuario cambia de gama en el paso 2, el resumen conserva el seguro, el kilometraje y los adicionales que ya había elegido.

El orden es lo único delicado: los flags se aplican sobre `cat` **antes** de asignar `selectedCategory`, antes de `vehiculo` y antes de `trackVehicleSelection`. El watcher de derivación de `ReservationWizard.vue:129-142` es `flush: 'sync'`, así que asignar primero lo dispara con los defaults frescos y escribe `haveTotalInsurance = false`. La marca hermana dejó el porqué escrito en `CategorySelectionSection.vue:635-636`.

El guard de re-tap se mantiene **verbatim**, y el código del arrastre va **después** de su `return` temprano, nunca fundido con él: `wizard-monthly-mileage.test.ts:53-55` y `reservation-wizard-steps.test.ts:172` pinean los dos la línea `if (cat.categoryCode.value === selectedCode.value) return` tal cual.

Acepto el paso cuando, tras cambiar de gama: la fila "Seguro" del resumen sigue diciendo "Seguro Total" y el total pasa a ser el de la gama nueva (SCEN-01); la fila "Adicionales" sigue listando conductor y lavado (SCEN-04); saltar por el stepper a "Datos" con una gama que solo vende 1.000 km deja "Kilometraje: 1.000 km" y un total distinto de "—" (SCEN-03); un espía sobre `haveTotalInsurance` no observa nunca `false` durante un arrastre que conserva Total; y el re-tap de la misma card no construye instancia nueva (SCEN-05, mitad de estado).

Para SCEN-12 la categoría destino se construye con el **`useCategory` real** sobre una fila con `categoryMonthPrices` más allá del horizonte, no con un stub: si se stubea, la aserción "nunca aparece $ 0" mide la forma del stub y no `isMonthlyPriceUnavailable`. El criterio es que el resumen muestre "—", que el CTA quede bloqueado y que "$ 0" no aparezca en el DOM.

**6. La ranura del aviso y el banner del arrastre** · M · depende de 5 → SCEN-368B1-02, -05, -09

Cuando el arrastre pierde algo, el paso 2 lo dice; cuando no pierde nada, no dice nada.

Entra `useWizardNotice()` sobre `useState`, con dos operaciones y **ninguna limpieza**. `useState` no está por SSR sino porque sobrevive a un remontaje: en la superficie de path un re-buscar cambia los route params y puede remontar la página, llevándose cualquier `ref` local. La elección de vehículo escribe siempre: aviso de arrastre si algo cayó, `null` si no.

El banner se renderiza como hermano **encima** del bloque de cuatro ramas, con `role="status"` siguiendo `ChatConversation.vue:176`. Se añade `StepVehicle.vue` a la lista de `tests/wizard-contrast.a11y.test.ts`, que hoy no lo cubre.

Acepto el paso cuando perder el Seguro Total en una gama regular sin cotización pinta el banner y deja la fila "Seguro" en "Seguro Básico" (SCEN-02); cuando el re-tap tampoco pinta banner (SCEN-05, mitad de aviso); cuando el banner sigue visible tras ir al paso 3 y volver al 2 (SCEN-09); y cuando aparece en los cuatro estados del paso 2.

**7. El reset escribe la ranura, siempre** · M · depende de 6 → SCEN-368B1-06, -07, -08, -10, -11

Cuando una búsqueda nueva descarta la selección, el paso 2 explica por qué; cuando no descarta nada, no queda rastro del aviso anterior.

La escritura va **dentro del callback del `watch(pending, …)` de `ReservationWizard.vue:164-169`**, y es incondicional: `{ kind: 'search-reset' }` si había selección que descartar, `null` si no. La simetría con la escritura del paso 6 es lo que impide que ranura y selección discrepen, porque las gobierna la misma transición de `pending`. Escribir solo cuando hay algo que anunciar deja el aviso armado, y como `useState` es de ámbito de aplicación, ese aviso viaja por navegación de cliente.

Acepto el paso cuando re-buscar con vehículo elegido devuelve "Vehículo" a "Elige →" y pinta el banner (SCEN-06); cuando re-buscar sin vehículo elegido no pinta nada (SCEN-07); cuando el estado "Sin vehículos para esta búsqueda" se muestra **con** el banner encima (SCEN-10); cuando una segunda búsqueda que no descarta nada deja los tiles sin banner (SCEN-11); y cuando elegir vehículo, ir al paso 3 y volver al 2 deja el banner ausente (SCEN-08).

Tres criterios más, que no cubren escenarios sino que defienden las tres reglas que el spec descartó por envenenadas:

- Un re-buscar con los **mismos** parámetros desde el paso 1 conserva el banner. Es la ruta del handshake de `:266`, la única que ninguna otra prueba toca, y la que se rompe si alguien vuelve a colgar la limpieza de `wizard.next()`. Hace además un segundo trabajo que conviene nombrar: en el paso 1 el shell solo renderiza el `StepSearch` stubeado, así que `StepVehicle` está desmontado y el `next()` lo remonta. Ese es exactamente el remontaje por el que la ranura vive en `useState`, así que este test **demuestra** la cuarta condición del paso 4 en vez de darla por buena.
- El rebote de la red de seguridad (`:339-349`) no borra el aviso. Se rompe si alguien reintroduce un watcher sobre `currentStep`.
- Una búsqueda que nunca llega a `search()` —sembrando una fecha de recogida pasada, que dispara el guard de `useSearch.ts:145`— deja intactas la selección y la ranura.

Ese último **no basta por sí solo** para anclar el sitio de escritura, y conviene ser honesto sobre por qué: el arnés stubea `useSearchByQueryParams`, así que si alguien moviera la escritura a ese driver, el driver no correría, no se escribiría nada, y el test seguiría verde. Degeneraría en una tautología sobre un watcher que no disparó. Se acompaña de una aserción de fuente: ni `app/composables/useSearchByQueryParams.ts` ni el `useSearchByRouteParams` de logic contienen la escritura del aviso. Un invariante de "esto no va aquí" es de las pocas cosas que una aserción estructural hace mejor que un mount.

Al editar `ReservationWizard.vue` en este paso, no escribir `useSearchByRouteParams(` con paréntesis en ningún comentario: `reservas-path-routing.test.ts:45` afirma esa negativa.

## Verificación final

Los doce escenarios se satisfacen en jsdom, así que la suite es la evidencia principal. Pero el paso 6 coloca un elemento visual en cuatro estados y eso no se valida leyendo DOM serializado: una pasada de runtime con el servidor del worktree comprueba que el banner se ve donde debe, que no rompe el layout del estado vacío, y que no hay errores de consola ni peticiones fallidas.

Es el único momento del plan que necesita servidor. Si sale algo, vuelve al paso que lo causó; no hay fase de "pulido" donde esconderlo.

## Lo que este plan no hace

No toca el historial del navegador: el hallazgo 3 salió a su propio spec, y el diseño ya recoge lo que dos rondas de revisión establecieron sobre él.

No añade nada a `e2e/`. Todos los escenarios son observables en jsdom, lo que de paso evita el riesgo de recolección de #374. Cuando B3 traiga su e2e necesitará el guard `test.skip(BRAND !== 'alquicarros', …)` de `e2e/alquicarros-reservation-wizard.spec.ts:25`, porque `playwright.config.ts:38-59` solo excluye los doce specs de `buscar-vehiculos`.

Todos los mount tests montan la forma de query. El arrastre no lee el route, así que no depende de la forma de la URL, pero eso deja la superficie de path —`Results.vue`, que hidrata por `useSearchByRouteParams`— sin pasada de runtime. Que la recoja B3, que sí vive en esa gramática.

## Riesgo

El refactor de los pasos 1 y 2 toca un paso 3 que hoy funciona. Una divergencia entre la copia vieja y el helper sería un cambio silencioso en el plan por defecto, y el riesgo concreto es colapsar la asimetría entre "primer vendible en orden de km" (el default) y "el más barato" (el piso "desde"). Por eso el paso 1 exige fila invertida y empate: son las dos únicas entradas donde las dos reglas dan respuestas distintas.

El arnés del paso 4 **ya no es riesgo**: se construyó y se ejecutó antes de cerrar este plan. Cuatro iteraciones, unas 140 líneas con fixtures, 1,1 a 1,6 segundos por archivo, y el grafo de stores arranca sin app de Nuxt. Pinia real salió más barato que stores falsos, porque `trackVehicleSelection` y `trackCheckoutStarted` vienen de serie y la analítica es inerte. El coste notable es la primera instanciación de `useStoreReservationForm`, unos 0,9 s por archivo.

Queda un plan B por si acaso, sin protagonismo: montar `StepVehicle` solo, con el shell simulado por escrituras directas. Cuesta tres cosas, no una — la evidencia del orden `flush: 'sync'`, más SCEN-03 y SCEN-12, que leen el resumen y el CTA y viven por encima de `StepVehicle`. Lo que **no** es salida válida es bajar los escenarios a aserciones sobre fuente: eso es lo que hace `wizard-summary-price.test.ts`, y por eso su propia cabecera delega la evidencia viva a runtime.

Y un riesgo de tipo distinto, que este plan hereda del repo: **dos tests de la marca pasan gracias a texto de comentarios**, no a comportamiento — `reservation-wizard-steps.test.ts:124` (`haveTotalInsurance`, que en `StepCoverage.vue` solo aparece en `:6` y `:215`, ambas prosa) y `wizard-monthly-mileage.test.ts:107` (`pickPriceForDate`, reducido al docblock de `StepVehicle:227` una vez extraído). Los pasos 1, 2 y 7 tocan justo esa prosa. Están nombrados arriba con su línea; cuando alguno se ponga rojo, la pregunta correcta no es cómo devolverlo a verde sino si protegía algo o llevaba tiempo fabricando confianza.

Una limitación del arnés que conviene tener escrita: con un `useRoute` estático, el watcher de firma de query (`:240-257`) no dispara nunca, así que todo "re-buscar" de la suite es un toggle de `pending` y el invocador `:254` de `wizard.next()` no queda cubierto por nada. El argumento de "cuatro invocadores" sigue siendo correcto como razón de diseño; la cobertura ejecutable alcanza solo a `:266`.
