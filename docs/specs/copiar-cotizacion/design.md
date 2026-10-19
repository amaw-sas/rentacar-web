# Botón «Copiar cotización» para asesores

Fecha: 2026-10-18 · Marcas: alquilame, alquilatucarro, alquicarros

## Para qué

El asesor cotiza en la web y necesita pegarle al cliente, por WhatsApp, todas las gamas
disponibles con su precio, en el mismo formato que ya usa el bot. Hoy lo transcribe a mano.

## Decisiones del dueño

1. **Solo asesores.** El cliente no ve el botón. Se activa abriendo cualquier página con
   `?asesor=1`; queda recordado en `localStorage` (vía `getLocalStorageSafe()`, clave
   `rentacar:asesor`). `?asesor=0` lo borra. Una vez leído, el parámetro se **quita de la URL**
   (`router.replace`, conservando el resto de la query): si el asesor comparte la dirección de
   la página con un cliente, el móvil del cliente no se vuelve «de asesor». Con
   `localStorage` bloqueado el modo asesor dura lo que dure la sesión de la página (la
   bandera vive en memoria; el watch ignora que la clave desaparezca). No es control de
   acceso: copia lo que ya está en pantalla.
2. **Mismo pie que el bot**, palabra por palabra (20 minutos, precios dinámicos, 6
   beneficios). La web no vence nada a los 20 minutos: es un aviso al cliente.
3. **Seguro Total y silla de bebé** son casillas del panel de copiado, apagadas por
   defecto. En la web estas opciones viven por tarjeta; el panel no toca las tarjetas.
4. **Con Seguro Total**, la línea «incluyen IVA, seguro básico y kilometraje ilimitado»
   pasa a «incluyen IVA, Seguro Total y kilometraje ilimitado».
5. **La silla va aparte**, nunca sumada al precio de la gama.
6. **Precio con IVA en las 3 marcas**, como el bot. En alquilatucarro y alquicarros la
   tarjeta muestra el precio sin IVA, así que el texto copiado sale ~19 % más alto que la
   tarjeta. Es lo que paga el cliente y lo que cotiza el bot.

## Formato del texto

```
*Recoges:*
{sede de recogida}
{fecha y hora de recogida}

*Entregas:*
{sede de devolución}
{fecha y hora de devolución}

*Total: {N} día|días[ y {H} hora|horas extra]*

cotización
{N} día(s)[ + {H} hora(s) extra]
· {sede}                                   ← misma sede
· Recoge en {A}, entrega en {B}            ← sedes distintas
[· Plan mensual de {1.000|2.000} km]       ← reserva mensual
[· Con Seguro Total (deducible $0)]
{código}    {descripción}    {precio}
[{código}    {descripción}    {precio} (sin Seguro Total)]
[Cada precio incluye las horas extra.]                       ← si H > 0
[Cada precio incluye el cargo por entregar en otra sede.]    ← si sedes distintas
[Silla de bebé: {total} ({N} días × {diario}), se paga al recoger.]   ← regular
[Silla de bebé: {mensual} el mes, se paga al recoger.]                ← mensual
Esta cotización estará disponible durante 20 minutos; luego se debe recotizar.
Los precios son dinámicos e incluyen IVA, {seguro básico|Seguro Total|Seguro Total (salvo las gamas marcadas «sin Seguro Total»)} y {kilometraje ilimitado|N km al mes|los km del plan de cada gama}.
                                      ← mensual: el plan trae tope de km (decisión del dueño 2026-10-19)

*Beneficios de reservar*
1. Reservas con 4 datos.
2. Congelas el precio.
3. No realizas ningún pago.
4. Cancelas cuando quieras.
5. No bloqueamos cupo de tarjeta.
6. Pagas al recoger el carro.
```

Variantes del pie realmente implementadas:
- Seguro: «seguro básico» (casilla apagada, o ninguna fila lo admite), «Seguro Total» (todas
  las filas lo admiten) y «Seguro Total (salvo las gamas marcadas «sin Seguro Total»)» cuando
  solo algunas filas no lo tienen.
- Kilometraje: «kilometraje ilimitado» (regular), «N km al mes» (mensual, todas las filas
  con el mismo plan) y «los km del plan de cada gama» (mensual con planes distintos).

