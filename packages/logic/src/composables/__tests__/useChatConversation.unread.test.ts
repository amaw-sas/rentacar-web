import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChatConversation,
  getOrCreateInstance,
  useChatConversation,
  type ChatConversationConfig,
} from '../useChatConversation';

// The unread state machine + no-data-loss singleton (chat-unread-badge.scenarios.md).
// Browser access in the factory is feature-detected, so we drive it with hand-rolled
// stubs (no jsdom on this machine) for localStorage / document / window.

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    _store: store,
  };
}

type Handlers = Record<string, Array<() => void>>;

function makeDocument(visibility: 'visible' | 'hidden' = 'visible') {
  const handlers: Handlers = {};
  return {
    visibilityState: visibility,
    addEventListener: (t: string, cb: () => void) => void (handlers[t] ||= []).push(cb),
    removeEventListener: (t: string, cb: () => void) => {
      handlers[t] = (handlers[t] || []).filter((f) => f !== cb);
    },
    fire: (t: string) => (handlers[t] || []).forEach((f) => f()),
  };
}

function makeWindow() {
  const handlers: Handlers = {};
  const events: string[] = [];
  return {
    addEventListener: (t: string, cb: () => void) => void (handlers[t] ||= []).push(cb),
    gtag: (_kind: string, name: string) => void events.push(name),
    fire: (t: string) => (handlers[t] || []).forEach((f) => f()),
    events,
  };
}

let store: ReturnType<typeof makeStorage>;
let doc: ReturnType<typeof makeDocument>;
let win: ReturnType<typeof makeWindow>;

function setupBrowser(visibility: 'visible' | 'hidden' = 'visible') {
  store = makeStorage();
  doc = makeDocument(visibility);
  win = makeWindow();
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
}

let brandSeq = 0;
function cfg(): ChatConversationConfig {
  const brand = `t${brandSeq++}`;
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };
}

// Push a completed turn (user + assistant with text) directly into messages,
// as the SSE stream would have produced it. createdAt is stamped like submit()
// does — persisted fixtures without it read as legacy → expired under the TTL.
function pushTurn(inst: ReturnType<typeof createChatConversation>, userText: string, assistantText: string) {
  const uid = `u-${inst.messages.value.length}`;
  inst.messages.value.push({ id: uid, role: 'user', text: userText, createdAt: Date.now() });
  const aid = `a-${inst.messages.value.length}`;
  inst.messages.value.push({ id: aid, role: 'assistant', text: assistantText, createdAt: Date.now() });
  return { uid, aid };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SCEN-002/003 — client singleton (same messages ref, no data-loss)', () => {
  beforeEach(() => setupBrowser('visible'));

  it('SCEN-002: same brand returns the SAME instance (same messages ref); different brand differs', () => {
    const c = cfg();
    const a = getOrCreateInstance(c.brand, () => createChatConversation(c));
    const b = getOrCreateInstance(c.brand, () => createChatConversation(c));
    expect(b).toBe(a);
    expect(b.messages).toBe(a.messages);

    const c2 = cfg();
    const other = getOrCreateInstance(c2.brand, () => createChatConversation(c2));
    expect(other).not.toBe(a);
  });

  it('SCEN-003: a reply that completed while closed survives a close/reopen + persist round-trip', () => {
    const c = cfg();
    const inst = createChatConversation(c);
    // Turn completes while the surface is closed (not mounted).
    pushTurn(inst, 'hola', 'respuesta completa');
    inst.onSurfaceUnmounted(); // "close" — must NOT abort / drop anything
    // Persist snapshot (pagehide hardening) then simulate a genuine reload.
    win.fire('pagehide');
    const reloaded = createChatConversation(c);
    const texts = reloaded.messages.value.map((m) => m.text);
    expect(texts).toContain('respuesta completa');
    // Next user message does not clobber the prior reply.
    reloaded.messages.value.push({ id: 'u-next', role: 'user', text: 'otra' });
    expect(reloaded.messages.value.map((m) => m.text)).toContain('respuesta completa');
  });
});

