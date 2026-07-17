import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_STREAM_IDLE_TIMEOUT_MS,
  createChatConversation,
  type ChatConversationConfig,
} from '../useChatConversation';

// SCEN-322-X04 (issue #322): the stream must never hang the conversation
// forever. A chunk-inactivity watchdog aborts the in-flight turn after
// CHAT_STREAM_IDLE_TIMEOUT_MS of silence and routes it into the EXISTING error
// branch (inline banner, input re-enabled). A user-initiated stop() stays
// quiet (status ready, no banner). CRITICAL INVARIANT preserved: the watchdog
// is chunk-inactivity only — nothing here aborts on surface unmount (the
// singleton keeps streaming in background, see onSurfaceUnmounted).
//
// Same stubbed-browser harness as useChatConversation.ttlExpiry.test.ts, plus
// fake timers and a controllable SSE reader whose pending read() rejects with
// AbortError when the request signal aborts — mirroring real fetch semantics.

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

type ReadResult = { done: boolean; value?: Uint8Array };

function abortError() {
  return Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
}

// Controllable streamed fetch: the test pushes SSE lines (or an end marker);
// aborting the signal rejects the pending read like the real reader would.
function makeStreamedFetch() {
  const encoder = new TextEncoder();
  const queue: ReadResult[] = [];
  let pending: { resolve: (r: ReadResult) => void; reject: (e: unknown) => void } | null = null;
  let signal: AbortSignal | null = null;

  const read = (): Promise<ReadResult> =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(abortError());
      const next = queue.shift();
      if (next) return resolve(next);
      pending = { resolve, reject };
    });

  const fetchImpl = vi.fn((_url: string, init: { signal?: AbortSignal }) => {
    signal = init.signal ?? null;
    signal?.addEventListener('abort', () => {
      pending?.reject(abortError());
      pending = null;
    });
    return Promise.resolve({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => ({ read }) },
    });
  });

  const deliver = (r: ReadResult) => {
    if (pending) {
      pending.resolve(r);
      pending = null;
    } else {
      queue.push(r);
    }
  };
  const push = (line: string) => deliver({ done: false, value: encoder.encode(line) });
  const end = () => deliver({ done: true });

  return { fetchImpl, push, end };
}

let stream: ReturnType<typeof makeStreamedFetch>;

beforeEach(() => {
  vi.useFakeTimers();
  stream = makeStreamedFetch();
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal('window', { addEventListener: () => {} });
  vi.stubGlobal('fetch', stream.fetchImpl);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

let brandSeq = 0;
function cfg(): ChatConversationConfig {
  const brand = `wd${brandSeq++}`;
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };
}

async function startTurn(inst: ReturnType<typeof createChatConversation>) {
  inst.input.value = 'hola';
  const turn = inst.submit();
  // Flush the fetch/headers microtasks so the read loop is armed.
  await vi.advanceTimersByTimeAsync(0);
  return turn;
}

describe('SCEN-322-X04 — chunk-inactivity watchdog', () => {
  it('aborts a silent stream after the idle window and lands in the error branch', async () => {
    const inst = createChatConversation(cfg());
    const turn = startTurn(inst);

    await vi.advanceTimersByTimeAsync(CHAT_STREAM_IDLE_TIMEOUT_MS + 1);
    await turn;

    expect(inst.status.value).toBe('error');
    expect(inst.error.value?.message).toContain('tardando demasiado');
    // Input is re-enabled: nothing is streaming anymore.
    expect(inst.isStreaming.value).toBe(false);
  });

  it('every received chunk re-arms the watchdog; silence after chunks still aborts', async () => {
    const inst = createChatConversation(cfg());
    const turn = startTurn(inst);

    // 1ms short of the window, then a chunk arrives → no abort.
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_IDLE_TIMEOUT_MS - 1);
    stream.push('data: {"type":"text-delta","delta":"hola"}\n');
    await vi.advanceTimersByTimeAsync(CHAT_STREAM_IDLE_TIMEOUT_MS - 1);
    expect(inst.isStreaming.value).toBe(true);

    // Now let the re-armed window expire with no further chunks.
    await vi.advanceTimersByTimeAsync(2);
    await turn;
    expect(inst.status.value).toBe('error');
    // Partial content that streamed before the tear is preserved on the bubble.
    expect(inst.messages.value.at(-1)?.text).toBe('hola');
  });

  it('a clean completion disarms the watchdog (no late error)', async () => {
    const inst = createChatConversation(cfg());
    const turn = startTurn(inst);

    stream.push('data: {"type":"text-delta","delta":"listo"}\n');
    stream.end();
    await vi.advanceTimersByTimeAsync(0);
    await turn;
    expect(inst.status.value).toBe('ready');

    await vi.advanceTimersByTimeAsync(CHAT_STREAM_IDLE_TIMEOUT_MS * 2);
    expect(inst.status.value).toBe('ready');
    expect(inst.error.value).toBeNull();
  });

  it('stop() is a quiet user abort: ready state, no error banner', async () => {
    const inst = createChatConversation(cfg());
    const turn = startTurn(inst);

    stream.push('data: {"type":"text-delta","delta":"parcial"}\n');
    await vi.advanceTimersByTimeAsync(0);
    inst.stop();
    await vi.advanceTimersByTimeAsync(0);
    await turn;

    expect(inst.status.value).toBe('ready');
    expect(inst.error.value).toBeNull();
    // What streamed before the stop stays on the bubble.
    expect(inst.messages.value.at(-1)?.text).toBe('parcial');
  });
});
