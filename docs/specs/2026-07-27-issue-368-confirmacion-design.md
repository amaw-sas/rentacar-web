# Diseño — Confirmación de reserva (issue #368, hallazgo #1)

## Problema

`reservado/[reserveCode]/index.vue` muestra el código y "te notificaremos", y nada más: ni qué se reservó, ni fechas, ni sede, ni precio, ni qué llevar el día de la recogida. Peor, dos defectos concretos:

- El bloque "¿Necesitas modificar o cancelar? Escríbenos por WhatsApp o correo" **no enlaza ninguno de los dos** (`:52-58`), teniendo la franquicia en el scope.
- El estado `unavailable` ("Estamos verificando tu reserva / Intenta en unos minutos") no ofrece reintento ni contacto.

La variante confirmada tampoco tiene `role="status"` (solo la de `unavailable`).

## Restricción que gobierna el diseño

El endpoint `/api/reservations/{code}/exists` devuelve **solo** `{ exists: boolean }`. Los datos de la reserva nunca llegan al navegador ni al payload de Nuxt — es deliberado: el código de reserva es un valor tipo bearer en la URL y servir los datos degradaría su seguridad (`useReservationConfirmation.ts:45-49`).

Por tanto el recap (qué/fechas/sede/precio) **no puede salir del servidor**. Su única fuente es el store en sesión (`useStoreReservationForm`), que retiene todo tras el submit — el store no se resetea y navega a `/reservado/{code}` conservando estado. Consecuencia: el recap es **efímero**. Vive justo después de reservar y desaparece en un refresh (Pinia es memoria) o en un link compartido. La página debe ser 100% funcional sin él; el correo de confirmación es el registro durable.

Alcance aprobado: página completa con recap efímero, más los arreglos que no dependen de datos.

## Arquitectura

### 1. `useReservationRecap()` — composable brand-local nuevo (ui-alquicarros)

Casi puro. Lee el store y el `reserveCode` de la ruta; devuelve `{ show: boolean, recap: ReservationRecap | null }`.

- `show` es `true` **solo si** `lastSubmittedCode === normalizeReservationCode(route.params.reserveCode)` **y** el store tiene los campos mínimos (vehículo, sedes, fechas). El match de `lastSubmittedCode` es el candado: garantiza que el recap describe la reserva de ESTA URL y no una anterior de la misma sesión.
- `recap` viene ya formateado para pintar: nombre del vehículo, fechas + horas de recogida y devolución, sedes, días, etiqueta de seguro (Total / Básico), etiqueta del plan de kilometraje si es mensual, y el total. El total **reúsa `currencyTotalToPayWithAdditionals`** (el canónico de #373) para que el precio coincida exactamente con el que mostró el resumen del wizard.

Aislar el gating y el formato del template lo hace testeable sin montar y mantiene la página declarativa.

### 2. La página `reservado/[reserveCode]/index.vue`

Variante `confirmed` gana, en este orden visual:

- `role="status"` en el contenedor (hoy falta).
- Código con **botón copiar** (feedback vivo "Código copiado").
- Bloque **recap** (`v-if="show"`), siguiendo el patrón de tarjeta existente (`bg-white/10 rounded-2xl`).
- Checklist **"qué llevar el día de la recogida"** (siempre visible, no depende de datos).
- Bloque de contacto con **enlaces reales**: WhatsApp (`franchise.whatsapp`), correo (`mailto:franchise.email`), teléfono (`tel:`).

Variante `unavailable` gana: reintento (recargar) + los mismos enlaces de contacto.

### 3. Constante compartida de requisitos (brand-local)

Los 3 strings de requisitos hoy están inline en `ReservationForm.vue:16-20` ("tarjeta de crédito", "mayor de edad con cédula o pasaporte", "licencia de conducción vigente"). Salen a una constante que consume el checklist de confirmación, y se re-apunta `ReservationForm.vue` a ella. El issue pide "repetir los requisitos como checklist"; una sola fuente evita que diverjan. Sin cambio de comportamiento en el formulario.

## Fuentes de datos

- Contacto: `useAppConfig().franchise` → `whatsapp` (URL `wa.me` completa), `email` (`alquicarros@gmail.com`), `phone`. Es la SoT de marca; nada hardcodeado.
- Recap: `useStoreReservationForm` en sesión + `useReservationConfirmation` (existente) para el gate found/unavailable.

## Flujo

1. Monta → `useReservationConfirmation()` (red: booleano) decide `found` / `unavailable`.
2. Si `found` → `useReservationRecap()` lee store + ruta → recap gateado.
3. En sesión con match → recap con valores exactos. En refresh / link compartido / código distinto → `show=false`, la página degrada a código + copiar + checklist + contactos.
4. Confetti se mantiene, solo en `found`.

## Bordes

- `lastSubmittedCode` no coincide → sin recap. No pintar datos ajenos ni rancios.
- Campo requerido ausente (defensivo, no debería pasar post-submit) → `show=false`; nunca renderizar `undefined`.
- Clipboard no disponible / falla → el botón no rompe; degrada a código seleccionable.

## Accesibilidad

- `role="status"` en la variante confirmada.
- Botón copiar con `aria-label` y anuncio de resultado.
- Contraste AA de todo texto nuevo, medido en canvas (fondo oscuro de marca; el patrón `bg-white/10` con texto blanco ya se usa en la página).

## Pruebas y escenarios observables (holdout SDD)

1. Store sembrado con `lastSubmittedCode` = código de la URL → recap con los valores exactos (vehículo, fechas+horas, sedes, días, seguro, total = el canónico de #373).
2. Store vacío o código distinto → recap ausente; checklist y enlaces presentes.
3. Enlaces: `href` de WhatsApp = `franchise.whatsapp`; correo = `mailto:franchise.email`.
4. Botón copiar → escribe el código al portapapeles (mock) y anuncia.
5. Variante `unavailable` → reintento + contacto presentes, `role="status"`.
6. Contraste AA de los textos nuevos.

## Fuera de alcance

- Recap durable servido por backend (requeriría auth sobre un código bearer — otro workstream, dashboard).
- Los hallazgos #3 (back del navegador), #4-#7 (formulario) y #8 (pulido): sub-proyectos B3/C/D, cada uno su spec.
