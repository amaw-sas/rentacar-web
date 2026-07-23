# "Confirmar reserva" deja de nacer muerto (issue #366)

Epic #372, auditoría UI/UX de alquicarros previa a producción.

El CTA que cierra el embudo del wizard arranca deshabilitado y nada en pantalla dice
por qué. En el peor caso se queda deshabilitado para siempre y la única explicación
fue un toast que ya se desvaneció.

## Qué está pasando

`wizard/WizardSummary.vue:174` apaga el botón por tres razones distintas:

```js
const ctaDisabled = computed(() => !props.canAdvance || isSubmittingForm.value || formSubmitLocked.value)
```

Las tres se ven igual en pantalla: un botón gris. Pero son cosas distintas y ninguna se
explica.

**`!canAdvance` en el paso 5.** `ReservationWizard.vue:362` lo define como
`formValid: Boolean(politicaPrivacidad.value)`: el único requisito es la casilla de
consentimiento, que vive al final de un formulario largo. `steps/StepData.vue` renderiza
el header y `<ReservationForm>`, sin una línea de ayuda.

**`isSubmittingForm`.** Durante el round-trip de registro el botón queda gris con el
mismo texto "Confirmar reserva". Sin señal de progreso, en el momento de más ansiedad
del flujo, un botón que no responde se lee como roto.

**`formSubmitLocked`.** `useStoreReservationForm.ts:349-357`: ante un estado desconocido
del servidor el store levanta el lock y dispara un toast de 25 segundos. Ningún componente
del wizard renderiza ese estado. Cuando el toast se va, queda un botón muerto permanente
sin ninguna pista de qué pasó ni de que existe un código de reserva que conservar.

## El hallazgo que reordena el issue

La marca hermana ya resolvió esto y el wizard divergió. En
`ui-alquilatucarro/CategorySelectionSection.vue:240` el CTA se apaga solo por
`isSubmittingForm || formSubmitLocked`. Sin consentimiento el botón **se pulsa**, valibot
marca la casilla con "Debe aceptar las políticas de privacidad" y no sale ningún POST. Eso
es lo que asserta `e2e/reservation-privacy-consent.spec.ts` (SCEN-311-02) **para
alquilatucarro** — ese spec está en `BUSCAR_VEHICULOS_FLOW_SPECS` y `playwright.config.ts`
lo excluye cuando `BRAND` es alquicarros.

El wizard de alquicarros añadió `!canAdvance` encima de esa validación. El gate no protege
nada que valibot no proteja ya; solo produce el botón mudo.

Además cubre un solo campo de los siete del schema: nombres, apellidos, identificación,
correo y teléfono vacíos **no** apagan el CTA. Se pulsa, valibot los marca, no hay envío.
El consentimiento era la excepción arbitraria.

## Decisiones

### D1 — El consentimiento sale del gate del CTA

`useReservationWizard.canAdvance` pasa a `case 'datos': return true`, y `formValid`
desaparece de `WizardAdvanceState`. El paso "datos" es terminal: se verificó que
`canAdvance('datos')` no gobierna ninguna transición de la máquina. `onNext`
(`ReservationWizard.vue:378-387`) retorna antes en `'datos'`, `WizardStepper` se gobierna
por `maxReachedStep`, y la red de seguridad de deep-links (`ReservationWizard.vue:336-349`)
usa `hasUsableCategory`, no `canAdvance`. El único consumidor es el `:disabled` del sidebar.

Al pulsar, `ReservationForm.submit()` valida el schema completo y solo emite `@submit` si
pasa.

**`ctaDisabled` (`WizardSummary.vue:174`) no se toca.** Es el gate de los cinco pasos, no
solo del quinto: quitarle `!props.canAdvance` volvería pulsable también el CTA del paso 2 y
rompería el fail-closed de #313 —`e2e/pricing-horizon-alquicarros.spec.ts:81` y `:102`
asertan `toBeDisabled()` con una gama más allá del horizonte de tarifas—, además de
contradecir la exclusión del paso 2 que este mismo documento declara. Cambiando solo
`canAdvance('datos')`, la prop `canAdvance` llega ya `true` en el paso 5 y el resto de pasos
conserva su gate intacto. Ninguna de esas dos suites corre en el CI de alquicarros
(`ci.yml:206-207`), así que la rotura no habría aparecido hasta ejecutar la suite completa.

Dejar `formValid: true` alimentando un campo que ya no decide nada sería código muerto
disfrazado de gate. Se borra el concepto. Efecto colateral: `politicaPrivacidad` queda sin
uso en el `storeToRefs` de `ReservationWizard.vue:106` y hay que quitarlo o el typecheck lo
marca.

