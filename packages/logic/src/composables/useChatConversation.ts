/**
 * useChatConversation — drives the AI chat bubble against the dashboard brain.
 *
 * Talks to `${rentacarPublicApiBase}/api/chat` (the published rentacar-dashboard
 * endpoint), which streams the AI SDK UI Message Stream protocol over SSE
 * (text/event-stream, `data: {type,...}` lines: text-start / text-delta /
 * text-end / reasoning-* / ...).
 *
 * We consume that SSE by hand with fetch + a ReadableStream reader instead of
 * @ai-sdk/vue. Rationale: @ai-sdk/vue's `Chat` pulls the whole `ai` barrel
 * (→ @ai-sdk/gateway → @vercel/oidc, server-only code) into the client bundle —
 * it breaks Vite dev hydration through the linked logic layer and bloats a site
 * tuned hard for Core Web Vitals. We only need text deltas + the conversation
 * id, so a ~zero-dependency parser is lighter and fully under our control.
 *
 * Per-brand wiring (no hardcoded numbers): `brand` is franchise.shortname. The
 * endpoint returns x-conversation-id (CORS-exposed); we capture it and resend it
 * so the dashboard keeps the same server-side conversation. conversationId +
 * the transcript persist in localStorage (per brand) so the chat survives
 * reloads and SSR/ISR navigation. Reasoning parts are ignored.
 */
import { computed, ref } from 'vue';
import {
  readStoredAttribution,
  trackAnalyticsEvent,
  trackGenerateLead,
  type ChatOpenSource,
} from '@rentacar-main/logic/utils';
import { extractChatActions, type ChatActions } from '../utils/extractChatActions';
import { buildChatPayloadMessages } from '../utils/buildChatPayloadMessages';

// Code-owned data parts emitted by the hybrid orchestrator (dashboard /api/chat)
// ALONGSIDE the streamed text. They arrive as `data-*` SSE events and are
// rendered as rich UI (table / cards / buttons) — never as text. Shapes mirror the
// reference renderer (rentacar-dashboard app/chat-test/chat-test-client.tsx): text,
// data-quoteTable, data-gamaCards, and data-buttons {web, whatsapp, share}, plus the
// crear_reserva tool-output fallback links. Keep them in sync when either side changes.
export interface QuoteTablePart {
  sede: string;
  dias: number;
  // Formatted pickup/return hours ("4 pm", "mediodía") when the customer has confirmed them —
  // rendered next to the day count as the quote-table title. Absent until hours are set.
  horaRecogida?: string;
  horaDevolucion?: string;
  filas: Array<{
    categoria: string; // gama code, e.g. "C", "CX"
    descripcion: string; // e.g. "Económico Mecánico"
    precioTotal: number; // COP integer, already rounded server-side
    horasExtra: number;
    precioHoraExtra: number;
  }>;
}

export interface GamaCardsPart {
  gama: string; // upper-case code, e.g. "F"
  descripcion?: string; // e.g. "Sedán mecánico"
  modelos: Array<{
    nombre: string;
    imagen: string; // photo URL; "" when missing → placeholder
  }>;
}

// A WhatsApp-style "reply to" reference the customer attaches by tapping/swiping
// a quote gama row or a model card. `label` shows in the composer chip and as the
// quoted header above the user bubble; `context` is a natural-language hint
// prepended to the text sent to the brain so the bot knows which gama/model they
// mean without the customer typing it.
export interface ReplyContext {
  label: string;
  context: string;
  // UI-only optionals (WhatsApp-style quote card). NEVER sent to the server —
  // buildChatPayloadMessages reads only `context`. Optional so transcripts
  // persisted before these fields existed keep restoring (label fallback).
  author?: string;
  preview?: string;
  image?: string;
  targetId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  // Optional WhatsApp-style quote the user replied to (gama row / model card).
  replyTo?: ReplyContext;
  // ms epoch stamped when the message is created (client). Persisted so the
  // WhatsApp-style time stays stable across reloads. Optional for legacy rows.
  createdAt?: number;
  // Fallback CTAs (finish on the web / message an advisor) rendered as buttons
  // from the server tool output OR a `data-buttons` part — never from the model's
  // text. Set when a booking fails or the bot offers an advisor. See
  // extractChatActions.
  actions?: ChatActions;
  // Deterministic quote table emitted by code as a `data-quoteTable` part.
  quoteTable?: QuoteTablePart;
  // Vehicle model cards (photo + name) per gama, emitted as `data-gamaCards`.
  gamaCards?: GamaCardsPart;
}

