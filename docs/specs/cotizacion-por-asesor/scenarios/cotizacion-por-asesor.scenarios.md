---
name: cotizacion-por-asesor
created_by: diego-alex-melo
created_at: 2026-10-20T00:00:00Z
---

# Escenarios: cotización por asesor

Diseño: `docs/specs/cotizacion-por-asesor/design.md`. Salvo donde se indica, cada escenario
se prueba en las 3 marcas. Siguen vigentes los escenarios de comportamiento del #519
(`docs/specs/copiar-cotizacion/scenarios/`): botón oculto con búsqueda desactualizada,
gamas agotadas excluidas, casillas Seguro Total y silla, cliente sin panel. Los de formato del
texto quedan sustituidos por SCEN-008 a SCEN-012.

## SCEN-001: el asesor se activa con su código
**Given**: un navegador sin modo asesor; `daniela` es un referido `salesperson` activo con
nombre «Daniela»
**When**: abre una página de resultados con `?asesor=daniela&utm_source=x`
**Then**: aparece el botón «Copiar cotización» con «Asesor: Daniela»; la dirección queda sin
`asesor` y conserva `utm_source=x`; al recargar sin parámetro el panel sigue con el mismo nombre
**Evidence**: DOM del panel (texto «Asesor: Daniela»), `location.href` tras la carga y tras
recargar, `localStorage['rentacar:asesor']`

## SCEN-002: un código que no existe no activa nada
**Given**: un navegador sin modo asesor
**When**: abre la web con `?asesor=danela`
**Then**: no aparece el panel; aparece el aviso «Código de asesor no encontrado»; la dirección
queda sin `asesor`; no se guarda nada
**Evidence**: DOM (sin panel, aviso visible), `location.href`, `localStorage` sin la clave

## SCEN-003: un bot del chat no es asesor
**Given**: `camila-bot` es `salesperson` activo en el panel
**When**: se abre la web con `?asesor=camila-bot`, o con `?asesor=CAMILA-BOT`
**Then**: igual que SCEN-002: sin panel y con el aviso «Código de asesor no encontrado»
**Evidence**: respuesta 404 de `GET /api/asesor/camila-bot` y DOM sin panel