describe('SCEN-004/005 — reply while closed → badge + announcement; markRead clears', () => {
  beforeEach(() => setupBrowser('visible'));

  it('SCEN-004: completeAssistantTurn while NOT viewing → unread 1, announcement, analytics', () => {
    const inst = createChatConversation(cfg());
    // Surface never mounted → not viewing.
    pushTurn(inst, 'hola', 'aquí tienes la cotización');
    inst.completeAssistantTurn();
    expect(inst.unread.value).toBe(1);
    expect(inst.announce.value).toBe('1 mensaje nuevo en el chat');
    expect(win.events).toContain('chat_reply_while_closed');
    expect(win.events).toContain('chat_unread_badge_shown');
  });

  it('SCEN-005: markRead() clears unread; reading unread does not mutate it', () => {
    const inst = createChatConversation(cfg());
    pushTurn(inst, 'hola', 'respuesta');
    expect(inst.unread.value).toBe(1);
    // Reading again is pure.
    expect(inst.unread.value).toBe(1);
    inst.markRead();
    expect(inst.unread.value).toBe(0);
  });

  it('SCEN-005: emitReopenedFromBadge fires the analytics beacon', () => {
    const inst = createChatConversation(cfg());
    inst.emitReopenedFromBadge();
    expect(win.events).toContain('chat_reopened_from_badge');
  });

  it('unread reads 0 while viewing even with a fresh reply present; badges once closed', () => {
    const inst = createChatConversation(cfg());
    inst.onSurfaceMounted(); // viewing
    // A reply arrives mid-view (no markRead yet) — must not flash the badge.
    inst.messages.value.push({ id: 'u1', role: 'user', text: 'hola' });
    inst.messages.value.push({ id: 'a1', role: 'assistant', text: 'respuesta' });
    expect(inst.unread.value).toBe(0);
    inst.onSurfaceUnmounted(); // close → no longer viewing
    expect(inst.unread.value).toBe(1);
  });

  it('does NOT announce when the reply lands while viewing (mounted + visible)', () => {
    const inst = createChatConversation(cfg());
    inst.onSurfaceMounted(); // visible → viewing
    pushTurn(inst, 'hola', 'respuesta');
    inst.completeAssistantTurn();
    expect(inst.unread.value).toBe(0);
    expect(inst.announce.value).toBe('');
  });
});

describe('SCEN-006 — badge survives a page reload', () => {
  beforeEach(() => setupBrowser('visible'));

  it('restores unread from lastReadMessageId on a fresh instance, no announcement', () => {
    const c = cfg();
    const inst = createChatConversation(c);
    pushTurn(inst, 'hola', 'primera');
    inst.markRead(); // read up to the first assistant
    pushTurn(inst, 'sigo', 'segunda');
    pushTurn(inst, 'y', 'tercera');
    expect(inst.unread.value).toBe(2);
    win.fire('pagehide'); // persist snapshot + marker

    const reloaded = createChatConversation(c);
    expect(reloaded.unread.value).toBe(2);
    expect(reloaded.announce.value).toBe('');
  });

  it('migration: legacy transcript with no stored marker starts all-read (no spurious badge)', () => {
    const c = cfg();
    // Seed storage as a legacy user would have: messages but no lastRead marker.
    store.setItem(
      c.messagesKey,
      JSON.stringify([
        { id: 'u1', role: 'user', text: 'hola' },
        { id: 'a1', role: 'assistant', text: 'vieja respuesta' },
      ]),
    );
    const inst = createChatConversation(c);
    expect(inst.unread.value).toBe(0);
  });
});

describe('SCEN-007 — reply while tab hidden clears on return to the visible tab', () => {
  beforeEach(() => setupBrowser('hidden'));

  it('badge increments while hidden; visibilitychange→visible on a mounted surface clears it', () => {
    const inst = createChatConversation(cfg());
    inst.onSurfaceMounted(); // mounted but tab hidden → not viewing, no markRead
    expect(inst.isViewing.value).toBe(false);
    pushTurn(inst, 'hola', 'respuesta');
    inst.completeAssistantTurn();
    expect(inst.unread.value).toBe(1);

    // Tab comes to the foreground.
    doc.visibilityState = 'visible';
    doc.fire('visibilitychange');
    expect(inst.unread.value).toBe(0);
  });
});

