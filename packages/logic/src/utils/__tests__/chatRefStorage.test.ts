import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeChatRef,
  persistChatRef,
  readStoredChatRef,
  CHAT_REF_STORAGE_KEY,
  CHAT_REF_TTL_MS,
} from '@rentacar-main/logic/utils';

// Holdout: docs/specs/chat-ref-reserva/scenarios/chat-ref-reserva.scenarios.md
// SCEN-006 (blank = absent), SCEN-007 (no format validation), SCEN-008 (blocked
// storage never throws), SCEN-009 (30-day TTL). Same harness as attributionStorage.

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
const UUID = '4f2a91ce-1234-4abc-9def-0123456789ab';

describe('normalizeChatRef — what the URL carries', () => {
  it('returns the trimmed value of a plain string', () => {
    expect(normalizeChatRef(`  ${UUID} `)).toBe(UUID);
  });

  it('SCEN-007: does not validate the format — any non-empty text passes through', () => {
    expect(normalizeChatRef('lo-que-sea-123')).toBe('lo-que-sea-123');
  });

  it('SCEN-006: empty or whitespace-only counts as absent', () => {
    expect(normalizeChatRef('')).toBeNull();
    expect(normalizeChatRef('   ')).toBeNull();
  });

  it('absent / non-string query values are null', () => {
    expect(normalizeChatRef(null)).toBeNull();
    expect(normalizeChatRef(undefined)).toBeNull();
    expect(normalizeChatRef(42)).toBeNull();
    expect(normalizeChatRef({})).toBeNull();
  });

  it('a duplicated query key (vue-router gives string[]) takes the first non-empty value', () => {
    expect(normalizeChatRef(['', UUID, 'other'])).toBe(UUID);
    expect(normalizeChatRef([])).toBeNull();
  });
});

describe('chatRefStorage — localStorage persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('roundtrips the stored value', () => {
    persistChatRef(UUID, 1_000);
    expect(readStoredChatRef(1_000)).toBe(UUID);
  });

  it('uses its own key, never the attribution one', () => {
    persistChatRef(UUID, 1_000);
    expect(CHAT_REF_STORAGE_KEY).toBe('rentacar_chat_ref');
    expect(localStorage.getItem(CHAT_REF_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem('rentacar_attribution')).toBeNull();
  });

  it('last write wins (SCEN-004)', () => {
    persistChatRef('aaaa-1111', 1_000);
    persistChatRef('bbbb-2222', 2_000);
    expect(readStoredChatRef(2_000)).toBe('bbbb-2222');
  });

  it('SCEN-009: still readable at 30 days, gone at 31 — and the key is removed', () => {
    persistChatRef(UUID, 0);
    expect(CHAT_REF_TTL_MS).toBe(30 * DAY);
    expect(readStoredChatRef(30 * DAY)).toBe(UUID);
    expect(readStoredChatRef(31 * DAY)).toBeNull();
    expect(localStorage.getItem(CHAT_REF_STORAGE_KEY)).toBeNull();
  });

  it('drops corrupt or malformed payloads instead of throwing', () => {
    localStorage.setItem(CHAT_REF_STORAGE_KEY, '{not json');
    expect(readStoredChatRef()).toBeNull();
    expect(localStorage.getItem(CHAT_REF_STORAGE_KEY)).toBeNull();

    localStorage.setItem(CHAT_REF_STORAGE_KEY, JSON.stringify({ value: 7, ts: 1 }));
    expect(readStoredChatRef(2)).toBeNull();

    localStorage.setItem(CHAT_REF_STORAGE_KEY, JSON.stringify({ value: UUID, ts: 'x' }));
    expect(readStoredChatRef(2)).toBeNull();

    // a timestamp from the future is not trusted either
    localStorage.setItem(CHAT_REF_STORAGE_KEY, JSON.stringify({ value: UUID, ts: 5_000 }));
    expect(readStoredChatRef(1_000)).toBeNull();
  });

  it('returns null when nothing was stored', () => {
    expect(readStoredChatRef()).toBeNull();
  });
});

describe('chatRefStorage — SCEN-008: storage unavailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a no-op when localStorage is undefined (SSR)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => persistChatRef(UUID)).not.toThrow();
    expect(readStoredChatRef()).toBeNull();
  });

  it('is a no-op when the property access itself throws (strict privacy)', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(() => persistChatRef(UUID)).not.toThrow();
      expect(readStoredChatRef()).toBeNull();
    } finally {
      delete (globalThis as Record<string, unknown>).localStorage;
    }
  });

  it('swallows a write that throws (Safari private mode quota)', () => {
    const store = createStorageMock();
    store.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    vi.stubGlobal('localStorage', store);
    expect(() => persistChatRef(UUID)).not.toThrow();
  });
});
