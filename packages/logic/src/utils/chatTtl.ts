// Local chat transcript TTL, shared by the chat engine (useChatConversation) and
// the always-loaded FAB badge (useChatUnreadBadge). Leaf module on purpose: NO
// imports, so the badge reaches the TTL without pulling the engine into the FAB
// chunk. LOCAL ONLY: the server-side Supabase conversation is never touched.

// After this much inactivity, measured from the NEWEST message's createdAt, the
// browser copy of the conversation is dropped and the chat starts fresh.
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Dated by the NEWEST message so an ongoing conversation with old history
// survives. Empty → nothing to expire. A non-empty transcript with NO datable
// message predates the createdAt feature → expired ("cannot be dated" fails
// toward killing stale quotes, not toward unbounded history). Strict `>`: a
// transcript exactly CHAT_TTL_MS old is still kept.
export function isChatTranscriptExpired(
  messages: ReadonlyArray<{ createdAt?: number }>,
  now: number,
): boolean {
  if (!messages.length) return false;
  let newest = 0;
  for (const m of messages) {
    if (typeof m.createdAt === 'number' && m.createdAt > newest) newest = m.createdAt;
  }
  if (!newest) return true;
  return now - newest > CHAT_TTL_MS;
}
