import { describe, it, expect } from 'vitest';
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

  it('buildChatContext falls back to the empty context when everything fails', () => {
    // No storage argument and no browser globals (node) → still safe.
    expect(buildChatContext()).toEqual({ page: '', entry: null, trail: [] });
  });
});
