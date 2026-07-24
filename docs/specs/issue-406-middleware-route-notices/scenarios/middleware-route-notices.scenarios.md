---
name: middleware-route-notices
created_by: orchestrator
created_at: 2026-07-24T00:00:00Z
---

# Los avisos del middleware de rutas llegan al usuario — Issue #406

Holdout de aceptación. Origen: `docs/specs/2026-07-24-middleware-route-notices-design.md`
(§Escenarios observables). Contrato write-once: ningún escenario se debilita para que el código pase.

**Regla que estos escenarios fijan.** Cuando el middleware corrige un deep-link, el usuario acaba
mirando una búsqueda distinta de la que pidió. Tiene que enterarse. El aviso debe sobrevivir a los
dos mecanismos que hoy lo matan: la redirección 302 del render en servidor (que descarta el payload)
y el `flushMessages()` con el que abre `doSearch`. Un aviso emitido que nadie ve no es un aviso.

**Sedes de referencia** (fixture, forma real de `useStoreAdminData().sortedBranches`):

| slug | code | ciudad |
|---|---|---|
| `bogota-aeropuerto` | `AABOT` | bogota |
| `armenia-aeropuerto` | `AAARM` | armenia |
| `sede-que-no-existe` | — | no está en el store |

**Fechas.** Se expresan relativas a hoy para que no caduquen. Las pruebas unitarias las derivan de
`createCurrentDateObject()`, igual que `validateSearchParams.test.ts`. Los defaults del middleware
son mañana / mañana+7 a las `12:00pm` (`useDefaultRouteParams`).

**Alcance por marca.** `sede-ciudad` solo existe en alquilatucarro: es la corrección #129, que
requiere segmento de ciudad en la ruta. Alquilame y alquicarros sirven `/reservas` sin ciudad y la
saltan. Los escenarios que la usan son, por tanto, de alquilatucarro.

---

## SCEN-406-01: enlace compartido con sede inexistente avisa al abrirlo

Es el escenario del issue. Hoy falla: el 302 del servidor descarta el aviso y el navegador aterriza
en la URL corregida sin explicación.

**Given**: el store tiene `bogota-aeropuerto` → `AABOT`; `sede-que-no-existe` no resuelve.
**When**: el usuario abre en la barra de direcciones (carga dura, no navegación interna)
`/reservas/lugar-recogida/sede-que-no-existe/lugar-devolucion/bogota-aeropuerto/fecha-recogida/<hoy+53>/fecha-devolucion/<hoy+56>/hora-recogida/10:00/hora-devolucion/10:00`.
**Then**: aterriza en la URL corregida (`bogota-aeropuerto`, fechas por defecto) **y** ve
«Ubicación inválida. Se ajustó a la sede por defecto.». El aviso sigue en pantalla después de que la
consulta de disponibilidad responda — no basta con que nazca.
**Evidence**: nodo de toast con ese texto presente en el DOM 2 s después de `networkidle`; URL final
conteniendo `lugar-recogida/bogota-aeropuerto`. En unitario: el destino de `navigateTo` lleva
`query.aviso` = `'sede'`.
**Artefacto**: runtime en navegador + `validateSearchParams.test.ts` + test del drenaje en
`useSearchByRouteParams`.

---

## SCEN-406-02: el aviso sobrevive al flush de doSearch

**Given**: el usuario está en una página de resultados ya cargada con parámetros válidos.
**When**: navega en cliente (sin recarga) a la misma URL de SCEN-406-01.
**Then**: el aviso aparece y **sigue ahí** una vez que la búsqueda ya salió. Hoy vive 53 ms: nace a
los 25 ms y `flushMessages()` lo borra a los 78 ms.
**Evidence**: muestreo del DOM cada 25 ms; el nodo del toast está presente en un instante posterior
al POST a `/api/reservations/availability` — el POST prueba que `doSearch` corrió y que su flush ya
ocurrió. Un aviso presente sin que el flush haya pasado no satisface este escenario.
**Artefacto**: runtime en navegador + test del drenaje (orden: `createMessage` posterior a
`doSearch`).

---

## SCEN-406-03: el portador se limpia sin dejar rastro

