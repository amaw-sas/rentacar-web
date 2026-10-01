# Implementation plan — chat visitor context (phase 1)

Spec: ../../2026-10-01-chat-contexto-visitante-design.md (approved 2026-10-01).
Scenarios: ../scenarios/visitor-context.scenarios.md (SCEN-001..015).
Method: SDD — per step: scenario → failing test → code → green.
Dashboard work happens in a git worktree branched from `origin/main` (the main dashboard checkout is on `scen-lote-18-la-hora`; never touch it).

## File map

| Repo | File | Responsibility |
|---|---|---|
| [dashboard] | supabase/migrations/<server-version>_179_chat_visitor_context.sql | Written by the apply_migration hook — visitor jsonb, attribution_channel text + index, chat_messages.page_path |
| [dashboard] | supabase/applied-prod.tsv | Ledger row for 179 (refreshed by the hook) |
| [dashboard] | lib/chat/user-agent.ts (new) | `parseUserAgent(ua) → {type:'movil'\|'tablet'\|'escritorio', os, browser} \| null`; raw string never returned |
| [dashboard] | lib/chat/visitor-context.ts (new) | `sanitizeVisitorContext`, `sanitizeVisitorAttribution`, `readVisitorGeo`, `buildVisitorSnapshot`, `writeVisitorSnapshot` |
| [dashboard] | lib/chat/flags.ts | `visitorContextEnabled()` = `chatFlag("CHAT_VISITOR_CONTEXT")` |
| [dashboard] | lib/chat/persistence.ts | `PersistedMessage.page_path?`; appendMessages / appendUserMessageReturning add `page_path` only when provided |
| [dashboard] | app/api/chat/route.ts | `ChatBody.context?`; snapshot after createConversation (guarded); page_path into both user-message writes behind the flag |
| [dashboard] | lib/queries/chat-conversations.ts | `ConversationRow.visitor/attribution_channel`, `ConversationMessage.page_path`; `.eq('attribution_channel', …)` |
| [dashboard] | lib/chat/list-params.ts | `attributionChannel` from `?origen=`, validated against ATTRIBUTION_CHANNEL_SET |
| [dashboard] | hooks/use-conversations-table-url-state.ts | `origen` filter key in URL state |
| [dashboard] | lib/chat/visitor-view.ts (new) | Pure card model: hidden / empty / rows; labels from CHANNEL_META; referrer domain; "No disponible" |
| [dashboard] | app/(dashboard)/conversations/[id]/visitor-card.tsx (new) | Server component rendering the "Visitante" card from the model |
| [dashboard] | app/(dashboard)/conversations/[id]/page.tsx | Mounts the card above "Revisión" |
| [dashboard] | app/(dashboard)/conversations/chat-thread.tsx | "desde /x" under user messages with page_path |
| [dashboard] | app/(dashboard)/conversations/columns.tsx | "Origen" column with channelMeta badge |
| [dashboard] | app/(dashboard)/conversations/conversations-table.tsx | Origin Select filter |
| [dashboard] | docs/chat-flags-inventory.md | Inventory row for CHAT_VISITOR_CONTEXT |
| [dashboard] | tests/unit/chat/{user-agent,visitor-context,route-visitor-context,persistence,conversations-query,visitor-view}.test.ts; tests/unit/components/{conversations-columns,chat-thread-page-path}.test.tsx; tests/unit/hooks/use-conversations-table-url-state.test.ts | Tests per step (written first) |
| [web] | packages/logic/src/utils/visitorTrail.ts (new) | Pure `recordVisit(path, storage)`, `readVisitorTrail(storage)`, `buildChatContext()`; entry + last 10, no consecutive repeats, try/catch |
| [web] | packages/logic/src/utils/index.ts | Export visitorTrail |
| [web] | packages/logic/plugins/visitor-trail.client.ts (new) | Shared-layer client plugin: records initial path + `router.afterEach` |
| [web] | packages/logic/src/composables/useChatConversation.ts | POST body adds `context: buildChatContext()` |
| [web] | packages/logic/src/utils/__tests__/visitorTrail.test.ts, packages/logic/tests/visitor-trail-plugin.test.ts, packages/logic/src/composables/__tests__/useChatConversation.context.test.ts | Tests (written first) |

## Steps