Reglas:
- `*texto*` es negrita de WhatsApp (el bot usa `**` porque pinta markdown; aquí el destino
  es WhatsApp).
- Separador entre columnas: 4 espacios, como el texto del bot. La descripción va con
  `trim()` (`categoryDescription` sale de un `.replace` y puede traer espacio inicial).
- **Fecha y hora**: `{día de la semana} {d} {mes}. {h}:{mm}{am|pm}` →
  «viernes 16 oct. 7:30am». Día de la semana en español, minúsculas. Mes de una tabla fija:
  ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic (no `Intl`, que da «sept» y
  sin punto). Hora sin cero a la izquierda, armada desde los campos de reloj del formulario
  (`horaRecogida`/`horaDevolucion`, «HH:mm»), sin conversión de zona. Día de la semana
  calculado de la fecha civil (`fechaRecogida`, «YYYY-MM-DD») en UTC para que no corra.
- **N y H** salen de la primera fila copiada (`numberDays`, `extraHoursQuantity`), que es lo
  que Localiza cotizó. Mensual: N = 30 y sin horas extra.
- «día(s)» y «hora(s)» quedan literales como el bot; «Total:» sí singulariza.
- Los datos de sede y fecha salen del formulario; por eso el botón solo se pinta cuando el
  formulario coincide con la búsqueda (ver «Cuándo aparece»).

## Cuándo aparece

Las tres condiciones a la vez (la tercera es la red real: al cambiar el formulario la
búsqueda se vacía antes de que `searchOutdated` se encienda, que va con retardo):
- modo asesor encendido (solo en el cliente),
- `!pending && !searchOutdated` en `useStoreSearchData`,
- al menos una gama copiable.

## Qué gamas y qué precio

**Lista**: la misma que pinta cada marca, sin las agotadas.
- alquilame / alquilatucarro: `renderableCategories` de su `CategorySelectionSection.vue`
  sin las de `estimatedTotalAmount === 999999999`. El componente se la pasa al panel.
- alquicarros: las filas de `StepVehicle.vue` tras su filtro y deduplicado, en el orden de
  segmentos de `groupBySegment`, **todos** los segmentos (no solo el abierto).

**Precio por fila**: se crea un `useCategory(row)` nuevo en el momento del clic (sus refs se
copian de la fila al crearse; no se guardan entre clics) y se lee `getActualTotalPrice`
(total con IVA y tasa, incluye el cargo de otra sede; las horas extra vienen dentro del total
de Localiza).
- «Se puede cotizar Seguro Total» = `canQuoteTotalCoverageFor(row, mensual)` (regular: hay
  cargo diario; mensual: siempre, porque cobra `total_insurance_price` de la fila del mes) y,
  en mensual, además `total_insurance_price > 0`.
- Seguro Total marcado y se puede cotizar → `withTotalCoverage = true`.
- Seguro Total marcado y no se puede → **no** se toca `withTotalCoverage`;
  se copia el precio básico con «(sin Seguro Total)». Si todas las filas están así, no se
  escribe «· Con Seguro Total» y el pie dice «seguro básico».
- Mensual: `withMileage` = primer plan vendible de la gama (`sellablePlans(...)[0]`, el
  mismo default del Paso 3 de alquicarros). Si la gama no vende ningún plan, se omite.
  En el texto se nombra el plan de la primera fila. Si las filas difieren, cada fila lleva
  « (plan {X} km)».
- Precio ≤ 0 → la fila se omite.

**Silla**: `getBabySeatPrice` de `useCategory` (regular: N × `babySeatDayPrice`; mensual:
`babySeatMonthPrice`), con el diario de `useFetchRentacarData().extras`.

## Piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| `formatQuoteDateTime(fecha, hora)` | `packages/logic/src/utils/useDateFunctions.ts` | «viernes 16 oct. 7:30am» |
| `buildQuoteText(input)` | `packages/logic/src/utils/helpers/buildQuoteText.ts` | función pura: datos planos (sedes, fechas, N, H, filas `{código, descripción, precio, sinTotal?, plan?}`, flags, silla) → texto. Sin Vue |
| `sellablePlans`, `canQuoteTotalCoverageFor` | se **mueven** de `ui-alquicarros/app/composables/useMonthlyPlans.ts` a `packages/logic/src/utils/monthlyPlans.ts`, con sus pruebas | el archivo de alquicarros los re-exporta; sus consumidores no cambian |
| `useAdvisorMode()` | `packages/logic/src/composables/useAdvisorMode.ts` | en `onMounted` lee `?asesor` y `localStorage`; devuelve `isAdvisor` (falso en servidor) |
| `useCopyQuote()` | `packages/logic/src/composables/useCopyQuote.ts` | recibe la lista de filas; arma filas con `useCategory`, llama `buildQuoteText`, copia, avisa con `useToast` (patrón de `useShareSearchParams`) |
| `CopyQuotePanel.vue` | uno por marca | botón + 2 casillas, estilo de cada marca, montado con `v-if="isAdvisor"` y componente perezoso (`Lazy*` / `defineAsyncComponent`); el panel mismo lleva `v-if="canCopy"` |

Montaje: alquilame y alquilatucarro en el encabezado «¡Vehículos Disponibles!» de
`CategorySelectionSection.vue`; alquicarros en el `<header>` de `StepVehicle.vue`.

Los composables se auto-importan por la capa `logic`; solo `buildQuoteText`,
`formatQuoteDateTime` y `sellablePlans` van al barril `utils/index.ts`.

## Errores

- Portapapeles negado o inexistente → toast «No se pudo copiar». Nada se rompe.
- `getLocalStorageSafe()` devuelve `null` → el modo asesor vale solo mientras la URL traiga
  `?asesor=1`.
- Servidor: `isAdvisor` es falso, así que el `v-if="isAdvisor"` no pinta el panel y no hay
  desajuste de hidratación. No se usa `<ClientOnly>`: el panel es un componente perezoso que
  solo se descarga para asesores.
- Armar el texto (`buildText`) también va dentro del `try` de `copy()`: si lanza, sale el toast
  «No se pudo copiar». Ningún `await` corre antes de `navigator.clipboard.writeText`, para no
  perder la activación del clic.

## Pruebas

- Unitarias puras: `buildQuoteText` (todas las ramas del formato), `formatQuoteDateTime`
  (meses, am/pm, 12:00, medianoche, día de la semana; un caso que detecte un día corrido por
  zona horaria).
- Unitarias con mocks (patrón de `useCategory.*.test.ts`): `useCopyQuote` — agotadas
  fuera, fallback sin Seguro Total, plan mensual, fallo del portapapeles.
- `useAdvisorMode`: activar, recordar, apagar, storage bloqueado.
- Navegador en las 3 marcas: los escenarios.

## Alcance del cambio (blast radius)

- Nuevos: `buildQuoteText.ts`, `useAdvisorMode.ts`, `useCopyQuote.ts`, 3 `CopyQuotePanel.vue`,
  pruebas.
- Tocados: `CategorySelectionSection.vue` ×2 (alquilame, alquilatucarro), `StepVehicle.vue`
  (alquicarros), `useDateFunctions.ts`, `utils/index.ts`, `useMonthlyPlans.ts` (pasa a
  re-exportar; lo consumen `StepCoverage.vue`, `StepVehicle.vue`, `useSelectionCarryOver.ts`).
- Pruebas que se mueven o retocan: `ui-alquicarros/app/composables/__tests__/useMonthlyPlans.test.ts`
  (pasa a `packages/logic`), y la guarda de texto
  `ui-alquicarros/tests/wizard-monthly-mileage.test.ts` (lee el archivo y busca `price > 0` y
  `1k_kms`; debe apuntar al archivo nuevo).
- Brecha conocida (sin cerrar): una gama mensual sin cargo diario recibe en el texto copiado
  un precio con Seguro Total, mientras que las tarjetas de alquilame y alquilatucarro esconden
  esa opción.
- Diferencia conocida: en mensual, una gama sin cargo diario esconde Seguro Total en las
  tarjetas de alquilame y alquilatucarro, pero alquicarros sí lo vende y el texto copiado
  también. Se compara con alquicarros o con prueba unitaria.
- Sin cambios en precios, reserva, tablero ni chat. Sin `?asesor=1`, el visitante no ve nada
  distinto.

## Fuera de alcance

Conductor adicional y lavado (no pedidos). Vencimiento real a 20 minutos. Copiar desde el
chat.
