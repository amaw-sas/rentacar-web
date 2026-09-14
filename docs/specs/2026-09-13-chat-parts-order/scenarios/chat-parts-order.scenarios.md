---
name: chat-parts-order
created_by: orchestrator
created_at: 2026-09-13T00:00:00Z
---

# Chat: pieces in arrival order (v2), sede cards, large gama photos

Context: the dashboard chat (rentacar-dashboard, untouched here) will interleave text
and data pieces and add `data-sedeCards`. Production ALREADY interleaves today
(text→quoteTable→text→text; gamaCards→text; buttons→"…abajo"), so arrival order is
opt-in per message: the server sends `{"type":"data-partsOrder","data":{"v":2}}` as the
first piece. Without that marker every message renders exactly like today.

"Today's rendering" = `splitBubbles(message.text)` bubbles (text blocks joined with
`\n---\n` for blocks 2-3, `\n\n` beyond), and quote table → gama cards → action buttons
appended at the end of the LAST bubble.

Bubble rule (v2 only): a text block that starts right after another text block opens a
new bubble (max 3 bubbles; beyond that it folds into the last bubble). A data piece
between two text blocks does NOT open a bubble: it stays inside, in its place.

## SCEN-E1: today's format without marker renders like today
**Given**: an assistant turn streamed WITHOUT data-partsOrder: text "A", text "B", text "C", then data-quoteTable (2 rows), data-gamaCards (2 models), data-buttons {web, whatsapp}
**When**: the turn finishes and the chat renders it
**Then**: 3 assistant bubbles with texts A, B, C; the quote table, then the gama cards, then the buttons are inside the third bubble after "C"; the table footer reads "Total con IVA, tasas, seguro básico y km ilimitado."
**Evidence**: layoutChatBubbles output + mounted DOM order per brand (vitest), 360 px screenshot

## SCEN-E2: v2 text → table → text is one bubble in order
**Given**: data-partsOrder v2, text "Te cotizo:", data-quoteTable, text "¿Cuál te gusta?"
**When**: the turn finishes
**Then**: exactly 1 bubble whose children in order are: text "Te cotizo:", quote table, text "¿Cuál te gusta?"
**Evidence**: layoutChatBubbles blocks + mounted DOM order per brand, 360 px screenshot

## SCEN-E3: v2 text → cards → text → buttons → text is one bubble in order
**Given**: data-partsOrder v2, text "Modelos:", data-gamaCards, text "Reserva aquí:", data-buttons {web}, text "¿Algo más?"
**When**: the turn finishes
**Then**: 1 bubble: text, gama cards, text, buttons, text — in that order; tapping a card still quotes it in the composer as today
**Evidence**: layoutChatBubbles blocks + mounted DOM order + click → replyTo set, per brand

## SCEN-E4: v2 sede cards render in place
**Given**: data-partsOrder v2, text "Sedes en Bogotá:", data-sedeCards {sedes:[{code:"AABOT",nombre:"Bogotá Aeropuerto",horario:"Lun-Dom 6am-10pm"},{code:"ABCTR",nombre:"Bogotá Centro",horario:"Lun-Sáb 8am-6pm"}]}, text "¿Cuál te queda mejor?"
**When**: the turn finishes
**Then**: 1 bubble: text, a list of 2 sede cards (name emphasized, schedule below it), text; tapping a sede card does nothing
**Evidence**: mounted DOM per brand (names/schedules in order, no replyTo on click), 360 px screenshot

## SCEN-E5: consecutive text blocks still split bubbles
**Given**: text-start, delta "Hola", text-start, delta "¿Ciudad?" — once without marker and once with v2
**When**: the turn finishes
**Then**: 2 bubbles "Hola" and "¿Ciudad?" in both cases
**Evidence**: layoutChatBubbles output (vitest)

## SCEN-E6: transcripts saved before the change still load identically
**Given**: localStorage holds a transcript in today's stored shape (user message + assistant message with text "A\n---\nB", quoteTable, gamaCards, actions, createdAt; no parts/partsOrder)
**When**: the chat instance is created (page reload)
**Then**: messages load unchanged; the assistant renders 2 bubbles with the data at the end of the second, identical to today's layout; no error is thrown or logged
**Evidence**: new instance on the same stubbed storage + layout equality vs a reference implementation of today's layout; browser console with zero errors after reload

## SCEN-E7: v2 order survives reload
**Given**: a v2 interleaved turn (text → quoteTable → text) finished and was persisted
**When**: a new chat instance is created over the same localStorage (page reload)
**Then**: the restored message renders the same single bubble with text, table, text in that order
**Evidence**: layoutChatBubbles on the restored message (vitest) + browser reload screenshot

## SCEN-E8: empty sede cards and unknown data pieces render nothing
**Given**: v2 turn with data-sedeCards {} , data-sedeCards {sedes:[]}, and data-somethingUnknown {x:1} between texts
**When**: the turn finishes
**Then**: no sede list, no empty container, no crash; only the texts render (and no extra bubble is opened by the ignored pieces)
**Evidence**: layoutChatBubbles output + mounted DOM (no .cc-sedes), console without errors

## SCEN-E9: gama photos are large at 360 px
**Given**: a bubble with gama cards of 2 models with real photos, viewport 360 px wide
**When**: the chat renders
**Then**: each card spans the full inner width of the bubble, cards stack one below the other, each image shows its whole photo (height auto, no crop)
**Evidence**: 360 px screenshot per brand + measured card width ≈ bubble content width and image natural aspect ratio preserved

## SCEN-E10: production's interleaved flow without marker renders like today
**Given**: WITHOUT data-partsOrder: text "Ida y vuelta.", data-quoteTable, text "La más elegida es la C.", text "¿Cuál reservamos?"; and separately data-buttons {web}, text "Te dejo el enlace para reservar tú mismo abajo."
**When**: each turn finishes
**Then**: first turn → 3 bubbles with the table at the end of the third; second turn → 1 bubble with the text and the button BELOW it — identical to today
**Evidence**: layoutChatBubbles equality vs reference implementation of today's layout + mounted DOM, 360 px screenshot
