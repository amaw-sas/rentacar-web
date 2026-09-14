---
name: chat-sede-reply
created_by: orchestrator
created_at: 2026-09-14T00:00:00Z
---

# Chat: replying to a sede card

Owner decision (2026-09-14): sede cards become replyable like gama cards. This
supersedes ONLY the "tapping a sede card does nothing" clause of SCEN-E4 in
chat-parts-order.scenarios.md; the rest of SCEN-E4 (in-place list, name emphasized,
schedule below) stands.

Quote contract, identical in the 3 brands:
- context (travels with the message, exact): `[El cliente responde sobre la sede ${nombre}.]`
- preview: `Sede ${nombre}` · author: `Asesora` · targetId: the assistant message id

## SCEN-E11: tapping a sede card quotes it and the sent message carries the context
**Given**: a v2 assistant turn rendered with data-sedeCards {sedes:[{code:"ACCLO",nombre:"Cali Aeropuerto",horario:"Lun-Dom 6am-10pm"}]}
**When**: the customer taps the "Cali Aeropuerto" card, types "esta" and sends
**Then**: before sending, the reply card above the composer shows author "Asesora" and "Sede Cali Aeropuerto"; the request's last user message text is exactly "[El cliente responde sobre la sede Cali Aeropuerto.]\nesta"; the sent user bubble shows the quote "Sede Cali Aeropuerto"
**Evidence**: mounted DOM of .cc-reply-bar before submit + captured fetch body per brand (vitest), runtime screenshot of the composer quote

## SCEN-E11b: swiping a sede card and keyboard activation quote it the same way
**Given**: the same rendered sede card
**When**: the customer swipes it right past the reply threshold, or focuses it and presses Enter
**Then**: the composer quote is identical to SCEN-E11 (same context, preview, author, targetId)
**Evidence**: mounted DOM + instance.replyTo per brand (vitest)
