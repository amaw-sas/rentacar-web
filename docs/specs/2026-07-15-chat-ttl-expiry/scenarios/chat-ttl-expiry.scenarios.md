---
name: chat-ttl-expiry
created_by: feat/chat-ttl-expiry
created_at: 2026-07-15T00:00:00Z
---

# Chat conversation TTL — local expiry after 15 days of inactivity

Stale conversations must not live forever in the customer's browser: quotes from
past seasons mislead, and old low-quality bot replies linger. After **15 days of
inactivity** (measured from the newest message's `createdAt`) the LOCAL copy is
wiped on singleton init and the chat starts fresh. The server-side Supabase
record is never touched — it remains the business record.

The TTL lives in one named constant (`CHAT_TTL_MS`, 15 days in ms) so it can be
tuned without hunting magic numbers.

Evidence source legend: `[unit]` — vitest in `packages/logic`.

---

## SCEN-001: conversation older than 15 days → fresh chat, keys cleared
**Given**: localStorage for brand `X` holds a transcript whose newest message
`createdAt` is 16 days ago, plus a `conversationId` and a `lastReadMessageId`
**When**: a new chat instance initializes (page load creates the singleton)
**Then**: `messages` is empty (the greeting/empty state shows), `conversationId`
is `null` (the next turn starts a NEW server conversation), and ALL
`rentacar-chat:X:*` keys (messages, conversationId, lastReadMessageId) are
removed from localStorage
**Evidence**: `[unit]` instance refs empty/null + `localStorage.getItem` returns null for the three keys

## SCEN-002: conversation 14 days old → everything intact
**Given**: localStorage for brand `X` holds a transcript whose newest message
`createdAt` is 14 days ago, with 1 unread assistant reply (marker behind it),
and a stored `conversationId`
**When**: a new chat instance initializes
**Then**: the full transcript restores, `unread === 1` (badge shows), and
`conversationId` is preserved so the server-side conversation continues
**Evidence**: `[unit]` messages length, unread value, conversationId value after init

## SCEN-003: an expired unread reply must NOT badge
**Given**: a reply landed while the chat was closed 16 days ago (unread marker
behind it — the badge would show 1 if restored)
**When**: a new chat instance initializes
**Then**: `unread === 0` and no aria-live announcement is set — expiry removes
the badge together with the transcript; the customer is never nagged about a
16-day-old reply
**Evidence**: `[unit]` `unread.value === 0` and `announce.value === ''` after init

## SCEN-004: legacy transcript without datable messages → treated as EXPIRED
**Given**: localStorage holds messages where NO message carries `createdAt`
(rows persisted before timestamps shipped — `createdAt` is optional for legacy
rows by design)
**When**: a new chat instance initializes
**Then**: the transcript is wiped like an expired one. Justification: every
transcript written since timestamps shipped stamps `createdAt` on each new
message, so a transcript whose NEWEST message lacks it predates that feature —
it is far older than any 15-day window, and "cannot be dated" must fail toward
the feature's goal (kill stale quotes), not toward keeping unbounded history
**Evidence**: `[unit]` messages empty + keys removed for an undatable transcript

## SCEN-005: empty or missing local data → nothing to expire, no crash
**Given**: localStorage has no chat keys for the brand (first visit), or an
empty messages array
**When**: a new chat instance initializes
**Then**: init completes normally with an empty conversation — no exception, no
spurious key writes/removals side effects visible to the user
**Evidence**: `[unit]` instance constructs with `messages.value = []`, `unread === 0`

## SCEN-006: expiry is local-only — the server is never called
**Given**: an expired transcript (16 days) in localStorage
**When**: the instance initializes and wipes the local copy
**Then**: no network request of any kind is made during init/expiry — the
Supabase business record is untouched; only the browser's localStorage changes
**Evidence**: `[unit]` a spied global `fetch` records zero calls across an expiring init

## SCEN-007: a mixed transcript is dated by its NEWEST message
**Given**: a transcript whose older messages are 20+ days old but whose newest
message `createdAt` is 2 days ago (an active long-running conversation)
**When**: a new chat instance initializes
**Then**: nothing expires — activity is measured from the most recent message,
never the oldest, so an ongoing conversation with old history survives
**Evidence**: `[unit]` full messages length preserved after init
