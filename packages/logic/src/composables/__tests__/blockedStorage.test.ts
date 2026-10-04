import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createContactTeaser,
  TEASER_FIRST_DELAY_MS,
  type ContactTeaserConfig,
} from '../useContactTeaser';
import {
  createChatConversation,
  type ChatConversationConfig,
} from '../useChatConversation';
import { getLocalStorageSafe, getSessionStorageSafe } from '../../utils/safeWebStorage';

// Strict-privacy browsers (chat-storage-bloqueado.scenarios.md SCEN-PRIV-05):
// the PROPERTY ACCESS `window.sessionStorage` / `window.localStorage` throws a
// SecurityError — `typeof` evaluates the getter, so `typeof sessionStorage`
// throws too and a method-level try/catch never runs. The factories must treat
// a throwing accessor exactly like "no storage": chat works, nothing persists.

// Original descriptors are saved and restored (not just deleted): a Node that
// ships a real global localStorage must get it back for the other test files
// in this worker.
const savedDescriptors = new Map<string, PropertyDescriptor | undefined>();

function installThrowingAccessor(name: 'sessionStorage' | 'localStorage') {
  if (!savedDescriptors.has(name)) {
    savedDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  }
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get() {
      throw new DOMException('blocked', 'SecurityError');
    },
  });
}

function removeAccessor(name: 'sessionStorage' | 'localStorage') {
  delete (globalThis as Record<string, unknown>)[name];
  const original = savedDescriptors.get(name);
  if (original) Object.defineProperty(globalThis, name, original);
  savedDescriptors.delete(name);
}

function makeWindow() {
  const events: Array<{ name: string }> = [];
  return {
    gtag: (_kind: string, name: string) => void events.push({ name }),
    events,
  };
}

let brandSeq = 0;
function teaserCfg(): ContactTeaserConfig {
  const brand = `bs${brandSeq++}`;
  return {
    brand,
    shownKey: `rentacar-teaser:${brand}:shown`,
    engagedKey: `rentacar-teaser:${brand}:engagedAt`,
  };
}

function conversationCfg(): ChatConversationConfig {
  const brand = `bs${brandSeq++}`;
  return {
    brand,
    api: '/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };
}

afterEach(() => {
  removeAccessor('sessionStorage');
  removeAccessor('localStorage');
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('safeWebStorage — throwing accessor degrades to null', () => {
  it('returns null when the accessor throws, the Storage when it works', () => {
    installThrowingAccessor('sessionStorage');
    installThrowingAccessor('localStorage');
    expect(getSessionStorageSafe()).toBeNull();
    expect(getLocalStorageSafe()).toBeNull();

    removeAccessor('sessionStorage');
    removeAccessor('localStorage');
    const fake = { getItem: () => null } as unknown as Storage;
    vi.stubGlobal('sessionStorage', fake);
    vi.stubGlobal('localStorage', fake);
    expect(getSessionStorageSafe()).toBe(fake);
    expect(getLocalStorageSafe()).toBe(fake);
  });

  it('returns null when the global is absent (SSR)', () => {
    expect(getSessionStorageSafe()).toBeNull();
    expect(getLocalStorageSafe()).toBeNull();
  });
});

describe('SCEN-PRIV-05 — createContactTeaser under throwing storage accessors', () => {
  beforeEach(() => {
    installThrowingAccessor('sessionStorage');
    installThrowingAccessor('localStorage');
    vi.stubGlobal('window', makeWindow());
    vi.useFakeTimers();
  });

  it('does not throw, and the teaser still reaches step 1 ("nothing stored")', () => {
    const inst = createContactTeaser(teaserCfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(1);
    expect(inst.teaserVisible.value).toBe(true);
    expect(inst.syntheticCount.value).toBe(1);
  });

  it('engage/dismiss stay non-throwing (writes degrade to no-ops)', () => {
    const inst = createContactTeaser(teaserCfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(() => inst.engage('chat')).not.toThrow();
    expect(inst.teaserVisible.value).toBe(false);
  });
});

describe('SCEN-PRIV-05 — createChatConversation under a throwing localStorage accessor', () => {
  beforeEach(() => {
    installThrowingAccessor('localStorage');
  });

  it('does not throw and starts with an empty in-memory conversation', () => {
    const chat = createChatConversation(conversationCfg());
    expect(chat.messages.value).toEqual([]);
    expect(chat.conversationId.value).toBeNull();
  });

  it('records the customer message in memory for the session (both storages blocked)', async () => {
    installThrowingAccessor('sessionStorage'); // generate_lead dedupe path runs too
    // The network layer is not under test: a rejecting fetch still exercises
    // the full submit() path (message append, analytics guards, error branch).
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const chat = createChatConversation(conversationCfg());
    chat.input.value = 'Hola';
    await chat.submit();
    const userMessages = chat.messages.value.filter((m) => m.role === 'user');
    expect(userMessages).toHaveLength(1);
    expect(userMessages[0]?.text).toBe('Hola');
  });
});
