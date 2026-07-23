# Continuidad de datos en el wizard de alquicarros — diseño

Issue: [#368](https://github.com/amaw-sas/rentacar-web/issues/368) · Epic [#372](https://github.com/amaw-sas/rentacar-web/issues/372) · Fecha: 2026-07-23

## El problema, en una frase

El wizard descarta decisiones que el usuario ya tomó, y no dice ni cuándo ni por qué.

## Alcance: por qué esto no cubre el issue entero

#368 agrupa ocho hallazgos repartidos por cuatro superficies distintas: el wizard, el formulario del paso 5, la página de confirmación y una lista de pulidos. Salen unos veinte cambios discretos. Un solo spec para todo eso no se sostiene. La descomposición acordada:

| Sub-proyecto | Hallazgos | Estado |
|---|---|---|
| **B — continuidad de datos** | 2, 3 | **este documento** |
| C — formulario y envío | 4, 5, 6, 7 | pendiente |
| A — confirmación | 1 + confeti | pendiente |
| D — pulido de pasos 2-4 | 8 | pendiente |

B va primero porque es el único grupo que destruye trabajo ya hecho por el usuario. Los otros tres degradan la experiencia. Este le borra elecciones.

### Una advertencia para quien tome A

El hallazgo #1 propone "recapitular la reserva" en `/reservado/[reserveCode]`. Eso choca con una decisión de seguridad deliberada. El docstring de `packages/logic/src/composables/useReservationConfirmation.ts` lo dice sin ambigüedad:

> "The API response intentionally contains only an existence boolean; reservation data never reaches the browser or the Nuxt payload."

Esa URL es un identificador tipo bearer. Servir el detalle de la reserva desde el servidor reabre justo la exposición que ese endpoint cerró a propósito. El recap solo puede salir del store del cliente, en sesión; al recargar o abrir el enlace desde el correo no habrá nada que mostrar.

Lo que sí funciona siempre es lo demás: enlaces reales de WhatsApp y correo, checklist de requisitos, copiar el código. Ahí está el valor de ese hallazgo. Que A no se planee suponiendo lo contrario.

## Dos afirmaciones del issue que el código no respalda

Conviene separar lo que está roto de lo que solo lo parece.

**"Volver al paso 1 borra la selección."** No. El watcher que borra (`ReservationWizard.vue:164-169`) está gateado por la transición `pending` false→true, o sea por arrancar una búsqueda nueva, no por navegar al paso 1. Volver por el stepper y regresar no pierde nada.

Y el borrado, cuando ocurre, es correcto. `useCategory` congela los precios en refs al construirse, así que conservar la gama a través de una búsqueda con fechas distintas dejaría el sidebar y el payload con la cotización vieja. Ese es literalmente el bug #373, que costó un PR arreglar. El defecto no es que borre: es que no avisa. Quitar el reset sería una regresión.

**"La pista de volver atrás solo existe en desktop."** El stepper móvil tiene botón "Atrás" y puntos de progreso navegables (`WizardStepper.vue:47-82`). Lo que falta en móvil es la frase explicativa del resumen (`WizardSummary.vue:63-65`), que vive solo en el `<aside>` de desktop. Hallazgo real, bastante menor de lo que sugiere el texto, y encaja mejor en D.

## Lo que sí está roto

Tres cosas. Y una cuarta que el issue no vio.

Cambiar de gama pierde el Seguro Total, el plan de kilometraje y los adicionales. `onSelect` (`StepVehicle.vue:338-346`) hace `selectedCategory.value = cat`, y `cat` es una instancia nueva de `useCategory` con los cinco flags en su default (`useCategory.ts:72-76`). Lo irónico es que el código ya previene el re-tap de la misma gama, con un comentario que nombra la pérdida de datos por su nombre. El cambio real la produce igual.

El reset por búsqueda nueva es silencioso. El usuario ajusta una fecha, vuelve a buscar, y su vehículo desapareció. Ni una línea que lo explique.

El botón atrás del navegador sale del wizard. `ReservationWizard.vue:275-285` usa `replaceState`, y su propio comentario lo admite: "el back del navegador NO recorre pasos (sale de /reservas)". En móvil el gesto atrás es el patrón dominante. Un swipe descuidado en el paso 5 tira la sesión entera.

### El cuarto, que salió mirando el arrastre

`useCategory.withMileage` arranca siempre en `"1k_kms"` (`useCategory.ts:73`). Si una gama no vende ese plan, el precio calculado es 0.

El único guardián que corrige eso vive dentro de `StepCoverage` (`:203-211`), así que solo corre si ese paso está montado. Y con `maxReachedStep` ya en 5, se puede cambiar de gama en el paso 2 y saltar por el stepper directo a "Datos" sin montarlo nunca. Misma familia que el bug de mensualidad de la PR #308.

No lo arreglo por separado. Validar el plan de kilometraje en el punto de cambio, que es justo lo que hace falta para el arrastre, lo cierra de paso.

## Decisiones

**El Seguro Total se arrastra, y se avisa.** El usuario lo eligió deliberadamente; perderlo por comparar carros es justo el defecto que reporta el issue. Si la gama nueva no lo cotiza, se cae y se dice en pantalla. La alternativa, volver a Básico en cada cambio, repite la fricción en la acción más frecuente del paso 2.

**El aviso del reset es posterior y no bloqueante.** Interceptar la búsqueda exigiría un guard de ruta sobre un `NuxtLink` para frenar una acción legítima. Se deja que el reset ocurra y se explica: cambiaron las fechas, los precios se recalcularon, hay que elegir otra vez.

**El historial gana una entrada por paso.** Con su costo aceptado: salir de resultados pasa a exigir varios "atrás" en vez de uno.

**`useCategory` no se toca.** Sacar los cinco flags de la instancia al store del wizard sería más limpio en abstracto, pero ese composable vive en `packages/logic` y lo consumen las tres marcas. Un problema de alquicarros no justifica mover el suelo bajo el flujo de reserva de alquilatucarro y alquilame. Los flags se leen y escriben por la API de refs que ya expone (`useCategory.ts:445-475`).

## Diseño

Tres piezas independientes, un PR.

### 1. `carrySelection`, función pura

Vive en `app/composables/useSelectionCarryOver.ts` y sigue la forma de `useReservationWizard.ts`: núcleo puro exportado más envoltorio, testeable sin Nuxt.

```ts
carrySelection(prev: SelectionFlags | null, ctx: CarryContext): CarryResult
// ctx:    { monthly, canQuoteTotal, sellablePlans }
// result: { flags, dropped: ('seguroTotal' | 'kilometraje')[] }
```

| Flag | Regla |
|---|---|
| `withTotalCoverage` | Sobrevive solo si la gama nueva lo cotiza (`canQuoteTotalCoverage`). Si no, cae a `false` y entra en `dropped` |
| `withMileage` | Solo relevante en mensual. Sobrevive si esa gama vende ese plan; si no, cae al vendible más barato y entra en `dropped` |
| `withExtraDriver`, `withBabySeat`, `withWash` | Siempre sobreviven |

Con `prev === null` devuelve los defaults y `dropped` vacío. No hay nada que arrastrar ni que anunciar.

`onSelect` queda así: capturar los flags previos, reasignar `selectedCategory`, aplicar el resultado sobre la instancia nueva, publicar el aviso. El guard de re-tap se mantiene intacto.

### 2. `useWizardNotice()`, una sola nota

Dos escritores y un renderizador. Escriben el shell, cuando el reset descarta algo, y `StepVehicle`, cuando el arrastre pierde algo. Renderiza un banner `role="status"` sobre los tiles del paso 2.

```ts
type WizardNotice =
  | { kind: 'search-reset' }
  | { kind: 'carry'; dropped: CarryDropped[] }
  | null
```

Inline, no toast: es una explicación, no una notificación efímera. Se limpia al elegir vehículo o al avanzar de paso. Respaldado por `useState`, que es SSR-seguro aunque el flujo sea puramente de cliente. El `role="status"` sigue la convención que ya usa `ChatConversation.vue:176`.

### 3. Historial por paso

Reemplaza el watcher de `?paso=` (`ReservationWizard.vue:275-285`). Una sola invariante, sin contador de profundidad que se pueda desincronizar:

> `push` cuando el cambio de paso se origina en la página (Continuar, stepper).
> `replace` cuando es consecuencia de una URL que ya entró al historial.

Tres transiciones caen del lado `replace`: el avance por firma de query tras la búsqueda (`:240-257`), el avance por `pending` true→false (`:264-268`) y el rebote de la red de seguridad de deep-links (`:339-349`).

Ese detalle evita un defecto sutil. El Searcher es un `NuxtLink`, así que su submit ya crea una entrada de historial. Si el avance al paso 2 empujara otra, salir de resultados costaría dos "atrás" en vez de uno, y el primero no haría nada visible. Si esa misma entrada se reescribe, el comportamiento queda limpio.

`popstate` reconcilia leyendo `?paso=` de la URL que el navegador ya retrocedió, no llevando su propia cuenta. Así aguanta que el navegador colapse varios eventos en uno. Un contador de máscara evita que el watcher de paso reescriba lo que el navegador acaba de cambiar.

Nada de esto se inventa aquí. Es el patrón que `CategorySelectionSection.vue:515-545` y `:682-709` ya usan para el slideover de alquilatucarro, custodiado por `e2e/reservation-back-returns-to-listing.spec.ts`. Se porta a `?paso=`.

La parte pura, decidir la URL destino a partir del `href` actual y un paso, va en `useReservationWizard.ts`. Ese archivo ya es la frontera paso↔ruta (`deriveStepFromRoute`) y su núcleo puro ya se prueba sin Nuxt en `packages/ui-alquicarros/tests/reservation-wizard-machine.test.ts`, que es donde entra el helper nuevo.

## Manejo de error

| Caso | Comportamiento |
|---|---|
| `?paso=` ausente | Paso 1, que es lo que el sync escribe para `busqueda` |
| `?paso=` con valor inválido | No mover el paso; reescribir la URL al paso real |
| `goTo` rechaza el paso (por encima de `maxReachedStep`) | No mover; reescribir la URL al paso real |
| `prev === null` al cambiar de gama | Sin arrastre y sin aviso |
| SSR | Todo el bloque de historial gateado por `import.meta.client`, como hoy |

El tercer caso es el que cierra la divergencia URL↔estado. Se alcanza con el botón *adelante* del navegador después de que la red de seguridad rebotó un deep-link caducado: la URL pide "datos", `maxReachedStep` bajó a 2, y sin reescritura la barra de direcciones mentiría sobre dónde está el usuario.

## Fuera de alcance

Las city pages (`externalSearch=true`) no montan el bloque de historial. Su URL es por path y el Searcher lo provee `CityHero`. B3 aplica a `/reservas?query` y a `/reservas/lugar-recogida/…`, que llegan ambos con `externalSearch=false`, porque el `pickup` computado ya lee query y params. Las city pages quedan como están, deliberadamente.

## Radio de impacto

| Archivo | Cambio |
|---|---|
| `app/components/wizard/steps/StepVehicle.vue` | `onSelect` arrastra flags; renderiza el banner |
| `app/components/wizard/ReservationWizard.vue` | Historial push/replace + `popstate`; marca el reset |
| `app/composables/useSelectionCarryOver.ts` | Nuevo |
| `app/composables/useWizardNotice.ts` | Nuevo |
| `app/composables/useReservationWizard.ts` | Helper puro de URL destino |

Todo bajo `packages/ui-alquicarros`, sin consumidores fuera de la marca. `packages/logic` no se modifica, así que alquilatucarro y alquilame no se ven afectados. Ningún documento existente queda desactualizado: la auditoría que originó el issue es un registro histórico.

## Pruebas

| Nivel | Qué prueba |
|---|---|
| Unit puro | `carrySelection` por tabla: arrastra todo / cae Seguro Total no cotizable / corrige kilometraje al vendible más barato / `prev = null` |
| Unit puro | Decisión de URL destino: push contra replace |
| Mount jsdom | Cambiar de gama conserva los flags en la instancia nueva y pinta el aviso; el re-tap sigue siendo no-op |
| Mount jsdom | Espía sobre `history.pushState`/`replaceState`: el handshake de búsqueda hace 1 replace y 0 push; "Continuar" hace 1 push |
| e2e Playwright | Atrás recorre pasos en `/reservas` |

Los mount tests siguen el precedente de `wizard-summary-price.test.ts`, que obtuvo evidencia de DOM en jsdom sin levantar navegador. El e2e depende del backend de disponibilidad y usa la convención de skip ya establecida (`e2e/reservation-back-url-cleanup.spec.ts:51`).

## Riesgos

El que más preocupa no es de diseño sino de CI. Un spec e2e nuevo puede quedar sin recolectar y dar verde en falso, porque el filtro por nombre de archivo de Playwright corre antes de la recolección. Es el fallo que documenta #374. Se verifica con `--list` por marca antes de dar nada por verde.

Salir de resultados va a costar más. Con una entrada por paso, abandonar el wizard desde "Datos" exige cuatro "atrás". Es la consecuencia aceptada de la decisión, no un efecto imprevisto. Si la analítica muestra abandono por esa vía, la salida es un botón explícito de "salir de la reserva", no volver a `replaceState`.

Y el total puede subir sin que nadie lo pida: arrastrar el Seguro Total a una gama más cara mueve el precio. El sidebar lo refleja al instante y el banner lo nombra, pero sigue siendo un movimiento no solicitado. Se acepta conscientemente. La alternativa perdía la elección del usuario.

## Escenarios observables

Puente hacia scenario-driven-development. Cada decisión del diseño tiene al menos uno.

**SCEN-368B-01 — el Seguro Total sobrevive al cambio de gama.**
*Dado* el paso 2 con una gama elegida y Seguro Total activo, *cuando* el usuario elige otra gama que sí cotiza Total, *entonces* la instancia nueva queda con `withTotalCoverage` en true, el resumen sigue diciendo "Seguro Total" y el total refleja el precio de la gama nueva.

**SCEN-368B-02 — el Seguro Total que no se puede cotizar cae y se anuncia.**
*Dado* lo mismo, *cuando* la gama nueva no cotiza Total (`canQuoteTotalCoverage` false), *entonces* queda en Básico y aparece un banner `role="status"` que nombra la pérdida.

**SCEN-368B-03 — el plan de kilometraje se corrige sin montar StepCoverage.**
*Dado* una reserva mensual con plan de 2.000 km, *cuando* el usuario cambia a una gama que solo vende 1.000 km y salta por el stepper directo a "Datos", *entonces* `withMileage` es `1k_kms` y el total es mayor que cero.

**SCEN-368B-04 — los adicionales sobreviven siempre.**
*Dado* el paso 2 con conductor adicional y lavado marcados, *cuando* el usuario cambia de gama, *entonces* ambos flags siguen activos y el resumen los lista.

**SCEN-368B-05 — el re-tap de la misma gama sigue sin efecto.**
*Dado* una gama ya elegida con Seguro Total, *cuando* el usuario toca esa misma card, *entonces* no se construye instancia nueva, no aparece banner y nada cambia.

**SCEN-368B-06 — el reset por búsqueda nueva se explica.**
*Dado* el paso 2 con vehículo elegido, *cuando* el usuario cambia una fecha y vuelve a buscar, *entonces* la selección se descarta y aparece un banner que dice que los precios se recalcularon y hay que elegir de nuevo.

**SCEN-368B-07 — sin selección previa no hay ruido.**
*Dado* el paso 2 sin vehículo elegido, *cuando* el usuario vuelve a buscar, *entonces* no aparece ningún banner.

**SCEN-368B-08 — atrás recorre pasos.**
*Dado* un usuario en el paso 4 tras avanzar desde el 2, *cuando* pulsa atrás, *entonces* queda en el paso 3, la URL dice `?paso=seguro` y las selecciones se conservan.

**SCEN-368B-09 — la búsqueda no cuesta dos "atrás".**
*Dado* `/reservas` limpio, *cuando* el usuario busca, llega al paso 2 y pulsa atrás una vez, *entonces* vuelve al `/reservas` previo a la búsqueda. La entrada del handshake se reescribe, no se apila.

**SCEN-368B-10 — la URL nunca miente sobre el paso.**
*Dado* un deep-link `?paso=datos` sin gama elegida que la red de seguridad rebota al paso 2, *cuando* el usuario pulsa adelante, *entonces* sigue en el paso 2 y la URL dice `?paso=vehiculo`.

**SCEN-368B-11 — las city pages no cambian.**
*Dado* una página de ciudad en modo resultados, *cuando* el usuario avanza de paso, *entonces* no se escriben entradas de historial y la URL por path queda intacta.