type ChatStatus = 'ready' | 'submitting' | 'streaming' | 'error';

// Shown when the request fails without a usable server message (network / 5xx
// without body / stream error). Known server errors override this with their text.
const CHAT_GENERIC_ERROR = 'No pude responder ahora. Intenta de nuevo en un momento.';

// Stream inactivity watchdog (issue #322 SCEN-322-X04): if NO chunk arrives for
// this long (covers both the initial fetch await and mid-stream silence) the
// turn is aborted into the existing error branch, so the conversation can never
// hang in "escribiendo…" forever. This is CHUNK-INACTIVITY only — the stream is
// NEVER aborted on surface unmount (singleton keeps streaming in background,
// see onSurfaceUnmounted).
export const CHAT_STREAM_IDLE_TIMEOUT_MS = 30_000;
const CHAT_TIMEOUT_ERROR =
  'La respuesta está tardando demasiado. Intenta de nuevo en un momento.';

// Local conversation TTL: after this much inactivity (measured from the NEWEST
// message's createdAt) the browser copy is wiped on init and the chat starts
// fresh — stale quotes from past seasons must not resurface. LOCAL ONLY: the
// server-side Supabase conversation is the business record and is never touched.
export const CHAT_TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

// Per-instance config resolved once from the Nuxt context by the wrapper below,
// so the factory itself is free of Nuxt auto-imports and unit-testable.
export interface ChatConversationConfig {
  brand: string;
  api: string;
  messagesKey: string;
  conversationKey: string;
  lastReadKey: string;
}

