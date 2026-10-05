# Formulario de reserva: teléfono con el país del visitante

Fecha: 2026-10-04 · Estado: aprobado por el dueño (2026-10-04) · Repo: `rentacar-web` (las 3 marcas)

## Para qué

El campo de teléfono del formulario de reserva arranca siempre con la bandera de Colombia. Un cliente de USA/Canadá que no cambia la bandera y escribe `1 817 522 8026` queda guardado como `+57 1 817 5228026`: un número que no existe, y no le llega ningún WhatsApp.

Medido el 2026-10-04 en la base del tablero (365 días, 8.088 reservas): 16 reservas / 12 clientes con el número mal armado (12 `+57 1 XXX XXXXXXX` y 4 `+57 609…/347…/309…`), 7 de esos clientes desde julio. Hay una variante que no se puede medir: número de USA sin el 1 cuyo código de área coincide con un celular colombiano (305, 310, 312…).

## Estado actual (verificado en código el 2026-10-04)

- El campo es `vue-tel-input@9.5.1` con `defaultCountry="CO"` fijo, en tres copias de `ReservationForm.vue` (`packages/ui-{alquilame,alquilatucarro,alquicarros}/app/components/`). Se carga diferido con `defineAsyncComponent(() => import('vue-tel-input'))`.
- `vue-tel-input` lee `defaultCountry` **una sola vez, al montar** (no hay `watch`). Si `defaultCountry` llega vacío, cae en `autoDefaultCountry` (activo por defecto) y llama a `https://ip2c.org/s` desde el navegador. Hoy no pasa porque `CO` siempre está puesto.
- La validación (`packages/logic/src/utils/validation/userInformationForm.ts`) y `normalizePhoneNumber.ts` importan `isValidPhoneNumber` de `libphonenumber-js`, es decir, con metadatos `min`, que solo revisan el largo. Con `libphonenumber-js@1.12.31`: `+5718175228026` es válido con `min` e inválido con `max`. Probado contra los 6.197 teléfonos distintos con `+` del último año: `max` rechaza exactamente los 12 mal armados y ninguno bueno.
- `normalizePhoneNumber` también se usa al guardar (`useRecordReservationForm.ts:73`).
- El conductor adicional no tiene teléfono propio. `PublicContactForm` no valida con libphonenumber. No hay más usos.
- **Las tres webs pasan por Cloudflare** (`server: cloudflare`, `cf-ray …-MIA`, comprobado con `curl -I`). En el servidor de la web, `x-vercel-ip-country` geolocaliza la IP de salida de Cloudflare, no la del visitante: es el mismo defecto del tope por IP de `/api/contact`. `readVisitorGeo` vive en `rentacar-dashboard`, que recibe el chat directo sin Cloudflare, y por eso allá sí sirve.
- La portada y las 19 ciudades son `isr: 3600`: el país no puede ir en el HTML, porque se le mostraría a todos. `/api/rentacar-data` no se cachea (`rentacar-data.get.ts:7-11`), pero es el catálogo y no se mezcla con esto.
- `vue-tel-input` emite el número en formato internacional (`+57 300 1234567`) **solo si lo considera válido con sus propios metadatos `min`**; si no, emite el texto crudo (`300 123`). Por eso `+57 1 817 5228026` llega con `+57`: con `min` parece válido.
- `showDialCode: false` (`usePhoneField.ts:33`): elegir una bandera no escribe nada en el store. El campo se vuelve a montar al ir y volver entre pasos (`CategorySelectionSection.vue:131/138` en alquilame y alquilatucarro, `ReservationWizard.vue:99` en alquicarros).
- Carga inicial medida (build de producción de alquilatucarro, 2026-10-04): la validación y los metadatos `min` (19,5 kB gzip) van en el chunk de entrada, que baja en todas las páginas. `/bogota` carga ~347 kB gzip de JS. El chunk de entrada pesa 203 kB gzip. Los metadatos `max` pesan 39,7 kB gzip. `vue-tel-input` (10,2 kB gzip) ya es diferido.

## Diseño

### 1. Validación con metadatos completos

