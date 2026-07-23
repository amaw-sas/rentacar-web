# Sede de devolución en la superficie query de `/reservas` — diseño de remediación

Issue: [#402](https://github.com/amaw-sas/rentacar-web/issues/402)
Marcas afectadas: `ui-alquicarros`, `ui-alquilame`
Fecha: 2026-07-23

## El problema, en una frase

Un enlace `/reservas?lugar_recogida=…&fecha_recogida=…&fecha_devolucion=…` **sin** `lugar_devolucion` deja la sede de devolución en `null`, y la búsqueda muere en `missing_parameters` antes de llegar a cotizar.

## Evidencia

Las cinco afirmaciones del issue se verificaron contra el código, no contra su narrativa:

| Afirmación | Archivo | Estado |
|---|---|---|
| El guard no exige `lugar_devolucion` | `useSearchByQueryParams.ts:83-89` (alquicarros) / `:58-64` (alquilame) | confirmada |
| La asignación pisa el valor con `null` | `:140` / `:78` | confirmada |
| El watcher `flush:'sync'` espeja recogida→devolución y la línea siguiente lo destruye | `useSearch.ts:231-235` | confirmada — `useSearch()` se instancia en `onMounted` antes de la asignación, así que el watcher está vivo |
| La petición corta en `missing_parameters` | `useFetchCategoriesAvailabilityData.ts:27-33` | confirmada |
| `searchBranchBySlug('')` devuelve `undefined` | `useStoreAdminData.ts:45-49` | confirmada (comparación estricta contra `slug`) |

### Cuatro hallazgos que el issue no registra

**No es un bug de una marca.** `useSearchByQueryParams.ts` existe en alquicarros y en alquilame con el mismo `?? null`. Los archivos ya divergieron en otras cosas (alquicarros tiene `reservationSearchSignature` y el guard de reuse, alquilame no), pero el defecto es idéntico. Arreglar una sola deja el bug vivo en producción de la otra.

**En alquicarros el usuario no ve «sin resultados»: lo empujan al Paso 2.** `ReservationWizard.vue:240-257` avanza el wizard con la sola presencia de `lugar_recogida`, sin mirar si la búsqueda tuvo éxito; `:264-268` avanza otra vez cuando `pending` cae. El enlace truncado deja al usuario dentro del embudo, en el paso de resultados, mirando un error de parámetros faltantes.

**El arreglo que propone el issue silencia un caso que la ruta PATH sí denuncia.** `branchDevolucion?.code ?? pickupCode` no distingue **ausente** de **inválido**. Un `lugar_devolucion=medellin-centrooo`, sea un typo o una sede dada de baja, se convierte calladamente en round-trip: el usuario pidió one-way, cotiza otra cosa y no se entera. `validateSearchParams.ts:95-122` avisa y renavega precisamente para no hacer eso.

**Hoy el enlace roto además dispara un toast falso.** Con la devolución en `null` y la recogida en `"BOG01"`, la condición `lugarRecogida.value != lugarDevolucion.value` de `useSearch.ts:180-187` es verdadera y el usuario recibe «Tarifa adicional por traslado» sobre una búsqueda que ni siquiera va a ejecutarse. La corrección lo apaga como efecto colateral.

## Qué se decidió

1. **Distinguir ausente de inválido.** Ausente cae a la recogida en silencio; inválido cae a la recogida **y avisa**.
2. **Las dos marcas, un solo PR.** Misma causa raíz, misma línea.
3. **La regla vive una vez**, como función pura en `packages/logic`, no duplicada en dos capas de marca que ya demostraron divergir.
4. **El aviso solo aparece si hubo búsqueda.** Un mensaje que describe un ajuste a una consulta que nunca corrió es ruido, no información.

## Diseño

### El helper

`packages/logic/src/utils/helpers/resolveReturnBranch.ts`

```ts
export type ReturnBranchResolution = {
  code: string | null;
  corrected: boolean; // true SOLO si vino un slug que no resolvió
};

export function resolveReturnBranch(
  slugDevolucion: string | undefined,
  returnCode: string | undefined, // el código ya resuelto: branchDevolucion?.code
  pickupCode: string | null,
): ReturnBranchResolution
```

El segundo parámetro es el **código**, no la `BranchData`. La función solo lee `.code`, y pasarle el código elimina de raíz la única precondición que un lector no podría inferir de la firma: que la sede recibida derive del slug recibido. Con dos strings no hay pareja que descuadrar.

Tabla de verdad completa:

| # | `slugDevolucion` | `returnCode` | `pickupCode` | `code` | `corrected` |
|---|---|---|---|---|---|
| 1 | falsy (ausente o `''`) | — | `P` (cualquiera, incluido `null`) | `P` | `false` |
| 2 | truthy | truthy | — | `returnCode` | `false` |
| 3 | truthy | falsy | `P` no nulo | `P` | `true` |
| 4 | truthy | falsy | `null` | `null` | `false` |

Ambos predicados son de **veracidad**, no comparaciones contra `undefined`. En la fila 1 eso hace que `?lugar_devolucion=` (vacío) cuente como ausente. En la fila 2 importa más: al estrechar el parámetro a `string | undefined` se volvió alcanzable un `returnCode` de cadena vacía, es decir una fila de sede mal configurada con `code: ''`, y una comparación contra `undefined` lo escribiría tal cual en `lugarDevolucion`. Ahí `useFetchCategoriesAvailabilityData.ts:27` lo rechazaría como `missing_parameters` **sin** toast de corrección: exactamente el fallo silencioso que este diseño existe para matar. Con veracidad, esa sede cae a la fila 3 y avisa.

La cuarta fila también es deliberada. Si la **recogida** tampoco resuelve no hay nada a lo que caer, y marcar eso como «corregido» dispararía un toast de devolución encima del toast de `missing_parameters` que `useMessages.ts:40-43` ya reformula como «Enlace de búsqueda incompleto». Dos mensajes contradictorios por un enlace basura. Con `corrected: false` el usuario ve uno solo, el correcto.

La función es pura: tres strings entran, un objeto sale. No toca el store ni Vue, así que se prueba con la tabla y sin montar nada.

### Trampa 1: la firma de reuse

En alquicarros, `reservationSearchSignature` se calcula en `:122-137` con `dropoff: branchDevolucion?.code` — **antes** de la asignación. Resolver el fallback solo en la línea 140 haría que la firma compare `undefined` contra el código ya guardado en Pinia. Nunca coincidirían, `canReuseExistingSearch` quedaría en `false` permanentemente, y volver de `/chat` re-dispararía `doSearch()`: `pending` togglea, el wizard lo lee como búsqueda nueva y **borra la categoría que el usuario eligió**. Es exactamente la regresión que ese bloque existe para prevenir.

La resolución va por tanto **arriba de la firma**, y la firma consume `resolution.code`.

### Trampa 2: `doSearch()` borra los toasts al empezar

`doSearch()` abre con `flushMessages()` (`useSearch.ts:117-118`), que es `toast.clear()`. Cualquier mensaje creado **antes** de llamarla desaparece microsegundos después. El propio `useSearch` lo respeta: todos los avisos que emite (horas extras, traslado) se crean después del flush, nunca antes.

Esto tiene una segunda cara. Como el camino de reuse hace `return` antes de `doSearch()`, un toast emitido antes del `if` sobreviviría solo cuando **no** hubo búsqueda, y moriría siempre que sí la hubo. El aviso aparecería exactamente en el caso donde menos importa.

### Trampa 3: `doSearch()` puede no buscar nada

Mover el aviso después de `doSearch()` resuelve el flush pero abre un tercer agujero. `doSearch` tiene dos salidas tempranas que vacían los toasts, emiten el suyo y regresan **sin** llamar a `search()`: fecha u hora de recogida en el pasado (`useSearch.ts:125-147`) y devolución anterior o igual a la recogida (`:154-161`).

Un enlace doblemente roto, del tipo `?lugar_devolucion=typo&fecha_recogida=<ayer>`, produciría entonces «Revisa la fecha de recogida» y encima «ajustamos la entrega a la sede de recogida». El segundo mensaje describe un ajuste sobre una consulta que nunca corrió. Es la misma clase de fallo que la fila 4 de la tabla existe para evitar.

La solución es que `doSearch` diga si buscó:

```ts
const doSearch = (): boolean => { … }   // false en las dos salidas tempranas
```

El cambio es **aditivo**. Los tres `Searcher.vue` guardan la función en `ref<(() => void) | null>` (`:507` alquicarros, `:465` alquilame, `:437` alquilatucarro) y TypeScript admite asignar `() => boolean` a `() => void`; el resto de call sites la invoca como sentencia. Ningún consumidor cambia.

Con eso, un punto de emisión único y condicionado:

```ts
const searchDispatched = canReuseExistingSearch ? false : doSearch();
if (returnBranch.corrected && searchDispatched) createMessage({ /* … */ });
```

El camino de reuse no avisa a propósito: no hubo búsqueda nueva que corregir, y el usuario ya vio el aviso cuando la búsqueda original corrió. Eso además evita apilar toasts idénticos, que duran 20 s, si vuelve de `/chat` dos veces seguidas.

### Los dos call sites

**alquicarros** — resolver antes de la firma, avisar solo si se buscó:

```ts
const pickupCode = branchRecogida?.code ?? null;
const returnBranch = resolveReturnBranch(
  slugDevolucion,
  branchDevolucion?.code,
  pickupCode,
);

const canReuseExistingSearch = /* … */ reservationSearchSignature({
  pickup: pickupCode,
  dropoff: returnBranch.code,   // resuelto, no branchDevolucion?.code
  /* … */
});

lugarRecogida.value  = pickupCode;
lugarDevolucion.value = returnBranch.code;  // pisa el watcher sync a propósito
/* … resto de asignaciones … */

const searchDispatched = canReuseExistingSearch ? false : doSearch();

if (returnBranch.corrected && searchDispatched) {
  createMessage({
    type: 'info',
    title: 'Sede de devolución no reconocida',
    message: 'No encontramos esa sede de devolución; ajustamos la entrega a la sede de recogida.',
  });
}
```

**alquilame** usa el mismo helper y la misma condición, pero el archivo tiene otra forma y el plan no debe asumir que el diff es idéntico. Ahí las asignaciones de sede ocurren en `:77-81`, **antes** del parseo de horas (`:84-92`); en alquicarros las horas se normalizan primero y todo se asigna en `:139-145`. Alquilame tampoco destructura `useStoreSearchData` ni tiene guard de reuse, así que su cierre es `const searchDispatched = doSearch();` seguido del mismo `if`.

El orden recogida→devolución no cambia en ninguna de las dos. El watcher `flush:'sync'` de `useSearch.ts:231-235` sigue espejando y la línea siguiente lo pisa con el valor resuelto, que ahora es correcto en vez de `null`.

`useMessages` está auto-importado en ambas marcas vía la capa `logic` (`imports.d.ts:56` / `:57`), así que `createMessage` se obtiene sin import explícito, igual que en `validateSearchParams`. `Message.title` es opcional (`Message.ts:3`). Todo ocurre dentro de `onMounted`, así que `useToast` nunca se toca en SSR.

### Frecuencia del aviso

`runSearchFromQuery` corre al montar y cuando cambia la firma del query; el watch compara una cadena unida de los seis parámetros de búsqueda, así que una query mala fija no re-dispara. Sumado a que el camino de reuse no emite, un enlace corrupto produce **un** toast por búsqueda realmente ejecutada. Cambiar a otra query igualmente mala produce uno nuevo, que es lo correcto.

## Lo que se rechazó

**Reescribir la URL** con `replaceState`, al estilo del `navigateTo` del middleware. En alquicarros el wizard vigila la firma del query (`ReservationWizard.vue:240-257`); reescribirla dispararía ese watcher, con riesgo de una segunda búsqueda y un salto de paso. Además `useShareSearchParams` construye el enlace compartido desde el **store**, no desde `route.query`, así que el store corregido ya se propaga solo. Riesgo sin beneficio.

**Tocar `useSearchByRouteParams.ts:44-45`**, que tiene el mismo patrón. La ruta PATH pasa por `validateSearchParams`, que corrige y renavega antes de llegar ahí. Cambiarlo sería tocar las tres marcas sin bug que arreglar.

**Endurecer el guard** exigiendo `lugar_devolucion` junto a los otros tres. No arregla el caso: el usuario compartió un enlace esperando resultados y seguiría sin ver ninguno, ahora sin siquiera un error que lo explique.

## Fuera de alcance, registrado

**El aviso del middleware PATH probablemente tampoco llega hoy.** `validateSearchParams:112-121` crea el mensaje y luego llama `navigateTo`; la página destino monta, corre `useSearchByRouteParams` → `doSearch()` → `flushMessages()`. El toast se borra por el mismo mecanismo descrito arriba. Es un defecto real y distinto, en otra superficie y las tres marcas. Va a issue de seguimiento, no aquí.

**El wizard sigue empujando al Paso 2 cuando la recogida no resuelve** (SCEN-402-04 y SCEN-402-05). El usuario aterriza en el paso de resultados con «Enlace de búsqueda incompleto» en vez de quedarse en el buscador. Este diseño no lo cambia: hacerlo exige tocar el handshake búsqueda→avance de `ReservationWizard.vue:240-268`, que es la máquina de pasos del embudo. Se acepta conscientemente.

## Alcance

Archivos que cambian:

- `packages/logic/src/utils/helpers/resolveReturnBranch.ts` — nuevo
- `packages/logic/src/utils/helpers/resolveReturnBranch.test.ts` — nuevo, co-locado (los helpers de esa carpeta no usan subcarpeta `__tests__`)
- `packages/logic/src/utils/index.ts` — re-export del helper, siguiendo el barril existente (`:90-101`), que es como las marcas lo consumen vía `@rentacar-main/logic/utils`
- `packages/logic/src/composables/useSearch.ts` — `doSearch` pasa a devolver `boolean`; cambio aditivo, sin consumidores afectados
- `packages/ui-alquicarros/app/composables/useSearchByQueryParams.ts`
- `packages/ui-alquilame/app/composables/useSearchByQueryParams.ts`
- `app/composables/__tests__/useSearchByQueryParams.test.ts` de ambas marcas — se amplían
- Un mount test nuevo por marca (ver estrategia)

Consumidores afectados:

- `ui-alquicarros`: `ReservationWizard.vue:93`
- `ui-alquilame`: `pages/reservas/index.vue:169`
- De `doSearch`: ninguno cambia, pero los tres `Searcher.vue` y `useSearchByRouteParams.ts:75` entran en el radio de verificación por el cambio de firma

Tests existentes que tocan el contrato y deben seguir verdes: `ui-alquicarros/tests/f3-citypage.test.ts`, `pages/reservas/__tests__/index.test.ts` de ambas marcas, y la suite de `useSearch` en `packages/logic`.

Sin cambios: `packages/logic/src/composables/useSearchByRouteParams.ts`, el middleware, y `ui-alquilatucarro` (no tiene superficie query).

## Escenarios observables

| ID | Given | When | Then |
|---|---|---|---|
| SCEN-402-01 | enlace con `lugar_recogida` válido, sin `lugar_devolucion` | monta `/reservas?…` | la petición sale con `returnLocation` = código de recogida; no hay `missing_parameters`; no aparece toast de corrección **ni** el falso «Tarifa adicional por traslado» |
| SCEN-402-02 | `lugar_devolucion=sede-inexistente`, recogida válida, fechas válidas | monta | la búsqueda sale con `returnLocation` = código de recogida **y** aparece el toast «Sede de devolución no reconocida», que **sobrevive** al flush de `doSearch` |
| SCEN-402-03 | `lugar_devolucion` válido y distinto de la recogida | monta | `returnLocation` = código de esa sede; sin toast de corrección; el one-way legítimo queda intacto |
| SCEN-402-04 | `lugar_recogida` irresoluble, sin `lugar_devolucion` | monta | un solo toast, el de «Enlace de búsqueda incompleto»; ninguno de corrección |
| SCEN-402-05 | `lugar_recogida` irresoluble **y** `lugar_devolucion` inválido | monta | idem 402-04: un solo toast, `corrected` es false (fila 4 de la tabla) |
| SCEN-402-06 | búsqueda viva en Pinia con categoría elegida, originada por un enlace sin `lugar_devolucion` | el shell remonta con la misma query (volver de `/chat`) | `canReuseExistingSearch` es true, no se dispara búsqueda nueva, **no** se emite toast de corrección, y la categoría del usuario sobrevive *(solo alquicarros)* |
| SCEN-402-07 | `lugar_devolucion` inválido **y** `fecha_recogida` en el pasado | monta | `doSearch` sale por su guard y devuelve false; el usuario ve «Revisa la fecha de recogida» y **ningún** toast de corrección |
| SCEN-402-08 | los casos 402-01 a 402-05 y 402-07 en alquilame | monta `/reservas` | mismo comportamiento observable que en alquicarros |

Cobertura de la tabla de verdad: fila 1 → 402-01 (y 402-04 con `pickupCode` nulo), fila 2 → 402-03, fila 3 → 402-02, fila 4 → 402-05. La cadena vacía en `returnCode` (fila 2 → fila 3 por veracidad) se cubre en el unitario del helper, no tiene escenario de UI propio porque exige una fila de sede mal configurada en el backend.

## Estrategia de satisfacción

**Unitario del helper** (`packages/logic`). Las cuatro filas de la tabla, más el slug vacío y el `returnCode` de cadena vacía. Fija el núcleo lógico de 402-01 a 402-05 sin montar nada.

**Unitario de `doSearch`** (`packages/logic`). Devuelve `false` en las dos salidas tempranas y `true` cuando llega a `search()`. Es lo que sostiene 402-07.

**Mount test por marca.** El harness existe y tiene precedente directo: `WizardSummary.mount.test.ts` (alquicarros, issue #367) y `SearcherSelectDrawer.mount.test.ts` (ambas marcas). La receta:

- `// @vitest-environment jsdom` en la primera línea, que sobreescribe el `environment: 'node'` por defecto de la config.
- `mount()` de `@vue/test-utils`, declarado en el `package.json` de las dos marcas; `vitest.config.ts` ya carga el plugin de Vue globalmente con ese propósito declarado en su comentario.
- `vi.mock('pinia', () => ({ storeToRefs: identidad }))`. No es opcional: el composable importa `storeToRefs` de verdad (`useSearchByQueryParams.ts:16`) y los stores-stub son objetos planos de refs, sobre los que el `storeToRefs` real se comporta mal. `WizardSummary.mount.test.ts:16-19` hace exactamente esto.
- `vi.stubGlobal` para los auto-imports: `useRoute`, `useStoreReservationForm`, `useStoreAdminData`, `useStoreSearchData`, `useSearch` y `useMessages`.

Como el cuerpo del composable corre dentro de `onMounted`, el test monta un componente anfitrión mínimo que lo invoca en su `setup`. Observables: los valores escritos en el store de formulario, el retorno y las llamadas de `doSearch`, y las llamadas a `createMessage` con su copia. Cubre 402-01 a 402-05, 402-07 y 402-08.

**Test de orden de emisión.** El stub de `doSearch` registra el orden relativo de sus llamadas frente a `createMessage`, y el test afirma que **ningún** `createMessage` precede a `doSearch` —no solo el de corrección—, de modo que la guarda cubra también avisos futuros. Es el que fija la trampa 2, y sin él la regresión es invisible: el código «se ve bien».

**Test de la firma de reuse (alquicarros).** Sembrar una búsqueda viva con categoría seleccionada, remontar con la misma query sin `lugar_devolucion`, verificar que `doSearch` no se llama y que no se emite toast. Cubre 402-06 y es el que impide que la corrección reintroduzca el borrado de categoría.

**Runtime.** `/agent-browser` sobre el dev server del worktree para 402-01 y 402-02: observar la petición a `/api/reservations/availability` con el `returnLocation` correcto, el toast presente o ausente según el caso y **visible en el DOM tras completarse la búsqueda**, cero errores de consola y cero peticiones fallidas. Ningún test unitario puede demostrar que el watcher `flush:'sync'` no reintroduce el `null` ni que el toast sobrevive al flush en un navegador real.

**Cierre.** `/verification-before-completion` con evidencia fresca, y el gate de cuatro agentes (code-reviewer, security-reviewer, edge-case-detector, performance-engineer) antes del PR.

## Riesgos

**Un one-way legítimo con slug correcto se convierte en round-trip.** Mitigado por SCEN-402-03: solo caemos al fallback cuando el slug no resuelve contra `sortedBranches`.

**El cambio de firma de `doSearch` toca `packages/logic`, que sirve a las tres marcas.** Es aditivo y ningún call site lee el retorno hoy, pero la suite de `useSearch` y las tres marcas entran en el radio de verificación. El typecheck por marca es la evidencia, comparada contra el baseline rojo conocido, no contra «verde».

**El store de sedes aún no está poblado al montar.** Se planteó como riesgo de toast espurio, pero el propio diseño lo neutraliza: con `sortedBranches` vacío la recogida tampoco resuelve, `pickupCode` es `null`, y la fila 4 devuelve `corrected: false`. No hay aviso falso. SCEN-402-05 es exactamente ese caso, así que queda fijado por test en vez de por argumento.

**Un cambio escalonado en analítica.** `trackAnalyticsEvent('rental_search', …)` (`useSearch.ts:199-212`) hoy omite `return_branch` en estos enlaces porque la sede es `null`; tras la corrección empezará a emitirlo. El volumen de `rental_search` con `return_branch` subirá sin que nadie cambie nada de tracking. Conviene avisarlo antes del despliegue para que no se lea como una anomalía de datos.

**Divergencia futura entre marcas.** El helper compartido reduce la superficie, pero los dos composables siguen siendo archivos separados. El test de cada marca fija su contrato por separado.
