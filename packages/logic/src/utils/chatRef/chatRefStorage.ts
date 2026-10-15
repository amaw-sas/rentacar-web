// The bot (WhatsApp / web chat, driven from the dashboard) sends the customer a
// funnel link carrying `?chat=<conversation id>`. The dashboard wants to open that
// conversation from the reservation, so the web captures the value on landing,
// keeps it across the whole funnel AND page reloads, and forwards it as the
// top-level `chat_ref` field of the record payload.
//
// Same shape as attributionStorage: localStorage, 30-day TTL, last write wins.
// `referido` is NOT the model here — it lives in memory only and dies on reload.
//
// No format validation on this side (the server validates and discards). Every
// storage access is guarded: SSR, strict privacy mode (the property access itself
// throws) and quota errors degrade to a no-op / null. A tracker must never break
// hydration or the reservation.
//
// Holdout: docs/specs/chat-ref-reserva/scenarios/chat-ref-reserva.scenarios.md

export const CHAT_REF_QUERY_KEY = 'chat';
export const CHAT_REF_STORAGE_KEY = 'rentacar_chat_ref';
export const CHAT_REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // exactly 30 days

interface StoredChatRef {
  value: string;
  ts: number;
}

function getStore(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // access denied (privacy mode / disabled storage)
  }
}

/**
 * Turns whatever the URL carried (`URLSearchParams.get` → string | null,
 * vue-router `route.query.x` → string | string[] | null | undefined) into the
 * value to keep, or null when there is nothing usable. Blank = absent.
 */
export function normalizeChatRef(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const picked = normalizeChatRef(item);
      if (picked) return picked;
    }
    return null;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

export function persistChatRef(value: string, now: number = Date.now()): void {
  const store = getStore();
  if (!store) return;
  try {
    const payload: StoredChatRef = { value, ts: now };
    store.setItem(CHAT_REF_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded / disabled — non-fatal */
  }
}

export function readStoredChatRef(now: number = Date.now()): string | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(CHAT_REF_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredChatRef;
    const value = normalizeChatRef(parsed?.value);
    if (
      !parsed ||
      value === null ||
      typeof parsed.ts !== 'number' ||
      !Number.isFinite(parsed.ts) ||
      parsed.ts < 0 ||
      parsed.ts > now
    ) {
      store.removeItem(CHAT_REF_STORAGE_KEY);
      return null;
    }
    if (now - parsed.ts > CHAT_REF_TTL_MS) {
      store.removeItem(CHAT_REF_STORAGE_KEY); // expired → drop it
      return null;
    }
    return value;
  } catch {
    try {
      store.removeItem(CHAT_REF_STORAGE_KEY);
    } catch {
      /* storage access failed too */
    }
    return null; // corrupt JSON / access error
  }
}