- `userInformationForm.ts`, `normalizePhoneNumber.ts` y `__tests__/normalizePhoneNumber.test.ts` pasan a `libphonenumber-js/max`.
- `vue-tel-input` **se queda con `min`** (no se hace alias global). Si también usara `max`, `1 817 522 8026` bajo Colombia saldría crudo, sin `+57`, y el mensaje de §3 no podría reconocerlo.
- **Carga diferida (opción B, aprobada por el dueño el 2026-10-04).** Nada de `libphonenumber-js` se importa de forma estática:
  - Nuevo módulo `packages/logic/src/utils/validation/phoneValidator.ts`: `loadPhoneValidator()` hace `import('libphonenumber-js/max')` una sola vez (promesa memorizada; si falla, se olvida la promesa para que el próximo montaje reintente) y guarda `isValidPhoneNumber`. `isValidPhone(value)` lo expone de forma síncrona y `isPhoneValidatorReady()` lo usa el esquema para elegir el mensaje.
  - `userInformationForm.ts` valida con `isValidPhone`. Si el validador no está cargado, el número **se rechaza** con el texto genérico de hoy («Número de teléfono o WhatsApp no válido»), no con los mensajes de bandera (falla cerrado: un número sin revisar no entra). Es inalcanzable desde la interfaz, porque el campo solo aparece cuando la carga terminó y nada valida el teléfono sin el campo montado (verificado: el esquema solo lo usan los 3 `ReservationForm.vue` y el `StepData.vue` de alquicarros, que los reutiliza). Lo cubre un test unitario.
  - `normalizePhoneNumber.ts` usa `isValidPhone`; sin validador cargado devuelve la entrada intacta. El esquema la rechaza antes de guardar, así que el caso mexicano no cambia.
  - El loader del campo (§2) espera también `loadPhoneValidator()`.
  - Resultado esperado: los metadatos `min` salen del chunk de entrada (solo los usa `vue-tel-input`, que ya es diferido) y los `max` van en un chunk aparte que baja al abrir el formulario.
  - El `import()` apunta a `phoneValidatorMax.ts`, que reexporta con nombre solo `isValidPhoneNumber` y `validatePhoneNumberLength`. Importar `libphonenumber-js/max` directo de forma dinámica arrastra el módulo completo (56,8 kB gzip frente a 41,3 kB).
  - Medido (build de producción de alquilatucarro, 2026-10-04): JS inicial de `/bogota` 346,9 → 317,7 kB gzip; entry 203,2 → 173,9 kB; al abrir el formulario bajan 81,3 kB (`vue-tel-input` + `min` 30,8; `max` 41,3; núcleo compartido 9,2), contra 10,2 kB antes.
- Se mide con un build de producción de alquilatucarro, antes (ya medido: §Estado actual) y después: kB gzip del entry, del chunk de `max` y del de `vue-tel-input`, y confirmación de que ninguno de los dos metadatos es alcanzable con imports estáticos desde el entry ni desde la página de `/bogota`.

### 2. País inicial según el visitante

- **Endpoint** `packages/logic/server/api/visitor-country.get.ts` (la capa compartida lo sirve en las 3 marcas). Responde `{ country, source }` con `cache-control: private, no-store`.
  - Si la petición trae `cf-ray` (pasó por Cloudflare): usa solo `cf-ipcountry`. `source: 'cloudflare'`.
  - Si no trae `cf-ray` (preview en `*.vercel.app`, local): usa `x-vercel-ip-country`. `source: 'vercel'`.
  - Valor ausente, `XX`, `T1` o que no sea un código de dos letras: `country: null`, `source: 'none'`.
- **Cliente**: `fetchVisitorCountry()` en `packages/logic` pide el endpoint una vez por carga de página (promesa memorizada), con tope de 1.500 ms, y devuelve un ISO2 en mayúscula o `null`. Error o tope vencido → `null`, sin `console.error`. En el servidor (sin `window`) devuelve `null` sin pedir nada. Se usa `typeof window` y no `import.meta.server` porque `import.meta.*` es falso en vitest y la rama no se podría probar.
- **Última bandera mostrada**: el store del formulario guarda `telefonoPais` (ISO2 o `null`). Se escribe con cada evento `country-changed` de `vue-tel-input`, que dispara también al montar con el país inicial; por eso guarda la última bandera mostrada, la haya elegido el cliente o no. Es intencional: al volver al formulario se ve la misma bandera que antes (aunque la primera vez se haya caído a `CO` por el tope y el país del visitante haya llegado después). Se limpia en `resetAfterReservation` (`useStoreReservationForm.ts:371`, junto a `telefono`).
- **Formulario**: al montar, el formulario espera en paralelo tres cosas: `import('vue-tel-input')`, `fetchVisitorCountry()` y `loadPhoneValidator()`. No se usa `defineAsyncComponent`: dentro del `<Suspense>` de Nuxt ignora su `loadingComponent`. El componente se guarda en un `shallowRef` y se pinta con `v-if` cuando las tres terminaron; el bloque de espera va en el `v-else`. Después elige el país inicial en este orden: `telefonoPais` del store → país del visitante → `'CO'`. Un código solo se acepta si, en mayúscula, está en la lista de países de `vue-tel-input` (`VueTelInput.props.allCountries.default()`, con `iso2` en mayúscula); si no, se pasa al siguiente. El resultado va a un `ref` que nunca está vacío y que se enlaza a `defaultCountry`.
- **Por qué la bandera nunca cambia por debajo**: el campo no existe hasta que el país está resuelto, así que nadie puede escribir ni elegir antes; `vue-tel-input` no vuelve a leer `defaultCountry` mientras está montado; y al montarse de nuevo manda la última bandera mostrada (`telefonoPais`), que incluye la que el cliente eligió. Si el store ya trae un teléfono con `+`, `vue-tel-input` toma el país del número, como hoy.
- Mientras se resuelve, en el lugar del campo va un bloque del mismo alto, para que la página no salte. La espera dura lo que tarde la más lenta de las tres: el país tiene tope de 1.500 ms; los dos chunks (~10 kB y ~40 kB gzip) no tienen tope, como hoy `vue-tel-input`.
- No se llama a ningún servicio externo desde el navegador y no se usa `autoDefaultCountry`.

