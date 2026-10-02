import { describe, it, expect, vi } from 'vitest';
import {
  recordVisit,
  readVisitorTrail,
  buildChatContext,
  VISIT_ENTRY_KEY,
  VISIT_TRAIL_KEY,
  type TrailStorage,
} from '../visitorTrail';

// Session trail the chat forwards so an advisor sees where the visitor came in and
// what they browsed (SCEN-002, SCEN-009, SCEN-015). Storage is injected so the
// logic is testable without a DOM; every access must degrade, never throw.

function memoryStorage(): TrailStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

const throwingStorage: TrailStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('SecurityError');
  },
};

describe('visitorTrail', () => {
  it('keeps the first path as entry and never overwrites it', () => {
    const s = memoryStorage();
    recordVisit('/medellin', s);
    recordVisit('/tarifas', s);
    expect(s.data.get(VISIT_ENTRY_KEY)).toBe('/medellin');
    expect(readVisitorTrail(s)).toEqual({ entry: '/medellin', trail: ['/medellin', '/tarifas'] });
  });

  it('stores pathname only (query and hash stripped)', () => {
    const s = memoryStorage();
    recordVisit('/bogota?utm_source=google&gclid=x#top', s);
    expect(readVisitorTrail(s)).toEqual({ entry: '/bogota', trail: ['/bogota'] });
  });

  it('redacts reservation codes: /reservado/<anything> is stored as /reservado', () => {
    const s = memoryStorage();
    recordVisit('/reservado/ABC123?x=1', s);
    recordVisit('/reservado/ABC123/', s);
    expect(readVisitorTrail(s)).toEqual({ entry: '/reservado', trail: ['/reservado'] });
    expect(buildChatContext(s, '/reservado/ABC123').page).toBe('/reservado');
    expect(JSON.stringify([...s.data.values()])).not.toContain('ABC123');
  });

  it('does not redact paths that merely start with the word reservado', () => {
    const s = memoryStorage();
    recordVisit('/reservadora', s);
    expect(readVisitorTrail(s).trail).toEqual(['/reservadora']);
  });

  it('dedupes a trailing slash against the bare path, keeps root as /', () => {
    const s = memoryStorage();
    ['/tarifas/', '/tarifas', '/'].forEach((p) => recordVisit(p, s));
    expect(readVisitorTrail(s).trail).toEqual(['/tarifas', '/']);
  });

  it('skips consecutive duplicates but keeps non-consecutive repeats', () => {
    const s = memoryStorage();
    ['/a', '/a', '/b', '/a'].forEach((p) => recordVisit(p, s));
    expect(readVisitorTrail(s).trail).toEqual(['/a', '/b', '/a']);
  });

  it('caps the trail at the last 10 paths', () => {
    const s = memoryStorage();
    for (let i = 0; i < 15; i++) recordVisit(`/p${i}`, s);
    const { entry, trail } = readVisitorTrail(s);
    expect(trail).toHaveLength(10);
    expect(trail[0]).toBe('/p5');
    expect(trail[9]).toBe('/p14');
    expect(entry).toBe('/p0');
  });

  it('ignores empty or non-string paths', () => {
    const s = memoryStorage();
    recordVisit('', s);
    recordVisit(undefined as never, s);
    expect(readVisitorTrail(s)).toEqual({ entry: null, trail: [] });
  });

  it('throwing storage: no exception, empty result', () => {
    expect(() => recordVisit('/x', throwingStorage)).not.toThrow();
    expect(readVisitorTrail(throwingStorage)).toEqual({ entry: null, trail: [] });
  });

  it('null storage (SSR) behaves as empty', () => {
    expect(() => recordVisit('/x', null)).not.toThrow();
    expect(readVisitorTrail(null)).toEqual({ entry: null, trail: [] });
  });

  it('corrupt or wrongly-shaped JSON reads as empty', () => {
    const s = memoryStorage();
    s.data.set(VISIT_TRAIL_KEY, '{not json');
    expect(readVisitorTrail(s).trail).toEqual([]);
    s.data.set(VISIT_TRAIL_KEY, '{"a":1}');
    expect(readVisitorTrail(s).trail).toEqual([]);
    s.data.set(VISIT_TRAIL_KEY, '[1,null,"/ok"]');
    expect(readVisitorTrail(s).trail).toEqual(['/ok']);
  });

  it('recording over a corrupt trail recovers instead of throwing', () => {
    const s = memoryStorage();
    s.data.set(VISIT_TRAIL_KEY, '{not json');
    recordVisit('/ok', s);
    expect(readVisitorTrail(s).trail).toEqual(['/ok']);
  });

  it('buildChatContext returns page, entry and trail', () => {
    const s = memoryStorage();
    recordVisit('/medellin', s);
    recordVisit('/tarifas', s);
    expect(buildChatContext(s, '/tarifas')).toEqual({
      page: '/tarifas',
      entry: '/medellin',
      trail: ['/medellin', '/tarifas'],
    });
  });

  it('buildChatContext with throwing storage never throws and keeps page', () => {
    expect(buildChatContext(throwingStorage, '/tarifas')).toEqual({
      page: '/tarifas',
      entry: null,
      trail: [],
    });
  });

  it('buildChatContext survives the sessionStorage global getter itself throwing', () => {
    vi.stubGlobal('window', { location: { pathname: '/x' } });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get(): never {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(() => buildChatContext()).not.toThrow();
      expect(buildChatContext()).toEqual({ page: '/x', entry: null, trail: [] });
    } finally {
      delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
      vi.unstubAllGlobals();
    }
  });

  it('buildChatContext falls back to the empty context when everything fails', () => {
    // No storage argument and no browser globals (node) → still safe.
    expect(buildChatContext()).toEqual({ page: '', entry: null, trail: [] });
  });
});

