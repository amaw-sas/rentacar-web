# Diseño — Confirmación de reserva (issue #368, hallazgo #1)

## Problema

`reservado/[reserveCode]/index.vue` muestra el código y "te notificaremos", y nada más: ni qué se reservó, ni fechas, ni sede, ni precio, ni qué llevar el día de la recogida. Peor, dos defectos concretos:

- El bloque "¿Necesitas modificar o cancelar? Escríbenos por WhatsApp o correo" **no enlaza ninguno de los dos** (`:52-58`), teniendo la franquicia en el scope.
- El estado `unavailable` ("Estamos verificando tu reserva / Intenta en unos minutos") no ofrece reintento ni contacto.

La variante confirmada tampoco tiene `role="status"` (solo la de `unavailable`).

## Restricción que gobierna el diseño

El endpoint `/api/reservations/{code}/exists` devuelve **solo** `{ exists: boolean }`. Los datos de la reserva nunca llegan al navegador ni al payload de Nuxt — es deliberado: el código de reserva es un valor tipo bearer en la URL y servir los datos degradaría su seguridad (`useReservationConfirmation.ts:45-49`).

Por tanto el recap (qué/fechas/sede/precio) **no puede salir del servidor**. Su única fuente es el estado Pinia en sesión. Consecuencia: el recap es **efímero** — vive justo después de reservar y desaparece en un refresh (Pinia es memoria) o en un link compartido. La página debe ser 100% funcional sin él; el correo de confirmación es el registro durable.

Alcance aprobado: página completa con recap efímero (precio incluido), más los arreglos que no dependen de datos.

## Por qué un snapshot congelado, y no lectura en vivo (dos rondas de revisión)

El diseño pasó por dos rondas de revisión de spec que tumbaron dos enfoques ingenuos. Vale la pena dejarlo escrito porque el error es sutil:

1. **Gatear con `lastSubmittedCode` no sirve.** Es un nombre engañoso: guarda `vehiculo.value` (el código de GAMA, "C"), como marcador one-shot del slideover al retroceder (`useStoreReservationForm.ts:292`). NO es el código de la reserva, que hoy no se persiste en ningún lado.
2. **Leer el recap en vivo de los stores drifta.** El precio y el nombre viven en `useStoreSearchData.selectedCategory` (la instancia viva de `useCategory`), y los campos de fecha/sede en `useStoreReservationForm`. Todos son **campos vivos que mutan** con cualquier interacción posterior. Reservar C → atrás → nueva búsqueda → elegir D deja `selectedCategory` y `vehiculo` en D **en lockstep** (simetría intencional, `ReservationWizard.vue:172-175`); un forward a `/reservado/C` pintaría los datos de D sobre la reserva C. Un gate que compare `selectedCategory.categoryCode` contra el `vehiculo` vivo es tautológico y no cierra el hueco. Incluso re-elegir la MISMA gama con otras fechas driftaría el precio.

La única fuente de verdad de lo que se reservó es el instante del envío. **El recap se congela ahí.**

## Cambio en el store: `lastReservationSummary`

`submitForm` (`useStoreReservationForm.ts:302`) es el único punto donde coexisten el código real de la reserva (`dataRecord.value.reserveCode`) y todos los valores de display, aún sin driftar. En su rama de éxito `/reservado/` (`:328-334`, antes del `navigateTo` de `:347`) se captura un snapshot **inmutable, de marca-neutral**:

```
lastReservationSummary = {
  code,            // dataRecord.value.reserveCode (el bearer de la URL)
  categoryName,    // useStoreSearchData().selectedCategory?.categoryDescription    (SIN .value — ver nota)
  total,           // ...selectedCategory?.currencyTotalToPayWithAdditionals         (SIN .value)  (canónico #373)
  pickupDate, pickupTime, returnDate, returnTime,   // form store: humanFormatted*.value
  pickupBranch, returnBranch,   // selectedPickupLocation.value?.name / selectedReturnLocation.value?.name
  pickupCity, returnCity,       // ...selectedPickupLocation.value?.city / ...returnLocation.value?.city
  days,            // selectedDays.value
  haveTotalInsurance, haveMonthlyReservation, monthlyMileage,  // .value; flags crudos → el brand los etiqueta
}
```

