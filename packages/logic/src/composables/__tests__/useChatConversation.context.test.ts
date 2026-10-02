import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatConversation } from '../useChatConversation';
import { recordVisit } from '../../utils/visitorTrail';

// SCEN-002: the chat POST body carries the visitor context (entry, trail, current
// page) so the advisor inbox shows where the conversation started.

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('sessionStorage', makeStorage());
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal('window', { addEventListener: () => {}, location: { pathname: '/tarifas' } });
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => null },
        body: { getReader: () => ({ read: () => Promise.resolve({ done: true }) }) },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useChatConversation — visitor context in the POST body', () => {
  it('sends context.trail, entry and page from the recorded visits', async () => {
    recordVisit('/bogota');
    recordVisit('/tarifas');

    const brand = 'ctx-test';
    const inst = createChatConversation({
      brand,
      api: 'http://api.test/api/chat',
      messagesKey: `rentacar-chat:${brand}:messages`,
      conversationKey: `rentacar-chat:${brand}:conversationId`,
      lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
    });
    inst.input.value = 'hola';
    await inst.submit();

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.context).toEqual({
      page: '/tarifas',
      entry: '/bogota',
      trail: ['/bogota', '/tarifas'],
    });
  });
});
