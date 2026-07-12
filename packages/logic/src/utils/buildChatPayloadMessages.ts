/**
 * Build the /api/chat request `messages` payload from the local transcript.
 *
 * C10 — transcript brick: the widget used to resend the WHOLE transcript every
 * turn. The dashboard brain reconstructs full history server-side from the
 * `conversationId` (live since the chat launched, #194): it uses ONLY the last
 * message for the turn and its own Supabase copy for context. Resending the whole
 * transcript is therefore wasted for the model AND grows every request until it
 * trips the server's own input-size caps (MAX_MESSAGES / MAX_TOTAL_CHARS) — a long
 * conversation then bricks with a 400.
 *
 * So we send a bounded TAIL: the most recent messages, capped. The last element is
 * always the current user message (the only one the happy path consumes). The tail
 * ahead of it is a safety net for the rare server-side history-load failure, whose
 * fallback path reads the request body instead — enough recent context to stay
 * coherent, still bounded so it can NEVER brick regardless of conversation length.
 *
 * Pure + Nuxt-free so it's unit-testable; the composable passes `messages.value`.
 */
export interface ChatPayloadMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}

interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  // WhatsApp-style quote the user replied to; its `context` is prepended so the
  // brain knows which gama/model they mean without them typing it.
  replyTo?: { context: string };
}

// ~5 turns of tail. Far under the server caps (60 messages / 16000 chars), yet
// enough recent context for the rare history-load-failure fallback to read.
export const CHAT_PAYLOAD_TAIL = 10;

export function buildChatPayloadMessages(
  messages: ReadonlyArray<TranscriptMessage>,
  tail: number = CHAT_PAYLOAD_TAIL,
): ChatPayloadMessage[] {
  const slice = tail > 0 ? messages.slice(-tail) : messages.slice();
  return slice.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.replyTo ? `${m.replyTo.context}\n${m.text}` : m.text }],
  }));
}