**Given**: el usuario abre el enlace de SCEN-406-01 con `?utm_source=newsletter` añadido.
**When**: la página termina de montar y el aviso ya se mostró.
**Then**: la barra de direcciones ya no contiene `aviso`, pero conserva
`utm_source=newsletter`. No se añade entrada al historial (el botón Atrás sigue llevando a donde
llevaba). La búsqueda sale **una sola vez**: limpiar la URL no puede provocar una segunda consulta.
**Evidence**: `location.search` sin `aviso` y con `utm_source`; `history.length` idéntico antes y
después; exactamente 1 POST a `/api/reservations/availability`.
**Artefacto**: runtime en navegador (contador de POSTs sobre `fetch`) + test del drenaje.

---

## SCEN-406-04: un aviso inventado no se renderiza

**Given**: una URL de resultados con parámetros válidos.
**When**: el usuario le añade a mano `?aviso=<texto-arbitrario-que-no-es-un-código>`.
**Then**: no aparece ningún toast, y el texto arbitrario no llega al DOM por ninguna vía. La URL se
limpia igual: el parámetro desaparece aunque no se muestre nada.
**Evidence**: 0 llamadas a `createMessage`; el texto arbitrario ausente del DOM; `location.search`
sin `aviso`.
**Artefacto**: test del drenaje + runtime en navegador.

---

## SCEN-406-05: dos correcciones encadenadas producen dos avisos

Alquilatucarro. La corrección de ciudad (#129) conserva las fechas del usuario, así que puede
encadenar con el tope de 30 días. Sin acumulación, el segundo aviso pisaría al primero y el usuario
nunca sabría que le cambiaron la sede de recogida — el bug que este issue cierra, reintroducido por
la propia solución.

**Given**: la ruta es `/armenia/buscar-vehiculos/...`; el pickup apunta a `bogota-aeropuerto` (sede
ajena a la ciudad) y el rango es de 35 días.
**When**: el usuario abre esa URL en carga dura.
**Then**: recibe **los dos** avisos: «La sede de recogida no corresponde a la ciudad; se ajustó a la
sede por defecto.» y «La fecha de devolución ha sido ajustada a 30 días después de la fecha de
recogida.». Ninguno sustituye al otro.
**Evidence**: dos nodos de toast, uno por texto; en unitario, la query acumulada del segundo
`navigateTo` contiene los códigos `sede-ciudad` y `duracion`.
**Artefacto**: `validateSearchParams.test.ts` (cadena de dos pasadas) + runtime en navegador.

---

## SCEN-406-06: un deep-link válido no avisa de nada

No-regresión. La corrección solo habla cuando corrige.

**Given**: el store tiene `bogota-aeropuerto` → `AABOT`.
**When**: el usuario abre un deep-link con sede conocida, formato de hora 12h, fechas futuras y
rango de 3 días.
**Then**: no hay redirect, no hay ningún toast de corrección, y la URL no gana ningún parámetro.
**Evidence**: el middleware devuelve `undefined` y `navigateTo` no se invoca; 0 llamadas a
`createMessage`; `location.search` vacío.
**Artefacto**: `validateSearchParams.test.ts` + runtime en navegador.

---

## SCEN-406-07: el aviso de corrección convive con el de un guard

Alquilatucarro. La corrección de ciudad conserva las fechas, así que puede entregarle a `doSearch`
un rango de longitud cero, que aborta la búsqueda. Los dos mensajes hablan de cosas distintas —qué
se cambió del enlace, y por qué no hay cotización— y los dos son accionables.

**Given**: la ruta es `/armenia/buscar-vehiculos/...`; el pickup apunta a `bogota-aeropuerto` y la
fecha de devolución es igual a la de recogida.
**When**: el usuario abre esa URL.
**Then**: ve **ambos**: el aviso de sede ajena a la ciudad y «La fecha de devolución debe ser
posterior a la fecha de recogida.» del guard de `doSearch`. Que la búsqueda no saliera no silencia
la corrección de la URL.
**Evidence**: dos nodos de toast, uno por texto; ningún POST a `/api/reservations/availability`
(el guard abortó).
**Artefacto**: test del drenaje (emisión incondicional al resultado de `doSearch`) + runtime en
navegador.
