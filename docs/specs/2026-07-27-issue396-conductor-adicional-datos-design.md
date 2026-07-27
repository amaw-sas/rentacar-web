# El conductor adicional que Localiza nunca sabe quién es — diseño

Issue [#396](https://github.com/amaw-sas/rentacar-web/issues/396) · Epic [#395](https://github.com/amaw-sas/rentacar-web/issues/395) · Hermano [dashboard#293](https://github.com/amaw-sas/rentacar-dashboard/issues/293) · Fecha: 2026-07-27 · Marcas: las 3

## El problema

Cuando alguien contrata «Conductor adicional», la reserva le dice a Localiza que hay uno. Nada más.
`useRecordReservationForm.ts:79` manda `extra_driver: 1` y ahí se acaba la información. Localiza
necesita el nombre y la cédula de esa persona para el contrato, así que termina pidiéndolos por
teléfono o por WhatsApp, fuera del flujo que la web ya cerró.

El dato existe en la cabeza del cliente en el momento exacto en que marca la casilla. Lo perdemos ahí.

## Lo que cambia el diseño

**1. El flag vive fuera del formulario.** `withExtraDriver` es una propiedad de la instancia
`selectedCategory` (store de búsqueda), mientras que valibot valida el `formState` armado en
`ReservationForm.vue` a partir de `useStoreReservationForm`. Son dos stores distintos y el schema no
tiene forma de leer el flag. Esta es la decisión de fondo del issue, y el issue no la menciona.

**2. alquicarros no necesita código propio.** Su wizard es marca-local, pero `StepData.vue:16`
renderiza `<ReservationForm>` — el mismo componente de marca que usa el slideover de las otras dos.
Tocar los tres `ReservationForm.vue` cubre las tres marcas y el wizard sin un archivo más.

**3. `ReservationFormSection.vue` es código muerto.** Existe en alquilatucarro y alquilame, importa
`ReservationFormValidationSchema` y le pasa a `ReservationForm` una prop `form-state` que ese
componente ni declara. Ninguna página lo renderiza; lo único que lo referencia son tests que leen su
código fuente. No se toca, y el blast radius se queda en tres archivos de UI.

**4. Los refs del store arrancan en `null`, y `v.optional()` solo neutraliza `undefined`.** Con
`v.optional(v.string(), '')` el schema rechazaría `null` aunque nadie hubiera marcado el adicional, y
el formulario dejaría de enviarse en las tres marcas. La entrada tiene que ser `v.nullish`. Es la
trampa más cara de este cambio y no se ve en revisión de código: se ve cuando ninguna reserva entra.

**5. Cambiar de gama conserva el adicional.** `carrySelection` (alquicarros, #368) arrastra
`withExtraDriver` a la instancia nueva. Cualquier diseño que guarde los datos del conductor dentro de
la categoría los perdería en cada cambio de gama sin decirlo.

## Decisiones

| # | Decisión | Por qué |
|---|---|---|
| D1 | Los campos van en el paso de datos, dentro de `ReservationForm.vue` | Es donde ya vive el `UForm` que bloquea el envío; las otras superficies no tienen formulario y exigirían un gate aparte |
| D2 | Obligatorios cuando el adicional está marcado | El dato a medias no le sirve a Localiza. Decisión abierta #2 del epic, confirmada el 2026-07-27 |
| D3 | Nota informativa, sin declaración expresa de autorización | Decisión de directiva. Ver deuda declarada |
| D4 | Un solo campo de documento, alfanumérico 6-15 más blocklist | El contrato con dashboard#293 no tiene campo de tipo; el rango acepta cédula y pasaporte |
| D5 | El flag se refleja en el `formState` como campo derivado | Mantiene la validación pura y probable con `safeParse`, sin acoplar el módulo a Pinia |
| D6 | Las claves del payload solo existen si el adicional está marcado | Sin adicional, el body queda idéntico al de hoy — no «vacío», idéntico |
| D7 | Exactamente un conductor adicional | Decisión abierta #3 del epic, confirmada el 2026-07-27. El adicional es un booleano y el contrato son dos campos escalares. Si Localiza acaba admitiendo varios, esto pasa a lista y cambia el contrato con dashboard#293 |

## Diseño

### Contrato

`FormRecordFields.ts`, junto a los otros adicionales:

```ts
extra_driver?: number | undefined;
extra_driver_name?: string | undefined;      // nuevo
extra_driver_document?: string | undefined;  // nuevo
```

Nombres acordados con dashboard#293. Opcionales, como el resto de los adicionales.

### Store

Dos refs en `useStoreReservationForm`, con la convención `string | null` del resto:

```ts
const conductorAdicionalNombre = ref<string | null>(null);
const conductorAdicionalIdentificacion = ref<string | null>(null);
```

Van también en el `return` del store y en el `storeToRefs` que `useRecordReservationForm` desestructura
al principio. Olvidar cualquiera de los dos sitios da `undefined` en silencio: sin error de tipos y sin
error en runtime, el payload sale sin los campos.

### Payload

En `useRecordReservationForm.ts`, insertados condicionalmente con el mismo patrón que ya usa
`referido` en la línea 91:

```ts
if (selectedCategory.value?.withExtraDriver) {
  partialData.extra_driver_name = conductorAdicionalNombre.value?.trim() ?? '';
  partialData.extra_driver_document = conductorAdicionalIdentificacion.value?.trim() ?? '';
}
```

La decisión de enviar la toma el flag en el momento del envío, no la presencia de texto. Datos de
un adicional que no se contrató no viajan nunca, aunque estén escritos.

### Validación

`extraDriverDocumentError()` en `userInformationForm.ts`, pura y hermana de `identificationError()`,
reutilizando `SENTINEL_BLOCKLIST`:

```ts
const EXTRA_DRIVER_DOCUMENT_FORMAT = /^[A-Za-z0-9]{6,15}$/;
```

Tres entradas nuevas en `reservationEntries`:

```ts
conductorAdicional: v.nullish(v.boolean(), false),
conductorAdicionalNombre: v.nullish(v.string(), ''),
conductorAdicionalIdentificacion: v.nullish(v.string(), ''),
```

Y dos `v.forward(v.partialCheck(...))` escritos **inline** dentro del `v.pipe`, nunca extraídos a una
constante compartida: valibot solo infiere el tipo cross-field cuando el `forward` está literalmente
dentro del pipe. La lógica sí se comparte, en la función pura; la envoltura se repite. Es la misma
razón que ya está escrita en el comentario de `userInformationEntries`.

### UI

En los tres `ReservationForm.vue`, un campo derivado en `baseForm`:

```ts
conductorAdicional: computed(() => selectedCategory.value?.withExtraDriver === true)
```

`reactive()` desenvuelve el computed a un booleano de solo lectura. Nada lo escribe: solo lo leen las
dos reglas. `selectedCategory` ya está en el `storeToRefs` de los tres componentes, así que no hay
import nuevo.

Este espejo es la pieza que sostiene todo el diseño, y falla callado. Si una marca se queda sin él,
`v.nullish(..., false)` rellena el hueco con `false`, las dos reglas nunca disparan, y esa marca
acepta reservas con conductor adicional sin nombre ni cédula. No hay error de tipos que lo delate.
Por eso lleva su propio test de contrato por marca, hermano de `ReservationForm.noFlightTrap.test.ts`,
que lee el fuente y exige el campo en `baseForm`.

El bloque de campos va antes de la casilla de privacidad, bajo `v-if="formState.conductorAdicional"`,
con los `data-testid` que necesita la QA y la nota de tratamiento debajo. El estilo lo heredan de
`inputUi`, que ya define el look por marca.

### Ciclo de vida

Desmarcar el adicional **no borra** lo escrito: quien desmarca y vuelve a marcar recupera lo que
tecleó. Es seguro por lo dicho arriba — el payload se decide por el flag.

Cambiar de gama tampoco lo borra. Los datos viven en el store de formulario, no en la instancia de
categoría, así que sobreviven al reemplazo que hace `carrySelection`, igual que sobrevive el flag.
Las dos cosas se mueven juntas.

## Escenarios observables

- **SCEN-396-01** — Dado que marco «Conductor adicional», cuando llego al paso de datos, entonces
  aparecen los campos de nombre y cédula del conductor adicional con la nota de tratamiento.
- **SCEN-396-02** — Dado el adicional marcado y el nombre vacío, cuando intento confirmar, entonces
  el formulario bloquea con error en ese campo y no sale ningún POST.
- **SCEN-396-03** — Dado el adicional marcado y la cédula `123456`, cuando intento confirmar,
  entonces bloquea por centinela con el mensaje de identificación real.
- **SCEN-396-04** — Dado el adicional marcado y el documento `AB123456`, cuando confirmo, entonces
  pasa la validación (pasaporte aceptado).
- **SCEN-396-05** — Dado el adicional marcado y ambos campos completos, cuando confirmo, entonces el
  body lleva `extra_driver_name` y `extra_driver_document` con lo escrito, sin espacios sobrantes.
- **SCEN-396-06** — Dado que marqué el adicional, llené los campos y luego lo desmarqué, cuando
  confirmo, entonces el body no contiene ninguna de las dos claves.
- **SCEN-396-07** — Dado que nunca marco el adicional, cuando confirmo, entonces el body es idéntico
  al actual y el formulario envía (regresión de la trampa `null`).
- **SCEN-396-08** — Los anteriores son verdad en las tres marcas.

## Cobertura

| Escenarios | Dónde |
|---|---|
| 01-04 | `packages/logic/src/utils/validation/__tests__/` con `safeParse`, hermano de `userInformationForm.test.ts` |
| 05-07 | `useRecordReservationForm.extraDriver.test.ts`, siguiendo los cinco `.<topic>.test.ts` que ya existen |
| 01, 08 | `ReservationForm.test.ts` de cada marca, más el test de contrato del espejo en las tres |
| Runtime | `/agent-browser` + `/dogfood` sobre el wizard de alquicarros — es la única marca donde el flag y los campos viven en pasos distintos |

## Riesgos

**El CTA del wizard sigue habilitado con los campos vacíos, y así se queda.** `formValid` en
`ReservationWizard.vue:472` es `Boolean(politicaPrivacidad.value)`: mira la casilla de privacidad y
nada más. Con el adicional marcado y el nombre vacío, «Confirmar reserva» se ve pulsable, el usuario
lo pulsa y valibot bloquea. A diferencia de `vehiculo` —que no tiene `UFormField` y por eso falla
mudo, como documenta `ReservationWizard.vue:325-327`— estos campos sí lo tienen, así que el error se
pinta al lado del campo, en el mismo paso. Esa es exactamente la observable de SCEN-396-02.

No se toca `formValid` ni `ctaDisabled`. Meter ahí los campos nuevos reabre #366, y #313 depende del
mismo camino.

**Error rancio al desmarcar.** `UForm` puede conservar el error de un campo que ya se ocultó. No
bloquea nada: el submit revalida el schema completo y pasa. Pero jsdom no lo ve; es cosa de la QA en
navegador.

**El wizard separa el flag de los campos por tres pasos.** Quien marca el adicional en el paso 4 se
encuentra los campos en el paso 5 sin haberlos pedido. Es el precio de tener la validación dentro del
`UForm`. Si en QA resulta desconcertante, el arreglo es un recordatorio bajo la casilla en
`StepExtras.vue`, no mover los campos.

## Deuda declarada

La cédula que se recoge es de un tercero que no está frente al formulario. La Ley 1581 exige
autorización del titular del dato, y quien la entrega es otra persona. La directiva decidió cubrirlo
con una nota informativa, sin declaración expresa de autorización: no queda constancia de quién
autorizó ese tratamiento. Si más adelante se quiere cerrar, el cambio es una frase condicional en la
casilla de consentimiento que ya existe, o una segunda casilla obligatoria.

## Dependencia con el dashboard y orden de despliegue

La migración de la tabla `reservations` no va aquí — es de dashboard#293, otro repo. Lo que sí va
aquí es qué le pasa al payload por el camino, porque de eso depende si esta rama se puede desplegar
sola. Verificado extremo a extremo:

| Salto | Qué hace con una clave que no conoce |
|---|---|
| `server/api/reservations/record.post.ts` (las 3 marcas) | Reenvía el body verbatim, sin lista blanca. Solo añade la API key y la IP real |
| `app/api/reservations/route.ts` (dashboard) | No usa zod. Comprueba que estén 16 campos requeridos y sigue |
| `createReservation` → `reservation-service.ts:352` | El `.insert({...})` enumera columna por columna. Lo que no esté mapeado ahí no llega a Supabase |

Las dos claves nuevas son inertes hasta que el dashboard las mapee: no hay error, no hay 400, no hay
columna que falte. Así que no hace falta desplegar en lockstep.

Pero el orden importa. El estado malo es **web desplegada y dashboard no**: el formulario exige los
datos, el cliente los teclea, y se pierden en silencio. Al revés no pasa nada — las columnas nuevas
se quedan nulas hasta que la web empiece a mandarlas. Así que dashboard#293 primero, esta rama
después. Revertir la web es seguro en cualquier momento; las columnas quedan nulables.

Un aviso para quien recoja dashboard#293: su cambio 2 (schema zod en `lib/schemas/reservation.ts`) y
su tercer escenario dan por hecho que el payload de la web pasa por ese schema. No pasa. Ese schema
lo importan las server actions del alta manual, la tabla de reservas y los tipos del MCP; el funnel
de la web no lo toca. Lo que de verdad persiste es el `.insert` de `reservation-service.ts:352`, y el
issue no lo menciona.

## Fuera de alcance

La persistencia y el correo a Localiza van en dashboard#293. El proxy que crea la reserva
(`lib/reservation/proxy-client.ts`) no lleva adicionales y sigue igual: el conductor adicional llega
por correo, como el seguro total.

## Follow-up

`ReservationFormSection.vue` en alquilatucarro y alquilame es código muerto con tests que lo tratan
como vivo. Merece su propio issue, no un arreglo de paso aquí.