1. Migration 179 (additive columns + index) + row types | Size: S | dashboard | none | SCEN-001, 002, 005, 007
2. UA parser + visitor-context pure module | Size: M | dashboard | 1 | SCEN-001, 003, 008, 014, 015
3. Route writes the snapshot once after createConversation, guarded | Size: M | dashboard | 2 | SCEN-001, 006, 007, 012
4. Flag CHAT_VISITOR_CONTEXT + page_path on both user-message write paths | Size: M | dashboard | 2, 3 | SCEN-002, 007, 013
5. Card model `visitor-view.ts` (pure) | Size: S | dashboard | 1 | SCEN-001, 003, 004, 011, 012, 014, 015
5b. "Visitante" card component + mount on detail | Size: S | dashboard | 5 | SCEN-001, 004, 011
6. "desde /x" under customer messages | Size: S | dashboard | 1 | SCEN-002
7. "Origen" list column + channel filter | Size: M | dashboard | 1 | SCEN-005
8. Web: session trail util + shared-layer plugin | Size: M | web | none | SCEN-002, 009, 015
9. Web: POST carries `context` | Size: S | web | 8 | SCEN-002, 008, 009, 010
10. Rollout + live verification | Size: M | both | 1–9 | all

## Chunk 1: Dashboard data + API

### Step 1 — Migration 179 + types
Behavior: the schema can hold a visitor snapshot per conversation and a page per message; existing rows stay null.
Files: migration (via hook), applied-prod.tsv, lib/queries/chat-conversations.ts (`visitor: VisitorSnapshot | null`, `attribution_channel: string | null` on ConversationRow; `page_path: string | null` on ConversationMessage).
Tests first: none fails first — a migration has no behavior of its own. Column existence is proven by the `execute_sql` check below, and the type shape by `pnpm type-check`; `ledger-drift` must stay green (`pnpm db:ledger --check` confirms no `frozen.tsv` change is needed).
SQL outline (apply_migration name `179_chat_visitor_context`):

```sql
-- 179 · contexto del visitante en el chat web (fase 1). Diseño: rentacar-web docs/specs/2026-10-01-chat-contexto-visitante-design.md
-- Sin CHECK a propósito: page_path entra en el insert crítico de chat_messages; el saneo vive en la API.
-- Deshacer: drop index if exists public.idx_chat_conversations_attribution_channel;
--   alter table public.chat_conversations drop column if exists visitor, drop column if exists attribution_channel;
--   alter table public.chat_messages drop column if exists page_path;
alter table public.chat_conversations
  add column if not exists visitor jsonb,
  add column if not exists attribution_channel text;
create index if not exists idx_chat_conversations_attribution_channel
  on public.chat_conversations (attribution_channel, last_activity_at desc, id)
  where attribution_channel is not null;
alter table public.chat_messages add column if not exists page_path text;
```

Re-check 179 is free in BOTH `supabase/applied-prod.tsv` and `supabase/migrations/` right before applying (docs/db/migraciones.md).
Acceptance: `pnpm vitest run tests/unit/migrations/ledger-drift.test.ts && pnpm db:ledger --check && pnpm type-check`; `execute_sql` on information_schema returns the 3 columns.

### Step 2 — UA parser + visitor-context module
Behavior: request body + headers → sanitized snapshot `{ v:1, attribution, attribution_channel, entry, trail, page, device, geo, captured_at }`; garbage dropped, never thrown.
- `sanitizeVisitorContext(raw)`: string path kept only if it starts with `/` and length ≤ 200; trail = first 10 valid items of an array; anything else → null/[].
- `sanitizeVisitorAttribution(raw)`: the 8 reservation keys + utm_campaign, utm_term, utm_content, landing_url, gbraid, wbraid; strings only, capped 512. `sanitizeAttribution` in route.ts NOT touched.
- `attribution_channel = deriveAttributionChannel(sanitizeVisitorAttribution(body.attribution))`; undefined body attribution → null.
- `readVisitorGeo(headers)`: city = `decodeURIComponent(x-vercel-ip-city)` in try (raw on decode error), region `x-vercel-ip-country-region`, country `x-vercel-ip-country`; missing → null.
- `parseUserAgent`: tablet if /iPad|Tablet|Android(?!.*Mobile)/; movil if /Mobi|iPhone|iPod|Android/; else escritorio. OS: iOS, Android, Windows, macOS, ChromeOS, Linux. Browser: Edge (Edg/), Samsung Internet, Opera (OPR/), Firefox (Firefox|FxiOS), Chrome (Chrome|CriOS), Safari, in-app (Instagram, FBAN/FBAV, TikTok); unknown → null. Empty UA → null. In-house regex: UAParser.js v2 is AGPLv3 (Context7) — ruled out.
- `buildVisitorSnapshot({ body, headers, now })` wrapped in try/catch → null on failure.
Tests first: `tests/unit/chat/user-agent.test.ts` (iPhone Safari, Android Chrome mobile, Samsung tablet, iPad, Windows Edge, Mac Chrome, Instagram in-app, empty) and `tests/unit/chat/visitor-context.test.ts` (path rules, 500-item trail → 10, wrong types dropped, "Bogot%C3%A1" → "Bogotá", extra attribution keys kept, snapshot never contains raw UA or IP).
Acceptance: `pnpm vitest run tests/unit/chat/user-agent.test.ts tests/unit/chat/visitor-context.test.ts`.

