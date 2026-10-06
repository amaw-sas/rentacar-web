# Chat option buttons (`data-buttons.opciones`)

The brain can send ACTION buttons next to the link buttons inside the same
`data-buttons` part: `{ opciones: ["Quiero reservar", "Quiero ver fotos", "Tengo preguntas"] }`.

## SCEN-001: options-only part renders three same-colored buttons in order
**Given** an assistant turn whose stream carries `data-buttons {opciones:[A,B,C]}` and no `web`/`whatsapp`/`share`
**When** the turn finishes
**Then** the bubble shows 3 buttons labeled A, B, C in that order, all with the same class/color, and the part is not dropped

## SCEN-002: tapping an option sends its exact text as the user's message
**Given** the last assistant message shows options A, B, C and nothing is streaming
**When** the customer taps B
**Then** a user message with text exactly B is appended and sent to the endpoint (same path as typing it), and the bot's reply streams in

## SCEN-003: the option row disables after a tap (no double send)
**Given** the customer tapped an option
**When** they tap the same or another option again (during or after the reply)
**Then** no second message is sent; options on any message that is not the latest assistant message are disabled, also after reload

## SCEN-004: whatsapp + opciones together render both
**Given** a `data-buttons {whatsapp:URL, opciones:[A,B,C]}` part
**When** the turn finishes
**Then** the "Escribir a un asesor" link AND the 3 option buttons render

## SCEN-005: legacy web + share unchanged
**Given** a stored or streamed message with `actions {web, share}` (booking-failure / link on request)
**When** it renders
**Then** it shows exactly the same two links, classes and order as before this change

## SCEN-006: bold markdown renders without asterisks
**Given** bot text `**¿Te ayudo a realizar la reserva?**`
**When** it renders
**Then** the HTML is `<strong>¿Te ayudo a realizar la reserva?</strong>` with no `*`

## SCEN-007: malformed opciones never break the bubble
**Given** `opciones` containing non-strings / empty strings (stream or corrupt storage)
**When** it renders
**Then** only non-empty string entries render; with none left, the part behaves as before (dropped if no links)

## SCEN-008: the quote table has no header of its own
**Given** a `data-quoteTable {dias:4, horaRecogida, horaDevolucion, filas:[…]}` part
**When** it renders
**Then** the card shows only the gama rows: no "4 día(s)" line and no "recoge … entrega …" text (the bot's text already says pickup, return and total)

## SCEN-009: the quote table has no footer of its own
**Given** the same `data-quoteTable` part
**When** it renders
**Then** the card has no "Total con IVA, tasas, seguro básico y km ilimitado." line (the bot's text below already says it); rows stay tappable to quote a gama