// The full conversation instance. Browser access is FEATURE-DETECTED
// (typeof localStorage/document/window) rather than gated on import.meta.client:
// that keeps it inert during SSR (no browser globals) AND drivable under vitest
// with stubbed globals, while the wrapper's import.meta.client guard is what
// prevents cross-request memo pollution on the server.
export function createChatConversation(cfg: ChatConversationConfig) {
  const { brand, api, messagesKey, conversationKey, lastReadKey } = cfg;
  const hasStorage = typeof localStorage !== 'undefined';
  const hasDocument = typeof document !== 'undefined';
  const hasWindow = typeof window !== 'undefined';

  function restore(): ChatMessage[] {
    if (!hasStorage) return [];
    try {
      const raw = localStorage.getItem(messagesKey);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  function restoreLastRead(): string | null {
    if (!hasStorage) return null;
    try {
      return localStorage.getItem(lastReadKey);
    } catch {
      return null;
    }
  }

  // --- Local TTL (CHAT_TTL_MS) ------------------------------------------------
  // Dated by the NEWEST message so an ongoing conversation with old history
  // survives. A non-empty transcript with NO datable message predates the
  // createdAt feature entirely — older than any window → expired ("cannot be
  // dated" fails toward killing stale quotes, not toward unbounded history).
  function isExpired(msgs: ChatMessage[]): boolean {
    if (!msgs.length) return false;
    let newest = 0;
    for (const m of msgs) {
      if (typeof m.createdAt === 'number' && m.createdAt > newest) newest = m.createdAt;
    }
    if (!newest) return true;
    return Date.now() - newest > CHAT_TTL_MS;
  }

  let restoredMessages = restore();
  if (isExpired(restoredMessages)) {
    // Wipe the LOCAL copy only (messages, server-conversation pointer, unread
    // marker) and start fresh. No network call: the Supabase record stays.
    restoredMessages = [];
    if (hasStorage) {
      try {
        localStorage.removeItem(messagesKey);
        localStorage.removeItem(conversationKey);
        localStorage.removeItem(lastReadKey);
      } catch {
        /* private mode — the in-memory state below is fresh regardless */
      }
    }
  }

  const messages = ref<ChatMessage[]>(restoredMessages);
  let firstCustomerMessageTracked = restoredMessages.some((message) => message.role === 'user');
  const input = ref('');
  const replyTo = ref<ReplyContext | null>(null);
  const status = ref<ChatStatus>('ready');
  const error = ref<Error | null>(null);
  // Optional action shown alongside an error bubble — e.g. the brand's WhatsApp when
  // the chat is turned off, so a mid-conversation shut-off hands the customer somewhere
  // to go instead of a dead end. Set from the server's error JSON (`{error, whatsapp}`).
  const errorAction = ref<{ whatsapp?: string } | null>(null);
  const conversationId = ref<string | null>(
    hasStorage ? localStorage.getItem(conversationKey) : null,
  );
  const isStreaming = computed(
    () => status.value === 'submitting' || status.value === 'streaming',
  );

  let controller: AbortController | null = null;
  // Commits the in-flight streamed accumulator onto the reactive assistant bubble.
  // Set by submit() while a turn streams, so persist() (pagehide / tab-hidden) can
  // snapshot whatever has arrived so far instead of an empty bubble. Null when idle.
  let flushInflight: (() => void) | null = null;

  // --- Unread state machine ---------------------------------------------------
  // Source of truth is lastReadMessageId (an id, NOT a raw counter) so the badge
  // survives reloads and never drifts when the transcript is trimmed. Migration:
  // legacy users with history but no stored marker start "all read" so restoring
  // an old transcript never spuriously badges.
  const initialMessages = messages.value;
  const storedLastRead = restoreLastRead();
  const lastReadMessageId = ref<string | null>(
    storedLastRead ?? (initialMessages.length ? initialMessages[initialMessages.length - 1]!.id : null),
  );
  const surfaceMounted = ref(false);
  const docVisible = ref(hasDocument ? document.visibilityState === 'visible' : true);
  // The user is actually looking at the chat only when a surface is mounted AND
  // the tab is in the foreground.
  const isViewing = computed(() => surfaceMounted.value && docVisible.value);
  // aria-live text injected when a reply lands while the user is NOT viewing.
  const announce = ref('');

  function startIndexAfterLastRead(): number {
    const msgs = messages.value;
    const lrid = lastReadMessageId.value;
    if (!lrid) return 0;
    const idx = msgs.findIndex((m) => m.id === lrid);
    // Marker id absent from the transcript (trimmed / clobbered by another tab):
    // fail toward all-read — a missed badge beats a spurious "9+" over history
    // the user already saw.
    return idx === -1 ? msgs.length : idx + 1;
  }

  // Count of assistant messages after lastReadMessageId — the badge number.
  // Zero while the user is actively viewing (mounted + foreground): nothing is
  // "unread" when you are looking at it, and this suppresses the transient badge
  // that would otherwise flash on the FAB during an open, visible streaming turn.
  const unread = computed(() => {
    if (isViewing.value) return 0;
    const msgs = messages.value;
    let count = 0;
    for (let i = startIndexAfterLastRead(); i < msgs.length; i++) {
      if (msgs[i]!.role === 'assistant') count++;
    }
    return count;
  });

  // Id of the first unread assistant message — where the "Mensajes nuevos"
  // separator renders. Read by the surface BEFORE markRead() advances the marker.
  const firstUnreadAssistantId = computed(() => {
    const msgs = messages.value;
    for (let i = startIndexAfterLastRead(); i < msgs.length; i++) {
      if (msgs[i]!.role === 'assistant') return msgs[i]!.id;
    }
    return null;
  });

  // Short preview of the latest assistant reply (for a11y / future surfaces).
  const lastAssistantPreview = computed(() => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i]!;
      if (m.role === 'assistant') return m.text.slice(0, 80);
    }
    return '';
  });

  // A user turn whose reply was lost (hard close mid-turn) — the surface offers
  // an inline retry. Two persisted shapes qualify when nothing is streaming:
  //   - trailing user message (no assistant placeholder was persisted), or
  //   - trailing EMPTY assistant right after a user message: submit() pushes the
  //     placeholder synchronously, so a snapshot taken before any delta arrives
  //     persists [..., user, assistant('')]. Empty = no text AND no code parts.
  const danglingUserTurn = computed(() => {
    if (isStreaming.value) return false;
    const msgs = messages.value;
    const last = msgs.at(-1);
    if (!last) return false;
    if (last.role === 'user') return true;
    return (
      last.text.trim() === '' &&
      !last.actions &&
      !last.quoteTable &&
      !last.gamaCards &&
      msgs.at(-2)?.role === 'user'
    );
  });

  function persistLastRead() {
    if (!hasStorage) return;
    try {
      if (lastReadMessageId.value) {
        localStorage.setItem(lastReadKey, lastReadMessageId.value);
      } else {
        localStorage.removeItem(lastReadKey);
      }
    } catch {
      /* quota / private mode — non-fatal */
    }
  }

  // Mark everything currently in the transcript as read (badge → 0). Also clears
  // the aria-live text so a stale announcement never lingers (and an identical
  // future string re-announces instead of being deduped by the live region).
  function markRead() {
    const last = messages.value.at(-1);
    lastReadMessageId.value = last ? last.id : null;
    announce.value = '';
    persistLastRead();
  }

  // Ref-count, not a boolean: a route transition can mount the incoming surface
  // before the outgoing one unmounts; a bare boolean would flip to false while a
  // surface is still on screen.
  let mountCount = 0;
  let pendingOpenSource: ChatOpenSource | null = null;

  function prepareChatOpen(source: ChatOpenSource) {
    pendingOpenSource = source;
  }

  // Called by the surface on mount: it is now visible, so catch the marker up.
  function onSurfaceMounted(fallbackSource: ChatOpenSource = 'chat_page') {
    const wasAlreadyMounted = mountCount > 0;
    mountCount++;
    surfaceMounted.value = true;
    if (!wasAlreadyMounted) {
      trackAnalyticsEvent('chat_open', {
        brand,
        source: pendingOpenSource ?? fallbackSource,
      });
      pendingOpenSource = null;
    }
    if (docVisible.value) markRead();
  }

  // Called on unmount. CRITICAL: never abort the stream — the singleton keeps
  // streaming into the SAME messages ref, so a reopen sees the reply continue.
  function onSurfaceUnmounted() {
    mountCount = Math.max(0, mountCount - 1);
    surfaceMounted.value = mountCount > 0;
  }

  // Fires when an assistant turn finishes. When the user is viewing, just catch
  // the read-marker up. When not, the reply is unread: announce it + beacon.
  function completeAssistantTurn() {
    if (isViewing.value) {
      markRead();
      return;
    }
    const n = unread.value;
    // n can be 0 when a visible→hidden toggle straddled the stream (markRead ran
    // on the placeholder): nothing new for the user → no announce, no beacons.
    if (n === 0) return;
    trackAnalyticsEvent('chat_reply_while_closed', { brand });
    trackAnalyticsEvent('chat_unread_badge_shown', { brand });
    announce.value = n === 1 ? '1 mensaje nuevo en el chat' : `${n} mensajes nuevos en el chat`;
  }

  // Called by the FAB when the chat is reopened from the badge (analytics only;
  // markRead is invoked separately by openChat / onSurfaceMounted).
  function emitReopenedFromBadge() {
    trackAnalyticsEvent('chat_reopened_from_badge', { brand });
  }

  function onVisibilityChange() {
    if (!hasDocument) return;
    const visible = document.visibilityState === 'visible';
    docVisible.value = visible;
    if (visible) {
      // Returning to a mounted surface clears unread with no further interaction.
      if (surfaceMounted.value) markRead();
    } else {
      // Hardening: snapshot the transcript (incl. any partial reply) before the
      // tab is backgrounded / frozen, so nothing streamed so far is lost.
      persist();
    }
  }

  if (hasDocument) {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  if (hasWindow) {
    // Hardening: persist a full snapshot on the terminal page-hide event.
    window.addEventListener('pagehide', () => persist());
  }

  function genId(): string {
    if (typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `m-${messages.value.length}-${Date.now()}`;
  }

  function persist() {
    if (!hasStorage) return;
    // Mid-stream snapshot (pagehide / tab-hidden): commit whatever has streamed
    // so far onto the bubble FIRST, so we never persist an empty reply while a
    // turn is in flight. Guarded on isStreaming so the terminal persist (which
    // runs after the empty-bubble fallback text) is never clobbered.
    if (isStreaming.value) flushInflight?.();
    try {
      localStorage.setItem(messagesKey, JSON.stringify(messages.value));
      if (conversationId.value) {
        localStorage.setItem(conversationKey, conversationId.value);
      }
      persistLastRead();
    } catch {
      /* quota / private mode — non-fatal, chat still works in-memory */
    }
  }

  async function submit() {
    const text = input.value.trim();
    if (!text || isStreaming.value) return;
    input.value = '';
    error.value = null;
    errorAction.value = null;

    // Capture and clear the reply reference for THIS turn (the chip disappears).
    const reply = replyTo.value;
    replyTo.value = null;

    if (!firstCustomerMessageTracked) {
      trackAnalyticsEvent('chat_message_sent', { brand, message_number: 1 });
      trackGenerateLead(brand, 'chat');
      firstCustomerMessageTracked = true;
    }

    messages.value.push({
      id: genId(),
      role: 'user',
      text,
      createdAt: Date.now(),
      ...(reply ? { replyTo: reply } : {}),
    });

    // Build the request payload BEFORE adding the assistant placeholder, in the
    // UIMessage shape the endpoint expects (parts[], not a content string). We send
    // only a BOUNDED TAIL (not the whole transcript): the brain reconstructs full
    // history server-side from conversationId, so resending everything just grew each
    // request until it tripped the server's input caps and bricked a long chat (C10).
    // See buildChatPayloadMessages.
    const payloadMessages = buildChatPayloadMessages(messages.value);

    // Placeholder assistant message; grab the reactive proxy to stream into it.
    messages.value.push({ id: genId(), role: 'assistant', text: '', createdAt: Date.now() });
    const assistant = messages.value[messages.value.length - 1]!;

    // Accumulate the streamed reply + code-owned parts locally and reveal them ALL AT
    // ONCE (WhatsApp-style: typing dots, then the full bubble) — no live typewriter.
    // Hoisted OUT of the try so a mid-stream tear (network drop / `error` frame) can
    // still flush what already arrived (e.g. the price table) onto the bubble instead
    // of blanking it. See the catch below.
    let assistantText = '';
    // The brain emits each topic as a SEPARATE text block; honor that boundary so the
    // bubbles split instead of gluing. On a new block insert the `\n---\n` separator
    // splitBubbles understands. Cap at 3 bubbles — block 4+ folds into the 3rd spaced.
    let textBlocks = 0;
    let actions: ChatActions | null = null;
    let quoteTable: QuoteTablePart | undefined;
    let gamaCards: GamaCardsPart | undefined;
    let quoteAnalyticsSent = false;
    const emitQuoteAnalytics = () => {
      if (!quoteTable || quoteAnalyticsSent) return;
      const items = quoteTable.filas.map((row) => ({
        item_id: row.categoria,
        item_name: row.descripcion || row.categoria,
        ...(Number.isFinite(row.precioTotal) && row.precioTotal > 0
          ? { price: row.precioTotal }
          : {}),
        quantity: 1,
      }));
      const prices = items
        .map((item) => item.price)
        .filter((price): price is number => price !== undefined);
      quoteAnalyticsSent = trackAnalyticsEvent('chat_quote_received', {
        brand,
        result_count: items.length,
        items,
        ...(prices.length
          ? { currency: 'COP' as const, value: Math.min(...prices) }
          : {}),
      });
    };
    // Commit whatever has accumulated onto the reactive bubble. Called on success AND
    // on a mid-stream error, so partial content survives a torn stream.
    const flushToAssistant = () => {
      assistant.text = assistantText;
      if (actions) assistant.actions = actions;
      if (quoteTable) assistant.quoteTable = quoteTable;
      if (gamaCards) assistant.gamaCards = gamaCards;
    };
    // Expose the flush to persist() while this turn is in flight, so a
    // pagehide/tab-hidden snapshot captures the partial reply, not ''.
    flushInflight = flushToAssistant;

    status.value = 'submitting';
    controller = new AbortController();

    // Inactivity watchdog: re-armed on every received chunk. When it fires it
    // aborts THIS turn's controller; the AbortError is routed to the error
    // branch below (banner + retry), unlike a user stop() which stays quiet.
    let watchdogTimedOut = false;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    const disarmWatchdog = () => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };
    const armWatchdog = () => {
      disarmWatchdog();
      watchdogTimer = setTimeout(() => {
        watchdogTimedOut = true;
        controller?.abort();
      }, CHAT_STREAM_IDLE_TIMEOUT_MS);
    };
    armWatchdog();

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          ...(conversationId.value ? { conversationId: conversationId.value } : {}),
          messages: payloadMessages,
          // Forward the customer's real marketing origin (utm/click-ids/referrer) the
          // attribution plugin already captured into localStorage, so a bot-closed
          // reservation keeps its true "Origen" (TikTok/Meta/Google/…) instead of
          // "Desconocido". Same source as a normal web reservation; {} = "Directo".
          attribution: readStoredAttribution() ?? {},
        }),
        signal: controller.signal,
      });

      const id = response.headers.get('x-conversation-id');
      if (id) conversationId.value = id;

      if (!response.ok || !response.body) {
        // Surface the server's friendly message (rate limits, validation, missing
        // config, etc.) to the customer instead of a generic error. Falls back to
        // the generic text for empty/non-JSON bodies (network / 5xx without body).
        let userMessage = CHAT_GENERIC_ERROR;
        let whatsapp: string | undefined;
        try {
          const body = (await response.json()) as { error?: unknown; whatsapp?: unknown };
          if (typeof body?.error === 'string' && body.error) userMessage = body.error;
          if (typeof body?.whatsapp === 'string' && body.whatsapp) whatsapp = body.whatsapp;
        } catch {
          // no JSON body — keep the generic message
        }
        const err = new Error(
          `Chat request failed (${response.status})`,
        ) as Error & { userMessage?: string; whatsapp?: string };
        err.userMessage = userMessage;
        err.whatsapp = whatsapp;
        throw err;
      }

      status.value = 'streaming';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        // A chunk (or clean end) arrived — reset the inactivity window.
        armWatchdog();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are newline-delimited; keep the trailing partial line.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          let event: {
            type?: string;
            delta?: string;
            errorText?: string;
            output?: unknown;
            data?: unknown;
          };
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }
          if (event.type === 'text-start') {
            textBlocks += 1;
            if (textBlocks > 1) {
              assistantText += textBlocks <= 3 ? '\n---\n' : '\n\n';
            }
          } else if (event.type === 'text-delta' && typeof event.delta === 'string') {
            assistantText += event.delta;
          } else if (event.type === 'tool-output-available') {
            // Render the fallback CTAs from the structured tool result — never
            // from model text (it corrupts long URLs).
            const a = extractChatActions(event.output);
            if (a) actions = a;
          } else if (event.type === 'data-quoteTable') {
            // Deterministic quote table (code-emitted). Guard the array so a
            // malformed payload can't crash the render.
            const d = event.data as QuoteTablePart | undefined;
            if (d && Array.isArray(d.filas)) quoteTable = d;
          } else if (event.type === 'data-gamaCards') {
            const d = event.data as GamaCardsPart | undefined;
            if (d && Array.isArray(d.modelos)) gamaCards = d;
          } else if (event.type === 'data-buttons') {
            // Code-emitted CTAs feeding the SAME `actions` slot. Any button may arrive
            // alone (hablar_asesor → whatsapp only; self-serve → web + share); keep a
            // URL only if it's a non-empty string. `share` is the wa.me/?text=… quote
            // link the brain emits on the "tómate tu tiempo" path (rendered as
            // "Compartir cotización") — previously dropped here.
            const b = event.data as
              | { web?: unknown; whatsapp?: unknown; share?: unknown }
              | undefined;
            const web = typeof b?.web === 'string' && b.web ? b.web : undefined;
            const whatsapp =
              typeof b?.whatsapp === 'string' && b.whatsapp ? b.whatsapp : undefined;
            const share = typeof b?.share === 'string' && b.share ? b.share : undefined;
            if (web || whatsapp || share) actions = { web, whatsapp, share };
          } else if (event.type === 'error') {
            throw new Error(event.errorText || 'stream error');
          }
        }
      }

      // Reveal the full reply at once now that the stream finished (WhatsApp-style).
      flushToAssistant();
      emitQuoteAnalytics();

      // Defense-in-depth: a turn that streams no text deltas (e.g. the model ended
      // on a tool call, or the function was cut short) would otherwise leave an
      // empty white bubble. Replace it with a recoverable message — unless code
      // parts (buttons / table / cards) carry the answer on their own.
      if (
        assistant.text.trim() === '' &&
        !assistant.actions &&
        !assistant.quoteTable &&
        !assistant.gamaCards
      ) {
        assistant.text =
          'Disculpa, no alcancé a completar esa respuesta. ¿Lo intentamos de nuevo?';
      }

      status.value = 'ready';
      persist();
      // Unread bookkeeping for the finished turn: advance the marker if the user
      // is watching, else surface the badge + announcement + analytics.
      completeAssistantTurn();
    } catch (e) {
      const err = e as { name?: string; userMessage?: string; whatsapp?: string };
      if (err.name === 'AbortError' && !watchdogTimedOut) {
        // User-initiated stop(): keep whatever streamed so far, no error banner.
        flushToAssistant();
        status.value = 'ready';
      } else {
        // Preserve whatever already arrived before the stream tore (e.g. the price
        // table or partial text): commit it onto the bubble so a mid-stream error
        // doesn't blank the reply — the inline error banner shows below it. Empty
        // accumulators leave the placeholder invisible (renders no bubble).
        flushToAssistant();
        // error.message is what the banner shows — always a customer-safe string:
        // the watchdog's timeout text, the server's friendly text when we
        // captured one, else the generic retry.
        error.value = new Error(
          watchdogTimedOut ? CHAT_TIMEOUT_ERROR : (err.userMessage ?? CHAT_GENERIC_ERROR),
        );
        errorAction.value = err.whatsapp ? { whatsapp: err.whatsapp } : null;
        status.value = 'error';
      }
      emitQuoteAnalytics();
      persist();
    } finally {
      disarmWatchdog();
      controller = null;
      flushInflight = null;
    }
  }

  function stop() {
    controller?.abort();
  }

  // Re-send the dangling (unanswered) user turn without duplicating the bubble:
  // drop the empty assistant placeholder (if one was persisted) and the orphan
  // user message, then re-submit its text (submit re-pushes both).
  function retryDangling() {
    if (!danglingUserTurn.value) return;
    if (messages.value.at(-1)?.role === 'assistant') messages.value.pop();
    const last = messages.value.at(-1);
    if (!last || last.role !== 'user') return;
    const text = last.text;
    const reply = last.replyTo ?? null;
    messages.value.pop();
    input.value = text;
    if (reply) replyTo.value = reply;
    void submit();
  }

  function clear() {
    stop();
    messages.value = [];
    conversationId.value = null;
    replyTo.value = null;
    error.value = null;
    errorAction.value = null;
    status.value = 'ready';
    firstCustomerMessageTracked = false;
    lastReadMessageId.value = null;
    if (hasStorage) {
      try {
        localStorage.removeItem(messagesKey);
        localStorage.removeItem(conversationKey);
        localStorage.removeItem(lastReadKey);
      } catch {
        /* private mode — non-fatal */
      }
    }
  }

  return {
    messages,
    input,
    replyTo,
    status,
    isStreaming,
    error,
    errorAction,
    submit,
    stop,
    clear,
    conversationId,
    // Unread state machine + hardening surface.
    unread,
    announce,
    lastAssistantPreview,
    firstUnreadAssistantId,
    danglingUserTurn,
    surfaceMounted,
    docVisible,
    isViewing,
    markRead,
    onSurfaceMounted,
    prepareChatOpen,
    onSurfaceUnmounted,
    completeAssistantTurn,
    emitReopenedFromBadge,
    retryDangling,
  };
}