## SCEN-004: el modo viejo `?asesor=1` ya no sirve
**Given**: un navegador con `localStorage['rentacar:asesor'] = '1'` (activado con el #519)
**When**: abre cualquier página de resultados
**Then**: no aparece el panel y la clave se borra; abrir con `?asesor=1` muestra el aviso
«Código de asesor no encontrado»
**Evidence**: DOM sin panel, `localStorage` sin la clave tras la carga

## SCEN-005: un asesor inactivado pierde el botón; un fallo de red no
**Given**: un navegador con Daniela guardada
**When**: (a) el servidor responde 404 al revalidar; (b) la revalidación falla por red, 5xx o 429
**Then**: (a) el panel desaparece en esa carga y la clave se borra; (b) el panel sigue con
«Asesor: Daniela» y la clave se conserva
**Evidence**: prueba de montaje con respuestas simuladas; DOM y `localStorage` en cada caso

## SCEN-006: el asesor se apaga
**Given**: un navegador con Daniela guardada
**When**: abre la web con `?asesor=0`
**Then**: el panel desaparece, la clave se borra y la dirección queda sin `asesor`
**Evidence**: DOM, `localStorage`, `location.href`

## SCEN-007: el cliente no paga nada
**Given**: un navegador sin `?asesor` y sin clave guardada
**When**: abre una página de resultados y espera a que carguen las gamas
**Then**: no hay ninguna petición a `/api/asesor/`, no se descarga el código del panel y no
aparece el panel
**Evidence**: registro de red de la carga (cero peticiones `/api/asesor/`), DOM sin panel

## SCEN-008: cotización de Alquilame
**Given**: Daniela activa en alquilame; búsqueda Cali Aeropuerto → Cali Norte Chipichape,
viernes 23 oct. 7:30am → domingo 25 oct. 10:30am (2 días + 3 horas extra); casillas Seguro
Total y silla marcadas
**When**: toca «Copiar cotización»
**Then**: el portapapeles tiene exactamente la versión Alquilame aprobada en `design.md`, con
los nombres de gama de las tarjetas, el total con IVA de cada gama seguido de « COP», la línea
de la silla con su total y precio por día, sin enlace, sin firma, sin código de gama y sin la
palabra «deducible»
**Evidence**: prueba unitaria con el texto aprobado como fixture byte a byte; en vivo, el texto
copiado comparado con los totales de las tarjetas

## SCEN-009: cotización de Alquilatucarro
**Given**: lo mismo que SCEN-008 en alquilatucarro
**When**: toca «Copiar cotización»
**Then**: el portapapeles tiene exactamente la versión Alquilatucarro aprobada, que termina en
«- Paga al recoger el vehículo», con la misma regla de precios, COP, sin enlace, firma, código
de gama ni deducible
**Evidence**: fixture byte a byte; en vivo, totales con IVA iguales a los de alquilame para las
mismas gamas

## SCEN-010: cotización de Alquicarros
**Given**: lo mismo que SCEN-008 en alquicarros
**When**: toca «Copiar cotización»
**Then**: el portapapeles tiene exactamente la versión Alquicarros aprobada, con fechas «vie 23
oct. 7:30am → dom 25 oct. 10:30am», «Incluye:», COP, y que termina en la línea de beneficios,
sin enlace, firma, código de gama ni deducible
**Evidence**: fixture byte a byte; en vivo, mismos totales que alquilame

## SCEN-011: las variantes de la tabla
**Given**: cada marca y cada caso de la tabla de variantes de `design.md`: sin Seguro Total,
Seguro Total en algunas gamas, sin horas extra, misma sede, ni horas extra ni otra sede,
mensual con un plan, mensual con planes distintos, silla mensual, sin silla
**When**: se arma el texto
**Then**: cada texto sigue exactamente la fila de la tabla para esa marca; ninguno promete algo
que no aplica (ni «horas extra» sin horas extra, ni «otra sede» con la misma sede, ni
«kilometraje ilimitado» en mensual)
**Evidence**: una prueba unitaria por celda de la tabla (3 marcas × 9 casos)

## SCEN-012: las 3 cotizaciones no son iguales entre sí
**Given**: la misma búsqueda y casillas en las 3 marcas
**When**: se copia la cotización en cada una
**Then**: los 3 textos son distintos en el saludo, el orden y los beneficios; las cifras son
las mismas
**Evidence**: los 3 textos copiados en vivo, uno al lado del otro

## SCEN-013: la reserva hecha por el asesor queda a su nombre
**Given**: Daniela activa en el navegador; búsqueda sin referido en la ruta, o con
`/referido/otro/` en la ruta
**When**: el asesor completa el formulario de reserva y la envía
**Then**: la petición de reserva sale con `user = "daniela"` en los dos casos; sin asesor
activo, sale como hoy (sin `user`, o con el referido de la ruta)
**Evidence**: cuerpo de la petición de reserva interceptado (en vivo, sin crear una reserva
real) y prueba unitaria de `useRecordReservationForm`

## SCEN-014: el botón compartir del resumen lleva el código del asesor
**Given**: Daniela activa en alquilame o alquilatucarro, con una gama elegida en el resumen
**When**: toca compartir por WhatsApp
**Then**: el enlace compartido es el de siempre (`…/categoria/{gama}` y `?seguro=total` si
aplica) con `/referido/daniela/`, que reemplaza a otro referido si la ruta ya traía uno; sin
asesor activo, el enlace es idéntico al de hoy
**Evidence**: URL del enlace de WhatsApp generado, con y sin asesor; al abrirla en un navegador
limpio se ve la misma gama, sin panel de asesor

## SCEN-015: el endpoint solo dice el nombre de un código exacto
**Given**: el servidor de cualquier marca
**When**: se llama `GET /api/asesor/daniela`, `/api/asesor/no-existe`, `/api/asesor/camila-bot`,
un código con `/` o de más de 60 caracteres, y 31 veces seguidas desde la misma IP
**Then**: 200 con exactamente `{ "code": "daniela", "name": "Daniela" }` y `Cache-Control:
no-store`; 404 para los demás; el formato inválido responde 404 sin consultar la base; la
llamada 31 dentro del minuto responde 429; ninguna respuesta incluye teléfono, correo ni notas
**Evidence**: respuestas HTTP (estado, cuerpo, cabeceras) y prueba unitaria del handler con la
base simulada