describe('SCEN-008 — new-messages separator boundary', () => {
  beforeEach(() => setupBrowser('visible'));

  it('firstUnreadAssistantId points at the first assistant after lastReadMessageId, null when none', () => {
    const inst = createChatConversation(cfg());
    const { aid: firstA } = pushTurn(inst, 'hola', 'primera');
    inst.markRead(); // read through the first assistant
    const { aid: secondA } = pushTurn(inst, 'sigo', 'segunda');
    pushTurn(inst, 'y', 'tercera');
    expect(inst.firstUnreadAssistantId.value).toBe(secondA);
    expect(firstA).not.toBe(secondA);

    inst.markRead();
    expect(inst.firstUnreadAssistantId.value).toBeNull();
  });
});

describe('SCEN-009 — mobile: unmount keeps the stream alive, badge on completion', () => {
  beforeEach(() => setupBrowser('visible'));

  it('onSurfaceUnmounted flips surfaceMounted false without aborting; a later reply badges', () => {
    const inst = createChatConversation(cfg());
    inst.onSurfaceMounted();
    expect(inst.surfaceMounted.value).toBe(true);
    inst.onSurfaceUnmounted();
    expect(inst.surfaceMounted.value).toBe(false);
    // Reply lands after navigating away → not viewing → badge.
    pushTurn(inst, 'hola', 'respuesta tardía');
    inst.completeAssistantTurn();
    expect(inst.unread.value).toBe(1);
  });
});

describe('SCEN-010 — dangling user turn shows the retry affordance', () => {
  beforeEach(() => setupBrowser('visible'));

  it('restore with a trailing user message (status ready) → danglingUserTurn true', () => {
    const c = cfg();
    const inst = createChatConversation(c);
    inst.messages.value.push({ id: 'u-only', role: 'user', text: 'reserva un auto', createdAt: Date.now() });
    win.fire('pagehide');
    const reloaded = createChatConversation(c);
    expect(reloaded.messages.value.at(-1)?.role).toBe('user');
    expect(reloaded.danglingUserTurn.value).toBe(true);
  });

  it('a completed transcript (trailing assistant) is NOT dangling', () => {
    const inst = createChatConversation(cfg());
    pushTurn(inst, 'hola', 'respuesta');
    expect(inst.danglingUserTurn.value).toBe(false);
  });

  it('retryDangling drops the orphan user bubble and re-submits its text (no duplicate)', () => {
    const inst = createChatConversation(cfg());
    // Keep submit in-flight so it never reaches the network layer.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    inst.messages.value.push({ id: 'u-only', role: 'user', text: 'reserva un auto' });
    expect(inst.danglingUserTurn.value).toBe(true);
    inst.retryDangling();
    // submit re-pushed exactly one user turn + a streaming assistant placeholder.
    const roles = inst.messages.value.map((m) => m.role);
    expect(roles).toEqual(['user', 'assistant']);
    expect(inst.messages.value[0]!.text).toBe('reserva un auto');
    expect(inst.isStreaming.value).toBe(true);
  });
});

describe('SCEN-010 real path — hard close DURING submit() (review findings)', () => {
  beforeEach(() => setupBrowser('visible'));

  // Minimal SSE stream: emits the given frames, then hangs forever (mid-stream).
  function hangingSseFetch(frames: string[]) {
    const encoder = new TextEncoder();
    let sent = false;
    return vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: () => {
              if (!sent) {
                sent = true;
                return Promise.resolve({ done: false, value: encoder.encode(frames.join('')) });
              }
              return new Promise(() => {}); // never resolves — stream stuck
            },
          }),
        },
      }),
    );
  }

  it('pagehide mid-stream persists the PARTIAL reply, not an empty bubble', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    vi.stubGlobal(
      'fetch',
      hangingSseFetch([
        'data: {"type":"text-start"}\n',
        'data: {"type":"text-delta","delta":"Hola, estoy cotizando"}\n',
      ]),
    );
    inst.input.value = 'cotiza 3 días';
    void inst.submit();
    // Let submit() consume the first chunk.
    await vi.waitFor(() => expect(inst.status.value).toBe('streaming'));
    await new Promise((r) => setTimeout(r, 0));

    win.fire('pagehide'); // hard-close snapshot
    const persisted = JSON.parse(store.getItem(c.messagesKey)!) as Array<{ role: string; text: string }>;
    expect(persisted.at(-1)?.role).toBe('assistant');
    expect(persisted.at(-1)?.text).toBe('Hola, estoy cotizando');
  });

  it('no deltas before the hard close → reload shows the retry affordance and recovers', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    vi.stubGlobal('fetch', hangingSseFetch([])); // stream opens, nothing arrives
    inst.input.value = 'reserva un auto';
    void inst.submit();
    await vi.waitFor(() => expect(inst.status.value).toBe('streaming'));

    win.fire('pagehide'); // persists [user, assistant('')]
    // Reload: fresh instance restores the real persisted shape.
    const reloaded = createChatConversation(c);
    expect(reloaded.messages.value.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(reloaded.danglingUserTurn.value).toBe(true);

    // Retry drops the empty placeholder + orphan user and re-submits once.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    reloaded.retryDangling();
    expect(reloaded.messages.value.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(reloaded.messages.value[0]!.text).toBe('reserva un auto');
    expect(reloaded.isStreaming.value).toBe(true);
  });

  it('a trailing assistant WITH text (partial preserved) is NOT dangling', () => {
    const inst = createChatConversation(cfg());
    inst.messages.value.push({ id: 'u1', role: 'user', text: 'hola' });
    inst.messages.value.push({ id: 'a1', role: 'assistant', text: 'respuesta parcial' });
    expect(inst.danglingUserTurn.value).toBe(false);
  });
});