### Step 3 — Route writes the snapshot once
Behavior: first message opens a conversation → server writes `visitor` + `attribution_channel` in one separate update; continuation messages never write it; failure never blocks the thread.
Files: route.ts (`context?: unknown` on ChatBody; right after the createConversation block, only when a NEW id was minted: `try { const snap = buildVisitorSnapshot(...); if (snap) await writeVisitorSnapshot(conversationId, snap) } catch (e) { console.error("[chat] visitor snapshot failed", e) }`). **Awaited, not fire-and-forget**: an un-awaited promise can be cut off when the serverless invocation ends. It sits on the first message's critical path, so bound it with a ~1.5 s timeout (race; on timeout log and continue). Cost: one update on the first message only. visitor-context.ts `writeVisitorSnapshot(id, snap, client = createAdminClient())`: `update({ visitor: snap, attribution_channel: snap.attribution_channel }).eq("id", id).is("visitor", null)`; throws on error.
createConversation call and args unchanged (existing `toHaveBeenCalledWith(brand,null,null,false)` assertions keep passing).
Tests first: `tests/unit/chat/route-visitor-context.test.ts` (scaffolding copied from route-is-test.test.ts; `vi.mock("@/lib/chat/visitor-context")` with real pure fns via `importActual` and a spy writer):
- new conversation + gclid + UA/geo headers → writer called once with `google_ads`, device, geo (001);
- confirmed conversationId → writer not called (007);
- writer rejects / builder throws → appendMessages still called, 200 (012);
- CHAT_ORCHESTRATOR on, body.attribution with utm_campaign/landing_url/gbraid + context → orchestrator receives `attribution` toStrictEqual the 8-key object (006);
- writer unit: `.is("visitor", null)` on a fake client (007).
Acceptance: `pnpm vitest run tests/unit/chat/route-visitor-context.test.ts tests/unit/chat/visitor-context.test.ts && pnpm vitest run tests/unit/chat/route-*.test.ts`; `git diff origin/main -- app/api/chat/route.ts` does not touch `function sanitizeAttribution`.

### Step 4 — Flag + page_path on both write paths
Behavior: flag on → each customer message stored with the page it was sent from; flag off → insert identical to today.
Files: flags.ts (`visitorContextEnabled`), persistence.ts (`PersistedMessage.page_path?: string | null`; row gets `page_path` only when a non-empty string, in appendMessages and appendUserMessageReturning), route.ts (`const pagePath = visitorContextEnabled() ? sanitizeVisitorContext(body.context).page : null` inside try/catch; passed only when non-null, both branches), docs/chat-flags-inventory.md. A message dropped by the dedup guard loses its page with it.
Tests first: persistence.test.ts (flag-off rows toStrictEqual `{conversation_id, role, content, parts}` with no `page_path` key; provided → included, both functions); route-visitor-context.test.ts (flag off → exact old shape; flag on → `page_path: "/tarifas"`; coalescing on → appendUserMessageReturning gets it; invalid page → key absent).
Acceptance: `pnpm vitest run tests/unit/chat/persistence.test.ts tests/unit/chat/route-visitor-context.test.ts tests/unit/chat/route-coalescing.test.ts tests/unit/chat/route-dedup.test.ts && pnpm type-check && pnpm lint`.

## Chunk 2: Dashboard inbox UI

