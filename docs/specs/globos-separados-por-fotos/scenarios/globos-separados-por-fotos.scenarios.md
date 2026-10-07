---
name: globos-separados-por-fotos
created_by: orchestrator
created_at: 2026-10-06T00:00:00Z
---

# Un texto que llega después de las FOTOS abre globo nuevo

Diego, 6-oct (con captura): al pedir dos gamas, el precio de cada una, sus fotos y el cierre salen
pegados en UN solo globo-muro. El servidor sí manda cada precio como texto aparte (dashboard PR
#685), pero el parser del widget solo marca `newBubble` cuando un texto viene justo después de otro
TEXTO (`useChatConversation.ts`, `lastPieceWasText`), así que el bloque de fotos de por medio pega
los textos.

Decisión de Diego (6-oct, con vista previa): separar SOLO después de bloques de fotos
(`data-gamaCards`). La cotización con tabla y la lista de sedes quedan EXACTAMENTE como hoy.

Las burbujas de la Evidencia son las que devuelve `layoutChatBubbles` para un mensaje `partsOrder
v2` con los `parts` descritos.

## SCEN-001: dos gamas → tres globos
**Given**: un mensaje v2 cuyos parts son [texto "Gama C (Compacto mecánico): $700.000 por los 4
días.", gamaCards de la C, texto "Gama FX (Sedán automático): $888.000 por los 4 días.", gamaCards
de la FX, texto del cierre "...¿Con cuál seguimos, la C o la FX?"], con las marcas que el parser
calcula para ese stream
**When**: se arma el layout del mensaje
**Then**: salen 3 burbujas: [precio C + fotos C], [precio FX + fotos FX], [cierre solo]
**Evidence**: las burbujas que devuelve `layoutChatBubbles` (bloques por burbuja)

## SCEN-002: gama única → dos globos
**Given**: parts v2 [texto de la ficha, gamaCards, texto de la oferta]
**When**: se arma el layout
**Then**: 2 burbujas: [ficha + fotos], [oferta]. Cambio aceptado por Diego en la vista previa
**Evidence**: las burbujas de `layoutChatBubbles`

## SCEN-003: la cotización con tabla NO cambia
**Given**: parts v2 [texto del resumen, quoteTable, texto del cierre]
**When**: se arma el layout
**Then**: 1 sola burbuja, exactamente como hoy — este escenario protege el alcance que Diego
escogió: un dato que no es fotos sigue pegando
**Evidence**: las burbujas de `layoutChatBubbles`

## SCEN-004: la lista de sedes NO cambia
**Given**: parts v2 [texto, sedeCards, texto]
**When**: se arma el layout
**Then**: 1 sola burbuja, como hoy
**Evidence**: las burbujas de `layoutChatBubbles`

## SCEN-005: tres gamas → tres globos y el cierre entra al tercero
**Given**: parts v2 de tres pares precio+fotos y el texto del cierre (4 textos en total)
**When**: se arma el layout
**Then**: 3 burbujas (el tope `MAX_TEXT_BUBBLES` no se toca): [par 1], [par 2], [par 3 + cierre
después de sus fotos]. Hoy TODO es un muro, así que el tope no empeora nada
**Evidence**: las burbujas de `layoutChatBubbles`

> **Superseded in part**, decisión del dueño 2026-10-06 (Diego, con vista previa, el mismo día del
> contrato): en la prueba en vivo el globo explicativo del redactor sumaba un 4º texto y el tope de
> 3 pegaba el cierre bajo las fotos de la última gama. El tope sube a 6: tres gamas → 4 burbujas
> ([par 1], [par 2], [par 3], [cierre]), y el cierre de dos gamas sale aparte aun con el globo
> explicativo delante. El resto del escenario (un par por gama, en orden) queda igual.

## SCEN-006: lo guardado y lo legacy no se mueven
**Given**: un mensaje restaurado de localStorage con marcas `newBubble` ya calculadas por la regla
vieja, y un mensaje sin `partsOrder v2`
**When**: se arma el layout de cada uno
**Then**: se pintan igual que hoy — la regla nueva vive en el parser y solo alcanza a los turnos
nuevos; el layout no recalcula marcas
**Evidence**: la suite existente de `layoutChatBubbles` y de `useChatConversation.partsOrder`
verde, con las únicas sustituciones declaradas siendo las que ponen gamaCards entre textos