// On mobile the chat FAB navigates to the full-screen /chat page, so the current
// pathname at send time is always /chat. The advisor needs the page the visitor was
// on BEFORE opening the chat (SCEN-002), and /chat itself is not a browsed page.
describe('the /chat page is not a visited page', () => {
  it('is never recorded in the trail nor as entry', () => {
    const s = memoryStorage();
    recordVisit('/chat', s);
    recordVisit('/bogota', s);
    recordVisit('/chat', s);
    recordVisit('/medellin', s);
    recordVisit('/chat/', s);
    expect(readVisitorTrail(s)).toEqual({ entry: '/bogota', trail: ['/bogota', '/medellin'] });
  });

  it('reports the last browsed page when the message is sent from /chat', () => {
    const s = memoryStorage();
    recordVisit('/bogota', s);
    recordVisit('/chat', s);
    recordVisit('/medellin', s);
    recordVisit('/chat', s);
    expect(buildChatContext(s, '/chat').page).toBe('/medellin');
  });

  it('sends no page when the visitor opened /chat directly', () => {
    expect(buildChatContext(memoryStorage(), '/chat')).toEqual({ page: '', entry: null, trail: [] });
  });

  it('keeps the current page when the chat is a panel (desktop)', () => {
    const s = memoryStorage();
    recordVisit('/bogota', s);
    expect(buildChatContext(s, '/bogota').page).toBe('/bogota');
  });
});

describe('reservation code redaction is case-insensitive', () => {
  it('redacts /RESERVADO/<code> too (Vue Router matches paths case-insensitively)', () => {
    const s = memoryStorage();
    recordVisit('/RESERVADO/ABC123', s);
    expect(readVisitorTrail(s).trail).toEqual(['/reservado']);
  });
});

describe('/chat detection is case-insensitive', () => {
  it('never records /Chat and reports the previous page from it', () => {
    const s = memoryStorage();
    recordVisit('/bogota', s);
    recordVisit('/Chat', s);
    expect(readVisitorTrail(s).trail).toEqual(['/bogota']);
    expect(buildChatContext(s, '/CHAT').page).toBe('/bogota');
  });
});
