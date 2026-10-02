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

describe('visitor-trail.client plugin', () => {
  it('records the initial path once, then each navigation, with no network', async () => {
    const storage = memoryStorage();
    const fetchSpy = vi.fn();
    let afterEach: ((to: { path: string }) => void) | undefined;

    vi.stubGlobal('window', { location: { pathname: '/medellin' }, sessionStorage: storage });
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin);
    vi.stubGlobal('useRouter', () => ({
      afterEach: (cb: (to: { path: string }) => void) => {
        afterEach = cb;
      },
    }));

    const { default: plugin } = await import('../plugins/visitor-trail.client');
    (plugin as () => void)();
    afterEach?.({ path: '/tarifas' });

    expect(JSON.parse(storage.data.get('rentacar_visit_trail') ?? '[]')).toEqual([
      '/medellin',
      '/tarifas',
    ]);
    expect(storage.data.get('rentacar_visit_entry')).toBe('/medellin');
    expect(fetchSpy).not.toHaveBeenCalled();
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