La validez del formulario tenía dos fuentes de verdad (valibot y este boolean) y solo una
podía bloquear el envío de verdad. Queda esa.

Es refactor sin escenario de usuario propio: su evidencia es el test unitario de la máquina.

### D2 — El envío se ve

Los **dos** CTAs de `WizardSummary` (`wizard-continue-desktop-test (:58)` y
`wizard-continue-mobile-test (:128)`) reciben `:loading="isSubmittingForm"` y el label
"Confirmando…".

`@nuxt/ui` 4.2.1 `Button.vue:118` hace `:disabled="disabled || isLoading"`, así que
`loading` ya deshabilita por sí solo. El `:disabled` se mantiene igualmente porque
`formSubmitLocked` no lo cubre. Es el patrón que ya usan las tres marcas
(`ui-alquilame/Searcher.vue:365`, `ui-alquilatucarro/CategorySelectionSection.vue:239-240`).

### D3 — El bloqueo por estado desconocido deja de ser un toast fugaz

Bloque persistente con `role="alert"` en `StepData`, bajo `v-if="formSubmitLocked"`: qué
pasó, la advertencia de no reenviar, el código de reserva si el servidor lo devolvió, y el
WhatsApp de contacto.

Es contenido **nuevo**, no reubicado. `useMessages.ts:150-152` construye el `codeHint` de
forma excluyente: si hay código, el toast no menciona WhatsApp; si no lo hay, no hay código.
El bloque muestra ambos, que es lo que el usuario necesita para reclamar.

Sin botón de reintento. El lock existe porque puede haber una reserva creada que la web no
llegó a ver; ofrecer "reintentar" invita justo a la duplicación que el lock previene. La
salida es humana, por WhatsApp, con el código en la mano.

### D4 — El código de reserva sobrevive al toast

`dataRecord.value.reserveCode` es hoy local a `submitForm`: se pasa al toast y se pierde.
Se añade un ref `unknownStatusReserveCode` en `packages/logic/.../useStoreReservationForm.ts`
declarado junto a `formSubmitLocked` (línea 140), asignado en la misma rama que levanta el
lock (línea 351) y exportado con él (línea 417). Y se limpia en `useStoreSearchData.ts:81`,
junto al reset del lock (ver D7).

Sigue siendo aditivo en comportamiento: alquilame y alquilatucarro no lo leen. Los tests del
store son de nivel-fuente sobre el bloque `submitForm`
(`useStoreReservationForm.honestErrors.test.ts:14-19,43-60`); una asignación más tras la
línea 351 no rompe sus regex, y su único aserto posicional (`:66-71`) ancla en
`indexOf('// SCEN-322-E03')`, que sigue existiendo. Ningún test enumera la superficie
exportada del store. Sin este ref, D3 pierde el dato que hace accionable el mensaje.

### D5 — El contacto sale de `app.config`, no de un literal nuevo

`steps/StepVehicle.vue:195` hardcodea `{ phone: '3187703670', display: '318 770 3670' }`,
consumido por **dos** anclas del propio archivo (`:38-43` y `:103-108`). D3 necesita el
mismo dato. En vez de crear un módulo nuevo o pegar una tercera copia, ambos pasos consumen
`useAppConfig().franchise` (`app.config.ts:49-50`: `phone` y `whatsapp`), que es el patrón
que `app/error.vue:76` ya usa en esta misma marca.

El `href` no cambia de destino: hoy resuelve `https://wa.me/573187703670` y
`franchise.whatsapp` es esa misma cadena. El texto visible sí cambia, de "318 770 3670" a
"+57 318 770 3670", en los dos sitios. Se acepta: el prefijo país es correcto y ningún test
ni e2e asserta ese texto (verificado con barrido de `318 770 3670` y `573187703670` sobre
`e2e/` y `packages/*/tests`).

Eso reescribe `tests/contact-number.test.ts:52-55`, que hoy exige el literal dentro de
`StepVehicle.vue`. El aserto pasa a la forma que el propio archivo ya usa para `error.vue`:
el componente referencia `franchise.whatsapp` y **no** contiene ningún `wa.me/<dígitos>`.
El test se vuelve más estricto, no más laxo.

**Deuda declarada, no resuelta aquí:** la fuente de verdad última de los números es Supabase
`franchises`; `app.config` es el espejo en-marca. Alinear ambos es un cambio de origen de
datos con su propio blast radius. Follow-up aparte.

