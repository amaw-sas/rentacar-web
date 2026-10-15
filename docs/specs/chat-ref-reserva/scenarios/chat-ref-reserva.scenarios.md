---
name: chat-ref-reserva
created_by: orchestrator
created_at: 2026-10-14T00:00:00Z
---

# El número de la conversación del bot viaja con la reserva

El bot (WhatsApp o chat web, desde el tablero) manda al cliente un enlace del embudo con
`?chat=<uuid>` en la query. El tablero quiere abrir esa conversación desde la reserva, así
que la web debe guardar ese valor al aterrizar, hacerlo sobrevivir a todo el embudo y a las
recargas, y mandarlo como `chat_ref` en el body de `POST /api/reservations`. Nunca lo ve el
cliente, nunca bloquea la reserva, nunca se valida en la web (lo valida el servidor).

Patrón de referencia: la atribución de marketing (`rentacar_attribution` en `localStorage`,
30 días, el último toque gana). `referido` NO sirve de patrón: vive solo en memoria y muere
con la recarga.

## SCEN-001: entrar con `?chat=` y reservar manda `chat_ref`
**Given**: un visitante abre `https://alquilatucarro.com/bogota/buscar-vehiculos/referido/valeria-bot/lugar-recogida/bogota-aeropuerto/.../categoria/c?chat=4f2a91ce-1234-4abc-9def-0123456789ab`
**When**: recorre el embudo (gama, datos, confirmar) y se dispara `POST /api/reservations/record`
**Then**: el body JSON lleva `"chat_ref": "4f2a91ce-1234-4abc-9def-0123456789ab"` como campo de primer nivel; ningún otro campo cambia
**Evidence**: cuerpo de la petición en la pestaña Network (o `$fetch` interceptado) con la clave `chat_ref` y el uuid exacto; `localStorage.rentacar_chat_ref` con ese valor

## SCEN-002: sin `?chat=` el body no lleva la clave
**Given**: un visitante entra a cualquier página sin `chat` en la URL y nunca tuvo uno guardado
**When**: reserva
**Then**: el body NO tiene la clave `chat_ref` (ni `null`, ni `""`, ni `undefined` serializado)
**Evidence**: `Object.keys(body)` sin `chat_ref`; `'chat_ref' in body === false`

## SCEN-003: la recarga a mitad del embudo no pierde el valor
**Given**: el visitante entró con `?chat=4f2a...` y ya está en el paso de datos, cuya URL ya no trae `chat`
**When**: recarga la página (F5) y termina la reserva
**Then**: el body sigue llevando `chat_ref: "4f2a..."`
**Evidence**: tras la recarga `localStorage.rentacar_chat_ref` conserva el valor y la petición lo lleva

## SCEN-004: un `chat` posterior reemplaza al anterior
**Given**: el visitante entró con `?chat=aaaa-1111` y lo tiene guardado
**When**: más tarde abre otro enlace con `?chat=bbbb-2222` (carga completa o navegación dentro de la app) y reserva
**Then**: el body lleva `chat_ref: "bbbb-2222"`, nunca `aaaa-1111`
**Evidence**: `localStorage.rentacar_chat_ref` = `bbbb-2222`; body con ese valor

## SCEN-005: navegar sin `chat` no borra el guardado
**Given**: `chat=4f2a...` guardado
**When**: el visitante navega por páginas sin `chat` en la URL (portada, blog, búsqueda)
**Then**: el valor guardado sigue siendo `4f2a...`
**Evidence**: `localStorage.rentacar_chat_ref` intacto; body con `4f2a...` al reservar

## SCEN-006: `chat` vacío o solo espacios cuenta como ausente
**Given**: la URL trae `?chat=` o `?chat=%20%20`
**When**: aterriza y reserva
**Then**: no se guarda nada nuevo y el body no lleva `chat_ref` (si no había uno previo); si había uno previo, se conserva
**Evidence**: `localStorage.rentacar_chat_ref` sin cambios; body sin la clave o con el valor previo

## SCEN-007: la web no valida el formato
**Given**: la URL trae `?chat=lo-que-sea-123`
**When**: reserva
**Then**: el body lleva `chat_ref: "lo-que-sea-123"` tal cual (recortado de espacios); el servidor decide
**Evidence**: body con el valor literal

## SCEN-008: storage bloqueado no rompe nada
**Given**: navegador en privacidad estricta donde `localStorage` lanza al acceder
**When**: aterriza con `?chat=4f2a...` y reserva en la misma sesión sin recargar
**Then**: la página hidrata sin errores en consola; la reserva se envía; `chat_ref` va con `4f2a...` porque el store en memoria lo tiene
**Evidence**: cero errores en consola; body con `chat_ref`

## SCEN-009: el valor caduca a los 30 días
**Given**: `chat` guardado hace 31 días
**When**: el visitante vuelve sin `chat` y reserva
**Then**: el body no lleva `chat_ref`
**Evidence**: `readStoredChatRef(now)` devuelve `null` y borra la clave; body sin `chat_ref`

## SCEN-010: la reserva confirmada no borra el valor
**Given**: `chat=4f2a...` guardado y una reserva ya confirmada
**When**: el operador vuelve atrás y hace una segunda reserva para la misma conversación
**Then**: la segunda también lleva `chat_ref: "4f2a..."`
**Evidence**: `resetAfterReservation` deja `chatRef` intacto en el store; segunda petición con la clave

## SCEN-011: el nombre del campo es `chat_ref`, nunca `chat_conversation_id`
**Given**: cualquier reserva con `chat` guardado
**When**: se arma el body
**Then**: la clave es exactamente `chat_ref`; `chat_conversation_id` no aparece
**Evidence**: `Object.keys(body)` contiene `chat_ref` y no `chat_conversation_id`

## SCEN-012: las tres marcas capturan igual
**Given**: alquilatucarro, alquilame y alquicarros
**When**: se aterriza con `?chat=` en cada una
**Then**: las tres guardan y mandan `chat_ref`
**Evidence**: los tres plugins `attribution.client.ts` llaman la misma acción del store; prueba de paridad entre los tres archivos
