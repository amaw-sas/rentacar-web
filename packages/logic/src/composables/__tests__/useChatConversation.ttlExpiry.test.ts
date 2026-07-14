import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_TTL_MS,
  createChatConversation,
  type ChatConversationConfig,
  type ChatMessage,
} from '../useChatConversation';

// 15-day local conversation TTL (chat-ttl-expiry.scenarios.md): on init, a
// transcript whose NEWEST message is older than CHAT_TTL_MS is wiped locally
// (messages + conversationId + lastReadMessageId) — server record untouched.
// Same stubbed-browser harness as useChatConversation.unread.test.ts.

const DAY = 24 * 60 * 60 * 1000;

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

let store: ReturnType<typeof makeStorage>;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  store = makeStorage();
  fetchSpy = vi.fn();
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal('window', { addEventListener: () => {} });
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

let brandSeq = 0;
function cfg(): ChatConversationConfig {
  const brand = `ttl${brandSeq++}`;
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };
}

// Seed localStorage as a previous session would have left it.
function seed(
  c: ChatConversationConfig,
  messages: ChatMessage[],
  opts: { conversationId?: string; lastRead?: string } = {},
) {
  store.setItem(c.messagesKey, JSON.stringify(messages));
  if (opts.conversationId) store.setItem(c.conversationKey, opts.conversationId);
  if (opts.lastRead) store.setItem(c.lastReadKey, opts.lastRead);
}

function turn(id: string, ageMs: number, role: 'user' | 'assistant' = 'assistant'): ChatMessage {
  return { id, role, text: `msg ${id}`, createdAt: Date.now() - ageMs };
}

describe('SCEN-001 — >15 days of inactivity → fresh chat, keys cleared', () => {
  it('wipes messages, conversationId and lastReadMessageId on init', () => {
    const c = cfg();
    seed(c, [turn('u1', 16 * DAY, 'user'), turn('a1', 16 * DAY)], {
      conversationId: 'conv-old',
      lastRead: 'a1',
    });
    const inst = createChatConversation(c);
    expect(inst.messages.value).toEqual([]);
    expect(inst.conversationId.value).toBeNull();
    expect(store.getItem(c.messagesKey)).toBeNull();
    expect(store.getItem(c.conversationKey)).toBeNull();
    expect(store.getItem(c.lastReadKey)).toBeNull();
  });

  it('boundary: exactly at the TTL edge is NOT expired; just past it is', () => {
    // At exactly CHAT_TTL_MS the strict > keeps the conversation (15 days is
    // the allowance, not the cutoff-inclusive).
    const cKeep = cfg();
    seed(cKeep, [turn('a1', CHAT_TTL_MS)]);
    expect(createChatConversation(cKeep).messages.value).toHaveLength(1);

    const cWipe = cfg();
    seed(cWipe, [turn('a1', CHAT_TTL_MS + 60_000)]);
    expect(createChatConversation(cWipe).messages.value).toEqual([]);
  });
});

describe('SCEN-002 — 14 days old → everything intact', () => {
  it('restores transcript, unread badge and conversationId continuity', () => {
    const c = cfg();
    seed(c, [turn('u1', 14 * DAY, 'user'), turn('a1', 14 * DAY)], {
      conversationId: 'conv-live',
      lastRead: 'u1', // marker behind the assistant reply → 1 unread
    });
    const inst = createChatConversation(c);
    expect(inst.messages.value).toHaveLength(2);
    expect(inst.unread.value).toBe(1);
    expect(inst.conversationId.value).toBe('conv-live');
  });
});

describe('SCEN-003 — an expired unread reply must NOT badge', () => {
  it('unread is 0 and no announcement after expiry wipes the marker state', () => {
    const c = cfg();
    seed(c, [turn('u1', 16 * DAY, 'user'), turn('a1', 16 * DAY)], { lastRead: 'u1' });
    const inst = createChatConversation(c);
    expect(inst.unread.value).toBe(0);
    expect(inst.announce.value).toBe('');
  });
});

describe('SCEN-004 — legacy transcript with no datable message → expired', () => {
  it('wipes a non-empty transcript where no message carries createdAt', () => {
    const c = cfg();
    seed(c, [
      { id: 'u1', role: 'user', text: 'hola' },
      { id: 'a1', role: 'assistant', text: 'vieja respuesta' },
    ]);
    const inst = createChatConversation(c);
    expect(inst.messages.value).toEqual([]);
    expect(store.getItem(c.messagesKey)).toBeNull();
  });

  it('a transcript where only SOME messages are datable uses the newest datable one', () => {
    const c = cfg();
    // Legacy head without createdAt + a recent stamped reply → NOT expired.
    seed(c, [{ id: 'u1', role: 'user', text: 'hola' }, turn('a1', 2 * DAY)]);
    expect(createChatConversation(c).messages.value).toHaveLength(2);
  });
});

describe('SCEN-005 — empty or missing data → nothing to expire, no crash', () => {
  it('first visit (no keys) initializes an empty conversation', () => {
    const inst = createChatConversation(cfg());
    expect(inst.messages.value).toEqual([]);
    expect(inst.unread.value).toBe(0);
  });

  it('an empty persisted array is not treated as expired', () => {
    const c = cfg();
    seed(c, [], { conversationId: 'conv-kept' });
    const inst = createChatConversation(c);
    expect(inst.messages.value).toEqual([]);
    // Nothing expired → the stored conversationId is NOT wiped.
    expect(inst.conversationId.value).toBe('conv-kept');
  });
});

describe('SCEN-006 — expiry is local-only, server never called', () => {
  it('an expiring init performs zero network requests', () => {
    const c = cfg();
    seed(c, [turn('a1', 30 * DAY)], { conversationId: 'conv-old' });
    createChatConversation(c);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('SCEN-007 — dated by the NEWEST message', () => {
  it('an ongoing conversation with 20-day-old history and a 2-day-old reply survives', () => {
    const c = cfg();
    seed(c, [turn('u1', 25 * DAY, 'user'), turn('a1', 20 * DAY), turn('a2', 2 * DAY)]);
    expect(createChatConversation(c).messages.value).toHaveLength(3);
  });
});
