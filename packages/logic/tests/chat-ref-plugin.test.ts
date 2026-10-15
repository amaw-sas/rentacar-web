import { afterEach, describe, expect, it, vi } from 'vitest';

// Holdout: docs/specs/chat-ref-reserva/scenarios/chat-ref-reserva.scenarios.md
// SCEN-001/004/012 — the shared layer plugin hands the `chat` query value to the
// store on the initial load and on every SPA navigation, for the three brands at
// once. SCEN-008 — it never throws, whatever breaks around it.

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

type Hook = (
  to: { query: Record<string, unknown> },
  from: unknown,
  failure?: unknown,
) => void;

async function loadPlugin(search = '') {
  let navHook: Hook | undefined;
  const captureChatRef = vi.fn();
  vi.stubGlobal('window', { location: { pathname: '/bogota', search } });
  vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
  vi.stubGlobal('useStoreReservationForm', () => ({ captureChatRef }));
  vi.stubGlobal('useRouter', () => ({
    afterEach: (cb: Hook) => {
      navHook = cb;
    },
  }));
  const { default: plugin } = await import('../plugins/chat-ref.client');
  (plugin as () => void)();
  return { captureChatRef, navHook: navHook! };
}

const UUID = '4f2a91ce-1234-4abc-9def-0123456789ab';

describe('chat-ref.client plugin', () => {
  it('SCEN-001: hands the landing URL `chat` to the store on load', async () => {
    const { captureChatRef } = await loadPlugin(`?utm_source=bot&chat=${UUID}`);
    expect(captureChatRef).toHaveBeenCalledWith(UUID);
  });

  it('SCEN-005: a landing URL without `chat` still calls the store so it can seed from storage', async () => {
    const { captureChatRef } = await loadPlugin('?utm_source=bot');
    expect(captureChatRef).toHaveBeenCalledTimes(1);
    expect(captureChatRef).toHaveBeenCalledWith(null);
  });

  it('SCEN-004: a later SPA navigation with another `chat` reaches the store too', async () => {
    const { captureChatRef, navHook } = await loadPlugin(`?chat=aaaa-1111`);
    captureChatRef.mockClear();

    navHook({ query: { chat: 'bbbb-2222' } }, {});

    expect(captureChatRef).toHaveBeenCalledWith('bbbb-2222');
  });

  it('ignores aborted or duplicated navigations (failure set)', async () => {
    const { captureChatRef, navHook } = await loadPlugin();
    captureChatRef.mockClear();

    navHook({ query: { chat: 'cccc-3333' } }, {}, new Error('NavigationAborted'));

    expect(captureChatRef).not.toHaveBeenCalled();
  });

  it('makes no network call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { navHook } = await loadPlugin(`?chat=${UUID}`);
    navHook({ query: { chat: UUID } }, {});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('SCEN-008: never throws when the store or the router fail', async () => {
    vi.stubGlobal('window', { location: { pathname: '/x', search: `?chat=${UUID}` } });
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
    vi.stubGlobal('useStoreReservationForm', () => {
      throw new Error('pinia not ready');
    });
    vi.stubGlobal('useRouter', () => {
      throw new Error('no router');
    });

    const { default: plugin } = await import('../plugins/chat-ref.client');
    expect(() => (plugin as () => void)()).not.toThrow();
  });
});
