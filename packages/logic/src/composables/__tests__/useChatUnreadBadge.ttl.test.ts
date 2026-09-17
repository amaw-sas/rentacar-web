// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { publishChatUnread, useChatUnreadBadge } from '../useChatUnreadBadge';
import { createChatConversation } from '../useChatConversation';

// SCEN-R5c (chat-reply-ttl-clear.scenarios.md): the always-visible FAB badge reads
// the stored transcript itself (the engine is lazy). It must apply the same 24 h
// TTL as the engine, on load AND when an open tab becomes visible again, unless
// the live engine for the brand already published a count (engine wins).

const HOUR = 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 17, 12, 0, 0);

let brandSeq = 0;
let wrappers: VueWrapper[] = [];

function seedUnread(brand: string, ageMs: number | null) {
  const stamp = ageMs === null ? {} : { createdAt: Date.now() - ageMs };
  localStorage.setItem(
    `rentacar-chat:${brand}:messages`,
    JSON.stringify([
      { id: 'u1', role: 'user', text: 'hola', ...stamp },
      { id: 'a1', role: 'assistant', text: 'respuesta', ...stamp },
    ]),
  );
  // Marker behind the assistant reply → 1 unread if the transcript is live.
  localStorage.setItem(`rentacar-chat:${brand}:lastReadMessageId`, 'u1');
}

function mountBadge(brand: string) {
  let badge!: ReturnType<typeof useChatUnreadBadge>;
  const wrapper = mount(
    defineComponent({
      setup() {
        badge = useChatUnreadBadge(brand);
        return () => h('span');
      },
    }),
  );
  wrappers.push(wrapper);
  return badge;
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  localStorage.clear();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

afterEach(() => {
  wrappers.forEach((w) => w.unmount());
  wrappers = [];
  vi.useRealTimers();
});

describe('SCEN-R5c — page load with the chat closed', () => {
  it('unread reply 25 h old → no badge', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 25 * HOUR);
    expect(mountBadge(brand).unread.value).toBe(0);
  });

  it('unread reply 23 h old → badge shows as today', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 23 * HOUR);
    expect(mountBadge(brand).unread.value).toBe(1);
  });

  it('non-empty stored transcript with no createdAt → no badge', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, null);
    expect(mountBadge(brand).unread.value).toBe(0);
  });
});

describe('SCEN-R5c — a tab already open becomes visible again', () => {
  it('re-restores on visible and drops a badge that expired while hidden', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 23 * HOUR);
    const badge = mountBadge(brand);
    expect(badge.unread.value).toBe(1);

    setVisibility('hidden');
    vi.setSystemTime(T0 + 2 * HOUR); // reply is now 25 h old
    expect(badge.unread.value).toBe(1);
    setVisibility('visible');
    expect(badge.unread.value).toBe(0);
  });

  it('once the live engine published a count, visible does not re-read storage', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 23 * HOUR);
    const badge = mountBadge(brand);
    publishChatUnread({ brand, unread: 2, announce: '' });
    expect(badge.unread.value).toBe(2);

    vi.setSystemTime(T0 + 2 * HOUR);
    setVisibility('visible');
    expect(badge.unread.value).toBe(2);
  });

  it('an engine that exists but never published does not block the TTL re-restore', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 23 * HOUR);
    // Badge listener registered first, so it runs before the engine's own expiry
    // touches storage: the re-restore alone must apply the TTL.
    const badge = mountBadge(brand);
    createChatConversation({
      brand,
      api: 'http://api.test/api/chat',
      messagesKey: `rentacar-chat:${brand}:messages`,
      conversationKey: `rentacar-chat:${brand}:conversationId`,
      lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
    });
    expect(badge.unread.value).toBe(1);

    vi.setSystemTime(T0 + 2 * HOUR);
    setVisibility('visible');
    expect(badge.unread.value).toBe(0);
  });

  it('publishes from other brands do not disable the re-restore', () => {
    const brand = `badge${brandSeq++}`;
    seedUnread(brand, 23 * HOUR);
    const badge = mountBadge(brand);
    publishChatUnread({ brand: `${brand}-other`, unread: 3, announce: '' });

    vi.setSystemTime(T0 + 2 * HOUR);
    setVisibility('visible');
    expect(badge.unread.value).toBe(0);
  });
});