### D6 — El error de validación se ve y se anuncia

Sin esto, D1 cambia un botón gris mudo por un click sin efecto visible, que es el mismo
defecto con otra cara.

`@nuxt/ui` 4.2.1 `Form.vue:149-167` captura la `FormValidationException` y solo emite
`@error`: no hace scroll ni mueve el foco. El consentimiento es el último campo del
formulario (`ReservationForm.vue:95-122`), el CTA vive en un `aside sticky` en desktop y en
una barra `fixed bottom-0` en móvil, y `ReservationWizard.vue:223-228` hace
`scrollTo({top: 0})` al entrar al paso. Resultado: el usuario pulsa arriba y el error nace
fuera de pantalla.

`ReservationForm` cablea `@error` para llevar el primer campo inválido al viewport y darle
foco. La cadena está verificada: `Form.vue:93-98` adjunta a cada error el `id` del control
(`FormErrorWithId`, `types/form.d.ts:33-43`), `FormField.vue:35,38-43` genera ese id y lo
provee, `Checkbox.vue:38-39,60` lo aplica al `CheckboxRoot`, y reka-ui lo renderiza como
`<button type="button" role="checkbox" id="…">` — nativamente enfocable. Así que
`document.getElementById(err.id)` más `scrollIntoView` + `focus({preventScroll: true})`
basta.

Con una excepción que hay que manejar: **`telefono`**. `VueTelInput` no usa `useFormField`
(la desconexión está documentada en `ReservationForm.vue:74-77`), así que el id que viaja en
el evento no corresponde a ningún elemento del DOM y `getElementById` devuelve `null`.
Fallback: cuando `err.name === 'telefono'`, buscar `#telefono`, que es determinista
(`packages/logic/src/composables/usePhoneField.ts:34` lo fija como `id: "telefono"` y `:51` ya lo resuelve así). Sin este caso el scroll falla en
silencio justo en el campo más frágil del formulario.

El handler va **nombrado**, no como arrow inline en la plantilla:
`ReservationForm.test.ts:11` captura el tag de apertura con `/<u-form\b[\s\S]*?>/`, que
corta en el primer `>`; una `=>` dentro del tag truncaría el match y tumbaría su aserto de
`class="light"`.

Esto además resuelve el silencio para lectores de pantalla: hoy un submit fallido no anuncia
nada.

### D7 — El lock vive lo que dura la búsqueda, y el código nuevo se limpia con él

