# Diseño — Confirmación de reserva (issue #368, hallazgo #1)

## Problema

`reservado/[reserveCode]/index.vue` muestra el código y "te notificaremos", y nada más: ni qué se reservó, ni fechas, ni sede, ni precio, ni qué llevar el día de la recogida. Peor, dos defectos concretos:

- El bloque "¿Necesitas modificar o cancelar? Escríbenos por WhatsApp o correo" **no enlaza ninguno de los dos** (`:52-58`), teniendo la franquicia en el scope.
- El estado `unavailable` ("Estamos verificando tu reserva / Intenta en unos minutos") no ofrece reintento ni contacto.

La variante confirmada tampoco tiene `role="status"` (solo la de `unavailable`).

## Restricción que gobierna el diseño

El endpoint `/api/reservations/{code}/exists` devuelve **solo** `{ exists: boolean }`. Los datos de la reserva nunca llegan al navegador ni al payload de Nuxt — es deliberado: el código de reserva es un valor tipo bearer en la URL y servir los datos degradaría su seguridad (`useReservationConfirmation.ts:45-49`).

Por tanto el recap (qué/fechas/sede/precio) **no puede salir del servidor**. Su única fuente son los stores Pinia en sesión, que retienen todo tras el submit (ninguno se resetea al navegar a `/reservado/{code}`). Consecuencia: el recap es **efímero**. Vive justo después de reservar y desaparece en un refresh (Pinia es memoria) o en un link compartido. La página debe ser 100% funcional sin él; el correo de confirmación es el registro durable.

Alcance aprobado: página completa con recap efímero (precio incluido), más los arreglos que no dependen de datos.

## Dos stores, no uno

El recap se arma de **dos** stores distintos, y confundirlos es el error natural de implementación:

- `useStoreReservationForm` — campos del formulario, listos para pintar vía sus computeds: fechas y horas (`humanFormatted*`), sedes (`selectedPickupLocation`/`selectedReturnLocation`), días (`selectedDays`), seguro (`haveTotalInsurance`), plan de km (`selectedMonthlyMileage`, `haveMonthlyReservation`), y el **código de gama** reservado (`vehiculo`, un `CategoryType` como `"C"`). NO tiene ni el nombre amable de la gama ni precio alguno.
- `useStoreSearchData` — su `selectedCategory` es la **instancia viva de `useCategory`** (`useStoreSearchData.ts:51`), la misma de la que `useRecordReservationForm` lee el total al enviar. De ahí salen el **nombre** (`categoryDescription`) y el **total** (`currencyTotalToPayWithAdditionals`, el canónico de #373). Pinia sobrevive la navegación SPA, así que sigue vivo en la confirmación en sesión.

## El código de la reserva no se persiste hoy (corrección de gating)

Mi diseño previo gateaba con `lastSubmittedCode`. **Es un nombre engañoso**: se escribe una sola vez (`useStoreReservationForm.ts:292`) con `vehiculo.value` (el código de GAMA), y su único consumidor es el guard one-shot del slideover al retroceder. NO es el código de la reserva. El código real (`dataRecord.value.reserveCode`) hoy solo se usa para analytics/routing y **nunca se guarda**. Reusar `lastSubmittedCode` rompería a su consumidor vivo y el gate jamás dispararía (un código de 1 char nunca pasa `normalizeReservationCode`, que exige 4-64).

**Cambio de store requerido:** añadir `lastReservationCode` a `useStoreReservationForm`, setearlo a `dataRecord.value.reserveCode` en la rama `/reservado/` de `submitForm` (`:329-334`), exponerlo. El gate del recap compara contra ese campo, no contra `lastSubmittedCode`.

## Arquitectura

### 1. `useReservationRecap()` — composable brand-local nuevo (ui-alquicarros)

Casi puro. Lee los dos stores + el `reserveCode` de la ruta; devuelve `{ show: boolean, recap: ReservationRecap | null }`.

`show` es `true` **solo si las tres condiciones se cumplen** (gate de tres vías):

1. `lastReservationCode === normalizeReservationCode(route.params.reserveCode)` — el store describe la reserva de ESTA URL.
2. `useStoreSearchData().selectedCategory` no es `null` — hay instancia viva de la que sacar nombre y precio.
3. `selectedCategory.categoryCode === vehiculo` (el código de gama reservado) — la instancia viva describe la MISMA gama que se reservó, no otra que una búsqueda posterior haya dejado en su lugar.

La condición 3 cierra el hueco de desacople: submit → atrás → nueva búsqueda (reasigna `selectedCategory`) → adelante a `/reservado/{códigoViejo}` pintaría el precio/nombre de otra gama. Con el match de código, el recap se oculta en vez de mentir.

`recap` viene ya formateado para pintar: nombre del vehículo (`categoryDescription`), fechas + horas de recogida y devolución, sedes, días, etiqueta de seguro (Total / Básico), etiqueta del plan de kilometraje si es mensual, y el total (`currencyTotalToPayWithAdditionals`). Aislar gating y formato del template lo hace testeable sin montar.

### 2. La página `reservado/[reserveCode]/index.vue`

Variante `confirmed` gana, en este orden visual:

- `role="status"` en el contenedor (hoy falta).
- Código con **botón copiar** (feedback vivo "Código copiado").
- Bloque **recap** (`v-if="show"`), siguiendo el patrón de tarjeta existente (`bg-white/10 rounded-2xl`).
- Checklist **"qué llevar el día de la recogida"** (siempre visible, no depende de datos).
- Bloque de contacto con **enlaces reales**: WhatsApp (`franchise.whatsapp`), correo (`mailto:franchise.email`), teléfono (`tel:`).

Variante `unavailable` gana: reintento (recargar) + los mismos enlaces de contacto.

### 3. Constante compartida de requisitos (brand-local)

Los 3 strings de requisitos hoy están inline en `packages/ui-alquicarros/app/components/ReservationForm.vue:17-19` ("Contar con una tarjeta de crédito", "Ser mayor de edad con cédula o pasaporte", "Contar con licencia de conducción vigente."). Salen a una constante que consume el checklist de confirmación, y se re-apunta `ReservationForm.vue` a ella. El issue pide "repetir los requisitos como checklist"; una sola fuente evita que diverjan. Sin cambio de comportamiento en el formulario. (El 4º string intro de la línea 13, "titular de la tarjeta de crédito", es distinto — se queda en el form, no es un requisito "qué llevar".)

## Fuentes de datos

- Contacto: `useAppConfig().franchise` → `whatsapp` (URL `wa.me` completa), `email` (`alquicarros@gmail.com`), `phone`. SoT de marca; nada hardcodeado.
- Recap: `useStoreReservationForm` (fechas, sedes, días, flags, código de gama) **+** `useStoreSearchData.selectedCategory` (nombre + total) **+** `useReservationConfirmation` (existente) para el gate found/unavailable.

## Flujo

1. Monta → `useReservationConfirmation()` (red: booleano) decide `found` / `unavailable`.
2. Si `found` → `useReservationRecap()` aplica el gate de tres vías sobre los dos stores + la ruta.
3. En sesión, con match de código y gama → recap con valores exactos. En refresh / link compartido / código o gama distintos → `show=false`, la página degrada a código + copiar + checklist + contactos.
4. Confetti se mantiene, solo en `found`.

## Bordes

- `lastReservationCode` no coincide → sin recap. No pintar datos ajenos ni rancios.
- `selectedCategory` null o de otra gama → sin recap (regla 2/3 del gate). Nunca renderizar `undefined` de nombre o precio.
- Clipboard no disponible / falla → el botón no rompe; degrada a código seleccionable.

## Pruebas y escenarios observables (holdout SDD)

1. Ambos stores sembrados (form con `lastReservationCode` = código de URL y `vehiculo="C"`; searchData con `selectedCategory` de código "C") → recap con valores exactos: vehículo (nombre), fechas+horas, sedes, días, seguro, total = el canónico de #373.
2. `lastReservationCode` distinto o ausente → recap ausente; checklist y enlaces presentes.
3. `lastReservationCode` coincide pero `selectedCategory` es null (refresh parcial) → recap ausente, sin `undefined`; checklist y enlaces presentes.
4. `lastReservationCode` coincide pero `selectedCategory` es de OTRA gama (búsqueda posterior) → recap ausente (no pinta precio/nombre ajenos).
5. Enlaces: `href` de WhatsApp = `franchise.whatsapp`; correo = `mailto:franchise.email`.
6. Botón copiar (clipboard mockeado) → escribe el código al portapapeles y anuncia "Código copiado".
7. Clipboard no disponible / rechaza → el botón no lanza; el código queda seleccionable; sin excepción.
8. Variante `unavailable` → reintento + contacto presentes, `role="status"`.
9. Contraste AA de los textos nuevos.

## Fuera de alcance

- Recap durable servido por backend (requeriría auth sobre un código bearer — otro workstream, dashboard).
- Los hallazgos #3 (back del navegador), #4-#7 (formulario) y #8 (pulido): sub-proyectos B3/C/D, cada uno su spec.