### Step 5 — Card model (pure)  ·  Step 5b — card component + mount
Behavior: advisor opens a web conversation → origin (CHANNEL_META label/badge, "· domain" when referral), campaign, entry, "Página de la campaña" only if landing_url, trail, device, visitor location. WhatsApp → no card. Null visitor on web → "Sin datos: conversación anterior a esta función". Missing field → "No disponible".
Files: visitor-view.ts (`visitorCardModel(row)` → `{kind:'hidden'} | {kind:'empty'} | {kind:'data', rows}`; domain = hostname without `www.`; tolerant of unknown `v` / malformed jsonb), visitor-card.tsx, [id]/page.tsx (card above "Revisión"). Header "Ciudad: —" and `city_detected` untouched.
Tests first: `tests/unit/chat/visitor-view.test.ts` (google_ads → "Google Ads"; `{}` → "Directo"; null web → empty text; whatsapp → hidden; referral + `https://www.google.com/` → "Referido web · google.com"; no landing_url → no row; missing geo → "No disponible"; garbage jsonb → no throw).
Acceptance 5: `pnpm vitest run tests/unit/chat/visitor-view.test.ts && pnpm type-check`. Acceptance 5b: `pnpm type-check && pnpm build` and the detail page renders the card in local dev (Orca browser, zero console errors).

### Step 6 — Page under each customer message
Behavior: user message with page_path shows small "desde /tarifas"; without it, nothing.
Files: chat-thread.tsx.
Tests first: `tests/unit/components/chat-thread-page-path.test.tsx` (jsdom; with/without page_path; assistant rows none).
Acceptance: `pnpm vitest run tests/unit/components/chat-thread-page-path.test.tsx`.

### Step 7 — "Origen" column + filter
Behavior: advisor picks "TikTok" → only `tiktok_organic` rows; `tiktok_ads` excluded. Each row shows a badge (null → "Desconocido" via channelMeta).
Files: list-params.ts (`attributionChannel` from `?origen=`, enum-validated), chat-conversations.ts (`.eq("attribution_channel", …)` when set; select stays `"*, chat_messages(count)"`), use-conversations-table-url-state.ts, conversations-table.tsx (Select over ATTRIBUTION_CHANNELS minus `chat-bot`), columns.tsx.
Tests first: conversations-query.test.ts (eq for `tiktok_organic`; absent → no call), list-params (invalid → null), url-state round-trip, columns badge label.
Acceptance: `pnpm vitest run tests/unit/chat/conversations-query.test.ts tests/unit/hooks/use-conversations-table-url-state.test.ts tests/unit/components/conversations-columns.test.tsx tests/unit/components/conversations-table-marks-filter.test.tsx && pnpm build`.

## Chunk 3: Web widget

### Step 8 — Session trail + shared plugin
Behavior: visitor loads `/medellin` then `/tarifas` → sessionStorage holds entry `/medellin` (never overwritten) and trail `["/medellin","/tarifas"]` (last 10, pathname only, no consecutive repeat). Storage throwing → empty trail, no exception.
Files: visitorTrail.ts (storage injected; keys `rentacar_visit_entry`, `rentacar_visit_trail`), utils/index.ts, plugins/visitor-trail.client.ts (`recordVisit(location.pathname)` once, then `useRouter().afterEach(to => recordVisit(to.path))`, all in try/catch, no network). Shared layer → also reaches alquicarros; harmless (chat off there). Precedent: `packages/logic/plugins/suppress-native-validation-bubble.client.ts`.
Tests first: visitorTrail.test.ts (entry kept, query stripped, consecutive dedup, cap 10, throwing storage → `{entry:null, trail:[]}`, corrupt JSON → empty); visitor-trail-plugin.test.ts (stub `defineNuxtPlugin`/`useRouter`/`window` like packages/ui-alquilame/tests/ga4-wiring.test.ts).
Acceptance: `pnpm --filter @rentacar-main/logic test` and `npx vitest run --root . packages/logic packages/ui-alquilame/tests packages/ui-alquilatucarro/tests packages/ui-alquicarros/tests` (cross-brand guards, all 3 brands).

