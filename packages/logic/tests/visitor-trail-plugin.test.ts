import { afterEach, describe, expect, it, vi } from 'vitest';

// The shared plugin records the visitor's pages for the chat context. It must run
// on the initial load and on every SPA navigation, make no network call, and never
// throw — a broken tracker can't be allowed to break the site (SCEN-009).

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

type Hook = (to: { path: string }, from: unknown, failure?: unknown) => void;

async function loadPlugin(storage = memoryStorage(), initial = '/medellin') {
  let navHook: Hook | undefined;
  vi.stubGlobal('window', { location: { pathname: initial } });
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
  vi.stubGlobal('useRouter', () => ({
    afterEach: (cb: Hook) => {
      navHook = cb;
    },
  }));
  const { default: plugin } = await import('../plugins/visitor-trail.client');
  (plugin as () => void)();
  return { storage, navHook: navHook! };
}

const trailOf = (s: ReturnType<typeof memoryStorage>) =>
  JSON.parse(s.data.get('rentacar_visit_trail') ?? '[]');

describe('visitor-trail.client plugin', () => {
  it('records the initial path once (Nuxt replays it through afterEach), then each navigation, with no network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { storage, navHook } = await loadPlugin();

    navHook({ path: '/medellin' }, {}); // initial navigation replay
    navHook({ path: '/tarifas' }, {});

    expect(trailOf(storage)).toEqual(['/medellin', '/tarifas']);
    expect(storage.data.get('rentacar_visit_entry')).toBe('/medellin');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not record aborted or duplicated navigations (failure set)', async () => {
    const { storage, navHook } = await loadPlugin();
    navHook({ path: '/blocked' }, {}, new Error('NavigationAborted'));
    expect(trailOf(storage)).toEqual(['/medellin']);
  });

  it('never throws when the router and storage both fail', async () => {
    vi.stubGlobal('window', {
      location: { pathname: '/x' },
      get sessionStorage(): never {
        throw new Error('SecurityError');
      },
    });
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
    vi.stubGlobal('useRouter', () => {
      throw new Error('no router');
    });

    const { default: plugin } = await import('../plugins/visitor-trail.client');
    expect(() => (plugin as () => void)()).not.toThrow();
  });
});