describe('review hardening — announce hygiene, marker fallback, mount counter', () => {
  beforeEach(() => setupBrowser('visible'));

  it('completeAssistantTurn with nothing new (n=0) neither announces nor beacons', () => {
    const inst = createChatConversation(cfg());
    pushTurn(inst, 'hola', 'respuesta');
    inst.markRead(); // marker already caught up (visible→hidden straddle)
    inst.completeAssistantTurn(); // not viewing, but unread === 0
    expect(inst.announce.value).toBe('');
    expect(win.events).not.toContain('chat_reply_while_closed');
    expect(win.events).not.toContain('chat_unread_badge_shown');
  });

  it('markRead clears a stale announcement', () => {
    const inst = createChatConversation(cfg());
    pushTurn(inst, 'hola', 'respuesta');
    inst.completeAssistantTurn();
    expect(inst.announce.value).toBe('1 mensaje nuevo en el chat');
    inst.markRead();
    expect(inst.announce.value).toBe('');
  });

  it('a stored marker id absent from the transcript fails toward all-read (no spurious 9+)', () => {
    const c = cfg();
    store.setItem(
      c.messagesKey,
      JSON.stringify([
        { id: 'u1', role: 'user', text: 'hola' },
        { id: 'a1', role: 'assistant', text: 'r1' },
        { id: 'a2', role: 'assistant', text: 'r2' },
      ]),
    );
    store.setItem(c.lastReadKey, 'id-de-otra-pestaña');
    const inst = createChatConversation(c);
    expect(inst.unread.value).toBe(0);
  });

  it('overlapping mount/unmount (route transition) keeps surfaceMounted true', () => {
    const inst = createChatConversation(cfg());
    inst.onSurfaceMounted(); // incoming surface mounts first…
    inst.onSurfaceMounted();
    inst.onSurfaceUnmounted(); // …then the outgoing one unmounts
    expect(inst.surfaceMounted.value).toBe(true);
    inst.onSurfaceUnmounted();
    expect(inst.surfaceMounted.value).toBe(false);
  });
});

describe('SCEN-001 — SSR guard: concurrent renders never share state', () => {
  // No browser globals here → true SSR. Only the Nuxt context is stubbed.
  beforeEach(() => {
    vi.stubGlobal('useAppConfig', () => ({ franchise: { shortname: 'ssrbrand' } }));
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarPublicApiBase: 'http://api' } }));
  });

  it('import.meta.client is falsy under vitest (documents the SSR assumption)', () => {
    expect(Boolean((import.meta as unknown as { client?: boolean }).client)).toBe(false);
  });

  it('two server-path calls return DISTINCT instances (no shared memo)', () => {
    const a = useChatConversation();
    const b = useChatConversation();
    expect(b).not.toBe(a);
    expect(b.messages).not.toBe(a.messages);
  });

  it('the client memo is written only behind the import.meta.client guard (source)', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(
      fileURLToPath(new URL('../useChatConversation.ts', import.meta.url)),
      'utf8',
    );
    // Server path returns fresh; only the client path reaches the memo helper.
    expect(src).toMatch(/if\s*\(!import\.meta\.client\)\s*return createChatConversation\(cfg\)/);
    expect(src).toMatch(/return getOrCreateInstance\(brand,/);
  });
});