**Nota sobre `.value` — asimetría real que muerde si se ignora.** `selectedCategory` es un *deep ref* (`useStoreSearchData.ts:51`), así que `selectedCategory.value` es un proxy reactivo que **auto-desenvuelve** los refs anidados: `selectedCategory.value.categoryDescription` YA es el string, y ponerle `.value` da `undefined`. El código real lo confirma — nadie los lee con `.value` (`WizardSummary.vue:290,296`, `analyticsItemFromSelection` usa `unref`). En cambio los computeds del **form store** se capturan en el scope local de `submitForm` y SÍ son refs → necesitan `.value`. Los dos campos cross-store (nombre, total) van sin `.value` (o con `unref()` por seguridad); todo lo demás con `.value`.

Las sedes NO son strings: `selectedPickupLocation`/`selectedReturnLocation` resuelven a `BranchData` (`{ id, code, name, city, … }`). El snapshot extrae `name` y `city` en la captura, no guarda el objeto.

El objeto es genérico "qué se reservó" — no lleva presentación de alquicarros, así que vivir en el store compartido es defendible (las tres marcas comparten el flujo de submit). `lastSubmittedCode` NO se toca — sigue con su consumidor vivo del slideover.

Una vez congelado, **nada drifta**: el refresh lo borra (Pinia) y el recap se oculta; un segundo envío lo sobrescribe con el código nuevo, así que `/reservado/{códigoViejo}` no coincide y se oculta. El gate se reduce a una sola comparación.

## Arquitectura

### 1. `useReservationRecap()` — composable brand-local nuevo (ui-alquicarros)

Trivial y sin dependencia de estado vivo. Lee `lastReservationSummary` + el `reserveCode` de la ruta; devuelve `{ show, recap }`.

- `show = summary != null && summary.code === normalizeReservationCode(route.params.reserveCode) && !!summary.categoryName && !!summary.total`. El match de código identifica la reserva (`normalizeReservationCode` valida sin transformar, `reservationCode.ts:8-14`, así que crudo === normalizado es sólido); la completitud de nombre y total evita que un snapshot a medias pinte `undefined`. `selectedCategory` está poblado en el camino normal de submit, pero el código de alrededor no lo asume (usa optional chaining, `useRecordReservationForm.ts:71`), así que el gate tampoco: si el nombre o el total faltan, el recap se oculta en vez de mentir.
- `recap` mapea el snapshot a lo pintable: etiqueta de seguro (Total/Básico desde `haveTotalInsurance`), etiqueta de km si `haveMonthlyReservation`, y el resto tal cual (nombre, fechas, sedes, días, total). Sin refs vivos, sin `.value` de instancias, sin gate de gama.

### 2. La página `reservado/[reserveCode]/index.vue`

Variante `confirmed` gana, en este orden visual:

- `role="status"` en el contenedor (hoy falta).
- Código con **botón copiar** (feedback vivo "Código copiado").
- Bloque **recap** (`v-if="show"`), siguiendo el patrón de tarjeta existente (`bg-white/10 rounded-2xl`).
- Checklist **"qué llevar el día de la recogida"** (siempre visible, no depende de datos).
- Bloque de contacto con **enlaces reales**: WhatsApp (`franchise.whatsapp`), correo (`mailto:franchise.email`), teléfono (`tel:`).

Variante `unavailable` gana: reintento (recargar) + los mismos enlaces de contacto.

### 3. Constante compartida de requisitos (brand-local)

