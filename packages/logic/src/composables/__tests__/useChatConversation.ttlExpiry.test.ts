import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_TTL_MS,
  createChatConversation,
  type ChatConversationConfig,
  type ChatMessage,
} from '../useChatConversation';

// 24 h local conversation TTL (chat-reply-ttl-clear.scenarios.md SCEN-R4, which
// supersedes the 15-day ages of chat-ttl-expiry.scenarios.md): on init, and when
// a live tab becomes visible again (SCEN-R5/R5b), a transcript whose NEWEST
// message is older than CHAT_TTL_MS is wiped locally (messages + conversationId +
// lastReadMessageId) — server record untouched. Same stubbed-browser harness as
// useChatConversation.unread.test.ts, with listeners captured so tests can fire
// visibilitychange / pageshow.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

type Handlers = Record<string, Array<() => void>>;

function makeTarget<T extends object>(extra: T) {
  const handlers: Handlers = {};
  return Object.assign(extra, {
    addEventListener: (t: string, cb: () => void) => void (handlers[t] ||= []).push(cb),
    removeEventListener: (t: string, cb: () => void) => {
      handlers[t] = (handlers[t] || []).filter((f) => f !== cb);
    },
    fire: (t: string) => (handlers[t] || []).forEach((f) => f()),
  });
}

let store: ReturnType<typeof makeStorage>;
let fetchSpy: ReturnType<typeof vi.fn>;
let doc: ReturnType<typeof makeTarget<{ visibilityState: 'visible' | 'hidden' }>>;
let win: ReturnType<typeof makeTarget<{ events: string[]; gtag: (kind: string, name: string) => void }>>;