`formSubmitLocked` **sí** se resetea, y en un sitio que importa:
`useStoreSearchData.ts:81`, dentro de `search()`, con el comentario *"Nueva búsqueda =
nueva reserva potencial: desbloquear submit consumido (E03)"*. En alquicarros hay tres
entradas de producción que convergen ahí, todas vía `useSearch.ts:213`:
`useSearchByQueryParams.ts:148` (la superficie `?query`), `useSearchByRouteParams.ts:75`
(la superficie PATH, que es la que monta `reservas/Results.vue:34` cuando el Searcher
navega) y `Searcher.vue:518` (el re-fire de misma URL de #129). El camino normal de entrada
al wizard baja el lock.

No lo baja en dos ramas: `useSearchByQueryParams.ts:147` retorna temprano si
`canReuseExistingSearch`, y `useSearch.ts:145,159` cortan antes de `search()` ante fecha
pasada o rango invertido. Volver a la misma búsqueda conserva el bloque, que es justo lo
deseable: mismo intento, mismo aviso.

Se respeta esa decisión de #322 tal cual. El bloque de D3 aparece con el lock y desaparece
con la siguiente búsqueda distinta, así que su copy puede hablar del intento recién hecho.

Lo que sí falta: **`unknownStatusReserveCode` (D4) debe limpiarse en ese mismo punto**. Si
no, una búsqueda nueva baja el lock pero deja el código de la reserva anterior colgado en
el store, listo para reaparecer en el próximo estado desconocido con un identificador que
no corresponde. Eso convierte a D4 en dos archivos de `packages/logic`, no en un ref
aislado.

## El holdout de #311 codifica el mecanismo, no el invariante

`docs/specs/2026-07-16-issue-311-consentimiento-datos/scenarios/consentimiento-datos-pre-marcado.scenarios.md:48`
dice, para SCEN-311-03:

> el CTA está deshabilitado; al marcar la casilla el CTA se habilita
> **Evidence**: atributo `disabled` del botón del sidebar antes/después de marcar

`e2e/alquicarros-reservation-wizard.spec.ts:225-227` lo asserta. Ese escenario describe
*cómo* se impedía el envío, no *qué* se exige.

Lo que la Ley 1581/2012 exige —y lo que SCEN-311-02 asserta para la marca hermana— es que
sin consentimiento expreso no haya registro. La enmienda mantiene ese invariante y lo
verifica mejor: hoy el wizard comprueba un atributo del DOM; después comprobará que el
endpoint de registro no recibe nada. Un atributo `disabled` puede estar presente y aun así
haber un POST por otra vía; cero requests no admite esa lectura.

La enmienda pasa por el protocolo de amend con la evidencia de esta sección.

## Dónde aterrizan los escenarios

`.github/workflows/ci.yml:206-207` corre para alquicarros únicamente
`alquicarros-reserva-mensual.spec.ts` y `alquicarros-reservation-wizard.spec.ts`. Un spec
nuevo no se ejecutaría en CI, así que SCEN-366-01..05 van **dentro de
`alquicarros-reservation-wizard.spec.ts`**.

### SCEN-366-01: el CTA nace pulsable

**Given**: el paso 5 recién cargado, casilla de consentimiento sin marcar.
**When**: el usuario mira el CTA "Confirmar reserva".
**Then**: el botón no tiene el atributo `disabled`.
**Evidence**: `toBeEnabled()` sobre `wizard-continue-desktop-test` en el primer render del
paso 5. (Sin `href`, `UButton` renderiza un `<button>` real; `aria-disabled` solo aparece en
la rama link, así que no se asserta.)

### SCEN-366-02: pulsar sin consentimiento explica, enfoca y no registra

**Given**: paso 5 con todos los datos personales válidos y la casilla sin marcar.
**When**: el usuario pulsa "Confirmar reserva".
**Then**: aparece "Debe aceptar las políticas de privacidad" junto a la casilla, la casilla
queda dentro del viewport y con el foco, la URL no cambia y **no hay ningún request** a
`/api/reservations/record`.
**Evidence**: texto del error en el DOM, `boundingBox` de la casilla contra el viewport,
`toBeFocused()` sobre `privacy-consent-checkbox-test` (ese `data-testid` aterriza en el
mismo `<button role="checkbox">` que recibe el foco: `Checkbox.vue:13,61` con
`inheritAttrs: false`), y contador de requests al endpoint de registro (patrón de
`reservation-privacy-consent.spec.ts:116-120`).

### SCEN-366-03: con consentimiento la reserva procede (regresión SCEN-311-04)

**Given**: el estado de SCEN-366-02 con la casilla ya marcada.
**When**: el usuario pulsa "Confirmar reserva".
**Then**: navega a `/reservado/[code]`.
**Evidence**: URL final tras el submit.

### SCEN-366-04: el envío en vuelo se anuncia y no se duplica

**Given**: un submit válido en curso, con el stub de `/api/reservations/record` demorado
(patrón `setTimeout(700)` de `alquicarros-reservation-wizard.spec.ts:69-76`).
**When**: el usuario mira el CTA y lo pulsa una segunda vez.
**Then**: el botón muestra estado de carga con el label "Confirmando…" y el endpoint de
registro recibe **exactamente un** request.
**Evidence**: `toHaveText(/Confirmando/)`, presencia de
`[data-testid="wizard-continue-desktop-test"] [data-slot="leadingIcon"]` (el spinner:
`Button.vue:134` con la variante `animate-spin` de `.nuxt/ui/button.ts:358-361` — **no**
existe ningún `data-loading` en el DOM), `toBeDisabled()`, y contador de requests. El
segundo click necesita `force: true`: el botón está deshabilitado y el actionability check
de Playwright colgaría hasta `actionTimeout` (20 s).

### SCEN-366-05: el estado desconocido queda explicado en pantalla

**Given**: `/api/reservations/record` stubeado con
`{reservationStatus: 'desconocido', reserveCode: 'E2ECODE'}` (200, JSON), que es la forma
exacta que lleva a `routeForReservationStatus → null` y levanta el lock.
**When**: el submit termina.
**Then**: hay un bloque `role="alert"` visible con el aviso de no reenviar, el código
`E2ECODE` y el WhatsApp de contacto; el CTA sigue deshabilitado.
**Evidence**: presencia y contenido del bloque, atributo `disabled` del botón. El bloque se
asserta como independiente del toast (no se esperan los 25 s de vida del toast).

### SCEN-366-06: el contacto del wizard sigue siendo el de alquicarros

**Given**: los pasos "Vehículo" y "Datos" tras mover el contacto a `app.config`.
**When**: se inspecciona el enlace de WhatsApp de cada uno.
**Then**: apunta a `franchise.whatsapp` y ningún componente del wizard contiene un literal
`wa.me/<dígitos>`.
**Evidence**: test de nivel-fuente en `tests/contact-number.test.ts`, misma forma que el
aserto ya existente para `error.vue`.

## Blast radius

| Archivo | Cambio |
|---|---|
| `ui-alquicarros/app/composables/useReservationWizard.ts` | `canAdvance('datos') → true`; se retira `formValid` de `WizardAdvanceState` |
| `ui-alquicarros/tests/reservation-wizard-machine.test.ts:187-190` | `'datos is gated by form validity'` se reescribe: `canAdvance('datos', {})` pasa a `true` |
| `ui-alquicarros/app/components/wizard/ReservationWizard.vue` | Se retira `formValid` de `advanceState` y `politicaPrivacidad` del `storeToRefs` |
| `ui-alquicarros/app/components/wizard/WizardSummary.vue` | Solo `:loading` + "Confirmando…" en los dos CTAs. `ctaDisabled` queda igual |
| `ui-alquicarros/app/components/__tests__/ReservationForm.test.ts:11` | No se edita, pero condiciona D6: su regex `/<u-form\b[\s\S]*?>/` corta en el primer `>`, así que el handler de `@error` debe ser nombrado, no una arrow inline |
| `ui-alquicarros/app/components/wizard/steps/StepData.vue` | Bloque `role="alert"` de `formSubmitLocked` |
| `ui-alquicarros/app/components/wizard/steps/StepVehicle.vue` | Consume `useAppConfig().franchise` en sus **dos** anclas (`:38-43`, `:103-108`) |
| `ui-alquicarros/app/components/ReservationForm.vue` | `@error` → scroll + foco al primer campo inválido, con fallback `#telefono` |
| `ui-alquicarros/tests/contact-number.test.ts:52-55` | El aserto pasa de "contiene el literal" a "referencia `franchise.whatsapp`, sin `wa.me/<dígitos>`" |
| `packages/logic/src/stores/useStoreReservationForm.ts` | Ref `unknownStatusReserveCode` (líneas 140, 351, 417) |
| `packages/logic/src/stores/useStoreSearchData.ts:81` | Limpia `unknownStatusReserveCode` junto al reset ya existente del lock |
| `e2e/alquicarros-reservation-wizard.spec.ts` | SCEN-311-03/04 reescritos sobre cero POST; SCEN-366-01..05 |
| `docs/specs/2026-07-16-issue-311-.../scenarios/*.md` | Amend de SCEN-311-03 |

Consumidores: el wizard es local a alquicarros (`ui-alquilame` y `ui-alquilatucarro` no
tienen `app/components/wizard/`). Lo compartido son los dos stores de `packages/logic`, y
ahí el cambio se reduce a un ref que solo alquicarros lee: se escribe en la rama de status
desconocido y se limpia en `search()`. Las marcas hermanas no cambian de comportamiento.

Sin cambios en: el schema de validación, el payload de registro, el guard anti
doble-submit, el reset del lock de #322 (`useStoreSearchData.ts:81` se conserva tal cual),
ni el default sin marcar de la casilla (#311).

Riesgos descartados con evidencia: `trackCheckoutStarted` se dispara en el watcher de
cambio de paso (`ReservationWizard.vue:226`), no en el click, y deduplica por `item_id`
(`useStoreSearchData.ts:307-318`) — un CTA pulsable con formulario vacío no emite analítica
extra. `usePhoneField` solo revalida en blur y con debounce cuando ya hay error
(`usePhoneField.ts:72-86`), así que un submit fallido no lo re-dispara.

## Fuera de alcance

- **La pista del paso 2.** El CTA también nace deshabilitado en "Vehículo" hasta elegir
  gama. Es el mismo defecto pero el grid de gamas está a la vista; se deja fuera para no
  inflar el cambio.
- **Los pasos 2-5 del stepper deshabilitados al cargar.** Es correcto: son pasos aún no
  alcanzados y saltar a ellos sin búsqueda ni gama produce los estados que la red de
  seguridad de deep-links ya rebota.
- **La validación de consentimiento en el servidor.** Sigue ausente (registrado en #311).
  Este cambio no la empeora: el cliente sigue sin poder enviar sin consentimiento.
- **Alinear `app.config` con Supabase `franchises`.** Ver D5.