### Step 9 — POST carries `context`
Behavior: every chat send adds `context: { page, entry, trail }`; attribution unchanged.
Files: useChatConversation.ts (`context: buildChatContext()`; helper returns `{ page: '', entry: null, trail: [] }` on any error).
Tests first: useChatConversation.context.test.ts (source-level, same style as useChatConversation.attribution.test.ts); buildChatContext with throwing storage.
Acceptance: `pnpm --filter @rentacar-main/logic test && pnpm build:alquilame && pnpm build:alquilatucarro`.

## Chunk 4: Rollout + verification

### Step 10 — Ship and verify live
Behavior: advisors see visitor context on new conversations; chat and reservations behave as before. Acceptance = every row in ## Verification proven with evidence attached to the two PRs (dashboard: steps 1–7; web: steps 8–9).

## Rollout

1. Migration: `apply_migration` `179_chat_visitor_context`; hook writes file + TSV, commit both. Check: 3 columns exist, `get_advisors` no new warnings. Rollback: drop statements in header; nothing reads the columns yet.
2. Dashboard deploy with `CHAT_VISITOR_CONTEXT` unset (Steps 2–7). Snapshot is attempted (guarded); inbox shows what exists. Preview check: new conversation gets `visitor`; messages `page_path is null` (SCEN-013). Rollback: revert deploy in Vercel.
3. Prod check: `select id, attribution_channel, visitor->'device', visitor->'geo' from chat_conversations where created_at > now() - interval '1 hour' and channel='web' order by created_at desc limit 5`.
4. Set `CHAT_VISITOR_CONTEXT=on` in Vercel (read at call time). Rollback: unset.
5. Web deploy (Steps 8–9) to alquilame and alquilatucarro; order vs dashboard is free. Rollback: revert web deploy; dashboard keeps working with `context` absent (entry/trail/page null; attribution, device, geo still captured).
No `git push`, merge or prod change without explicit owner authorization at each of these points.

## Verification

| SCEN | Live proof |
|---|---|
| 001 | Orca embedded browser: `https://alquilame.co/bogota?utm_source=google&gclid=x` (then alquilatucarro), send a message; card shows Google Ads, `/bogota`, device, city. SQL `attribution_channel='google_ads'`. |
| 002 | Same tab → `/tarifas`, send again; network payload `context.trail`; SQL page_path per user row; thread shows both "desde". |
| 003 | Fresh profile, direct URL → "Directo". |
| 004 | Pre-deploy conversation → "Sin datos…", zero console errors. |
| 005 | Inbox `?origen=tiktok_organic`; count matches SQL with `is_test=false`; no tiktok_ads row. Seed with test chats via `?utm_source=tiktok` / `?ttclid=x` if needed. |
| 006 | Unit A/B in Step 3; after rollout, origin columns of bot reservations filled exactly as `sanitizeAttribution` would (no new keys, same channel). |
| 007 | 2nd/3rd message: `visitor` (incl. captured_at) unchanged; only new rows carry page_path. |
| 008 | curl POST to preview `/api/chat` with malformed context → 200 stream; SQL only valid paths, trail ≤ 10. |
| 009 | Storage blocked → chat replies; payload `trail: []`. |
| 010 | Console + network clean on both brands' chat pages and inbox list + detail. |
| 011 | WhatsApp thread → no card. |
| 012 | Unit test; prod `query_logs` for `[chat] visitor snapshot failed` (if present, messages still exist). |
| 013 | Before flag-on, user messages have `page_path is null`; insert shape proven by unit tests. |
| 014 | Arrive via google.com referrer → "Referido web · google.com". |
| 015 | Direct `/medellin` → `/tarifas` → entry `/medellin`, no "Página de la campaña". |

## Plan blockers / assumptions

- Dashboard worktree must branch from `origin/main`.
- `route.ts` is "certified" for its flag readers (docs/chat-flags-inventory.md); the plan only adds code there and does not touch existing readers or `sanitizeAttribution`. Flag to the owner of that certification in the PR; `docs/chat-flags-inventory.md` is a consumer in the blast radius.
- Existing route tests don't mock `lib/chat/visitor-context`; without Supabase env `createAdminClient` throws and the guard logs. A test asserting no `console.error` would fail — run every `tests/unit/chat/route-*.test.ts` in Step 3.
- iPadOS 13+ sends a desktop Safari UA → may show "escritorio". Accepted.
- Live SCEN-006 needs a safe bot booking on preview; otherwise unit A/B + post-rollout SQL on real bot bookings.
- Re-check migration number 179 right before applying.