Los 3 strings de requisitos hoy están inline en `packages/ui-alquicarros/app/components/ReservationForm.vue:17-19` ("Contar con una tarjeta de crédito", "Ser mayor de edad con cédula o pasaporte", "Contar con licencia de conducción vigente."). Salen a una constante que consume el checklist de confirmación, y se re-apunta `ReservationForm.vue` a ella. Una sola fuente evita que diverjan. Sin cambio de comportamiento en el formulario. (La intro de la línea 13, "titular de la tarjeta de crédito", es distinta — se queda en el form.)

## Fuentes de datos

- Contacto: `useAppConfig().franchise` → `whatsapp` (URL `wa.me` completa), `email` (`alquicarros@gmail.com`), `phone`. SoT de marca; nada hardcodeado.
- Recap: `lastReservationSummary` (snapshot congelado en el submit) + `useReservationConfirmation` (existente) para el gate found/unavailable. Sin lectura de stores vivos en la confirmación.

## Flujo

1. Al enviar, en la rama `/reservado/` → se congela `lastReservationSummary` con el código y los valores de display, y se navega.
2. La confirmación monta → `useReservationConfirmation()` (red: booleano) decide `found` / `unavailable`.
3. Si `found` → `useReservationRecap()` compara `summary.code` con el código de la URL.
4. En sesión, mismo código → recap con los valores exactos congelados. En refresh / link compartido / código distinto → `show=false`, la página degrada a código + copiar + checklist + contactos.
5. Confetti se mantiene, solo en `found`.

## Bordes

- `lastReservationSummary` null (refresh, cold-load, entrada directa a la URL) → sin recap. Página funcional igual.
- `summary.code` no coincide (segundo envío, link de otra reserva) → sin recap. No pintar datos ajenos.
- Snapshot a medias (`categoryName` o `total` ausentes, p.ej. `selectedCategory` null al capturar) → sin recap por la regla de completitud del gate. Nunca `undefined` en el DOM.
- Clipboard no disponible / falla → el botón no rompe; degrada a código seleccionable.

## Pruebas y escenarios observables (holdout SDD)

1. `lastReservationSummary` sembrado con `code` = código de la URL → recap con los valores exactos del snapshot: nombre de vehículo, fechas+horas, sedes, días, etiqueta de seguro, total.
2. `lastReservationSummary` null (refresh / cold-load) → recap ausente, sin `undefined`; checklist y enlaces presentes.
3. `lastReservationSummary` presente pero `code` distinto al de la URL (segunda reserva, o link compartido de otra) → recap ausente; no pinta datos ajenos.
4. `lastReservationSummary` con `code` coincidente pero `categoryName` o `total` ausentes → recap ausente (regla de completitud), nunca `undefined` en el DOM; checklist y enlaces presentes.
5. Enlaces: `href` de WhatsApp = `franchise.whatsapp`; correo = `mailto:franchise.email`.
6. Botón copiar (clipboard mockeado) → escribe el código al portapapeles y anuncia "Código copiado".
7. Clipboard no disponible / rechaza → el botón no lanza; el código queda seleccionable; sin excepción.
8. Variante `unavailable` → reintento + contacto presentes, `role="status"`.
9. Contraste AA de los textos nuevos.
10. (Store, **end-to-end obligatorio**) Manejando el `submitForm` REAL con un `useStoreSearchData().selectedCategory` poblado (instancia real de `useCategory`, no sembrada ni stubeada), tras la rama `/reservado/`: `lastReservationSummary.code === dataRecord.reserveCode`, `categoryName === selectedCategory.categoryDescription` y `total === selectedCategory.currencyTotalToPayWithAdditionals` (ambos SIN `.value`). Es el único escenario que ejercita la captura; sembrar el snapshot dejaría pasar el bug de `.value` en verde.

## Fuera de alcance

- Recap durable servido por backend (requeriría auth sobre un código bearer — otro workstream, dashboard).
- Los hallazgos #3 (back del navegador), #4-#7 (formulario) y #8 (pulido): sub-proyectos B3/C/D, cada uno su spec.
