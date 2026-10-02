# Visitor context (phase 1) — observable scenarios

Source: ../../2026-10-01-chat-contexto-visitante-design.md (SCEN-01..SCEN-15, approved 2026-10-01).
Numbering: SCEN-0NN here == SCEN-NN in the spec. Translation only; no scenario weakened.

### SCEN-001: Google Ads origin
Given a visitor who lands on `/bogota?utm_source=google&gclid=x`
When they open the chat and send a message
Then the "Visitante" card shows "Google Ads", entry `/bogota`, their device type and their city.
Evidence: unit (buildVisitorSnapshot → attribution_channel `google_ads`, entry `/bogota`; card model renders label from CHANNEL_META); SQL `select visitor, attribution_channel from chat_conversations where id=…`; dashboard inbox check of the card.

### SCEN-002: Per-message page and trail
Given that visitor and `CHAT_VISITOR_CONTEXT` on
When they navigate to `/tarifas` and send another message
Then that message shows "desde /tarifas", the first one still shows "desde /bogota", and the trail contains both routes in order.
Evidence: route unit test (page_path passed to both write paths); web unit test (trail order); SQL `select page_path from chat_messages where conversation_id=… and role='user' order by created_at`; inbox thread check; browser network payload `context.trail` = ["/bogota","/tarifas"].

### SCEN-003: Direct
Given a visitor with no utm, click-id or external referrer
When they chat
Then the origin says "Directo".
Evidence: unit (snapshot with `{}` attribution → `direct`); card model test; inbox check.

### SCEN-004: Old conversation
Given a web conversation created before the deploy
When it is opened in the inbox
Then the card says "Sin datos: conversación anterior a esta función" and the page does not error.
Evidence: card model unit test (visitor null + channel web); live: open a pre-deploy conversation, zero console errors.

### SCEN-005: List filter
Given conversations with different origins
When the list is filtered by channel `tiktok_organic` (label "TikTok")
Then only those appear, and `tiktok_ads` ones are excluded.
Evidence: unit (parseListParams accepts `origen=tiktok_organic`; getConversationsPage issues `.eq('attribution_channel','tiktok_organic')`); live inbox filter + SQL count comparison.

### SCEN-006: Reservations untouched
Given a reservation closed by the bot
When it is created
Then its origin columns are identical to what was written before the change.
Evidence: route unit test (body with utm_campaign/landing_url/gbraid + context → orchestrator receives exactly the 8-key sanitizeAttribution output); sanitizeAttribution absent from the diff; live SQL on bot reservations after rollout.

### SCEN-007: Immutable snapshot
Given an existing conversation and `CHAT_VISITOR_CONTEXT` on
When the visitor sends more messages from other pages
Then `visitor` does not change and only `page_path` of the new messages changes.
Evidence: route unit test (continuation never calls the snapshot writer; writer uses `.is('visitor', null)`); SQL across turns.

### SCEN-008: Garbage context
Given a request whose `context` is malformed (paths without `/`, a 500-element array, wrong types)
When it reaches the server
Then the chat answers normally and only the valid parts are stored.
Evidence: sanitizeVisitorContext table tests; route unit test (200, appendMessages called, trail ≤ 10); live curl against preview.

### SCEN-009: Blocked storage
Given a browser where `sessionStorage` is inaccessible
When the visitor chats
Then the chat works and the trail arrives empty.
Evidence: web unit test (throwing storage → `{entry:null, trail:[]}`, never throws); browser check with storage blocked.

### SCEN-010: Zero errors
On alquilame and alquilatucarro, on the page with the chat, zero console errors and zero failed requests; in the inbox, the same.
Evidence: Orca embedded browser console + network on both brands and on the inbox list + detail.

### SCEN-011: WhatsApp
Given a WhatsApp conversation
When it is opened
Then the "Visitante" card does not appear.
Evidence: card model unit test (`channel='whatsapp'` → hidden); inbox check on a WhatsApp thread.

### SCEN-012: Snapshot write fails
Given the `visitor` update fails (missing column or database error)
When a visitor opens the chat
Then the conversation and all its messages are still stored and the card says "Sin datos".
Evidence: route unit test (writer rejects/throws → appendMessages still called, 200); log line `[chat] visitor snapshot failed`.

### SCEN-013: Flag off
Given `CHAT_VISITOR_CONTEXT` off
When a visitor chats
Then the message insert is identical to today's and `page_path` stays empty.
Evidence: persistence unit tests (insert rows toStrictEqual today's shape, no `page_path` key); route unit test; SQL `page_path is null` before flag-on.

### SCEN-014: Google organic
Given a visitor arriving from `google.com` without utm
When they chat
Then the card shows "Referido web · google.com".
Evidence: card model unit test (`referral` + referrer `https://www.google.com/`); live check via google.com referrer.

### SCEN-015: Entry without campaign
Given a direct visitor who enters on `/medellin` and then goes to `/tarifas`
When they chat
Then the entry is `/medellin` and "Página de la campaña" does not appear.
Evidence: web unit test (entry never overwritten); card model test (no landing_url → row absent); live inbox check.
