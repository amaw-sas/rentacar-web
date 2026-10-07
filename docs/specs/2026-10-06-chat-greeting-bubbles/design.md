# The teaser's two lines greet inside the empty chat

Date: 2026-10-06. Scope: `ChatConversation.vue` in the three brand packages.
Stacked on `diego-alex-melo/3-botones-de-la-web-pasarlo-a-1` (PR #506).

## Why

The proactive teaser shows two lines as if Alquie wrote them («¡Hola! 👋
¿Buscas carro? Escríbenos, respondemos ya.» → «¿Dudas de requisitos o precios?
Estamos en línea.») and the badge counts them (1, then 2). Opening the chat
shows neither: an empty conversation renders a gray placeholder paragraph with
DIFFERENT text («Pregúntame por ciudades…»). The «2» promise evaporates —
owner reported it 2026-10-06 and chose this fix: the visitor must SEE those
two messages inside the chat.

## Design

Replace the `cc-empty` placeholder: an empty conversation
(`messages.length === 0`) renders the two teaser lines as two assistant-styled
bubbles. Exact markup — one `<template v-if="!messages.length">` holding two
`<div class="cc-msg is-assistant" data-greeting>` (first also `is-group-start`:
the WhatsApp tail in alquilatucarro/alquicarros, extra top margin in alquilame,
whose skin has no tail pseudo-element). Text via plain `{{ }}` interpolation on
ONE template line (`.cc-msg` is `white-space: pre-wrap`; multiline template
text would render its indentation), no `renderChatMarkdown`, no `has-time`, no
`.cc-text` wrapper. `data-greeting` exists so tests can tell greeting bubbles
from real messages. Unconditionally — whether or not the teaser fired. Rationale:
no state plumbing between teaser and surface (the synthetic count is cleared
by `engage` before the surface mounts, and a "teaser was seen" flag would be
one more thing to desync), it covers mobile `/chat` direct entries, and the
lines are simply the brand greeting. A visitor who never saw the teaser gets
a correct greeting instead of today's gray filler.

Presentation only:

- The lines move to a tiny new module
  `packages/logic/src/utils/chatGreeting.ts` (the two constants + the plain
  screen-reader variant), and `useContactTeaser` RE-EXPORTS them so its three
  ChatWidget importers stay untouched. ChatConversation imports from
  `chatGreeting` only: it is lazy-loaded (`defineAsyncComponent`, enforced by
  `payload-bundle-contract.test.ts`) and must not drag the teaser module's
  analytics/storage imports into the chat chunk. The bundle-contract test
  arbitrates. Single source preserved: teaser copy changes still propagate.
- They are NOT pushed into `messages`, NOT written to the conversation
  storage, NOT sent to the server. The bot's context never sees them.
- They disappear exactly when the placeholder does today: as soon as the
  conversation has any real message. EXPLICITLY ACCEPTED: on the visitor's
  first send the greeting vanishes with their own action (their bubble +
  typing indicator take over) — natural transition; persisting it and
  removing it mid-conversation later would be worse. A TTL-expired or
  hidden-clear-gesture chat greets again (accepted: the bot greets again).
  If the first send errors, the user message stays in `messages`, so the
  greeting stays gone and the error surface shows — unchanged behavior.
- No change to unread/markRead, teaser timers, `aria-live` regions, or the
  «Mensajes nuevos» separator (it anchors to real messages only).

Brand deltas preserved: alquilatucarro ≡ alquicarros (byte-identical copies,
md5-verified 2026-10-06, pinned by `ChatConversation.parity.test.ts` — apply
the edit identically to both); alquilame keeps its own header (Camila avatar,
titles, input placeholder). The greeting MARKUP is identical in the 3; the
rendered look differs by skin. Note: alquilame's `.cc-empty` today is already
styled as "Camila's first message" bubble — its deletion is deliberate, the
`.is-assistant` rules provide the same white bubble with the 0.25rem corner.
If the parity test pins the `.cc-empty` rule text, re-express that pin.

## Blast radius

- `packages/ui-{alquilatucarro,alquicarros,alquilame}/app/components/ChatConversation.vue`
  (template: replace the `cc-empty` block; script: import the two constants;
  CSS: none — reuses bubble classes; the `.cc-empty` rule is removed with its
  markup).
- Tests: new per-brand greeting tests. KNOWN affected guards:
  `ChatConversation.clearGesture.mount.test.ts` (3 brands) asserts
  `.cc-msg` count 0 after the hidden clear — re-express over real messages
  only (e.g. `[data-mid]` or `:not([data-greeting])`), and extend it: after
  the clear, the greeting is BACK (empty chat greets again).
  `ChatConversation.parity.test.ts` (byte parity + alquilame skin pins).
  Anything else the suite surfaces gets re-expressed, not deleted.
- Consumers: `ChatWidget` panel and `/chat` page both render
  `ChatConversation` — both get the greeting for free. Dashboard, server,
  storage: untouched.

## Observable scenarios

- SCEN-G1 — Given an empty conversation on any brand (panel or /chat), when
  the chat surface renders, then exactly two assistant bubbles show, with
  TEASER_LINE_1 and TEASER_LINE_2 verbatim, first bubble with the group-start
  tail; the old gray placeholder text does not render.
- SCEN-G2 — Given the greeting is visible, when the visitor sends a message
  and the exchange completes, then the two greeting bubbles are gone, the
  conversation storage contains only the real messages, and the request
  payload to the chat endpoint contains no greeting text.
- SCEN-G3 — Given a conversation with existing messages (restored from
  storage), when the surface renders, then no greeting bubbles show.
- SCEN-G4 — Given the teaser fired and badged «2», when the visitor opens the
  chat, then what they see first is those same two lines as Alquie bubbles
  (continuity of the promise; builds on SCEN-G1).
- SCEN-G5 — Given the three brands, when the unit suite runs from the repo
  root, then all suites pass with any touched guard re-expressed.

## Runtime validation

SCEN-G4 is runtime-only by design (`engage` clears the synthetic count before
the surface mounts, so a component test cannot observe the badge→bubbles
continuity; it reduces to SCEN-G1 in jsdom). Orca embedded browser, one live
brand: teaser fires → badge 2 → open chat → the two bubbles are there, 👋
verbatim; desktop panel (544×704): header + two bubbles fit without overflow; send «probe» only if needed (1 h per-IP rate limit
— prefer not to consume it; DOM evidence suffices for G1/G3/G4, storage
inspection for G2's storage half).

## Out of scope

Seeding real messages, changing teaser copy or timers, the launcher (PR #506).