export type ChatConversation = ReturnType<typeof createChatConversation>;

// Client-only per-brand memo. On the client the FIRST caller (ChatWidget during
// hydration, or ChatConversation on a /chat cold load) creates the instance;
// every later caller for the same brand gets the SAME object — the same messages
// ref and the single stream owner — which is what kills the reopen-mid-stream
// data-loss race. Never populated on the server (see the wrapper's guard).
const clientInstances = new Map<string, ChatConversation>();

// Exported for unit tests: proves the client memo semantics (same brand → same
// instance) independent of the SSR guard.
export function getOrCreateInstance(
  brand: string,
  factory: () => ChatConversation,
): ChatConversation {
  let inst = clientInstances.get(brand);
  if (!inst) {
    inst = factory();
    clientInstances.set(brand, inst);
  }
  return inst;
}

export function useChatConversation(): ChatConversation {
  const { franchise } = useAppConfig();
  const { rentacarPublicApiBase } = useRuntimeConfig().public;

  const brand = franchise.shortname as string;
  const cfg: ChatConversationConfig = {
    brand,
    api: `${rentacarPublicApiBase}/api/chat`,
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };

  // HARD SSR guard: on the server return a FRESH, never-memoized instance per
  // call so two concurrent renders can never share chat state (cross-request
  // pollution). The module memo is only ever touched on the client.
  if (!import.meta.client) return createChatConversation(cfg);
  return getOrCreateInstance(brand, () => createChatConversation(cfg));
}
