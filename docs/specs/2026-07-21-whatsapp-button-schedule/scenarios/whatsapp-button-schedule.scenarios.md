---
name: whatsapp-button-schedule
created_by: diego
created_at: 2026-07-21T00:00:00Z
---

# Horario de visibilidad del botón WhatsApp del FAB de contacto

El FAB de contacto ofrece tres vías: Chat, WhatsApp y Llamar. La vía WhatsApp se
mostraba siempre, incluso de madrugada, cuando no hay nadie atendiendo el canal.
El operador ahora configura por marca ventanas de visibilidad desde el dashboard
(`/chat-knowledge`), que viajan al widget en el mismo `GET /api/chat/status?brand=`
que ya gobierna el switch del chat, como campo aditivo `whatsappSchedule`.

Las ventanas son **de visibilidad** (cuándo SE MUESTRA), en hora civil de Bogotá
(UTC−5, sin horario de verano). El productor del contrato es `rentacar-dashboard`
(rama `diego-alex-melo/whatsapp-schedule-dash`,
`lib/schemas/whatsapp-schedule.ts`), que valida el jsonb antes de servirlo.

Alcance: **solo el `<li>` de WhatsApp del FAB**. Las otras ~8 puertas a WhatsApp
por marca (header, footer, hero, FAQ) quedan sin gate a propósito; ver
`docs/audit-workspace/whatsapp-schedule/decisions-web.md`.

Horario de referencia usado abajo ("estándar"): L-V `08:00-18:00`,
sábado `07:00-16:00`, domingo sin ventana.

## SCEN-001 (S1): dentro de la ventana, WhatsApp se ofrece
**Given**: la marca tiene horario estándar y el reloj marca martes 10:00 en Bogotá
**When**: el visitante abre el FAB de contacto
**Then**: el menú lista `Chat 24 horas`, `WhatsApp` y `Llámanos`, y el enlace
`wa.me` está presente en el DOM
**Evidence**: `whatsappVisibility.test.ts` → "Tuesday 10:00 Bogota is inside the
window"; `ChatWidget.whatsappSchedule.test.ts` → "renders WhatsApp inside the
window" afirma `['Chat 24 horas','WhatsApp','Llámanos']` sobre el DOM montado

## SCEN-002 (S2): fuera de la ventana, WhatsApp desaparece y el resto queda intacto
**Given**: la marca tiene horario estándar y el reloj marca martes 20:00 en Bogotá
(igual para sábado 17:00 y domingo 11:00, que caen fuera)
**When**: el visitante abre el FAB de contacto
**Then**: el menú lista solo `Chat 24 horas` y `Llámanos`; no queda ningún enlace
`wa.me` en el FAB; la vía Llamar conserva su `tel:` y su `aria-label`, y el chat
sigue gobernado por su propio switch
**Evidence**: `whatsappVisibility.test.ts` → casos martes 20:00 / sábado 17:00 /
domingo 11:00; `ChatWidget.whatsappSchedule.test.ts` → "removes the WhatsApp
option outside the window, keeping Chat and Llámanos" (0 nodos `a[href*="wa.me"]`)
y "leaves the Call option ungated"

## SCEN-003 (S4): sin horario configurado, nada cambia
**Given**: la respuesta del endpoint trae `whatsappSchedule: null` (o no trae el
campo, que es lo que producción sirve mientras el dashboard no se despliegue)
**When**: el visitante abre el FAB a cualquier hora, incluida una que un horario
habría cerrado
**Then**: WhatsApp se muestra siempre — comportamiento idéntico al anterior a esta
funcionalidad
**Evidence**: `whatsappVisibility.test.ts` → "null schedule → always visible";
`chatStatusContract.test.ts` → "DOCUMENTED GAP: a legacy response without the
field leaves WhatsApp always visible"; `ChatWidget.whatsappSchedule.test.ts` →
"keeps WhatsApp visible when no schedule is configured (null)"

## SCEN-004 (S5): las ventanas no cruzan la medianoche
**Given**: horario con sábado `07:00-16:00` y domingo sin ventana
**When**: el reloj marca domingo 02:00 en Bogotá
**Then**: WhatsApp está oculto — la ventana del sábado no se derrama en la
madrugada del domingo. Lo mismo para un cierre `24:00`: cubre hasta las 23:59 del
propio día y no abre el día siguiente
**Evidence**: `whatsappVisibility.test.ts` → "Saturday 07:00–16:00 with Sunday
closed → Sunday 02:00 Bogota is hidden" y "a 24:00 close does not leak into the
next day"

