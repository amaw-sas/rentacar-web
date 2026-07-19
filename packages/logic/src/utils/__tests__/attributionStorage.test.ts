import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  persistAttribution,
  readStoredAttribution,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
} from '@rentacar-main/logic/utils';

// Minimal in-memory localStorage stub (node vitest env has no DOM storage).
function createStorageMock(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage;
}

const DAY = 24 * 60 * 60 * 1000;

describe('attributionStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists and reads back the attribution object (roundtrip)', () => {
    persistAttribution({ gclid: 'ABC' }, 1_000);
    expect(readStoredAttribution(1_000)).toEqual({ gclid: 'ABC' });
  });

  it('roundtrips the complete v2 attribution contract unchanged', () => {
    const fixture = {
      attribution_version: 2 as const,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'cars',
      utm_term: 'rental',
      utm_content: 'creative-a',
      gclid: 'g',
      gad_source: '1',
      gbraid: 'gb',
      wbraid: 'wb',
      dclid: 'dc',
      fbclid: 'fb',
      ttclid: 'tt',
      twclid: 'tw',
      msclkid: 'ms',
      referrer: 'https://google.com/',
      landing_url: '/bogota',
      captured_at: '2026-07-18T17:00:00.000Z',
      brand: 'alquilatucarro',
    };
    persistAttribution(fixture, 1_000);
    expect(readStoredAttribution(1_000)).toEqual(fixture);
  });

  it('returns null when nothing is stored', () => {
    expect(readStoredAttribution(1_000)).toBeNull();
  });

  it('SCEN-W3: a signal stored on the landing survives a later read within 30 days', () => {
    persistAttribution({ fbclid: 'fb1' }, 0);
    // user reserves 29 days later, several pages deep, with no param in the URL
    expect(readStoredAttribution(29 * DAY)).toEqual({ fbclid: 'fb1' });
  });

  it('expires entries older than 30 days and clears them', () => {
    persistAttribution({ gclid: 'old' }, 0);
    expect(readStoredAttribution(31 * DAY)).toBeNull();
    // expired entry was removed, so a fresh read at t0 is also null
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it('keeps an entry at exactly 30 days and expires it just after the boundary', () => {
    persistAttribution({ gbraid: 'boundary' }, 0);
    expect(readStoredAttribution(ATTRIBUTION_TTL_MS)).toEqual({ gbraid: 'boundary' });
    expect(readStoredAttribution(ATTRIBUTION_TTL_MS + 1)).toBeNull();
  });

  it('rejects and removes future or corrupt timestamps', () => {
    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ data: { gclid: 'future' }, ts: 1_001 }),
    );
    expect(readStoredAttribution(1_000)).toBeNull();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();

    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ data: { gclid: 'bad' }, ts: 'yesterday' }),
    );
    expect(readStoredAttribution(1_000)).toBeNull();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();

    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ data: { gclid: 'negative' }, ts: -1 }),
    );
    expect(readStoredAttribution(1_000)).toBeNull();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it('SCEN-W4: last-touch — a newer persisted touch overwrites the previous one', () => {
    persistAttribution({ gclid: 'first' }, 0);
    persistAttribution({ fbclid: 'second' }, 10 * DAY);
    expect(readStoredAttribution(10 * DAY)).toEqual({ fbclid: 'second' });
  });

  it('returns null on corrupt stored JSON', () => {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, '{not valid json');
    expect(readStoredAttribution(1_000)).toBeNull();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it('degrades to no-op / null when localStorage is unavailable', () => {
    vi.unstubAllGlobals(); // remove the stub → typeof localStorage === 'undefined'
    expect(() => persistAttribution({ gclid: 'x' }, 0)).not.toThrow();
    expect(readStoredAttribution(0)).toBeNull();
  });
});