### 3. Mensaje que lleva a revisar la bandera

El `v.custom` del teléfono pasa a recibir el mensaje como función del valor:

- Empieza por `+57` y es inválido: «Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.» (aprobado 2026-10-04)
- Empieza por otro `+código` y es inválido: «Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.» (aprobado 2026-10-04)
- No empieza por `+`: `vue-tel-input` solo antepone el código cuando sus metadatos `min` aceptan el número; si no, llega el texto crudo (con bandera USA, `300 123 4567` llega así). Se juzga contra la bandera en pantalla, que el cargador le avisa al validador con cada `country-changed` (`setActivePhoneCountry`):
  - le faltan dígitos para ese país (`validatePhoneNumberLength` = `TOO_SHORT`) o no hay bandera conocida: «Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.» (aprobado 2026-10-04)
  - tiene los dígitos pero no existe: el mensaje de la bandera (Colombia → el de Colombia; otra → «no corresponde al país»).
  - Ajuste del 2026-10-04 tras la prueba en navegador (SCEN-010 fallaba con la regla «sin `+` → incompleto»). Los textos no cambian.
- Vacío o con menos de 5 caracteres: sin cambios («Escribe tu número de WhatsApp o teléfono»).

## Alcance de los cambios (blast radius)

- `packages/logic/src/utils/validation/userInformationForm.ts`, `normalizePhoneNumber.ts` y el nuevo `phoneValidator.ts`.
- Tests que validan teléfonos y tienen que cargar el validador antes (`await loadPhoneValidator()`): `validation/__tests__/userInformationForm.test.ts`, `normalizePhoneNumber.test.ts`, `extraDriverFields.test.ts`, `licenseType.test.ts` y `stores/__tests__/useStoreReservationForm.privacyConsent.test.ts`. Ninguno de sus números cambia de resultado entre `min` y `max` (verificado).
- `packages/logic/src/utils/index.ts:208-209`: el barril exporta `loadPhoneValidator` y `fetchVisitorCountry`.
- `stores/__tests__/useStoreReservationForm.resetAfterReservation.test.ts:39-61, 233-252`: la lista de campos borrados y `fillClientA` incluyen `telefonoPais`.
- `packages/logic/server/api/visitor-country.get.ts` (nuevo) y su test.
- `packages/logic/src/` nuevo `fetchVisitorCountry` y su test; `useStoreReservationForm.ts` (`telefonoPais`).
- Los 3 `ReservationForm.vue` (loader, `defaultCountry`, `country-changed`, bloque de espera).
- `e2e/reservation-phone-revalidation.spec.ts:64`, que espera el texto viejo con la entrada `300123`: pasa a esperar el texto nuevo de número sin `+`. Las comprobaciones negativas (`:132`, `:154`, `:171`) pasan a exigir que `#telefono-error` no exista, para cubrir los tres mensajes.
- Consumidores sin cambios: `useRecordReservationForm.ts` (sigue llamando a `normalizePhoneNumber`), el tablero (recibe el mismo formato).

## Riesgos

- `cf-ipcountry` solo existe en producción, porque las previews no pasan por Cloudflare. Después del despliegue se comprueba con `curl https://<marca>/api/visitor-country`: debe devolver `source: 'cloudflare'` y un país. Si Cloudflare no manda el dato, el endpoint devuelve `null` y todo queda en `CO`, igual que hoy: falla hacia el comportamiento actual, nunca hacia un país equivocado.
- Una petición más por visita, a nuestro propio dominio y solo cuando se abre el formulario.
- El tope de 1.500 ms puede retrasar la aparición del campo en una red mala; pasado el tope, abre en `CO`.
- Peso: con la carga diferida, abrir el formulario baja ~40 kB gzip más que hoy (metadatos `max`), en paralelo con `vue-tel-input` y el país.
- Si el chunk de `max` o el de `vue-tel-input` no carga (red caída), el campo no aparece; al volver a montar el formulario se reintenta.
- El tablero (`rentacar-dashboard`) no se toca. Si valida el teléfono por su cuenta, queda fuera de alcance.

## Escenarios

Ver `2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md`.