## SCEN-005: un horario guardado y vacío oculta toda la semana
**Given**: el operador guarda un horario sin ninguna ventana (`{}` en el jsonb)
**When**: el visitante abre el FAB cualquier día de la semana
**Then**: WhatsApp está oculto los siete días — guardar un horario sin ventanas
significa "nunca", no "siempre"
**Evidence**: `whatsappVisibility.test.ts` → bloque "{} is a valid schedule →
hidden ALL week", un caso por día; `chatStatusContract.test.ts` → "whatsappSchedule:
{} is a valid empty schedule → hidden all week"

## SCEN-006 (D9): una forma que no sabemos leer nunca esconde el botón
**Given**: el endpoint devuelve un objeto no vacío que no nombra ningún día que el
lector entienda (`{monday:[…]}`, `{lunes:[…]}`, `{version:2,days:{…}}`) — por
ejemplo tras un rename de claves en el productor
**When**: el visitante abre el FAB a cualquier hora
**Then**: WhatsApp se muestra. Una forma ilegible es un fallo de contrato, no un
horario que cierra todos los días; interpretarla como "cerrado" borraría el botón
en silencio. Basta con que aparezca UN día reconocible para que el objeto vuelva a
evaluarse como horario normal
**Evidence**: `whatsappVisibility.test.ts` → bloque "unreadable key shapes fail
OPEN (D9)", incluido "a single recognized weekday makes the object readable again"

## SCEN-007 (D6): un rango con typo no abre el día
**Given**: un horario por lo demás válido contiene un rango mal escrito
(`'8:00-16:00'`, sin el cero inicial)
**When**: el visitante abre el FAB a una hora fuera de las ventanas bien formadas
**Then**: WhatsApp está oculto — el rango inválido simplemente no abre ninguna
ventana, y los rangos válidos que lo acompañan siguen funcionando
**Evidence**: `whatsappVisibility.test.ts` → bloque "malformed ranges are IGNORED,
not fail-open", incluido el contraejemplo del revisor `{sun:['8:00-16:00']}` a las
03:00 del domingo

## SCEN-008: un fallo de red nunca hace desaparecer el botón
**Given**: el endpoint responde 500, no resuelve, o el `apiBase` está caído
**When**: el visitante abre el FAB
**Then**: WhatsApp se muestra (fail-open), a diferencia del chat, que es
fail-closed y se oculta. Un error transitorio posterior conserva el último horario
autoritativo en lugar de resucitar el botón
**Evidence**: `useChatStatus.whatsappVisible.test.ts` → "starts visible and stays
visible when the very first fetch rejects" y "keeps the last-known schedule … when
a refocus rejects"; `ChatWidget.whatsappSchedule.test.ts` → "keeps WhatsApp
visible when the request fails (fail-open)"

## SCEN-009: la visibilidad se mantiene al día sin recargar
**Given**: el visitante tiene la pestaña abierta y la ventana de visibilidad se
cierra mientras tanto
**When**: pasa el minuto siguiente, o el visitante vuelve a la pestaña tras dejarla
en segundo plano
**Then**: la opción WhatsApp desaparece sin recargar la página — por el temporizador
de 60 s, por la revalidación en `focus`, o por `visibilitychange` (que cubre el móvil,
donde los temporizadores de fondo se estrangulan y `focus` no siempre dispara)
**Evidence**: `useChatStatus.whatsappVisible.test.ts` → "flips visible → hidden at
the window boundary without another fetch", bloque "visibilitychange (D7)" y
"applies a schedule edit picked up on refocus"; `ChatWidget.whatsappSchedule.test.ts`
→ "closes the option on the 60s tick when the window ends"

## SCEN-010: el contrato con el dashboard falla ruidosamente si se rompe
**Given**: el productor deja de servir `whatsappSchedule`, lo serializa distinto
(string/array), renombra las claves de día o cambia la gramática de los rangos
**When**: se corre la suite
**Then**: el test de contrato falla con un mensaje que nombra la rama productora y
el archivo concreto, en vez de que la funcionalidad se degrade a no-op en silencio
**Evidence**: `chatStatusContract.test.ts` contra
`fixtures/chat-status.contract.json`; verificado en rojo-verde — al quitar el campo
del fixture caen 5 aserciones con `CONTRACT BROKEN: …`
