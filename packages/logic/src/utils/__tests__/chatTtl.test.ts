import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CHAT_TTL_MS, isChatTranscriptExpired } from '../chatTtl';
import { CHAT_TTL_MS as ENGINE_CHAT_TTL_MS } from '../../composables/useChatConversation';

// SCEN-R4 (chat-reply-ttl-clear.scenarios.md): the local chat transcript lives
// 24 h from its NEWEST message. One helper shared by the engine and the FAB badge.

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 17, 12, 0, 0);

describe('CHAT_TTL_MS', () => {
  it('is 24 hours, and the engine re-exports the same value', () => {
    expect(CHAT_TTL_MS).toBe(24 * HOUR);
    expect(ENGINE_CHAT_TTL_MS).toBe(CHAT_TTL_MS);
  });
});

describe('isChatTranscriptExpired', () => {
  it('an empty transcript is never expired', () => {
    expect(isChatTranscriptExpired([], NOW)).toBe(false);
  });

  it('a non-empty transcript with no createdAt is expired', () => {
    expect(isChatTranscriptExpired([{}, { createdAt: undefined }], NOW)).toBe(true);
  });

  it('newest 25 h ago → expired; newest 23 h ago → kept', () => {
    expect(isChatTranscriptExpired([{ createdAt: NOW - 25 * HOUR }], NOW)).toBe(true);
    expect(isChatTranscriptExpired([{ createdAt: NOW - 23 * HOUR }], NOW)).toBe(false);
  });

  it('is dated by the NEWEST message, ignoring undatable ones', () => {
    expect(
      isChatTranscriptExpired([{ createdAt: NOW - 30 * HOUR }, {}, { createdAt: NOW - 1 * HOUR }], NOW),
    ).toBe(false);
  });

  it('boundary: exactly CHAT_TTL_MS old is kept; one ms past it expires', () => {
    expect(isChatTranscriptExpired([{ createdAt: NOW - CHAT_TTL_MS }], NOW)).toBe(false);
    expect(isChatTranscriptExpired([{ createdAt: NOW - CHAT_TTL_MS - 1 }], NOW)).toBe(true);
  });
});

// The FAB chunk must not pull the chat engine: chatTtl is a leaf, and the two
// always-loaded composables reach the TTL without importing useChatConversation.
describe('import graph guard', () => {
  const src = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
  const importLines = (code: string) =>
    code.split('\n').filter((line) => /^\s*(import|export)\b.*\bfrom\s+['"]/.test(line) || /^\s*import\s+['"]/.test(line));

  it('chatTtl.ts has no imports', () => {
    expect(importLines(src('../chatTtl.ts'))).toEqual([]);
  });

  it.each(['useContactTeaser.ts', 'useChatUnreadBadge.ts'])(
    '%s does not import useChatConversation',
    (file) => {
      const lines = importLines(src(`../../composables/${file}`));
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.filter((line) => line.includes('useChatConversation'))).toEqual([]);
    },
  );
});