beforeEach(() => {
  store = makeStorage();
  fetchSpy = vi.fn();
  doc = makeTarget({ visibilityState: 'visible' as 'visible' | 'hidden' });
  win = makeTarget({
    events: [] as string[],
    gtag: (_kind: string, name: string) => void win.events.push(name),
  });
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
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

describe('SCEN-R4 (was SCEN-001) — >24 h of inactivity → fresh chat, keys cleared', () => {
  it('wipes messages, conversationId and lastReadMessageId on init', () => {
    const c = cfg();
    seed(c, [turn('u1', 25 * HOUR, 'user'), turn('a1', 25 * HOUR)], {
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

  // El reloj se congela porque este test vive EXACTAMENTE sobre el borde. `turn` fija
  // `createdAt = Date.now() - CHAT_TTL_MS` y el codigo bajo prueba vuelve a leer `Date.now()`
  // despues; con la comparacion `>` estricta, UN SOLO milisegundo transcurrido entre ambas
  // lecturas convierte "justo en el borde" en "pasado el borde" y el caso que debe conservarse
  // se borra. En una maquina ociosa no pasa nunca; con las cuatro suites del monorepo
  // encadenadas, si. Era un fallo intermitente real, reproducible al insertar 2 ms de espera.
  it('boundary: exactly at the TTL edge is NOT expired; just past it is', () => {
    vi.useFakeTimers();
    try {
      // At exactly CHAT_TTL_MS the strict > keeps the conversation (24 h is
      // the allowance, not the cutoff-inclusive).
      const cKeep = cfg();
      seed(cKeep, [turn('a1', CHAT_TTL_MS)]);
      expect(createChatConversation(cKeep).messages.value).toHaveLength(1);

      const cWipe = cfg();
      seed(cWipe, [turn('a1', CHAT_TTL_MS + 60_000)]);
      expect(createChatConversation(cWipe).messages.value).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('SCEN-R4 (was SCEN-002) — 23 h old → everything intact', () => {
  it('restores transcript, unread badge and conversationId continuity', () => {
    const c = cfg();
    seed(c, [turn('u1', 23 * HOUR, 'user'), turn('a1', 23 * HOUR)], {
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
    seed(c, [turn('u1', 25 * HOUR, 'user'), turn('a1', 25 * HOUR)], { lastRead: 'u1' });
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
    seed(c, [{ id: 'u1', role: 'user', text: 'hola' }, turn('a1', 2 * HOUR)]);
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
  it('an ongoing conversation with 3-day-old history and a 2-hour-old reply survives', () => {
    const c = cfg();
    seed(c, [turn('u1', 3 * DAY, 'user'), turn('a1', 2 * DAY), turn('a2', 2 * HOUR)]);
    expect(createChatConversation(c).messages.value).toHaveLength(3);
  });
});

// --- SCEN-R5 / R5b: a tab left open expires when it comes back ----------------
// Fake timers pin Date.now(); vi.setSystemTime moves the clock WITHOUT running
// timers, so a hanging stream's watchdog never fires while the tab "sleeps".

const T0 = Date.UTC(2026, 8, 17, 12, 0, 0);

function hide() {
  doc.visibilityState = 'hidden';
  doc.fire('visibilitychange');
}

function show() {
  doc.visibilityState = 'visible';
  doc.fire('visibilitychange');
}

function sentBodies(): Array<{ conversationId?: string }> {
  return fetchSpy.mock.calls.map((call) => JSON.parse((call[1] as { body: string }).body));
}

// An open chat (singleton alive, surface mounted) holding a conversation that was
// fresh 1 h ago, with a typed draft and a pending reply quote.
function openLiveChat() {
  const c = cfg();
  seed(c, [turn('u1', HOUR, 'user'), turn('a1', HOUR)], {
    conversationId: 'conv-live',
    lastRead: 'a1',
  });
  const inst = createChatConversation(c);
  inst.onSurfaceMounted();
  inst.input.value = 'borrador sin enviar';
  inst.replyTo.value = { label: 'Gama C' } as never;
  return { c, inst };
}

function expectWiped(c: ChatConversationConfig, inst: ReturnType<typeof createChatConversation>) {
  expect(inst.messages.value).toEqual([]);
  expect(inst.conversationId.value).toBeNull();
  expect(inst.replyTo.value).toBeNull();
  expect(inst.unread.value).toBe(0);
  expect(store.getItem(c.messagesKey)).toBeNull();
  expect(store.getItem(c.conversationKey)).toBeNull();
  expect(store.getItem(c.lastReadKey)).toBeNull();
}

describe('SCEN-R5 — a live tab expires when it becomes visible again', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    fetchSpy.mockImplementation(() => new Promise(() => {}));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('visibilitychange → visible after 24 h wipes like SCEN-R4 and keeps the draft', () => {
    const { c, inst } = openLiveChat();
    hide();
    vi.setSystemTime(T0 + DAY); // newest message is now 25 h old
    show();
    expectWiped(c, inst);
    expect(inst.input.value).toBe('borrador sin enviar');
  });

  it('pageshow alone (bfcache restore) wipes too', () => {
    const { c, inst } = openLiveChat();
    vi.setSystemTime(T0 + DAY);
    win.fire('pageshow');
    expectWiped(c, inst);
    expect(inst.input.value).toBe('borrador sin enviar');
  });

  it('after the wipe the next message is a fresh chat: no conversationId, first-message analytics again', () => {
    const { inst } = openLiveChat();
    vi.setSystemTime(T0 + DAY);
    show();
    win.events.length = 0;
    void inst.submit(); // fetch is issued synchronously, then hangs
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sentBodies()[0]!.conversationId).toBeUndefined();
    expect(win.events).toContain('chat_message_sent');
  });

  it('is idempotent: pageshow + visibilitychange in either order, and a new chat started in between survives', () => {
    const { c, inst } = openLiveChat();
    vi.setSystemTime(T0 + DAY);
    win.fire('pageshow');
    show();
    expectWiped(c, inst);

    // A fresh conversation (completed turn stamped now) starts after the wipe.
    inst.messages.value.push(turn('n1', 0, 'user'), turn('n2', 0));
    show();
    win.fire('pageshow');
    expect(inst.messages.value.length).toBe(2);

    const other = openLiveChat();
    vi.setSystemTime(T0 + 2 * DAY + HOUR);
    show();
    win.fire('pageshow');
    expectWiped(other.c, other.inst);
  });

  it('a conversation younger than 24 h is untouched on visible / pageshow', () => {
    const { c, inst } = openLiveChat();
    hide();
    vi.setSystemTime(T0 + 22 * HOUR); // newest now 23 h old
    show();
    win.fire('pageshow');
    expect(inst.messages.value).toHaveLength(2);
    expect(inst.conversationId.value).toBe('conv-live');
    expect(inst.replyTo.value).not.toBeNull();
    expect(JSON.parse(store.getItem(c.messagesKey)!)).toHaveLength(2);
    expect(store.getItem(c.conversationKey)).toBe('conv-live');
  });

  it('a stream in progress is never wiped', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    inst.input.value = 'hola';
    void inst.submit(); // fetch hangs → reply in flight
    await Promise.resolve();
    expect(inst.isStreaming.value).toBe(true);
    vi.setSystemTime(T0 + 2 * DAY);
    show();
    win.fire('pageshow');
    expect(inst.isStreaming.value).toBe(true);
    expect(inst.messages.value).toHaveLength(2);
  });
});

describe('SCEN-R5b — a stale tab never deletes another tab\'s live conversation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('memory 25 h old + storage written 1 h ago by tab B → storage untouched', () => {
    const c = cfg();
    seed(c, [turn('u1', 0, 'user'), turn('a1', 0)], { conversationId: 'conv-A' });
    const tabA = createChatConversation(c);
    expect(tabA.messages.value).toHaveLength(2);

    vi.setSystemTime(T0 + 25 * HOUR);
    const tabB = [turn('bu1', HOUR, 'user'), turn('ba1', HOUR)];
    store.setItem(c.messagesKey, JSON.stringify(tabB));
    store.setItem(c.conversationKey, 'conv-B');
    store.setItem(c.lastReadKey, 'ba1');

    show();
    win.fire('pageshow');

    expect(JSON.parse(store.getItem(c.messagesKey)!)).toEqual(tabB);
    expect(store.getItem(c.conversationKey)).toBe('conv-B');
    expect(store.getItem(c.lastReadKey)).toBe('ba1');
  });
});
